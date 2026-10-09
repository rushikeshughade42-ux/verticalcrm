'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Phone,
  User,
  MapPin,
  Calendar,
  Loader2,
  DollarSign,
  Share2,
  MessageCircle,
  Download,
} from 'lucide-react';
import {
  getLocalJobs,
  getLocalCustomers,
  getQuoteByJobId,
  saveLocalQuote,
  getLocalQuoteReferenceData,
  getLocalQuoteDocuments,
  getLocalProfile,
} from '@/lib/store';
import { Job, Customer, Quote, QuoteLineItem, Profile } from '@/types';
import { generateQuoteWithGemini } from '@/lib/gemini';
import { generateSMSUri, copyToClipboard } from '@/lib/sms';
import { generateWhatsAppUri, whatsappTemplates } from '@/lib/whatsapp';

export default function QuoteStudioPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || '';

  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load Job & Quote Data
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

      const existingQuote = getQuoteByJobId(foundJob.id);
      if (existingQuote && existingQuote.line_items && existingQuote.line_items.length > 0) {
        setQuote(existingQuote);
        setLineItems(existingQuote.line_items);
      } else {
        // Auto-generate AI Quote on initial open
        handleTriggerAiGeneration(foundJob, prof.trade_type);
      }
    }
  }, [jobId]);

  const handleTriggerAiGeneration = async (targetJob: Job, tradeType: string) => {
    setAiLoading(true);
    const catalog = getLocalQuoteReferenceData();
    const docs = getLocalQuoteDocuments();
    const uploadedDocsText = docs.map((d) => `[File: ${d.file_name}]\n${d.content_text}`).join('\n\n');
    const aiResult = await generateQuoteWithGemini(targetJob.problem, tradeType, catalog, uploadedDocsText);

    setLineItems(aiResult.lineItems);
    setAiExplanation(aiResult.aiExplanation);

    const newQuote = saveLocalQuote({
      job_id: targetJob.id,
      line_items: aiResult.lineItems,
      total_amount: aiResult.totalAmount,
      is_accepted: false,
      status: 'Draft',
    });

    setQuote(newQuote);
    setAiLoading(false);
  };

  const handleLineItemChange = (
    id: string,
    field: keyof QuoteLineItem,
    value: string | number
  ) => {
    const updated = lineItems.map((item) => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          const qty = Number(field === 'quantity' ? value : newItem.quantity) || 0;
          const price = Number(field === 'unit_price' ? value : newItem.unit_price) || 0;
          newItem.total = qty * price;
        }
        return newItem;
      }
      return item;
    });
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    const newItem: QuoteLineItem = {
      id: `li-manual-${Date.now()}`,
      description: 'Custom Service / Additional Labor',
      quantity: 1,
      unit_price: 500,
      total: 500,
      type: 'labor',
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter((i) => i.id !== id));
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

  const handleSaveQuote = () => {
    if (!job) return;
    const updatedQuote = saveLocalQuote({
      id: quote?.id,
      job_id: job.id,
      line_items: lineItems,
      total_amount: totalAmount,
      public_token: quote?.public_token,
      is_accepted: quote?.is_accepted || false,
      status: quote?.status === 'Accepted' ? 'Accepted' : 'Sent',
    });
    setQuote(updatedQuote);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getPublicQuoteUrl = () => {
    if (!quote) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/quote/${quote.public_token}`;
  };

  const handleCopyLink = () => {
    const url = getPublicQuoteUrl();
    copyToClipboard(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const [pdfLoading, setPdfLoading] = useState(false);

  const getClientPdfFileName = (custName?: string) => {
    const safeName = custName ? custName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'Client';
    return `Quotation_${safeName}.pdf`;
  };

  const handleDownloadPdf = async () => {
    if (!job || !customer || !quote) return;
    const fileName = getClientPdfFileName(customer.name);
    try {
      setPdfLoading(true);
      const res = await fetch('/api/quotes/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote,
          job,
          customer,
          lineItems,
          businessName: profile?.business_name || 'TradeFlow Pro Services',
        }),
      });

      if (!res.ok) throw new Error('PDF Generation Failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Could not download PDF quotation.');
    } finally {
      setPdfLoading(false);
    }
  };

  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  const handleSendWhatsApp = async () => {
    handleSaveQuote();
    if (!customer || !job || !quote) return;

    const fileName = getClientPdfFileName(customer.name);
    const businessName = profile?.business_name || 'Apex Plumbing';
    const publicUrl = getPublicQuoteUrl();

    const whatsappMessage = whatsappTemplates.quoteWithPdf({
      name: customer.name,
      business_name: businessName,
      amount: totalAmount,
      quote_url: publicUrl,
    });
    const whatsappUrl = generateWhatsAppUri(customer.contact_no, whatsappMessage);

    // 1. Reserve popup window permission synchronously on click
    const waWindow = window.open('about:blank', '_blank');

    // 2. Download PDF file directly to admin device while main tab is active
    setPdfLoading(true);
    try {
      const res = await fetch('/api/quotes/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote,
          job,
          customer,
          lineItems,
          businessName,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          a.remove();
          window.URL.revokeObjectURL(url);
        }, 1000);
      }
    } catch (err) {
      console.warn('PDF download error:', err);
    } finally {
      setPdfLoading(false);
    }

    // 3. Direct the opened window to customer WhatsApp chat
    if (waWindow) {
      waWindow.location.href = whatsappUrl;
    } else {
      window.open(whatsappUrl, '_blank');
    }

    setWhatsappToast(`PDF (${fileName}) downloaded! WhatsApp chat opened for ${customer.name}.`);
    setTimeout(() => setWhatsappToast(null), 8000);
  };

  const handleSendSMS = () => {
    handleSaveQuote();
    if (!customer) return;
    const publicUrl = getPublicQuoteUrl();
    const smsBody = `Hi ${customer.name}, your service quotation from ${profile?.business_name || 'TradeFlow'} (₹${totalAmount.toLocaleString('en-IN')}) is ready for review & booking here: ${publicUrl}`;
    window.location.href = generateSMSUri(customer.contact_no, smsBody);
  };

  if (!job || !customer) {
    return (
      <div className="py-20 text-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
        <p>Loading quotation record...</p>
      </div>
    );
  }

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
                Quote Review & Dispatch
              </h1>
              <span className="apple-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                WhatsApp First
              </span>
            </div>
            <p className="text-xs text-slate-500">
              AI drafted quote for <strong className="text-slate-800">{customer.name}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleTriggerAiGeneration(job, profile?.trade_type || 'Plumbing')}
            disabled={aiLoading}
            className="apple-btn-secondary text-xs px-3.5 py-2"
          >
            {aiLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            )}
            Regenerate with Gemini
          </button>

          <button
            onClick={handleSaveQuote}
            className="apple-btn-secondary text-xs px-3.5 py-2"
          >
            <Save className="w-3.5 h-3.5 text-slate-700" />
            Save Draft
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="apple-btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            {pdfLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-700" />
            )}
            Download PDF
          </button>

          <button
            onClick={handleSendSMS}
            className="apple-btn-secondary text-xs px-3.5 py-2"
          >
            <Send className="w-3.5 h-3.5" />
            SMS Backup
          </button>

          {/* Primary WhatsApp Action Button */}
          <button
            onClick={handleSendWhatsApp}
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
          <span>Quote saved successfully! Work status updated to &quot;Quoted&quot;.</span>
        </div>
      )}

      {whatsappToast && (
        <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 flex items-center gap-3 text-amber-900 text-xs font-bold shadow-md animate-in fade-in">
          <Download className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
          <span>{whatsappToast}</span>
        </div>
      )}

      {/* Customer & Job Detail Banner */}
      <div className="apple-card p-6 bg-gradient-to-r from-blue-50/50 via-white to-white border-blue-100/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Client Contact
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

          <div className="md:col-span-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Reported Issue & Work Request
            </span>
            <p className="text-sm font-medium text-slate-800 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
              &quot;{job.problem}&quot;
            </p>
            {aiExplanation && (
              <p className="mt-2 text-[11px] text-blue-700 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                {aiExplanation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Quotation Line Items Table */}
      <div className="apple-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Itemized Estimate Line Items</h3>
            <p className="text-xs text-slate-500">Edit quantities, rates, or add custom charges below</p>
          </div>

          <button
            onClick={handleAddLineItem}
            className="apple-btn-secondary text-xs px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            + Add Line Item
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 w-28">Type</th>
                <th className="px-4 py-3 w-20">Qty / Hrs</th>
                <th className="px-4 py-3 w-28">Unit Rate (₹)</th>
                <th className="px-4 py-3 w-28">Total (₹)</th>
                <th className="px-4 py-3 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={item.type}
                      onChange={(e) => handleLineItemChange(item.id, 'type', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="labor">Labor</option>
                      <option value="material">Material</option>
                      <option value="fee">Fee</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(item.id, 'quantity', Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(item.id, 'unit_price', Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-4 py-3 font-extrabold text-slate-900 text-right">
                    ₹{(item.total || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemoveLineItem(item.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Total Box */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedLink ? 'Customer Link Copied!' : 'Copy Public Acceptance Link'}
            </button>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              TOTAL ESTIMATED QUOTE AMOUNT
            </span>
            <span className="text-3xl font-extrabold text-blue-600 tracking-tight">
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
