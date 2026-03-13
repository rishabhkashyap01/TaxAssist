"""
Authentication
==============
Username/password auth with bcrypt + JWT tokens (httpOnly cookies).
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta

import bcrypt
from jose import jwt, JWTError
from pymongo.errors import DuplicateKeyError

from src.database import get_db

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7


# ---------------------------------------------------------------------------
# Password helpers (unchanged)
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


# ---------------------------------------------------------------------------
# User management (unchanged)
# ---------------------------------------------------------------------------

def register_user(username: str, password: str) -> dict | None:
    """Create a new user. Returns the user dict, or None if username is taken."""
    db = get_db()
    user_doc = {
        "username": username,
        "password_hash": hash_password(password),
        "created_at": datetime.now().isoformat(),
    }
    try:
        result = db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return user_doc
    except DuplicateKeyError:
        return None


def authenticate_user(username: str, password: str) -> dict | None:
    """Verify credentials. Returns user dict if valid, None otherwise."""
    db = get_db()
    user = db.users.find_one({"username": username})
    if user and verify_password(password, user["password_hash"]):
        return user
    return None


# ---------------------------------------------------------------------------
# JWT (replaces MongoDB session tokens)
# ---------------------------------------------------------------------------

def create_jwt(user_id: str, username: str) -> str:
    """Create a signed JWT token valid for JWT_EXPIRY_DAYS days."""
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    """Decode and validate a JWT. Raises JWTError if invalid or expired."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
