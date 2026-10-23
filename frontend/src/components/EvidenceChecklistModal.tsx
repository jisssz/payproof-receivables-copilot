import React, { useState } from 'react';
import { Invoice, EvidenceItem, EvidenceStatus } from '../types';
import { calculateEvidenceScore } from '../services/api';
import {
  X,
  FileCheck,
  FileWarning,
  HelpCircle,
  Sparkles,
  Paperclip,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface EvidenceChecklistModalProps {
  invoice: Invoice;
  onClose: () => void;
  onUpdateInvoice: (updated: Invoice) => void;
  onLaunchCopilot: (invoice: Invoice) => void;
}

export const EvidenceChecklistModal: React.FC<EvidenceChecklistModalProps> = ({
  invoice,
  onClose,
  onUpdateInvoice,
  onLaunchCopilot,
}) => {
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(invoice);
  const { score, summary } = calculateEvidenceScore(currentInvoice);

  const handleStatusChange = (itemId: string, newStatus: EvidenceStatus) => {
    const updatedEvidence = (currentInvoice.evidence || []).map((item) =>
      item.id === itemId ? { ...item, status: newStatus } : item
    );
    const updated = { ...currentInvoice, evidence: updatedEvidence };
    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
  };

  const handleReferenceChange = (itemId: string, refVal: string) => {
    const updatedEvidence = (currentInvoice.evidence || []).map((item) =>
      item.id === itemId ? { ...item, reference: refVal } : item
    );
    const updated = { ...currentInvoice, evidence: updatedEvidence };
    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Evidence Readiness Checklist
              </h2>
              <p className="text-xs text-slate-400">
                {currentInvoice.invoice_number} • {currentInvoice.customer_name}
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

        <div className="p-6 space-y-6">
          {/* Readiness Meter */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Evidence Readiness Score
              </span>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                    score >= 75
                      ? 'bg-emerald-100 text-emerald-800'
                      : score >= 40
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {score}% {score >= 75 ? 'Ready to Remind' : 'Missing Critical Records'}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  score >= 75
                    ? 'bg-emerald-500'
                    : score >= 40
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">{summary}</p>
          </div>

          {/* Evidence Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Verification Records
            </h3>

            {(currentInvoice.evidence || []).map((item: EvidenceItem) => {
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.status === 'attached'
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : item.status === 'missing'
                      ? 'bg-red-50/20 border-red-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {item.status === 'attached' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : item.status === 'missing' ? (
                          <FileWarning className="w-4 h-4 text-red-500" />
                        ) : (
                          <HelpCircle className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {item.name}
                          </p>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as EvidenceStatus)
                        }
                        className="text-xs font-medium py-1 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="attached">Attached &amp; Verified</option>
                        <option value="missing">Missing / Incomplete</option>
                        <option value="unverified">Unverified</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center space-x-2">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Add reference number or file note (e.g. PO-9912, LR slip #)..."
                      value={item.reference || ''}
                      onChange={(e) => handleReferenceChange(item.id, e.target.value)}
                      className="w-full text-xs bg-transparent border-0 focus:ring-0 p-0 text-slate-700 placeholder-slate-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/60 flex items-start space-x-2.5">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>Audit Safety:</strong> PayProof strictly evaluates supporting evidence so payment reminders only cite verified proof, protecting vendor credibility during invoice disputes.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onLaunchCopilot(currentInvoice);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate AI Follow-up</span>
          </button>
        </div>
      </div>
    </div>
  );
};
