from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UuidPrimaryKeyMixin
from app.models.constants import CHANNELS, allowed_values_check
from app.models.types import JsonList, json_column_type

if TYPE_CHECKING:
    from app.models.renter import Renter


class Conversation(UuidPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "conversations"
    __table_args__ = (
        CheckConstraint(allowed_values_check("channel", CHANNELS), name="ck_conversations_channel"),
        Index("ix_conversations_session_id", "session_id"),
        Index("ix_conversations_renter_id", "renter_id"),
    )

    renter_id: Mapped[UUID | None] = mapped_column(ForeignKey("renters.id"))
    session_id: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(Text, nullable=False)
    external_id: Mapped[str | None] = mapped_column(Text)
    transcript: Mapped[JsonList] = mapped_column(
        json_column_type(),
        nullable=False,
        default=list,
        server_default="[]",
    )
    ai_summary: Mapped[str | None] = mapped_column(Text)
    intent_score_output: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    renter: Mapped[Renter | None] = relationship(back_populates="conversations")
