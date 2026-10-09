'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Copy, Check, QrCode, Sparkles, Building2, Store } from 'lucide-react';
import { generateStaticUpiUri } from '@/lib/upi';

interface StandeeProps {
  upiId: string;
  payeeName: string;
  storeName?: string;
  note?: string;
}

export function RetailerQrStandee({ upiId, payeeName, storeName, note }: StandeeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const standeeRef = useRef<HTMLDivElement>(null);

  const staticUri = generateStaticUpiUri({
    pa: upiId,
    pn: payeeName,
    tn: note || 'Retail Deposit',
  });

  useEffect(() => {
    if (!upiId) return;
    QRCode.toDataURL(staticUri, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate static QR:', err));
  }, [staticUri, upiId]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `moneypay_static_qr_${upiId.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(staticUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Standee Card */}
      <div
        ref={standeeRef}
        className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl max-w-sm mx-auto text-center space-y-5 print:border-none print:shadow-none print:p-0"
      >
        {/* Top Header */}
        <div className="space-y-2 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 p-0.5 shadow-sm">
              <div className="w-full h-full bg-white rounded-[8px] flex items-center justify-center font-black text-xs text-emerald-600">
                ₹
              </div>
            </div>
            <span className="font-black text-lg tracking-tight text-slate-900">MoneyPay</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black tracking-wider text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 uppercase flex items-center gap-1">
              <span>🔒 PERMANENT MASTER QR • NEVER EXPIRES</span>
            </span>
            <span className="text-[11px] font-bold text-slate-700">
              {storeName || 'Official Merchant Counter'}
            </span>
          </div>
        </div>

        {/* QR Code Frame */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block relative shadow-inner">
          <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center relative">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Static UPI QR Code"
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                <QrCode className="w-10 h-10 animate-spin text-indigo-600" />
                <span className="text-xs">Generating Static QR...</span>
              </div>
            )}

            {/* Center UPI Badge */}
            <div className="absolute inset-0 m-auto w-10 h-10 bg-slate-900 rounded-full border-2 border-white shadow flex items-center justify-center font-black text-xs text-emerald-400 pointer-events-none">
              ₹
            </div>
          </div>
        </div>

        {/* Accepted Apps Strip */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Scan & Pay with any UPI App
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-700 flex-wrap">
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">GPay</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">PhonePe</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Paytm</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">BHIM</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200">Cred</span>
          </div>
        </div>

        {/* Payee Info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-[11px]">
            <span>Payee Name:</span>
            <span className="font-bold text-slate-900">{payeeName}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 text-[11px]">
            <span>UPI VPA:</span>
            <span className="font-mono font-bold text-indigo-700">{upiId}</span>
          </div>
        </div>

        {/* Instruction Footer */}
        <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
          * Amount is entered directly by the customer / retailer in their UPI app upon scanning.
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="flex items-center justify-center gap-2 print:hidden max-w-sm mx-auto">
        <button
          onClick={handleDownload}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PNG</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Standee</span>
        </button>

        <button
          onClick={handleCopy}
          title="Copy Static UPI URI"
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
