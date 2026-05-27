import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_sla_breach_prediction_endpoint():
    response = client.post("/api/v1/ai/crm/ai/sla/predict", json={
        "ticket_id": "e4a8b792-7482-4fae-bd32-8409e6c981a2",
        "assigned_officer_id": "447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1",
        "current_status": "OPEN",
        "category": "POTHOLE",
        "priority": "NORMAL"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "breach_likely" in data
    assert "recommended_action" in data
    assert data["recommended_action"] == "ESCALATE_NOW"
