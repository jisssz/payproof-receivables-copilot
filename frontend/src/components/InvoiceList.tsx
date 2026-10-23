import React, { useState } from 'react';
import { Invoice } from '../types';
import { calculateEvidenceScore } from '../services/api';
import {
  Search,
  Download,
  Sparkles,
  FileCheck,
  CheckCircle,
  AlertCircle,
  Calendar,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectEvidence: (invoice: Invoice) => void;
  onLaunchCopilot: (invoice: Invoice) => void;
  onMarkPaid: (invoice: Invoice) => void;
  onRefresh: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onSelectEvidence,
  onLaunchCopilot,
  onMarkPaid,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [readinessFilter, setReadinessFilter] = useState('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const getDaysDiff = (dueDateStr: string) => {
    const due = new Date(dueDateStr).getTime();
    const now = new Date(todayStr).getTime();
    const diffDays = Math.round((now - due) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || inv.payment_status === statusFilter;

    const { score } = calculateEvidenceScore(inv);
    const matchesReadiness =
      readinessFilter === 'all' ||
      (readinessFilter === 'high' && score >= 75) ||
      (readinessFilter === 'low' && score < 75);

    return matchesSearch && matchesStatus && matchesReadiness;
  });

  const exportCSV = () => {
    const headers = [
      'Invoice Number',
      'Customer',
      'Amount',
      'Currency',
      'Issue Date',
      'Due Date',
      'Status',
      'Readiness Score (%)',
      'Evidence Summary',
      'Notes',
    ];
    const rows = filteredInvoices.map((inv) => {
      const { score, summary } = calculateEvidenceScore(inv);
      return [
        inv.invoice_number,
        `"${inv.customer_name}"`,
        inv.amount,
        inv.currency,
        inv.issue_date,
        inv.due_date,
        inv.payment_status,
        score,
        `"${summary.replace(/"/g, '""')}"`,
        `"${(inv.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PayProof_Invoices_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Filters & Actions Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Payment Statuses</option>
            <option value="overdue">Overdue Invoices</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid / Settled</option>
          </select>

          <select
            value={readinessFilter}
            onChange={(e) => setReadinessFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Evidence Levels</option>
            <option value="high">Ready to Remind (≥75%)</option>
            <option value="low">Needs Evidence (&lt;75%)</option>
          </select>

          <button
            onClick={exportCSV}
            title="Download CSV export"
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      {filteredInvoices.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No invoices match your search</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or reset the filters.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {filteredInvoices.map((inv) => {
            const { score } = calculateEvidenceScore(inv);
            const daysDiff = getDaysDiff(inv.due_date);
            const isOverdue = inv.payment_status === 'overdue' || (inv.payment_status !== 'paid' && daysDiff > 0);

            return (
              <div
                key={inv.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Customer & Details */}
                <div className="space-y-1 max-w-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">
                      {inv.customer_name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {inv.invoice_number}
                    </span>
                  </div>
                  {inv.notes && (
                    <p className="text-xs text-slate-500 line-clamp-1">{inv.notes}</p>
                  )}
                  {/* Inline Document Presence Indicator */}
                  <div className="flex items-center space-x-1.5 py-0.5">
                    {(inv.evidence || []).map((ev) => {
                      const isAttached = ev.status === 'attached';
                      const label =
                        ev.type === 'invoice_doc'
                          ? 'INV'
                          : ev.type === 'purchase_order'
                          ? 'PO'
                          : ev.type === 'delivery_proof'
                          ? 'POD'
                          : 'MSG';
                      return (
                        <span
                          key={ev.id}
                          title={`${ev.name}: ${ev.status}`}
                          className={`inline-flex items-center text-[10px] px-1.5 py-0.2 rounded font-mono font-bold tracking-tight border ${
                            isAttached
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                          }`}
                        >
                          {isAttached ? '✓' : '✗'} {label}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {inv.due_date}</span>
                    </span>
                    {inv.customer_email && (
                      <span className="hidden sm:inline">• {inv.customer_email}</span>
                    )}
                  </div>
                </div>

                {/* Middle: Amount & Status Badge */}
                <div className="flex items-center space-x-6">
                  <div>
                    <div className="flex items-baseline space-x-1">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-base font-extrabold text-slate-900">
                        {inv.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      {inv.payment_status === 'paid' ? (
                        <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Paid
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {daysDiff > 0 ? `${daysDiff}d overdue` : 'Overdue'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Evidence Readiness Meter */}
                  <div className="w-32 hidden sm:block">
                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                      <span className="text-slate-500 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Evidence</span>
                      </span>
                      <span
                        className={
                          score >= 75
                            ? 'text-emerald-700'
                            : score >= 40
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }
                      >
                        {score}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          score >= 75
                            ? 'bg-emerald-500'
                            : score >= 40
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 self-start lg:self-auto">
                  <button
                    onClick={() => onSelectEvidence(inv)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Evidence ({score}%)</span>
                  </button>

                  <button
                    onClick={() => onLaunchCopilot(inv)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Copilot</span>
                  </button>

                  {inv.payment_status !== 'paid' && (
                    <button
                      onClick={() => onMarkPaid(inv)}
                      title="Mark as paid"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
