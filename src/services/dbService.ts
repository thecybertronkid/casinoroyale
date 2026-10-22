import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, UserRestrictions, AdminUserData } from '../types/auth';
import type { BetHistoryItem, PlayerStats, GameId } from '../types';

export const dbService = {
  /**
   * Upserts the user profile in the database and ensures an initial wallet is provisioned.
   */
  async syncUserProfile(user: UserProfile): Promise<void> {
    // 1. Always record in local registry so admin can see user even if offline
    try {
      const registryRaw = localStorage.getItem('pb_all_user_registry') || '[]';
      const registry: UserProfile[] = JSON.parse(registryRaw);
      const idx = registry.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        registry[idx] = { ...registry[idx], ...user, lastSeenAt: Date.now() };
      } else {
        registry.push({ ...user, lastSeenAt: Date.now() });
      }
      localStorage.setItem('pb_all_user_registry', JSON.stringify(registry));
    } catch {
      // ignore
    }

    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 2. Upsert user profile in Supabase
      const { error: profileErr } = await supabase
        .from('users_profile')
        .upsert(
          {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.picture || '',
            is_banned: user.isBanned ?? false,
            can_claim_relief: user.canClaimRelief ?? true,
            restricted_games: user.restrictedGames ?? [],
            max_bet_limit: user.maxBetLimit ?? null,
            admin_notes: user.adminNotes ?? '',
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (profileErr) {
        console.warn('Supabase profile sync error:', profileErr.message);
      }

      // 3. Ensure initial wallet row exists
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
  ): Promise<{ balance: number; stats: PlayerStats; history: BetHistoryItem[]; restrictions?: UserRestrictions } | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      // 1. Fetch profile restrictions
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('is_banned, can_claim_relief, restricted_games, max_bet_limit, admin_notes')
        .eq('id', userId)
        .maybeSingle();

      // 2. Fetch wallet & aggregate stats
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

      // 3. Fetch recent bets (up to 100)
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

      const restrictions: UserRestrictions | undefined = profileData
        ? {
            isBanned: profileData.is_banned ?? false,
            canClaimRelief: profileData.can_claim_relief ?? true,
            restrictedGames: profileData.restricted_games ?? [],
            maxBetLimit: profileData.max_bet_limit ? Number(profileData.max_bet_limit) : null,
            adminNotes: profileData.admin_notes || '',
          }
        : undefined;

      return {
        balance: Number(walletData.balance),
        stats,
        history,
        restrictions,
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

  // ============================================================================
  // ADMIN MONITORING & MANAGEMENT METHODS
  // ============================================================================

  /**
   * Admin: Fetches all registered users along with their wallet balance, wager stats, and restrictions.
   */
  async fetchAllUsers(): Promise<AdminUserData[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: profiles, error: pErr } = await supabase
          .from('users_profile')
          .select('*')
          .order('last_seen_at', { ascending: false });

        if (!pErr && profiles && profiles.length > 0) {
          const { data: wallets } = await supabase.from('user_wallets').select('*');
          const walletMap = new Map((wallets || []).map((w) => [w.user_id, w]));

          return profiles.map((p) => {
            const w = walletMap.get(p.id) || {};
            const profile: UserProfile = {
              id: p.id,
              email: p.email,
              name: p.name,
              picture: p.avatar_url,
              joinedAt: new Date(p.created_at).getTime(),
              lastSeenAt: new Date(p.last_seen_at).getTime(),
              isBanned: p.is_banned ?? false,
              canClaimRelief: p.can_claim_relief ?? true,
              restrictedGames: p.restricted_games ?? [],
              maxBetLimit: p.max_bet_limit ? Number(p.max_bet_limit) : null,
              adminNotes: p.admin_notes || '',
            };

            return {
              profile,
              balance: Number(w.balance ?? 500),
              totalWagered: Number(w.total_wagered ?? 0),
              totalWon: Number(w.total_won ?? 0),
              totalLost: Number(w.total_lost ?? 0),
              netProfit: Number(w.net_profit ?? 0),
              totalBets: Number(w.total_bets ?? 0),
              biggestWin: Number(w.biggest_win ?? 0),
              highestMultiplier: Number(w.highest_multiplier ?? 1),
              updatedAt: w.updated_at || p.last_seen_at,
            };
          });
        }
      } catch (err) {
        console.warn('Failed to fetch users from Supabase, checking local registry:', err);
      }
    }

    // Fallback: Read local registry
    try {
      const registryRaw = localStorage.getItem('pb_all_user_registry') || '[]';
      let registry: UserProfile[] = JSON.parse(registryRaw);

      // If registry is empty (e.g. fresh admin check), seed with sample high-roller accounts so admin has data to test
      if (registry.length === 0) {
        registry = [
          {
            id: 'sample_vip_1',
            email: 'ayan.highroller@gmail.com',
            name: 'Ayan K (High Roller)',
            picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ayan',
            joinedAt: Date.now() - 86400000 * 3,
            lastSeenAt: Date.now() - 3600000 * 2,
            isBanned: false,
            canClaimRelief: true,
            restrictedGames: [],
            maxBetLimit: null,
            adminNotes: 'VIP Tier Emperor club prospect',
          },
          {
            id: 'sample_vip_2',
            email: 'rajesh.sharma@yahoo.com',
            name: 'Rajesh Sharma',
            picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rajesh',
            joinedAt: Date.now() - 86400000 * 7,
            lastSeenAt: Date.now() - 3600000 * 8,
            isBanned: false,
            canClaimRelief: false,
            restrictedGames: ['crash'],
            maxBetLimit: 100,
            adminNotes: 'Restricted from crash after high multiplier streak',
          },
        ];
        localStorage.setItem('pb_all_user_registry', JSON.stringify(registry));
      }

      return registry.map((p) => {
        const balRaw = localStorage.getItem(`pb_u_${p.id}_balance`);
        const statsRaw = localStorage.getItem(`pb_u_${p.id}_stats`);
        const balance = balRaw ? parseFloat(balRaw) : 500;
        let stats: PlayerStats = {
          totalWagered: 1200,
          totalWon: 800,
          totalLost: 1500,
          netProfit: -700,
          totalBets: 18,
          biggestWin: 350,
          highestMultiplier: 4.5,
        };
        if (statsRaw) {
          try {
            stats = JSON.parse(statsRaw);
          } catch {
            // ignore
          }
        }

        const restrictionsRaw = localStorage.getItem(`pb_u_${p.id}_restrictions`);
        let currentRestrictions = { ...p };
        if (restrictionsRaw) {
          try {
            currentRestrictions = { ...currentRestrictions, ...JSON.parse(restrictionsRaw) };
          } catch {
            // ignore
          }
        }

        return {
          profile: currentRestrictions,
          balance,
          totalWagered: stats.totalWagered,
          totalWon: stats.totalWon,
          totalLost: stats.totalLost,
          netProfit: stats.netProfit,
          totalBets: stats.totalBets,
          biggestWin: stats.biggestWin,
          highestMultiplier: stats.highestMultiplier,
          updatedAt: new Date(p.lastSeenAt || p.joinedAt).toISOString(),
        };
      });
    } catch {
      return [];
    }
  },

  /**
   * Admin: Modifies user wallet balance (Add or Decrease credit)
   */
  async adminUpdateUserBalance(userId: string, newBalance: number): Promise<boolean> {
    const formattedBalance = Math.max(0, Math.round(newBalance * 100) / 100);

    // 1. Update localStorage
    localStorage.setItem(`pb_u_${userId}_balance`, formattedBalance.toString());

    // 2. Update Supabase if connected
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('user_wallets')
          .update({
            balance: formattedBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.warn('Supabase admin balance update error:', error.message);
        }
      } catch (err) {
        console.warn('Failed adminUpdateUserBalance on cloud:', err);
      }
    }
    return true;
  },

  /**
   * Admin: Updates user restrictions (ban, block relief, game exclusions, max bet limit, notes)
   */
  async adminUpdateUserRestrictions(
    userId: string,
    restrictions: Partial<UserRestrictions>
  ): Promise<boolean> {
    // 1. Update in local storage
    const currentRestRaw = localStorage.getItem(`pb_u_${userId}_restrictions`);
    let current: UserRestrictions = {
      isBanned: false,
      canClaimRelief: true,
      restrictedGames: [],
      maxBetLimit: null,
      adminNotes: '',
    };
    if (currentRestRaw) {
      try {
        current = { ...current, ...JSON.parse(currentRestRaw) };
      } catch {
        // ignore
      }
    }
    const updated = { ...current, ...restrictions };
    localStorage.setItem(`pb_u_${userId}_restrictions`, JSON.stringify(updated));

    // Also update in local registry
    try {
      const registryRaw = localStorage.getItem('pb_all_user_registry') || '[]';
      const registry: UserProfile[] = JSON.parse(registryRaw);
      const idx = registry.findIndex((u) => u.id === userId);
      if (idx >= 0) {
        registry[idx] = { ...registry[idx], ...updated };
        localStorage.setItem('pb_all_user_registry', JSON.stringify(registry));
      }
    } catch {
      // ignore
    }

    // 2. Update in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const payload: Record<string, unknown> = {};
        if (restrictions.isBanned !== undefined) payload.is_banned = restrictions.isBanned;
        if (restrictions.canClaimRelief !== undefined) payload.can_claim_relief = restrictions.canClaimRelief;
        if (restrictions.restrictedGames !== undefined) payload.restricted_games = restrictions.restrictedGames;
        if (restrictions.maxBetLimit !== undefined) payload.max_bet_limit = restrictions.maxBetLimit;
        if (restrictions.adminNotes !== undefined) payload.admin_notes = restrictions.adminNotes;

        const { error } = await supabase
          .from('users_profile')
          .update(payload)
          .eq('id', userId);

        if (error) {
          console.warn('Supabase admin restrictions update error:', error.message);
        }
      } catch (err) {
        console.warn('Failed adminUpdateUserRestrictions on cloud:', err);
      }
    }
    return true;
  },

  /**
   * Admin: Fetches complete bet history for a specific player
   */
  async adminFetchUserBets(userId: string): Promise<BetHistoryItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('game_bets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(150);

        if (!error && data) {
          return data.map((row) => ({
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
        }
      } catch (err) {
        console.warn('Failed adminFetchUserBets on cloud:', err);
      }
    }

    // Local fallback
    try {
      const historyRaw = localStorage.getItem(`pb_u_${userId}_history`);
      if (historyRaw) {
        return JSON.parse(historyRaw);
      }
    } catch {
      // ignore
    }

    // Sample mock bets for demo accounts
    return [
      {
        id: 'bet_101',
        game: 'roulette',
        gameName: 'European Roulette',
        betAmount: 50,
        payout: 100,
        profit: 50,
        multiplier: 2,
        timestamp: Date.now() - 3600000,
        details: 'Red 7 Hit',
      },
      {
        id: 'bet_102',
        game: 'crash',
        gameName: 'Ascent Multiplier',
        betAmount: 100,
        payout: 0,
        profit: -100,
        multiplier: 0,
        timestamp: Date.now() - 7200000,
        details: 'Crashed @ 1.45x',
      },
    ];
  },
};
