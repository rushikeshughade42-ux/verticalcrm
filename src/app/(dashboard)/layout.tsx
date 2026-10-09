'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomMobileNav } from '@/components/BottomMobileNav';
import { NewCustomerModal } from '@/components/NewCustomerModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-8">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <BottomMobileNav onOpenNewCustomer={() => setIsNewCustomerModalOpen(true)} />

      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onCustomerAdded={() => {
          // Trigger event for child pages
          window.dispatchEvent(new Event('tradeflow_customer_added'));
        }}
      />
    </div>
  );
}
