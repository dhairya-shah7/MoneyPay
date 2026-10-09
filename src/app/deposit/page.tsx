'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Smartphone,
  Building2,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle,
  User,
  LogOut,
  Lock,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function DepositPage() {
  const router = useRouter();

  // Auth User State
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [preferredType, setPreferredType] = useState<'UPI' | 'BANK'>('UPI');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCurrentUser(data.data);
          if (data.data.name) {
            setCustomerName(data.data.name);
          }
        } else {
          // If not logged in, redirect to login with return path
          router.push('/login?redirect=/deposit');
        }
      })
      .catch(() => {
        router.push('/login?redirect=/deposit');
      })
      .finally(() => setCheckingAuth(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {}
  };

  const handleProceedToPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/payin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'mp_live_k928f01a89c20a1e3bf89',
        },
        body: JSON.stringify({
          amount: 0, // Open amount: customer fills any amount in their UPI app
          merchant_order_id: `DEP_${Date.now().toString().slice(-6)}`,
          user_id: currentUser?.userId,
          customer_name: customerName.trim() || currentUser?.name || 'Direct Depositor',
          customer_phone: customerPhone.trim() || undefined,
          customer_email: currentUser?.email,
          preferred_type: preferredType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.order_id) {
        // Immediately navigate to the payment interface
        router.push(`/pay/${data.order_id}`);
      } else {
        throw new Error(data.error || 'Failed to create payment session.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment service error. Please try again.');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 mb-3 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-bold text-slate-700">Verifying session...</p>
      </div>
    );
  }

  const isAdminUser = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OPERATIONS_AGENT';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Admin Top Notification Bar */}
      {isAdminUser && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs border-b border-slate-800">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-200">👑 Admin Session:</span>
              <span className="font-mono text-emerald-400">{currentUser.email}</span>
            </div>
            <div className="flex items-center gap-2 font-bold">
              <Link
                href="/admin"
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                ⚡ Admin Dashboard
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

      {/* Top Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-indigo-600 p-0.5 shadow-sm">
                <div className="w-full h-full bg-white rounded-[6px] flex items-center justify-center font-black text-xs text-emerald-600">
                  ₹
                </div>
              </div>
              <span className="font-black text-base text-slate-900 tracking-tight">MoneyPay</span>
            </div>
          </Link>

          {currentUser && (
            <div className="flex items-center gap-2">
              {isAdminUser && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-bold text-slate-800">{currentUser.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Deposit Form */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-1.5 pb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Bank & UPI Deposit</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Instant Deposit</h1>
            <p className="text-xs text-slate-500">
              Generate your dynamic payment QR and enter whatever amount you want directly in your UPI app.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleProceedToPay} className="space-y-5">
            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Depositor Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>
            </div>

            {/* Payment Rail Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredType('UPI')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    preferredType === 'UPI'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>UPI Apps / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreferredType('BANK')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    preferredType === 'BANK'
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bank Transfer (NEFT / IFT)</span>
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Open-amount deposit: scan the QR with any UPI app & enter whatever amount you want to pay.</span>
            </div>

            {/* Proceed to Pay CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Launching Payment Interface...</span>
                </>
              ) : (
                <>
                  <span>⚡ Get Payment QR & Pay Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 font-medium border-t border-slate-100">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>256-Bit SSL Encrypted Direct Settlement</span>
          </div>
        </div>
      </main>
    </div>
  );
}
