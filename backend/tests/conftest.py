import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
