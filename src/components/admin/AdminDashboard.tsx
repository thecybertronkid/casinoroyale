import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { AdminUserData, UserRestrictions } from '../../types/auth';
import type { BetHistoryItem } from '../../types';
import { 
  ShieldAlert, 
  Users, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Edit3, 
  Unlock, 
  Ban, 
  Eye, 
  RefreshCw, 
  X, 
  AlertCircle, 
  Database, 
  Plus, 
  Minus,
  Sliders,
  DollarSign,
  ArrowLeft,
  Crown
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToCasino: () => void;
  onRefreshCurrentWallet?: () => void;
}

const CASINO_GAMES_LIST = [
  { id: 'slots', name: 'Crown 777 Slots' },
  { id: 'roulette', name: 'European Roulette' },
  { id: 'blackjack', name: 'Blackjack Royale' },
  { id: 'crash', name: 'Ascent Multiplier (Crash)' },
  { id: 'mines', name: 'Diamond Minefield' },
  { id: 'dice', name: 'Prestige Dice' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onBackToCasino,
  onRefreshCurrentWallet 
}) => {
  // Authentication state for Pit Boss Terminal
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('pb_admin_unlocked') === 'true';
  });
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Data states
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'restricted'>('all');

  // Modals
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<AdminUserData | null>(null);
  const [balanceAdjustmentAmount, setBalanceAdjustmentAmount] = useState<string>('500');
  const [balanceAdjustmentMode, setBalanceAdjustmentMode] = useState<'add' | 'deduct' | 'set'>('add');

  const [selectedUserForRestrictions, setSelectedUserForRestrictions] = useState<AdminUserData | null>(null);
  const [restrictionForm, setRestrictionForm] = useState<UserRestrictions>({
    isBanned: false,
    canClaimRelief: true,
    restrictedGames: [],
    maxBetLimit: null,
    adminNotes: '',
  });

  const [selectedUserForAudit, setSelectedUserForAudit] = useState<AdminUserData | null>(null);
  const [auditBets, setAuditBets] = useState<BetHistoryItem[]>([]);
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Default master passcodes: 'admin777' or 'poisa2026'
    if (passcode === 'admin777' || passcode === 'poisa2026' || passcode === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('pb_admin_unlocked', 'true');
      setAuthError(null);
    } else {
      setAuthError('Invalid Admin Passcode. Use default master key "admin777"');
    }
  };

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const data = await dbService.fetchAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllUsers();
    }
  }, [isAuthenticated]);

  // Handle balance adjustment
  const handleSaveBalance = async () => {
    if (!selectedUserForBalance) return;
    const amount = parseFloat(balanceAdjustmentAmount);
    if (isNaN(amount) || amount < 0) {
      showNotification('Please enter a valid positive number', 'error');
      return;
    }

    let targetBalance = selectedUserForBalance.balance;
    if (balanceAdjustmentMode === 'add') targetBalance += amount;
    else if (balanceAdjustmentMode === 'deduct') targetBalance = Math.max(0, targetBalance - amount);
    else if (balanceAdjustmentMode === 'set') targetBalance = amount;

    targetBalance = Math.round(targetBalance * 100) / 100;

    await dbService.adminUpdateUserBalance(selectedUserForBalance.profile.id, targetBalance);
    showNotification(`Updated ${selectedUserForBalance.profile.name}'s balance to ₹${targetBalance.toFixed(2)}`);
    setSelectedUserForBalance(null);
    loadAllUsers();
    if (onRefreshCurrentWallet) onRefreshCurrentWallet();
  };

  // Handle restriction save
  const handleSaveRestrictions = async () => {
    if (!selectedUserForRestrictions) return;
    await dbService.adminUpdateUserRestrictions(selectedUserForRestrictions.profile.id, restrictionForm);
    showNotification(`Updated policy restrictions for ${selectedUserForRestrictions.profile.name}`);
    setSelectedUserForRestrictions(null);
    loadAllUsers();
    if (onRefreshCurrentWallet) onRefreshCurrentWallet();
  };

  // Open audit ledger
  const handleOpenAudit = async (user: AdminUserData) => {
    setSelectedUserForAudit(user);
    setAuditLoading(true);
    const bets = await dbService.adminFetchUserBets(user.profile.id);
    setAuditBets(bets);
    setAuditLoading(false);
  };

  // Open restriction modal
  const handleOpenRestrictions = (user: AdminUserData) => {
    setSelectedUserForRestrictions(user);
    setRestrictionForm({
      isBanned: user.profile.isBanned ?? false,
      canClaimRelief: user.profile.canClaimRelief ?? true,
      restrictedGames: user.profile.restrictedGames ?? [],
      maxBetLimit: user.profile.maxBetLimit ?? null,
      adminNotes: user.profile.adminNotes || '',
    });
  };

  // Toggle quick ban
  const handleToggleBan = async (user: AdminUserData) => {
    const newBannedState = !user.profile.isBanned;
    await dbService.adminUpdateUserRestrictions(user.profile.id, { isBanned: newBannedState });
    showNotification(`${newBannedState ? 'Suspended' : 'Restored'} ${user.profile.name}'s account`);
    loadAllUsers();
    if (onRefreshCurrentWallet) onRefreshCurrentWallet();
  };

  // Calculations for summary cards
  const totalVolume = users.reduce((acc, u) => acc + u.totalWagered, 0);
  const totalPaidOut = users.reduce((acc, u) => acc + u.totalWon, 0);
  const totalLost = users.reduce((acc, u) => acc + u.totalLost, 0);
  // House Net Profit = Total Player Losses - Total Player Winnings
  const houseProfit = totalLost - totalPaidOut;
  const bannedCount = users.filter((u) => u.profile.isBanned).length;

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.profile.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'suspended') return u.profile.isBanned;
    if (statusFilter === 'restricted') return (u.profile.restrictedGames && u.profile.restrictedGames.length > 0) || !u.profile.canClaimRelief;
    if (statusFilter === 'active') return !u.profile.isBanned;
    return true;
  });

  // Locked Gatekeeper Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07080c] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d0f17] border border-[#d4af37]/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto mb-6">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <span className="text-[10px] tracking-[0.25em] font-semibold text-[#d4af37] uppercase bg-[#d4af37]/10 px-3 py-1 rounded-full border border-[#d4af37]/20">
            Pit Boss Command
          </span>

          <h2 className="font-luxury text-2xl font-bold text-white mt-4 mb-2 tracking-wide">
            EXECUTIVE CASINO TERMINAL
          </h2>
          <p className="text-xs text-slate-400 font-light mb-6">
            Authorized management access only. Enter the master key to inspect players, adjust balances, and enforce floor policies.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter Pit Boss Passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 bg-[#08090e] border border-white/10 rounded-xl text-white text-center text-sm font-mono tracking-widest focus:outline-none focus:border-[#d4af37] transition"
                autoFocus
              />
              <span className="text-[11px] text-slate-500 block mt-1.5 font-light">
                Default Master Key: <code className="text-[#f3e5ab] font-mono">admin777</code>
              </span>
            </div>

            {authError && (
              <div className="text-rose-400 text-xs flex items-center justify-center gap-1.5 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b3902a] text-black font-semibold text-xs tracking-wider uppercase hover:brightness-110 transition active:scale-[0.98] shadow-lg shadow-[#d4af37]/10"
            >
              Access Terminal
            </button>

            <button
              type="button"
              onClick={onBackToCasino}
              className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Casino Floor</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-200 flex flex-col font-sans selection:bg-[#d4af37]/30">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[#d4af37]/20 bg-[#090a10]/95 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-luxury text-base sm:text-lg font-bold text-white tracking-wider">
                POISA BORBAAD
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Pit Boss Terminal
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-light">
              Executive Floor Oversight & User Authority
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSupabaseConfigured ? (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Connected</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
              <Database className="w-3.5 h-3.5" />
              <span>Local Mock / Storage Mode</span>
            </div>
          )}

          <button
            onClick={loadAllUsers}
            title="Refresh Player List"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d4af37]' : ''}`} />
          </button>

          <button
            onClick={onBackToCasino}
            className="px-3.5 py-1.5 rounded-xl bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/40 text-[#f3e5ab] text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Casino Floor</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Notification Alert */}
        {notification && (
          <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            notification.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Executive Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/[0.06] shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-medium">Registered Players</span>
              <Users className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {users.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {bannedCount > 0 ? `${bannedCount} suspended` : 'All accounts active'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/[0.06] shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-medium">Casino Volume (Wagered)</span>
              <Coins className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div className="text-2xl font-mono font-bold text-[#f3e5ab]">
              ₹{totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Total chips handled</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/[0.06] shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-medium">Casino House Return</span>
              {houseProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div className={`text-2xl font-mono font-bold ${houseProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {houseProfit >= 0 ? '+' : ''}₹{houseProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">House Edge Yield</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/[0.06] shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-medium">Player Payouts</span>
              <DollarSign className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div className="text-2xl font-mono font-bold text-slate-200">
              ₹{totalPaidOut.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Winnings credited</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0d0f17] border border-white/[0.06] p-3 rounded-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search players by name, email, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#08090f] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#08090f] p-1 rounded-xl border border-white/10 text-xs">
              {(['all', 'active', 'restricted', 'suspended'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg capitalize transition text-[11px] font-medium ${
                    statusFilter === status
                      ? 'bg-[#181b28] text-white border border-[#d4af37]/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Players Management Table */}
        <div className="bg-[#0e1017] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#0a0b10]">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-300">
              Player Directory & Authority Controls ({filteredUsers.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Live updates enabled
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08090f] text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                <tr>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                  <th className="py-3 px-4">Volume Wagered</th>
                  <th className="py-3 px-4">Net Result</th>
                  <th className="py-3 px-4">Policy Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No matching players found in directory.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isBanned = user.profile.isBanned;
                    const hasGameRestrictions = (user.profile.restrictedGames || []).length > 0;
                    const noRelief = user.profile.canClaimRelief === false;

                    return (
                      <tr key={user.profile.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {user.profile.picture ? (
                              <img
                                src={user.profile.picture}
                                alt={user.profile.name}
                                className="w-8 h-8 rounded-full border border-[#d4af37]/30 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-xs">
                                {user.profile.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{user.profile.name}</span>
                                {isBanned && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] uppercase font-mono">
                                    Suspended
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {user.profile.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-[#f3e5ab]">
                          ₹{user.balance.toFixed(2)}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-300">
                          ₹{user.totalWagered.toFixed(2)}
                          <span className="block text-[10px] text-slate-500">
                            {user.totalBets} rounds
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <span className={user.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {user.netProfit >= 0 ? '+' : ''}₹{user.netProfit.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {isBanned ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px]">
                                Suspended
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                Active
                              </span>
                            )}
                            {noRelief && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]" title="Demo credits claims disabled">
                                No Relief
                              </span>
                            )}
                            {hasGameRestrictions && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[10px]" title={`Restricted: ${user.profile.restrictedGames.join(', ')}`}>
                                {user.profile.restrictedGames.length} Game Excluded
                              </span>
                            )}
                            {user.profile.maxBetLimit && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-300 border border-slate-500/30 text-[10px]">
                                Max ₹{user.profile.maxBetLimit}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Balance */}
                            <button
                              onClick={() => {
                                setSelectedUserForBalance(user);
                                setBalanceAdjustmentAmount('500');
                                setBalanceAdjustmentMode('add');
                              }}
                              title="Adjust Wallet Balance (Add / Deduct Funds)"
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-[#d4af37]/20 text-slate-300 hover:text-[#f3e5ab] border border-white/10 hover:border-[#d4af37]/40 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Restrict Features */}
                            <button
                              onClick={() => handleOpenRestrictions(user)}
                              title="Policy & Feature Restrictions (Games, Limits, Relinquish Claims)"
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition"
                            >
                              <Sliders className="w-3.5 h-3.5" />
                            </button>

                            {/* View Audit Bets */}
                            <button
                              onClick={() => handleOpenAudit(user)}
                              title="View Audited Wager Rounds"
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Quick Ban Toggle */}
                            <button
                              onClick={() => handleToggleBan(user)}
                              title={isBanned ? 'Reinstate Player' : 'Suspend Player'}
                              className={`p-1.5 rounded-lg border transition ${
                                isBanned
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                  : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-rose-400 hover:border-rose-500/30'
                              }`}
                            >
                              {isBanned ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: ADJUST WALLET BALANCE                                            */}
      {/* ========================================================================= */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0e1017] border border-white/10 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h4 className="font-luxury text-base font-bold text-white">
                  ADJUST PLAYER WALLET
                </h4>
                <p className="text-xs text-slate-400">
                  Target: {selectedUserForBalance.profile.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#08090f] border border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-400">Current Balance:</span>
              <span className="text-base font-mono font-bold text-[#f3e5ab]">
                ₹{selectedUserForBalance.balance.toFixed(2)}
              </span>
            </div>

            {/* Adjustment Mode Switch */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBalanceAdjustmentMode('add')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  balanceAdjustmentMode === 'add'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Credit (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setBalanceAdjustmentMode('deduct')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  balanceAdjustmentMode === 'deduct'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Debit (-)</span>
              </button>

              <button
                type="button"
                onClick={() => setBalanceAdjustmentMode('set')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  balanceAdjustmentMode === 'set'
                    ? 'bg-[#d4af37]/20 text-[#f3e5ab] border border-[#d4af37]/40'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Set Exact</span>
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {[100, 500, 1000, 5000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBalanceAdjustmentAmount(preset.toString())}
                  className="flex-1 py-1 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-mono text-slate-300 border border-white/10"
                >
                  ₹{preset}
                </button>
              ))}
            </div>

            {/* Input */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Amount (₹):
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={balanceAdjustmentAmount}
                onChange={(e) => setBalanceAdjustmentAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#08090f] border border-white/10 rounded-xl text-white font-mono text-base focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBalance}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b3902a] text-black font-semibold text-xs hover:brightness-110 transition shadow-md shadow-[#d4af37]/10"
              >
                Apply Balance Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: USER FEATURE RESTRICTIONS & POLICY                               */}
      {/* ========================================================================= */}
      {selectedUserForRestrictions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0e1017] border border-white/10 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h4 className="font-luxury text-base font-bold text-white">
                  PLAYER RESTRICTIONS & AUTHORITY
                </h4>
                <p className="text-xs text-slate-400">
                  Target: {selectedUserForRestrictions.profile.name} ({selectedUserForRestrictions.profile.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForRestrictions(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Account Freeze */}
            <div className="p-3.5 rounded-xl bg-[#08090f] border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-white block">
                  Freeze Account (Suspension)
                </span>
                <span className="text-[10px] text-slate-400">
                  Completely blocks player from wagering or logging in.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRestrictionForm((prev) => ({ ...prev, isBanned: !prev.isBanned }))
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  restrictionForm.isBanned
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-white/[0.04] text-slate-400 border border-white/10'
                }`}
              >
                {restrictionForm.isBanned ? 'Suspended' : 'Unrestricted'}
              </button>
            </div>

            {/* 2. Block Relief Claims */}
            <div className="p-3.5 rounded-xl bg-[#08090f] border border-white/5 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-white block">
                  Allow Demo Relief Credits (+₹500)
                </span>
                <span className="text-[10px] text-slate-400">
                  If disabled, player cannot click +₹500 to reload demo balance.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRestrictionForm((prev) => ({ ...prev, canClaimRelief: !prev.canClaimRelief }))
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  restrictionForm.canClaimRelief
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {restrictionForm.canClaimRelief ? 'Allowed' : 'Blocked'}
              </button>
            </div>

            {/* 3. Max Bet Ceiling */}
            <div className="p-3.5 rounded-xl bg-[#08090f] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-white block">
                    Enforce Maximum Bet Limit
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Caps maximum wager per round (leave empty for unlimited).
                  </span>
                </div>
                {restrictionForm.maxBetLimit && (
                  <button
                    type="button"
                    onClick={() => setRestrictionForm((prev) => ({ ...prev, maxBetLimit: null }))}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Clear Limit
                  </button>
                )}
              </div>
              <input
                type="number"
                placeholder="No limit (unrestricted)"
                value={restrictionForm.maxBetLimit ?? ''}
                onChange={(e) =>
                  setRestrictionForm((prev) => ({
                    ...prev,
                    maxBetLimit: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="w-full px-3 py-2 bg-[#0d0f17] border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* 4. Game Exclusions */}
            <div className="p-3.5 rounded-xl bg-[#08090f] border border-white/5 space-y-2.5">
              <span className="font-semibold text-xs text-white block">
                Restrict Specific Games
              </span>
              <p className="text-[10px] text-slate-400">
                Check games to disallow this player from playing them:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CASINO_GAMES_LIST.map((game) => {
                  const isRestricted = restrictionForm.restrictedGames.includes(game.id);
                  return (
                    <label
                      key={game.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ${
                        isRestricted
                          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                          : 'bg-white/[0.02] border-white/5 text-slate-300 hover:border-white/10'
                      }`}
                    >
                      <span>{game.name}</span>
                      <input
                        type="checkbox"
                        checked={isRestricted}
                        onChange={() => {
                          setRestrictionForm((prev) => {
                            const newRestricted = isRestricted
                              ? prev.restrictedGames.filter((g) => g !== game.id)
                              : [...prev.restrictedGames, game.id];
                            return { ...prev, restrictedGames: newRestricted };
                          });
                        }}
                        className="rounded accent-rose-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 5. Admin Notes */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 block font-medium">
                Pit Boss Internal Audit Notes:
              </label>
              <textarea
                rows={2}
                placeholder="Add private management remarks on player activity..."
                value={restrictionForm.adminNotes ?? ''}
                onChange={(e) =>
                  setRestrictionForm((prev) => ({ ...prev, adminNotes: e.target.value }))
                }
                className="w-full p-2.5 bg-[#08090f] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setSelectedUserForRestrictions(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRestrictions}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b3902a] text-black font-semibold text-xs hover:brightness-110 transition shadow-md shadow-[#d4af37]/10"
              >
                Save Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AUDITED BET HISTORY LEDGER                                       */}
      {/* ========================================================================= */}
      {selectedUserForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0e1017] border border-white/10 max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h4 className="font-luxury text-base font-bold text-white">
                  PLAYER ACTIVITY & AUDIT LOG
                </h4>
                <p className="text-xs text-slate-400">
                  Player: {selectedUserForAudit.profile.name} ({selectedUserForAudit.profile.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForAudit(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {auditLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#d4af37]" />
                  <span>Loading audited rounds...</span>
                </div>
              ) : auditBets.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No rounds recorded for this player yet.
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#08090f] text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                      <tr>
                        <th className="py-2.5 px-3">Game</th>
                        <th className="py-2.5 px-3">Wager</th>
                        <th className="py-2.5 px-3">Payout</th>
                        <th className="py-2.5 px-3">Net Profit</th>
                        <th className="py-2.5 px-3">Details</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] bg-[#0c0e15]">
                      {auditBets.map((bet) => (
                        <tr key={bet.id} className="hover:bg-white/[0.02]">
                          <td className="py-2 px-3 font-medium text-slate-200">
                            {bet.gameName}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            ₹{bet.betAmount.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300">
                            ₹{bet.payout.toFixed(2)}
                          </td>
                          <td className={`py-2 px-3 font-mono font-medium ${bet.profit > 0 ? 'text-emerald-400' : bet.profit < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {bet.profit > 0 ? '+' : ''}₹{bet.profit.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-[10px] text-slate-400 truncate max-w-[140px]">
                            {bet.details}
                          </td>
                          <td className="py-2 px-3 text-[10px] text-slate-500 font-mono whitespace-nowrap">
                            {new Date(bet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setSelectedUserForAudit(null)}
                className="px-4 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 text-xs font-medium transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
