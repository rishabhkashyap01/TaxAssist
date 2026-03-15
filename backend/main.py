"""
TaxAssist FastAPI Backend
=========================
Entry point. Mounts all routers and initializes RAG in background.
"""

from __future__ import annotations

import asyncio
import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="TaxAssist API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS — must list exact Vercel origin; never use "*" with credentials
# ---------------------------------------------------------------------------
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,   # Required for httpOnly cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Background RAG Initialization
# ---------------------------------------------------------------------------
from src.rag_manager import initialize_rag_background

@app.on_event("startup")
async def startup_event():
    # Start RAG initialization in background immediately
    from src.rag_manager import initialize_rag_background
    await initialize_rag_background()


def get_rag() -> object | None:
    """Dependency: return the cached RAG chain (initialize if needed)."""
    from src.rag_manager import get_rag_or_wait
    return asyncio.run(get_rag_or_wait(timeout=5.0))


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from routers import auth, qa, filing, filings  # noqa: E402

app.include_router(auth.router,    prefix="/api/auth",    tags=["auth"])
app.include_router(qa.router,      prefix="/api/qa",      tags=["qa"])
app.include_router(filing.router,  prefix="/api/filing",  tags=["filing"])
app.include_router(filings.router, prefix="/api/filings", tags=["filings"])


@app.get("/health")
async def health():
    from src.rag_manager import is_rag_ready
    rag_ready = await is_rag_ready()
    return {"status": "ok", "rag_ready": rag_ready}
