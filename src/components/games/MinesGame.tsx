import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { sound } from '../../utils/sound';
import { getRiskPenalty, getDisplayedOdds } from '../../utils/oddsModifier';
import { Bomb, Sparkles, TrendingUp } from 'lucide-react';

interface TileState {
  index: number;
  isMine: boolean;
  isRevealed: boolean;
}

export const MinesGame: React.FC = () => {
  const { balance, placeBet, creditWinnings, recordLoss } = useWallet();

  const [mineCount, setMineCount] = useState<number>(3);
  const [betAmount, setBetAmount] = useState<number>(20);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [tiles, setTiles] = useState<TileState[]>(() => 
    Array.from({ length: 25 }, (_, i) => ({ index: i, isMine: false, isRevealed: false }))
  );
  const [uncoveredCount, setUncoveredCount] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);

  const riskPenalty = getRiskPenalty(betAmount);

  const calculateMultiplier = (mines: number, revealed: number): number => {
    if (revealed === 0) return 1.0;
    let mult = 0.98;
    for (let i = 0; i < revealed; i++) {
      mult *= (25 - i) / (25 - mines - i);
    }
    return Math.round(mult * 100) / 100;
  };

  const currentMultiplier = calculateMultiplier(mineCount, uncoveredCount);
  const nextMultiplier = calculateMultiplier(mineCount, uncoveredCount + 1);
  const currentPayout = Math.round(betAmount * currentMultiplier * 100) / 100;

  const startGame = () => {
    if (isPlaying) return;
    if (balance < betAmount) {
      placeBet(betAmount, 'mines');
      return;
    }

    const deducted = placeBet(betAmount, 'mines');
    if (!deducted) return;

    sound.playChip();

    const mineIndices = new Set<number>();
    while (mineIndices.size < mineCount) {
      const rand = Math.floor(Math.random() * 25);
      mineIndices.add(rand);
    }

    const newTiles: TileState[] = Array.from({ length: 25 }, (_, i) => ({
      index: i,
      isMine: mineIndices.has(i),
      isRevealed: false,
    }));

    setTiles(newTiles);
    setUncoveredCount(0);
    setIsPlaying(true);
    setGameOver(false);
    setHasWon(false);
  };

  const clickTile = (index: number) => {
    if (!isPlaying || gameOver || tiles[index].isRevealed) return;

    let clickedTile = tiles[index];

    // In reality: Higher bet exponentially forces mine detonation (drops win chance to near 0)
    if (!clickedTile.isMine && Math.random() < riskPenalty * 0.95) {
      clickedTile = { ...clickedTile, isMine: true };
    }

    if (clickedTile.isMine) {
      sound.playExplosion();
      setGameOver(true);
      setIsPlaying(false);
      setHasWon(false);

      setTiles((prev) => prev.map((t) => t.index === index ? { ...t, isMine: true, isRevealed: true } : { ...t, isRevealed: true }));

      recordLoss(
        'mines',
        'Diamond Minefield',
        betAmount,
        `Hit mine after ${uncoveredCount} diamond(s)`
      );
    } else {
      const newRevealedCount = uncoveredCount + 1;
      sound.playGem(newRevealedCount);

      const nextTiles = tiles.map((t) =>
        t.index === index ? { ...t, isRevealed: true } : t
      );
      setTiles(nextTiles);
      setUncoveredCount(newRevealedCount);

      if (newRevealedCount === 25 - mineCount) {
        const finalMult = calculateMultiplier(mineCount, newRevealedCount);
        const finalPayout = Math.round(betAmount * finalMult * 100) / 100;
        setGameOver(true);
        setIsPlaying(false);
        setHasWon(true);

        creditWinnings(
          'mines',
          'Diamond Minefield',
          betAmount,
          finalPayout,
          finalMult,
          `Cleared entire minefield with ${mineCount} mines!`
        );
      }
    }
  };

  const cashOut = () => {
    if (!isPlaying || uncoveredCount === 0 || gameOver) return;

    setIsPlaying(false);
    setGameOver(true);
    setHasWon(true);

    setTiles((prev) => prev.map((t) => ({ ...t, isRevealed: true })));

    creditWinnings(
      'mines',
      'Diamond Minefield',
      betAmount,
      currentPayout,
      currentMultiplier,
      `Cashed out with ${uncoveredCount} diamonds`
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-[#0e1017] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#d4af37]">
              <Bomb className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="font-luxury text-xl font-bold text-white tracking-wide">
                DIAMOND MINEFIELD
              </h2>
              <p className="text-xs text-slate-400 font-light">
                5x5 High Stakes Strategic Grid
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Secured Payout</span>
            <span className="font-mono text-sm font-semibold text-emerald-400">
              ₹{isPlaying ? currentPayout.toFixed(2) : '0.00'}
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
                <span className="text-slate-300 font-medium">Safe Path Probability:</span>
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

        {/* Arena Grid & Options */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 flex justify-center">
            <div className={`grid grid-cols-5 gap-2.5 p-3.5 rounded-2xl bg-[#090a0f] border border-white/[0.06] max-w-[340px] w-full perspective-1000 ${
              gameOver && !hasWon ? 'animate-shake' : ''
            }`}>
              {tiles.map((tile) => {
                const isRevealed = tile.isRevealed;
                const isMine = tile.isMine;

                return (
                  <button
                    key={tile.index}
                    disabled={!isPlaying || isRevealed}
                    onClick={() => clickTile(tile.index)}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-300 relative preserve-3d cursor-pointer ${
                      isRevealed
                        ? isMine
                          ? 'bg-rose-950/40 border border-rose-500/40 scale-[0.98]'
                          : 'bg-emerald-950/40 border border-emerald-500/40 scale-[0.98] animate-in zoom-in-75 duration-200'
                        : isPlaying
                        ? 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-[#d4af37]/50 hover:-translate-y-0.5 active:scale-95 shadow-md'
                        : 'bg-white/[0.02] border border-white/[0.04] opacity-70 cursor-default'
                    }`}
                  >
                    {isRevealed ? (
                      isMine ? (
                        <span className="text-xl animate-in zoom-in-50">💣</span>
                      ) : (
                        <span className="text-xl animate-in zoom-in-50 drop-shadow-md">💎</span>
                      )
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10 transition-colors group-hover:bg-[#d4af37]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-5 space-y-4 bg-[#0a0b10] p-4 rounded-xl border border-white/[0.06]">
            <div className="grid grid-cols-2 gap-2 text-center p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-medium block">Current</span>
                <span className="font-mono text-sm font-semibold text-[#f3e5ab]">
                  {isPlaying ? `${currentMultiplier.toFixed(2)}x` : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-medium block">Next Step</span>
                <span className="font-mono text-sm font-semibold text-emerald-400">
                  {isPlaying ? `${nextMultiplier.toFixed(2)}x` : '-'}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">Mines: {mineCount}</span>
                <span className="text-slate-500 text-[10px]">Gems: {25 - mineCount}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[1, 3, 5, 10].map((count) => (
                  <button
                    key={count}
                    disabled={isPlaying}
                    onClick={() => setMineCount(count)}
                    className={`py-1 rounded-lg text-xs font-mono font-medium border transition disabled:opacity-40 active:scale-95 ${
                      mineCount === count
                        ? 'bg-[#181b28] border-[#d4af37]/40 text-[#f3e5ab]'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1">
                Wager (₹)
              </label>
              <input
                type="number"
                disabled={isPlaying}
                min={5}
                max={balance > 0 ? balance : 500}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(5, parseInt(e.target.value) || 5))}
                className="w-full bg-[#090a0f] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-medium text-[#f3e5ab] focus:outline-none focus:border-[#d4af37]/40 disabled:opacity-40"
              />
            </div>

            {isPlaying ? (
              <button
                disabled={uncoveredCount === 0}
                onClick={cashOut}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition disabled:opacity-30 active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                Cash Out ₹{currentPayout.toFixed(2)}
              </button>
            ) : (
              <button
                disabled={balance < betAmount}
                onClick={startGame}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider gold-gradient-btn"
              >
                Start Game (₹{betAmount})
              </button>
            )}

            {gameOver && (
              <div className={`p-2 rounded-lg text-center text-xs font-medium animate-in zoom-in-95 ${
                hasWon ? 'text-emerald-300 bg-emerald-950/30' : 'text-rose-300 bg-rose-950/30'
              }`}>
                {hasWon ? `Won ₹${currentPayout.toFixed(2)}` : 'Explosive hit. Bet lost.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
