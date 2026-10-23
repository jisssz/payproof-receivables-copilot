import { useState, useEffect } from 'react';
import { Invoice, InvoiceCreate, StatsSummary } from './types';
import { api, fallbackStats } from './services/api';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { InvoiceList } from './components/InvoiceList';
import { EvidenceChecklistModal } from './components/EvidenceChecklistModal';
import { AiCopilotModal } from './components/AiCopilotModal';
import { InvoiceModal } from './components/InvoiceModal';
import { ShieldCheck, Info } from 'lucide-react';

export function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<StatsSummary>({
    total_invoices: 0,
    total_receivables: 0,
    total_overdue_amount: 0,
    overdue_count: 0,
    pending_count: 0,
    paid_count: 0,
    evidence_ready_count: 0,
    average_readiness_score: 0,
  });

  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [selectedForEvidence, setSelectedForEvidence] = useState<Invoice | null>(null);
  const [selectedForCopilot, setSelectedForCopilot] = useState<Invoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    // Health check
    const health = await api.getHealth();
    setBackendOnline(health !== null);

    // Invoices & Stats
    const invData = await api.getInvoices();
    setInvoices(invData);

    const statsData = await api.getStats();
    setStats(statsData || fallbackStats(invData));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvoice = async (payload: InvoiceCreate) => {
    const created = await api.createInvoice(payload);
    const updated = [created, ...invoices];
    setInvoices(updated);
    setStats(fallbackStats(updated));
    showToast(`Invoice ${created.invoice_number} created with default evidence checklist!`);
  };

  const handleUpdateInvoice = async (updated: Invoice) => {
    const saved = await api.updateInvoice(updated);
    const nextInvoices = invoices.map((i) => (i.id === saved.id ? saved : i));
    setInvoices(nextInvoices);
    setStats(fallbackStats(nextInvoices));
  };

  const handleMarkPaid = async (inv: Invoice) => {
    const updated: Invoice = { ...inv, payment_status: 'paid' };
    await handleUpdateInvoice(updated);
    showToast(`Invoice ${inv.invoice_number} marked as Paid!`);
  };

  const handleResetDemo = async () => {
    const fresh = await api.resetDemoData();
    setInvoices(fresh);
    setStats(fallbackStats(fresh));
    showToast('Synthetic hackathon demo dataset restored!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        onOpenCreate={() => setIsCreateOpen(true)}
        onResetDemo={handleResetDemo}
        isBackendConnected={backendOnline}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Evidence-First Receivables Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Stop chasing overdue invoices with empty hands.
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              PayProof verifies purchase orders, gate passes, and delivery confirmations
              before drafting calibrated, professional follow-ups that speed up B2B payment recovery.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-radial-gradient pointer-events-none" />
        </div>

        {/* Stats Row */}
        <StatsCards stats={stats} />

        {/* Work Area / Invoice List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Receivables &amp; Evidence Workspace
              </h2>
              <p className="text-xs text-slate-500">
                Track invoice ageing and verify evidence before escalating payment reminders.
              </p>
            </div>
          </div>

          <InvoiceList
            invoices={invoices}
            onSelectEvidence={(inv) => setSelectedForEvidence(inv)}
            onLaunchCopilot={(inv) => setSelectedForCopilot(inv)}
            onMarkPaid={handleMarkPaid}
            onRefresh={loadData}
          />
        </div>

        {/* Informational Callout */}
        <div className="p-4 bg-slate-100 rounded-xl border border-slate-200/80 flex items-start space-x-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-slate-700">Hackathon Integrity &amp; Transparency Notice</p>
            <p className="mt-0.5 leading-relaxed">
              PayProof is a clean, independent project created for the AIBoomi Startup Weekend by Jis Shajan and Angelin Gino. Calculations and overdue statuses are evaluated deterministically; AI is strictly utilized for contextual message drafting.
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      {isCreateOpen && (
        <InvoiceModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateInvoice}
        />
      )}

      {selectedForEvidence && (
        <EvidenceChecklistModal
          invoice={selectedForEvidence}
          onClose={() => setSelectedForEvidence(null)}
          onUpdateInvoice={handleUpdateInvoice}
          onLaunchCopilot={(inv) => setSelectedForCopilot(inv)}
        />
      )}

      {selectedForCopilot && (
        <AiCopilotModal
          invoice={selectedForCopilot}
          onClose={() => setSelectedForCopilot(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
