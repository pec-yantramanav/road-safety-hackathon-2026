import os
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_utilization_certificate_pdf_generation():
    workorder_id = "87878787-8787-8787-8787-878787878787"
    officer_id = "b9b9a674-ec0a-4fb4-bbab-fb605eb8716b"
    
    response = client.post("/api/v1/ai/crm/ai/generate/uc", json={
        "workorder_id": workorder_id,
        "officer_id": officer_id
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "document_url" in data
    assert f"uc-{workorder_id}.pdf" in data["document_url"]
    
    # Assert physical PDF exists in local directory static/uc/
    pdf_path = f"static/uc/uc-{workorder_id}.pdf"
    assert os.path.exists(pdf_path) is True
    
    # Cleanup generated test PDF
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
