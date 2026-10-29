'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Key,
  Mail,
  UserCheck,
  UserX,
  Trash2,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { formatINR } from '@/lib/utils';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  businessName?: string | null;
  role: UserRole;
  dailyLimit?: number;
  minAmount?: number;
  maxAmount?: number;
  currentDayVolume?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLES_INFO: Record<UserRole, { title: string; color: string; desc: string }> = {
  SUPER_ADMIN: {
    title: 'Super Admin',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Full system access: manage team roles, bank accounts, settlements, and master API keys.',
  },
  OPERATIONS_AGENT: {
    title: 'Operations Agent',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Review transactions, verify submitted UTRs, approve deposits, and resolve bank discrepancies.',
  },
  FINANCE_VIEWER: {
    title: 'Finance Viewer',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Read-only access to ledger reports, bank volume statistics, and payout reconciliation.',
  },
  MERCHANT: {
    title: 'Merchant Access',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    desc: 'Scoped view of merchant orders, webhook callback logs, and deposit payment links.',
  },
};

export default function TeamManagementPage() {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('SUPER_ADMIN');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserForLimits, setSelectedUserForLimits] = useState<TeamMember | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('OPERATIONS_AGENT');
  const [newPassword, setNewPassword] = useState('');
  const [newBusinessName, setNewBusinessName] = useState('');

  // Limit modal state
  const [limitDaily, setLimitDaily] = useState<string>('100000');
  const [limitMin, setLimitMin] = useState<string>('100');
  const [limitMax, setLimitMax] = useState<string>('50000');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/users');
      const data = await res.json();
      if (data.success && data.data) {
        setUsers(data.data.users);
        setCurrentUserRole(data.data.currentUserRole);
        setCurrentUserId(data.data.currentUserId);
      }
    } catch (err: any) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setActionLoading('create');

    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
          password: newPassword,
          businessName: newBusinessName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add team member');
      }

      setFeedback({ type: 'success', message: `Team member ${newName} added successfully!` });
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewBusinessName('');
      setNewRole('OPERATIONS_AGENT');
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    setFeedback(null);
    setActionLoading(`role_${userId}`);

    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: targetRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change role');
      }

      setFeedback({ type: 'success', message: 'Role updated successfully!' });
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setFeedback(null);
    setActionLoading(`status_${userId}`);

    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user status');
      }

      setFeedback({
        type: 'success',
        message: `Account ${!currentStatus ? 'activated' : 'deactivated'} successfully!`,
      });
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const openLimitModal = (member: TeamMember) => {
    setSelectedUserForLimits(member);
    setLimitDaily(String(member.dailyLimit || 100000));
    setLimitMin(String(member.minAmount || 100));
    setLimitMax(String(member.maxAmount || 50000));
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForLimits) return;

    setFeedback(null);
    setActionLoading(`limits_${selectedUserForLimits.id}`);

    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForLimits.id,
          dailyLimit: parseFloat(limitDaily),
          minAmount: parseFloat(limitMin),
          maxAmount: parseFloat(limitMax),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update limits');
      }

      setFeedback({ type: 'success', message: `Deposit limits updated for ${selectedUserForLimits.name}!` });
      setSelectedUserForLimits(null);
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the team?`)) return;

    setFeedback(null);
    setActionLoading(`delete_${userId}`);

    try {
      const res = await fetch(`/api/v1/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete member');
      }

      setFeedback({ type: 'success', message: 'Team member removed.' });
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Team, Merchants & RBAC Management
            </h1>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
              {isSuperAdmin ? 'ADMIN MODE' : 'VIEW ONLY'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage administrative personnel, operations agents, merchants, and custom per-user deposit limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Roles Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(ROLES_INFO) as UserRole[]).map((roleKey) => {
          const info = ROLES_INFO[roleKey];
          const count = users.filter((u) => u.role === roleKey).length;
          return (
            <div
              key={roleKey}
              className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${info.color}`}>
                  {info.title}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700">{count} Active</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{info.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Team Members & Limits Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Registered Accounts & Custom Limits ({users.length})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 sm:px-6">Member / Merchant</th>
                <th className="py-3 px-4 sm:px-6">Role</th>
                <th className="py-3 px-4 sm:px-6">Per-User Limits</th>
                <th className="py-3 px-4 sm:px-6">Status</th>
                {isSuperAdmin && <th className="py-3 px-4 sm:px-6 text-right">RBAC Controls</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {users.map((member) => {
                const roleBadge = ROLES_INFO[member.role] || ROLES_INFO.MERCHANT;
                const isOwner = member.role === 'SUPER_ADMIN' && (member.id.includes('superadmin') || member.email.toLowerCase().includes('admin'));
                const dailyLimit = member.dailyLimit || 100000;
                const minAmt = member.minAmount || 100;
                const maxAmt = member.maxAmount || 50000;

                return (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{member.name}</span>
                            {member.businessName && (
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({member.businessName})
                              </span>
                            )}
                            {isOwner && (
                              <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                                OWNER
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      {isSuperAdmin && !isOwner ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                          disabled={actionLoading === `role_${member.id}`}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                        >
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="OPERATIONS_AGENT">Operations Agent</option>
                          <option value="FINANCE_VIEWER">Finance Viewer</option>
                          <option value="MERCHANT">Merchant</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleBadge.color}`}>
                          {roleBadge.title}
                        </span>
                      )}
                    </td>

                    {/* Deposit Limits Display */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="space-y-0.5">
                        <div className="font-mono text-slate-900 font-bold">
                          Daily: {formatINR(dailyLimit)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Single: ₹{minAmt} - ₹{maxAmt}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${
                          member.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {member.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {isSuperAdmin && (
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Limits Config Button */}
                          <button
                            onClick={() => openLimitModal(member)}
                            className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                            title="Configure Deposit Limits"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {!isOwner && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(member.id, member.isActive)}
                                disabled={actionLoading === `status_${member.id}`}
                                className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                  member.isActive
                                    ? 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800'
                                    : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                                }`}
                                title={member.isActive ? 'Deactivate Access' : 'Activate Access'}
                              >
                                {member.isActive ? (
                                  <UserX className="w-3.5 h-3.5" />
                                ) : (
                                  <UserCheck className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(member.id, member.name)}
                                disabled={actionLoading === `delete_${member.id}`}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                                title="Delete Team Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Limits Modal */}
      {selectedUserForLimits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Set Deposit Limits</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{selectedUserForLimits.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForLimits(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLimits} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Daily Deposit Turnover Limit (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  value={limitDaily}
                  onChange={(e) => setLimitDaily(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold text-emerald-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">Maximum volume this user can deposit per calendar day.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Min Single Deposit (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={limitMin}
                    onChange={(e) => setLimitMin(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max Single Deposit (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={limitMax}
                    onChange={(e) => setLimitMax(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUserForLimits(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === `limits_${selectedUserForLimits.id}`}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading === `limits_${selectedUserForLimits.id}` ? 'Saving...' : 'Save Limits'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add New Team Member / Merchant</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Sameer Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business / Platform Name (Optional)
                </label>
                <input
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="e.g. Nova Payments"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="sameer@moneypay.io"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role Assignment
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                >
                  <option value="OPERATIONS_AGENT">Operations Agent (Verify UTRs, Approve Deposits)</option>
                  <option value="FINANCE_VIEWER">Finance Viewer (Read-only Volume & Ledger)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full Administrative Authority)</option>
                  <option value="MERCHANT">Merchant Portal Access</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading === 'create' ? 'Adding Member...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
