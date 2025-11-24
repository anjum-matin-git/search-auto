"""
Custom application exceptions with standardized error handling.
"""
from typing import Any, Dict, Optional


class AppException(Exception):
    """Base exception for all application errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundException(AppException):
    """Resource not found exception."""
    
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} not found",
            status_code=404,
            details={"resource": resource, "identifier": str(identifier)},
        )


class AuthenticationException(AppException):
    """Authentication failed exception."""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message=message, status_code=401)


class ValidationException(AppException):
    """Validation error exception."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=422,
            details=details or {},
        )


class ExternalServiceException(AppException):
    """External service (OpenAI, scraping) error exception."""
    
    def __init__(self, service: str, message: str):
        super().__init__(
            message=f"{service} error: {message}",
            status_code=503,
            details={"service": service},
        )
