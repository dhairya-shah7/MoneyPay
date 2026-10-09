import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Send, Copy, Check, Eye } from 'lucide-react';
import { PayinOrder } from '@/lib/types';
import { formatINR, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/Badge';

interface ReviewModalProps {
  order: PayinOrder;
  onClose: () => void;
  onActionSuccess: () => void;
}

export function UtrReviewModal({ order, onClose, onActionSuccess }: ReviewModalProps) {
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [receivedAmount, setReceivedAmount] = useState<string>(order.amount.toString());
  const [reason, setReason] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyValue = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'MARK_MISMATCH' | 'RETRIGGER_WEBHOOK') => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/v1/admin/transactions/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          action,
          reason,
          receivedAmount: action === 'APPROVE' || action === 'MARK_MISMATCH' ? receivedAmount : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onActionSuccess();
        onClose();
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (err: any) {
      alert('Error executing action: ' + err?.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-black text-slate-900">Review Deposit Transaction</h3>
            <StatusBadge status={order.status} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Top Key Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 block">Requested Amount</span>
              <span className="text-lg font-black text-emerald-600 font-mono">
                {formatINR(order.amount)}
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500 block">User Submitted UTR</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {order.userSubmittedUtr || 'None'}
                </span>
                {order.userSubmittedUtr && (
                  <button
                    onClick={() => copyValue('utr', order.userSubmittedUtr!)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {copiedField === 'utr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-slate-500 block">Customer / User ID</span>
              <span className="text-sm font-bold text-slate-800 block truncate">
                {order.userId || order.customerName || 'Direct Depositor'}
              </span>
            </div>
          </div>

          {/* Screenshot Preview */}
          {order.screenshotUrl ? (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Uploaded Payment Proof</span>
              </span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 max-h-72 overflow-hidden flex items-center justify-center">
                <img
                  src={order.screenshotUrl}
                  alt="Payment Receipt"
                  className="max-h-64 object-contain rounded-lg shadow-sm border border-slate-200"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              No screenshot uploaded by user. Verify by checking bank statement for UTR <span className="font-mono text-slate-800 font-bold">{order.userSubmittedUtr || 'N/A'}</span>.
            </div>
          )}

          {/* Details Table */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 text-xs">
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Order Ref:</span>
              <span className="font-mono font-semibold text-slate-800">{order.id}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Merchant Order ID:</span>
              <span className="font-mono font-semibold text-slate-800">{order.merchantOrderId}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Assigned Account:</span>
              <span className="font-mono font-semibold text-slate-800">
                {order.assignedUpiString || `${order.assignedBankName} (${order.assignedAccountNo})`}
              </span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="text-slate-500">Created At:</span>
              <span className="text-slate-700">{formatDateTime(order.createdAt)}</span>
            </div>
            {order.disputeReason && (
              <div className="p-3 bg-red-50 text-red-700 flex justify-between font-medium">
                <span>Dispute / Flag:</span>
                <span>{order.disputeReason}</span>
              </div>
            )}
          </div>

          {/* Action Adjustment Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Actual Amount Received (₹)</label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Admin Remarks</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional verification note"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('RETRIGGER_WEBHOOK')}
              disabled={loadingAction}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              <span>Resend Webhook</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('REJECT')}
              disabled={loadingAction}
              className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => handleAction('MARK_MISMATCH')}
              disabled={loadingAction}
              className="px-3.5 py-2 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Mismatch</span>
            </button>
            <button
              onClick={() => handleAction('APPROVE')}
              disabled={loadingAction}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve & Credit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
