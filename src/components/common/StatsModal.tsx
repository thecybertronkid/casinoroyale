import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { 
  X, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Crown,
  Download
} from 'lucide-react';
import type { GameId } from '../../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { stats, history, balance } = useWallet();
  const [filterGame, setFilterGame] = useState<GameId | 'all'>('all');

  if (!isOpen) return null;

  const winRate = stats.totalBets > 0 
    ? Math.round((history.filter(h => h.profit > 0).length / stats.totalBets) * 100) 
    : 0;

  const filteredHistory = filterGame === 'all' 
    ? history 
    : history.filter(h => h.game === filterGame);

  const vipTiers = [
    { name: 'Club Member', threshold: 0, next: 1000 },
    { name: 'Silver Club', threshold: 1000, next: 5000 },
    { name: 'Gold Premier', threshold: 5000, next: 20000 },
    { name: 'Diamond Tier', threshold: 20000, next: 100000 },
    { name: 'Emperor Club', threshold: 100000, next: 1000000 },
  ];

  const currentTierIndex = vipTiers.findIndex((_, i) => {
    const nextTier = vipTiers[i + 1];
    return !nextTier || stats.totalWagered < nextTier.threshold;
  });
  const currentTier = vipTiers[currentTierIndex] || vipTiers[0];
  const nextTier = vipTiers[currentTierIndex + 1];
  const progressPercent = nextTier 
    ? Math.min(100, Math.max(0, ((stats.totalWagered - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100))
    : 100;

  const exportHistoryCSV = () => {
    const headers = 'ID,Game,Bet Amount,Payout,Profit,Multiplier,Date,Details\n';
    const rows = history.map(h => 
      `"${h.id}","${h.gameName}",${h.betAmount},${h.payout},${h.profit},${h.multiplier},"${new Date(h.timestamp).toLocaleString()}","${h.details.replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poisa_borbaad_ledger_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0e1017] border border-white/[0.08] w-full max-w-3xl max-h-[88vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-[#0a0b10]">
          <div>
            <h3 className="font-luxury text-lg font-bold text-white tracking-wide">
              PLAYER PERFORMANCE LEDGER
            </h3>
            <p className="text-xs text-slate-400 font-light">Account metrics & audited rounds</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* VIP Tier */}
          <div className="p-4 rounded-xl bg-[#090a0f] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#d4af37]" />
                <span className="font-semibold text-white text-xs">{currentTier.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-slate-400 font-mono">
                  Tier {currentTierIndex + 1}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {nextTier ? `₹${stats.totalWagered.toFixed(0)} / ₹${nextTier.threshold} Wagered` : 'Elite Tier'}
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <div 
                className="h-full bg-[#d4af37] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0a0b10] border border-white/[0.05]">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="text-[10px] uppercase font-medium">Balance</span>
                <Coins className="w-3.5 h-3.5 text-[#d4af37]" />
              </div>
              <div className="text-base font-mono font-semibold text-[#f3e5ab]">
                ₹{balance.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0b10] border border-white/[0.05]">
              <div className="text-slate-400 text-[10px] uppercase font-medium mb-1">Total Wagered</div>
              <div className="text-base font-mono font-semibold text-white">
                ₹{stats.totalWagered.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0b10] border border-white/[0.05]">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-medium mb-1">
                <span>Net Return</span>
                {stats.netProfit >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <div className={`text-base font-mono font-semibold ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stats.netProfit >= 0 ? '+' : ''}₹{stats.netProfit.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0a0b10] border border-white/[0.05]">
              <div className="text-slate-400 text-[10px] uppercase font-medium mb-1">Win Rate</div>
              <div className="text-base font-mono font-semibold text-[#f3e5ab]">
                {winRate}% <span className="text-[10px] text-slate-500 font-sans">({stats.totalBets} rds)</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Audited Round History
              </span>

              <div className="flex items-center gap-2">
                <select
                  value={filterGame}
                  onChange={(e) => setFilterGame(e.target.value as GameId | 'all')}
                  className="bg-[#0a0b10] border border-white/10 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none"
                >
                  <option value="all">All Games</option>
                  <option value="slots">Slots</option>
                  <option value="roulette">Roulette</option>
                  <option value="blackjack">Blackjack</option>
                  <option value="crash">Ascent</option>
                  <option value="mines">Mines</option>
                  <option value="dice">Dice</option>
                </select>

                {history.length > 0 && (
                  <button
                    onClick={exportHistoryCSV}
                    className="p-1 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs flex items-center gap-1 border border-white/10 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                )}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 bg-[#0a0b10] rounded-xl border border-white/[0.04] text-slate-500 text-xs font-light">
                No rounds registered in ledger yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#090a0f] text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/[0.06]">
                    <tr>
                      <th className="py-2.5 px-3">Table</th>
                      <th className="py-2.5 px-3">Wager</th>
                      <th className="py-2.5 px-3">Payout</th>
                      <th className="py-2.5 px-3">Net</th>
                      <th className="py-2.5 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] bg-[#0c0e15]">
                    {filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-2 px-3 font-medium text-slate-200">
                          {item.gameName}
                          <span className="block text-[10px] text-slate-500 truncate max-w-[150px]">
                            {item.details}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400">
                          ₹{item.betAmount.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-300">
                          ₹{item.payout.toFixed(2)}
                        </td>
                        <td className={`py-2 px-3 font-mono font-medium ${item.profit > 0 ? 'text-emerald-400' : item.profit < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                          {item.profit > 0 ? '+' : ''}₹{item.profit.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[10px] font-mono whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-[#0a0b10] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 text-xs font-medium transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
