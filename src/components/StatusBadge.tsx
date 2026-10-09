import React from 'react';
import { WorkStatus, PaymentStatus } from '@/types';
import { Clock, CheckCircle2, AlertCircle, Sparkles, DollarSign } from 'lucide-react';

interface StatusBadgeProps {
  type: 'work' | 'payment';
  status: WorkStatus | PaymentStatus | string;
}

export function StatusBadge({ type, status }: StatusBadgeProps) {
  if (type === 'work') {
    switch (status) {
      case 'Quoted':
        return (
          <span className="apple-pill bg-sky-50 text-sky-700 border border-sky-200">
            <Sparkles className="w-3 h-3 text-sky-500" />
            Quoted
          </span>
        );
      case 'Scheduled':
        return (
          <span className="apple-pill bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Scheduled
          </span>
        );
      case 'Done':
        return (
          <span className="apple-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Done
          </span>
        );
      default:
        return <span className="apple-pill bg-slate-100 text-slate-700">{status}</span>;
    }
  }

  // Payment Status
  switch (status) {
    case 'Pending':
      return (
        <span className="apple-pill bg-orange-50 text-orange-700 border border-orange-200">
          <AlertCircle className="w-3 h-3 text-orange-500" />
          Pending
        </span>
      );
    case 'Paid':
      return (
        <span className="apple-pill bg-emerald-100 text-emerald-800 border border-emerald-300">
          <DollarSign className="w-3 h-3 text-emerald-600" />
          Paid
        </span>
      );
    default:
      return <span className="apple-pill bg-slate-100 text-slate-700">{status}</span>;
  }
}
