import os

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, field_validator

from deps import limiter
from middleware.auth_middleware import get_current_user
from src.auth import authenticate_user, create_jwt, register_user

router = APIRouter()

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = 7 * 24 * 60 * 60

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


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, body: AuthRequest, response: Response):
    user = register_user(body.username, body.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
    user_id = str(user["_id"])
    token = create_jwt(user_id, body.username)
    _set_auth_cookie(response, token)
    return {"user_id": user_id, "username": body.username}


@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, body: AuthRequest, response: Response):
    user = authenticate_user(body.username, body.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    user_id = str(user["_id"])
    token = create_jwt(user_id, body.username)
    _set_auth_cookie(response, token)
    return {"user_id": user_id, "username": body.username}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, httponly=True, secure=_SECURE, samesite=_SAMESITE)
    return {"ok": True}


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user
