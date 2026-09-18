"""
Application configuration.

All secrets / environment-specific values are read from environment
variables (see .env.example). Nothing sensitive is hard-coded.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Database -----------------------------------------------------
    # Works with Postgres or MySQL - just change the URL scheme, e.g.
    #   postgresql+psycopg2://user:pass@localhost:5432/complaints_db
    #   mysql+pymysql://user:pass@localhost:3306/complaints_db
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/complaints_db"

    # --- Groq (LLM provider) ------------------------------------------
    groq_api_key: str = ""  # set in .env - never commit a real key
    groq_api_base: str = "https://api.groq.com/openai/v1"
    groq_fast_model: str = "gemma2-9b-it"          # required by spec, used for quick tasks
    groq_context_model: str = "llama-3.3-70b-versatile"  # used for reasoning-heavy tasks

    # --- App ------------------------------------------------------------
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    max_upload_mb: int = 10
    duplicate_similarity_threshold: float = 0.72

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
