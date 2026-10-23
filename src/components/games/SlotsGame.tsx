import React, { useState, useRef, useCallback } from 'react';
import { useWallet } from '../../context/WalletContext';
import { sound } from '../../utils/sound';
import { generateEngineeredSlotsGrid, getDisplayedOdds } from '../../utils/oddsModifier';
import { 
  RotateCw, 
  Crown, 
  HelpCircle,
  Square,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface SymbolDef {
  id: string;
  label: string;
  icon: string;
  multiplier: number;
}

const SYMBOLS: SymbolDef[] = [
  { id: 'diamond', label: 'Diamond', icon: '💎', multiplier: 100 },
  { id: 'crown', label: 'Golden Crown', icon: '👑', multiplier: 50 },
  { id: 'seven', label: 'Lucky 7', icon: '7️⃣', multiplier: 30 },
  { id: 'bell', label: 'Bell', icon: '🔔', multiplier: 15 },
  { id: 'clover', label: 'Clover', icon: '🍀', multiplier: 10 },
  { id: 'grape', label: 'Grapes', icon: '🍇', multiplier: 6 },
  { id: 'lemon', label: 'Lemon', icon: '🍋', multiplier: 4 },
  { id: 'cherry', label: 'Cherry', icon: '🍒', multiplier: 3 },
];

const PAYLINES = [
  { id: 1, name: 'Center Row', coords: [[0, 1], [1, 1], [2, 1]] },
  { id: 2, name: 'Top Row', coords: [[0, 0], [1, 0], [2, 0]] },
  { id: 3, name: 'Bottom Row', coords: [[0, 2], [1, 2], [2, 2]] },
  { id: 4, name: 'V-Diagonal', coords: [[0, 0], [1, 1], [2, 2]] },
  { id: 5, name: 'Inverted V', coords: [[0, 2], [1, 1], [2, 0]] },
];

export const SlotsGame: React.FC = () => {
  const { balance, placeBet, creditWinnings, recordLoss } = useWallet();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [reels, setReels] = useState<SymbolDef[][]>([
    [SYMBOLS[1], SYMBOLS[2], SYMBOLS[3]],
    [SYMBOLS[2], SYMBOLS[1], SYMBOLS[4]],
    [SYMBOLS[3], SYMBOLS[4], SYMBOLS[1]],
  ]);
  const [spinningReelIndex, setSpinningReelIndex] = useState<boolean[]>([false, false, false]);
  const [winningCoords, setWinningCoords] = useState<string[]>([]);
  const [activePaylineWins, setActivePaylineWins] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [autoSpinsRemaining, setAutoSpinsRemaining] = useState<number>(0);

  const autoSpinRef = useRef<number>(0);
  autoSpinRef.current = autoSpinsRemaining;

  const getRandomSymbol = (): SymbolDef => {
    const weights = [1, 2, 4, 8, 12, 16, 25, 32];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      if (rand < weights[i]) return SYMBOLS[i];
      rand -= weights[i];
    }
    return SYMBOLS[SYMBOLS.length - 1];
  };

  const handleBetChange = (delta: number) => {
    if (isSpinning) return;
    setBetAmount((prev) => {
      const next = prev + delta;
      if (next < 5) return 5;
      if (next > balance && balance > 0) return balance;
      return next;
    });
  };

  const displayedOdds = getDisplayedOdds(betAmount);

  const spin = useCallback(() => {
    if (isSpinning || balance < betAmount) return;

    const ok = placeBet(betAmount, 'slots');
    if (!ok) {
      setAutoSpinsRemaining(0);
      return;
    }

    setIsSpinning(true);
    setWinningCoords([]);
    setActivePaylineWins([]);
    setLastWin(null);
    setSpinningReelIndex([true, true, true]);
    sound.playTick();

    const tickInterval = setInterval(() => {
      setReels([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ]);
    }, 75);

    // Sequence engine: Draw 1 & 2 win more money, Draw 3 reclaims, subsequent high bets face deficit
    const finalGrid = generateEngineeredSlotsGrid(betAmount, SYMBOLS, getRandomSymbol);

    setTimeout(() => {
      setSpinningReelIndex([false, true, true]);
      sound.playChip();
    }, 600);

    setTimeout(() => {
      setSpinningReelIndex([false, false, true]);
      sound.playChip();
    }, 950);

    setTimeout(() => {
      clearInterval(tickInterval);
      setSpinningReelIndex([false, false, false]);
      setReels(finalGrid);
      setIsSpinning(false);
      evaluateSlotOutcome(finalGrid);
    }, 1300);
  }, [balance, betAmount, isSpinning, placeBet]);

  const evaluateSlotOutcome = (grid: SymbolDef[][]) => {
    let totalMultiplier = 0;
    const winningLines: number[] = [];
    const matchedCoords: string[] = [];

    PAYLINES.forEach((pl) => {
      const s1 = grid[pl.coords[0][0]][pl.coords[0][1]];
      const s2 = grid[pl.coords[1][0]][pl.coords[1][1]];
      const s3 = grid[pl.coords[2][0]][pl.coords[2][1]];

      if (s1.id === s2.id && s2.id === s3.id) {
        totalMultiplier += s1.multiplier;
        winningLines.push(pl.id);
        pl.coords.forEach((coord) => {
          matchedCoords.push(`${coord[0]}-${coord[1]}`);
        });
      }
    });

    setWinningCoords(matchedCoords);
    setActivePaylineWins(winningLines);

    if (totalMultiplier > 0) {
      const payout = Math.round(betAmount * totalMultiplier * 100) / 100;
      setLastWin(payout);
      creditWinnings(
        'slots',
        'Crown 777 Slots',
        betAmount,
        payout,
        totalMultiplier,
        `${winningLines.length} Payline(s) Hit (${totalMultiplier}x)`
      );
    } else {
      setLastWin(0);
      recordLoss('slots', 'Crown 777 Slots', betAmount, 'No matching lines');
    }

    if (autoSpinRef.current > 0) {
      setTimeout(() => {
        setAutoSpinsRemaining((prev) => {
          if (prev <= 1) return 0;
          spin();
          return prev - 1;
        });
      }, 900);
    }
  };

  const startAutoSpin = (count: number) => {
    setAutoSpinsRemaining(count);
    spin();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#0e1017] border border-white/[0.08] rounded-2xl p-4 sm:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#d4af37]">
              <Crown className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="font-luxury text-xl font-bold text-white tracking-wide">
                CROWN 777 SLOTS
              </h2>
              <p className="text-xs text-slate-400 font-light">
                5 Classic Paylines • High-Roller Multipliers
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#d4af37]/40 text-xs text-slate-300 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Paytable</span>
          </button>
        </div>

        {/* Displayed Odds: Shows higher bet -> higher winning probability */}
        <div className={`mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] transition-all duration-300 ${displayedOdds.glowClass}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            <span className="text-slate-300 font-medium">Reel Hit Frequency:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className={`font-mono font-semibold ${displayedOdds.themeColor}`}>
              {displayedOdds.badgeText}
            </span>
          </div>
        </div>

        {/* Minimalist Paytable Dropdown */}
        {showPaytable && (
          <div className="mb-6 p-4 rounded-xl bg-[#090a0f] border border-[#d4af37]/25 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-3 border-b border-white/[0.08] pb-2">
              <span className="font-semibold text-[#f3e5ab] text-xs uppercase tracking-wider">
                Payout Matrix (3-of-a-Kind)
              </span>
              <button onClick={() => setShowPaytable(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SYMBOLS.map((s) => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <div className="text-slate-200 text-[11px] font-medium">{s.label}</div>
                    <div className="text-[#f3e5ab] font-mono font-semibold">{s.multiplier}x</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Machine Housing with 3D Spring Motion */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0a0b10] border border-white/[0.08] max-w-md mx-auto shadow-inner">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/40 border border-white/[0.05] mb-3 text-xs">
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-medium">Top Jackpot</span>
            <span className="font-mono font-bold text-[#f3e5ab]">₹{(betAmount * 100).toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center px-1 mb-2">
            {PAYLINES.map((pl) => (
              <span
                key={pl.id}
                className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded transition-all duration-300 ${
                  activePaylineWins.includes(pl.id)
                    ? 'bg-[#d4af37] text-[#090a0f] font-bold shadow-md shadow-[#d4af37]/30 scale-105'
                    : 'text-slate-500 bg-white/[0.02] border border-white/[0.04]'
                }`}
              >
                Line {pl.id}
              </span>
            ))}
          </div>

          {/* Slot Reels Container */}
          <div className="relative grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-black/60 border border-white/[0.06] overflow-hidden">
            {[0, 1, 2].map((colIdx) => {
              const isColSpinning = spinningReelIndex[colIdx];
              return (
                <div
                  key={colIdx}
                  className={`flex flex-col gap-2 p-1 rounded-lg bg-[#0e1017] border border-white/[0.04] transition-all duration-200 ${
                    isColSpinning ? 'filter blur-[0.6px] translate-y-0.5 scale-[0.99]' : ''
                  }`}
                >
                  {[0, 1, 2].map((rowIdx) => {
                    const symbol = reels[colIdx][rowIdx] || SYMBOLS[7];
                    const isWinning = winningCoords.includes(`${colIdx}-${rowIdx}`);
                    return (
                      <div
                        key={rowIdx}
                        className={`h-16 sm:h-20 flex items-center justify-center rounded-lg border transition-all duration-300 ${
                          isWinning
                            ? 'bg-[#d4af37]/15 border-[#d4af37] scale-[1.04] animate-win-pulse'
                            : 'bg-white/[0.02] border-white/[0.03]'
                        }`}
                      >
                        <span className={`text-3xl sm:text-4xl select-none transition-transform duration-200 ${
                          isWinning ? 'scale-110 drop-shadow-md' : ''
                        }`}>
                          {symbol.icon}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {lastWin !== null && lastWin > 0 && (
            <div className="mt-3 py-2 px-3 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 text-center animate-in zoom-in-95 duration-200">
              <span className="text-xs uppercase font-semibold text-[#f3e5ab] tracking-wider">
                Payout: ₹{lastWin.toFixed(2)} Credited Instantly
              </span>
            </div>
          )}
        </div>

        {/* Minimalist Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2">
            <span className="text-xs text-slate-400 font-medium">Bet:</span>
            <div className="flex items-center bg-[#0a0b10] border border-white/10 rounded-xl p-1">
              <button
                disabled={isSpinning || betAmount <= 5}
                onClick={() => handleBetChange(-10)}
                className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold disabled:opacity-30 transition flex items-center justify-center text-xs active:scale-90"
              >
                -
              </button>
              <div className="px-3 min-w-[65px] text-center font-mono font-semibold text-[#f3e5ab] text-sm">
                ₹{betAmount}
              </div>
              <button
                disabled={isSpinning || betAmount >= balance}
                onClick={() => handleBetChange(10)}
                className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold disabled:opacity-30 transition flex items-center justify-center text-xs active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {autoSpinsRemaining > 0 ? (
              <button
                onClick={() => setAutoSpinsRemaining(0)}
                className="flex-1 sm:flex-initial px-4 py-3 sm:py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-rose-400 font-medium text-xs flex items-center justify-center gap-1.5 transition active:scale-95 min-h-[44px]"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop ({autoSpinsRemaining})</span>
              </button>
            ) : (
              <button
                disabled={isSpinning}
                onClick={() => startAutoSpin(10)}
                className="flex-1 sm:flex-initial px-4 py-3 sm:py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/10 transition disabled:opacity-30 flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Auto 10</span>
              </button>
            )}

            <button
              disabled={isSpinning || balance < betAmount}
              onClick={spin}
              className={`flex-[2] sm:flex-initial px-8 py-3 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 min-h-[44px] flex items-center justify-center ${
                isSpinning
                  ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                  : 'gold-gradient-btn'
              }`}
            >
              {isSpinning ? 'Spinning...' : 'Spin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
