'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wrench, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { updateLocalProfile } from '@/lib/store';
import { TradeType } from '@/types';

const TRADE_CATEGORIES: { type: TradeType; desc: string; icon: string }[] = [
  { type: 'Plumbing', desc: 'Leaks, pipes, water heaters & drains', icon: '🚰' },
  { type: 'Electrical', desc: 'Panels, EV chargers, wiring & fixtures', icon: '⚡' },
  { type: 'HVAC / Air Conditioning', desc: 'AC compressors, heating & smart thermostats', icon: '❄️' },
  { type: 'Carpentry', desc: 'Hardwood framing, trim & custom woodwork', icon: '🔨' },
  { type: 'Cleaning Services', desc: 'Deep steam clean, commercial & residential', icon: '🧹' },
  { type: 'Home Technology', desc: 'Smart security, IP cameras & home automation', icon: '🎥' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@tradeflow.app');
  const [password, setPassword] = useState('password123');
  const [selectedTrade, setSelectedTrade] = useState<TradeType>('Plumbing');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      updateLocalProfile({
        trade_type: selectedTrade,
        business_name: `${selectedTrade} Master Services`,
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
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">TradeFlow</h1>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          Vertical AI CRM for Home Service Contractors
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 shadow-2xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 sm:px-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Select Your Specialized Trade *
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {TRADE_CATEGORIES.map((cat) => {
                  const isSelected = selectedTrade === cat.type;
                  return (
                    <button
                      key={cat.type}
                      type="button"
                      onClick={() => setSelectedTrade(cat.type)}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl mb-1">{cat.icon}</span>
                      <span className="text-xs font-bold text-slate-900 leading-snug">{cat.type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full apple-btn-primary py-3.5 text-sm rounded-2xl shadow-lg shadow-blue-600/25"
            >
              {loading ? 'Logging in...' : 'Sign In to TradeFlow Control Center'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
                Create new business account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
