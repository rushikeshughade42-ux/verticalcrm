'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  Phone,
  MapPin,
  Mail,
  ChevronRight,
  UserPlus,
  Search,
  Trash2,
  RotateCcw,
  Archive,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  getLocalCustomers,
  getDeletedCustomers,
  getLocalJobs,
  deleteLocalCustomer,
  restoreLocalCustomer,
  permanentlyDeleteCustomer,
} from '@/lib/store';
import { Customer, Job } from '@/types';
import { NewCustomerModal } from '@/components/NewCustomerModal';
import { DeleteCustomerModal } from '@/components/DeleteCustomerModal';
import { UndoToast } from '@/components/UndoToast';

function CustomersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deletedCustomers, setDeletedCustomers] = useState<(Customer & { deleted_at?: string })[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');

  // Modals & Toast state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Undo Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [lastDeletedCustomer, setLastDeletedCustomer] = useState<Customer | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = () => {
    setCustomers(getLocalCustomers());
    setDeletedCustomers(getDeletedCustomers());
    setJobs(getLocalJobs());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('tradeflow_customer_updated', handleUpdate);
    return () => window.removeEventListener('tradeflow_customer_updated', handleUpdate);
  }, []);

  // Check URL searchParams for undo prompt (e.g., from customer profile deletion redirect)
  useEffect(() => {
    const undoId = searchParams.get('undoId');
    const deletedName = searchParams.get('deletedName');
    if (undoId) {
      const found = getDeletedCustomers().find((c) => c.id === undoId);
      if (found) {
        setLastDeletedCustomer(found);
        setToastMessage(`Customer "${found.name || deletedName || 'Record'}" was removed.`);
        setToastVisible(true);
      } else if (deletedName) {
        setToastMessage(`Customer "${deletedName}" was removed.`);
        setToastVisible(true);
      }
      // Clean query params from URL without reload
      router.replace('/customers');
    }
  }, [searchParams, router]);

  // Handle Delete Confirmation
  const handleConfirmDelete = (customer: Customer) => {
    const deleted = deleteLocalCustomer(customer.id);
    setCustomerToDelete(null);
    if (deleted) {
      setLastDeletedCustomer(deleted);
      setToastMessage(`Customer "${deleted.name}" was removed.`);
      setToastVisible(true);
      loadData();
    }
  };

  // Handle Undo Deletion
  const handleUndo = () => {
    if (!lastDeletedCustomer) return;
    const restored = restoreLocalCustomer(lastDeletedCustomer.id);
    if (restored) {
      setToastVisible(false);
      setLastDeletedCustomer(null);
      loadData();
    }
  };

  // Handle Restore from Trash tab
  const handleRestoreFromTrash = (id: string, name: string) => {
    restoreLocalCustomer(id);
    loadData();
  };

  // Handle Permanent Delete
  const handlePermanentDelete = (id: string, name: string) => {
    if (confirm(`Permanently purge "${name}" from memory? This action cannot be undone.`)) {
      permanentlyDeleteCustomer(id);
      loadData();
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_no.includes(search) ||
      (c.location && c.location.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredDeletedCustomers = deletedCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_no.includes(search) ||
      (c.location && c.location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer CRM Directory</h1>
          <p className="mt-1 text-xs text-slate-500">
            Chronological job records, contact history, and customer lifecycle profile
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="apple-btn-primary text-xs px-4 py-2.5 shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          + Add New Customer
        </button>
      </div>

      {/* Directory Card */}
      <div className="apple-card overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-full border border-slate-200 bg-slate-50 w-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Navigation Tabs: Active Directory vs Recently Deleted */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full text-xs font-semibold">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  activeTab === 'active'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Active Clients ({customers.length})
              </button>

              <button
                onClick={() => setActiveTab('deleted')}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  activeTab === 'deleted'
                    ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold border border-rose-200'
                    : 'text-slate-500 hover:text-rose-600'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Recently Deleted ({deletedCustomers.length})
              </button>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing {activeTab === 'active' ? filteredCustomers.length : filteredDeletedCustomers.length} Records
          </span>
        </div>

        {/* Directory Content */}
        {activeTab === 'active' ? (
          <div className="divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Customers Found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Add a new client to manage quotes, jobs, and reviews.
                </p>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const customerJobs = jobs.filter((j) => j.customer_id === c.id);
                return (
                  <div
                    key={c.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {c.name}
                        </h3>
                        <span className="apple-pill bg-slate-100 text-slate-700 text-[10px]">
                          {customerJobs.length} Jobs
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {c.contact_no}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {c.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {c.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center">
                      <Link
                        href={`/customers/${c.id}`}
                        className="apple-btn-secondary text-xs px-3.5 py-1.5"
                      >
                        View Profile
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      <button
                        onClick={() => setCustomerToDelete(c)}
                        title="Remove customer profile"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Deleted Customers View */
          <div className="divide-y divide-slate-100 bg-slate-50/40">
            {filteredDeletedCustomers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Trash is empty</p>
                <p className="text-xs text-slate-400 mt-1">No recently removed customer profiles.</p>
              </div>
            ) : (
              filteredDeletedCustomers.map((c) => (
                <div
                  key={c.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 hover:bg-white transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-700 line-through decoration-rose-300">
                        {c.name}
                      </h3>
                      <span className="apple-pill bg-rose-100 text-rose-800 text-[10px]">
                        Removed
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-300" />
                        {c.contact_no}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-300" />
                        {c.email}
                      </span>
                      {c.deleted_at && (
                        <span className="text-[11px] text-slate-400 italic">
                          Deleted: {new Date(c.deleted_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      onClick={() => handleRestoreFromTrash(c.id, c.name)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore Profile
                    </button>

                    <button
                      onClick={() => handlePermanentDelete(c.id, c.name)}
                      title="Permanently purge"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* New Customer Modal */}
      <NewCustomerModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCustomerAdded={loadData}
      />

      {/* Delete Customer Modal */}
      <DeleteCustomerModal
        isOpen={!!customerToDelete}
        customer={customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Floating Undo Toast Banner */}
      <UndoToast
        isVisible={toastVisible}
        message={toastMessage}
        subMessage="Click Undo to restore this client immediately"
        onUndo={handleUndo}
        onDismiss={() => setToastVisible(false)}
        duration={10000}
      />
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-400">Loading directory...</div>}>
      <CustomersContent />
    </Suspense>
  );
}
