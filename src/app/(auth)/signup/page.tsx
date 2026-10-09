'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wrench, ArrowRight, Sparkles } from 'lucide-react';
import { updateLocalProfile } from '@/lib/store';
import { TradeType } from '@/types';

const TRADE_CATEGORIES: TradeType[] = [
  'Plumbing',
  'Electrical',
  'HVAC / Air Conditioning',
  'Carpentry',
  'Cleaning Services',
  'Home Technology',
];

export default function SignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [tradeType, setTradeType] = useState<TradeType>('Plumbing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      updateLocalProfile({
        business_name: businessName || `${tradeType} Solutions Pro`,
        owner_name: ownerName || 'Business Owner',
        trade_type: tradeType,
      });
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-blue-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 mb-4">
          <Wrench className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create TradeFlow Account</h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Automate quotes, invoicing, and Google reviews for your business
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 shadow-2xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 sm:px-10">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Plumbing & Drain Services"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Lead Contact Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Trade Service Industry *
              </label>
              <select
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value as TradeType)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {TRADE_CATEGORIES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full apple-btn-primary py-3.5 text-sm rounded-2xl shadow-lg shadow-blue-600/25 mt-4"
            >
              {loading ? 'Creating Account...' : 'Get Started with Free Tier'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
