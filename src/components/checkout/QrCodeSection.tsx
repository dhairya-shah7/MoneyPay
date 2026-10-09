import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode, Sparkles } from 'lucide-react';
import { generateUpiUri } from '@/lib/upi';

interface QrSectionProps {
  upiId: string;
  payeeName: string;
  amount: number;
  orderId: string;
}

export function QrCodeSection({ upiId, payeeName, amount, orderId }: QrSectionProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Open-Amount Dynamic QR: UPI apps will ask user to enter any amount directly
  const upiUri = `upi://pay?pa=${upiId.trim()}&pn=${encodeURIComponent(payeeName.trim())}&cu=INR`;

  useEffect(() => {
    QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [upiUri]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-5">
      {/* Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>🔒 Permanent Static Retailer QR (Never Expires)</span>
        </div>
        <h3 className="text-sm font-bold text-slate-900">
          Scan with Any UPI App & Enter Desired Amount
        </h3>
        <p className="text-xs text-slate-500">
          PhonePe • Google Pay • Paytm • BHIM • CRED • Amazon Pay • Navi
        </p>
      </div>

      {/* QR Display Card */}
      <div className="relative p-3 bg-white rounded-2xl shadow-sm border-2 border-slate-200 group">
        <div className="w-64 h-64 flex items-center justify-center relative">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="UPI Payment QR Code"
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <QrCode className="w-10 h-10 animate-spin text-indigo-600" />
              <span className="text-xs">Generating secure QR...</span>
            </div>
          )}

          {/* Center Brand Badge */}
          <div className="absolute inset-0 m-auto w-10 h-10 bg-slate-900 rounded-full border-2 border-white shadow flex items-center justify-center font-black text-xs text-emerald-400 pointer-events-none">
            ₹
          </div>
        </div>
      </div>

      {/* Payee Details & Copy UPI */}
      <div className="w-full max-w-sm space-y-2 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="space-y-0.5 truncate mr-2">
            <span className="text-[10px] text-slate-400 block font-medium">UPI VPA (Payee ID)</span>
            <span className="font-mono font-bold text-slate-900 truncate block">
              {upiId}
            </span>
          </div>
          <button
            onClick={() => copyToClipboard(upiId)}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors border border-indigo-200/60"
          >
            {copiedUpi ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-600" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          Payee Name: <span className="font-semibold text-slate-800">{payeeName}</span>
        </div>
      </div>
    </div>
  );
}
