"""
TaxAssist FastAPI Backend
=========================
Entry point. Mounts all routers and warms up RAG on startup.
"""

from __future__ import annotations

import asyncio
import os

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
# Startup: warm up RAG chain so first user request is fast
# ---------------------------------------------------------------------------
rag_chain = None


@app.on_event("startup")
async def startup_event():
    global rag_chain
    try:
        from src.rag_engine import get_rag_chain
        rag_chain = await asyncio.to_thread(get_rag_chain)
        print("RAG chain initialized successfully.")
    except Exception as e:
        print(f"WARNING: RAG chain failed to initialize: {e}")
        rag_chain = None


def get_rag() -> object | None:
    """Dependency: return the cached RAG chain."""
    return rag_chain


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from routers import auth, qa, filing, filings  # noqa: E402

app.include_router(auth.router,    prefix="/api/auth",    tags=["auth"])
app.include_router(qa.router,      prefix="/api/qa",      tags=["qa"])
app.include_router(filing.router,  prefix="/api/filing",  tags=["filing"])
app.include_router(filings.router, prefix="/api/filings", tags=["filings"])


@app.get("/health")
def health():
    return {"status": "ok", "rag_ready": rag_chain is not None}
