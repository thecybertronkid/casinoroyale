import React from 'react';
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
  LogOut
} from 'lucide-react';

interface HeaderProps {
  onOpenStats: () => void;
  onOpenFairModal: () => void;
  activeGame: string | null;
  onBackToLobby: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenStats,
  onOpenFairModal,
  activeGame,
  onBackToLobby,
}) => {
  const { balance, stats, isMuted, toggleMute, claimReliefCredits, resetWallet } = useWallet();
  const { user, logout } = useAuth();

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
    <header className="sticky top-0 z-40 border-b border-[#d4af37]/15 bg-[#090a0f]/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={onBackToLobby}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#dfc46e]/20 to-[#997d21]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow-sm group-hover:border-[#d4af37]/60 transition-colors">
            <Crown className="w-5 h-5 stroke-[1.8]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-luxury text-base sm:text-xl font-bold tracking-[0.1em] text-white group-hover:text-[#f3e5ab] transition-colors">
                POISA BORBAAD
              </span>
              <span className="hidden md:inline-block text-[9px] font-semibold tracking-[0.2em] uppercase px-1.5 py-0.5 rounded border border-[#d4af37]/25 text-[#d4af37]/90">
                Lounge
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-light tracking-wider uppercase">
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

        {/* Right Actions: Wallet & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* VIP Status Pill */}
          <div 
            onClick={onOpenStats}
            title={`VIP Rank: ${vipName}`}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.02] text-xs text-slate-300 cursor-pointer hover:border-[#d4af37]/30 transition"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
            <span className="text-[11px] font-medium tracking-wide text-slate-300">{vipName}</span>
          </div>

          {/* Minimalist Wallet Balance */}
          <div className="flex items-center bg-[#10121a] border border-[#d4af37]/30 rounded-xl pl-3 sm:pl-3.5 pr-1.5 py-1.5 shadow-sm">
            <div className="mr-2.5 sm:mr-3 text-left">
              <span className="text-[9px] uppercase tracking-widest text-slate-400 block leading-tight font-medium">
                Balance
              </span>
              <span className="text-sm sm:text-base font-semibold font-mono text-[#f3e5ab] leading-none">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Subtle Reload Button */}
            <button
              onClick={() => claimReliefCredits(500)}
              title="Add ₹500 Demo Credits"
              className="px-2.5 py-1.5 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#f3e5ab] border border-[#d4af37]/30 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">₹500</span>
            </button>
          </div>

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

          {/* Fair Play Verifier */}
          <button
            onClick={onOpenFairModal}
            title="Integrity & Randomness"
            aria-label="Integrity & Randomness"
            className="hidden sm:flex p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition items-center"
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

          {/* User Profile & Logout */}
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
                title="Sign out of POISA BORBAAD"
                aria-label="Sign out"
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
