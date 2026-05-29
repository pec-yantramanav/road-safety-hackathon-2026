from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://roadwatch:dev123@postgres:5432/roadwatch"
    REDIS_URL: str = "redis://redis:6379/0"
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GROQ_API_URL: str = "https://api.groq.com/v1"
    CORE_API_BASE_URL: str = "http://citizen-core-api:8080/api/v1/citizen"
    CHAT_SESSION_TTL_HOURS: int = 24
    BLACKSPOT_DEFAULT_RADIUS_M: int = 200
    DUPLICATE_CHECK_RADIUS_M: int = 50

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
