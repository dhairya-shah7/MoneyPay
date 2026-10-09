'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Building2,
  Scan,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { extractGoogleBusinessFromImage } from '@/lib/googleBusinessExtractor';

interface GoogleBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bankAccounts: Array<{ id: string; bankName: string; accountNumber: string; accountHolder: string }>;
}

export function GoogleBusinessModal({
  isOpen,
  onClose,
  onSuccess,
  bankAccounts,
}: GoogleBusinessModalProps) {
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [screenshot, setScreenshot] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Form Fields
  const [upiId, setUpiId] = useState<string>('gracyconstruction@sbi');
  const [payeeName, setPayeeName] = useState<string>('Gracy Construction');
  const [storeName, setStoreName] = useState<string>('Gracy Construction Store 1');
  const [terminalCode, setTerminalCode] = useState<string>('TERM_01');
  const [dailyLimit, setDailyLimit] = useState<string>('500000');
  const [selectedBankId, setSelectedBankId] = useState<string>(bankAccounts[0]?.id || 'bank_kotak_1');

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('File size must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsScanning(true);
    setError('');
    setScanMessage('Scanning Google Pay Business QR & metadata...');

    try {
      const extracted = await extractGoogleBusinessFromImage(file);
      if (extracted.upiId) {
        setUpiId(extracted.upiId);
      }
      if (extracted.payeeName) {
        setPayeeName(extracted.payeeName);
      }
      if (extracted.storeName) {
        setStoreName(extracted.storeName);
      }
      if (extracted.terminalCode) {
        setTerminalCode(extracted.terminalCode);
      }
      setScanMessage(`✨ Successfully extracted ${extracted.upiId} (${extracted.payeeName})`);
    } catch (err) {
      setScanMessage('Manual verification required');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId) {
      setError('Please provide a valid Google Business UPI ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/admin/google-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'MANUAL',
          upiId: upiId.trim(),
          payeeName: payeeName.trim(),
          storeName: storeName.trim(),
          terminalCode: terminalCode.trim(),
          dailyLimit: parseFloat(dailyLimit) || 500000,
          bankAccountId: selectedBankId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error || 'Failed saving Google Business account');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving Google Business account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              G
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Add Google Business Account
              </h3>
              <p className="text-xs text-slate-500">
                Link GPay Business UPI VPA to Kotak Settlement Bank
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selector: Auto-Extract vs Manual */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('AUTO')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'AUTO'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Auto-Extract QR</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('MANUAL')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mode === 'MANUAL'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Auto Mode: Screenshot Upload */}
        {mode === 'AUTO' && (
          <div className="space-y-2">
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/70 hover:bg-blue-50/30 transition-all">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                {isScanning ? (
                  <Scan className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-800 block">
                  Upload Google Pay Business QR Screenshot
                </span>
                <span className="text-[11px] text-slate-500">
                  Auto-detects VPA (`@okaxis`, `@sbi`, `@okicici`), Business Name & Terminal
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {scanMessage && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{scanMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Linked Settlement Bank */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Settlement Bank Account (Central Pool)
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Kotak Mahindra Bank — A/C 9974366033 (AGS)</span>
            </div>
          </div>

          {/* Google Business UPI ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Google Business UPI ID (VPA) *
            </label>
            <input
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. gracyconstruction@sbi or store@okaxis"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payee / Business Name */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Payee Name *
              </label>
              <input
                type="text"
                required
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="e.g. Gracy Construction"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Store / Outlet Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Gracy Store 1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Daily Limit & Terminal Code */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daily Limit (₹ INR)
              </label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="500000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Terminal Code
              </label>
              <input
                type="text"
                value={terminalCode}
                onChange={(e) => setTerminalCode(e.target.value)}
                placeholder="TERM_01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || isScanning}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Linking Google Business Account...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save & Link to Kotak Settlement Bank</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
