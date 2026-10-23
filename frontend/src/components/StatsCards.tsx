import React from 'react';
import { StatsSummary } from '../types';
import { IndianRupee, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StatsCardsProps {
  stats: StatsSummary;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Receivables
          </p>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">
          ₹{stats.total_receivables.toLocaleString('en-IN')}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Across {stats.total_invoices - stats.paid_count} active accounts
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-red-200/80 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-b from-white to-red-50/20">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">
            Overdue Amount
          </p>
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-red-600 tracking-tight">
          ₹{stats.total_overdue_amount.toLocaleString('en-IN')}
        </p>
        <p className="mt-1 text-xs text-red-500 font-medium">
          {stats.overdue_count} invoice{stats.overdue_count !== 1 ? 's' : ''} past due date
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Evidence Readiness
          </p>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <p className="text-2xl font-bold text-slate-900 tracking-tight">
            {stats.average_readiness_score}%
          </p>
          <span className="text-xs text-slate-500 font-medium">Avg Score</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {stats.evidence_ready_count} invoices with ≥75% evidence
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Settled Accounts
          </p>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-emerald-600 tracking-tight">
          {stats.paid_count}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Fully recovered &amp; reconciled
        </p>
      </div>
    </div>
  );
};
