from __future__ import annotations

import uuid
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.session import get_db
from app.dependencies import get_google_oauth_client, get_profile_repository, get_user_repository
from app.main import app
from app.schemas.auth import GoogleUserInfo
from app.services.jwt_service import create_access_token, decode_access_token


class FakeDb:
    def __init__(self) -> None:
        self.commits = 0
        self.rollbacks = 0

    def commit(self) -> None:
        self.commits += 1

    def refresh(self, value) -> None:
        return None

    def rollback(self) -> None:
        self.rollbacks += 1


class FakeGoogleOAuthClient:
    async def fetch_user_info(self, code: str) -> GoogleUserInfo:
        assert code == "google-code"
        return GoogleUserInfo(
            sub="google-user-1",
            email="hyesung@gmail.com",
            name="혜성",
            picture="https://example.com/profile.png",
            email_verified=True,
        )


class FakeUserRepository:
    def __init__(self, user) -> None:
        self.user = user
        self.google_user_info = None

    def get_or_create_google_user(self, db: FakeDb, google_user: GoogleUserInfo):
        self.google_user_info = google_user
        return self.user

    def get_by_id(self, db: FakeDb, user_id: uuid.UUID):
        if self.user.id == user_id:
            return self.user
        return None

    def update_required_profile_fields(self, db: FakeDb, user, payload):
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        return user


class FakeProfileRepository:
    def __init__(self, profile=None) -> None:
        self.profile = profile

    def get_profile(self, db: FakeDb, user_id: uuid.UUID):
        return self.profile


@pytest.fixture(autouse=True)
def clear_overrides():
    app.dependency_overrides.clear()
    old_values = {
        "google_client_id": settings.google_client_id,
        "google_client_secret": settings.google_client_secret,
        "google_redirect_uri": settings.google_redirect_uri,
        "frontend_url": settings.frontend_url,
        "jwt_secret": settings.jwt_secret,
        "secret_key": settings.secret_key,
    }
    yield
    for key, value in old_values.items():
        setattr(settings, key, value)
    app.dependency_overrides.clear()


def test_google_login_redirects_to_google_oauth() -> None:
    settings.google_client_id = "google-client-id"
    settings.google_redirect_uri = "http://localhost:8000/api/v1/auth/google/callback"

    client = TestClient(app)
    response = client.get("/api/v1/auth/google/login", follow_redirects=False)

    location = response.headers["location"]
    parsed = urlparse(location)
    query = parse_qs(parsed.query)
    assert response.status_code in {302, 307}
    assert parsed.netloc == "accounts.google.com"
    assert query["client_id"] == ["google-client-id"]
    assert query["redirect_uri"] == ["http://localhost:8000/api/v1/auth/google/callback"]
    assert query["response_type"] == ["code"]
    assert query["scope"] == ["openid email profile"]


def test_google_callback_creates_or_logs_in_user_and_redirects_with_jwt() -> None:
    user_id = uuid.uuid4()
    user = SimpleNamespace(
        id=user_id,
        email="hyesung@gmail.com",
        name="혜성",
        profile_image="https://example.com/profile.png",
        provider="google",
        provider_id="google-user-1",
        is_active=True,
    )
    fake_db = FakeDb()
    fake_user_repository = FakeUserRepository(user)
    settings.frontend_url = "http://localhost:3100"
    settings.jwt_secret = "test-secret"

    app.dependency_overrides[get_db] = lambda: fake_db
    app.dependency_overrides[get_google_oauth_client] = lambda: FakeGoogleOAuthClient()
    app.dependency_overrides[get_user_repository] = lambda: fake_user_repository

    client = TestClient(app)
    response = client.get("/api/v1/auth/google/callback?code=google-code", follow_redirects=False)

    location = response.headers["location"]
    token = parse_qs(urlparse(location).query)["token"][0]
    payload = decode_access_token(token)
    assert response.status_code in {302, 307}
    assert location.startswith("http://localhost:3100/auth/callback?token=")
    assert payload["sub"] == str(user_id)
    assert fake_db.commits == 1
    assert fake_user_repository.google_user_info.email == "hyesung@gmail.com"


def test_user_me_returns_current_user() -> None:
    user_id = uuid.uuid4()
    user = SimpleNamespace(
        id=user_id,
        email="hyesung@gmail.com",
        name="혜성",
        profile_image="https://example.com/profile.png",
        region="서울",
        household_size=1,
        residence_type=None,
        main_cooling_device=None,
        is_active=True,
    )
    profile = {
        "home_environment": {"housing_type": "오피스텔"},
        "energy_profile": {"ac_type": "벽걸이"},
        "lifestyle": {"main_activity_time": "야간 활동"},
    }
    settings.jwt_secret = "test-secret"
    fake_db = FakeDb()
    fake_user_repository = FakeUserRepository(user)

    app.dependency_overrides[get_db] = lambda: fake_db
    app.dependency_overrides[get_user_repository] = lambda: fake_user_repository
    app.dependency_overrides[get_profile_repository] = lambda: FakeProfileRepository(profile)

    token = create_access_token(user_id)
    client = TestClient(app)
    response = client.get("/api/v1/user/me", headers={"Authorization": f"Bearer {token}"})

    body = response.json()
    assert response.status_code == 200
    assert body["success"] is True
    assert body["data"] == {
        "id": str(user_id),
        "user_id": str(user_id),
        "name": "혜성",
        "email": "hyesung@gmail.com",
        "profileImage": "https://example.com/profile.png",
        "region": "서울",
        "householdSize": 1,
        "residenceType": "오피스텔",
        "mainCoolingDevice": "벽걸이",
        "has_profile": True,
        "profileCompleted": True,
    }


def test_user_me_patch_updates_required_profile_fields() -> None:
    user_id = uuid.uuid4()
    user = SimpleNamespace(
        id=user_id,
        email="hyesung@gmail.com",
        name="혜성",
        profile_image="https://example.com/profile.png",
        region=None,
        household_size=None,
        residence_type=None,
        main_cooling_device=None,
        is_active=True,
    )
    settings.jwt_secret = "test-secret"
    fake_db = FakeDb()
    fake_user_repository = FakeUserRepository(user)

    app.dependency_overrides[get_db] = lambda: fake_db
    app.dependency_overrides[get_user_repository] = lambda: fake_user_repository
    app.dependency_overrides[get_profile_repository] = lambda: FakeProfileRepository(None)

    token = create_access_token(user_id)
    client = TestClient(app)
    response = client.patch(
        "/api/v1/user/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "새 이름",
            "region": "부산",
            "householdSize": 2,
            "residenceType": "아파트",
            "mainCoolingDevice": "스탠드",
        },
    )

    body = response.json()
    assert response.status_code == 200
    assert fake_db.commits == 1
    assert body["success"] is True
    assert body["data"]["name"] == "새 이름"
    assert body["data"]["region"] == "부산"
    assert body["data"]["householdSize"] == 2
    assert body["data"]["residenceType"] == "아파트"
    assert body["data"]["mainCoolingDevice"] == "스탠드"
    assert body["data"]["profileCompleted"] is False


def test_user_me_invalid_token_returns_401() -> None:
    settings.jwt_secret = "test-secret"
    client = TestClient(app)

    response = client.get("/api/v1/user/me", headers={"Authorization": "Bearer invalid-token"})

    body = response.json()
    assert response.status_code == 401
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_TOKEN"
