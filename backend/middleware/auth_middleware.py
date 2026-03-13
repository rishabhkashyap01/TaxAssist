"""
JWT Auth Middleware
==================
FastAPI dependency that validates the httpOnly JWT cookie on every
protected route. Inject with: Depends(get_current_user)
"""

from __future__ import annotations

from bson import ObjectId
from fastapi import Cookie, HTTPException, status
from jose import JWTError

from src.auth import decode_jwt
from src.database import get_db


async def get_current_user(access_token: str | None = Cookie(default=None)) -> dict:
    """
    Validate the JWT cookie and return the authenticated user dict.
    Raises 401 if the cookie is missing, expired, or invalid.
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = decode_jwt(access_token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    db = get_db()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return {
        "user_id": str(user["_id"]),
        "username": user["username"],
    }
