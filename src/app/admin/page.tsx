'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowDownLeft,
  Clock,
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { UtrReviewModal } from '@/components/admin/UtrReviewModal';
import { PayinOrder } from '@/lib/types';
import { formatINR, formatDateTime } from '@/lib/utils';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<PayinOrder[]>([]);
  const [pendingQueue, setPendingQueue] = useState<PayinOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<PayinOrder | null>(null);

  // Bank SMS Simulator State
  const [simulatedSms, setSimulatedSms] = useState<string>('');
  const [isProcessingSms, setIsProcessingSms] = useState<boolean>(false);
  const [smsResult, setSmsResult] = useState<any>(null);

  const loadData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch('/api/v1/admin/stats'),
        fetch('/api/v1/admin/transactions'),
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (ordersData.success) {
        const all: PayinOrder[] = ordersData.orders || [];
        setRecentOrders(all.slice(0, 8));
        setPendingQueue(
          all.filter((o) => o.status === 'VERIFYING' || (o.status === 'PENDING' && o.userSubmittedUtr))
        );
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed loading admin data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleProcessBankSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedSms) return;
    setIsProcessingSms(true);
    setSmsResult(null);

    try {
      const res = await fetch('/api/v1/bank-feed/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_sms: simulatedSms }),
      });

      const data = await res.json();
      setSmsResult(data);
      loadData();
    } catch (err: any) {
      setSmsResult({ success: false, error: err?.message });
    } finally {
      setIsProcessingSms(false);
    }
  };

  const setSampleSms = (template: 'hdfc' | 'sbi' | 'icici' | 'kotak') => {
    const latestPending = pendingQueue[0] || recentOrders[0];
    const utr = latestPending?.userSubmittedUtr || '428910293841';
    const amount = latestPending?.amount || 500;

    const templates = {
      hdfc: `Dear Customer, A/c *29103 credited by INR ${amount}.00 on 07-Oct-26 by UPI ref ${utr}. Bal: Rs 4,82,910.00 - HDFC Bank`,
      sbi: `Dear SBI UPI User, Your A/c XX8919 is credited by Rs ${amount}.00 on 07/10/26 transfer from UPI/REF/${utr}.`,
      icici: `ICICI Bank: Acct XX92019 credited with Rs ${amount}.00 on 07-OCT-26 by UPI/${utr}/MoneyPay.`,
      kotak: `Kotak Bank: INR ${amount}.00 credited to A/c 50291 via UPI ref ${utr} on 07-10-26.`,
    };

    setSimulatedSms(templates[template]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Gateway Overview</h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time monitoring of deposits, automated account rotation, and instant UTR reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/simulator"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/10"
          >
            <span>+ Create Deposit Link</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Processed Volume"
          value={formatINR(stats?.totalVolume || 0)}
          subtitle="Direct deposit volume"
          icon={TrendingUp}
          trend="+18.4% today"
          color="emerald"
        />
        <StatCard
          title="Pending UTR Queue"
          value={stats?.pendingUtrs ?? 0}
          subtitle="Awaiting reconciliation"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Success Conversion Rate"
          value={`${stats?.successRate || '100'}%`}
          subtitle={`${stats?.successfulCount || 0} / ${stats?.totalOrders || 0} deposits`}
          icon={ArrowDownLeft}
          color="indigo"
        />
        <StatCard
          title="Active Pool Accounts"
          value={`${stats?.activeUpisCount || 0} UPI / ${stats?.activeBanksCount || 0} Bank`}
          subtitle="Load balancing rotation"
          icon={Building2}
          color="blue"
        />
      </div>

      {/* Pending UTR Queue Alert Banner */}
      {pendingQueue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {pendingQueue.length} Deposit{pendingQueue.length > 1 ? 's' : ''} Awaiting Reconciliation
              </h3>
              <p className="text-xs text-amber-800">
                Customers submitted UTRs. Review and approve or use the automated Bank SMS feed below to auto-credit.
              </p>
            </div>
          </div>

          <Link
            href="/admin/transactions?status=VERIFYING"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shadow-sm"
          >
            <span>Open Verification Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Automated Bank SMS Reconciliation Widget */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bank SMS Auto-Reconciliation Feed (Live Simulator)</h3>
              <p className="text-[11px] text-slate-500">
                Simulates real-time bank SMS feeds from Android forwarders or Bank webhooks. Instantly matches & approves pending checkouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Quick Presets:</span>
            {(['hdfc', 'sbi', 'icici', 'kotak'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setSampleSms(b)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase text-[10px] border border-slate-200 transition-colors"
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleProcessBankSms} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Paste raw bank credit SMS e.g. 'A/c 103 credited with INR 500.00 via UPI ref 428910293841...'"
              value={simulatedSms}
              onChange={(e) => setSimulatedSms(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isProcessingSms || !simulatedSms}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isProcessingSms ? 'Reconciling...' : 'Process Bank Feed'}</span>
            </button>
          </div>

          {smsResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fade-in ${
              smsResult.success && smsResult.matched
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : smsResult.success
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              {smsResult.success && smsResult.matched ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold block">
                  {smsResult.success && smsResult.matched ? '⚡ Instant Auto-Match Success!' : 'Bank Feed Processed'}
                </span>
                <p className="text-[11px] opacity-90">{smsResult.message || smsResult.error}</p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Recent Transactions Feed */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Live Transactions Feed</h3>
            <p className="text-xs text-slate-500">Real-time deposit stream across all merchant channels</p>
          </div>
          <Link
            href="/admin/transactions"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
          >
            <span>View all transactions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Submitted UTR</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions recorded yet. Use the Simulator to create test deposits.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {order.id}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {order.merchantOrderId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">
                        {order.customerName || order.userId || 'Direct User'}
                      </span>
                      <span className="text-[10px] text-slate-500">{order.customerPhone || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-black text-emerald-600 text-sm">
                      {formatINR(order.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {order.userSubmittedUtr ? (
                        <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-800 font-bold">
                          {order.userSubmittedUtr}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/pay/${order.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200"
                          title="Open Checkout"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-all flex items-center gap-1 border border-indigo-200/60"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedOrder && (
        <UtrReviewModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onActionSuccess={loadData}
        />
      )}
    </div>
  );
}
