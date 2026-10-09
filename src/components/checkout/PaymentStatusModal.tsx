import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, AlertTriangle, XCircle, Clock, ArrowRight, Download, RefreshCw, Printer } from 'lucide-react';
import { formatINR, formatDateTime } from '@/lib/utils';
import { PayinOrder } from '@/lib/types';
import { PrintableReceipt } from './PrintableReceipt';

interface StatusModalProps {
  order: PayinOrder;
  merchantName?: string;
  onRefresh?: () => void;
}

export function PaymentStatusModal({ order, merchantName, onRefresh }: StatusModalProps) {
  const [showBillReceipt, setShowBillReceipt] = useState<boolean>(false);

  useEffect(() => {
    if (order.status === 'SUCCESS') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
      });

      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch (e) {}
    }
  }, [order.status]);

  if (order.status === 'PENDING') return null;

  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 animate-slide-up text-center">
        {order.status === 'SUCCESS' && (
          <>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">
                Payment Successful!
              </h2>
              <p className="text-xs text-slate-500">
                Your deposit of <span className="font-bold text-slate-900">{formatINR(order.amount)}</span> has been confirmed and credited.
              </p>
            </div>

            {/* Receipt Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Ref:</span>
                <span className="font-bold text-slate-900">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant Order ID:</span>
                <span className="font-bold text-slate-900">{order.merchantOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UTR / Ref No:</span>
                <span className="font-bold text-emerald-700">{order.userSubmittedUtr || order.bankUtr || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid At:</span>
                <span className="text-slate-900">{formatDateTime(order.paidAt || order.updatedAt)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => setShowBillReceipt(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>View / Print Bill Receipt</span>
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
              >
                <span>Return to Platform</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {order.status === 'VERIFYING' && (
          <div className="py-4 space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></span>
              <div className="relative w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Verifying Transaction UTR...
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                We received your submitted UTR <span className="font-mono font-bold text-slate-900">({order.userSubmittedUtr})</span>. The bank reconciliation engine is verifying. This usually takes under 10 seconds.
              </p>
            </div>

            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Latest Status</span>
            </button>
          </div>
        )}

        {order.status === 'BANK_MISMATCH' && (
          <div className="py-2 space-y-3 text-left">
            <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <strong className="block font-bold">Amount Mismatch Detected</strong>
                The transferred amount does not match the order value ₹{order.amount}. Admin verification has been notified.
              </div>
            </div>
          </div>
        )}

        {order.status === 'EXPIRED' && (
          <div className="py-4 space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Order Expired</h3>
              <p className="text-xs text-slate-500">The payment session has timed out. Please initiate a new deposit from your app.</p>
            </div>
          </div>
        )}
      </div>

      {/* Official Clean B&W Bill Voucher */}
      {showBillReceipt && (
        <PrintableReceipt
          order={order}
          merchantName={merchantName}
          onClose={() => setShowBillReceipt(false)}
        />
      )}
    </>
  );
}
