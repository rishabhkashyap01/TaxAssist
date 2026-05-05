import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from deps import get_rag
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
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="RAG engine not ready. Please try again in a moment.")

    async def generate():
        try:
            try:
                response: str = await asyncio.to_thread(rag_chain.invoke, {"input": q})
            except Exception as e:
                print(f"[QA] RAG invoke failed, retrying: {e}")
                await asyncio.sleep(2)
                response: str = await asyncio.to_thread(rag_chain.invoke, {"input": q})

            for word in response.split(" "):
                if await request.is_disconnected():
                    break
                yield f"data: {json.dumps({'token': word + ' '})}\n\n"
                await asyncio.sleep(0.025)

            yield f"data: {json.dumps({'done': True, 'full': response})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
