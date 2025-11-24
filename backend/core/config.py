"""
Application configuration using Pydantic Settings.
Follows 12-factor app principles with environment-based configuration.
"""
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Main application settings loaded from environment variables."""
    
    # Application
    app_name: str = "SearchAuto API"
    app_env: str = Field(default="development", alias="APP_ENV")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=5000, alias="PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    
    # Database
    database_url: str = Field(..., alias="DATABASE_URL")
    
    # OpenAI
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")
    openai_model: str = "gpt-5"
    openai_embedding_model: str = "text-embedding-3-small"
    
    # Security
    secret_key: str = Field(..., alias="SECRET_KEY")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Search
    max_search_results: int = 10
    scraping_timeout_seconds: int = 30

    # External integrations
    # Add any future API keys here
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Global settings instance
settings = Settings()
