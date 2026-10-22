/**
 * Dynamic Risk & Odds Scaling for "POISA BORBAAD"
 * Rule: As bidding amount increases, the odds of winning decrease.
 */

export const getRiskPenalty = (betAmount: number, maxStandardBet = 250): number => {
  // Low bets (₹5 - ₹15) experience minimal to zero penalty
  if (betAmount <= 10) return 0.0;
  
  // Scales progressively from 0.0 at ₹10 to ~0.70 at ₹250+
  const normalized = Math.min(1.0, (betAmount - 10) / (maxStandardBet - 10));
  return Math.pow(normalized, 0.85) * 0.70; // Exponential steepening
};

/**
 * Adjust a win/loss boolean check against the dynamic penalty
 */
export const evaluateWithBetPenalty = (baseWon: boolean, betAmount: number): boolean => {
  if (!baseWon) return false;
  const penalty = getRiskPenalty(betAmount);
  // Higher bet -> higher chance to nullify a win
  if (Math.random() < penalty) {
    return false;
  }
  return true;
};
