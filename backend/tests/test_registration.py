import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base
from main import register
from models import User
from schemas import UserCreate


def _session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)()


def test_public_registration_schema_does_not_expose_username():
    assert "username" not in UserCreate.model_json_schema()["properties"]


def test_public_registration_does_not_store_username():
    db = _session()
    try:
        first = register(
            UserCreate(email="person@example.com", password="secret123"),
            db=db,
        )
        second = register(
            UserCreate(email="person@example.org", password="secret123"),
            db=db,
        )

        assert "username" not in first.model_dump()
        assert "username" not in second.model_dump()
        assert "username" not in User.__table__.columns
        assert first.created_at is not None
        assert second.created_at is not None
        assert User.__table__.columns["created_at"].nullable is False
    finally:
        db.close()


def test_public_registration_normalizes_email_and_blocks_case_duplicate():
    db = _session()
    try:
        created = register(
            UserCreate(email="Person@Example.COM", password="secret123"),
            db=db,
        )

        assert created.email == "person@example.com"

        with pytest.raises(HTTPException) as exc:
            register(
                UserCreate(email="person@example.com", password="secret123"),
                db=db,
            )

        assert exc.value.status_code == 400
        assert db.query(User).count() == 1
    finally:
        db.close()


def test_public_registration_rejects_weak_passwords():
    with pytest.raises(ValidationError):
        UserCreate(email="person@example.com", password="password")

    with pytest.raises(ValidationError):
        UserCreate(email="person@example.com", password="12345678")
