import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_spam_filter_checks():
    mock_response = {
        "verdict": "PASS",
        "confidence": 1.0,
        "flags": [],
        "duplicate_ticket_id": None
    }
    
    with patch("app.services.filter_service.filter_complaint", new_callable=AsyncMock) as mock_filter:
        mock_filter.return_value = mock_response
        
        response = client.post("/api/v1/ai/citizen/ai/filter/complaint", json={
            "lat": 13.08,
            "lng": 80.27,
            "category": "POTHOLE",
            "description": "Very big pothole on center street."
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["verdict"] == "PASS"
        assert data["duplicate_ticket_id"] is None
