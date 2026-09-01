import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserRegister
from app.services.auth_service import AuthService
from app.core.security import create_access_token

TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test_kharchyapani.db"

test_engine = create_engine(
    TEST_SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_kharchyapani.db"):
        try:
            os.remove("./test_kharchyapani.db")
        except Exception:
            pass

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def auth_user(db_session):
    user = AuthService.get_user_by_email(db_session, "test@example.com")
    if not user:
        user = AuthService.register_user(
            db_session,
            UserRegister(email="test@example.com", password="Password123!", full_name="Test User")
        )
    return user

@pytest.fixture(scope="function")
def auth_headers(auth_user):
    token = create_access_token({"sub": str(auth_user.id), "email": auth_user.email})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def second_user(db_session):
    user = AuthService.get_user_by_email(db_session, "user2@example.com")
    if not user:
        user = AuthService.register_user(
            db_session,
            UserRegister(email="user2@example.com", password="Password123!", full_name="User Two")
        )
    return user

@pytest.fixture(scope="function")
def second_auth_headers(second_user):
    token = create_access_token({"sub": str(second_user.id), "email": second_user.email})
    return {"Authorization": f"Bearer {token}"}
