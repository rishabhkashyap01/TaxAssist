"""
Auth Router
===========
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
"""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, field_validator

from middleware.auth_middleware import get_current_user
from src.auth import authenticate_user, create_jwt, register_user

router = APIRouter()

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds

# Local dev (http://localhost) needs Secure=False + SameSite=Lax
# Production (https://) needs Secure=True + SameSite=None (cross-origin)
_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")
_IS_PROD = _ORIGIN.startswith("https://")
_SECURE = _IS_PROD
_SAMESITE = "none" if _IS_PROD else "lax"


def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_SECURE,
        samesite=_SAMESITE,
        max_age=COOKIE_MAX_AGE,
    )


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AuthRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Username cannot be empty")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: AuthRequest, response: Response):
    user = register_user(body.username, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    user_id = str(user["_id"])
    token = create_jwt(user_id, body.username)
    _set_auth_cookie(response, token)
    return {"user_id": user_id, "username": body.username}


@router.post("/login")
def login(body: AuthRequest, response: Response):
    user = authenticate_user(body.username, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    user_id = str(user["_id"])
    token = create_jwt(user_id, body.username)
    _set_auth_cookie(response, token)
    return {"user_id": user_id, "username": body.username}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=_SECURE,
        samesite=_SAMESITE,
    )
    return {"ok": True}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
