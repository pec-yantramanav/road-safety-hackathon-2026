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
            return self._mock_officer_response(messages)

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
            return self._mock_officer_response(messages, error=str(e))

    def _mock_officer_response(self, messages: list, error: str = None) -> dict:
        user_msg = messages[-1]["content"].lower() if messages else ""
        
        # Tools definitions: JE vs EE
        if "list" in user_msg or "ticket" in user_msg or "show" in user_msg:
            return {
                "content": "Let me look up the active tickets inside your division for you.",
                "tool_calls": [
                    {
                        "id": "call_mock_list",
                        "name": "list_tickets",
                        "arguments": '{"jurisdiction_id": "447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1"}'
                    }
                ]
            }
        elif "budget" in user_msg or "scheme" in user_msg or "spending" in user_msg:
            return {
                "content": "Here is the current budget scheme utilization for your division.",
                "tool_calls": [
                    {
                        "id": "call_mock_budget",
                        "name": "get_budget_summary",
                        "arguments": '{"jurisdiction_id": "447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1"}'
                    }
                ]
            }
        else:
            return {
                "content": "Hello Engineer! I am RoadWatch's Officer AI assistant. I can help you list active grievances, query budget utilization schemes, analyze contractor performance, or track pending approvals. How can I help you?",
                "tool_calls": []
            }

llm_client = LlmClient()
