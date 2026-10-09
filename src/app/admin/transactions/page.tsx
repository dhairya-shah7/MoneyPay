'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { UtrReviewModal } from '@/components/admin/UtrReviewModal';
import { PayinOrder } from '@/lib/types';
import { formatINR, formatDateTime } from '@/lib/utils';

const STATUS_FILTERS = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Verifying UTR', value: 'VERIFYING' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Success', value: 'SUCCESS' },
  { label: 'Amount Mismatch', value: 'BANK_MISMATCH' },
  { label: 'Duplicate UTR', value: 'DUPLICATE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Failed', value: 'FAILED' },
];

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [orders, setOrders] = useState<PayinOrder[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<PayinOrder | null>(null);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (searchQuery) params.append('query', searchQuery);

      const res = await fetch(`/api/v1/admin/transactions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 4000);
    return () => clearInterval(interval);
  }, [selectedStatus, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Transactions & UTR Queue</h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time reconciliation, manual UTR verification, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.value === 'ALL'
              ? orders.length
              : orders.filter((o) => o.status === f.value).length;
          const isActive = selectedStatus === f.value;

          return (
            <button
              key={f.value}
              onClick={() => setSelectedStatus(f.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, UTR, User ID, Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{orders.length}</span> transactions
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Order Details</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Submitted UTR</th>
                <th className="py-3.5 px-4">Assigned Account</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created / Expiry</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{order.id}</div>
                      <div className="text-[10px] text-slate-400">
                        Merchant: <span className="text-slate-600 font-medium">{order.merchantOrderId}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        {order.customerName || order.userId || 'Direct User'}
                      </div>
                      <div className="text-[10px] text-slate-500">{order.customerEmail || order.customerPhone || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-black text-emerald-600 text-sm">
                        {formatINR(order.amount)}
                      </div>
                      {order.receivedAmount && order.receivedAmount !== order.amount && (
                        <div className="text-[10px] text-amber-600 font-semibold">
                          Recv: {formatINR(order.receivedAmount)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {order.userSubmittedUtr ? (
                        <span className="bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-900 font-bold">
                          {order.userSubmittedUtr}
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending submission</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-600">
                      {order.assignedUpiString ? (
                        <span className="font-mono text-indigo-700 font-semibold">{order.assignedUpiString}</span>
                      ) : order.assignedAccountNo ? (
                        <span>{order.assignedBankName} • {order.assignedAccountNo.slice(-4)}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      <div>{formatDateTime(order.createdAt)}</div>
                      <div className="text-[10px] text-slate-400">
                        {order.paidAt ? `Paid ${formatDateTime(order.paidAt)}` : `Exp: ${formatDateTime(order.expiresAt)}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/pay/${order.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200"
                          title="Open Checkout View"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors flex items-center gap-1 border border-indigo-200/60 shadow-sm"
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
          onActionSuccess={fetchTransactions}
        />
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-slate-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="text-xs font-semibold">Loading transaction queue...</span>
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}
