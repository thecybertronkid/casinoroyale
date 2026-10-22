import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../../context/WalletContext';
import { sound } from '../../utils/sound';
import { getRiskPenalty, getDisplayedOdds } from '../../utils/oddsModifier';
import { 
  Rocket, 
  History,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export const CrashGame: React.FC = () => {
  const { balance, placeBet, creditWinnings, recordLoss } = useWallet();

  const [betAmount, setBetAmount] = useState<number>(20);
  const [autoCashout, setAutoCashout] = useState<string>('2.00');
  const [gameState, setGameState] = useState<'idle' | 'running' | 'crashed' | 'cashed_out'>('idle');
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [recentCrashes, setRecentCrashes] = useState<number[]>([1.45, 3.22, 1.12, 14.80, 2.05, 5.60]);
  const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashPointRef = useRef<number>(1.00);
  const autoCashoutValRef = useRef<number>(2.00);

  // In reality: Increasing bet exponentially forces early/instant crash (near 0% win chance)
  const generateCrashPoint = (currentBet: number): number => {
    const penalty = getRiskPenalty(currentBet);
    
    // Higher bet -> up to 92% chance to crash immediately under 1.05x
    const instantCrashChance = 0.04 + penalty * 0.88;
    if (Math.random() < instantCrashChance) {
      return Math.round((1.00 + Math.random() * 0.04) * 100) / 100;
    }

    const e = 2 ** 32;
    const h = Math.floor(Math.random() * e);
    if (h % 33 === 0) return 1.00;
    const r = (100 * e - h) / (e - h);
    let result = Math.floor(r) / 100;

    // Dampen multiplier exponentially for high bets
    if (penalty > 0) {
      result = Math.max(1.02, 1 + (result - 1) * Math.max(0.01, 1 - penalty * 0.98));
    }

    return Math.max(1.01, Math.min(250.0, Math.round(result * 100) / 100));
  };

  const startFlight = () => {
    if (gameState === 'running') return;
    if (balance < betAmount) {
      placeBet(betAmount, 'crash');
      return;
    }

    const deducted = placeBet(betAmount, 'crash');
    if (!deducted) return;

    const crashPoint = generateCrashPoint(betAmount);
    crashPointRef.current = crashPoint;
    const autoVal = parseFloat(autoCashout);
    autoCashoutValRef.current = !isNaN(autoVal) && autoVal > 1 ? autoVal : 0;

    setMultiplier(1.00);
    setCashedOutAt(null);
    setGameState('running');
    startTimeRef.current = performance.now();

    sound.playChip();
    runGameLoop();
  };

  const cashOut = () => {
    if (gameState !== 'running') return;

    const currentMult = multiplier;
    setCashedOutAt(currentMult);
    setGameState('cashed_out');

    const payout = Math.round(betAmount * currentMult * 100) / 100;
    creditWinnings(
      'crash',
      'Ascent Multiplier',
      betAmount,
      payout,
      currentMult,
      `Cashed out at ${currentMult.toFixed(2)}x`
    );
  };

  const runGameLoop = () => {
    const now = performance.now();
    const elapsed = (now - startTimeRef.current) / 1000;

    const currentMult = Math.round((1 + 0.07 * Math.pow(elapsed * 1.5, 1.8)) * 100) / 100;

    if (
      gameState === 'running' &&
      autoCashoutValRef.current > 1 &&
      currentMult >= autoCashoutValRef.current &&
      cashedOutAt === null
    ) {
      cashOut();
    }

    if (currentMult >= crashPointRef.current) {
      const finalCrash = crashPointRef.current;
      setMultiplier(finalCrash);
      setGameState('crashed');
      sound.playExplosion();

      setRecentCrashes((prev) => [finalCrash, ...prev.slice(0, 7)]);

      if (cashedOutAt === null && gameState === 'running') {
        recordLoss(
          'crash',
          'Ascent Multiplier',
          betAmount,
          `Ascent halted at ${finalCrash.toFixed(2)}x`
        );
      }
      return;
    }

    setMultiplier(currentMult);
    renderCanvas(currentMult);

    animationFrameRef.current = requestAnimationFrame(runGameLoop);
  };

  const renderCanvas = (currMult: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 30; y < height; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const startX = 40;
    const startY = height - 30;
    const endX = startX + (width - startX - 60) * Math.min(1, (currMult - 1) / 5);
    const endY = startY - (height - 80) * Math.min(1, Math.pow((currMult - 1) / 8, 0.7));

    const grad = ctx.createLinearGradient(startX, startY, endX, endY);
    grad.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
    grad.addColorStop(1, '#d4af37');

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + endX) / 2, startY, endX, endY);
    ctx.lineTo(endX, startY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + endX) / 2, startY, endX, endY);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgba(243, 229, 171, 0.6)';
      ctx.beginPath();
      ctx.arc(
        endX - 8 - Math.random() * 8,
        endY + 4 + Math.random() * 6,
        Math.random() * 2 + 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className={`bg-[#0e1017] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl relative ${gameState === 'crashed' ? 'animate-shake' : ''}`}>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#d4af37]">
              <Rocket className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="font-luxury text-xl font-bold text-white tracking-wide">
                ASCENT MULTIPLIER
              </h2>
              <p className="text-xs text-slate-400 font-light">
                Real-Time Exponential Payout Curve
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.06]">
            <History className="w-3.5 h-3.5 text-slate-500 mr-1" />
            {recentCrashes.map((val, idx) => (
              <span
                key={idx}
                className={`text-xs font-mono font-medium px-1 rounded transition-colors ${
                  val >= 2 ? 'text-[#f3e5ab]' : 'text-slate-400'
                }`}
              >
                {val.toFixed(2)}x
              </span>
            ))}
          </div>
        </div>

        {/* Displayed Odds: Shows higher bet -> higher winning probability */}
        {(() => {
          const displayedOdds = getDisplayedOdds(betAmount);
          return (
            <div className={`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] transition-all duration-300 ${displayedOdds.glowClass}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="text-slate-300 font-medium">Trajectory Multiplier Boost:</span>
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

        {/* Minimal Canvas Chart */}
        <div className="relative rounded-xl bg-[#090a0f] border border-white/[0.06] p-4 min-h-[260px] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={550}
            height={240}
            className="w-full h-[240px] object-contain"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            {gameState === 'crashed' ? (
              <div className="text-center animate-in zoom-in-95 duration-150">
                <span className="text-[10px] uppercase font-semibold text-rose-400 tracking-widest block mb-1">
                  Ascent Concluded
                </span>
                <span className="text-4xl sm:text-6xl font-bold font-mono text-rose-400">
                  {multiplier.toFixed(2)}x
                </span>
              </div>
            ) : (
              <div className="text-center">
                <span className={`text-4xl sm:text-6xl font-bold font-mono transition-all duration-75 ${
                  gameState === 'cashed_out' ? 'text-emerald-400' : 'text-white'
                }`}>
                  {multiplier.toFixed(2)}x
                </span>

                {gameState === 'cashed_out' && cashedOutAt && (
                  <div className="mt-2 text-xs font-mono font-medium text-emerald-400 bg-emerald-950/40 px-3 py-0.5 rounded border border-emerald-800/40 animate-in zoom-in-95">
                    Locked @ {cashedOutAt.toFixed(2)}x (+₹{(betAmount * cashedOutAt).toFixed(2)})
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Minimalist Controls */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/[0.06]">
          {/* Bet Amount */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1.5">
              Wager Amount (₹)
            </label>
            <input
              type="number"
              disabled={gameState === 'running'}
              min={5}
              max={balance > 0 ? balance : 500}
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(5, parseInt(e.target.value) || 5))}
              className="w-full bg-[#0a0b10] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-medium text-[#f3e5ab] focus:outline-none focus:border-[#d4af37]/40 disabled:opacity-40"
            />
          </div>

          {/* Auto Cashout */}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1.5">
              Target Multiplier (Auto)
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={gameState === 'running'}
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                placeholder="2.00"
                className="w-full bg-[#0a0b10] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono font-medium text-white focus:outline-none focus:border-[#d4af37]/40 disabled:opacity-40 pr-8"
              />
              <span className="absolute right-3 top-2 text-slate-500 text-xs font-mono">x</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-end">
            {gameState === 'running' ? (
              <button
                onClick={cashOut}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                Cash Out ₹{(betAmount * multiplier).toFixed(2)}
              </button>
            ) : (
              <button
                disabled={balance < betAmount}
                onClick={startFlight}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider gold-gradient-btn"
              >
                Initiate (₹{betAmount})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
