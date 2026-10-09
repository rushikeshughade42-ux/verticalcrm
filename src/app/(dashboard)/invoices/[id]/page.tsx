'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  DollarSign,
  Download,
  Send,
  Save,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Phone,
  User,
  MapPin,
  Loader2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import {
  getLocalJobs,
  getLocalCustomers,
  getQuoteByJobId,
  getInvoiceByJobId,
  saveLocalInvoice,
  markInvoicePaid,
  getLocalProfile,
  getAppBaseUrl,
} from '@/lib/store';
import { Job, Customer, Quote, Invoice, Profile } from '@/types';
import { generateInvoicePDF } from '@/lib/pdf';
import { generateSMSUri, copyToClipboard } from '@/lib/sms';
import { generateWhatsAppUri, whatsappTemplates } from '@/lib/whatsapp';
import { StatusBadge } from '@/components/StatusBadge';

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || '';

  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [amount, setAmount] = useState<number>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedPaymentLink, setCopiedPaymentLink] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const prof = getLocalProfile();
    setProfile(prof);

    const jobs = getLocalJobs();
    const foundJob = jobs.find((j) => j.id === jobId);

    if (foundJob) {
      setJob(foundJob);

      const custs = getLocalCustomers();
      const foundCust = custs.find((c) => c.id === foundJob.customer_id);
      setCustomer(foundCust || null);

      const foundQuote = getQuoteByJobId(foundJob.id);
      setQuote(foundQuote || null);

      // Existing or initial invoice
      let inv = getInvoiceByJobId(foundJob.id);
      const activeAmount = foundQuote?.total_amount || foundJob.amount || (inv ? inv.amount : 1500);
      if (!inv) {
        inv = saveLocalInvoice(foundJob.id, activeAmount);
      } else if (foundQuote && foundQuote.total_amount > 0 && inv.amount !== foundQuote.total_amount) {
        inv = saveLocalInvoice(foundJob.id, foundQuote.total_amount);
      }

      setInvoice(inv);
      setAmount(inv.amount);
    }
  }, [jobId]);

  const handleSaveInvoice = () => {
    if (!job) return;
    const updatedInv = saveLocalInvoice(job.id, amount);
    setInvoice(updatedInv);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadPDF = async () => {
    if (!invoice || !job || !customer) return;
    setIsGeneratingPdf(true);

    try {
      const lineItems = quote?.line_items || [
        {
          id: 'li-default',
          description: job.problem || 'Completed Service Work',
          quantity: 1,
          unit_price: amount,
          total: amount,
          type: 'labor',
        },
      ];

      const pdfBytes = await generateInvoicePDF(
        invoice,
        job,
        customer,
        lineItems,
        profile?.business_name || 'TradeFlow Pro Services'
      );

      // Create blob and download
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}_${customer.name.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getPublicInvoiceUrl = () => {
    if (!invoice) return '';
    const baseUrl = getAppBaseUrl();
    return `${baseUrl}/invoice/${invoice.id}`;
  };

  const handleCopyPaymentLink = () => {
    const url = getPublicInvoiceUrl();
    copyToClipboard(url);
    setCopiedPaymentLink(true);
    setTimeout(() => setCopiedPaymentLink(false), 3000);
  };

  const handleSendWhatsAppInvoice = () => {
    handleSaveInvoice();
    if (!customer || !invoice) return;
    const publicUrl = getPublicInvoiceUrl();
    const message = whatsappTemplates.invoice({
      name: customer.name,
      amount,
      business_name: profile?.business_name || 'TradeFlow Services',
      invoice_url: publicUrl,
    });
    const whatsappUrl = generateWhatsAppUri(customer.contact_no, message);
    window.open(whatsappUrl, '_blank');
  };

  const handleSendInvoiceSMS = () => {
    handleSaveInvoice();
    if (!customer || !invoice) return;
    const url = getPublicInvoiceUrl();
    const smsBody = `Hi ${customer.name}, your invoice (${invoice.invoice_number}) for ₹${amount.toLocaleString('en-IN')} from ${profile?.business_name || 'TradeFlow'} is ready. Pay online securely here: ${url}`;
    window.location.href = generateSMSUri(customer.contact_no, smsBody);
  };

  const handleMarkAsPaidTest = () => {
    if (!job) return;
    const res = markInvoicePaid(job.id);
    if (res) {
      setInvoice(res.invoice);
      setJob({ ...job, payment_status: 'Paid', work_status: 'Done' });
    }
  };

  if (!job || !customer || !invoice) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
        <p>Loading invoice record...</p>
      </div>
    );
  }

  const isPaid = Boolean(invoice.paid_at || job.payment_status === 'Paid');

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Invoice #{invoice.invoice_number}
              </h1>
              <StatusBadge type="payment" status={isPaid ? 'Paid' : 'Pending'} />
            </div>
            <p className="text-xs text-slate-500">
              Billing for <strong className="text-slate-800">{customer.name}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="apple-btn-secondary text-xs px-3.5 py-2"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-600" />
            )}
            Download PDF
          </button>

          {!isPaid && (
            <button
              onClick={handleMarkAsPaidTest}
              className="apple-btn-secondary text-xs px-3.5 py-2 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Mark as Paid (Test)
            </button>
          )}

          <button
            onClick={handleSendInvoiceSMS}
            className="apple-btn-secondary text-xs px-3.5 py-2"
          >
            <Send className="w-3.5 h-3.5" />
            SMS Backup
          </button>

          {/* Primary WhatsApp Action Button */}
          <button
            onClick={handleSendWhatsAppInvoice}
            className="apple-btn-primary text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 border-none shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            Send via WhatsApp
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Invoice saved successfully. Payment status updated to &quot;Pending&quot;.</span>
        </div>
      )}

      {/* Customer & Job Info Box */}
      <div className="apple-card p-6 bg-gradient-to-r from-slate-50 via-white to-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Billed Customer
            </span>
            <h3 className="text-base font-bold text-slate-900">{customer.name}</h3>
            <p className="text-xs text-slate-600 font-mono mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {customer.contact_no}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {customer.location}
            </p>
          </div>

          <div className="md:col-span-2 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Job Scope & Invoice Amount
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800">{job.title || job.problem}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Completed Work • {profile?.business_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  disabled={isPaid}
                  min={0}
                  step={5}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-32 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-base font-extrabold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-right"
                />
                {!isPaid && (
                  <button
                    onClick={handleSaveInvoice}
                    className="apple-btn-secondary text-xs p-2"
                    title="Save Amount"
                  >
                    <Save className="w-4 h-4 text-blue-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay UPI Payment Link Section */}
      <div className="apple-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Razorpay UPI & Card Checkout Portal</h3>
              <p className="text-xs text-slate-500">Customer online Google Pay, PhonePe, UPI & card payment link</p>
            </div>
          </div>

          <button
            onClick={handleCopyPaymentLink}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedPaymentLink ? 'Payment Link Copied!' : 'Copy Payment Link'}
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 font-mono text-xs text-slate-700 flex items-center justify-between break-all">
          <span>{getPublicInvoiceUrl()}</span>
          <Link
            href={`/invoice/${invoice.id}`}
            target="_blank"
            className="ml-3 shrink-0 text-xs font-bold text-blue-600 hover:underline"
          >
            Preview Portal &rarr;
          </Link>
        </div>
      </div>

      {/* Itemized Line Items Breakdown */}
      {quote && quote.line_items && quote.line_items.length > 0 && (
        <div className="apple-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Original Approved Quote Line Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 font-bold text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2.5">Item</th>
                  <th className="px-3 py-2.5 text-center">Qty</th>
                  <th className="px-3 py-2.5 text-right">Unit Price</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-medium">{item.description}</td>
                    <td className="px-3 py-2 text-center font-mono">{item.quantity}</td>
                    <td className="px-3 py-2 text-right font-mono">₹{item.unit_price.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900">₹{item.total.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
