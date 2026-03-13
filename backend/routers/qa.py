"""
Q&A Router
==========
GET /api/qa/stream?q=<question>   — SSE stream of the RAG answer
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from main import get_rag
from middleware.auth_middleware import get_current_user

router = APIRouter()


@router.get("/stream")
async def qa_stream(
    q: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
    rag_chain=Depends(get_rag),
):
    if not q.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query cannot be empty")

    if rag_chain is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG engine not ready. Please try again in a moment.",
        )

    async def generate():
        try:
            # Run the blocking RAG call in a thread to avoid blocking the event loop
            full_response: str = await asyncio.to_thread(
                rag_chain.invoke, {"input": q}
            )

            # Stream word-by-word with a small delay for smooth UX
            words = full_response.split(" ")
            for word in words:
                # Stop if client disconnected
                if await request.is_disconnected():
                    break
                chunk = json.dumps({"token": word + " "})
                yield f"data: {chunk}\n\n"
                await asyncio.sleep(0.025)

            # Final event with complete response
            done_event = json.dumps({"done": True, "full": full_response})
            yield f"data: {done_event}\n\n"

        except Exception as e:
            error_event = json.dumps({"error": str(e)})
            yield f"data: {error_event}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Disable nginx buffering on Render
            "Connection": "keep-alive",
        },
    )
