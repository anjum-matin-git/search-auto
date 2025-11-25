"""
Application configuration using Pydantic Settings.
Follows 12-factor app principles with environment-based configuration.
"""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "SearchAuto API"
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=False, alias="DEBUG")
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=5000, alias="PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    
    # Database
    database_url: str = Field(..., alias="DATABASE_URL")
    
    # AI Configuration (Claude)
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-sonnet-4-20250514", alias="ANTHROPIC_MODEL")
    
    # OpenAI (embeddings only)
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_embedding_model: str = "text-embedding-3-small"
    
    # Security
    secret_key: str = Field(..., alias="SECRET_KEY")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Search Configuration
    max_search_results: int = 12
    default_search_limit: int = 10
    search_timeout_seconds: int = 60
    api_request_timeout_seconds: int = 30
    
    # Data Sources
    auto_dev_api_key: str = Field(default="", alias="AUTO_DEV_API_KEY")
    marketcheck_api_key: str = Field(default="", alias="MARKETCHECK_API_KEY")
    
    # Agent Configuration
    agent_max_iterations: int = 8
    agent_llm_timeout_seconds: int = 25
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Singleton instance
settings = Settings()
