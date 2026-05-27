from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db
from app.services import filter_service

router = APIRouter()

class FilterRequest(BaseModel):
    lat: float
    lng: float
    category: str
    description: Optional[str] = ""
    citizen_id: Optional[str] = None

@router.post("/ai/filter/complaint")
async def filter_spam_and_duplicates(req: FilterRequest, db: AsyncSession = Depends(get_db)):
    res = await filter_service.filter_complaint(
        req.lat, req.lng, req.category, req.description, req.citizen_id, db
    )
    return res
