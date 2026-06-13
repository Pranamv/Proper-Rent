from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.dependencies import get_llm_client
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_chat import AIChatService, LLMClientProtocol

router = APIRouter(tags=["chat"])

DbSession = Annotated[AsyncSession, Depends(get_db_session)]
LLMClient = Annotated[LLMClientProtocol, Depends(get_llm_client)]


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
)
async def create_chat_reply(
    payload: ChatRequest,
    session: DbSession,
    llm_client: LLMClient,
) -> ChatResponse:
    service = AIChatService(session=session, llm_client=llm_client)
    result = await service.respond(
        session_id=payload.session_id,
        message=payload.message,
        renter_id=payload.renter_id,
    )
    await session.commit()

    return ChatResponse(
        reply=result.reply,
        suggested_action=result.suggested_action,
        session_id=result.session_id,
    )
