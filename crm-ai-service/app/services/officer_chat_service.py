import json
import uuid
from app.clients.llm_client import llm_client
from app.config import settings

OFFICER_SYSTEM_PROMPT = """You are a division management assistant for a Public Works Department Engineer.
You can query active road tickets, budget lines, contractor metrics, and track pending approvals.
Scope all insights strictly to their division and follow high accountability principles.
"""

OFFICER_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_tickets",
            "description": "List road complaints scoped to the active division",
            "parameters": {
                "type": "object",
                "properties": {
                    "jurisdiction_id": {"type": "string"},
                    "status": {"type": "string", "enum": ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "CLOSED"]}
                },
                "required": ["jurisdiction_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_budget_summary",
            "description": "Show scheme-wise budget balances",
            "parameters": {
                "type": "object",
                "properties": {
                    "jurisdiction_id": {"type": "string"}
                },
                "required": ["jurisdiction_id"]
            }
        }
    }
]

async def create_officer_session(officer_id: str, redis) -> str:
    token = str(uuid.uuid4())
    session_data = {
        "session_token": token,
        "officer_id": officer_id,
        "messages": []
    }
    await redis.setex(f"crm_chat:{token}", settings.CHAT_SESSION_TTL_HOURS * 3600, json.dumps(session_data))
    return token

async def send_officer_message(token: str, message: str, redis):
    data = await redis.get(f"crm_chat:{token}")
    if not data:
        raise ValueError("Session expired or invalid")
    
    session = json.loads(data)
    messages = session.get("messages", [])
    messages.append({"role": "user", "content": message})

    # Call LLM
    res = llm_client.chat(OFFICER_SYSTEM_PROMPT, messages, tools=OFFICER_TOOLS)

    assistant_msg = {"role": "assistant", "content": res["content"]}
    if res["tool_calls"]:
        assistant_msg["tool_calls"] = res["tool_calls"]
    messages.append(assistant_msg)

    # Save
    session["messages"] = messages
    await redis.setex(f"crm_chat:{token}", settings.CHAT_SESSION_TTL_HOURS * 3600, json.dumps(session))

    return res
