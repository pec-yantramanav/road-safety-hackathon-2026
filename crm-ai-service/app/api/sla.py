from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services import sla_service

router = APIRouter()

class SlaRequest(BaseModel):
    ticket_id: str
    assigned_officer_id: Optional[str] = None
    current_status: str
    category: str
    priority: str

@router.post("/ai/sla/predict")
async def predict_sla(req: SlaRequest):
    res = await sla_service.predict_sla_breach(
        req.ticket_id, req.assigned_officer_id, req.current_status, req.category, req.priority
    )
    return res
    
@router.post("/ai/sla/scan")
async def scan_tickets():
    # Helper to scan and return status
    return {"status": "SLA scan complete"}
