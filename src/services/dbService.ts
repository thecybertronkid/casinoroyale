import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile } from '../types/auth';
import type { BetHistoryItem, PlayerStats, GameId } from '../types';

export const dbService = {
  /**
   * Upserts the user profile in the database and ensures an initial wallet is provisioned.
   */
  async syncUserProfile(user: UserProfile): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Upsert user profile
      const { error: profileErr } = await supabase
        .from('users_profile')
        .upsert(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.picture || '',
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileErr) {
        console.warn('Supabase profile sync error:', profileErr.message);
        return;
      }

      // 2. Ensure initial wallet row exists
      const { data: existingWallet, error: fetchWalletErr } = await supabase
        .from('user_wallets')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchWalletErr) {
        console.warn('Supabase fetch wallet warning:', fetchWalletErr.message);
      }

      if (!existingWallet) {
        await supabase.from('user_wallets').insert({
          user_id: user.id,
          balance: 500.0,
          total_wagered: 0,
          total_won: 0,
          total_lost: 0,
          net_profit: 0,
          total_bets: 0,
          biggest_win: 0,
          highest_multiplier: 1.0,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Database syncUserProfile warning:', err);
    }
  },

  /**
   * Fetches the user's wallet balance, stats, and historical bets from Supabase.
   */
  async loadUserData(
    userId: string
  ): Promise<{ balance: number; stats: PlayerStats; history: BetHistoryItem[] } | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      // 1. Fetch wallet & aggregate stats
      const { data: walletData, error: walletErr } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletErr) {
        console.warn('Database loadUserData wallet error:', walletErr.message);
        return null;
      }
      if (!walletData) {
        return null;
      }

      // 2. Fetch recent bets (up to 100)
      const { data: betsData, error: betsErr } = await supabase
        .from('game_bets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (betsErr) {
        console.warn('Database loadUserData bets error:', betsErr.message);
      }

      const history: BetHistoryItem[] = (betsData || []).map((row) => ({
        id: row.id,
        game: row.game_id as GameId,
        gameName: row.game_name,
        betAmount: Number(row.bet_amount),
        payout: Number(row.payout),
        profit: Number(row.profit),
        multiplier: Number(row.multiplier),
        timestamp: new Date(row.created_at).getTime(),
        details: row.details || '',
      }));

      const stats: PlayerStats = {
        totalWagered: Number(walletData.total_wagered) || 0,
        totalWon: Number(walletData.total_won) || 0,
        totalLost: Number(walletData.total_lost) || 0,
        netProfit: Number(walletData.net_profit) || 0,
        totalBets: Number(walletData.total_bets) || 0,
        biggestWin: Number(walletData.biggest_win) || 0,
        highestMultiplier: Number(walletData.highest_multiplier) || 1,
      };

      return {
        balance: Number(walletData.balance),
        stats,
        history,
      };
    } catch (err) {
      console.warn('Database loadUserData error:', err);
      return null;
    }
  },

  /**
   * Logs a bet transaction and updates user wallet balance & stats in the database.
   */
  async saveBetTransaction(
    userId: string,
    betItem: BetHistoryItem,
    balance: number,
    stats: PlayerStats
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Insert wager into game_bets
      const outcome = betItem.payout > 0 ? 'win' : 'loss';
      await supabase.from('game_bets').insert({
        id: betItem.id,
        user_id: userId,
        game_id: betItem.game,
        game_name: betItem.gameName,
        bet_amount: betItem.betAmount,
        outcome,
        payout: betItem.payout,
        profit: betItem.profit,
        multiplier: betItem.multiplier,
        details: betItem.details,
        created_at: new Date(betItem.timestamp).toISOString(),
      });

      // 2. Update user_wallets
      await supabase
        .from('user_wallets')
        .update({
          balance,
          total_wagered: stats.totalWagered,
          total_won: stats.totalWon,
          total_lost: stats.totalLost,
          net_profit: stats.netProfit,
          total_bets: stats.totalBets,
          biggest_win: stats.biggestWin,
          highest_multiplier: stats.highestMultiplier,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Database saveBetTransaction error:', err);
    }
  },

  /**
   * Updates balance in the database (e.g. for relief credits reload).
   */
  async updateWalletBalance(userId: string, newBalance: number): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase
        .from('user_wallets')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Database updateWalletBalance error:', err);
    }
  },

  /**
   * Resets the user's wallet back to ₹500 in the database.
   */
  async resetUserWallet(userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase
        .from('user_wallets')
        .update({
          balance: 500.0,
          total_wagered: 0,
          total_won: 0,
          total_lost: 0,
          net_profit: 0,
          total_bets: 0,
          biggest_win: 0,
          highest_multiplier: 1.0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      await supabase.from('game_bets').delete().eq('user_id', userId);
    } catch (err) {
      console.warn('Database resetUserWallet error:', err);
    }
  },
};
