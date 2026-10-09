import React from 'react';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PayinOrder } from '@/lib/types';
import { formatINR, formatDateTime } from '@/lib/utils';

interface PrintableReceiptProps {
  order: PayinOrder;
  merchantName?: string;
  onDone?: () => void;
  onClose?: () => void;
}

export function PrintableReceipt({ order, merchantName, onDone, onClose }: PrintableReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleAction = onDone || onClose;

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Screen Control Bar (Hidden on Print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between print-hide no-print">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <span className="font-bold text-xs text-slate-900 block">Payment Confirmed</span>
            <span className="text-[11px] text-slate-500">Receipt generated successfully</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>

          {handleAction && (
            <button
              onClick={handleAction}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* --- PURE AUTHENTIC B&W RECEIPT BILL --- */}
      <div
        id="receipt-bill-container"
        className="bg-white text-black border border-neutral-300 rounded-2xl p-6 sm:p-8 shadow-sm font-mono text-xs leading-relaxed space-y-5"
      >
        {/* Receipt Header */}
        <div className="text-center space-y-1 pb-4 border-b-2 border-dashed border-neutral-300">
          <h1 className="font-sans font-black text-xl tracking-tight uppercase text-black">
            PAYMENT RECEIPT
          </h1>
          <p className="text-xs text-neutral-700 font-sans font-medium">
            Merchant: <strong className="text-black">{order.customerName || merchantName || 'MoneyPay Partner'}</strong>
          </p>
          <p className="text-[11px] text-neutral-500 font-mono">
            Voucher No: {order.id}
          </p>
        </div>

        {/* Transaction Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-dashed border-neutral-300">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase">Transaction Date</span>
            <span className="font-bold text-black">{formatDateTime(order.paidAt || order.updatedAt)}</span>
          </div>
          <div className="text-right">
            <span className="text-neutral-500 block text-[10px] uppercase">Payment Status</span>
            <span className="font-bold text-black border border-black px-1.5 py-0.5 rounded text-[11px] inline-block mt-0.5">
              PAID / SUCCESS
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-2 py-2 border-b-2 border-dashed border-neutral-300">
          <div className="flex justify-between font-bold text-[11px] text-neutral-600 uppercase pb-1 border-b border-neutral-200">
            <span>Description</span>
            <span>Amount (INR)</span>
          </div>

          <div className="flex justify-between items-start py-1">
            <div>
              <div className="font-bold text-black">Deposit / Add Funds</div>
              <div className="text-[11px] text-neutral-600">Order Ref: {order.merchantOrderId}</div>
              {order.userId && <div className="text-[10px] text-neutral-500">Customer ID: {order.userId}</div>}
            </div>
            <div className="font-bold text-black text-sm">
              {formatINR(order.amount)}
            </div>
          </div>
        </div>

        {/* Payment & Bank Details */}
        <div className="space-y-1.5 py-2 border-b border-dashed border-neutral-300 text-xs">
          <div className="flex justify-between">
            <span className="text-neutral-600">Payment Mode:</span>
            <span className="font-bold text-black">{order.assignedType === 'BANK' ? 'IMPS Bank Transfer' : 'UPI Direct'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Bank UTR / Reference No:</span>
            <span className="font-bold font-mono text-black">{order.userSubmittedUtr || order.bankUtr || '-'}</span>
          </div>
          {order.assignedHolder && (
            <div className="flex justify-between">
              <span className="text-neutral-600">Beneficiary / Payee:</span>
              <span className="font-medium text-black">{order.assignedHolder}</span>
            </div>
          )}
        </div>

        {/* Total Amount Box */}
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-300 flex items-center justify-between">
          <span className="font-sans font-bold text-sm text-neutral-800 uppercase">
            Total Amount Paid
          </span>
          <span className="font-sans font-black text-2xl text-black">
            {formatINR(order.receivedAmount || order.amount)}
          </span>
        </div>

        {/* Receipt Footer */}
        <div className="text-center pt-2 text-[10px] text-neutral-500 space-y-1">
          <p>Thank you for your payment.</p>
          <p>This is a computer-generated transaction receipt. No signature required.</p>
        </div>
      </div>
    </div>
  );
}
