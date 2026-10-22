export type GameId = 'slots' | 'roulette' | 'blackjack' | 'crash' | 'mines' | 'dice';

export interface BetHistoryItem {
  id: string;
  game: GameId;
  gameName: string;
  betAmount: number;
  payout: number;
  profit: number;
  multiplier: number;
  timestamp: number;
  details: string;
}

export interface PlayerStats {
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  totalBets: number;
  biggestWin: number;
  highestMultiplier: number;
}

export interface GameInfo {
  id: GameId;
  name: string;
  category: 'Popular' | 'Table Games' | 'Arcade' | 'Slots';
  tagline: string;
  description: string;
  rtp: string;
  maxWin: string;
  iconName: string;
  badge?: string;
  accentColor: string;
}
