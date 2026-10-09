import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradeFlow — Vertical AI CRM for Home Service SMBs',
  description:
    'Automated customer management, AI quotations, invoices, payments, and reputation review collection for plumbers, electricians, HVAC technicians, carpenters, and cleaners.',
  keywords: [
    'Trade CRM',
    'Plumber CRM',
    'Electrician Software',
    'HVAC Invoicing',
    'AI Quote Generator',
    'Stripe Invoice',
    'Home Services CRM',
  ],
  authors: [{ name: 'TradeFlow Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0066cc',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="flex min-h-full flex-col text-slate-900">
        {children}
      </body>
    </html>
  );
}
