"""Weather provider using Open-Meteo forecast API.

원래 명세(§3)는 OpenWeatherMap이나, 실행 환경에서 api.openweathermap.org:443 으로의
TCP 연결이 차단되어(connect 실패) Open-Meteo로 대체한다. Open-Meteo는 API 키가 필요 없고
좌표 기반 시간별 예보를 제공하므로, 좌표 조회·6개 시간블록 산출 로직과
weather_service가 사용하는 인터페이스(fetch_forecast / parse_forecast_to_time_blocks)를
그대로 유지한다. (망에서 OWM이 열리면 이 파일만 되돌리면 됨)

Requirements: 3.1, 3.7, 3.8
"""

from __future__ import annotations

import datetime as dt
import logging
from decimal import Decimal
from typing import Any, Dict, List

import httpx

from app.core.time import KST
from app.core.time_utils import TIME_RANGES, get_time_range

logger = logging.getLogger(__name__)

# Default coordinates: Seoul (Req 3.7)
DEFAULT_LATITUDE = Decimal("37.5665")
DEFAULT_LONGITUDE = Decimal("126.9780")

# httpx timeout — open-meteo connect가 이 망에서 1~10초로 불안정해 넉넉히 둠(캐시 1h로 첫 호출만 영향)
WEATHER_API_TIMEOUT = 25.0

# Open-Meteo hourly forecast endpoint (no API key required)
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
_HOURLY_FIELDS = "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation"


class WeatherProviderError(Exception):
    """Raised when the weather provider cannot fetch data."""

    pass


class WeatherProvider:
    """Fetches weather data from the Open-Meteo hourly forecast API."""

    def fetch_forecast(
        self,
        lat: float,
        lon: float,
    ) -> Dict[str, Any]:
        """Call Open-Meteo hourly forecast API and return the raw response.

        Args:
            lat: Latitude coordinate
            lon: Longitude coordinate

        Returns:
            Raw JSON response from Open-Meteo

        Raises:
            WeatherProviderError: If API call fails or times out (Req 3.8)
        """
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": _HOURLY_FIELDS,
            "timezone": "Asia/Seoul",
            "forecast_days": 2,
            "past_days": 1,
        }

        try:
            with httpx.Client(timeout=WEATHER_API_TIMEOUT) as client:
                response = client.get(OPEN_METEO_FORECAST_URL, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException as e:
            logger.warning(f"Weather API timeout for ({lat}, {lon}): {e}")
            raise WeatherProviderError(f"Weather API timeout: {e}") from e
        except httpx.HTTPStatusError as e:
            logger.warning(f"Weather API HTTP error for ({lat}, {lon}): {e.response.status_code}")
            raise WeatherProviderError(f"Weather API HTTP error: {e.response.status_code}") from e
        except httpx.HTTPError as e:
            logger.warning(f"Weather API error for ({lat}, {lon}): {e}")
            raise WeatherProviderError(f"Weather API error: {e}") from e

    def parse_forecast_to_time_blocks(
        self,
        raw_response: Dict[str, Any],
        target_date: dt.date,
    ) -> List[Dict[str, Any]]:
        """Parse Open-Meteo hourly response into 6 time-range blocks for a target date.

        Open-Meteo returns parallel arrays under "hourly" (time, temperature_2m, ...).
        Groups hourly points by TIME_RANGES and computes representative values per block:
        average temperature, feels_like, humidity, rain presence, and heat_alert
        (Req 3.5: temperature >= 35°C).

        Returns:
            List of 6 dicts, one per time range, with keys:
            time_range, start_time, end_time, temperature, feels_like,
            humidity, rain, heat_alert
        """
        hourly = raw_response.get("hourly", {}) or {}
        times: List[str] = hourly.get("time", []) or []
        temps: List[Any] = hourly.get("temperature_2m", []) or []
        hums: List[Any] = hourly.get("relative_humidity_2m", []) or []
        feels: List[Any] = hourly.get("apparent_temperature", []) or []
        precs: List[Any] = hourly.get("precipitation", []) or []

        def _at(arr: List[Any], idx: int, default: float = 0.0) -> float:
            if idx < len(arr) and arr[idx] is not None:
                return float(arr[idx])
            return default

        # Collect data points per time range
        range_data: Dict[str, List[Dict[str, Any]]] = {label: [] for label in TIME_RANGES}
        for i, t in enumerate(times):
            # Open-Meteo time is local (timezone=Asia/Seoul), e.g. "2026-06-27T14:00"
            try:
                dt_obj = dt.datetime.fromisoformat(t)
            except (ValueError, TypeError):
                continue

            if dt_obj.date() != target_date:
                continue

            time_range_label = get_time_range(dt_obj.hour)
            range_data[time_range_label].append({
                "temperature": _at(temps, i),
                "feels_like": _at(feels, i),
                "humidity": _at(hums, i, 0.0),
                "rain": _at(precs, i, 0.0) > 0.0,
            })

        # Build time blocks with averages (or defaults when no data)
        time_blocks: List[Dict[str, Any]] = []
        for label, (start_hour, end_hour) in TIME_RANGES.items():
            data_points = range_data[label]

            if data_points:
                avg_temp = round(
                    sum(d["temperature"] for d in data_points) / len(data_points), 1
                )
                avg_feels = round(
                    sum(d["feels_like"] for d in data_points) / len(data_points), 1
                )
                avg_humidity = round(
                    sum(d["humidity"] for d in data_points) / len(data_points)
                )
                has_rain = any(d["rain"] for d in data_points)
            else:
                # No data for this time block — use neutral defaults
                avg_temp = 0.0
                avg_feels = 0.0
                avg_humidity = 0
                has_rain = False

            # Req 3.5: heat_alert = true if temperature >= 35°C
            heat_alert = avg_temp >= 35.0

            # Clamp humidity to 0-100 range
            avg_humidity = max(0, min(100, int(avg_humidity)))

            # Build start/end times for the block
            start_time = dt.datetime(
                target_date.year, target_date.month, target_date.day,
                start_hour, 0, 0, tzinfo=KST
            )
            end_time = dt.datetime(
                target_date.year, target_date.month, target_date.day,
                end_hour, 59, 59, tzinfo=KST
            )

            time_blocks.append({
                "time_range": label,
                "start_time": start_time,
                "end_time": end_time,
                "temperature": Decimal(str(avg_temp)),
                "feels_like": Decimal(str(avg_feels)),
                "humidity": avg_humidity,
                "rain": has_rain,
                "heat_alert": heat_alert,
            })

        return time_blocks
