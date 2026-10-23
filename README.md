# PayProof — Receivables Copilot

> **Empowering small businesses to organise overdue invoice evidence and draft calibrated, dispute-resistant payment follow-ups.**

Built for the **AIBoomi Startup Hackathon** by:
- **Jis Shajan — Technical Lead:** Full-Stack Architecture, AI & API Engineering, Verification & Deployment.
- **Angelin Gino — Product & Design Lead:** Product Strategy, UX/UI Direction, User Research, Pitch & Quality Assurance.

---

## 1. Problem Statement

Small businesses face an existential cash flow bottleneck:
1. **Empty-handed follow-ups**: Chasing overdue clients without proof often leads to delay tactics ("We never received this PO" or "Where is the delivery gate pass?").
2. **Missing evidence at escalation**: Vendors discover missing delivery receipts or unapproved change orders weeks after delivery when payment is already late.
3. **Imbalanced tone**: Communications swing between overly timid reminders (easily ignored) and hostile legal threats that destroy valuable client relationships.

## 2. The Solution: PayProof

PayProof introduces **Evidence-First Receivables Management**:
- **Deterministic Ageing & Calculations**: Financial amounts and overdue statuses are calculated via deterministic code, ensuring zero arithmetic hallucinations.
- **Evidence Readiness Checklist**: Pre-flight verification of the 4 key B2B payment pillars before follow-up:
  1. Tax Invoice Document (`35%`)
  2. Purchase Order / SOW (`25%`)
  3. Proof of Delivery / Gate Pass / Sign-off (`25%`)
  4. Prior Correspondence / Acknowledgment (`15%`)
- **AI Follow-Up Copilot**: Drafts professional, tone-calibrated payment reminders (Friendly Reminder, Firm Follow-up, Formal Pre-Escalation Notice) in both Email and WhatsApp format, citing only verified evidence.
- **Deterministic Fallback Engine**: If the AI API is offline or unconfigured, PayProof uses built-in compliant business templates—guaranteeing 100% demo reliability.
- **Human-in-the-Loop & Export**: Live editable drafts, one-click copy, and full CSV reconciliation export.

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend API**: Python 3.11, FastAPI, Pydantic v2, Uvicorn, Python-dotenv.
- **AI Integration**: OpenAI GPT-4o-mini with fallback to deterministic templates.
- **Deployment**:
  - Frontend: Vercel SPA (`vercel.json`)
  - Backend: Render Web Service (`render.yaml`)

---

## 4. Quickstart: Local Development

### Prerequisites
- Node.js 18+ & npm
- Python 3.9+

### A. Run Backend API
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend runs at `http://localhost:8000`. Test the health check at `http://localhost:8000/api/health`.

### B. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Automated Tests

Run backend unit and integration test suite:
```bash
cd backend
PYTHONPATH=. .venv/bin/pytest tests/test_api.py -v
```

---

## 6. Deployment Guide

### Deploy Backend on Render
1. Push this repository to GitHub.
2. In Render, select **New > Blueprint** and link the repository.
3. Render reads `render.yaml` automatically:
   - Root directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health check: `/api/health`
4. In Render dashboard, optionally add `OPENAI_API_KEY`.

### Deploy Frontend on Vercel
1. In Vercel, import the GitHub repository.
2. Set Root Directory to `frontend`.
3. Set Environment Variable: `VITE_API_URL` = Your Render backend URL (e.g. `https://payproof-backend.onrender.com`).
4. Deploy!

---

## 7. Ethical Safeguards & Hackathon Integrity

- **Deterministic Financials**: All totals, overdue counts, and aging calculations are strictly deterministic; no LLM handles financial numbers.
- **Evidence Verification**: The AI copilot never invents documents or delivery slips; it only references evidence marked as "attached".
- **Non-Legal Disclaimer**: Prominently displays: *"PayProof provides administrative communication assistance and evidence organisation. It does not provide formal legal counsel or guarantee debt recovery."*
- **Independent Origin**: Genuinely developed from scratch for AIBoomi Startup Weekend. LMCC/JAMH X4 code was inspected solely in read-only mode for architectural reference; zero application code was imported or reused.
