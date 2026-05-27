from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services import pow_service

router = APIRouter()

class PowRequest(BaseModel):
    workorder_id: str
    ticket_lat: float
    ticket_lng: float
    before_photo_url: Optional[str] = None
    after_photo_url: Optional[str] = None

@router.post("/ai/validate/workorder")
async def validate_workorder_pow(req: PowRequest):
    res = await pow_service.validate_proof_of_work(
        req.workorder_id, req.ticket_lat, req.ticket_lng, req.before_photo_url, req.after_photo_url
    )
    return res
