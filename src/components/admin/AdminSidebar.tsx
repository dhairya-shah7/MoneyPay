'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowDownLeft,
  Building2,
  Send,
  Users,
  Code2,
  LogOut,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Transactions & UTRs', href: '/admin/transactions', icon: ArrowDownLeft },
  { label: 'Bank & UPI Pool', href: '/admin/accounts', icon: Building2 },
  { label: 'Payment Link Generator', href: '/admin/simulator', icon: Send },
  { label: 'Team & Roles', href: '/admin/team', icon: Users },
  { label: 'Developers & Webhooks', href: '/admin/developers', icon: Code2 },
];

interface AdminSidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export function AdminSidebar({ onClose, isMobile = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setCurrentUser(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'SUPER ADMIN', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'OPERATIONS_AGENT':
        return { label: 'OPS AGENT', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'FINANCE_VIEWER':
        return { label: 'FINANCE', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'MERCHANT':
        return { label: 'MERCHANT', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: 'ADMIN', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
  };

  const badge = getRoleBadge(currentUser?.role);

  return (
    <div className={`h-full flex flex-col justify-between bg-white text-slate-700 ${isMobile ? 'w-full' : 'w-64 border-r border-slate-200'}`}>
      <div className="p-4 sm:p-5 space-y-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 p-0.5 shadow-md shadow-emerald-500/10 shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-black text-emerald-600 group-hover:scale-105 transition-transform">
                ₹
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-slate-900">MoneyPay</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Direct Deposit Gateway</p>
            </div>
          </Link>

          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 pt-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Footer */}
      <div className="p-4 border-t border-slate-100 space-y-3 text-xs bg-slate-50/50">
        {/* User Card */}
        {currentUser ? (
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-900 truncate max-w-[130px]">
                {currentUser.name}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Session" />
            </div>
            <div className="text-[10px] text-slate-500 truncate font-mono">
              {currentUser.email}
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-900 truncate">Dhairya (Super Admin)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[10px] text-slate-500 truncate font-mono">
              dhairyaqwerty1@gmail.com
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={onClose}
            className="flex-1 py-2 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
          >
            <span>Gateway Home</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
          <button
            onClick={handleLogout}
            title="Logout"
            className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors border border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
