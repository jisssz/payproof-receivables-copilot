from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime, date

class EvidenceItem(BaseModel):
    id: str
    type: Literal["invoice_doc", "purchase_order", "delivery_proof", "prior_correspondence"]
    name: str
    status: Literal["attached", "missing", "unverified"] = "missing"
    reference: Optional[str] = None
    notes: Optional[str] = None

class Invoice(BaseModel):
    id: str
    invoice_number: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    amount: float = Field(gt=0, description="Invoice amount in base currency")
    currency: str = "INR"
    issue_date: str
    due_date: str
    payment_status: Literal["draft", "pending", "partially_paid", "overdue", "paid"] = "pending"
    evidence: List[EvidenceItem] = Field(default_factory=list)
    notes: Optional[str] = None
    created_at: Optional[str] = None

class InvoiceCreate(BaseModel):
    invoice_number: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    amount: float = Field(gt=0)
    currency: str = "INR"
    issue_date: str
    due_date: str
    payment_status: Literal["draft", "pending", "partially_paid", "overdue", "paid"] = "pending"
    evidence: Optional[List[EvidenceItem]] = None
    notes: Optional[str] = None

class GenerateReminderRequest(BaseModel):
    invoice: Invoice
    tone: Literal["friendly", "firm", "final_notice"] = "friendly"
    include_evidence_summary: bool = True
    custom_context: Optional[str] = None

class GenerateReminderResponse(BaseModel):
    subject: str
    email_body: str
    whatsapp_body: str
    evidence_readiness_score: int = Field(ge=0, le=100)
    evidence_summary: str
    tone_used: str
    generated_by: Literal["openai", "deterministic_fallback"]
    disclaimer: str

class StatsSummary(BaseModel):
    total_invoices: int
    total_receivables: float
    total_overdue_amount: float
    overdue_count: int
    pending_count: int
    paid_count: int
    evidence_ready_count: int
    average_readiness_score: float
