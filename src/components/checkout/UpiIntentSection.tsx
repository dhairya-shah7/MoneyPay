import React from 'react';
import { Smartphone, ArrowUpRight, Zap } from 'lucide-react';
import { generateUpiUri, UPI_APPS } from '@/lib/upi';

interface UpiIntentProps {
  upiId: string;
  payeeName: string;
  amount: number;
  orderId: string;
}

export function UpiIntentSection({ upiId, payeeName, amount, orderId }: UpiIntentProps) {
  const baseUpiUri = generateUpiUri({
    pa: upiId,
    pn: payeeName,
    am: amount,
    tn: `Deposit ${orderId}`,
    tr: orderId,
  });

  const handleAppClick = (app: typeof UPI_APPS[0]) => {
    const appUri = app.scheme(baseUpiUri);
    window.location.href = appUri;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Pay Instantly via UPI App (Mobile)</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">1-Click Fast Checkout</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {UPI_APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => handleAppClick(app)}
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all group text-left shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-xs text-indigo-700 group-hover:scale-105 transition-transform">
                {app.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{app.name}</div>
                <div className="text-[10px] text-slate-400 font-medium">Open App</div>
              </div>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </button>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
        <Smartphone className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
        <span>
          Clicking any app will automatically launch your installed UPI payment application with exact amount <span className="font-bold font-mono text-amber-950">₹{amount}</span> pre-filled.
        </span>
      </div>
    </div>
  );
}
