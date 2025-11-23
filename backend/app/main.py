"""
Main FastAPI application with routes and middleware.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.logging import configure_logging, get_logger
from core.exceptions import AppException
from modules.auth.router import router as auth_router
from modules.search.router import router as search_router

configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="AI-powered car search with LangGraph"
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
