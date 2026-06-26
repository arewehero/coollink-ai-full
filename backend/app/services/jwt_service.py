from __future__ import annotations

import base64
import datetime as dt
import hashlib
import hmac
import json
from typing import Any, Dict
from uuid import UUID

from app.core.config import settings


class JWTError(Exception):
    pass


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("ascii"))


def _json_b64(data: Dict[str, Any]) -> str:
    return _b64encode(json.dumps(data, separators=(",", ":"), sort_keys=True).encode("utf-8"))


def _sign(message: str, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), message.encode("ascii"), hashlib.sha256).digest()
    return _b64encode(digest)


def create_access_token(user_id: UUID) -> str:
    secret = settings.jwt_signing_secret
    if not secret:
        raise JWTError("JWT signing secret is not configured.")

    now = dt.datetime.now(dt.timezone.utc)
    expires_at = now + dt.timedelta(minutes=settings.jwt_access_token_expire_minutes)
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    signing_input = f"{_json_b64(header)}.{_json_b64(payload)}"
    return f"{signing_input}.{_sign(signing_input, secret)}"


def decode_access_token(token: str) -> Dict[str, Any]:
    secret = settings.jwt_signing_secret
    if not secret:
        raise JWTError("JWT signing secret is not configured.")

    try:
        header_segment, payload_segment, signature_segment = token.split(".")
    except ValueError as exc:
        raise JWTError("Invalid token format.") from exc

    signing_input = f"{header_segment}.{payload_segment}"
    expected_signature = _sign(signing_input, secret)
    if not hmac.compare_digest(expected_signature, signature_segment):
        raise JWTError("Invalid token signature.")

    try:
        header = json.loads(_b64decode(header_segment))
        payload = json.loads(_b64decode(payload_segment))
    except (json.JSONDecodeError, ValueError) as exc:
        raise JWTError("Invalid token payload.") from exc

    if header.get("alg") != "HS256":
        raise JWTError("Unsupported token algorithm.")

    expires_at = payload.get("exp")
    if not isinstance(expires_at, int):
        raise JWTError("Token expiration is missing.")
    if expires_at < int(dt.datetime.now(dt.timezone.utc).timestamp()):
        raise JWTError("Token has expired.")

    if not payload.get("sub"):
        raise JWTError("Token subject is missing.")
    return payload
