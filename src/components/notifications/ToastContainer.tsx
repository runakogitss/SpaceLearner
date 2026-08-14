import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-slate-900/95 border border-purple-500/30 text-white shadow-2xl shadow-purple-950/70 backdrop-blur-xl transition-all duration-300 animate-slide-in"
        >
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/30 shrink-0 mt-0.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-extrabold font-outfit text-white leading-tight">
              {toast.title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-0.5 line-clamp-2">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all shrink-0"
            title="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
