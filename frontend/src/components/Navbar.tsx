import React from 'react';
import { ShieldCheck, Plus, RotateCcw, Activity } from 'lucide-react';

interface NavbarProps {
  onOpenCreate: () => void;
  onResetDemo: () => void;
  isBackendConnected: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreate,
  onResetDemo,
  isBackendConnected,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                PayProof
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Receivables Copilot
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              AIBoomi Hackathon • Jis Shajan (Tech) &amp; Angelin Gino (Product)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200 text-slate-600">
            <Activity
              className={`w-3.5 h-3.5 ${
                isBackendConnected === true
                  ? 'text-emerald-500 animate-pulse'
                  : isBackendConnected === false
                  ? 'text-amber-500'
                  : 'text-slate-400'
              }`}
            />
            <span>
              {isBackendConnected === true
                ? 'Backend Live'
                : isBackendConnected === false
                ? 'Offline Fallback Ready'
                : 'Connecting...'}
            </span>
          </div>

          <button
            onClick={onResetDemo}
            title="Reset synthetic demo invoices"
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>
    </header>
  );
};
