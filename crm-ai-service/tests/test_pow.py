import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_pow_gps_validation_success():
    response = client.post("/api/v1/ai/crm/ai/validate/workorder", json={
        "workorder_id": "87878787-8787-8787-8787-878787878787",
        "ticket_lat": 13.061,
        "ticket_lng": 80.281,
        "before_photo_url": "http://mock.com/before.jpg",
        "after_photo_url": "http://mock.com/after.jpg"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "APPROVED"
    assert data["location_match"] is True

def test_pow_missing_photo_rejection():
    response = client.post("/api/v1/ai/crm/ai/validate/workorder", json={
        "workorder_id": "87878787-8787-8787-8787-878787878787",
        "ticket_lat": 13.061,
        "ticket_lng": 80.281,
        "before_photo_url": None,
        "after_photo_url": None
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"] == "REJECTED"
    assert data["location_match"] is False
    assert "MISSING_AFTER_PHOTO" in data["flags"]
