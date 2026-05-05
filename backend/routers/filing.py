import asyncio
import json
from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from deps import get_rag
from middleware.auth_middleware import get_current_user
from src.filing_engine import is_tax_question, process_filing_message
from src.itr_models import ITRFiling

router = APIRouter()


class FilingMessageRequest(BaseModel):
    filing_state: dict[str, Any]
    messages: list[dict[str, str]]
    user_message: str
    use_rag: bool = True


class WelcomeRequest(BaseModel):
    filing_state: dict[str, Any]


async def _stream_response(
    request: Request,
    user_message: str,
    filing: ITRFiling,
    messages: list[dict],
    rag_chain,
    use_rag: bool,
):
    async def generate():
        try:
            rag_context = ""
            if use_rag and rag_chain and is_tax_question(user_message):
                rag_context = await asyncio.to_thread(rag_chain.invoke, {"input": user_message})

            response_text, updated_filing, step_advanced = await asyncio.to_thread(
                process_filing_message, user_message, filing, messages, rag_context,
            )

            for word in response_text.split(" "):
                if await request.is_disconnected():
                    break
                yield f"data: {json.dumps({'token': word + ' '})}\n\n"
                await asyncio.sleep(0.025)

            yield f"data: {json.dumps({'done': True, 'response': response_text, 'filing_state': updated_filing.to_dict(), 'step_advanced': step_advanced, 'new_step': updated_filing.current_step if step_advanced else None})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@router.post("/message/stream")
async def filing_message_stream(
    body: FilingMessageRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    rag_chain=Depends(get_rag),
):
    filing = ITRFiling.from_dict(body.filing_state)
    return await _stream_response(
        request=request,
        user_message=body.user_message,
        filing=filing,
        messages=body.messages,
        rag_chain=rag_chain,
        use_rag=body.use_rag,
    )


@router.post("/welcome")
async def filing_welcome(
    body: WelcomeRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    rag_chain=Depends(get_rag),
):
    filing = ITRFiling.from_dict(body.filing_state)
    return await _stream_response(
        request=request,
        user_message="Hello, I want to file my income tax return.",
        filing=filing,
        messages=[],
        rag_chain=rag_chain,
        use_rag=False,
    )
