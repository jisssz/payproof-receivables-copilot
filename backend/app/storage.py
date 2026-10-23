import json
import uuid
from typing import List, Optional, Dict
from datetime import datetime, date
from .models import Invoice, InvoiceCreate, EvidenceItem, StatsSummary

INITIAL_SYNTHETIC_INVOICES: List[Dict] = [
    {
        "id": "inv-001",
        "invoice_number": "INV-2026-042",
        "customer_name": "Metro Retailers Syndicate",
        "customer_email": "accounts@metroretailers.in",
        "customer_phone": "+91 98201 44521",
        "amount": 342000.0,
        "currency": "INR",
        "issue_date": "2026-08-15",
        "due_date": "2026-09-15",
        "payment_status": "overdue",
        "notes": "Bulk packaging consignment delivered to Pune central warehouse.",
        "created_at": "2026-08-15T10:00:00Z",
        "evidence": [
            {
                "id": "ev-01",
                "type": "invoice_doc",
                "name": "Tax Invoice INV-2026-042.pdf",
                "status": "attached",
                "reference": "SHA256: 8a4f9... signed",
                "notes": "Original GST tax invoice"
            },
            {
                "id": "ev-02",
                "type": "purchase_order",
                "name": "Customer PO #MRS-9921",
                "status": "attached",
                "reference": "PO-MRS-9921",
                "notes": "Approved by VP Procurement"
            },
            {
                "id": "ev-03",
                "type": "delivery_proof",
                "name": "Signed Gate Pass & Lorry Receipt (LR)",
                "status": "attached",
                "reference": "LR-Pune-88124",
                "notes": "Stamped and acknowledged by store manager"
            },
            {
                "id": "ev-04",
                "type": "prior_correspondence",
                "name": "Reminder Email on Sep 22",
                "status": "attached",
                "reference": "Msg-ID: em-99824",
                "notes": "Accounts confirmed invoice under verification"
            }
        ]
    },
    {
        "id": "inv-002",
        "invoice_number": "INV-2026-089",
        "customer_name": "Apex Cloud Solutions Pvt Ltd",
        "customer_email": "finance@apexcloud.co",
        "customer_phone": "+91 98450 11234",
        "amount": 185000.0,
        "currency": "INR",
        "issue_date": "2026-09-01",
        "due_date": "2026-10-01",
        "payment_status": "overdue",
        "notes": "Milestone 2 Backend Architecture & Cloud Infrastructure sprint.",
        "created_at": "2026-09-01T11:30:00Z",
        "evidence": [
            {
                "id": "ev-05",
                "type": "invoice_doc",
                "name": "Tax Invoice INV-2026-089.pdf",
                "status": "attached",
                "reference": "INV-089-GST",
                "notes": "E-invoiced with IRN QR"
            },
            {
                "id": "ev-06",
                "type": "purchase_order",
                "name": "SOW & Master Service Agreement",
                "status": "attached",
                "reference": "MSA-2026-Q3",
                "notes": "Signed digitally"
            },
            {
                "id": "ev-07",
                "type": "delivery_proof",
                "name": "Milestone Acceptance Sign-Off",
                "status": "missing",
                "reference": None,
                "notes": "Client product manager has not replied to sign-off email"
            },
            {
                "id": "ev-08",
                "type": "prior_correspondence",
                "name": "Follow-up Slack thread",
                "status": "missing",
                "reference": None,
                "notes": "Awaiting written confirmation"
            }
        ]
    },
    {
        "id": "inv-003",
        "invoice_number": "INV-2026-114",
        "customer_name": "Zenith Fasteners & Logistics",
        "customer_email": "payables@zenithfasteners.com",
        "customer_phone": "+91 94471 90021",
        "amount": 64500.0,
        "currency": "INR",
        "issue_date": "2026-10-10",
        "due_date": "2026-10-25",
        "payment_status": "pending",
        "notes": "Supply of standard packaging hardware containers.",
        "created_at": "2026-10-10T09:15:00Z",
        "evidence": [
            {
                "id": "ev-09",
                "type": "invoice_doc",
                "name": "Tax Invoice INV-2026-114.pdf",
                "status": "attached",
                "reference": "INV-114",
                "notes": "Sent via email"
            },
            {
                "id": "ev-10",
                "type": "purchase_order",
                "name": "PO #ZF-882",
                "status": "attached",
                "reference": "ZF-882",
                "notes": "Direct purchase order"
            },
            {
                "id": "ev-11",
                "type": "delivery_proof",
                "name": "Courier Pod Slip #DTDC-9921",
                "status": "attached",
                "reference": "DTDC-9921",
                "notes": "Delivered Oct 12"
            },
            {
                "id": "ev-12",
                "type": "prior_correspondence",
                "name": "Delivery acknowledgment",
                "status": "unverified",
                "reference": None,
                "notes": "Sent notification"
            }
        ]
    },
    {
        "id": "inv-004",
        "invoice_number": "INV-2026-128",
        "customer_name": "BluePeak Brand Media",
        "customer_email": "accounts@bluepeakmedia.in",
        "customer_phone": "+91 97112 55432",
        "amount": 95000.0,
        "currency": "INR",
        "issue_date": "2026-10-18",
        "due_date": "2026-11-02",
        "payment_status": "pending",
        "notes": "Brand identity guide and digital collateral package.",
        "created_at": "2026-10-18T14:20:00Z",
        "evidence": [
            {
                "id": "ev-13",
                "type": "invoice_doc",
                "name": "Tax Invoice INV-2026-128.pdf",
                "status": "attached",
                "reference": "INV-128",
                "notes": "Generated in billing software"
            },
            {
                "id": "ev-14",
                "type": "purchase_order",
                "name": "Client Purchase Order",
                "status": "missing",
                "reference": None,
                "notes": "Work commenced on verbal email approval"
            },
            {
                "id": "ev-15",
                "type": "delivery_proof",
                "name": "Asset delivery receipt",
                "status": "missing",
                "reference": None,
                "notes": "Shared via cloud link; no formal signoff"
            },
            {
                "id": "ev-16",
                "type": "prior_correspondence",
                "name": "Email approval thread",
                "status": "attached",
                "reference": "Thread-BluePeak-Brand",
                "notes": "Approval of final Figma handover"
            }
        ]
    },
    {
        "id": "inv-005",
        "invoice_number": "INV-2026-015",
        "customer_name": "Lifeline Diagnostics & Labs",
        "customer_email": "billing@lifelinediagnostics.org",
        "customer_phone": "+91 99002 88471",
        "amount": 112000.0,
        "currency": "INR",
        "issue_date": "2026-07-20",
        "due_date": "2026-08-20",
        "payment_status": "paid",
        "notes": "Laboratory consumable supplies. Settled via NEFT.",
        "created_at": "2026-07-20T16:00:00Z",
        "evidence": [
            {
                "id": "ev-17",
                "type": "invoice_doc",
                "name": "Invoice INV-2026-015.pdf",
                "status": "attached",
                "reference": "INV-015",
                "notes": "Settled on 2026-10-20"
            },
            {
                "id": "ev-18",
                "type": "purchase_order",
                "name": "PO #LD-4412",
                "status": "attached",
                "reference": "PO-LD-4412",
                "notes": "Archived"
            },
            {
                "id": "ev-19",
                "type": "delivery_proof",
                "name": "Medical store acknowledgement",
                "status": "attached",
                "reference": "REC-7731",
                "notes": "Verified"
            },
            {
                "id": "ev-20",
                "type": "prior_correspondence",
                "name": "Payment advice voucher",
                "status": "attached",
                "reference": "UTR-HDFC-9912048",
                "notes": "UTR received"
            }
        ]
    }
]

class InMemoryInvoiceStore:
    def __init__(self):
        self._invoices: Dict[str, Invoice] = {}
        self.reset_to_synthetic_data()

    def reset_to_synthetic_data(self):
        self._invoices.clear()
        for item in INITIAL_SYNTHETIC_INVOICES:
            inv = Invoice(**item)
            self._invoices[inv.id] = inv

    def list_all(self) -> List[Invoice]:
        # Return sorted by due_date ascending
        return sorted(self._invoices.values(), key=lambda x: x.due_date)

    def get(self, invoice_id: str) -> Optional[Invoice]:
        return self._invoices.get(invoice_id)

    def create(self, data: InvoiceCreate) -> Invoice:
        new_id = f"inv-{uuid.uuid4().hex[:6]}"
        now_str = datetime.utcnow().isoformat() + "Z"
        
        # Default checklist if not provided
        evidence_list = data.evidence or [
            EvidenceItem(
                id=f"ev-{uuid.uuid4().hex[:4]}",
                type="invoice_doc",
                name=f"Tax Invoice {data.invoice_number}.pdf",
                status="attached",
                reference=f"INV-{data.invoice_number}",
                notes="Generated upon creation"
            ),
            EvidenceItem(
                id=f"ev-{uuid.uuid4().hex[:4]}",
                type="purchase_order",
                name="Customer Purchase Order (PO)",
                status="missing",
                reference=None,
                notes="Requires verification"
            ),
            EvidenceItem(
                id=f"ev-{uuid.uuid4().hex[:4]}",
                type="delivery_proof",
                name="Delivery Confirmation / Gate Pass / Sign-off",
                status="missing",
                reference=None,
                notes="Requires verification"
            ),
            EvidenceItem(
                id=f"ev-{uuid.uuid4().hex[:4]}",
                type="prior_correspondence",
                name="Email / WhatsApp Payment Follow-up",
                status="missing",
                reference=None,
                notes="Not yet sent"
            ),
        ]

        # Calculate overdue deterministically based on today
        today_iso = date.today().isoformat()
        status = data.payment_status
        if status != "paid" and data.due_date < today_iso:
            status = "overdue"

        inv = Invoice(
            id=new_id,
            invoice_number=data.invoice_number,
            customer_name=data.customer_name,
            customer_email=data.customer_email,
            customer_phone=data.customer_phone,
            amount=data.amount,
            currency=data.currency,
            issue_date=data.issue_date,
            due_date=data.due_date,
            payment_status=status,
            evidence=evidence_list,
            notes=data.notes,
            created_at=now_str
        )
        self._invoices[new_id] = inv
        return inv

    def update(self, invoice_id: str, updated_invoice: Invoice) -> Optional[Invoice]:
        if invoice_id not in self._invoices:
            return None
        self._invoices[invoice_id] = updated_invoice
        return updated_invoice

    def delete(self, invoice_id: str) -> bool:
        if invoice_id in self._invoices:
            del self._invoices[invoice_id]
            return True
        return False

    def get_stats(self) -> StatsSummary:
        invoices = list(self._invoices.values())
        total_invoices = len(invoices)
        total_receivables = sum(i.amount for i in invoices if i.payment_status != "paid")
        total_overdue = sum(i.amount for i in invoices if i.payment_status == "overdue")
        overdue_count = sum(1 for i in invoices if i.payment_status == "overdue")
        pending_count = sum(1 for i in invoices if i.payment_status in ("pending", "partially_paid"))
        paid_count = sum(1 for i in invoices if i.payment_status == "paid")

        readiness_scores = []
        ready_count = 0
        for inv in invoices:
            score = 0
            weights = {"invoice_doc": 35, "purchase_order": 25, "delivery_proof": 25, "prior_correspondence": 15}
            for e in inv.evidence:
                if e.status == "attached":
                    score += weights.get(e.type, 10)
            score = min(100, score)
            readiness_scores.append(score)
            if score >= 75:
                ready_count += 1

        avg_score = (sum(readiness_scores) / total_invoices) if total_invoices > 0 else 0.0

        return StatsSummary(
            total_invoices=total_invoices,
            total_receivables=total_receivables,
            total_overdue_amount=total_overdue,
            overdue_count=overdue_count,
            pending_count=pending_count,
            paid_count=paid_count,
            evidence_ready_count=ready_count,
            average_readiness_score=round(avg_score, 1)
        )

store = InMemoryInvoiceStore()
