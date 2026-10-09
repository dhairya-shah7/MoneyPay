'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ShieldCheck,
  Building2,
  QrCode,
  ArrowRight,
  Sparkles,
  Receipt,
  Scan,
  Smartphone,
  CheckCircle2,
  Lock,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  CreditCard,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Auth User State
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCurrentUser(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAuth(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      router.refresh();
    } catch {}
  };

  const handleMainCTA = () => {
    if (currentUser) {
      router.push('/deposit');
    } else {
      router.push('/login?redirect=/deposit');
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdminUser = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OPERATIONS_AGENT';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans antialiased">
      {/* Admin Top Notification Bar */}
      {isAdminUser && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-200">👑 Super Admin Active:</span>
              <span className="font-mono text-emerald-400">{currentUser.email}</span>
            </div>
            <div className="flex items-center gap-2 font-bold">
              <Link
                href="/admin"
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                ⚡ Open Admin Panel
              </Link>
              <Link
                href="/admin/transactions"
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
              >
                📋 Approve Transactions
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 p-0.5 shadow-md shadow-emerald-500/10">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-black text-emerald-600">
                ₹
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-slate-900">MoneyPay</span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                  DIRECT GATEWAY
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop & Mobile Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span className="font-bold text-slate-800">{currentUser.name}</span>
                </div>

                {isAdminUser && (
                  <Link
                    href="/admin"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-rose-700 text-xs font-bold transition-colors border border-rose-200 flex items-center gap-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors border border-slate-200 shadow-xs"
                >
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <span>Create Account</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-16 flex-1 flex flex-col justify-center text-center">
        <div className="space-y-6 max-w-3xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Next-Generation PayIn & Direct Settlement Protocol</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
            Instant Direct Deposit &{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
              Payment Gateway
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Zero intermediary fees, dynamic UPI QR codes, 1-click payment apps intent, smart screenshot OCR, and automated bank reconciliation.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAdminUser ? (
              <>
                <Link
                  href="/admin"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg shadow-slate-900/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-5 h-5 text-emerald-400" />
                  <span>Enter Admin Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/admin/transactions"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-200" />
                  <span>Review Pending UTRs</span>
                </Link>

                <Link
                  href="/deposit"
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-base border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>Test Deposit UI</span>
                </Link>
              </>
            ) : (
              <button
                onClick={handleMainCTA}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                <span>Proceed to Pay / Make a Deposit</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {!currentUser && (
            <p className="text-xs text-slate-400 font-medium">
              * Secure authentication required before initiating transactions
            </p>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Dynamic UPI QR</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Auto-locks exact deposit amounts with custom transaction references across PhonePe, GPay, Paytm, and BHIM.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">1-Click UPI Intent</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Opens UPI apps directly on mobile devices with zero manual VPA typing errors.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Smart Screenshot OCR</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Client-side Tesseract OCR auto-detects 12-digit UTR numbers directly from payment screenshots.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Authentic Bill Receipts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Prints genuine black-and-white payment vouchers with no technical jargon or web artifacts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>© 2026 MoneyPay Payment Gateway. Direct Settlement & Automated Bank Reconciliation.</p>
      </footer>
    </div>
  );
}
