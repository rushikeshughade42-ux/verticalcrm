'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Wrench,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  ShieldCheck,
  XCircle,
  Loader2,
  FileText,
  Download,
} from 'lucide-react';
import { getQuoteByToken, getLocalJobs, getLocalCustomers, getLocalProfile, saveLocalQuote, updateLocalJobStatus } from '@/lib/store';
import { Quote, Job, Customer, Profile } from '@/types';

export default function PublicQuotePage() {
  const params = useParams();
  const token = (params?.token as string) || '';

  const [quote, setQuote] = useState<Quote | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [scheduleDate, setScheduleDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (!token) return;

    const prof = getLocalProfile();
    setProfile(prof);

    const q = getQuoteByToken(token);
    if (q) {
      setQuote(q);
      const jobs = getLocalJobs();
      const j = jobs.find((jobItem) => jobItem.id === q.job_id);
      if (j) {
        setJob(j);
        const custs = getLocalCustomers();
        const c = custs.find((custItem) => custItem.id === j.customer_id);
        setCustomer(c || null);
      }
      if (q.is_accepted) {
        setAccepted(true);
      }
    }
  }, [token]);

  const handleAcceptQuote = () => {
    if (!quote || !job) return;

    saveLocalQuote({
      ...quote,
      is_accepted: true,
      status: 'Accepted',
    });

    updateLocalJobStatus(job.id, {
      work_status: 'Scheduled',
      date_of_work: scheduleDate,
      amount: quote.total_amount,
    });

    setAccepted(true);
  };

  const handleDeclineQuote = () => {
    setDeclined(true);
  };

  if (!quote || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="apple-card p-8 text-center max-w-md w-full space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Retrieving Service Estimate...</h2>
          <p className="text-xs text-slate-500">Please wait while we locate your quotation record.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-blue-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="apple-card p-6 text-center space-y-3 relative overflow-hidden">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {profile?.business_name || 'TradeFlow Professional Services'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Official Service Estimate & Job Scheduling Portal
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 apple-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Guaranteed Fixed Pricing
          </div>
        </div>

        {accepted ? (
          /* Accepted Success Screen */
          <div className="apple-card p-8 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Quote Approved & Scheduled!</h2>
              <p className="mt-1 text-sm text-slate-600">
                Thank you, <strong className="text-slate-900">{customer?.name}</strong>. Your service has been scheduled for{' '}
                <strong className="text-blue-600">{scheduleDate}</strong>.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Total Approved Amount:</span>
                <span className="font-bold text-slate-900">₹{quote.total_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Scheduled Date:</span>
                <span className="font-bold text-slate-900">{scheduleDate}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Service Provider:</span>
                <span className="font-bold text-slate-900">{profile?.business_name}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Our technician will reach out via SMS ({customer?.contact_no}) on the scheduled date.
            </p>
          </div>
        ) : declined ? (
          /* Declined Screen */
          <div className="apple-card p-8 text-center space-y-4">
            <XCircle className="w-12 h-12 text-slate-400 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">Quote Declined</h2>
            <p className="text-xs text-slate-600">
              Thank you for letting us know. We have notified {profile?.business_name} regarding your decision.
            </p>
          </div>
        ) : (
          /* Active Quote Details & Approval Form */
          <div className="apple-card p-6 space-y-6">
            {/* Customer Details */}
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Prepared For
                </span>
                <h3 className="text-base font-bold text-slate-900">{customer?.name}</h3>
                <p className="text-xs text-slate-500">{customer?.location}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Estimate Reference
                </span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  EST-{quote.public_token.substring(0, 8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Reported Problem */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Requested Work
              </span>
              <p className="text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {job.problem}
              </p>
            </div>

            {/* Line Items Table */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Itemized Breakdown
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5">Description</th>
                      <th className="px-3 py-2.5 text-center">Qty</th>
                      <th className="px-3 py-2.5 text-right">Price (₹)</th>
                      <th className="px-3 py-2.5 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quote.line_items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{item.description}</td>
                        <td className="px-3 py-2.5 text-center font-mono">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right font-mono">₹{item.unit_price.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">
                          ₹{item.total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Box */}
            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Total Estimate:</span>
              <span className="text-2xl font-extrabold text-blue-600">
                ₹{quote.total_amount.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Direct PDF Link */}
            <div className="flex justify-end">
              <a
                href={`/api/quotes/pdf?token=${quote.public_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                View / Download Official PDF Quotation
              </a>
            </div>

            {/* Schedule Date Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Select Preferred Service Date *
              </label>
              <input
                type="date"
                required
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Approval Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAcceptQuote}
                className="w-full apple-btn-primary py-3.5 text-sm rounded-2xl shadow-lg shadow-blue-600/30"
              >
                <CheckCircle2 className="w-5 h-5" />
                Accept Quote & Schedule Service
              </button>

              <button
                onClick={handleDeclineQuote}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-semibold py-2 transition-colors"
              >
                Decline or Request Modifications
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
