"""
Main FastAPI application with routes and middleware.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.config import settings
from core.logging import configure_logging, get_logger
from core.exceptions import AppException
from db.base import init_db
from modules.auth.router import router as auth_router
from modules.search.router_agent import router as search_router  # Using ReAct agent
from modules.billing.router import router as billing_router
from modules.assistant.router import router as assistant_router

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("application_startup")
    init_db()
    logger.info("database_initialized")
    yield
    logger.info("application_shutdown")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-powered car search with LangGraph",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions."""
    logger.error(
        "app_exception",
        path=request.url.path,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details,
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(
        "unexpected_exception",
        path=request.url.path,
        error=str(exc),
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "details": {}
        }
    )


app.include_router(auth_router)
app.include_router(search_router)
app.include_router(billing_router)
app.include_router(assistant_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "app": settings.app_name,
        "status": "running",
        "env": settings.app_env
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0"
    }
