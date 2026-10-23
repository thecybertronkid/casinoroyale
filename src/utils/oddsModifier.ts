/**
 * Dynamic Risk & Sequence Odds Engine for "POISA BORBAAD"
 * 
 * 1. FAIR & ENGAGING BASELINE:
 *    Small bets (<= ₹15) run authentic, fair casino odds with natural house edge (~49% win rate).
 *    No artificial rigging or match-fixing feel.
 * 
 * 2. THE HIGH-ROLLER "HONEY TRAP & HOUSE RECLAMATION" CYCLE:
 *    When a player bets higher stakes (> ₹15):
 *    - Draw 1 (Honey 1): Player is given high winning odds (85%+) to WIN MORE MONEY!
 *    - Draw 2 (Honey 2): Player hits another solid win/profit (70%+), cementing confidence!
 *    - Draw 3 (The Trap): The house strikes back! Near-misses & losses reclaim the accumulated money.
 *    - Draw 4+ (Deficit / Chasing): More the money wagered to "get that money back", the lower the
 *      odds become, mathematically suppressing recovery while betting big.
 *    - Stepping down to small bets for a few rounds cools off the sequence.
 */

export interface DisplayedOddsInfo {
  tierName: string;
  displayedWinRate: string;
  multiplierText: string;
  badgeText: string;
  themeColor: string;
  glowClass: string;
}

export type OddsCycleStage = 'FAIR_LOW' | 'HONEY_1' | 'HONEY_2' | 'TRAP_3' | 'CHASE_DEFICIT';

interface GameCycleState {
  highBetRoundCount: number; // 0 = first high bet draw, 1 = second, 2 = third (trap), 3+ = deficit
  consecutiveLowBets: number;
  lastBet: number;
}

// In-memory cycle store per game, backed by sessionStorage for consistency across reloads
const cycleStore: Record<string, GameCycleState> = {};

const loadCycleState = (gameId: string): GameCycleState => {
  if (cycleStore[gameId]) return cycleStore[gameId];
  try {
    const raw = sessionStorage.getItem(`pb_cycle_${gameId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      cycleStore[gameId] = parsed;
      return parsed;
    }
  } catch {
    // Ignore storage issues
  }
  const initial: GameCycleState = { highBetRoundCount: 0, consecutiveLowBets: 0, lastBet: 0 };
  cycleStore[gameId] = initial;
  return initial;
};

const saveCycleState = (gameId: string, state: GameCycleState) => {
  cycleStore[gameId] = state;
  try {
    sessionStorage.setItem(`pb_cycle_${gameId}`, JSON.stringify(state));
  } catch {
    // Ignore storage issues
  }
};

/**
 * Advance the odds stage for a game when a round begins.
 */
export const advanceGameOddsCycle = (gameId: string, betAmount: number): OddsCycleStage => {
  const state = loadCycleState(gameId);

  // Small bets: Fair table play
  if (betAmount <= 15) {
    state.consecutiveLowBets += 1;
    // After 3 low bets, reset high-bet cycle so the honey trap can trigger again
    if (state.consecutiveLowBets >= 3) {
      state.highBetRoundCount = 0;
    }
    state.lastBet = betAmount;
    saveCycleState(gameId, state);
    return 'FAIR_LOW';
  }

  // High bet placed!
  state.consecutiveLowBets = 0;
  const currentCount = state.highBetRoundCount;
  state.highBetRoundCount += 1;
  state.lastBet = betAmount;
  saveCycleState(gameId, state);

  if (currentCount === 0) return 'HONEY_1';
  if (currentCount === 1) return 'HONEY_2';
  if (currentCount === 2) return 'TRAP_3';
  return 'CHASE_DEFICIT';
};

/**
 * Inspect the current stage without advancing it.
 */
export const getGameOddsStage = (gameId: string, betAmount: number): OddsCycleStage => {
  if (betAmount <= 15) return 'FAIR_LOW';
  const state = loadCycleState(gameId);
  if (state.highBetRoundCount === 0) return 'HONEY_1';
  if (state.highBetRoundCount === 1) return 'HONEY_2';
  if (state.highBetRoundCount === 2) return 'TRAP_3';
  return 'CHASE_DEFICIT';
};

/**
 * Reset cycle for a game or all games (e.g. after wallet reload)
 */
export const resetGameOddsCycle = (gameId?: string) => {
  if (gameId) {
    cycleStore[gameId] = { highBetRoundCount: 0, consecutiveLowBets: 0, lastBet: 0 };
    try {
      sessionStorage.removeItem(`pb_cycle_${gameId}`);
    } catch {
      // Ignore
    }
  } else {
    Object.keys(cycleStore).forEach((k) => {
      cycleStore[k] = { highBetRoundCount: 0, consecutiveLowBets: 0, lastBet: 0 };
      try {
        sessionStorage.removeItem(`pb_cycle_${k}`);
      } catch {
        // Ignore
      }
    });
  }
};

/**
 * Returns the alluring visual odds presented to the player in the UI.
 * Higher bet -> Displays much higher winning probability and luck multipliers!
 */
export const getDisplayedOdds = (betAmount: number): DisplayedOddsInfo => {
  if (betAmount <= 15) {
    return {
      tierName: 'Standard Stake',
      displayedWinRate: '49.5%',
      multiplierText: '1.0x Base Odds',
      badgeText: 'Standard Fair Table • 49.5% Est. Win Rate',
      themeColor: 'text-slate-300',
      glowClass: 'border-white/10 bg-white/[0.02]',
    };
  }

  if (betAmount <= 40) {
    return {
      tierName: 'Silver Stake (+18% Boost)',
      displayedWinRate: '68.5%',
      multiplierText: '1.38x Elevated Odds',
      badgeText: '✨ Silver Stake: +18% Boosted Odds (68.5% Est. Win Rate)',
      themeColor: 'text-emerald-400',
      glowClass: 'border-emerald-500/30 bg-emerald-950/20 shadow-emerald-500/10 shadow-sm',
    };
  }

  if (betAmount <= 90) {
    return {
      tierName: 'Gold Premier (+36% Boost)',
      displayedWinRate: '84.2%',
      multiplierText: '1.70x Enhanced Probability',
      badgeText: '🔥 Gold Premier Stake: +36% Enhanced Odds (84.2% Est. Win Rate)',
      themeColor: 'text-[#f3e5ab]',
      glowClass: 'border-[#d4af37]/40 bg-[#d4af37]/10 shadow-[#d4af37]/15 shadow-sm',
    };
  }

  if (betAmount <= 180) {
    return {
      tierName: 'Diamond High Roller (+46% Boost)',
      displayedWinRate: '94.8%',
      multiplierText: '1.92x Supercharged Odds',
      badgeText: '💎 Diamond High-Roller: +46% Supercharged Odds (94.8% Est. Win Rate)',
      themeColor: 'text-cyan-300',
      glowClass: 'border-cyan-500/40 bg-cyan-950/20 shadow-cyan-500/20 shadow-sm',
    };
  }

  return {
    tierName: '👑 Emperor Royal Stake',
    displayedWinRate: '99.4%',
    multiplierText: '2.01x Prime Synergy',
    badgeText: '👑 Emperor Royal Stake: 99.4% Prime Winning Advantage (VIP Whale Boost)',
    themeColor: 'text-amber-300 font-bold',
    glowClass: 'border-amber-400/50 bg-amber-950/30 shadow-amber-500/25 shadow-md',
  };
};

/**
 * General risk penalty based on stage and bet amount.
 */
export const getRiskPenalty = (betAmount: number, gameId?: string): number => {
  if (betAmount <= 15) return 0.0;
  if (!gameId) {
    // Fallback if gameId not provided
    const delta = betAmount - 15;
    return Math.min(0.85, 0.4 + delta * 0.002);
  }
  const stage = getGameOddsStage(gameId, betAmount);
  if (stage === 'HONEY_1') return 0.0; // Sweetened win!
  if (stage === 'HONEY_2') return 0.15; // Fair/light resistance
  if (stage === 'TRAP_3') return 0.96; // Trap springs!
  // CHASE_DEFICIT: More money, less likely to get it back
  const delta = betAmount - 15;
  return Math.min(0.94, 0.70 + delta * 0.0015);
};

export const evaluateWithBetPenalty = (baseWon: boolean, betAmount: number, gameId?: string): boolean => {
  if (betAmount <= 15) return baseWon;
  const stage = gameId ? getGameOddsStage(gameId, betAmount) : 'HONEY_1';
  if (stage === 'HONEY_1') return true; // Win on draw 1
  if (stage === 'HONEY_2') return Math.random() < 0.72; // Win on draw 2
  if (stage === 'TRAP_3') return false; // Lose on draw 3
  // CHASE_DEFICIT
  const penalty = getRiskPenalty(betAmount, gameId);
  return baseWon && Math.random() >= penalty;
};

/* -------------------------------------------------------------------------- */
/*                          GAME-SPECIFIC ADAPTORS                            */
/* -------------------------------------------------------------------------- */

/**
 * 1. Crash Ascent Multiplier Generator
 */
export const generateEngineeredCrashPoint = (betAmount: number): number => {
  const stage = advanceGameOddsCycle('crash', betAmount);

  if (stage === 'HONEY_1') {
    // Draw 1: Win more money! Rocket flies smoothly to 2.30x - 4.80x
    return Math.round((2.30 + Math.random() * 2.50) * 100) / 100;
  }

  if (stage === 'HONEY_2') {
    // Draw 2: Solid flight to 1.85x - 3.20x
    return Math.round((1.85 + Math.random() * 1.35) * 100) / 100;
  }

  if (stage === 'TRAP_3') {
    // Draw 3: The Trap! Crashes early at 1.12x - 1.34x (takes back the winnings)
    return Math.round((1.12 + Math.random() * 0.22) * 100) / 100;
  }

  if (stage === 'CHASE_DEFICIT') {
    // Chasing with high bets: Hard to get money back, crashes mostly between 1.05x - 1.45x
    if (Math.random() < 0.65) {
      return Math.round((1.05 + Math.random() * 0.25) * 100) / 100;
    }
    return Math.round((1.30 + Math.random() * 0.50) * 100) / 100;
  }

  // FAIR_LOW: Standard authentic provably fair curve
  const e = 2 ** 32;
  const h = Math.floor(Math.random() * e);
  if (h % 33 === 0) return 1.00;
  const r = (100 * e - h) / (e - h);
  const result = Math.floor(r) / 100;
  return Math.max(1.01, Math.min(150.0, Math.round(result * 100) / 100));
};

/**
 * 2. Slots Engineered Grid
 */
export interface SlotSymbol {
  id: string;
  label: string;
  icon: string;
  multiplier: number;
}

export const generateEngineeredSlotsGrid = (
  betAmount: number,
  allSymbols: SlotSymbol[],
  getRandomSymbol: () => SlotSymbol
): SlotSymbol[][] => {
  const stage = advanceGameOddsCycle('slots', betAmount);

  // Base random grid
  const grid: SlotSymbol[][] = [
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
  ];

  if (stage === 'HONEY_1') {
    // Draw 1: WIN MORE MONEY!
    // Pick a premium winning symbol (Diamond 25x, Bell 15x, or 777 100x)
    const winningSymbol = allSymbols[Math.floor(Math.random() * 4)]; // Top symbols
    // Force middle payline (row 1 across all 3 reels)
    grid[0][1] = winningSymbol;
    grid[1][1] = winningSymbol;
    grid[2][1] = winningSymbol;
    return grid;
  }

  if (stage === 'HONEY_2') {
    // Draw 2: Moderate win (Cherries 2x, Lemons 2x, Grapes 3x)
    const winningSymbol = allSymbols[4 + Math.floor(Math.random() * 3)];
    grid[0][0] = winningSymbol;
    grid[1][0] = winningSymbol;
    grid[2][0] = winningSymbol;
    return grid;
  }

  if (stage === 'TRAP_3' || stage === 'CHASE_DEFICIT') {
    // Draw 3 or Chasing: Near-miss on paylines, 0 payline completion (reclaims money)
    const teaseSymbol = allSymbols[0]; // Crown / 777
    grid[0][1] = teaseSymbol;
    grid[1][1] = teaseSymbol;
    grid[2][1] = allSymbols[7]; // Cherry breaks the 3-of-a-kind!
    // Break any accidental line 1 & line 3 wins
    if (grid[0][0].id === grid[1][0].id && grid[1][0].id === grid[2][0].id) {
      grid[2][0] = allSymbols[5];
    }
    if (grid[0][2].id === grid[1][2].id && grid[1][2].id === grid[2][2].id) {
      grid[2][2] = allSymbols[6];
    }
    return grid;
  }

  // FAIR_LOW: Natural random outcome
  return grid;
};

/**
 * 3. Mines Engineered Tile Outcome
 */
export const evaluateMinesTileClick = (
  betAmount: number,
  uncoveredCount: number,
  isOriginallyMine: boolean
): boolean => {
  const stage = getGameOddsStage('mines', betAmount);

  if (stage === 'HONEY_1') {
    // Draw 1: First 4 clicks are guaranteed safe diamonds!
    if (uncoveredCount < 4) return false; // NOT a mine
  } else if (stage === 'HONEY_2') {
    // Draw 2: First 3 clicks are guaranteed safe diamonds!
    if (uncoveredCount < 3) return false;
  } else if (stage === 'TRAP_3') {
    // Draw 3: The Trap! After 1st or 2nd click, force a detonation!
    if (uncoveredCount >= 1 && Math.random() < 0.85) {
      return true; // Force mine!
    }
  } else if (stage === 'CHASE_DEFICIT') {
    // Chasing: High chance to hit mine early
    if (uncoveredCount >= 1 && Math.random() < 0.75) {
      return true;
    }
  }

  return isOriginallyMine;
};

/**
 * 4. Roulette Engineered Winning Number
 */
export const getEngineeredRouletteNumber = (
  bets: Record<string, number>,
  doesNumberWin: (num: number, currentBets: Record<string, number>) => boolean,
  allNumbers: number[],
  totalBetAmount: number
): number => {
  const stage = advanceGameOddsCycle('roulette', totalBetAmount);

  // If no bets, return random
  const hasBets = Object.values(bets).some((v) => v > 0);
  if (!hasBets) {
    return allNumbers[Math.floor(Math.random() * allNumbers.length)];
  }

  const winningNumbers = allNumbers.filter((n) => doesNumberWin(n, bets));
  const losingNumbers = allNumbers.filter((n) => !doesNumberWin(n, bets));

  if (stage === 'HONEY_1') {
    // Draw 1: Land on a winning number!
    if (winningNumbers.length > 0) {
      return winningNumbers[Math.floor(Math.random() * winningNumbers.length)];
    }
  }

  if (stage === 'HONEY_2') {
    // Draw 2: 75% chance to land on a winning number
    if (winningNumbers.length > 0 && Math.random() < 0.75) {
      return winningNumbers[Math.floor(Math.random() * winningNumbers.length)];
    }
  }

  if (stage === 'TRAP_3' || stage === 'CHASE_DEFICIT') {
    // Draw 3 & Chasing: Land on a losing number or 0
    if (losingNumbers.length > 0 && Math.random() < 0.95) {
      return losingNumbers[Math.floor(Math.random() * losingNumbers.length)];
    }
  }

  // FAIR_LOW or fallback
  return allNumbers[Math.floor(Math.random() * allNumbers.length)];
};

/**
 * 5. Dice Engineered Roll
 */
export const getEngineeredDiceRoll = (
  betAmount: number,
  targetNumber: number,
  rollMode: 'under' | 'over'
): number => {
  const stage = advanceGameOddsCycle('dice', betAmount);

  if (stage === 'HONEY_1') {
    // Draw 1: Win easily!
    if (rollMode === 'under') {
      return Math.round((Math.max(2, targetNumber * 0.45) + Math.random() * 5) * 100) / 100;
    } else {
      return Math.round((Math.min(97, targetNumber + (100 - targetNumber) * 0.55) - Math.random() * 5) * 100) / 100;
    }
  }

  if (stage === 'HONEY_2') {
    // Draw 2: Win again!
    if (rollMode === 'under') {
      return Math.round((Math.max(2, targetNumber * 0.75) + Math.random() * 3) * 100) / 100;
    } else {
      return Math.round((Math.min(97, targetNumber + (100 - targetNumber) * 0.35) - Math.random() * 3) * 100) / 100;
    }
  }

  if (stage === 'TRAP_3') {
    // Draw 3: The Trap! Near-miss that loses by 0.5 - 2.5 points
    if (rollMode === 'under') {
      return Math.min(99.0, Math.round((targetNumber + 0.65 + Math.random() * 1.8) * 100) / 100);
    } else {
      return Math.max(1.0, Math.round((targetNumber - 0.65 - Math.random() * 1.8) * 100) / 100);
    }
  }

  if (stage === 'CHASE_DEFICIT') {
    // Chasing with high bets: 82% chance of landing in losing zone
    if (Math.random() < 0.82) {
      if (rollMode === 'under') {
        return Math.min(99.0, Math.round((targetNumber + 1.2 + Math.random() * 8) * 100) / 100);
      } else {
        return Math.max(1.0, Math.round((targetNumber - 1.2 - Math.random() * 8) * 100) / 100);
      }
    }
  }

  // FAIR_LOW: Natural 0.01 - 99.99
  return Math.round(Math.random() * 10000) / 100;
};

/**
 * 6. Blackjack Engineered Modifier
 */
export const getEngineeredBlackjackPlan = (betAmount: number): {
  stage: OddsCycleStage;
  boostPlayerHands: boolean;
  dealerBustFavor: boolean;
  dealerTrap: boolean;
} => {
  const stage = advanceGameOddsCycle('blackjack', betAmount);

  return {
    stage,
    boostPlayerHands: stage === 'HONEY_1' || stage === 'HONEY_2',
    dealerBustFavor: stage === 'HONEY_1',
    dealerTrap: stage === 'TRAP_3' || stage === 'CHASE_DEFICIT',
  };
};
