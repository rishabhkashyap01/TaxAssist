import asyncio
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from deps import limiter, set_rag, get_rag
from routers import auth, qa, filing, filings

load_dotenv()

app = FastAPI(title="TaxAssist API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    try:
        from src.rag_engine import get_rag_chain
        chain = await asyncio.to_thread(get_rag_chain)
        set_rag(chain)
        print("RAG chain initialized successfully.")
    except Exception as e:
        print(f"WARNING: RAG chain failed to initialize: {e}")


app.include_router(auth.router,    prefix="/api/auth",    tags=["auth"])
app.include_router(qa.router,      prefix="/api/qa",      tags=["qa"])
app.include_router(filing.router,  prefix="/api/filing",  tags=["filing"])
app.include_router(filings.router, prefix="/api/filings", tags=["filings"])


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok", "rag_ready": get_rag() is not None, "version": "1.0.4"}
