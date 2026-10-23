import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  BarChart2, 
  ShieldCheck, 
  Crown, 
  Plus, 
  LogOut, 
  ShieldAlert,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface HeaderProps {
  onOpenStats: () => void;
  onOpenFairModal: () => void;
  onOpenAdmin: () => void;
  activeGame: string | null;
  onBackToLobby: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenStats,
  onOpenFairModal,
  onOpenAdmin,
  activeGame,
  onBackToLobby,
}) => {
  const { balance, stats, isMuted, toggleMute, claimReliefCredits, resetWallet } = useWallet();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Refined VIP Tier
  const getVipRank = (wagered: number) => {
    if (wagered >= 100000) return 'Emperor Club';
    if (wagered >= 20000) return 'Diamond Tier';
    if (wagered >= 5000) return 'Gold Premier';
    if (wagered >= 1000) return 'Silver Club';
    return 'Club Member';
  };

  const vipName = getVipRank(stats.totalWagered);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#d4af37]/15 bg-[#090a0f]/95 backdrop-blur-xl px-3 sm:px-8 py-2.5 sm:py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <div 
            onClick={onBackToLobby}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[#dfc46e]/20 to-[#997d21]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow-sm group-hover:border-[#d4af37]/60 transition-colors">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.8]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-luxury text-sm sm:text-xl font-bold tracking-[0.08em] sm:tracking-[0.1em] text-white group-hover:text-[#f3e5ab] transition-colors leading-none">
                  POISA BORBAAD
                </span>
                <span className="hidden md:inline-block text-[9px] font-semibold tracking-[0.2em] uppercase px-1.5 py-0.5 rounded border border-[#d4af37]/25 text-[#d4af37]/90">
                  Lounge
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 font-light tracking-wider uppercase mt-0.5">
                Private Gaming & High Stakes
              </p>
            </div>
          </div>

          {/* Center Breadcrumb (when inside a game) */}
          {activeGame && (
            <button
              onClick={onBackToLobby}
              className="hidden lg:flex items-center gap-2 text-xs text-slate-400 hover:text-[#d4af37] px-3 py-1.5 rounded-lg border border-white/5 hover:border-[#d4af37]/30 bg-white/[0.02] transition"
            >
              <span>← Return to Floor</span>
            </button>
          )}

          {/* Right Section: Mobile Clean Layout + Desktop Full Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* VIP Status Pill (Desktop) */}
            <div 
              onClick={onOpenStats}
              title={`VIP Rank: ${vipName}`}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-xs text-slate-300 cursor-pointer hover:border-[#d4af37]/30 transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
              <span className="text-[11px] font-medium tracking-wide text-slate-300">{vipName}</span>
            </div>

            {/* Wallet Balance Pill (Always accessible on Mobile & Desktop) */}
            <div className="flex items-center bg-[#10121a] border border-[#d4af37]/30 rounded-xl pl-2.5 sm:pl-3.5 pr-1 sm:pr-1.5 py-1 sm:py-1.5 shadow-sm">
              <div className="mr-2 sm:mr-3 text-left">
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-400 block leading-tight font-medium">
                  Balance
                </span>
                <span className="text-xs sm:text-base font-semibold font-mono text-[#f3e5ab] leading-none whitespace-nowrap">
                  ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Reload Button */}
              <button
                onClick={() => claimReliefCredits(500)}
                title={user?.canClaimRelief === false ? 'Demo reloads blocked' : 'Claim +₹500 Demo Credits'}
                disabled={user?.canClaimRelief === false}
                className={`p-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition active:scale-90 ${
                  user?.canClaimRelief === false
                    ? 'bg-slate-800/40 text-slate-600 border-white/5 cursor-not-allowed'
                    : 'bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#f3e5ab] border-[#d4af37]/30'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">₹500</span>
              </button>
            </div>

            {/* Desktop Full Actions (Hidden on Mobile) */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Ledger / Stats Button */}
              <button
                onClick={onOpenStats}
                title="Performance & History"
                aria-label="Performance & History"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition flex items-center gap-1.5 text-xs font-medium"
              >
                <BarChart2 className="w-4 h-4 text-[#d4af37]" />
                <span className="hidden md:inline text-[11px]">Ledger</span>
              </button>

              {/* Pit Boss Admin Terminal Trigger */}
              <button
                onClick={onOpenAdmin}
                title="Executive Pit Boss Terminal (Admin Dashboard)"
                aria-label="Pit Boss Terminal"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#d4af37]/10 hover:bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 hover:border-[#d4af37]/60 transition flex items-center gap-1.5 text-xs font-medium shadow-sm"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden xl:inline text-[11px] font-semibold tracking-wider uppercase">Pit Boss</span>
              </button>

              {/* Fair Play Verifier */}
              <button
                onClick={onOpenFairModal}
                title="Integrity & Randomness"
                aria-label="Integrity & Randomness"
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition items-center"
              >
                <ShieldCheck className="w-4 h-4 text-slate-300" />
              </button>

              {/* Audio Mute/Unmute */}
              <button
                onClick={toggleMute}
                title={isMuted ? 'Enable Sound' : 'Mute Sound'}
                aria-label={isMuted ? 'Enable Sound' : 'Mute Sound'}
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#d4af37]" />
                )}
              </button>

              {/* Reset Wallet */}
              <button
                onClick={() => {
                  if (window.confirm('Reset wallet to default ₹500 demo credits?')) {
                    resetWallet();
                  }
                }}
                title="Reset Balance to ₹500"
                aria-label="Reset Balance to ₹500"
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-rose-400 border border-white/10 hover:border-white/20 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* User Profile & Logout (Desktop) */}
              {user && (
                <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2.5 border-l border-white/10">
                  <div 
                    className="flex items-center gap-2 bg-[#12141f] border border-[#d4af37]/25 px-2 py-1 rounded-xl"
                    title={`Signed in as ${user.name} (${user.email})`}
                  >
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#d4af37]/50 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] text-[10px] font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden lg:inline text-[11px] font-medium text-slate-200 max-w-[90px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    title="Sign out"
                    aria-label="Sign out"
                    className="p-2 rounded-xl bg-white/[0.03] hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Luxury Action Menu Button (Only visible on mobile screens) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Casino Menu"
              className="sm:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#d4af37]/30 text-slate-200 flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-5 h-5 rounded-full border border-[#d4af37]/60 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Menu className="w-4 h-4 text-[#d4af37]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================================= */}
      {/* MOBILE LUXURY SALON DRAWER (Mobile Slide-Over Modal)                    */}
      {/* ======================================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex-1"
          />
          <div className="bg-[#0e1017] border-t border-[#d4af37]/30 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300">
            {/* Drawer Drag Pill */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto -mt-1 mb-2" />

            {/* Member Profile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border border-[#d4af37]/50 object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                    <span>{user?.name || 'VIP Member'}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#d4af37]/15 text-[#f3e5ab] border border-[#d4af37]/30 font-mono">
                      {vipName}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {user?.email || 'member@poisaborbaad.vip'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Wallet Stats on Mobile Drawer */}
            <div className="p-3 rounded-xl bg-[#08090f] border border-white/[0.05] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-medium block">
                  Active Wallet Balance
                </span>
                <span className="font-mono text-lg font-bold text-[#f3e5ab]">
                  ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={() => {
                  claimReliefCredits(500);
                  setIsMobileMenuOpen(false);
                }}
                disabled={user?.canClaimRelief === false}
                className="px-3 py-1.5 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f3e5ab] text-xs font-semibold flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+₹500</span>
              </button>
            </div>

            {/* Menu Options List */}
            <div className="space-y-1.5">
              {/* Ledger */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenStats();
                }}
                className="w-full p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] flex items-center justify-between text-xs text-slate-200 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Performance Ledger</span>
                    <span className="text-[10px] text-slate-400">View audited bets and VIP rank</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {/* Pit Boss Admin */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full p-3 rounded-xl bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 flex items-center justify-between text-xs text-[#f3e5ab] transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Pit Boss Executive Terminal</span>
                    <span className="text-[10px] text-[#f3e5ab]/70">Admin oversight, balances & policies</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#d4af37]" />
              </button>

              {/* Fair Play Verifier */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenFairModal();
                }}
                className="w-full p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] flex items-center justify-between text-xs text-slate-200 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Provably Fair & Integrity</span>
                    <span className="text-[10px] text-slate-400">Cryptographic seeds and RNG rules</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {/* Audio Toggle */}
              <button
                onClick={toggleMute}
                className="w-full p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] flex items-center justify-between text-xs text-slate-200 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#d4af37]">
                    {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4" />}
                  </div>
                  <span className="font-semibold">Casino Sound Effects</span>
                </div>
                <span className={`text-[11px] font-mono font-medium ${isMuted ? 'text-slate-500' : 'text-emerald-400'}`}>
                  {isMuted ? 'Muted' : 'Active'}
                </span>
              </button>

              {/* Reset Wallet */}
              <button
                onClick={() => {
                  if (window.confirm('Reset wallet to default ₹500 demo credits?')) {
                    resetWallet();
                    setIsMobileMenuOpen(false);
                  }
                }}
                className="w-full p-3 rounded-xl bg-white/[0.02] hover:bg-rose-950/20 border border-white/[0.05] flex items-center justify-between text-xs text-slate-300 hover:text-rose-400 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center text-slate-400">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">Reset Balance to ₹500</span>
                </div>
              </button>
            </div>

            {/* Logout Button */}
            {user && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of POISA BORBAAD</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
