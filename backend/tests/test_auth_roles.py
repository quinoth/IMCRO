import pytest
from fastapi import HTTPException
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from auth import (
    ACCESS_TOKEN_TYPE,
    ALGORITHM,
    REFRESH_TOKEN_TYPE,
    SECRET_KEY,
    create_access_token,
    create_refresh_token,
    get_user_by_email,
    get_user_from_refresh_token,
    verify_password,
)
from database import Base
from models import User, UserRole
from schemas import UserResponse


def test_user_response_exposes_role_name_from_relationship():
    role = UserRole(id=4, role_name="domu_editor", can_access_internal_docs=True)
    user = User(
        id=42,
        email="domu@example.test",
        is_active=True,
    )
    user.role = role

    response = UserResponse.model_validate(user)

    assert response.role == "domu_editor"
    assert response.can_access_internal_docs is True


def test_access_and_refresh_tokens_have_distinct_types():
    access_token = create_access_token({"sub": "admin@example.test"})
    refresh_token = create_refresh_token({"sub": "admin@example.test"})

    access_payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
    refresh_payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])

    assert access_payload["type"] == ACCESS_TOKEN_TYPE
    assert refresh_payload["type"] == REFRESH_TOKEN_TYPE


def test_invalid_password_hash_is_rejected_without_error():
    assert verify_password("secret", "not-a-valid-bcrypt-hash") is False


def _auth_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)()


def test_user_lookup_is_case_insensitive():
    db = _auth_session()
    try:
        db.add(
            User(
                email="person@example.com",
                password_hash="not-used",
                is_active=True,
            )
        )
        db.commit()

        assert get_user_by_email(db, "PERSON@EXAMPLE.COM") is not None
    finally:
        db.close()


def test_refresh_token_lookup_prefers_uid_and_rejects_inactive_users():
    db = _auth_session()
    try:
        active = User(
            email="new@example.com",
            password_hash="not-used",
            is_active=True,
        )
        inactive = User(
            email="inactive@example.com",
            password_hash="not-used",
            is_active=False,
        )
        db.add_all([active, inactive])
        db.commit()

        stale_email_token = create_refresh_token(
            {"sub": "old@example.com", "uid": active.id}
        )
        assert get_user_from_refresh_token(stale_email_token, db).id == active.id

        inactive_token = create_refresh_token(
            {"sub": inactive.email, "uid": inactive.id}
        )
        with pytest.raises(HTTPException) as exc:
            get_user_from_refresh_token(inactive_token, db)

        assert exc.value.status_code == 403
    finally:
        db.close()
