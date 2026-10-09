'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Customer } from '@/types';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onConfirmDelete: (customer: Customer) => void;
}

export function DeleteCustomerModal({
  isOpen,
  customer,
  onClose,
  onConfirmDelete,
}: DeleteCustomerModalProps) {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 text-rose-600 font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Remove Customer Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-600">
            Are you sure you want to remove <strong className="text-slate-900">{customer.name}</strong> from your active CRM directory?
          </p>
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <RotateCcwIcon className="w-3.5 h-3.5" /> Undo option available!
            </p>
            <p>
              You can instantly click <strong>Undo</strong> on the notification toast or restore this record anytime from the <strong>Recently Deleted</strong> tab.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirmDelete(customer)}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove Customer
          </button>
        </div>
      </div>
    </div>
  );
}

function RotateCcwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
