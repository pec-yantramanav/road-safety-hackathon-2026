from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, geo, filter

app = FastAPI(
    title="RoadWatch Citizen AI Service",
    version="1.0.0",
    description="FastAPI Service for Chatbot, Geo-Containment Routing, and Spam Filtering"
)

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Actuator style health probes
@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/ready")
def readiness_check():
    return {"status": "ready"}

# Register routers with prefixes matching HLD/Kong config
app.include_router(chat.router, prefix="/api/v1/ai/citizen", tags=["Chat"])
app.include_router(geo.router, prefix="/api/v1/ai/citizen", tags=["Geo"])
app.include_router(filter.router, prefix="/api/v1/ai/citizen", tags=["Filter"])
