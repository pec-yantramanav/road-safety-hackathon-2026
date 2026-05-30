from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
import os
from app.api import officer_chat, sla, workorder, uc
from app.jobs.sla_scanner import scan_at_risk_tickets
from app.config import settings

os.makedirs("static/uc", exist_ok=True)

def run_async_scanner():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(scan_at_risk_tickets())
    loop.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure static directory exists
    os.makedirs("static/uc", exist_ok=True)
    
    # Start background SLA scanner cron job
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        run_async_scanner, 
        'interval', 
        minutes=settings.SLA_SCAN_INTERVAL_MINUTES,
        id='sla_scanner_job'
    )
    scheduler.start()
    print("SLA Scanner Background Job started successfully.")
    
    yield
    
    scheduler.shutdown()

app = FastAPI(
    title="RoadWatch CRM AI Service",
    version="1.0.0",
    description="FastAPI Service for Officer AI assistant, SLA Breach Predictor, Proof of Work validation, and UC PDFs",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount static files to serve generated UC PDFs
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/ready")
def readiness_check():
    return {"status": "ready"}

app.include_router(officer_chat.router, prefix="", tags=["Chat"])
app.include_router(sla.router, prefix="", tags=["SLA"])
app.include_router(workorder.router, prefix="", tags=["WorkOrder"])
app.include_router(uc.router, prefix="", tags=["UC"])
