import os
import json
from datetime import datetime, date
from typing import Dict, Any, Tuple
import httpx
from ..models import Invoice, GenerateReminderRequest, GenerateReminderResponse

DISCLAIMER_TEXT = (
    "Notice: PayProof provides administrative communication assistance and evidence readiness tracking. "
    "It does not constitute formal legal counsel and does not guarantee payment recovery."
)

def calculate_evidence_score(invoice: Invoice) -> Tuple[int, str]:
    """
    Deterministic scoring:
    - invoice_doc: 35 points
    - purchase_order: 25 points
    - delivery_proof: 25 points
    - prior_correspondence: 15 points
    """
    weights = {
        "invoice_doc": 35,
        "purchase_order": 25,
        "delivery_proof": 25,
        "prior_correspondence": 15
    }
    score = 0
    attached = []
    missing = []

    for item in invoice.evidence:
        if item.status == "attached":
            score += weights.get(item.type, 10)
            ref_str = f" ({item.reference})" if item.reference else ""
            attached.append(f"{item.name}{ref_str}")
        else:
            missing.append(item.name)

    score = min(100, score)
    
    summary_parts = []
    if attached:
        summary_parts.append(f"Attached evidence: {', '.join(attached)}")
    if missing:
        summary_parts.append(f"Missing evidence: {', '.join(missing)}")
    if not summary_parts:
        summary_parts.append("No evidence records evaluated.")

    return score, "; ".join(summary_parts)

def generate_deterministic_reminder(req: GenerateReminderRequest, score: int, summary: str) -> GenerateReminderResponse:
    inv = req.invoice
    fmt_amount = f"{inv.currency} {inv.amount:,.2f}"

    attached_names = [e.name for e in inv.evidence if e.status == "attached"]
    evidence_clause = ""
    if req.include_evidence_summary and attached_names:
        evidence_clause = f"\n\nFor your convenience, we have verified and attached the supporting records: {', '.join(attached_names)}."

    context_clause = f"\n\nNote: {req.custom_context}" if req.custom_context else ""

    if req.tone == "friendly":
        subject = f"Friendly Reminder: Invoice {inv.invoice_number} ({fmt_amount}) is Due"
        email_body = (
            f"Dear {inv.customer_name},\n\n"
            f"I hope you are having a productive week.\n\n"
            f"This is a gentle reminder regarding Invoice {inv.invoice_number} for {fmt_amount}, "
            f"which was issued on {inv.issue_date} and was due for settlement on {inv.due_date}.\n\n"
            f"Could you please confirm if this invoice has been scheduled for payment, or let us know "
            f"if any additional verification is needed from our end?{evidence_clause}{context_clause}\n\n"
            f"Thank you for your valued partnership.\n\n"
            f"Warm regards,\n"
            f"Accounts Receivable Team"
        )
        whatsapp_body = (
            f"Hi {inv.customer_name}, gentle reminder regarding Invoice *{inv.invoice_number}* "
            f"for *{fmt_amount}* (due: {inv.due_date}). Please let us know once scheduled or if you need "
            f"any supporting records resent. Thank you!"
        )
    elif req.tone == "firm":
        subject = f"Urgent Follow-Up: Overdue Invoice {inv.invoice_number} ({fmt_amount})"
        email_body = (
            f"Dear {inv.customer_name},\n\n"
            f"We are writing to follow up on Invoice {inv.invoice_number} for the amount of {fmt_amount}, "
            f"which matured on {inv.due_date} and is currently outstanding in our records.\n\n"
            f"We have previously supplied the necessary delivery confirmations and documentation "
            f"per our agreed payment terms.{evidence_clause}{context_clause}\n\n"
            f"Please review the status with your finance team and confirm the payment transaction "
            f"reference by return email.\n\n"
            f"Sincerely,\n"
            f"Finance & Credit Control"
        )
        whatsapp_body = (
            f"Dear {inv.customer_name}, following up on overdue Invoice *{inv.invoice_number}* "
            f"({fmt_amount}, matured {inv.due_date}). Kindly provide the payment update or transaction "
            f"reference today to keep accounts in good standing. Thank you."
        )
    else:  # final_notice
        subject = f"FORMAL NOTICE: Overdue Payment Required for Invoice {inv.invoice_number}"
        email_body = (
            f"Dear {inv.customer_name},\n\n"
            f"RE: Final Notice for Settlement of Invoice {inv.invoice_number} — {fmt_amount}\n\n"
            f"Our records indicate that despite previous reminders, Invoice {inv.invoice_number} "
            f"remains unpaid past its due date of {inv.due_date}.\n\n"
            f"All supporting documentation, including customer purchase authorization and delivery "
            f"confirmation, has been compiled into our evidence package.{evidence_clause}{context_clause}\n\n"
            f"Please arrange immediate remittance within 3 business days to prevent disruption to "
            f"future orders or formal escalation under commercial credit terms.\n\n"
            f"Regards,\n"
            f"Credit & Receivables Management"
        )
        whatsapp_body = (
            f"IMPORTANT: Final notice regarding overdue Invoice *{inv.invoice_number}* ({fmt_amount}). "
            f"Please initiate payment within 3 business days or contact finance urgently. Thank you."
        )

    return GenerateReminderResponse(
        subject=subject,
        email_body=email_body,
        whatsapp_body=whatsapp_body,
        evidence_readiness_score=score,
        evidence_summary=summary,
        tone_used=req.tone,
        generated_by="deterministic_fallback",
        disclaimer=DISCLAIMER_TEXT
    )

async def generate_ai_reminder(req: GenerateReminderRequest) -> GenerateReminderResponse:
    score, summary = calculate_evidence_score(req.invoice)
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key or api_key.strip() in ("", "placeholder", "your_openai_api_key_here"):
        return generate_deterministic_reminder(req, score, summary)

    system_prompt = (
        "You are PayProof's professional B2B Receivables Copilot. "
        "Your task is to write clear, polite, factual payment reminders for small businesses. "
        "Rules:\n"
        "1. Strictly use the provided invoice data: customer name, invoice number, amount, currency, and dates.\n"
        "2. Do NOT invent documents, delivery receipts, or facts not present in the evidence summary.\n"
        "3. Do NOT make unsupported legal claims, threaten court litigation, or guarantee debt recovery.\n"
        "4. Tone must match requested tone: 'friendly', 'firm', or 'final_notice'.\n"
        "5. Return a strict JSON object with keys: subject, email_body, whatsapp_body."
    )

    user_payload = {
        "invoice_number": req.invoice.invoice_number,
        "customer_name": req.invoice.customer_name,
        "amount": req.invoice.amount,
        "currency": req.invoice.currency,
        "issue_date": req.invoice.issue_date,
        "due_date": req.invoice.due_date,
        "tone": req.tone,
        "evidence_summary": summary,
        "evidence_readiness_score": score,
        "custom_context": req.custom_context
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": json.dumps(user_payload)}
                    ],
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                }
            )
            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return GenerateReminderResponse(
                    subject=parsed.get("subject", f"Payment Reminder: Invoice {req.invoice.invoice_number}"),
                    email_body=parsed.get("email_body", ""),
                    whatsapp_body=parsed.get("whatsapp_body", ""),
                    evidence_readiness_score=score,
                    evidence_summary=summary,
                    tone_used=req.tone,
                    generated_by="openai",
                    disclaimer=DISCLAIMER_TEXT
                )
    except Exception:
        # Fall back gracefully to deterministic logic
        pass

    return generate_deterministic_reminder(req, score, summary)
