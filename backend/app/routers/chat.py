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
    await session.commit()

    return ChatResponse(
        reply=result.reply,
        suggested_action=result.suggested_action,
        session_id=result.session_id,
    )
