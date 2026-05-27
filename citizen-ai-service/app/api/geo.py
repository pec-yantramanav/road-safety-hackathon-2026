from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db
from app.services import geo_service

router = APIRouter()

class GeoRequest(BaseModel):
    lat: float
    lng: float

@router.post("/geo/resolve")
async def resolve_coordinates(req: GeoRequest, db: AsyncSession = Depends(get_db)):
    res = await geo_service.resolve_jurisdiction(req.lat, req.lng, db)
    return res
