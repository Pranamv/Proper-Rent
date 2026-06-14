import logging
from time import perf_counter
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.dependencies import SettingsDependency, enforce_chat_rate_limit, get_llm_client
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_chat import (
    AIChatService,
    ChatSessionAbuseLimitExceeded,
    LLMClientProtocol,
)

router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)

DbSession = Annotated[AsyncSession, Depends(get_db_session)]
LLMClient = Annotated[LLMClientProtocol, Depends(get_llm_client)]


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(enforce_chat_rate_limit)],
)
async def create_chat_reply(
    payload: ChatRequest,
    settings: SettingsDependency,
    session: DbSession,
    llm_client: LLMClient,
) -> ChatResponse:
    request_started_at = perf_counter()
    service = AIChatService(session=session, llm_client=llm_client)
    try:
        result = await service.respond(
            session_id=payload.session_id,
            message=payload.message,
            renter_id=payload.renter_id,
            max_turns_per_session=settings.chat_session_max_turns,
        )
    except ChatSessionAbuseLimitExceeded:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Chat session limit reached. Submit the intake form or start a new session later."
            ),
            headers={"Retry-After": str(settings.public_rate_limit_window_seconds)},
        ) from None
    service_elapsed_ms = elapsed_ms(request_started_at)
    commit_started_at = perf_counter()
    await session.commit()
    logger.info(
        "Chat reply completed",
        extra={
            "response_source": result.response_source,
            "is_fallback": result.is_fallback,
            "service_ms": round(service_elapsed_ms, 2),
            "commit_ms": round(elapsed_ms(commit_started_at), 2),
            "total_ms": round(elapsed_ms(request_started_at), 2),
        },
    )

    return ChatResponse(
        reply=result.reply,
        suggested_action=result.suggested_action,
        session_id=result.session_id,
    )


def elapsed_ms(started_at: float) -> float:
    return (perf_counter() - started_at) * 1000
