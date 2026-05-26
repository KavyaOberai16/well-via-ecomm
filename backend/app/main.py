import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestIDMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIDMiddleware)

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    # Serve locally-stored uploads. With STORAGE_BACKEND=s3 this is unused —
    # images are served straight from the bucket / CDN.
    if settings.STORAGE_BACKEND == "local":
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        app.mount("/media", StaticFiles(directory=settings.UPLOAD_DIR), name="media")

    @app.get("/health", tags=["system"])
    def health():
        return {"status": "ok"}

    @app.get("/ready", tags=["system"])
    def ready():
        return {"status": "ready"}

    return app


app = create_app()
