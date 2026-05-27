import json
import uuid
from app.clients.llm_client import llm_client
from app.config import settings

# System prompt templates
CITIZEN_SYSTEM_PROMPT = """You are RoadWatch's conversational AI assistant. 
You guide citizens through filing grievances, checking ticket resolutions, 
and reviewing public budget expenditures transparently.
Be polite, professional, and concise.
"""

CITIZEN_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "submit_complaint",
            "description": "File a new road grievance ticket",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "category": {"type": "string", "enum": ["POTHOLE", "LIGHTING", "SIGNAGE", "ROAD_QUALITY", "OTHER"]},
                    "lat": {"type": "number"},
                    "lng": {"type": "number"},
                    "is_anonymous": {"type": "boolean"}
                },
                "required": ["title", "category", "lat", "lng"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ticket_status",
            "description": "Check the status of a specific complaint ticket",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticket_id": {"type": "string"}
                },
                "required": ["ticket_id"]
            }
        }
    }
]

async def create_chat_session(citizen_id: str, redis) -> str:
    token = str(uuid.uuid4())
    session_data = {
        "session_token": token,
        "citizen_id": citizen_id,
        "messages": [],
        "language": "en"
    }
    await redis.setex(f"chat:{token}", settings.CHAT_SESSION_TTL_HOURS * 3600, json.dumps(session_data))
    return token

async def get_chat_session(token: str, redis) -> dict:
    data = await redis.get(f"chat:{token}")
    if not data:
        return None
    return json.loads(data)

async def send_chat_message(token: str, message: str, redis):
    session = await get_chat_session(token, redis)
    if not session:
        raise ValueError("Session expired or invalid")

    messages = session.get("messages", [])
    messages.append({"role": "user", "content": message})

    # Call LLM client
    res = llm_client.chat(CITIZEN_SYSTEM_PROMPT, messages, tools=CITIZEN_TOOLS)

    assistant_msg = {"role": "assistant", "content": res["content"]}
    if res["tool_calls"]:
        assistant_msg["tool_calls"] = res["tool_calls"]
    messages.append(assistant_msg)

    # Save session
    session["messages"] = messages
    await redis.setex(f"chat:{token}", settings.CHAT_SESSION_TTL_HOURS * 3600, json.dumps(session))

    return res
