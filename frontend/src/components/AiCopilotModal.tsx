import React, { useState, useEffect } from 'react';
import { Invoice, ReminderTone, GenerateReminderResponse } from '../types';
import { api, calculateEvidenceScore } from '../services/api';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Mail,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface AiCopilotModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({ invoice, onClose }) => {
  const [tone, setTone] = useState<ReminderTone>(
    invoice.payment_status === 'overdue' ? 'firm' : 'friendly'
  );
  const [includeEvidence, setIncludeEvidence] = useState<boolean>(true);
  const [customContext, setCustomContext] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email');
  const [copied, setCopied] = useState<boolean>(false);

  const [reminder, setReminder] = useState<GenerateReminderResponse | null>(null);
  const [editableEmail, setEditableEmail] = useState<string>('');
  const [editableSubject, setEditableSubject] = useState<string>('');
  const [editableWhatsapp, setEditableWhatsapp] = useState<string>('');

  const { score } = calculateEvidenceScore(invoice);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.generateReminder({
        invoice,
        tone,
        include_evidence_summary: includeEvidence,
        custom_context: customContext.trim() || undefined,
      });
      setReminder(res);
      setEditableSubject(res.subject);
      setEditableEmail(res.email_body);
      setEditableWhatsapp(res.whatsapp_body);
    } catch {
      // Fallback handles automatically
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerate();
  }, [tone]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-tight">AI Follow-up Copilot</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {reminder?.generated_by === 'openai' ? 'OpenAI GPT' : 'Deterministic Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Invoice {invoice.invoice_number} • ₹{invoice.amount.toLocaleString('en-IN')} (Due: {invoice.due_date})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Controls: Tone & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { id: 'friendly', title: 'Friendly Reminder', desc: 'Courteous & relationship-first' },
                { id: 'firm', title: 'Firm Follow-up', desc: 'Direct, requesting ref #' },
                { id: 'final_notice', title: 'Final Notice', desc: 'Pre-escalation formal deadline' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tone === t.id
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="text-xs font-bold text-slate-900">{t.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>

          {/* Context and Evidence Toggles */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEvidence}
                  onChange={(e) => setIncludeEvidence(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Cite verified supporting records in message (Readiness: {score}%)</span>
              </label>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Regenerate Draft</span>
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Optional custom context (e.g., 'Met client at trade show; agreed on Monday transfer')..."
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Output Format Tabs */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 mb-3">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('email')}
                  className={`pb-2 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-all ${
                    activeTab === 'email'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Draft</span>
                </button>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className={`pb-2 text-xs font-bold flex items-center space-x-1.5 border-b-2 transition-all ${
                    activeTab === 'whatsapp'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Message</span>
                </button>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    activeTab === 'email'
                      ? `Subject: ${editableSubject}\n\n${editableEmail}`
                      : editableWhatsapp
                  )
                }
                className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-xs font-medium">Drafting compliant follow-up...</p>
              </div>
            ) : activeTab === 'email' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editableSubject}
                    onChange={(e) => setEditableSubject(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email Body (Human Editable)
                  </label>
                  <textarea
                    rows={9}
                    value={editableEmail}
                    onChange={(e) => setEditableEmail(e.target.value)}
                    className="w-full text-xs font-mono leading-relaxed p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  WhatsApp Text (Human Editable)
                </label>
                <textarea
                  rows={6}
                  value={editableWhatsapp}
                  onChange={(e) => setEditableWhatsapp(e.target.value)}
                  className="w-full text-xs font-sans leading-relaxed p-3 bg-emerald-50/30 border border-emerald-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Legal / Compliance Disclaimer */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-900 leading-normal">
              {reminder?.disclaimer ||
                'PayProof provides communication drafts and administrative record tracking. It does not provide legal advice or guarantee payment recovery.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Human-in-the-loop: Always verify draft details before sending.
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Done
            </button>
            <button
              onClick={() =>
                handleCopy(
                  activeTab === 'email'
                    ? `Subject: ${editableSubject}\n\n${editableEmail}`
                    : editableWhatsapp
                )
              }
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Follow-up Message</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
