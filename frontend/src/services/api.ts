import {
  Invoice,
  InvoiceCreate,
  GenerateReminderRequest,
  GenerateReminderResponse,
  StatsSummary,
} from '../types';
import { INITIAL_MOCK_INVOICES } from '../data/mockData';

const ENV_API_URL = import.meta.env.VITE_API_URL;
export const API_BASE = (ENV_API_URL && ENV_API_URL.trim() !== '')
  ? ENV_API_URL.trim().replace(/\/$/, '')
  : (import.meta.env.PROD ? 'https://payproof-backend.onrender.com' : '');

export const calculateEvidenceScore = (invoice: Invoice): { score: number; summary: string } => {
  const weights: Record<string, number> = {
    invoice_doc: 35,
    purchase_order: 25,
    delivery_proof: 25,
    prior_correspondence: 15,
  };
  let score = 0;
  const attached: string[] = [];
  const missing: string[] = [];

  for (const item of invoice.evidence) {
    if (item.status === 'attached') {
      score += weights[item.type] || 10;
      attached.push(item.name + (item.reference ? ` (${item.reference})` : ''));
    } else {
      missing.push(item.name);
    }
  }

  score = Math.min(100, score);
  const parts: string[] = [];
  if (attached.length > 0) parts.push(`Attached evidence: ${attached.join(', ')}`);
  if (missing.length > 0) parts.push(`Missing evidence: ${missing.join(', ')}`);

  return {
    score,
    summary: parts.join('; ') || 'No evidence evaluated',
  };
};

export const fallbackStats = (invoices: Invoice[]): StatsSummary => {
  const total = invoices.length;
  const totalReceivables = invoices
    .filter((i) => i.payment_status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices
    .filter((i) => i.payment_status === 'overdue')
    .reduce((sum, i) => sum + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.payment_status === 'overdue').length;
  const pendingCount = invoices.filter((i) =>
    ['pending', 'partially_paid'].includes(i.payment_status)
  ).length;
  const paidCount = invoices.filter((i) => i.payment_status === 'paid').length;

  let readyCount = 0;
  let totalScore = 0;
  for (const inv of invoices) {
    const { score } = calculateEvidenceScore(inv);
    totalScore += score;
    if (score >= 75) readyCount += 1;
  }
  const avg = total > 0 ? totalScore / total : 0;

  return {
    total_invoices: total,
    total_receivables: totalReceivables,
    total_overdue_amount: totalOverdue,
    overdue_count: overdueCount,
    pending_count: pendingCount,
    paid_count: paidCount,
    evidence_ready_count: readyCount,
    average_readiness_score: Math.round(avg * 10) / 10,
  };
};

export const fallbackGenerateReminder = (
  req: GenerateReminderRequest
): GenerateReminderResponse => {
  const inv = req.invoice;
  const { score, summary } = calculateEvidenceScore(inv);
  const fmtAmount = `${inv.currency} ${inv.amount.toLocaleString('en-IN')}`;

  const attachedNames = inv.evidence
    .filter((e) => e.status === 'attached')
    .map((e) => e.name);

  const evidenceClause =
    req.include_evidence_summary && attachedNames.length > 0
      ? `\n\nFor your reference, our records confirm the attached supporting documents: ${attachedNames.join(', ')}.`
      : '';

  const contextClause = req.custom_context ? `\n\nNote: ${req.custom_context}` : '';

  let subject = '';
  let emailBody = '';
  let whatsappBody = '';

  if (req.tone === 'friendly') {
    subject = `Friendly Reminder: Invoice ${inv.invoice_number} (${fmtAmount}) is Due`;
    emailBody =
      `Dear ${inv.customer_name},\n\n` +
      `I hope you are having a productive week.\n\n` +
      `This is a gentle reminder regarding Invoice ${inv.invoice_number} for ${fmtAmount}, ` +
      `which was issued on ${inv.issue_date} and was due for settlement on ${inv.due_date}.\n\n` +
      `Could you please confirm if this invoice has been scheduled for payment, or let us know ` +
      `if any additional verification is needed from our end?${evidenceClause}${contextClause}\n\n` +
      `Thank you for your valued partnership.\n\n` +
      `Warm regards,\n` +
      `Accounts Receivable Team`;
    whatsappBody = `Hi ${inv.customer_name}, gentle reminder regarding Invoice *${inv.invoice_number}* for *${fmtAmount}* (due: ${inv.due_date}). Please let us know once scheduled or if you need any supporting records resent. Thank you!`;
  } else if (req.tone === 'firm') {
    subject = `Urgent Follow-Up: Overdue Invoice ${inv.invoice_number} (${fmtAmount})`;
    emailBody =
      `Dear ${inv.customer_name},\n\n` +
      `We are writing to follow up on Invoice ${inv.invoice_number} for the amount of ${fmtAmount}, ` +
      `which matured on ${inv.due_date} and is currently outstanding in our records.\n\n` +
      `We have previously supplied the necessary delivery confirmations and documentation ` +
      `per our agreed payment terms.${evidenceClause}${contextClause}\n\n` +
      `Please review the status with your finance team and confirm the payment transaction ` +
      `reference by return email.\n\n` +
      `Sincerely,\n` +
      `Finance & Credit Control`;
    whatsappBody = `Dear ${inv.customer_name}, following up on overdue Invoice *${inv.invoice_number}* (${fmtAmount}, matured ${inv.due_date}). Kindly provide the payment update or transaction reference today to keep accounts in good standing. Thank you.`;
  } else {
    subject = `FORMAL NOTICE: Overdue Payment Required for Invoice ${inv.invoice_number}`;
    emailBody =
      `Dear ${inv.customer_name},\n\n` +
      `RE: Final Notice for Settlement of Invoice ${inv.invoice_number} — ${fmtAmount}\n\n` +
      `Our records indicate that despite previous reminders, Invoice ${inv.invoice_number} ` +
      `remains unpaid past its due date of ${inv.due_date}.\n\n` +
      `All supporting documentation, including customer purchase authorization and delivery ` +
      `confirmation, has been compiled into our evidence package.${evidenceClause}${contextClause}\n\n` +
      `Please arrange immediate remittance within 3 business days to prevent disruption to ` +
      `future orders or formal escalation under commercial credit terms.\n\n` +
      `Regards,\n` +
      `Credit & Receivables Management`;
    whatsappBody = `IMPORTANT: Final notice regarding overdue Invoice *${inv.invoice_number}* (${fmtAmount}). Please initiate payment within 3 business days or contact finance urgently. Thank you.`;
  }

  return {
    subject,
    email_body: emailBody,
    whatsapp_body: whatsappBody,
    evidence_readiness_score: score,
    evidence_summary: summary,
    tone_used: req.tone,
    generated_by: 'deterministic_fallback',
    disclaimer:
      'Notice: PayProof provides administrative communication assistance and evidence readiness tracking. It does not constitute formal legal counsel and does not guarantee payment recovery.',
  };
};

export const api = {
  async getHealth(): Promise<{ status: string; uptime?: string; service?: string } | null> {
    try {
      const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return await res.json();
    } catch {
      // Backend waking up or offline
    }
    return null;
  },

  async getStats(): Promise<StatsSummary> {
    try {
      const res = await fetch(`${API_BASE}/api/stats`, { credentials: 'omit' });
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return fallbackStats(api.getLocalInvoices());
  },

  getLocalInvoices(): Invoice[] {
    const raw = localStorage.getItem('payproof_invoices');
    if (!raw) {
      localStorage.setItem('payproof_invoices', JSON.stringify(INITIAL_MOCK_INVOICES));
      return INITIAL_MOCK_INVOICES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_MOCK_INVOICES;
    }
  },

  setLocalInvoices(invoices: Invoice[]) {
    localStorage.setItem('payproof_invoices', JSON.stringify(invoices));
  },

  async getInvoices(statusFilter?: string, search?: string): Promise<Invoice[]> {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);

      const url = `${API_BASE}/api/invoices${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        this.setLocalInvoices(data);
        return data;
      }
    } catch {
      // Use local fallback
    }

    let invoices = this.getLocalInvoices();
    if (statusFilter && statusFilter !== 'all') {
      invoices = invoices.filter((i) => i.payment_status === statusFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      invoices = invoices.filter(
        (i) =>
          i.customer_name.toLowerCase().includes(s) ||
          i.invoice_number.toLowerCase().includes(s)
      );
    }
    return invoices;
  },

  async createInvoice(payload: InvoiceCreate): Promise<Invoice> {
    try {
      const res = await fetch(`${API_BASE}/api/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        const current = this.getLocalInvoices();
        this.setLocalInvoices([created, ...current]);
        return created;
      }
    } catch {
      // Local fallback creation
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = payload.due_date < todayStr;
    const newInv: Invoice = {
      id: `inv-${Date.now().toString(36)}`,
      invoice_number: payload.invoice_number,
      customer_name: payload.customer_name,
      customer_email: payload.customer_email || null,
      customer_phone: payload.customer_phone || null,
      amount: payload.amount,
      currency: payload.currency || 'INR',
      issue_date: payload.issue_date,
      due_date: payload.due_date,
      payment_status: isOverdue ? 'overdue' : (payload.payment_status || 'pending'),
      evidence: [
        {
          id: `ev-${Math.random().toString(36).slice(2, 6)}`,
          type: 'invoice_doc',
          name: `Tax Invoice ${payload.invoice_number}.pdf`,
          status: 'attached',
          reference: `INV-${payload.invoice_number}`,
          notes: 'Generated upon creation',
        },
        {
          id: `ev-${Math.random().toString(36).slice(2, 6)}`,
          type: 'purchase_order',
          name: 'Customer Purchase Order (PO)',
          status: 'missing',
          reference: null,
          notes: 'Requires verification',
        },
        {
          id: `ev-${Math.random().toString(36).slice(2, 6)}`,
          type: 'delivery_proof',
          name: 'Delivery Confirmation / Gate Pass / Sign-off',
          status: 'missing',
          reference: null,
          notes: 'Requires verification',
        },
        {
          id: `ev-${Math.random().toString(36).slice(2, 6)}`,
          type: 'prior_correspondence',
          name: 'Email / WhatsApp Follow-up',
          status: 'missing',
          reference: null,
          notes: 'Not yet sent',
        },
      ],
      notes: payload.notes || null,
      created_at: new Date().toISOString(),
    };

    const current = this.getLocalInvoices();
    this.setLocalInvoices([newInv, ...current]);
    return newInv;
  },

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
      if (res.ok) {
        const updated = await res.json();
        const current = this.getLocalInvoices().map((i) =>
          i.id === invoice.id ? updated : i
        );
        this.setLocalInvoices(current);
        return updated;
      }
    } catch {
      // Local fallback
    }

    const current = this.getLocalInvoices().map((i) =>
      i.id === invoice.id ? invoice : i
    );
    this.setLocalInvoices(current);
    return invoice;
  },

  async resetDemoData(): Promise<Invoice[]> {
    try {
      const res = await fetch(`${API_BASE}/api/invoices/reset-demo`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        this.setLocalInvoices(data);
        return data;
      }
    } catch {
      // Local fallback
    }

    this.setLocalInvoices(INITIAL_MOCK_INVOICES);
    return INITIAL_MOCK_INVOICES;
  },

  async generateReminder(req: GenerateReminderRequest): Promise<GenerateReminderResponse> {
    try {
      const res = await fetch(`${API_BASE}/api/generate-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    return fallbackGenerateReminder(req);
  },
};
