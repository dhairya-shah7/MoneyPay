import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
  const normalized = status ? status.toUpperCase() : 'PENDING';

  const styles: Record<string, string> = {
    SUCCESS: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    PENDING: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    VERIFYING: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
    BANK_MISMATCH: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
    DUPLICATE: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
    EXPIRED: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    FAILED: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
  };

  const labels: Record<string, string> = {
    SUCCESS: 'Success',
    PENDING: 'Awaiting Payment',
    VERIFYING: 'Verifying UTR',
    BANK_MISMATCH: 'Amount Mismatch',
    DUPLICATE: 'Duplicate UTR',
    EXPIRED: 'Expired',
    FAILED: 'Failed',
  };

  const currentStyle = styles[normalized] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
  const label = labels[normalized] || normalized;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        currentStyle,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
