from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UuidPrimaryKeyMixin
from app.models.constants import AGENT_ROLES, allowed_values_check

if TYPE_CHECKING:
    from app.models.renter import Renter


class Agent(UuidPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "agents"
    __table_args__ = (
        CheckConstraint(allowed_values_check("role", AGENT_ROLES), name="ck_agents_role"),
        UniqueConstraint("email", name="uq_agents_email"),
    )

    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False, server_default="agent")

    renters: Mapped[list[Renter]] = relationship(back_populates="assigned_agent")
