'use client';

import React, { useState, useEffect } from 'react';
import { PlayCircle, ArrowRight, Copy, Check, ExternalLink, Sparkles, Smartphone, Building2, QrCode, Store, Printer, Download } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { RetailerQrStandee } from '@/components/admin/RetailerQrStandee';
import { UpiAccount } from '@/lib/types';

export default function SimulatorPage() {
  const [mode, setMode] = useState<'static_retailer' | 'dynamic'>('static_retailer');

  // Dynamic Session State
  const [amount, setAmount] = useState<string>('500');
  const [merchantOrderId, setMerchantOrderId] = useState<string>(`ORD_${Date.now().toString().slice(-6)}`);
  const [userId, setUserId] = useState<string>('PLAYER_9921');
  const [customerName, setCustomerName] = useState<string>('Rahul Kumar');
  const [customerPhone, setCustomerPhone] = useState<string>('+91 9876543210');
  const [preferredType, setPreferredType] = useState<'UPI' | 'BANK'>('UPI');
  const [loading, setLoading] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Static Retailer QR State
  const [poolUpis, setPoolUpis] = useState<UpiAccount[]>([]);
  const [selectedUpiId, setSelectedUpiId] = useState<string>('moneypay@kotak');
  const [selectedPayeeName, setSelectedPayeeName] = useState<string>('MoneyPay Retailer Counter');
  const [storeTitle, setStoreTitle] = useState<string>('Retail Store / Cashier Counter');
  const [customNote, setCustomNote] = useState<string>('Counter Deposit');

  useEffect(() => {
    fetch('/api/v1/admin/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.upiAccounts && data.upiAccounts.length > 0) {
          setPoolUpis(data.upiAccounts);
          const active = data.upiAccounts.find((u: UpiAccount) => u.isActive) || data.upiAccounts[0];
          setSelectedUpiId(active.upiId);
          setSelectedPayeeName(active.payeeName);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectPoolUpi = (upi: UpiAccount) => {
    setSelectedUpiId(upi.upiId);
    setSelectedPayeeName(upi.payeeName);
  };

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreatedOrder(null);

    try {
      const res = await fetch('/api/v1/payin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'mp_live_k928f01a89c20a1e3bf89',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          merchant_order_id: merchantOrderId,
          user_id: userId,
          customer_name: customerName,
          customer_phone: customerPhone,
          preferred_type: preferredType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedOrder(data);
        setMerchantOrderId(`ORD_${Date.now().toString().slice(-6)}`);
      } else {
        alert(data.error || 'Failed to create deposit order');
      }
    } catch (err: any) {
      alert('Error creating deposit: ' + err?.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCheckoutUrl = () => {
    if (!createdOrder?.checkout_url) return;
    navigator.clipboard.writeText(createdOrder.checkout_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>UPI QR & Payment Link Studio</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">QR & Payment Link Generator</h1>
          <p className="text-xs text-slate-500 font-medium">
            Generate open-amount static counter QRs for retailers or dynamic 1-time session links.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMode('static_retailer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === 'static_retailer'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>🏪 Static Retailer QR (Open Amount)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('dynamic')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              mode === 'dynamic'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>⚡ Dynamic Session Link</span>
          </button>
        </div>
      </div>

      {/* MODE 1: STATIC RETAILER QR (OPEN AMOUNT) */}
      {mode === 'static_retailer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Form */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Configure Static Counter QR</span>
              </h3>
              <p className="text-xs text-slate-500">
                This QR has <strong className="text-slate-800">no pre-set amount</strong>. The retailer or customer scans the QR and types the desired amount directly in Google Pay, PhonePe, Paytm, or BHIM.
              </p>
            </div>

            {/* Quick Pick From Active Pool */}
            {poolUpis.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Select Active Pool UPI Account
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {poolUpis.map((upi) => (
                    <button
                      key={upi.id}
                      type="button"
                      onClick={() => handleSelectPoolUpi(upi)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedUpiId === upi.upiId
                          ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">{upi.payeeName}</span>
                        {selectedUpiId === upi.upiId && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 truncate block mt-0.5">
                        {upi.upiId}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Input Fields */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">UPI VPA (Payee Address)</label>
                <input
                  type="text"
                  required
                  value={selectedUpiId}
                  onChange={(e) => setSelectedUpiId(e.target.value)}
                  placeholder="e.g. merchant@kotak"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-indigo-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payee / Merchant Business Name</label>
                <input
                  type="text"
                  required
                  value={selectedPayeeName}
                  onChange={(e) => setSelectedPayeeName(e.target.value)}
                  placeholder="e.g. MoneyPay Retail Services"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Counter / Standee Header Title</label>
                <input
                  type="text"
                  value={storeTitle}
                  onChange={(e) => setStoreTitle(e.target.value)}
                  placeholder="e.g. Supermarket Counter 1"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 space-y-1">
              <span className="font-bold block">💡 How It Works For Retailers:</span>
              <p className="text-[11px] leading-relaxed text-indigo-800">
                1. Print this standee or save the image on a phone/tablet screen.<br />
                2. Customer scans QR in PhonePe / GPay / Paytm / BHIM.<br />
                3. The UPI app will prompt for the exact payment amount.<br />
                4. The customer or retailer enters the amount, pays, and the bank SMS webhook reconciles the transaction instantly.
              </p>
            </div>
          </div>

          {/* Standee Live Preview & Print Studio */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-200">
              <RetailerQrStandee
                upiId={selectedUpiId}
                payeeName={selectedPayeeName}
                storeName={storeTitle}
                note={customNote}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: DYNAMIC PAYMENT LINK SESSION */}
      {mode === 'dynamic' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creator Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-emerald-600" />
              <span>Generate Direct PayIn Session (Fixed Amount)</span>
            </h3>

            <form onSubmit={handleCreateDeposit} className="space-y-4">
              {/* Deposit Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Deposit Amount (₹ INR)</label>
                <div className="relative rounded-xl shadow-xs">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter custom deposit amount"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Merchant Order ID</label>
                <input
                  type="text"
                  required
                  value={merchantOrderId}
                  onChange={(e) => setMerchantOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">User / Player ID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Routing Channel */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Preferred Rail</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredType('UPI')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      preferredType === 'UPI'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>UPI / QR Pool</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredType('BANK')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      preferredType === 'BANK'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Bank IMPS Transfer</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>{loading ? 'Generating...' : 'Generate Checkout Session'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Output & Test Runner Card */}
          <div className="space-y-4">
            {createdOrder ? (
              <div className="bg-white border border-emerald-300 rounded-2xl p-6 shadow-md space-y-4 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Session Ready
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">{createdOrder.order_id}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="font-mono text-slate-900 font-bold">{createdOrder.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Merchant Order ID:</span>
                    <span className="font-mono text-slate-900">{createdOrder.merchant_order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payable Amount:</span>
                    <span className="font-mono text-emerald-600 font-black text-sm">{formatINR(createdOrder.amount)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <a
                    href={createdOrder.checkout_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <span>Open Checkout Interface</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={copyCheckoutUrl}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Checkout Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[320px]">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-700">No active simulation</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Fill in the details on the left and click Generate to launch a live deposit checkout session.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
