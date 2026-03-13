"""
Filings CRUD Router
===================
GET    /api/filings              — list all filings for current user
POST   /api/filings              — save a new filing
GET    /api/filings/{filing_id}  — load a filing + chat history
PATCH  /api/filings/{filing_id}  — update an existing filing
DELETE /api/filings/{filing_id}  — delete a filing
"""

from __future__ import annotations

from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from middleware.auth_middleware import get_current_user
from src.database import get_db
from src.filing_storage import (
    delete_filing,
    list_filings,
    load_filing,
    save_filing,
    update_filing,
)
from src.itr_models import ITRFiling

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SaveFilingRequest(BaseModel):
    filing_state: dict[str, Any]
    messages: list[dict[str, str]] = []


class UpdateFilingRequest(BaseModel):
    filing_state: dict[str, Any]
    messages: list[dict[str, str]] = []


# ---------------------------------------------------------------------------
# Ownership guard
# ---------------------------------------------------------------------------

def _assert_owner(filing_id: str, user_id: str):
    """Raise 404 if the filing doesn't exist or doesn't belong to this user."""
    db = get_db()
    doc = db.filings.find_one(
        {"_id": ObjectId(filing_id)},
        {"user_id": 1},
    )
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Filing not found")
    if str(doc["user_id"]) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your filing")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("")
def list_user_filings(current_user: dict = Depends(get_current_user)):
    return list_filings(current_user["user_id"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_filing(
    body: SaveFilingRequest,
    current_user: dict = Depends(get_current_user),
):
    filing = ITRFiling.from_dict(body.filing_state)
    filing_id = save_filing(filing, current_user["user_id"], body.messages)
    return {"filing_id": filing_id}


@router.get("/{filing_id}")
def get_filing(
    filing_id: str,
    current_user: dict = Depends(get_current_user),
):
    _assert_owner(filing_id, current_user["user_id"])
    filing, messages = load_filing(filing_id)
    return {
        "filing_state": filing.to_dict(),
        "messages": messages,
    }


@router.patch("/{filing_id}")
def update_filing_route(
    filing_id: str,
    body: UpdateFilingRequest,
    current_user: dict = Depends(get_current_user),
):
    _assert_owner(filing_id, current_user["user_id"])
    filing = ITRFiling.from_dict(body.filing_state)
    update_filing(filing, filing_id, body.messages)
    return {"ok": True}


@router.delete("/{filing_id}")
def delete_filing_route(
    filing_id: str,
    current_user: dict = Depends(get_current_user),
):
    _assert_owner(filing_id, current_user["user_id"])
    deleted = delete_filing(filing_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Filing not found")
    return {"ok": True}
