'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Users, DollarSign, Plus } from 'lucide-react';

export function BottomMobileNav({ onOpenNewCustomer }: { onOpenNewCustomer?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'Catalog', href: '/quote-data', icon: FileText },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Invoices', href: '/invoices', icon: DollarSign },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-lg md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}

        {onOpenNewCustomer && (
          <button
            onClick={onOpenNewCustomer}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/30 active:scale-95 transition-transform"
            aria-label="Add Customer"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
