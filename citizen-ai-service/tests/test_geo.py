import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_geo_routing_resolve():
    # Mock resolve_jurisdiction service
    mock_response = {
        "authority_type": "MUNICIPAL",
        "jurisdiction_id": "447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1",
        "jurisdiction_name": "Ward 42 - Chennai Central",
        "is_blackspot": False
    }
    
    with patch("app.services.geo_service.resolve_jurisdiction", new_callable=AsyncMock) as mock_geo:
        mock_geo.return_value = mock_response
        
        response = client.post("/api/v1/ai/citizen/geo/resolve", json={
            "lat": 13.08,
            "lng": 80.27
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["authority_type"] == "MUNICIPAL"
        assert data["jurisdiction_id"] == "447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1"
        assert data["is_blackspot"] is False
