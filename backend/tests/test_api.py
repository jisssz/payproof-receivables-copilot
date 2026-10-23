import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.storage import store

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_store():
    store.reset_to_synthetic_data()

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_list_invoices():
    response = client.get("/api/invoices")
    assert response.status_code == 200
    invoices = response.json()
    assert len(invoices) >= 5
    assert invoices[0]["invoice_number"]

def test_create_invoice_and_deterministic_overdue():
    payload = {
        "invoice_number": "INV-TEST-999",
        "customer_name": "Acme Test Corp",
        "customer_email": "billing@acmetest.com",
        "customer_phone": "+91 90000 00000",
        "amount": 50000.0,
        "currency": "INR",
        "issue_date": "2026-08-01",
        "due_date": "2026-08-15",
        "payment_status": "pending",
        "notes": "Test invoice"
    }
    response = client.post("/api/invoices", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["invoice_number"] == "INV-TEST-999"
    # Past due date must deterministically resolve to overdue
    assert created["payment_status"] == "overdue"
    assert len(created["evidence"]) == 4

def test_create_invoice_invalid_amount():
    payload = {
        "invoice_number": "INV-FAIL-01",
        "customer_name": "Bad Amount Corp",
        "amount": -500.0,  # Invalid amount <= 0
        "issue_date": "2026-10-01",
        "due_date": "2026-10-15",
    }
    response = client.post("/api/invoices", json=payload)
    assert response.status_code == 422

def test_generate_reminder_deterministic():
    # Fetch an existing invoice
    inv_response = client.get("/api/invoices")
    invoices = inv_response.json()
    target_invoice = invoices[0]

    req_payload = {
        "invoice": target_invoice,
        "tone": "firm",
        "include_evidence_summary": True,
        "custom_context": "Previous phone call on Monday"
    }
    response = client.post("/api/generate-reminder", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert "subject" in data
    assert target_invoice["invoice_number"] in data["subject"]
    assert "email_body" in data
    assert "whatsapp_body" in data
    assert data["evidence_readiness_score"] >= 0
    assert data["tone_used"] == "firm"
    assert "disclaimer" in data

def test_stats_endpoint():
    response = client.get("/api/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_invoices"] >= 5
    assert stats["total_receivables"] > 0
    assert stats["overdue_count"] >= 1

def test_cors_preflight_vercel_origin():
    response = client.options(
        "/api/invoices",
        headers={
            "Origin": "https://frontend-nine-woad-g8xvq6ys3s.vercel.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://frontend-nine-woad-g8xvq6ys3s.vercel.app"

