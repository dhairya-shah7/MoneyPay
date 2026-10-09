import React, { useEffect, useState } from 'react';
import { ShieldCheck, Timer } from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface HeaderProps {
  amount: number;
  merchantName?: string;
  orderId: string;
  expiresAt: string | Date;
  onExpire?: () => void;
}

export function CheckoutHeader({ amount, merchantName, orderId, expiresAt, onExpire }: HeaderProps) {
  const [timeLeft, setTimeLeft] = useState<string>('10:00');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateTime = () => {
      const expiry = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return (
    <div className="bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 mb-5 relative overflow-hidden">
      {/* Top emerald highlight stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-500" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand & Merchant Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-md shadow-emerald-500/10">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-black text-xl text-emerald-600">
              ₹
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-slate-900">
                MoneyPay
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Merchant: <span className="text-slate-800 font-semibold">{merchantName || 'MoneyPay Partner'}</span>
            </p>
          </div>
        </div>

        {/* Amount & Timer */}
        <div className="flex items-end sm:items-end justify-between sm:justify-start sm:flex-col gap-1 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 block">Total Payable</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {amount > 0 ? formatINR(amount) : 'Open Amount'}
            </span>
            {amount <= 0 && (
              <span className="text-[10px] text-slate-400 block font-medium">Enter in UPI app</span>
            )}
          </div>

          {amount > 0 ? (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 text-xs">
              <Timer className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-amber-500 animate-pulse'}`} />
              <span className="text-slate-500">Expires in:</span>
              <span className={`font-mono font-bold ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                {timeLeft}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-emerald-800 text-[11px]">Static QR • Never Expires</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Assurance Banner */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Direct Bank & UPI Settlement</span>
        </div>
        <div className="text-slate-400">
          Ref: <span className="font-mono text-slate-600 font-semibold">{orderId}</span>
        </div>
      </div>
    </div>
  );
}
