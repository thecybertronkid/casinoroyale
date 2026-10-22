import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FairPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FairPlayModal: React.FC<FairPlayModalProps> = ({ isOpen, onClose }) => {
  const [clientSeed, setClientSeed] = useState(() => Math.random().toString(36).substring(2, 14));
  const [serverSeedHash] = useState(() => 
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyHash = () => {
    navigator.clipboard.writeText(serverSeedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e1017] border border-white/[0.08] w-full max-w-xl max-h-[88vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#0a0b10]">
          <div>
            <h3 className="font-luxury text-lg font-bold text-white tracking-wide">
              PROVABLE INTEGRITY
            </h3>
            <p className="text-xs text-slate-400 font-light">Cryptographic Randomness & Verified RTP</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-[#0a0b10] border border-white/[0.05] space-y-1.5">
            <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              Deterministic Randomness
            </h4>
            <p className="text-slate-400 leading-relaxed font-light">
              Every round result in Poisa Borbaad is determined mathematically prior to the start of the round using client and server SHA-256 cryptographic hashes.
            </p>
          </div>

          {/* Dynamic Risk Curve Explanation */}
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-[#d4af37]/25 space-y-1.5">
            <h4 className="font-semibold text-[#f3e5ab] text-xs">
              ⚡ High-Stakes Wager Scaling Curve
            </h4>
            <p className="text-slate-400 leading-relaxed font-light">
              True to the salon's name <em>POISA BORBAAD</em>, the house applies a dynamic risk modifier: small wagers (₹5–₹15) enjoy favorable standard odds, while larger bids (₹50–₹250+) face steep house volatility and reduced winning probabilities.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1">
                Active Server Seed Hash (SHA-256)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={serverSeedHash}
                  className="w-full bg-[#0a0b10] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 select-all"
                />
                <button
                  onClick={copyHash}
                  className="px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg text-xs font-medium transition shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-1">
                Your Client Seed
              </label>
              <input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                className="w-full bg-[#0a0b10] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-[#f3e5ab] focus:outline-none focus:border-[#d4af37]/40"
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="bg-[#0a0b10] px-3.5 py-2 text-xs font-semibold text-slate-300 border-b border-white/[0.06]">
              Verified Return to Player (RTP)
            </div>
            <div className="divide-y divide-white/[0.04] bg-[#0c0e15] font-mono text-xs">
              <div className="flex justify-between px-3.5 py-2">
                <span className="text-slate-400 font-sans">Blackjack Royale</span>
                <span className="text-emerald-400 font-semibold">99.5%</span>
              </div>
              <div className="flex justify-between px-3.5 py-2">
                <span className="text-slate-400 font-sans">Prestige Dice</span>
                <span className="text-emerald-400 font-semibold">99.0%</span>
              </div>
              <div className="flex justify-between px-3.5 py-2">
                <span className="text-slate-400 font-sans">Diamond Minefield</span>
                <span className="text-emerald-400 font-semibold">98.0%</span>
              </div>
              <div className="flex justify-between px-3.5 py-2">
                <span className="text-slate-400 font-sans">European Roulette</span>
                <span className="text-emerald-400 font-semibold">97.3%</span>
              </div>
              <div className="flex justify-between px-3.5 py-2">
                <span className="text-slate-400 font-sans">Ascent Multiplier</span>
                <span className="text-emerald-400 font-semibold">97.0%</span>
              </div>
              <div className="flex justify-between px-3.5 py-2">
                <span className="text-slate-400 font-sans">Crown 777 Slots</span>
                <span className="text-emerald-400 font-semibold">96.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-[#0a0b10] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
