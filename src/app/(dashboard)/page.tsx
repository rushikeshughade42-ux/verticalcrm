'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  DollarSign,
  UserPlus,
  PlusCircle,
  FileText,
  Sparkles,
  ArrowUpRight,
  Filter,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Star,
} from 'lucide-react';
import {
  getLocalCustomers,
  getLocalJobs,
  getLocalInvoices,
  getLocalReviews,
  getLocalProfile,
  getOrCreateReviewForJob,
  getAppBaseUrl,
} from '@/lib/store';
import { generateWhatsAppUri, whatsappTemplates } from '@/lib/whatsapp';
import { subscribeReviewsFirestore } from '@/lib/firebase/db';
import { Customer, Job, Invoice, Review, Profile } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { NewCustomerModal } from '@/components/NewCustomerModal';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Quoted' | 'Scheduled' | 'Done' | 'Pending'>('All');
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [viewingFeedback, setViewingFeedback] = useState<{
    customerName: string;
    rating: number;
    text: string;
  } | null>(null);

  const loadData = () => {
    setProfile(getLocalProfile());
    setCustomers(getLocalCustomers());
    setJobs(getLocalJobs());
    setInvoices(getLocalInvoices());
    setReviews(getLocalReviews());
  };

  useEffect(() => {
    loadData();

    const handleCustomerChange = () => loadData();
    window.addEventListener('tradeflow_customer_added', handleCustomerChange);
    window.addEventListener('tradeflow_customer_updated', handleCustomerChange);
    window.addEventListener('tradeflow_review_updated', handleCustomerChange);
    window.addEventListener('storage', handleCustomerChange);
    window.addEventListener('focus', handleCustomerChange);

    // Real-time Firestore sync for incoming reviews from customer devices
    const unsubReviews = subscribeReviewsFirestore((remoteReviews) => {
      if (remoteReviews && remoteReviews.length > 0) {
        setReviews(remoteReviews);
      }
    });

    return () => {
      window.removeEventListener('tradeflow_customer_added', handleCustomerChange);
      window.removeEventListener('tradeflow_customer_updated', handleCustomerChange);
      window.removeEventListener('tradeflow_review_updated', handleCustomerChange);
      window.removeEventListener('storage', handleCustomerChange);
      window.removeEventListener('focus', handleCustomerChange);
      unsubReviews();
    };
  }, []);

  // Filter jobs to only include active (non-deleted) customers
  const activeCustomerIds = new Set(customers.map((c) => c.id));
  const activeJobs = jobs.filter((j) => activeCustomerIds.has(j.customer_id));

  // Compute key metric totals
  const totalCustomersCount = customers.length;
  const pendingInvoices = activeJobs.filter((j) => j.payment_status === 'Pending');
  const totalPendingAmount = pendingInvoices.reduce((sum, j) => sum + (j.amount || 0), 0);

  // Combine active jobs with customer, invoice, and review data for table display
  const combinedRows = activeJobs.map((job) => {
    const cust = customers.find((c) => c.id === job.customer_id)!;
    const inv = invoices.find((i) => i.job_id === job.id);
    const cleanJobId = job.id.replace(/^job-/, '');

    const rev = reviews.find(
      (r) =>
        r.job_id === job.id ||
        (r.job_id && cleanJobId && (r.job_id === `job-${cleanJobId}` || r.job_id.endsWith(cleanJobId))) ||
        (r.review_token && cleanJobId && r.review_token.includes(cleanJobId)) ||
        (r.review_token && r.review_token.includes(job.id))
    );

    return {
      job,
      customer: cust,
      invoice: inv,
      review: rev,
    };
  });

  // Filter rows by search & status tab
  const filteredRows = combinedRows.filter(({ job, customer }) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact_no.includes(searchQuery) ||
      job.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.location && customer.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'All') return true;
    if (statusFilter === 'Pending') return job.payment_status === 'Pending';
    return job.work_status === statusFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Operational Control Center
            </h1>
            <span className="apple-pill bg-blue-50 text-blue-700 border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-500" />
              {profile?.trade_type || 'Plumbing'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Automated quotes, billing & Google reviews for {profile?.business_name || 'Home Service SMB'}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="apple-btn-primary text-xs px-4 py-2.5 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            + Add New Customer
          </button>

          <Link
            href="/quote-data"
            className="apple-btn-secondary text-xs px-4 py-2.5"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            + Add Quote Data
          </Link>
        </div>
      </div>

      {/* Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {/* Card 1: Total Customer */}
        <div className="apple-card p-6 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Customer
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalCustomersCount}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Active CRM
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Unique client service records saved</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Payment Pending */}
        <div className="apple-card p-6 flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Payment Pending
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-orange-600 tracking-tight">
                ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </span>
              <span className="apple-pill bg-orange-100 text-orange-800 border border-orange-200">
                {pendingInvoices.length} Pending
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Awaiting customer online payment link completion</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 group-hover:scale-105 transition-transform">
            <DollarSign className="w-7 h-7" />
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Customer Information Table Section */}
      <div className="apple-card overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Customer & Job Records</h2>
            <p className="text-xs text-slate-500">Live service lifecycle, quotes, and invoice status</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, phone, problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-xs rounded-full border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full text-xs font-semibold">
              {(['All', 'Quoted', 'Scheduled', 'Done', 'Pending'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-full transition-all ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'Pending' ? 'Pay Pending' : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Contact No.</th>
                <th className="px-5 py-3.5">Problem / Service</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Work Status</th>
                <th className="px-5 py-3.5">Payment Status</th>
                <th className="px-5 py-3.5">Review</th>
                <th className="px-5 py-3.5">Date of Work</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No customer records found</p>
                      <p className="text-xs text-slate-400">Click &quot;+ Add New Customer&quot; above to create your first client record.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ job, customer, invoice, review }) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Name */}
                    <td className="px-5 py-4 font-bold text-slate-900">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
                      >
                        {customer.name}
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                      </Link>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4 font-mono text-slate-600">
                      <a href={`tel:${customer.contact_no}`} className="hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {customer.contact_no}
                      </a>
                    </td>

                    {/* Problem */}
                    <td className="px-5 py-4 max-w-xs">
                      <p className="truncate text-slate-800 font-medium" title={job.problem}>
                        {job.problem}
                      </p>
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4 text-slate-500">
                      <div className="flex items-center gap-1 max-w-xs truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.location || 'Springfield'}</span>
                      </div>
                    </td>

                    {/* Work Status */}
                    <td className="px-5 py-4">
                      <StatusBadge type="work" status={job.work_status} />
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-4">
                      <StatusBadge type="payment" status={job.payment_status} />
                    </td>

                    {/* Review Status */}
                    <td className="px-5 py-4">
                      {review ? (
                        review.status === 'Completed' ? (
                          review.rating && review.rating >= 4 ? (
                            <span className="apple-pill bg-amber-50 text-amber-700 border border-amber-200">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                              {review.rating}★ Google
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                setViewingFeedback({
                                  customerName: customer.name,
                                  rating: review.rating || 0,
                                  text: review.feedback_text || 'No comments provided',
                                })
                              }
                              className="apple-pill bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer font-bold"
                              title="Click to read private feedback"
                            >
                              Internal ({review.rating}★ Feedback)
                            </button>
                          )
                        ) : (
                          /* Review link sent, awaiting customer submission */
                          <button
                            onClick={() => {
                              const prof = getLocalProfile();
                              const baseUrl = getAppBaseUrl();
                              const reviewUrl = `${baseUrl}/review/${review.review_token}`;
                              const text = whatsappTemplates.review({
                                name: customer.name,
                                business_name: prof.business_name || 'Apex Plumbing',
                                review_url: reviewUrl,
                              });
                              const waUrl = generateWhatsAppUri(customer.contact_no, text);
                              window.open(waUrl, '_blank');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
                            title="Review request link sent! Click to re-send via WhatsApp"
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending (Re-send)
                          </button>
                        )
                      ) : (
                        /* Review link not sent yet */
                        <button
                          onClick={() => {
                            const targetRev = getOrCreateReviewForJob(job.id);
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
                            loadData();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-2xs"
                          title="Send Google Review Request via WhatsApp"
                        >
                          <Star className="w-3 h-3 text-emerald-600" />
                          + Send Review
                        </button>
                      )}
                    </td>

                    {/* Date of Work */}
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      {job.date_of_work ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{job.date_of_work}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/quotes/${job.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        {job.work_status === 'Quoted' ? 'Quote' : 'View Quote'}
                      </Link>

                      <Link
                        href={`/invoices/${job.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        Invoice
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Trigger Helper */}
      <NewCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onCustomerAdded={loadData}
      />

      {/* Private Internal Feedback Modal */}
      {viewingFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="apple-card max-w-md w-full p-6 space-y-4 shadow-2xl bg-white border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                  {viewingFeedback.rating}★
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Private Customer Feedback</h3>
                  <p className="text-[11px] text-slate-500">From {viewingFeedback.customerName}</p>
                </div>
              </div>
              <span className="apple-pill bg-purple-50 text-purple-700 text-[10px] font-bold">Internal Only</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Customer Comments</p>
              <p className="text-xs text-slate-800 leading-relaxed italic">"{viewingFeedback.text}"</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingFeedback(null)}
                className="apple-btn-primary text-xs px-5 py-2"
              >
                Close Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
