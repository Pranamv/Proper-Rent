from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.dependencies import AuthenticatedAdmin, require_admin
from app.schemas.admin import AdminAuthCheckResponse

router = APIRouter(prefix="/admin", tags=["admin"])

AdminDependency = Annotated[AuthenticatedAdmin, Depends(require_admin)]


@router.get(
    "/auth/check",
    response_model=AdminAuthCheckResponse,
    status_code=status.HTTP_200_OK,
)
async def check_admin_auth(admin: AdminDependency) -> AdminAuthCheckResponse:
    return AdminAuthCheckResponse(
        agent_id=admin.agent_id,
        email=admin.email,
        role=admin.role,
    )
