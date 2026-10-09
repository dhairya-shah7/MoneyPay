import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MoneyPay - Direct UPI & Bank Deposit Gateway',
  description: 'High-speed UPI Intent, Dynamic QR, and Instant Bank Transfer Deposit Gateway with Automated UTR Reconciliation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
