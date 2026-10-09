'use client';

import React, { useEffect } from 'react';
import { RotateCcw, X, CheckCircle2, Trash2 } from 'lucide-react';

interface UndoToastProps {
  isVisible: boolean;
  message: string;
  subMessage?: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({
  isVisible,
  message,
  subMessage,
  onUndo,
  onDismiss,
  duration = 8000,
}: UndoToastProps) {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">{message}</p>
            {subMessage && <p className="text-[11px] text-slate-400 truncate">{subMessage}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onUndo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
