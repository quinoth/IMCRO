import os
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import TokenData

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:
        return False


def normalize_email(email: str | None) -> str:
    return str(email or "").strip().lower()


def get_user_by_email(db: Session, email: str | None) -> User | None:
    normalized_email = normalize_email(email)
    if not normalized_email:
        return None
    return (
        db.query(User)
        .filter(func.lower(User.email) == normalized_email)
        .first()
    )


def _create_token(data: dict, token_type: str, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode["exp"] = expire
    to_encode["type"] = token_type
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    return _create_token(
        data=data,
        token_type=ACCESS_TOKEN_TYPE,
        expires_delta=expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    return _create_token(
        data=data,
        token_type=REFRESH_TOKEN_TYPE,
        expires_delta=expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


def _invalid_token_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def inactive_user_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="User is inactive",
    )


def _decode_token_payload(token: str, expected_type: str) -> dict:
    credentials_exception = _invalid_token_exception()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type")
        is_legacy_access = expected_type == ACCESS_TOKEN_TYPE and token_type is None
        if token_type != expected_type and not is_legacy_access:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return payload


def _get_user_from_token(
    token: str,
    db: Session,
    expected_type: str = ACCESS_TOKEN_TYPE,
) -> User:
    credentials_exception = _invalid_token_exception()
    payload = _decode_token_payload(token, expected_type)
    user_id = payload.get("uid")
    email: str | None = payload.get("sub")

    if user_id is not None:
        try:
            user = db.get(User, int(user_id))
        except (TypeError, ValueError):
            raise credentials_exception
    elif email is not None:
        token_data = TokenData(email=email)
        user = get_user_by_email(db, token_data.email)
    else:
        raise credentials_exception

    if user is None:
        raise credentials_exception
    if getattr(user, "is_active", True) is False:
        raise inactive_user_exception()
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    return _get_user_from_token(token, db)


def get_optional_current_user(
    token: str | None = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not token:
        return None
    return _get_user_from_token(token, db)


def get_user_from_refresh_token(refresh_token: str, db: Session) -> User:
    return _get_user_from_token(refresh_token, db, expected_type=REFRESH_TOKEN_TYPE)
