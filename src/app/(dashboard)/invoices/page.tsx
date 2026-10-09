'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, FileText, Download, ChevronRight, Search, CheckCircle2, Clock } from 'lucide-react';
import { getLocalInvoices, getLocalJobs, getLocalCustomers } from '@/lib/store';
import { Invoice, Job, Customer } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';

export default function InvoicesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  const loadData = () => {
    setInvoices(getLocalInvoices());
    setJobs(getLocalJobs());
    setCustomers(getLocalCustomers());
  };

  useEffect(() => {
    loadData();

    const handleCustomerChange = () => loadData();
    window.addEventListener('tradeflow_customer_added', handleCustomerChange);
    window.addEventListener('tradeflow_customer_updated', handleCustomerChange);
    window.addEventListener('focus', handleCustomerChange);

    return () => {
      window.removeEventListener('tradeflow_customer_added', handleCustomerChange);
      window.removeEventListener('tradeflow_customer_updated', handleCustomerChange);
      window.removeEventListener('focus', handleCustomerChange);
    };
  }, []);

  const activeCustomerIds = new Set(customers.map((c) => c.id));

  const combinedInvoices = invoices
    .map((inv) => {
      const j = jobs.find((jobItem) => jobItem.id === inv.job_id);
      const c = j ? customers.find((custItem) => custItem.id === j.customer_id) : null;
      return {
        invoice: inv,
        job: j,
        customer: c,
      };
    })
    .filter((item) => item.customer !== null && item.job && activeCustomerIds.has(item.job.customer_id));

  const filtered = combinedInvoices.filter(({ invoice, customer }) => {
    const custName = customer?.name || '';
    const invNum = invoice.invoice_number || '';
    return (
      custName.toLowerCase().includes(search.toLowerCase()) ||
      invNum.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalCollected = combinedInvoices
    .filter((i) => i.invoice.paid_at)
    .reduce((sum, i) => sum + i.invoice.amount, 0);

  const totalPending = combinedInvoices
    .filter((i) => !i.invoice.paid_at)
    .reduce((sum, i) => sum + i.invoice.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Invoices & Billing Hub
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Track pending balances, payment links, and download PDF receipts
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="apple-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue Collected
            </p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="apple-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Outstanding Balances Pending
            </p>
            <p className="text-3xl font-extrabold text-orange-600 mt-1">
              ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="apple-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice # or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200 bg-slate-50 w-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Amount (₹)</th>
                <th className="px-5 py-3.5">Payment Status</th>
                <th className="px-5 py-3.5">Date Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(({ invoice, customer, job }) => (
                <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-slate-900">{invoice.invoice_number}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">{customer?.name || 'Client'}</td>
                  <td className="px-5 py-4 font-extrabold text-slate-900">₹{invoice.amount.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <StatusBadge type="payment" status={invoice.paid_at ? 'Paid' : 'Pending'} />
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/invoices/${job?.id || invoice.job_id}`}
                      className="apple-btn-secondary text-[11px] px-3 py-1"
                    >
                      View Billing Portal
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
