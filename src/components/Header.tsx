'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wrench, Shield, FileText, Users, DollarSign, Star, Sparkles, ChevronDown } from 'lucide-react';
import { getLocalProfile, updateLocalProfile, DEFAULT_SERVICE_CATALOG } from '@/lib/store';
import { TradeType, Profile } from '@/types';

const TRADE_TYPES: TradeType[] = [
  'Plumbing',
  'Electrical',
  'HVAC / Air Conditioning',
  'Carpentry',
  'Cleaning Services',
  'Home Technology',
];

export function Header() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setProfile(getLocalProfile());
  }, []);

  const handleSwitchTrade = (newTrade: TradeType) => {
    const updated = updateLocalProfile({ trade_type: newTrade });
    setProfile(updated);
    setDropdownOpen(false);
    // Reload page to reflect trade service catalog changes
    window.location.reload();
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Users },
    { label: 'Quote Data', href: '/quote-data', icon: FileText },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Invoices', href: '/invoices', icon: DollarSign },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900">TradeFlow</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                  AI CRM
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {profile?.business_name || 'Home Services SMB'}
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Trade Selector Badge & Account */}
        <div className="flex items-center gap-3">
          {/* Trade Category Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>{profile?.trade_type || 'Plumbing'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Trade Industry
                </div>
                {TRADE_TYPES.map((trade) => (
                  <button
                    key={trade}
                    onClick={() => handleSwitchTrade(trade)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium rounded-xl transition-colors ${
                      profile?.trade_type === trade
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {trade}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/login"
            className="hidden sm:inline-flex text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Log Out
          </Link>
        </div>
      </div>
    </header>
  );
}
