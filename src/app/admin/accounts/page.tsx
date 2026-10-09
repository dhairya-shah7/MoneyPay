'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  QrCode,
  Plus,
  Trash2,
  Power,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  Store,
  Printer,
} from 'lucide-react';
import { BankAccount, UpiAccount } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { RetailerQrStandee } from '@/components/admin/RetailerQrStandee';
import { GoogleBusinessModal } from '@/components/admin/GoogleBusinessModal';
import { Sparkles } from 'lucide-react';

export default function AccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [upiAccounts, setUpiAccounts] = useState<UpiAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'upis' | 'banks'>('upis');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showGoogleBizModal, setShowGoogleBizModal] = useState<boolean>(false);
  const [selectedStandeeUpi, setSelectedStandeeUpi] = useState<UpiAccount | null>(null);

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolder: '',
    upiId: '',
    dailyLimit: '500000',
    minAmount: '100',
    maxAmount: '100000',
    priority: '1',
  });

  // UPI Form State
  const [upiForm, setUpiForm] = useState({
    upiId: '',
    payeeName: '',
    dailyLimit: '200000',
    minAmount: '100',
    maxAmount: '50000',
    priority: '1',
  });

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/v1/admin/accounts');
      const data = await res.json();
      if (data.success) {
        setBankAccounts(data.bankAccounts);
        setUpiAccounts(data.upiAccounts);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed loading accounts:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const toggleAccountActive = async (type: 'BANK' | 'UPI', id: string, current: boolean) => {
    try {
      const res = await fetch('/api/v1/admin/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          id,
          updates: { isActive: !current },
        }),
      });
      if (res.ok) loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAccount = async (type: 'BANK' | 'UPI', id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      const res = await fetch(`/api/v1/admin/accounts?type=${type}&id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) loadAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload =
        activeTab === 'banks'
          ? { type: 'BANK', ...bankForm }
          : { type: 'UPI', ...upiForm };

      const res = await fetch('/api/v1/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        loadAccounts();
      } else {
        alert(data.error || 'Failed to add account');
      }
    } catch (err: any) {
      alert('Error adding account: ' + err?.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Bank & UPI Rotation Pool</h1>
          <p className="text-xs text-slate-500 font-medium">
            Add and manage receiver accounts. MoneyPay automatically balances turnover and rotates accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadAccounts}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowGoogleBizModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ Add / Extract Google Business</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bank / UPI</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('upis')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'upis'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>UPI IDs / VPAs ({upiAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'banks'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Bank Accounts ({bankAccounts.length})</span>
        </button>
      </div>

      {/* UPI Accounts Tab */}
      {activeTab === 'upis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upiAccounts.map((upi) => {
            const usagePercent = Math.min(100, Math.round(((upi.currentDayVolume || 0) / upi.dailyLimit) * 100));

            return (
              <div
                key={upi.id}
                className={`bg-white border ${
                  upi.isActive ? 'border-slate-200 shadow-sm' : 'border-red-200 opacity-60'
                } rounded-2xl p-5 space-y-4 transition-all`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 font-black text-xs">
                      {upi.isGoogleBusiness ? 'G' : '₹'}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 font-mono truncate">
                          {upi.upiId}
                        </span>
                        {upi.isGoogleBusiness && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">
                            GPay Biz
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {upi.payeeName} {upi.storeName ? `• ${upi.storeName}` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleAccountActive('UPI', upi.id, upi.isActive)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      upi.isActive
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
                    }`}
                    title={upi.isActive ? 'Active - Click to Pause' : 'Paused - Click to Activate'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                {/* Parent Settlement Bank Indicator */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium">
                  <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Settles to: <strong className="text-slate-900 font-bold">Kotak Mahindra Bank (9974366033 - AGS)</strong>
                  </span>
                </div>

                {/* Turnover Progress */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Daily Turnover Usage</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {formatINR(upi.currentDayVolume || 0)} / {formatINR(upi.dailyLimit)} ({usagePercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        usagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                {/* Min / Max & Priority */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div>
                    <span>Txn Limits:</span>
                    <strong className="block text-slate-900 font-mono">
                      ₹{upi.minAmount} - ₹{upi.maxAmount}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span>Priority Tier:</span>
                    <strong className="block text-slate-900">Tier {upi.priority}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setSelectedStandeeUpi(upi)}
                    className="text-[11px] bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors flex items-center gap-1.5"
                  >
                    <Store className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Retailer Standee</span>
                  </button>

                  <button
                    onClick={() => deleteAccount('UPI', upi.id)}
                    className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bank Accounts Tab */}
      {activeTab === 'banks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankAccounts.map((bank) => {
            const usagePercent = Math.min(100, Math.round(((bank.currentDayVolume || 0) / bank.dailyLimit) * 100));

            return (
              <div
                key={bank.id}
                className={`bg-white border ${
                  bank.isActive ? 'border-slate-200 shadow-sm' : 'border-red-200 opacity-60'
                } rounded-2xl p-5 space-y-4 transition-all`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {bank.bankName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        A/C: ••••{bank.accountNumber.slice(-4)} | {bank.ifscCode}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleAccountActive('BANK', bank.id, bank.isActive)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      bank.isActive
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
                    }`}
                    title={bank.isActive ? 'Active' : 'Paused'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-600 truncate">
                  Holder: <strong className="text-slate-900">{bank.accountHolder}</strong>
                </div>

                {/* Turnover Progress */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Daily Cap Usage</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {formatINR(bank.currentDayVolume || 0)} / {formatINR(bank.dailyLimit)} ({usagePercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        usagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                {/* Min / Max & Priority */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div>
                    <span>Txn Limits:</span>
                    <strong className="block text-slate-900 font-mono">
                      ₹{bank.minAmount} - ₹{bank.maxAmount}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span>Priority Tier:</span>
                    <strong className="block text-slate-900">Tier {bank.priority}</strong>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => deleteAccount('BANK', bank.id)}
                    className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Add {activeTab === 'banks' ? 'Bank Account' : 'UPI ID'} to Rotation Pool
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {activeTab === 'upis' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">UPI ID / VPA</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. deposit.collector@icici"
                      value={upiForm.upiId}
                      onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Payee Name (Registered in Bank)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MoneyPay Operations"
                      value={upiForm.payeeName}
                      onChange={(e) => setUpiForm({ ...upiForm, payeeName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Daily Turnover Cap (₹)</label>
                      <input
                        type="number"
                        value={upiForm.dailyLimit}
                        onChange={(e) => setUpiForm({ ...upiForm, dailyLimit: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Priority (1=High)</label>
                      <input
                        type="number"
                        value={upiForm.priority}
                        onChange={(e) => setUpiForm({ ...upiForm, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Bank Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Bank, Axis Bank"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Account Number</label>
                      <input
                        type="text"
                        required
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">IFSC Code</label>
                      <input
                        type="text"
                        required
                        value={bankForm.ifscCode}
                        onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountHolder}
                      onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Daily Turnover Cap (₹)</label>
                      <input
                        type="number"
                        value={bankForm.dailyLimit}
                        onChange={(e) => setBankForm({ ...bankForm, dailyLimit: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Priority Tier</label>
                      <input
                        type="number"
                        value={bankForm.priority}
                        onChange={(e) => setBankForm({ ...bankForm, priority: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-colors"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standee Preview & Print Modal */}
      {selectedStandeeUpi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">Retailer Counter QR Standee</h3>
              </div>
              <button
                onClick={() => setSelectedStandeeUpi(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto bg-slate-50">
              <RetailerQrStandee
                upiId={selectedStandeeUpi.upiId}
                payeeName={selectedStandeeUpi.payeeName}
                storeName="Merchant Cashier Counter"
                note="Counter Deposit"
              />
            </div>
          </div>
        </div>
      )}

      {/* Google Pay for Business Add / Extract Modal */}
      <GoogleBusinessModal
        isOpen={showGoogleBizModal}
        onClose={() => setShowGoogleBizModal(false)}
        onSuccess={loadAccounts}
        bankAccounts={bankAccounts}
      />
    </div>
  );
}
