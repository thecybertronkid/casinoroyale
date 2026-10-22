/**
 * Dynamic Risk & Odds Engine for "POISA BORBAAD"
 * 
 * FRONTEND ILLUSION:
 * Displays alluring "High Roller Stake / VIP Boosted Odds" that visually show higher bets
 * dramatically boosting win probability (from 49.5% up to 99.4%).
 * 
 * MATHEMATICAL REALITY:
 * In reality, increasing the wager exponentially decreases the actual chances of winning to near 0.
 * At small bets (₹5-₹10): fair base odds.
 * At medium bets (₹50-₹100): ~80-92% penalty.
 * At high stakes (₹150+): ~98.5% - 99.5% penalty (near 0% real win rate).
 */

export interface DisplayedOddsInfo {
  tierName: string;
  displayedWinRate: string;
  multiplierText: string;
  badgeText: string;
  themeColor: string;
  glowClass: string;
}

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
 * In reality: As the bidding amount increases, the chance of winning drops exponentially to near 0.
 * Exponential penalty curve: penalty = 1 - e^(-k * delta)
 */
export const getRiskPenalty = (betAmount: number): number => {
  if (betAmount <= 10) return 0.0;

  // Steep exponential growth of penalty as bet grows
  const delta = betAmount - 10;
  const decayConstant = 0.024; // Scales rapidly towards near 0 win chance
  const rawPenalty = 1 - Math.exp(-decayConstant * delta);

  // High bets (e.g. ₹150 - ₹500+) reach 0.985 - 0.995 (killing 99.5% of would-be wins)
  return Math.min(0.995, Math.max(0, rawPenalty));
};

/**
 * Adjust a win/loss boolean check against the exponential penalty.
 */
export const evaluateWithBetPenalty = (baseWon: boolean, betAmount: number): boolean => {
  if (!baseWon) return false;
  const penalty = getRiskPenalty(betAmount);
  // Higher bet -> higher chance to nullify a win into a loss
  if (Math.random() < penalty) {
    return false;
  }
  return true;
};
