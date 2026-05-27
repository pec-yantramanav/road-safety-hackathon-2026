from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from app.dependencies import get_redis
from app.services import chat_service

router = APIRouter()

class SessionRequest(BaseModel):
    citizen_id: Optional[str] = None

class MessageRequest(BaseModel):
    session_token: str
    message: str

@router.post("/chat/session")
async def create_session(req: SessionRequest, redis = Depends(get_redis)):
    token = await chat_service.create_chat_session(req.citizen_id, redis)
    return {"session_token": token}

@router.get("/chat/session/{token}")
async def get_session(token: str, redis = Depends(get_redis)):
    session = await chat_service.get_chat_session(token, redis)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return session

@router.post("/chat/message")
async def send_message(req: MessageRequest, redis = Depends(get_redis)):
    try:
        res = await chat_service.send_chat_message(req.session_token, req.message, redis)
        return res
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
