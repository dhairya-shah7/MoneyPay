import React, { useState } from 'react';
import { Building2, Copy, Check, Info } from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface BankDetailsProps {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  amount: number;
}

export function BankTransferSection({
  bankName,
  accountNumber,
  ifscCode,
  accountHolder,
  amount,
}: BankDetailsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyValue = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fields = [
    { label: 'Bank Name', value: bankName, key: 'bankName' },
    { label: 'Account Number', value: accountNumber, key: 'accountNumber', highlight: true },
    { label: 'IFSC Code', value: ifscCode, key: 'ifscCode', highlight: true },
    { label: 'Beneficiary Name', value: accountHolder, key: 'accountHolder' },
    { label: 'Exact Transfer Amount', value: formatINR(amount), copyVal: amount.toString(), key: 'amount' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Direct Bank Transfer (NEFT / Kotak IFT / IMPS)</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
          0% Fee via NEFT / IFT
        </span>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
        <span>
          Transfer the exact amount via <strong>NEFT</strong>, <strong>Kotak-to-Kotak IFT</strong>, or <strong>IMPS</strong> to the account below, then submit the 12-digit UTR/Reference ID below.
        </span>
      </div>

      <div className="bg-slate-50/70 rounded-2xl border border-slate-200 divide-y divide-slate-200">
        {fields.map((field) => (
          <div key={field.key} className="p-3.5 flex items-center justify-between gap-2">
            <div className="truncate mr-2">
              <span className="text-[11px] font-medium text-slate-500 block">{field.label}</span>
              <span
                className={`font-mono text-xs sm:text-sm font-bold block truncate ${
                  field.highlight
                    ? 'text-indigo-700 font-extrabold'
                    : 'text-slate-900'
                }`}
              >
                {field.value}
              </span>
            </div>
            <button
              onClick={() => copyValue(field.key, field.copyVal || field.value)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-xs text-slate-700 transition-colors shadow-sm"
            >
              {copiedField === field.key ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Copy</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
