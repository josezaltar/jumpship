"""
JumpShip — Configuration via pydantic-settings + .env
"""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings

_REPO_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    llm_provider: str = "ollama"
    llm_model: str = "gemma3:27b"
    ollama_base_url: str = "http://localhost:11434"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    groq_api_key: str = ""
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost"
    secret_key: str = "dev-secret-change-me-in-production"
    api_key: str = ""
    resume_gen_threshold: int = 70
    resume_output_dir: str = "./generated_resumes"
    llm_max_concurrent: int = 1
    debug: bool = False

    class Config:
        env_file = str(_REPO_ROOT / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"
        env_file_override = True

    @property
    def cors_origins_list(self) -> list[str]:
        if not self.cors_origins or self.cors_origins.strip() == "":
            return []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()