import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import (
    Invoice,
    InvoiceCreate,
    GenerateReminderRequest,
    GenerateReminderResponse,
    StatsSummary,
)
from .storage import store
from .services.ai_copilot import generate_ai_reminder

load_dotenv()

app = FastAPI(
    title="PayProof — Receivables Copilot API",
    description="Backend API for small business invoice evidence readiness and AI payment follow-up.",
    version="1.0.0",
)

# CORS configuration
allowed_origins_env = os.getenv("FRONTEND_ORIGINS", "")
custom_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]
base_origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
]
allowed_origins = list(set(base_origins + custom_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PayProof — Receivables Copilot Backend",
        "version": "1.0.0",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "uptime": "operational"
    }

@app.get("/api/stats", response_model=StatsSummary)
def get_stats():
    return store.get_stats()

@app.get("/api/invoices", response_model=List[Invoice])
def list_invoices(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None)
):
    invoices = store.list_all()
    if status_filter and status_filter != "all":
        invoices = [inv for inv in invoices if inv.payment_status == status_filter]
    if search:
        s = search.lower()
        invoices = [
            inv for inv in invoices
            if s in inv.customer_name.lower() or s in inv.invoice_number.lower()
        ]
    return invoices

@app.post("/api/invoices", response_model=Invoice, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceCreate):
    return store.create(payload)

@app.get("/api/invoices/{invoice_id}", response_model=Invoice)
def get_invoice(invoice_id: str):
    inv = store.get(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv

@app.put("/api/invoices/{invoice_id}", response_model=Invoice)
def update_invoice(invoice_id: str, payload: Invoice):
    updated = store.update(invoice_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return updated

@app.delete("/api/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: str):
    success = store.delete(invoice_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return None

@app.post("/api/invoices/reset-demo", response_model=List[Invoice])
def reset_demo_data():
    store.reset_to_synthetic_data()
    return store.list_all()

@app.post("/api/generate-reminder", response_model=GenerateReminderResponse)
async def generate_reminder(request: GenerateReminderRequest):
    return await generate_ai_reminder(request)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
