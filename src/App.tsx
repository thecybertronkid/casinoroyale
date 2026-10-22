import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, GOOGLE_CLIENT_ID, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { LoginScreen } from './components/auth/LoginScreen';
import type { GameId } from './types';
import { CASINO_GAMES } from './data/games';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { StatsModal } from './components/common/StatsModal';
import { FairPlayModal } from './components/common/FairPlayModal';
import { Lobby } from './components/lobby/Lobby';
import { SlotsGame } from './components/games/SlotsGame';
import { RouletteGame } from './components/games/RouletteGame';
import { BlackjackGame } from './components/games/BlackjackGame';
import { CrashGame } from './components/games/CrashGame';
import { MinesGame } from './components/games/MinesGame';
import { DiceGame } from './components/games/DiceGame';
import { 
  ArrowLeft, 
  Crown, 
  CircleDot, 
  Layers, 
  Sparkles,
  Rocket, 
  Bomb, 
  Dice5,
} from 'lucide-react';

const CasinoContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isFairOpen, setIsFairOpen] = useState<boolean>(false);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const getGameIcon = (id: GameId) => {
    switch (id) {
      case 'slots':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'roulette':
        return <CircleDot className="w-3.5 h-3.5" />;
      case 'blackjack':
        return <Layers className="w-3.5 h-3.5" />;
      case 'crash':
        return <Rocket className="w-3.5 h-3.5" />;
      case 'mines':
        return <Bomb className="w-3.5 h-3.5" />;
      case 'dice':
        return <Dice5 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-200 flex flex-col font-sans selection:bg-[#d4af37]/30 selection:text-white">
      {/* Header */}
      <Header
        activeGame={activeGame}
        onBackToLobby={() => setActiveGame(null)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenFairModal={() => setIsFairOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {/* Sleek Minimal Game Switcher Bar */}
        {activeGame && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0e1017] border border-white/[0.06] p-2 rounded-xl">
            <button
              onClick={() => setActiveGame(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] text-xs font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Lobby Floor</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {CASINO_GAMES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveGame(g.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 ${
                    activeGame === g.id
                      ? 'bg-[#181b28] text-white border border-[#d4af37]/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                  }`}
                >
                  <span className={activeGame === g.id ? 'text-[#d4af37]' : ''}>
                    {getGameIcon(g.id)}
                  </span>
                  <span>{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Views */}
        {activeGame === null && <Lobby onSelectGame={(id) => setActiveGame(id)} />}
        {activeGame === 'slots' && <SlotsGame />}
        {activeGame === 'roulette' && <RouletteGame />}
        {activeGame === 'blackjack' && <BlackjackGame />}
        {activeGame === 'crash' && <CrashGame />}
        {activeGame === 'mines' && <MinesGame />}
        {activeGame === 'dice' && <DiceGame />}
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-white/[0.06] bg-[#07080c] py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="font-luxury font-bold tracking-wider text-xs">POISA BORBAAD</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-600">• DEMO GAMING LOUNGE</span>
          </div>
          <p className="text-[11px] text-slate-500 font-light leading-relaxed">
            All credits and payouts are virtual demo currency intended strictly for recreational entertainment. 
            No real cash deposits, wagers, or redemptions are processed.
          </p>
        </div>
      </footer>

      {/* Modals & Floating Components */}
      <ToastContainer />
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <FairPlayModal isOpen={isFairOpen} onClose={() => setIsFairOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <WalletProvider>
          <CasinoContent />
        </WalletProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
