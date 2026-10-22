import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { sound } from '../../utils/sound';
import { getRiskPenalty, getDisplayedOdds } from '../../utils/oddsModifier';
import { 
  CircleDot, 
  RotateCw, 
  Trash2, 
  Repeat, 
  Sparkles,
  TrendingUp
} from 'lucide-react';

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

const CHIP_VALUES = [5, 10, 25, 50, 100, 250];

interface BetMap {
  [key: string]: number;
}

export const RouletteGame: React.FC = () => {
  const { balance, placeBet, creditWinnings, recordLoss } = useWallet();

  const [selectedChip, setSelectedChip] = useState<number>(10);
  const [bets, setBets] = useState<BetMap>({});
  const [lastBets, setLastBets] = useState<BetMap>({});
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [historyNumbers, setHistoryNumbers] = useState<number[]>([17, 32, 0, 7, 24]);
  const [lastPayout, setLastPayout] = useState<number | null>(null);
  const [hoveredBetZone, setHoveredBetZone] = useState<string | null>(null);

  const totalBetAmount = Object.values(bets).reduce((a, b) => a + b, 0);

  const getNumberColor = (num: number) => {
    if (num === 0) return 'green';
    return RED_NUMBERS.has(num) ? 'red' : 'black';
  };

  const isNumberCoveredByHover = (num: number): boolean => {
    if (!hoveredBetZone) return false;
    if (hoveredBetZone === 'red') return RED_NUMBERS.has(num);
    if (hoveredBetZone === 'black') return num !== 0 && !RED_NUMBERS.has(num);
    if (hoveredBetZone === 'even') return num !== 0 && num % 2 === 0;
    if (hoveredBetZone === 'odd') return num !== 0 && num % 2 !== 0;
    if (hoveredBetZone === 'low') return num >= 1 && num <= 18;
    if (hoveredBetZone === 'high') return num >= 19 && num <= 36;
    if (hoveredBetZone === 'doz-1') return num >= 1 && num <= 12;
    if (hoveredBetZone === 'doz-2') return num >= 13 && num <= 24;
    if (hoveredBetZone === 'doz-3') return num >= 25 && num <= 36;
    if (hoveredBetZone === 'col-1') return num > 0 && num % 3 === 1;
    if (hoveredBetZone === 'col-2') return num > 0 && num % 3 === 2;
    if (hoveredBetZone === 'col-3') return num > 0 && num % 3 === 0;
    return false;
  };

  const addBet = (key: string) => {
    if (isSpinning) return;
    if (balance < (totalBetAmount + selectedChip)) {
      placeBet(selectedChip, 'roulette');
      return;
    }
    sound.playChip();
    setBets((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + selectedChip,
    }));
  };

  const clearBets = () => {
    if (isSpinning) return;
    sound.playChip();
    setBets({});
  };

  const doubleBets = () => {
    if (isSpinning) return;
    if (totalBetAmount === 0) return;
    if (balance < totalBetAmount * 2) return;
    sound.playChip();
    setBets((prev) => {
      const next: BetMap = {};
      Object.keys(prev).forEach((k) => {
        next[k] = prev[k] * 2;
      });
      return next;
    });
  };

  const rebetPrevious = () => {
    if (isSpinning) return;
    if (Object.keys(lastBets).length === 0) return;
    const prevTotal = Object.values(lastBets).reduce((a, b) => a + b, 0);
    if (balance < prevTotal) return;
    sound.playChip();
    setBets({ ...lastBets });
  };

  const doesNumberWin = (winNum: number, activeBets: BetMap): boolean => {
    const isRed = RED_NUMBERS.has(winNum);
    const isEven = winNum !== 0 && winNum % 2 === 0;
    const isOdd = winNum !== 0 && winNum % 2 !== 0;
    const isLow = winNum >= 1 && winNum <= 18;
    const isHigh = winNum >= 19 && winNum <= 36;
    const isDoz1 = winNum >= 1 && winNum <= 12;
    const isDoz2 = winNum >= 13 && winNum <= 24;
    const isDoz3 = winNum >= 25 && winNum <= 36;
    const isCol1 = winNum > 0 && winNum % 3 === 1;
    const isCol2 = winNum > 0 && winNum % 3 === 2;
    const isCol3 = winNum > 0 && winNum % 3 === 0;

    if (activeBets[`num-${winNum}`]) return true;
    if (isRed && activeBets['red']) return true;
    if (!isRed && winNum !== 0 && activeBets['black']) return true;
    if (isEven && activeBets['even']) return true;
    if (isOdd && activeBets['odd']) return true;
    if (isLow && activeBets['low']) return true;
    if (isHigh && activeBets['high']) return true;
    if (isDoz1 && activeBets['doz-1']) return true;
    if (isDoz2 && activeBets['doz-2']) return true;
    if (isDoz3 && activeBets['doz-3']) return true;
    if (isCol1 && activeBets['col-1']) return true;
    if (isCol2 && activeBets['col-2']) return true;
    if (isCol3 && activeBets['col-3']) return true;
    return false;
  };

  const spinWheel = () => {
    if (isSpinning) return;
    if (totalBetAmount <= 0) return;

    const deducted = placeBet(totalBetAmount, 'roulette');
    if (!deducted) return;

    setIsSpinning(true);
    setWinningNumber(null);
    setLastPayout(null);
    setLastBets({ ...bets });

    // Initial roll
    let winNum = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];

    // Dynamic Odds Scaling: Higher bet = reduced odds of winning
    const penalty = getRiskPenalty(totalBetAmount);
    if (doesNumberWin(winNum, bets) && Math.random() < penalty) {
      // Find a losing number on the wheel
      const losingNumbers = ROULETTE_NUMBERS.filter((n) => !doesNumberWin(n, bets));
      if (losingNumbers.length > 0) {
        winNum = losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
      }
    }

    const winIndex = ROULETTE_NUMBERS.indexOf(winNum);
    const pocketAngle = 360 / 37;
    const targetAngle = 1800 + (37 - winIndex) * pocketAngle + Math.random() * 4 - 2;

    setWheelRotation((prev) => prev + targetAngle);

    let tickCount = 0;
    const tickInterval = setInterval(() => {
      sound.playTick(1.2 - (tickCount / 30) * 0.5);
      tickCount++;
      if (tickCount > 35) {
        clearInterval(tickInterval);
      }
    }, 85);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setWinningNumber(winNum);
      setHistoryNumbers((prev) => [winNum, ...prev.slice(0, 9)]);
      evaluateRouletteOutcome(winNum, totalBetAmount, bets);
    }, 3800);
  };

  const evaluateRouletteOutcome = (winNum: number, wagered: number, activeBets: BetMap) => {
    let totalWin = 0;
    const isRed = RED_NUMBERS.has(winNum);
    const isEven = winNum !== 0 && winNum % 2 === 0;
    const isOdd = winNum !== 0 && winNum % 2 !== 0;
    const isLow = winNum >= 1 && winNum <= 18;
    const isHigh = winNum >= 19 && winNum <= 36;
    const isDoz1 = winNum >= 1 && winNum <= 12;
    const isDoz2 = winNum >= 13 && winNum <= 24;
    const isDoz3 = winNum >= 25 && winNum <= 36;
    const isCol1 = winNum > 0 && winNum % 3 === 1;
    const isCol2 = winNum > 0 && winNum % 3 === 2;
    const isCol3 = winNum > 0 && winNum % 3 === 0;

    if (activeBets[`num-${winNum}`]) totalWin += activeBets[`num-${winNum}`] * 36;
    if (isRed && activeBets['red']) totalWin += activeBets['red'] * 2;
    if (!isRed && winNum !== 0 && activeBets['black']) totalWin += activeBets['black'] * 2;
    if (isEven && activeBets['even']) totalWin += activeBets['even'] * 2;
    if (isOdd && activeBets['odd']) totalWin += activeBets['odd'] * 2;
    if (isLow && activeBets['low']) totalWin += activeBets['low'] * 2;
    if (isHigh && activeBets['high']) totalWin += activeBets['high'] * 2;

    if (isDoz1 && activeBets['doz-1']) totalWin += activeBets['doz-1'] * 3;
    if (isDoz2 && activeBets['doz-2']) totalWin += activeBets['doz-2'] * 3;
    if (isDoz3 && activeBets['doz-3']) totalWin += activeBets['doz-3'] * 3;
    if (isCol1 && activeBets['col-1']) totalWin += activeBets['col-1'] * 3;
    if (isCol2 && activeBets['col-2']) totalWin += activeBets['col-2'] * 3;
    if (isCol3 && activeBets['col-3']) totalWin += activeBets['col-3'] * 3;

    setLastPayout(totalWin);

    if (totalWin > 0) {
      const multiplier = totalWin / wagered;
      creditWinnings(
        'roulette',
        'European Roulette',
        wagered,
        totalWin,
        multiplier,
        `Ball landed on ${winNum} (${getNumberColor(winNum).toUpperCase()})`
      );
    } else {
      recordLoss(
        'roulette',
        'European Roulette',
        wagered,
        `Ball landed on ${winNum} (${getNumberColor(winNum).toUpperCase()})`
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-[#0e1017] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#d4af37]">
              <CircleDot className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="font-luxury text-xl font-bold text-white tracking-wide">
                EUROPEAN ROULETTE
              </h2>
              <p className="text-xs text-slate-400 font-light">
                Single Zero • Monte Carlo Table Rules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">History</span>
            {historyNumbers.map((num, i) => {
              const color = getNumberColor(num);
              const textColor = color === 'green' ? 'text-emerald-400' : color === 'red' ? 'text-rose-400' : 'text-slate-300';
              return (
                <span
                  key={i}
                  className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded transition-all duration-300 ${textColor} ${
                    i === 0 ? 'bg-white/10 font-bold text-[#f3e5ab] scale-105' : 'opacity-70'
                  }`}
                >
                  {num}
                </span>
              );
            })}
          </div>
        </div>

        {/* Displayed Odds: Shows higher bet -> higher winning probability */}
        {(() => {
          const displayedOdds = getDisplayedOdds(totalBetAmount > 0 ? totalBetAmount : selectedChip);
          return (
            <div className={`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] transition-all duration-300 ${displayedOdds.glowClass}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="text-slate-300 font-medium">Wheel Sector Advantage:</span>
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

        {/* Center: Wheel & Status Display */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-6">
          <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#d4af37]/30 bg-[#090a0f] p-2 flex items-center justify-center shadow-inner">
              <div
                className="w-full h-full rounded-full border border-white/10 relative flex items-center justify-center transition-transform duration-[3800ms] cubic-bezier(0.12, 0.8, 0.33, 1)"
                style={{ transform: `rotate(${wheelRotation}deg)` }}
              >
                <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
                  {ROULETTE_NUMBERS.map((num, idx) => {
                    const angle = (idx * 360) / 37;
                    const color = num === 0 ? '#10b981' : RED_NUMBERS.has(num) ? '#991b1b' : '#1e293b';
                    return (
                      <g key={idx} transform={`rotate(${angle} 50 50)`}>
                        <rect x="48" y="2" width="4" height="9" fill={color} rx="0.5" />
                      </g>
                    );
                  })}
                </svg>

                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#997d21] to-[#dfc46e] border border-[#f3e5ab]/40 flex items-center justify-center shadow-md z-10">
                  <div className="w-4 h-4 rounded-full bg-[#090a0f]" />
                </div>
              </div>
            </div>

            <div className="absolute top-0 z-20 flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-[#f3e5ab] rounded-full border border-white shadow-sm" />
            </div>

            {winningNumber !== null && !isSpinning && (
              <div className="absolute z-20 px-3 py-1.5 rounded-lg bg-[#090a0f]/95 border border-[#d4af37]/60 shadow-xl flex items-center gap-2 animate-in zoom-in-95 duration-200">
                <span className={`text-xs font-mono font-bold ${
                  getNumberColor(winningNumber) === 'green' ? 'text-emerald-400' : getNumberColor(winningNumber) === 'red' ? 'text-rose-400' : 'text-slate-200'
                }`}>
                  {winningNumber}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  {getNumberColor(winningNumber)}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full max-w-sm bg-[#0a0b10] border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.05] text-xs">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-medium">Status</span>
              <span className="font-mono font-medium text-[#f3e5ab]">Wager: ₹{totalBetAmount}</span>
            </div>

            <div className="py-2 text-center text-xs">
              {isSpinning ? (
                <div className="flex items-center justify-center gap-2 text-[#d4af37]">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span className="font-medium">Wheel in Motion...</span>
                </div>
              ) : lastPayout !== null ? (
                lastPayout > 0 ? (
                  <div className="text-emerald-400 font-mono text-sm font-semibold animate-in zoom-in-95">
                    Won +₹{lastPayout.toFixed(2)} Credited
                  </div>
                ) : (
                  <div className="text-slate-400">Round concluded. No winning bets.</div>
                )
              ) : (
                <div className="text-slate-400 font-light">Place chips on the felt layout below.</div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05]">
              <button
                disabled={isSpinning || totalBetAmount === 0}
                onClick={clearBets}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-white text-xs border border-white/5 disabled:opacity-30 transition flex items-center justify-center gap-1 active:scale-95"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
              <button
                disabled={isSpinning || totalBetAmount === 0 || balance < totalBetAmount * 2}
                onClick={doubleBets}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 text-xs border border-white/5 disabled:opacity-30 transition active:scale-95"
              >
                2x
              </button>
              <button
                disabled={isSpinning || Object.keys(lastBets).length === 0}
                onClick={rebetPrevious}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 text-xs border border-white/5 disabled:opacity-30 transition flex items-center justify-center gap-1 active:scale-95"
              >
                <Repeat className="w-3 h-3" />
                <span>Rebet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Felt Table */}
        <div className="p-4 rounded-xl bg-[#081711] border border-emerald-950/80 shadow-inner overflow-x-auto">
          <div className="min-w-[580px]">
            <div className="flex gap-1.5 mb-1.5">
              <button
                disabled={isSpinning}
                onClick={() => addBet('num-0')}
                className={`w-12 h-24 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/40 text-emerald-300 font-mono font-bold text-base flex flex-col items-center justify-center relative transition-all duration-200 ${
                  bets['num-0'] ? 'ring-1 ring-[#d4af37] bg-emerald-800' : ''
                } ${winningNumber === 0 && !isSpinning ? 'ring-2 ring-[#d4af37] animate-win-pulse' : ''}`}
              >
                0
                {bets['num-0'] && (
                  <span className="absolute bottom-1 px-1 rounded bg-[#d4af37] text-[#090a0f] text-[9px] font-bold animate-chip-drop">
                    ₹{bets['num-0']}
                  </span>
                )}
              </button>

              <div className="flex-1 grid grid-rows-3 grid-flow-col gap-1.5">
                {[...Array(36)].map((_, i) => {
                  const num = i + 1;
                  const isRed = RED_NUMBERS.has(num);
                  const key = `num-${num}`;
                  const hasBet = bets[key];
                  const isCovered = isNumberCoveredByHover(num);
                  const isWinner = winningNumber === num && !isSpinning;

                  return (
                    <button
                      key={num}
                      disabled={isSpinning}
                      onClick={() => addBet(key)}
                      className={`h-7 rounded flex items-center justify-center font-mono font-medium text-xs relative transition-all duration-200 border ${
                        isWinner
                          ? 'ring-2 ring-[#d4af37] bg-[#d4af37]/30 text-white font-bold animate-win-pulse scale-[1.05] z-10'
                          : isCovered
                          ? 'ring-1 ring-[#d4af37]/70 bg-white/10 text-white scale-[1.02]'
                          : isRed
                          ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border-rose-800/30'
                          : 'bg-black/50 hover:bg-black/80 text-slate-300 border-white/10'
                      } ${hasBet && !isWinner ? 'ring-1 ring-[#d4af37] text-white font-bold' : ''}`}
                    >
                      {num}
                      {hasBet && (
                        <span className="absolute -top-1 -right-1 px-1 rounded bg-[#d4af37] text-[#090a0f] text-[8px] font-bold animate-chip-drop">
                          ₹{hasBet}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="w-10 flex flex-col gap-1.5 justify-between">
                {[1, 2, 3].map((col) => {
                  const key = `col-${col}`;
                  const hasBet = bets[key];
                  return (
                    <button
                      key={col}
                      disabled={isSpinning}
                      onMouseEnter={() => setHoveredBetZone(key)}
                      onMouseLeave={() => setHoveredBetZone(null)}
                      onClick={() => addBet(key)}
                      className={`h-7 rounded bg-black/40 hover:bg-black/60 border border-white/10 text-slate-400 font-mono text-[10px] relative transition-all flex items-center justify-center ${
                        hasBet ? 'ring-1 ring-[#d4af37] text-[#f3e5ab]' : ''
                      }`}
                    >
                      2:1
                      {hasBet && (
                        <span className="absolute -top-1 -right-1 px-1 rounded bg-[#d4af37] text-[#090a0f] text-[8px] font-bold animate-chip-drop">
                          ₹{hasBet}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-1.5 ml-[54px] mr-[46px]">
              {[
                { key: 'doz-1', label: '1st 12' },
                { key: 'doz-2', label: '2nd 12' },
                { key: 'doz-3', label: '3rd 12' },
              ].map((doz) => {
                const hasBet = bets[doz.key];
                return (
                  <button
                    key={doz.key}
                    disabled={isSpinning}
                    onMouseEnter={() => setHoveredBetZone(doz.key)}
                    onMouseLeave={() => setHoveredBetZone(null)}
                    onClick={() => addBet(doz.key)}
                    className={`py-1.5 rounded bg-black/35 hover:bg-black/60 border border-white/10 text-slate-300 text-[11px] font-medium relative transition-all ${
                      hasBet ? 'ring-1 ring-[#d4af37] text-[#f3e5ab]' : ''
                    }`}
                  >
                    {doz.label} (2:1)
                    {hasBet && (
                      <span className="absolute -top-1 -right-1 px-1 rounded bg-[#d4af37] text-[#090a0f] text-[8px] font-bold animate-chip-drop">
                        ₹{hasBet}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-6 gap-1.5 ml-[54px] mr-[46px]">
              {[
                { key: 'low', label: '1 - 18' },
                { key: 'even', label: 'EVEN' },
                { key: 'red', label: 'RED', isColor: 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300' },
                { key: 'black', label: 'BLACK', isColor: 'bg-black/60 hover:bg-black/80 text-slate-300' },
                { key: 'odd', label: 'ODD' },
                { key: 'high', label: '19 - 36' },
              ].map((item) => {
                const hasBet = bets[item.key];
                return (
                  <button
                    key={item.key}
                    disabled={isSpinning}
                    onMouseEnter={() => setHoveredBetZone(item.key)}
                    onMouseLeave={() => setHoveredBetZone(null)}
                    onClick={() => addBet(item.key)}
                    className={`py-1.5 rounded ${item.isColor || 'bg-black/35 hover:bg-black/60 text-slate-300'} border border-white/10 text-[11px] font-medium relative transition-all ${
                      hasBet ? 'ring-1 ring-[#d4af37] text-[#f3e5ab]' : ''
                    }`}
                  >
                    {item.label}
                    {hasBet && (
                      <span className="absolute -top-1 -right-1 px-1 rounded bg-[#d4af37] text-[#090a0f] text-[8px] font-bold animate-chip-drop">
                        ₹{hasBet}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Chip:</span>
            {CHIP_VALUES.map((val) => {
              const isSelected = selectedChip === val;
              return (
                <button
                  key={val}
                  onClick={() => {
                    sound.playChip();
                    setSelectedChip(val);
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border text-xs font-mono font-semibold transition active:scale-90 ${
                    isSelected
                      ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#f3e5ab] scale-105 shadow-sm'
                      : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                  }`}
                >
                  ₹{val}
                </button>
              );
            })}
          </div>

          <button
            disabled={isSpinning || totalBetAmount === 0 || balance < totalBetAmount}
            onClick={spinWheel}
            className={`w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              isSpinning || totalBetAmount === 0
                ? 'bg-white/10 text-slate-500 cursor-not-allowed'
                : 'gold-gradient-btn'
            }`}
          >
            {isSpinning ? 'Wheel Spinning...' : `Spin (₹${totalBetAmount})`}
          </button>
        </div>
      </div>
    </div>
  );
};
