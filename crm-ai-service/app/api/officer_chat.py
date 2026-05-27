from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.dependencies import get_redis
from app.services import officer_chat_service

router = APIRouter()

class SessionRequest(BaseModel):
    officer_id: str

class MessageRequest(BaseModel):
    session_token: str
    message: str

@router.post("/officer/chat/session")
async def create_session(req: SessionRequest, redis = Depends(get_redis)):
    token = await officer_chat_service.create_officer_session(req.officer_id, redis)
    return {"session_token": token}

@router.post("/officer/chat/message")
async def send_message(req: MessageRequest, redis = Depends(get_redis)):
    try:
        res = await officer_chat_service.send_officer_message(req.session_token, req.message, redis)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
