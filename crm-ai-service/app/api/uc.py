from fastapi import APIRouter
from pydantic import BaseModel
from app.services import uc_service

router = APIRouter()

class UcRequest(BaseModel):
    workorder_id: str
    officer_id: str

@router.post("/ai/generate/uc")
async def generate_uc_document(req: UcRequest):
    res = await uc_service.generate_utilization_certificate(
        req.workorder_id, req.officer_id
    )
    return res
