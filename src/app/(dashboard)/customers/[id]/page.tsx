'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  User,
  Phone,
  MapPin,
  Mail,
  ArrowLeft,
  Calendar,
  Sparkles,
  FileText,
  DollarSign,
  Star,
  Plus,
  Clock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  getLocalCustomers,
  getLocalJobs,
  getLocalQuotes,
  getLocalInvoices,
  getLocalReviews,
  getLocalProfile,
  getOrCreateReviewForJob,
  createLocalJob,
  deleteLocalCustomer,
  getAppBaseUrl,
} from '@/lib/store';
import { generateWhatsAppUri, whatsappTemplates } from '@/lib/whatsapp';
import { subscribeReviewsFirestore } from '@/lib/firebase/db';
import { Customer, Job, Quote, Invoice, Review } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { DeleteCustomerModal } from '@/components/DeleteCustomerModal';

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [newJobProblem, setNewJobProblem] = useState('');
  const [showAddJob, setShowAddJob] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadCustomerData = () => {
    const custs = getLocalCustomers();
    const found = custs.find((c) => c.id === id);
    if (found) {
      setCustomer(found);
      const allJobs = getLocalJobs().filter((j) => j.customer_id === found.id);
      setJobs(allJobs);
      setQuotes(getLocalQuotes());
      setInvoices(getLocalInvoices());
      setReviews(getLocalReviews());
    }
  };

  useEffect(() => {
    loadCustomerData();

    const handleUpdate = () => loadCustomerData();
    window.addEventListener('tradeflow_customer_updated', handleUpdate);
    window.addEventListener('tradeflow_review_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    const unsubReviews = subscribeReviewsFirestore((remoteReviews) => {
      if (remoteReviews && remoteReviews.length > 0) {
        setReviews(remoteReviews);
      }
    });

    return () => {
      window.removeEventListener('tradeflow_customer_updated', handleUpdate);
      window.removeEventListener('tradeflow_review_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
      unsubReviews();
    };
  }, [id]);

  const handleCreateNewJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobProblem || !customer) return;

    const newJob = createLocalJob({
      customer_id: customer.id,
      title: newJobProblem.length > 30 ? newJobProblem.substring(0, 30) + '...' : newJobProblem,
      problem: newJobProblem,
      work_status: 'Quoted',
      payment_status: 'Pending',
      amount: 0,
      date_of_work: null,
    });

    setNewJobProblem('');
    setShowAddJob(false);
    loadCustomerData();
  };

  const handleConfirmDelete = (targetCustomer: Customer) => {
    deleteLocalCustomer(targetCustomer.id);
    setIsDeleteModalOpen(false);
    router.push(`/customers?undoId=${targetCustomer.id}&deletedName=${encodeURIComponent(targetCustomer.name)}`);
  };

  // Find all completed reviews associated with this customer
  const customerJobIds = new Set(jobs.map((j) => j.id));
  const customerCleanJobIds = jobs.map((j) => j.id.replace(/^job-/, ''));

  const customerReviews = reviews.filter((r) => {
    if (r.status !== 'Completed' && (!r.rating || r.rating === 0)) return false;

    if (r.job_id && customerJobIds.has(r.job_id)) return true;

    if (r.review_token) {
      for (const cId of customerCleanJobIds) {
        if (cId && r.review_token.includes(cId)) return true;
      }
    }

    if (r.job_id) {
      for (const cId of customerCleanJobIds) {
        if (cId && r.job_id.includes(cId)) return true;
      }
    }

    return false;
  });

  if (!customer) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p>Loading customer profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{customer.name}</h1>
            <p className="text-xs text-slate-500">Customer Profile & Chronological Lifecycle</p>
          </div>
        </div>

        {/* Header Action: Remove Customer */}
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-2xs"
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          Remove Customer
        </button>
      </div>

      {/* Customer Info Card */}
      <div className="apple-card p-6 bg-gradient-to-r from-blue-50/40 via-white to-white border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Contact Phone
            </span>
            <a
              href={`tel:${customer.contact_no}`}
              className="text-sm font-bold text-slate-900 hover:text-blue-600 font-mono flex items-center gap-1.5"
            >
              <Phone className="w-4 h-4 text-blue-500" />
              {customer.contact_no}
            </a>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Email Address
            </span>
            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {customer.email}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Primary Location
            </span>
            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {customer.location}
            </p>
          </div>
        </div>
      </div>

      {/* Dedicated Customer Review & Rating Record Section (Renders only when customer fills review) */}
      {customerReviews.length > 0 && (
        <div className="apple-card p-6 space-y-4 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/40 border-amber-200/90 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between border-b border-amber-200/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-amber-500/20">
                <Star className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Customer Review & Rating Record</h2>
                <p className="text-xs text-slate-500">Submitted rating and feedback from {customer.name}</p>
              </div>
            </div>

            <span className="apple-pill bg-amber-100 text-amber-900 border-amber-300 font-extrabold text-xs">
              {customerReviews.length} Review(s) Received
            </span>
          </div>

          <div className="space-y-3">
            {customerReviews.map((rev) => (
              <div key={rev.id} className="bg-white p-4 rounded-2xl border border-amber-100/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= (rev.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-extrabold text-amber-900">
                      {rev.rating || 5}-Star Customer Rating
                    </span>
                  </div>

                  <span
                    className={`apple-pill text-[10px] font-extrabold ${
                      rev.rating && rev.rating >= 4
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-purple-50 text-purple-800 border-purple-200'
                    }`}
                  >
                    {rev.rating && rev.rating >= 4 ? '5-Star Google Review' : 'Private Management Feedback'}
                  </span>
                </div>

                {rev.feedback_text ? (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-800">
                    <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1">
                      Submitted Customer Feedback Comments:
                    </p>
                    <p className="italic text-slate-800 font-medium leading-relaxed">&quot;{rev.feedback_text}&quot;</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Customer selected {rev.rating || 5} stars on Google Maps without additional written comments.
                  </p>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-amber-100/60">
                  <span>Status: Verified Customer Review</span>
                  <span>Submitted: {new Date(rev.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jobs & Lifecycle Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Service Jobs History ({jobs.length})</h2>

          <button
            onClick={() => setShowAddJob(!showAddJob)}
            className="apple-btn-primary text-xs px-3.5 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            + Request New Service Job
          </button>
        </div>

        {showAddJob && (
          <form
            onSubmit={handleCreateNewJob}
            className="apple-card p-5 bg-slate-50 border-blue-200 space-y-3 animate-in fade-in"
          >
            <h3 className="text-xs font-bold text-slate-800">Add Service Call for {customer.name}</h3>
            <textarea
              required
              rows={2}
              placeholder="Describe reported issue or service request..."
              value={newJobProblem}
              onChange={(e) => setNewJobProblem(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddJob(false)}
                className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 font-medium"
              >
                Cancel
              </button>
              <button type="submit" className="apple-btn-primary text-xs px-4 py-1.5">
                Save & Create Job
              </button>
            </div>
          </form>
        )}

        {jobs.length === 0 ? (
          <div className="apple-card p-8 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-700">No Job History Yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((j) => {
              const q = quotes.find((quoteItem) => quoteItem.job_id === j.id);
              const inv = invoices.find((invItem) => invItem.job_id === j.id);
              const cleanJobId = j.id.replace(/^job-/, '');

              const rev = reviews.find(
                (revItem) =>
                  revItem.job_id === j.id ||
                  (revItem.job_id && cleanJobId && (revItem.job_id === `job-${cleanJobId}` || revItem.job_id.endsWith(cleanJobId))) ||
                  (revItem.review_token && cleanJobId && revItem.review_token.includes(cleanJobId)) ||
                  (revItem.review_token && revItem.review_token.includes(j.id))
              );

              return (
                <div key={j.id} className="apple-card p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{j.title || j.problem}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Created: {new Date(j.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge type="work" status={j.work_status} />
                      <StatusBadge type="payment" status={j.payment_status} />
                    </div>
                  </div>

                  {/* Lifecycle Steps Bar */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Chronological Lifecycle
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block font-bold">1. QUOTE</span>
                        {q ? (
                          <Link href={`/quotes/${j.id}`} className="font-bold text-blue-600 hover:underline">
                            ₹{q.total_amount.toLocaleString('en-IN')} ({q.status})
                          </Link>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block font-bold">2. SCHEDULED</span>
                        <span className="font-bold text-slate-800">{j.date_of_work || 'Unscheduled'}</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block font-bold">3. INVOICE</span>
                        {inv ? (
                          <Link href={`/invoices/${j.id}`} className="font-bold text-blue-600 hover:underline">
                            {inv.invoice_number} (₹{inv.amount.toLocaleString('en-IN')})
                          </Link>
                        ) : (
                          <Link
                            href={`/invoices/${j.id}`}
                            className="font-bold text-blue-600 hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                          >
                            <FileText className="w-3 h-3" />
                            + Generate Invoice
                          </Link>
                        )}
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block font-bold">4. REVIEW</span>
                        {rev ? (
                          rev.status === 'Completed' || (rev.rating && rev.rating > 0) ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-amber-600 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {rev.rating || 5} Stars Received
                              </span>
                              {rev.feedback_text && (
                                <p className="text-[10px] text-slate-500 italic truncate max-w-[120px]" title={rev.feedback_text}>
                                  &quot;{rev.feedback_text}&quot;
                                </p>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const prof = getLocalProfile();
                                const baseUrl = getAppBaseUrl();
                                const reviewUrl = `${baseUrl}/review/${rev.review_token}`;
                                const text = whatsappTemplates.review({
                                  name: customer.name,
                                  business_name: prof.business_name || 'Apex Plumbing',
                                  review_url: reviewUrl,
                                });
                                const waUrl = generateWhatsAppUri(customer.contact_no, text);
                                window.open(waUrl, '_blank');
                              }}
                              className="inline-flex items-center gap-1 font-bold text-amber-700 hover:text-amber-800 hover:underline text-[11px] mt-0.5 cursor-pointer"
                              title="Review request link sent! Click to re-send via WhatsApp"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending (Re-send)
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              const targetRev = getOrCreateReviewForJob(j.id);
                              const prof = getLocalProfile();
                              const baseUrl = getAppBaseUrl();
                              const reviewUrl = `${baseUrl}/review/${targetRev.review_token}`;
                              const text = whatsappTemplates.review({
                                name: customer.name,
                                business_name: prof.business_name || 'Apex Plumbing',
                                review_url: reviewUrl,
                              });
                              const waUrl = generateWhatsAppUri(customer.contact_no, text);
                              window.open(waUrl, '_blank');
                              loadCustomerData();
                            }}
                            className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700 hover:underline text-[11px] mt-0.5 cursor-pointer"
                          >
                            <Star className="w-3 h-3 text-emerald-500" />
                            + Send Review (WhatsApp)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Customer Review & Feedback Card (Appears only when customer fills review) */}
                  {rev && (rev.status === 'Completed' || (rev.rating && rev.rating > 0)) && (
                    <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/40 p-4 rounded-2xl border border-amber-200/80 space-y-2.5 animate-in fade-in mt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (rev.rating || 5)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-extrabold text-amber-900">
                            {rev.rating || 5}-Star Customer Rating & Review
                          </span>
                        </div>

                        <span
                          className={`apple-pill text-[10px] font-extrabold ${
                            rev.rating && rev.rating >= 4
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-purple-100 text-purple-800 border-purple-300'
                          }`}
                        >
                          {rev.rating && rev.rating >= 4 ? 'Public Google Review' : 'Private Management Feedback'}
                        </span>
                      </div>

                      {rev.feedback_text ? (
                        <div className="bg-white/80 p-3 rounded-xl border border-amber-100 text-xs text-slate-800">
                          <p className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-0.5">
                            Submitted Customer Feedback:
                          </p>
                          <p className="italic text-slate-800 font-medium">&quot;{rev.feedback_text}&quot;</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          Customer submitted rating on Google Business Profile without written comments.
                        </p>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-amber-100/60">
                        <span>Status: Verified Customer Review</span>
                        <span>Submitted: {new Date(rev.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Customer Confirmation Modal */}
      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        customer={customer}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
