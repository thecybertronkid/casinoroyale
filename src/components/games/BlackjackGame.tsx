import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { sound } from '../../utils/sound';
import { getRiskPenalty, getDisplayedOdds } from '../../utils/oddsModifier';
import { 
  Layers, 
  Plus, 
  Hand, 
  Zap, 
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: string;
  value: number;
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const RANKS = [
  { rank: '2', value: 2 },
  { rank: '3', value: 3 },
  { rank: '4', value: 4 },
  { rank: '5', value: 5 },
  { rank: '6', value: 6 },
  { rank: '7', value: 7 },
  { rank: '8', value: 8 },
  { rank: '9', value: 9 },
  { rank: '10', value: 10 },
  { rank: 'J', value: 10 },
  { rank: 'Q', value: 10 },
  { rank: 'K', value: 10 },
  { rank: 'A', value: 11 },
];

export const BlackjackGame: React.FC = () => {
  const { balance, placeBet, creditWinnings, recordLoss } = useWallet();

  const [betAmount, setBetAmount] = useState<number>(25);
  const [activeBet, setActiveBet] = useState<number>(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gamePhase, setGamePhase] = useState<'betting' | 'playerTurn' | 'dealerTurn' | 'ended'>('betting');
  const [gameResult, setGameResult] = useState<string>('');
  const [resultType, setResultType] = useState<'win' | 'loss' | 'push' | 'blackjack' | null>(null);

  const currentBetValue = gamePhase === 'betting' ? betAmount : activeBet;
  const riskPenalty = getRiskPenalty(currentBetValue);
  const displayedOdds = getDisplayedOdds(currentBetValue);

  const createDeck = (): Card[] => {
    const newDeck: Card[] = [];
    SUITS.forEach((suit) => {
      RANKS.forEach((r) => {
        newDeck.push({ suit, rank: r.rank, value: r.value });
      });
    });
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  };

  const calculateScore = (hand: Card[]): { score: number; isSoft: boolean } => {
    let score = 0;
    let aces = 0;

    hand.forEach((card) => {
      score += card.value;
      if (card.rank === 'A') aces += 1;
    });

    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }

    return { score, isSoft: aces > 0 };
  };

  const dealCards = () => {
    if (balance < betAmount) return;
    const ok = placeBet(betAmount, 'blackjack');
    if (!ok) return;

    setActiveBet(betAmount);
    setGameResult('');
    setResultType(null);

    const newDeck = createDeck();
    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = newDeck.pop()!;

    const pHand = [p1, p2];
    const dHand = [d1, d2];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setDeck(newDeck);
    sound.playCard();

    const pScore = calculateScore(pHand).score;
    const dScore = calculateScore(dHand).score;

    if (pScore === 21 && dScore === 21) {
      setGamePhase('ended');
      setResultType('push');
      setGameResult('Both hit Natural 21. Standoff Push.');
      creditWinnings('blackjack', 'Blackjack Royale', betAmount, betAmount, 1, 'Natural 21 Standoff');
      return;
    }

    if (pScore === 21) {
      setGamePhase('ended');
      setResultType('blackjack');
      const payout = Math.round(betAmount * 2.5 * 100) / 100;
      setGameResult('NATURAL BLACKJACK! Payout 3:2');
      creditWinnings('blackjack', 'Blackjack Royale', betAmount, payout, 2.5, 'Natural 21 (3:2)');
      return;
    }

    if (dScore === 21) {
      setGamePhase('ended');
      setResultType('loss');
      setGameResult("Dealer holds Natural Blackjack. Dealer wins.");
      recordLoss('blackjack', 'Blackjack Royale', betAmount, "Dealer Natural Blackjack");
      return;
    }

    setGamePhase('playerTurn');
  };

  const hit = () => {
    if (gamePhase !== 'playerTurn' || deck.length === 0) return;
    sound.playCard();

    const newDeck = [...deck];
    let card = newDeck.pop()!;

    // Reality: Higher bet exponentially forces a bust when score is 12-16
    const currScore = calculateScore(playerHand).score;
    if (currScore >= 12 && currScore <= 16 && Math.random() < riskPenalty) {
      card = { suit: '♠', rank: '10', value: 10 };
    }

    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);

    const score = calculateScore(newHand).score;
    if (score > 21) {
      setGamePhase('ended');
      setResultType('loss');
      setGameResult(`Bust with ${score}. Dealer wins.`);
      recordLoss('blackjack', 'Blackjack Royale', activeBet, `Busted with ${score}`);
    } else if (score === 21) {
      stand(newHand, dealerHand, newDeck);
    }
  };

  const doubleDown = () => {
    if (gamePhase !== 'playerTurn' || playerHand.length !== 2) return;
    if (balance < activeBet) return;

    const ok = placeBet(activeBet, 'blackjack');
    if (!ok) return;

    const newBet = activeBet * 2;
    setActiveBet(newBet);
    sound.playChip();

    const newDeck = [...deck];
    let card = newDeck.pop()!;

    const pScore = calculateScore(playerHand).score;
    if (pScore >= 11 && Math.random() < getRiskPenalty(newBet)) {
      card = { suit: '♦', rank: '2', value: 2 }; // Give poor low card
    }

    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);

    const finalScore = calculateScore(newHand).score;
    if (finalScore > 21) {
      setGamePhase('ended');
      setResultType('loss');
      setGameResult(`Double down busted with ${finalScore}.`);
      recordLoss('blackjack', 'Blackjack Royale', newBet, `Double down bust (${finalScore})`);
    } else {
      stand(newHand, dealerHand, newDeck, newBet);
    }
  };

  const stand = (
    currentPHand = playerHand,
    currentDHand = dealerHand,
    currentDeck = deck,
    currentBet = activeBet
  ) => {
    if (gamePhase === 'ended') return;
    setGamePhase('dealerTurn');
    sound.playCard();

    const pScore = calculateScore(currentPHand).score;
    let dHand = [...currentDHand];
    let dDeck = [...currentDeck];
    let dScore = calculateScore(dHand).score;

    const penalty = getRiskPenalty(currentBet);

    const drawDealerCards = () => {
      // In reality: High bet exponentially forces dealer to draw winning card
      if (dScore < pScore && pScore <= 20 && Math.random() < penalty) {
        const needed = Math.min(10, Math.max(1, pScore + 1 - dScore));
        dHand.push({ suit: '♣', rank: needed === 10 ? 'K' : String(needed), value: needed });
        dScore = calculateScore(dHand).score;
      }

      while (dScore < 17 && dDeck.length > 0) {
        sound.playCard();
        const nextCard = dDeck.pop()!;
        dHand.push(nextCard);
        dScore = calculateScore(dHand).score;
      }

      setDealerHand(dHand);
      setDeck(dDeck);
      setGamePhase('ended');

      if (dScore > 21) {
        setResultType('win');
        setGameResult(`Dealer busts with ${dScore}. You win.`);
        creditWinnings('blackjack', 'Blackjack Royale', currentBet, currentBet * 2, 2, `Dealer busted (${dScore})`);
      } else if (pScore > dScore) {
        setResultType('win');
        setGameResult(`Player wins ${pScore} vs ${dScore}.`);
        creditWinnings('blackjack', 'Blackjack Royale', currentBet, currentBet * 2, 2, `${pScore} beat dealer's ${dScore}`);
      } else if (pScore < dScore) {
        setResultType('loss');
        setGameResult(`Dealer wins ${dScore} vs ${pScore}.`);
        recordLoss('blackjack', 'Blackjack Royale', currentBet, `Dealer ${dScore} beat player ${pScore}`);
      } else {
        setResultType('push');
        setGameResult(`Tie standoff at ${pScore}. Push.`);
        creditWinnings('blackjack', 'Blackjack Royale', currentBet, currentBet, 1, `Push at ${pScore}`);
      }
    };

    setTimeout(drawDealerCards, 550);
  };

  const playerScore = calculateScore(playerHand).score;
  const dealerVisibleScore =
    gamePhase === 'playerTurn'
      ? dealerHand.length > 0
        ? dealerHand[0].value
        : 0
      : calculateScore(dealerHand).score;

  const renderCard = (card: Card, isHidden: boolean = false, isNewDeal: boolean = false) => {
    if (isHidden) {
      return (
        <div className={`w-14 h-20 sm:w-16 sm:h-24 rounded-lg bg-[#0e1017] border border-[#d4af37]/40 shadow-lg flex items-center justify-center transition-transform hover:-translate-y-1 ${isNewDeal ? 'animate-deal-card' : ''}`}>
          <span className="font-luxury text-xs text-[#d4af37]/80 font-bold tracking-wider">PB</span>
        </div>
      );
    }

    const isRed = card.suit === '♥' || card.suit === '♦';

    return (
      <div className={`w-14 h-20 sm:w-16 sm:h-24 rounded-lg bg-[#fafafa] border border-slate-300 shadow-md p-1.5 flex flex-col justify-between select-none transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl ${isNewDeal ? 'animate-deal-card' : ''}`}>
        <div className={`text-xs font-mono font-bold leading-none ${isRed ? 'text-red-700' : 'text-slate-900'}`}>
          {card.rank}
        </div>
        <div className={`text-xl sm:text-2xl text-center leading-none ${isRed ? 'text-red-700' : 'text-slate-900'}`}>
          {card.suit}
        </div>
        <div className={`text-xs font-mono font-bold leading-none text-right ${isRed ? 'text-red-700' : 'text-slate-900'}`}>
          {card.rank}
        </div>
      </div>
    );
  };

  const isPlayerBusted = playerScore > 21;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-[#0e1017] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#d4af37]">
              <Layers className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="font-luxury text-xl font-bold text-white tracking-wide">
                BLACKJACK ROYALE
              </h2>
              <p className="text-xs text-slate-400 font-light">
                Dealer stands on 17 • Natural pays 3:2
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-medium">Table Stake</span>
            <span className="font-mono text-sm font-semibold text-[#f3e5ab]">
              ₹{currentBetValue}
            </span>
          </div>
        </div>

        {/* Displayed Odds: Shows higher bet -> higher winning probability */}
        <div className={`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-[11px] transition-all duration-300 ${displayedOdds.glowClass}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            <span className="text-slate-300 font-medium">Player Table Advantage:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className={`font-mono font-semibold ${displayedOdds.themeColor}`}>
              {displayedOdds.badgeText}
            </span>
          </div>
        </div>

        {/* Minimalist Felt Table */}
        <div className="p-6 sm:p-8 rounded-xl bg-[#091a13] border border-emerald-950/80 min-h-[320px] flex flex-col justify-between relative shadow-inner">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2 text-xs">
              <span className="text-emerald-300/80 font-medium tracking-wider uppercase text-[10px]">Dealer</span>
              {dealerHand.length > 0 && (
                <span className="font-mono text-[#f3e5ab] text-xs font-medium px-2 py-0.5 rounded bg-black/40 border border-white/5">
                  {gamePhase === 'playerTurn' ? `${dealerVisibleScore}+` : dealerVisibleScore}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 min-h-[96px]">
              {dealerHand.length === 0 ? (
                <div className="text-xs text-emerald-400/40 py-6">Cards dealt upon wager</div>
              ) : (
                dealerHand.map((card, idx) => (
                  <div key={idx}>{renderCard(card, idx === 1 && gamePhase === 'playerTurn', true)}</div>
                ))
              )}
            </div>
          </div>

          {gameResult && (
            <div className="my-3 py-1.5 px-4 rounded-lg bg-black/70 border border-white/10 mx-auto text-center animate-in zoom-in-95 duration-200">
              <span className={`text-xs font-medium ${
                resultType === 'win' || resultType === 'blackjack'
                  ? 'text-emerald-300'
                  : resultType === 'push'
                  ? 'text-[#f3e5ab]'
                  : 'text-rose-300'
              }`}>
                {gameResult}
              </span>
            </div>
          )}

          <div className={`flex flex-col items-center mt-3 ${isPlayerBusted ? 'animate-shake' : ''}`}>
            <div className="flex items-center gap-2 min-h-[96px] mb-2">
              {playerHand.length === 0 ? (
                <div className="text-xs text-emerald-400/40 py-6">Player position ready</div>
              ) : (
                playerHand.map((card, idx) => <div key={idx}>{renderCard(card, false, true)}</div>)
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-300/80 font-medium tracking-wider uppercase text-[10px]">Your Hand</span>
              {playerHand.length > 0 && (
                <span className={`font-mono text-xs font-medium px-2 py-0.5 rounded ${
                  isPlayerBusted
                    ? 'text-rose-400 bg-rose-950/60 border border-rose-800/40'
                    : playerScore === 21
                    ? 'text-[#f3e5ab] bg-[#d4af37]/20 border border-[#d4af37]/40 animate-win-pulse'
                    : 'text-[#f3e5ab] bg-black/40 border border-white/5'
                }`}>
                  {playerScore}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Minimalist Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/[0.06]">
          {gamePhase === 'betting' || gamePhase === 'ended' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Bet:</span>
                <div className="flex items-center bg-[#0a0b10] border border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setBetAmount((p) => Math.max(5, p - 10))}
                    className="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold transition flex items-center justify-center text-xs active:scale-90"
                  >
                    -
                  </button>
                  <div className="px-3 min-w-[65px] text-center font-mono font-semibold text-[#f3e5ab] text-sm">
                    ₹{betAmount}
                  </div>
                  <button
                    onClick={() => setBetAmount((p) => Math.min(balance > 0 ? balance : 500, p + 10))}
                    className="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 font-bold transition flex items-center justify-center text-xs active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                disabled={balance < betAmount}
                onClick={dealCards}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider gold-gradient-btn"
              >
                Deal Hand (₹{betAmount})
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2.5 w-full">
              <button
                disabled={gamePhase !== 'playerTurn'}
                onClick={hit}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 border border-white/10 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Hit</span>
              </button>

              <button
                disabled={gamePhase !== 'playerTurn'}
                onClick={() => stand()}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 border border-white/10 active:scale-95"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Stand</span>
              </button>

              {playerHand.length === 2 && balance >= activeBet && (
                <button
                  disabled={gamePhase !== 'playerTurn'}
                  onClick={doubleDown}
                  className="flex-1 py-2.5 rounded-xl gold-gradient-btn text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Double (₹{activeBet})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
