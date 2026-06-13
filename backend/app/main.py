from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, get_settings
from app.routers.chat import router as chat_router
from app.routers.health import router as health_router
from app.routers.landlords import router as landlords_router
from app.routers.leads import router as leads_router


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved_settings = settings or get_settings()
    app = FastAPI(
        title="Proper Rent API",
        version=resolved_settings.app_version,
        openapi_url=f"{resolved_settings.api_v1_prefix}/openapi.json",
    )
    app.state.settings = resolved_settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved_settings.cors_allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    app.include_router(chat_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(health_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(landlords_router, prefix=resolved_settings.api_v1_prefix)
    app.include_router(leads_router, prefix=resolved_settings.api_v1_prefix)
    return app


app = create_app()
