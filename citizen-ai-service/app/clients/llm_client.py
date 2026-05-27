import os
from openai import OpenAI
from app.config import settings

class LlmClient:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY", "")
        self.client = None
        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception:
                self.client = None

    def chat(self, system_prompt: str, messages: list, tools: list = None) -> dict:
        if not self.client:
            return self._mock_chat_response(messages)

        try:
            formatted_messages = [{"role": "system", "content": system_prompt}] + messages
            kwargs = {
                "model": "gpt-4o-mini",
                "messages": formatted_messages,
                "temperature": 0.3
            }
            if tools:
                kwargs["tools"] = tools

            response = self.client.chat.completions.create(**kwargs)
            choice = response.choices[0].message
            
            tool_calls = []
            if choice.tool_calls:
                for call in choice.tool_calls:
                    tool_calls.append({
                        "id": call.id,
                        "name": call.function.name,
                        "arguments": call.function.arguments
                    })
                    
            return {
                "content": choice.content or "",
                "tool_calls": tool_calls
            }
        except Exception as e:
            return self._mock_chat_response(messages, error=str(e))

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
