'use client';

import React, { useState } from 'react';
import { X, UserPlus, Phone, MapPin, Calendar, Clock, Sparkles, Loader2 } from 'lucide-react';
import { addLocalCustomer, createLocalJob } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded?: () => void;
}

export function NewCustomerModal({ isOpen, onClose, onCustomerAdded }: NewCustomerModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [dateOfWork, setDateOfWork] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('Morning (8am - 12pm)');
  const [location, setLocation] = useState('');
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactNo || !problem) return;

    setLoading(true);

    try {
      // Create Customer
      const newCust = addLocalCustomer({
        name,
        contact_no: contactNo,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        location: location || 'Client Residence',
      });

      // Format combined date and time slot
      const formattedDate = dateOfWork ? `${dateOfWork} [${timeSlot}]` : null;

      // Create Job
      const newJob = createLocalJob({
        customer_id: newCust.id,
        title: problem.length > 30 ? problem.substring(0, 30) + '...' : problem,
        problem,
        work_status: 'Quoted',
        payment_status: 'Pending',
        amount: 0,
        date_of_work: formattedDate,
      });

      setLoading(false);
      setName('');
      setContactNo('');
      setLocation('');
      setProblem('');

      if (onCustomerAdded) onCustomerAdded();
      onClose();

      // Navigate to Quote view to generate instant AI quote
      router.push(`/quotes/${newJob.id}`);
    } catch (err) {
      console.error('Failed to save new customer:', err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Customer</h2>
              <p className="text-xs text-slate-500">Register client, set job date & time, & generate AI estimate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Robert Miller"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number (WhatsApp/Call) *</label>
            <input
              type="text"
              required
              placeholder="+91 98765 43210 or +1 (555) 000-0000"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Job Available Date & Time Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/80">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Available Job Date *
              </label>
              <input
                type="date"
                required
                value={dateOfWork}
                onChange={(e) => setDateOfWork(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Time Slot Available *
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Morning (8am - 12pm)">Morning (8am - 12pm)</option>
                <option value="Afternoon (12pm - 4pm)">Afternoon (12pm - 4pm)</option>
                <option value="Evening (4pm - 8pm)">Evening (4pm - 8pm)</option>
                <option value="Emergency / ASAP">Emergency / ASAP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Location / Address</label>
            <input
              type="text"
              placeholder="e.g. 104 Maple Street, Suite 4B"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Problem / Service Required *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the issue reported by the customer (e.g., Leaking water heater valve with low pressure; AC unit blowing warm air)"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500 inline" />
              Gemini AI will analyze this problem to generate itemized line items automatically.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="apple-btn-primary text-xs px-6 py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Save & Generate AI Quote
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
