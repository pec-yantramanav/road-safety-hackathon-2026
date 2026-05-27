import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
@patch("app.dependencies.redis_client", new_callable=AsyncMock)
async def test_chat_session_creation(mock_redis):
    # Mock redis setex
    mock_redis.setex = AsyncMock(return_value=True)
    
    response = client.post("/api/v1/ai/citizen/chat/session", json={"citizen_id": "c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2"})
    assert response.status_code == 200
    assert "session_token" in response.json()

@pytest.mark.asyncio
@patch("app.dependencies.redis_client", new_callable=AsyncMock)
async def test_TC_AI_01_ChatbotHeuristicFallbackMode(mock_redis):
    # Mock redis get returning session data
    session_data = '{"session_token": "token123", "citizen_id": "c2c2c2c2", "messages": [], "language": "en"}'
    mock_redis.get = AsyncMock(return_value=session_data)
    mock_redis.setex = AsyncMock(return_value=True)

    # Test sending a message when API key is missing (fallback triggers)
    response = client.post("/api/v1/ai/citizen/chat/message", json={
        "session_token": "token123",
        "message": "I want to report a broken pothole here"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "tool_calls" in data
    # Assert tool call correctly simulates submit_complaint parameters
    tool_call = data["tool_calls"][0]
    assert tool_call["name"] == "submit_complaint"
