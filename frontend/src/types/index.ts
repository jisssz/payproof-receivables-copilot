export type EvidenceType = 'invoice_doc' | 'purchase_order' | 'delivery_proof' | 'prior_correspondence';
export type EvidenceStatus = 'attached' | 'missing' | 'unverified';
export type PaymentStatus = 'draft' | 'pending' | 'partially_paid' | 'overdue' | 'paid';
export type ReminderTone = 'friendly' | 'firm' | 'final_notice';

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  name: string;
  status: EvidenceStatus;
  reference?: string | null;
  notes?: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  payment_status: PaymentStatus;
  evidence: EvidenceItem[];
  notes?: string | null;
  created_at?: string | null;
}

export interface InvoiceCreate {
  invoice_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  amount: number;
  currency?: string;
  issue_date: string;
  due_date: string;
  payment_status?: PaymentStatus;
  notes?: string | null;
}

export interface GenerateReminderRequest {
  invoice: Invoice;
  tone: ReminderTone;
  include_evidence_summary?: boolean;
  custom_context?: string;
}

export interface GenerateReminderResponse {
  subject: string;
  email_body: string;
  whatsapp_body: string;
  evidence_readiness_score: number;
  evidence_summary: string;
  tone_used: string;
  generated_by: 'openai' | 'deterministic_fallback';
  disclaimer: string;
}

export interface StatsSummary {
  total_invoices: number;
  total_receivables: number;
  total_overdue_amount: number;
  overdue_count: number;
  pending_count: number;
  paid_count: number;
  evidence_ready_count: number;
  average_readiness_score: number;
}
