'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QrCode, Smartphone, Building2, Shield, AlertCircle, Loader2, CheckCircle, XCircle, LayoutDashboard, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { CheckoutHeader } from '@/components/checkout/Header';
import { UpiIntentSection } from '@/components/checkout/UpiIntentSection';
import { QrCodeSection } from '@/components/checkout/QrCodeSection';
import { BankTransferSection } from '@/components/checkout/BankTransferSection';
import { UtrSubmissionForm } from '@/components/checkout/UtrSubmissionForm';
import { PaymentStatusModal } from '@/components/checkout/PaymentStatusModal';
import { PrintableReceipt } from '@/components/checkout/PrintableReceipt';
import { PayinOrder } from '@/lib/types';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<PayinOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upi_intent' | 'qr' | 'bank'>('qr');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Admin Detection
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCurrentUser(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const isAdminUser = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'OPERATIONS_AGENT';

  // Fetch Order
  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/v1/payin/status/${orderId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Order not found or has expired');
        setLoading(false);
        return;
      }
      setOrder(data.order);
      if (data.order?.assignedType === 'BANK') {
        setActiveTab('bank');
      }
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to gateway');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    fetchOrder();

    // Setup polling every 3s for live state synchronization
    const pollInterval = setInterval(() => {
      fetch(`/api/v1/payin/status/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order) {
            setOrder((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(data.order)) {
                return data.order;
              }
              return prev;
            });
          }
        })
        .catch((e) => console.log('Poll error:', e));
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId]);

  const handleUtrSubmit = async (utr: string, screenshotBase64?: string, paidAmount?: string) => {
    setIsSubmittingUtr(true);
    try {
      const res = await fetch('/api/v1/payin/submit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          utr,
          screenshot: screenshotBase64,
          paid_amount: paidAmount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.order);
      } else {
        alert(data.error || 'Failed to submit UTR');
      }
    } catch (err: any) {
      alert('Network error submitting UTR. Please try again.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const handleAdminAction = async (action: 'APPROVE' | 'REJECT') => {
    if (!order) return;
    setIsApproving(true);
    try {
      const res = await fetch('/api/v1/admin/transactions/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          action,
          receivedAmount: order.amount,
          reason: action === 'APPROVE' ? 'Quick 1-click Approval by Super Admin' : 'Rejected by Admin',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrder(data.order);
      } else {
        alert(data.error || 'Failed executing admin action');
      }
    } catch (err: any) {
      alert('Error: ' + err?.message);
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 mb-3 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm text-slate-600 font-semibold">Securing payment session...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 shadow-lg rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Invalid Payment Session</h2>
          <p className="text-xs text-slate-500">{error || 'This order could not be located.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // --- SUCCESS STATE: Exclusively render the authentic B&W Receipt Bill without duplicate app cards ---
  if (order.status === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 flex justify-center items-start print:p-0 print:bg-white">
        <PrintableReceipt
          order={order}
          merchantName={order.customerName || 'MoneyPay Partner'}
          onDone={() => router.push(isAdminUser ? '/admin/transactions' : '/deposit')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] px-3 sm:px-6 flex justify-center items-start">
      <div className="w-full max-w-lg space-y-4">
        {/* Super Admin Quick Control Panel */}
        {isAdminUser && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black tracking-wide text-emerald-400 uppercase">
                  👑 Super Admin Live Approval Panel
                </span>
              </div>
              <Link
                href="/admin/transactions"
                className="text-[11px] text-slate-300 hover:text-white font-bold flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
              >
                <span>Full Admin Queue</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <p className="text-[11px] text-slate-300">
              Logged in as <span className="font-mono text-emerald-300 font-bold">{currentUser?.email}</span>. You don&apos;t have to pay. Approve this deposit instantly:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleAdminAction('APPROVE')}
                disabled={isApproving}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isApproving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>⚡ 1-Click Approve {order.amount > 0 ? `(Credit ₹${order.amount})` : '(Credit Deposit)'}</span>
              </button>

              <button
                onClick={() => handleAdminAction('REJECT')}
                disabled={isApproving}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-900/60 hover:border-rose-700 text-slate-300 hover:text-rose-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Reject Deposit</span>
              </button>
            </div>
          </div>
        )}

        {/* Header with Amount & Expiry Timer */}
        <CheckoutHeader
          amount={order.amount}
          merchantName={order.customerName || 'Verified Merchant'}
          orderId={order.id}
          expiresAt={order.expiresAt}
          onExpire={() => {
            setOrder((prev) => (prev ? { ...prev, status: 'EXPIRED' } : null));
          }}
        />

        {/* If Order is in EXPIRED, VERIFYING, or BANK_MISMATCH state */}
        {order.status !== 'PENDING' && (
          <PaymentStatusModal order={order} onRefresh={fetchOrder} />
        )}

        {/* If order is still PENDING or VERIFYING, allow payment methods & UTR input */}
        {(order.status === 'PENDING' || order.status === 'VERIFYING') && (
          <>
            {/* Payment Method Selector Tabs */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 grid grid-cols-3 gap-1 shadow-sm">
              <button
                onClick={() => setActiveTab('qr')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'qr'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI QR</span>
              </button>

              <button
                onClick={() => setActiveTab('upi_intent')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'upi_intent'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI Apps</span>
              </button>

              <button
                onClick={() => setActiveTab('bank')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'bank'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Bank Transfer</span>
              </button>
            </div>

            {/* Active Payment View */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              {activeTab === 'qr' && (
                <QrCodeSection
                  upiId={order.assignedUpiString || '9974366033@kotak'}
                  payeeName={order.assignedHolder || 'AGS'}
                  amount={order.amount}
                  orderId={order.id}
                />
              )}

              {activeTab === 'upi_intent' && (
                <UpiIntentSection
                  upiId={order.assignedUpiString || '9974366033@kotak'}
                  payeeName={order.assignedHolder || 'AGS'}
                  amount={order.amount}
                  orderId={order.id}
                />
              )}

              {activeTab === 'bank' && (
                <BankTransferSection
                  bankName={order.assignedBankName || 'Kotak Mahindra Bank'}
                  accountNumber={order.assignedAccountNo || '9974366033'}
                  ifscCode={order.assignedIfsc || 'KKBK0002626'}
                  accountHolder={order.assignedHolder || 'AGS'}
                  amount={order.amount}
                />
              )}
            </div>

            {/* Step 2: UTR Form */}
            <UtrSubmissionForm
              initialUtr={order.userSubmittedUtr || ''}
              initialScreenshot={order.screenshotUrl || ''}
              orderAmount={order.amount}
              isSubmitting={isSubmittingUtr}
              onSubmit={handleUtrSubmit}
              status={order.status}
            />
          </>
        )}

        {/* Footer Security Badge */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 py-3">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured by MoneyPay Direct Payment Protocol</span>
        </div>
      </div>
    </div>
  );
}
