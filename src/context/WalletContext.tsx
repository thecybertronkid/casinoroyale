import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { BetHistoryItem, PlayerStats, GameId } from '../types';
import { sound } from '../utils/sound';
import { useAuth } from './AuthContext';

interface ToastNotification {
  id: string;
  type: 'win' | 'loss' | 'info' | 'jackpot';
  title: string;
  message: string;
}

interface WalletContextType {
  balance: number;
  stats: PlayerStats;
  history: BetHistoryItem[];
  toasts: ToastNotification[];
  isMuted: boolean;
  toggleMute: () => void;
  placeBet: (amount: number, gameId: GameId) => boolean;
  creditWinnings: (
    game: GameId,
    gameName: string,
    betAmount: number,
    payout: number,
    multiplier: number,
    details: string
  ) => void;
  recordLoss: (
    game: GameId,
    gameName: string,
    betAmount: number,
    details: string
  ) => void;
  claimReliefCredits: (amount?: number) => void;
  resetWallet: () => void;
  dismissToast: (id: string) => void;
}

const INITIAL_BALANCE = 500;

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Storage prefix unique to each Google Account to prevent duplicate access
  const userPrefix = user ? `pb_u_${user.id}` : 'pb_guest';
  const prefixRef = useRef(userPrefix);

  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [stats, setStats] = useState<PlayerStats>({
    totalWagered: 0,
    totalWon: 0,
    totalLost: 0,
    netProfit: 0,
    totalBets: 0,
    biggestWin: 0,
    highestMultiplier: 1,
  });
  const [history, setHistory] = useState<BetHistoryItem[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Load user data whenever authenticated user changes
  useEffect(() => {
    prefixRef.current = userPrefix;

    const savedBal = localStorage.getItem(`${userPrefix}_balance`);
    if (savedBal !== null) {
      const val = parseFloat(savedBal);
      if (!isNaN(val)) setBalance(val);
      else setBalance(INITIAL_BALANCE);
    } else {
      setBalance(INITIAL_BALANCE);
    }

    const savedStats = localStorage.getItem(`${userPrefix}_stats`);
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch {
        setStats({
          totalWagered: 0,
          totalWon: 0,
          totalLost: 0,
          netProfit: 0,
          totalBets: 0,
          biggestWin: 0,
          highestMultiplier: 1,
        });
      }
    } else {
      setStats({
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        netProfit: 0,
        totalBets: 0,
        biggestWin: 0,
        highestMultiplier: 1,
      });
    }

    const savedHistory = localStorage.getItem(`${userPrefix}_history`);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        setHistory([]);
      }
    } else {
      setHistory([]);
    }
  }, [userPrefix]);

  // Persist balance under user's specific account
  useEffect(() => {
    localStorage.setItem(`${userPrefix}_balance`, balance.toString());
  }, [balance, userPrefix]);

  // Persist stats under user's specific account
  useEffect(() => {
    localStorage.setItem(`${userPrefix}_stats`, JSON.stringify(stats));
  }, [stats, userPrefix]);

  // Persist history under user's specific account
  useEffect(() => {
    localStorage.setItem(`${userPrefix}_history`, JSON.stringify(history.slice(0, 50)));
  }, [history, userPrefix]);

  const toggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const placeBet = (amount: number): boolean => {
    if (amount <= 0) return false;
    if (balance < amount) {
      addToast({
        type: 'info',
        title: 'Insufficient Balance!',
        message: 'Claim ₹500 Borbaad Demo Relief to continue playing.',
      });
      sound.playLose();
      return false;
    }

    sound.playChip();
    setBalance((prev) => Math.max(0, Math.round((prev - amount) * 100) / 100));
    return true;
  };

  const creditWinnings = (
    game: GameId,
    gameName: string,
    betAmount: number,
    payout: number,
    multiplier: number,
    details: string
  ) => {
    const profit = Math.round((payout - betAmount) * 100) / 100;
    const roundedPayout = Math.round(payout * 100) / 100;

    setBalance((prev) => Math.round((prev + roundedPayout) * 100) / 100);

    setStats((prev) => {
      const newTotalWagered = prev.totalWagered + betAmount;
      const newTotalWon = prev.totalWon + (profit > 0 ? profit : 0);
      const newNetProfit = prev.netProfit + profit;
      const newBiggestWin = Math.max(prev.biggestWin, roundedPayout);
      const newHighestMultiplier = Math.max(prev.highestMultiplier, multiplier);

      return {
        ...prev,
        totalWagered: Math.round(newTotalWagered * 100) / 100,
        totalWon: Math.round(newTotalWon * 100) / 100,
        netProfit: Math.round(newNetProfit * 100) / 100,
        totalBets: prev.totalBets + 1,
        biggestWin: Math.round(newBiggestWin * 100) / 100,
        highestMultiplier: Math.round(newHighestMultiplier * 100) / 100,
      };
    });

    const item: BetHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      game,
      gameName,
      betAmount,
      payout: roundedPayout,
      profit,
      multiplier: Math.round(multiplier * 100) / 100,
      timestamp: Date.now(),
      details,
    };
    setHistory((prev) => [item, ...prev.slice(0, 49)]);

    if (multiplier >= 15 || roundedPayout >= betAmount * 15) {
      sound.playJackpot();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'],
      });
      addToast({
        type: 'jackpot',
        title: '🔥 MEGA WIN! 🔥',
        message: `Won ₹${roundedPayout.toFixed(2)} (${multiplier.toFixed(2)}x) in ${gameName}!`,
      });
    } else if (profit > 0) {
      sound.playWin();
      if (multiplier >= 3) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
      addToast({
        type: 'win',
        title: 'Winner! 💰',
        message: `+₹${roundedPayout.toFixed(2)} (${multiplier.toFixed(2)}x) credited to your wallet!`,
      });
    } else {
      sound.playChip();
      addToast({
        type: 'info',
        title: 'Push / Refund',
        message: `Bet returned: ₹${roundedPayout.toFixed(2)}`,
      });
    }
  };

  const recordLoss = (game: GameId, gameName: string, betAmount: number, details: string) => {
    sound.playLose();

    setStats((prev) => ({
      ...prev,
      totalWagered: Math.round((prev.totalWagered + betAmount) * 100) / 100,
      totalLost: Math.round((prev.totalLost + betAmount) * 100) / 100,
      netProfit: Math.round((prev.netProfit - betAmount) * 100) / 100,
      totalBets: prev.totalBets + 1,
    }));

    const item: BetHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      game,
      gameName,
      betAmount,
      payout: 0,
      profit: -betAmount,
      multiplier: 0,
      timestamp: Date.now(),
      details,
    };
    setHistory((prev) => [item, ...prev.slice(0, 49)]);

    addToast({
      type: 'loss',
      title: 'Loss 💸',
      message: `Lost ₹${betAmount.toFixed(2)} in ${gameName}. ${details}`,
    });
  };

  const claimReliefCredits = (amount: number = 500) => {
    sound.playWin();
    setBalance((prev) => prev + amount);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#fbbf24', '#10b981'],
    });
    addToast({
      type: 'jackpot',
      title: '🎁 Demo Relief Claimed!',
      message: `+₹${amount.toFixed(2)} demo credits credited instantly to your account wallet.`,
    });
  };

  const resetWallet = () => {
    sound.playWin();
    setBalance(INITIAL_BALANCE);
    setStats({
      totalWagered: 0,
      totalWon: 0,
      totalLost: 0,
      netProfit: 0,
      totalBets: 0,
      biggestWin: 0,
      highestMultiplier: 1,
    });
    setHistory([]);
    addToast({
      type: 'info',
      title: 'Wallet Reset',
      message: `Reset to initial ₹${INITIAL_BALANCE} demo balance.`,
    });
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        stats,
        history,
        toasts,
        isMuted,
        toggleMute,
        placeBet,
        creditWinnings,
        recordLoss,
        claimReliefCredits,
        resetWallet,
        dismissToast,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
