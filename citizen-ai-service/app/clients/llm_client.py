import os
import httpx
from app.config import settings


class LlmClient:
    def __init__(self):
        # Use GROQ credentials and URL; fall back to env vars
        self.api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
        self.api_url = settings.GROQ_API_URL or os.getenv("GROQ_API_URL", "https://api.groq.com/v1")
        self.client = None
        if self.api_key:
            try:
                self.client = httpx.Client(timeout=20.0)
            except Exception:
                self.client = None

    def chat(self, system_prompt: str, messages: list, tools: list = None) -> dict:
        # If no GROQ key / client configured, use existing mock fallback
        if not self.client:
            return self._mock_chat_response(messages)

        try:
            # Groq-compatible request body is provider-dependent; here we send a simple formatted prompt
            prompt = self._format_prompt(system_prompt, messages)
            payload = {
                "model": "groq-1",
                "input": prompt,
                "temperature": 0.3,
            }
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

            # Attempt call to configured GROQ endpoint
            resp = self.client.post(f"{self.api_url}/chat/completions", json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            # Try to extract text and any tool call structure; providers vary so we fallback safely
            content = ""
            tool_calls = []
            if isinstance(data, dict):
                # common shape: { choices: [{ message: { content: ... } }] }
                choices = data.get("choices") or data.get("outputs") or []
                if choices and isinstance(choices, list):
                    first = choices[0]
                    msg = first.get("message") or first.get("output") or first
                    if isinstance(msg, dict):
                        content = msg.get("content") or msg.get("text") or str(msg)
                    else:
                        content = str(msg)

                # provider-specific tool calls
                if "tool_calls" in data:
                    tool_calls = data["tool_calls"]

            return {"content": content or "", "tool_calls": tool_calls}
        except Exception as e:
            return self._mock_chat_response(messages, error=str(e))

    def _format_prompt(self, system_prompt: str, messages: list) -> str:
        parts = [f"System: {system_prompt}"]
        for m in messages:
            parts.append(f"{m.get('role','user').capitalize()}: {m.get('content','')}")
        return "\n\n".join(parts)

    def _mock_chat_response(self, messages: list, error: str = None) -> dict:
        # Heuristic chat fallback for robust hackathon testing
        user_msg = messages[-1]["content"].lower() if messages else ""

        # Pothole submission simulation
        if "pothole" in user_msg or "broken road" in user_msg or "report" in user_msg:
            return {
                "content": "I can help you file that report! Let me automatically resolve the road authority and check for accident blackspots near you.",
                "tool_calls": [
                    {
                        "id": "call_mock_submit",
                        "name": "submit_complaint",
                        "arguments": '{"title": "Pothole on Main Road", "description": "Large pothole blocking the left lane", "category": "POTHOLE", "lat": 13.08, "lng": 80.27, "is_anonymous": false}'
                    }
                ]
            }
        elif "status" in user_msg or "ticket" in user_msg:
            return {
                "content": "Let me look up the status of your ticket RW-4217 for you.",
                "tool_calls": [
                    {
                        "id": "call_mock_status",
                        "name": "get_ticket_status",
                        "arguments": '{"ticket_id": "447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1"}'
                    }
                ]
            }
        else:
            return {
                "content": "Hello! I am RoadWatch's Citizen AI assistant. I can help you report road issues (potholes, signage, lighting), check local spending budgets, or track active tickets. How can I help you today?",
                "tool_calls": []
            }


llm_client = LlmClient()
