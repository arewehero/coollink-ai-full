from __future__ import annotations

from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.schemas.auth import GoogleUserInfo


class GoogleOAuthError(Exception):
    pass


class GoogleOAuthClient:
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url = "https://oauth2.googleapis.com/token"
    userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"

    def build_login_url(self) -> str:
        if not settings.google_client_id or not settings.google_redirect_uri:
            raise GoogleOAuthError("Google OAuth is not configured.")

        query = urlencode(
            {
                "client_id": settings.google_client_id,
                "redirect_uri": settings.google_redirect_uri,
                "response_type": "code",
                "scope": "openid email profile",
                "access_type": "online",
                "prompt": "select_account",
            },
        )
        return f"{self.auth_url}?{query}"

    async def exchange_code_for_token(self, code: str) -> dict:
        if not settings.google_client_id or not settings.google_client_secret or not settings.google_redirect_uri:
            raise GoogleOAuthError("Google OAuth is not configured.")

        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            response = await client.post(
                self.token_url,
                data={
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": settings.google_redirect_uri,
                },
            )

        if response.status_code >= 400:
            # Google이 내려준 실제 에러 본문(invalid_grant / redirect_uri_mismatch 등)을 포함한다.
            raise GoogleOAuthError(
                f"token exchange failed (status={response.status_code}): {response.text}"
            )

        payload = response.json()
        if not payload.get("access_token"):
            raise GoogleOAuthError(
                f"token response missing access_token: {response.text}"
            )
        return payload

    async def get_user_info(self, access_token: str) -> GoogleUserInfo:
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            response = await client.get(
                self.userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )

        if response.status_code >= 400:
            raise GoogleOAuthError(
                f"userinfo fetch failed (status={response.status_code}): {response.text}"
            )

        user_info = GoogleUserInfo.model_validate(response.json())
        if not user_info.email:
            raise GoogleOAuthError("Google user info is missing email.")
        return user_info

    async def fetch_user_info(self, code: str) -> GoogleUserInfo:
        token_payload = await self.exchange_code_for_token(code)
        return await self.get_user_info(token_payload["access_token"])
