import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { X, CheckCircle2, AlertCircle, TrendingDown } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useWallet();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let borderClass = 'border-white/10 bg-[#0e1017]/95 text-slate-200';
        let icon = <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />;

        if (toast.type === 'jackpot' || toast.type === 'win') {
          borderClass = 'border-[#d4af37]/35 bg-[#0e1017]/95 shadow-xl';
          icon = <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />;
        } else if (toast.type === 'loss') {
          borderClass = 'border-white/10 bg-[#0e1017]/95';
          icon = <TrendingDown className="w-4 h-4 text-slate-400" />;
        } else if (toast.type === 'info') {
          borderClass = 'border-white/10 bg-[#0e1017]/95';
          icon = <AlertCircle className="w-4 h-4 text-slate-400" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-200 ${borderClass}`}
          >
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white tracking-wide">{toast.title}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words font-light">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-500 hover:text-white p-1 rounded hover:bg-white/[0.05] transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
