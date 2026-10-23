import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { sound } from '../../utils/sound';
import { getEngineeredDiceRoll, getDisplayedOdds } from '../../utils/oddsModifier';
import { 
  Dice5, 
  ArrowLeftRight, 
  Sparkles,
  TrendingUp
} from 'lucide-react';

export const DiceGame: React.FC = () => {
  const { balance, placeBet, creditWinnings, recordLoss } = useWallet();

  const [betAmount, setBetAmount] = useState<number>(25);
  const [targetNumber, setTargetNumber] = useState<number>(50.0);
  const [rollMode, setRollMode] = useState<'under' | 'over'>('under');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rolledNumber, setRolledNumber] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);

  const winChance = rollMode === 'under' ? targetNumber : Math.round((100 - targetNumber) * 100) / 100;
  const multiplier = Math.max(1.01, Math.round((99 / winChance) * 100) / 100);
  const potentialProfit = Math.round((betAmount * multiplier - betAmount) * 100) / 100;

  const rollDice = () => {
    if (isRolling) return;
    if (balance < betAmount) {
      placeBet(betAmount, 'dice');
      return;
    }

    const deducted = placeBet(betAmount, 'dice');
    if (!deducted) return;

    setIsRolling(true);
    setRolledNumber(null);
    setLastWin(null);
    sound.playDice();

    let ticks = 0;
    const interval = setInterval(() => {
      setRolledNumber(Math.round(Math.random() * 10000) / 100);
      ticks++;
      if (ticks > 6) {
        clearInterval(interval);
        // Sequence engine: Draw 1 & 2 win more money, Draw 3 reclaims, subsequent high bets face deficit
        const finalRoll = getEngineeredDiceRoll(betAmount, targetNumber, rollMode);

        setRolledNumber(finalRoll);
        setIsRolling(false);

        const won = rollMode === 'under' ? finalRoll < targetNumber : finalRoll > targetNumber;
        setLastWin(won);

        if (won) {
          const totalPayout = Math.round(betAmount * multiplier * 100) / 100;
          creditWinnings(
            'dice',
            'Prestige Dice',
            betAmount,
            totalPayout,
            multiplier,
            `Rolled ${finalRoll.toFixed(2)} (${rollMode === 'under' ? '<' : '>'} ${targetNumber.toFixed(2)})`
          );
        } else {
          recordLoss(
            'dice',
            'Prestige Dice',
            betAmount,
            `Rolled ${finalRoll.toFixed(2)} (${rollMode === 'under' ? '≥' : '≤'} ${targetNumber.toFixed(2)})`
          );
        }
      }
    }, 75);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-[#0e1017] border border-white/[0.08] rounded-2xl p-4 sm:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#d4af37] ${isRolling ? 'animate-bounce' : ''}`}>
              <Dice5 className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="font-luxury text-xl font-bold text-white tracking-wide">
                PRESTIGE DICE
              </h2>
              <p className="text-xs text-slate-400 font-light">
                Provably Fair • 99% Theoretical Return
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Net Profit</span>
            <span className="font-mono text-sm font-semibold text-emerald-400">
              +₹{potentialProfit.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Displayed Odds: Shows higher bet -> higher winning probability */}
        {(() => {
          const displayedOdds = getDisplayedOdds(betAmount);
          return (
            <div className={`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] transition-all duration-300 ${displayedOdds.glowClass}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="text-slate-300 font-medium">Roll Advantage Algorithm:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className={`font-mono font-semibold ${displayedOdds.themeColor}`}>
                  {displayedOdds.badgeText}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Center Display & Range */}
        <div className="p-4 sm:p-6 rounded-xl bg-[#0a0b10] border border-white/[0.06] space-y-6">
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium block mb-1">
              {isRolling ? 'Generating Roll...' : 'Result'}
            </span>
            <div className={`text-5xl sm:text-6xl font-bold font-mono transition-all duration-150 ${
              lastWin === true
                ? 'text-emerald-400 scale-105'
                : lastWin === false
                ? 'text-rose-400 animate-shake'
                : 'text-white'
            }`}>
              {rolledNumber !== null ? rolledNumber.toFixed(2) : targetNumber.toFixed(2)}
            </div>
          </div>

          {/* Interactive Range Slider with Result Indicator Needle */}
          <div className="space-y-2 px-2 relative">
            <div className="relative pt-6">
              {rolledNumber !== null && !isRolling && (
                <div 
                  className="absolute -top-1 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300 z-10"
                  style={{ left: `${Math.min(98, Math.max(2, rolledNumber))}%` }}
                >
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow ${
                    lastWin ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                  }`}>
                    {rolledNumber.toFixed(2)}
                  </span>
                  <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${
                    lastWin ? 'border-t-emerald-500' : 'border-t-rose-500'
                  }`} />
                </div>
              )}

              <input
                type="range"
                min="2"
                max="98"
                step="1"
                disabled={isRolling}
                value={targetNumber}
                onChange={(e) => setTargetNumber(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-[#171a26] rounded-lg appearance-none cursor-pointer accent-[#d4af37] transition-all"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-black/40 border border-white/[0.04] text-center font-mono">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-sans block">Multiplier</span>
              <span className="text-sm font-semibold text-[#f3e5ab]">{multiplier.toFixed(2)}x</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-sans block">Target</span>
              <button
                onClick={() => setRollMode((m) => (m === 'under' ? 'over' : 'under'))}
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-200 hover:text-[#d4af37] transition active:scale-95"
              >
                <span>{rollMode === 'under' ? `< ${targetNumber}` : `> ${targetNumber}`}</span>
                <ArrowLeftRight className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-sans block">Win Chance</span>
              <span className="text-sm font-semibold text-emerald-400">{winChance.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2">
            <span className="text-xs text-slate-400 font-medium">Bet:</span>
            <div className="flex items-center bg-[#0a0b10] border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setBetAmount((p) => Math.max(5, p - 10))}
                className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold transition flex items-center justify-center text-xs active:scale-90"
              >
                -
              </button>
              <div className="px-3 min-w-[65px] text-center font-mono font-semibold text-[#f3e5ab] text-sm">
                ₹{betAmount}
              </div>
              <button
                onClick={() => setBetAmount((p) => Math.min(balance > 0 ? balance : 500, p + 10))}
                className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold transition flex items-center justify-center text-xs active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <button
            disabled={isRolling || balance < betAmount}
            onClick={rollDice}
            className={`w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 min-h-[44px] flex items-center justify-center ${
              isRolling ? 'bg-white/10 text-slate-500' : 'gold-gradient-btn'
            }`}
          >
            {isRolling ? 'Rolling...' : `Roll Dice (₹${betAmount})`}
          </button>
        </div>
      </div>
    </div>
  );
};
