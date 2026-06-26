from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CoolLink AI API"
    app_env: str = "local"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/coollink_ai"
    ai_provider: str = "mock"
    ai_timeout_seconds: int = Field(default=8, ge=1)
    ai_log_payload: bool = False
    ai_prompt_version: str = "v0.3-mock"
    # Upstage Solar (LLM provider)
    upstage_api_key: str = ""
    upstage_base_url: str = "https://api.upstage.ai/v1"
    upstage_model: str = "solar-pro3"
    openweathermap_api_key: str = ""
    internal_job_token: str = ""
    cors_allowed_origins: str = "http://localhost:3000"
    # Auth: Google OAuth + JWT (codex 통합)
    secret_key: str = ""
    frontend_url: str = "http://localhost:3000"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    jwt_secret: str = ""
    jwt_access_token_expire_minutes: int = Field(default=60 * 24, ge=1)

    @property
    def jwt_signing_secret(self) -> str:
        return self.jwt_secret or self.secret_key

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
