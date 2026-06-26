import json
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CoolLink AI API"
    app_env: str = "local"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/coollink_ai"
    frontend_url: str = "http://localhost:3100"
    cors_allowed_origins: str = "http://localhost:3100"
    ai_provider: str = "mock"
    ai_timeout_seconds: int = Field(default=8, ge=1)
    ai_log_payload: bool = False
    ai_prompt_version: str = "v0.3-mock"
    internal_job_token: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    jwt_secret: str = ""
    secret_key: str = ""
    jwt_access_token_expire_minutes: int = Field(default=60 * 24, ge=1)

    @property
    def jwt_signing_secret(self) -> str:
        return self.jwt_secret or self.secret_key

    @property
    def cors_origin_list(self) -> list[str]:
        origins: list[str] = []
        raw = self.cors_allowed_origins.strip()
        if raw:
            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        origins.extend(str(origin).strip() for origin in parsed if str(origin).strip())
                except json.JSONDecodeError:
                    origins.extend(origin.strip() for origin in raw.strip("[]").split(",") if origin.strip())
            else:
                origins.extend(origin.strip() for origin in raw.split(",") if origin.strip())

        frontend = self.frontend_url.rstrip("/")
        if frontend and frontend not in origins:
            origins.append(frontend)
        return origins

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
