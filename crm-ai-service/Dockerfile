FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    pydantic \
    pydantic-settings \
    sqlalchemy \
    asyncpg \
    redis \
    openai \
    sse-starlette \
    httpx \
    pillow \
    structlog \
    apscheduler \
    reportlab

COPY app ./app

EXPOSE 8101

ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8101"]
