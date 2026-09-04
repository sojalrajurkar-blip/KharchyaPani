'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import Link from 'next/link';

export interface ToastAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'undo';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
  title?: string;
  action?: ToastAction;
  secondaryAction?: ToastAction;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`pointer-events-auto flex flex-col p-3.5 sm:p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all ${
              t.type === 'success'
                ? 'bg-slate-950/90 border-emerald-500/40 text-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,0.15)]'
                : t.type === 'info'
                ? 'bg-slate-950/90 border-sky-500/40 text-sky-200 shadow-[0_8px_30px_rgba(14,165,233,0.15)]'
                : 'bg-slate-950/90 border-rose-500/40 text-rose-200 shadow-[0_8px_30px_rgba(244,63,94,0.15)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {t.type === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                {t.type === 'info' && (
                  <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                )}
                {t.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex flex-col">
                  {t.title && (
                    <span className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-0.5">
                      {t.title}
                    </span>
                  )}
                  <span className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                    {t.text}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onDismiss(t.id)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0 text-slate-400 hover:text-white"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Action Buttons (Undo / Edit) */}
            {(t.action || t.secondaryAction) && (
              <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                {t.secondaryAction && (
                  t.secondaryAction.href ? (
                    <Link
                      href={t.secondaryAction.href}
                      onClick={() => onDismiss(t.id)}
                      className="px-3 py-1 text-xs rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      {t.secondaryAction.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        t.secondaryAction?.onClick?.();
                        onDismiss(t.id);
                      }}
                      className="px-3 py-1 text-xs rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    >
                      {t.secondaryAction.label}
                    </button>
                  )
                )}

                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick?.();
                      onDismiss(t.id);
                    }}
                    className={`px-3.5 py-1 text-xs rounded-lg font-bold transition shadow-sm ${
                      t.action.variant === 'undo'
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-400'
                        : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                    }`}
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

