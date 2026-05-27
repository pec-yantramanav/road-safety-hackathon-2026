from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://roadwatch:dev123@postgres:5432/roadwatch"
    REDIS_URL: str = "redis://redis:6379/1"
    OPENAI_API_KEY: str = ""
    CORE_API_BASE_URL: str = "http://crm-core-api:8081/api/v1/crm"
    CHAT_SESSION_TTL_HOURS: int = 24
    SLA_SCAN_INTERVAL_MINUTES: int = 30
    SLA_LOOKAHEAD_HOURS: int = 48
    POW_LOCATION_TOLERANCE_M: float = 200.0

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
