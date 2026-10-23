import React, { useState, useEffect } from 'react';
import { CASINO_GAMES } from '../../data/games';
import type { GameId } from '../../types';
import { useWallet } from '../../context/WalletContext';
import { 
  Crown,
  Coins, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Plus,
  CircleDot,
  Layers,
  Sparkles,
  Rocket,
  Bomb,
  Dice5
} from 'lucide-react';

interface LobbyProps {
  onSelectGame: (gameId: GameId) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onSelectGame }) => {
  const { balance, claimReliefCredits } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [jackpotPool, setJackpotPool] = useState<number>(2481950.40);

  // Progressive reserve ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotPool((prev) => prev + (Math.random() * 2.5 + 0.5));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const filteredGames = CASINO_GAMES.filter((g) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Table Games') return g.category === 'Table Games';
    if (selectedCategory === 'Slots') return g.category === 'Slots';
    if (selectedCategory === 'Arcade') return g.category === 'Arcade';
    return true;
  });

  const getGameIcon = (id: GameId) => {
    switch (id) {
      case 'slots':
        return <Sparkles className="w-5 h-5" />;
      case 'roulette':
        return <CircleDot className="w-5 h-5" />;
      case 'blackjack':
        return <Layers className="w-5 h-5" />;
      case 'crash':
        return <Rocket className="w-5 h-5" />;
      case 'mines':
        return <Bomb className="w-5 h-5" />;
      case 'dice':
        return <Dice5 className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-16">
      {/* Hero: Minimalist Luxury Lounge Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-[#d4af37]/20 bg-gradient-to-b from-[#131622] via-[#0d0f17] to-[#090a0f] p-5 sm:p-12 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/25 text-[#d4af37] text-[10px] font-semibold tracking-[0.2em] uppercase mb-4 sm:mb-5">
            <Crown className="w-3.5 h-3.5" />
            <span>The Private Gaming Salon</span>
          </div>

          <h1 className="font-luxury text-2xl sm:text-5xl font-bold text-white tracking-wide leading-tight mb-3 sm:mb-4">
            POISA BORBAAD
          </h1>

          <p className="text-xs sm:text-base text-slate-300 font-light leading-relaxed mb-6 sm:mb-8 max-w-xl">
            A refined virtual gaming lounge designed with authentic casino odds and zero friction. 
            Your wallet holds <strong className="text-white font-mono font-medium">₹{balance.toFixed(2)}</strong> in demo credits. 
            All winnings credit instantaneously for seamless continued play.
          </p>

          {/* Understated Grand Reserve Ticker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/[0.08] backdrop-blur-sm mb-2 sm:mb-8 w-full sm:w-fit">
            <div>
              <span className="text-[9px] sm:text-[10px] tracking-[0.18em] uppercase text-slate-400 block font-medium mb-0.5">
                Grand Reserve Pool
              </span>
              <div className="text-xl sm:text-3xl font-bold font-mono text-[#f3e5ab] tracking-tight">
                ₹{jackpotPool.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            <button
              onClick={() => claimReliefCredits(500)}
              className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#f3e5ab] border border-[#d4af37]/30 text-xs font-medium flex items-center justify-center gap-1.5 transition self-stretch sm:self-auto active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Claim +₹500 Credits</span>
            </button>
          </div>
        </div>
      </div>

      {/* Understated Live Activity Strip */}
      <div className="border border-white/[0.06] bg-[#0c0e15] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3 text-xs overflow-hidden">
        <div className="flex items-center gap-1.5 text-[#d4af37] text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase shrink-0">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Activity</span>
        </div>
        <div className="h-3 w-px bg-white/10 shrink-0" />
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap text-slate-400 font-normal text-[10px] sm:text-[11px] touch-pan-x">
          <span>Player <strong>#8192</strong> landed <span className="text-[#f3e5ab] font-mono font-medium">Black 28</span> on Roulette</span>
          <span className="text-slate-600">•</span>
          <span>Player <strong>#4201</strong> secured <span className="text-[#f3e5ab] font-mono font-medium">6.40x</span> in Ascent</span>
          <span className="text-slate-600">•</span>
          <span>Player <strong>#1099</strong> hit Natural 21 on Blackjack Royale</span>
          <span className="text-slate-600">•</span>
          <span>Player <strong>#7331</strong> cleared 6 Gems in Diamond Minefield</span>
        </div>
      </div>

      {/* Main Floor Games Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="font-luxury text-lg sm:text-2xl font-bold text-white tracking-wide">
              Gaming Floor
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Select a table or machine to begin wagering
            </p>
          </div>

          {/* Minimalist Category Tabs */}
          <div className="flex items-center gap-1 bg-[#0c0e15] p-1 rounded-xl border border-white/[0.06] overflow-x-auto max-w-full touch-pan-x">
            {['All', 'Table Games', 'Slots', 'Arcade'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#181b28] text-white border border-[#d4af37]/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Minimalist Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="group bg-[#0e1017] hover:bg-[#12141f] border border-white/[0.07] hover:border-[#d4af37]/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-[#d4af37]/5"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 group-hover:border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] transition-colors">
                    {getGameIcon(game.id)}
                  </div>

                  {game.badge && (
                    <span className="text-[10px] tracking-[0.15em] uppercase font-semibold px-2.5 py-0.5 rounded border border-white/10 text-slate-400 group-hover:border-[#d4af37]/30 group-hover:text-[#f3e5ab] transition-colors">
                      {game.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-luxury text-lg font-bold text-white group-hover:text-[#f3e5ab] transition-colors tracking-wide">
                  {game.name}
                </h3>
                <p className="text-xs text-[#d4af37]/90 font-medium mt-1 mb-2">
                  {game.tagline}
                </p>
                <p className="text-xs text-slate-400 font-light leading-relaxed mb-6">
                  {game.description}
                </p>
              </div>

              <div>
                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2.5 px-3 rounded-lg bg-black/30 border border-white/[0.05] mb-4 font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider block font-sans">Verified RTP</span>
                    <span className="text-slate-200 font-medium">{game.rtp}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider block font-sans">Max Potential</span>
                    <span className="text-[#f3e5ab] font-medium">{game.maxWin}</span>
                  </div>
                </div>

                {/* Enter Button */}
                <button
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.03] group-hover:bg-[#d4af37] group-hover:text-[#090a0f] text-slate-300 font-semibold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-1.5 border border-white/[0.08] group-hover:border-[#d4af37]"
                >
                  <span>Enter Table</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refined Trust Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/[0.06]">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Instant Wallet Liquidity</h4>
            <p className="text-xs text-slate-400 font-light mt-0.5 leading-relaxed">
              Every payout reflects directly in your balance for uninterrupted wagering across all tables.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Cryptographic Verification</h4>
            <p className="text-xs text-slate-400 font-light mt-0.5 leading-relaxed">
              Every round is pre-determined with verifiable client & server SHA-256 hashes for total transparency.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Complimentary Demo Top-Ups</h4>
            <p className="text-xs text-slate-400 font-light mt-0.5 leading-relaxed">
              Risk-free entertainment. Refill ₹500 demo credits with a single tap whenever you wish.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
