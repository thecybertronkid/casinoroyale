import React, { useState, useRef, useCallback } from 'react';
import { useWallet } from '../../context/WalletContext';
import { sound } from '../../utils/sound';
import { getRiskPenalty } from '../../utils/oddsModifier';
import { 
  RotateCw, 
  Crown, 
  HelpCircle,
  Square,
  AlertTriangle
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

const REEL_STRIP: SymbolDef[] = [
  SYMBOLS[0],
  SYMBOLS[1], SYMBOLS[1],
  SYMBOLS[2], SYMBOLS[2], SYMBOLS[2],
  SYMBOLS[3], SYMBOLS[3], SYMBOLS[3], SYMBOLS[3],
  SYMBOLS[4], SYMBOLS[4], SYMBOLS[4], SYMBOLS[4],
  SYMBOLS[5], SYMBOLS[5], SYMBOLS[5], SYMBOLS[5], SYMBOLS[5],
  SYMBOLS[6], SYMBOLS[6], SYMBOLS[6], SYMBOLS[6], SYMBOLS[6], SYMBOLS[6],
  SYMBOLS[7], SYMBOLS[7], SYMBOLS[7], SYMBOLS[7], SYMBOLS[7], SYMBOLS[7], SYMBOLS[7],
];

const PAYLINES = [
  { id: 1, name: 'Middle', points: [[0, 1], [1, 1], [2, 1]] },
  { id: 2, name: 'Top', points: [[0, 0], [1, 0], [2, 0]] },
  { id: 3, name: 'Bottom', points: [[0, 2], [1, 2], [2, 2]] },
  { id: 4, name: 'Diagonal ↘', points: [[0, 0], [1, 1], [2, 2]] },
  { id: 5, name: 'Diagonal ↗', points: [[0, 2], [1, 1], [2, 0]] },
];

export const SlotsGame: React.FC = () => {
  const { balance, placeBet, creditWinnings, recordLoss } = useWallet();

  const [betAmount, setBetAmount] = useState<number>(20);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [reels, setReels] = useState<SymbolDef[][]>([
    [SYMBOLS[1], SYMBOLS[0], SYMBOLS[3]],
    [SYMBOLS[2], SYMBOLS[0], SYMBOLS[4]],
    [SYMBOLS[5], SYMBOLS[0], SYMBOLS[6]],
  ]);
  const [activePaylineWins, setActivePaylineWins] = useState<number[]>([]);
  const [winningCoords, setWinningCoords] = useState<string[]>([]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [autoSpinsRemaining, setAutoSpinsRemaining] = useState<number>(0);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);
  const [spinningReelIndex, setSpinningReelIndex] = useState<boolean[]>([false, false, false]);

  const autoSpinRef = useRef<number>(0);
  autoSpinRef.current = autoSpinsRemaining;

  const getRandomSymbol = () => {
    return REEL_STRIP[Math.floor(Math.random() * REEL_STRIP.length)];
  };

  const riskPenalty = getRiskPenalty(betAmount);

  const spin = useCallback(() => {
    if (isSpinning) return;
    if (balance < betAmount) {
      setAutoSpinsRemaining(0);
      placeBet(betAmount, 'slots');
      return;
    }

    const deducted = placeBet(betAmount, 'slots');
    if (!deducted) return;

    setIsSpinning(true);
    setActivePaylineWins([]);
    setWinningCoords([]);
    setLastWin(null);
    setSpinningReelIndex([true, true, true]);

    let tickCount = 0;
    const tickInterval = setInterval(() => {
      sound.playTick(1 + (tickCount % 4) * 0.15);
      tickCount++;
      setReels([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ]);
    }, 75);

    let finalGrid: SymbolDef[][] = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    ];

    // Dynamic Odds Scaling: Higher bet = reduced odds of winning paylines
    const penalty = getRiskPenalty(betAmount);
    if (Math.random() < penalty) {
      // If higher bet, disrupt potential paylines by replacing column 2 symbols with non-matching ones
      finalGrid[2][0] = SYMBOLS[6]; // Lemon
      finalGrid[2][1] = SYMBOLS[5]; // Grape
      finalGrid[2][2] = SYMBOLS[7]; // Cherry
    }

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
    const winningPoints = new Set<string>();
    const lineBet = betAmount / PAYLINES.length;

    PAYLINES.forEach((line) => {
      const s0 = grid[line.points[0][0]][line.points[0][1]];
      const s1 = grid[line.points[1][0]][line.points[1][1]];
      const s2 = grid[line.points[2][0]][line.points[2][1]];

      const isWildMatch = (sym: SymbolDef, target: SymbolDef) => {
        return sym.id === target.id || sym.id === 'diamond' || target.id === 'diamond';
      };

      let matchedSymbol: SymbolDef | null = null;
      if (s0.id === s1.id && s1.id === s2.id) {
        matchedSymbol = s0;
      } else if (isWildMatch(s0, s1) && isWildMatch(s1, s2)) {
        matchedSymbol = s0.id !== 'diamond' ? s0 : (s1.id !== 'diamond' ? s1 : s2);
      }

      if (matchedSymbol) {
        totalMultiplier += matchedSymbol.multiplier;
        winningLines.push(line.id);
        line.points.forEach((p) => winningPoints.add(`${p[0]}-${p[1]}`));
      } else if (
        (s0.id === 'cherry' && s1.id === 'cherry') ||
        (s1.id === 'cherry' && s2.id === 'cherry')
      ) {
        totalMultiplier += 1.5;
        winningLines.push(line.id);
        line.points.forEach((p) => winningPoints.add(`${p[0]}-${p[1]}`));
      }
    });

    if (winningLines.length > 0) {
      setActivePaylineWins(winningLines);
      setWinningCoords(Array.from(winningPoints));
      const totalPayout = Math.round((lineBet * totalMultiplier) * 100) / 100;
      const effectiveMultiplier = totalPayout / betAmount;
      setLastWin(totalPayout);

      creditWinnings(
        'slots',
        'Crown 777 Slots',
        betAmount,
        totalPayout,
        effectiveMultiplier,
        `Hit ${winningLines.length} Payline(s)! Multiplier ${effectiveMultiplier.toFixed(2)}x`
      );
    } else {
      recordLoss('slots', 'Crown 777 Slots', betAmount, 'No matching paylines.');
    }

    if (autoSpinRef.current > 1) {
      setAutoSpinsRemaining((prev) => prev - 1);
      setTimeout(() => {
        spin();
      }, 650);
    } else {
      setAutoSpinsRemaining(0);
    }
  };

  const handleBetChange = (delta: number) => {
    setBetAmount((prev) => {
      const next = Math.max(5, Math.min(balance > 0 ? balance : 500, prev + delta));
      return Math.round(next);
    });
  };

  const startAutoSpin = (count: number) => {
    if (autoSpinsRemaining > 0) {
      setAutoSpinsRemaining(0);
      return;
    }
    setAutoSpinsRemaining(count);
    if (!isSpinning) {
      spin();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-[#0e1017] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.06] mb-6">
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

        {/* Dynamic Risk Curve Badge */}
        <div className="mb-4 flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.05] text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-[#d4af37]" />
            High-Stakes House Odds:
          </span>
          <span className={`font-mono font-medium ${
            riskPenalty > 0.4 ? 'text-rose-400' : riskPenalty > 0.15 ? 'text-amber-300' : 'text-emerald-400'
          }`}>
            {riskPenalty > 0.4 ? 'Strict High-Roller Edge (-40% Win Odds)' : riskPenalty > 0.15 ? 'Elevated Stake Edge (-20% Win Odds)' : 'Standard Odds (Base Edge)'}
          </span>
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
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Bet:</span>
            <div className="flex items-center bg-[#0a0b10] border border-white/10 rounded-xl p-1">
              <button
                disabled={isSpinning || betAmount <= 5}
                onClick={() => handleBetChange(-10)}
                className="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold disabled:opacity-30 transition flex items-center justify-center text-xs active:scale-90"
              >
                -
              </button>
              <div className="px-3 min-w-[65px] text-center font-mono font-semibold text-[#f3e5ab] text-sm">
                ₹{betAmount}
              </div>
              <button
                disabled={isSpinning || betAmount >= balance}
                onClick={() => handleBetChange(10)}
                className="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold disabled:opacity-30 transition flex items-center justify-center text-xs active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {autoSpinsRemaining > 0 ? (
              <button
                onClick={() => setAutoSpinsRemaining(0)}
                className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-rose-400 font-medium text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop ({autoSpinsRemaining})</span>
              </button>
            ) : (
              <button
                disabled={isSpinning}
                onClick={() => startAutoSpin(10)}
                className="px-3.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/10 transition disabled:opacity-30 flex items-center gap-1.5 active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Auto 10</span>
              </button>
            )}

            <button
              disabled={isSpinning || balance < betAmount}
              onClick={spin}
              className={`flex-1 sm:flex-initial px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
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
