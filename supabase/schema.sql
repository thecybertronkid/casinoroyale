-- ==============================================================================
-- POISA BORBAAD Database Schema for Supabase (PostgreSQL)
-- Run this script in your Supabase project's SQL Editor
-- ==============================================================================

-- 1. Create table for registered user profiles (Google OAuth & Guests)
CREATE TABLE IF NOT EXISTS public.users_profile (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    is_banned BOOLEAN NOT NULL DEFAULT false,
    can_claim_relief BOOLEAN NOT NULL DEFAULT true,
    restricted_games TEXT[] NOT NULL DEFAULT '{}',
    max_bet_limit NUMERIC(14, 2) DEFAULT NULL,
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- In case table already exists without newer columns, add them safely:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'is_banned') THEN
        ALTER TABLE public.users_profile ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'can_claim_relief') THEN
        ALTER TABLE public.users_profile ADD COLUMN can_claim_relief BOOLEAN NOT NULL DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'restricted_games') THEN
        ALTER TABLE public.users_profile ADD COLUMN restricted_games TEXT[] NOT NULL DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'max_bet_limit') THEN
        ALTER TABLE public.users_profile ADD COLUMN max_bet_limit NUMERIC(14, 2) DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'admin_notes') THEN
        ALTER TABLE public.users_profile ADD COLUMN admin_notes TEXT DEFAULT '';
    END IF;
END $$;

-- 2. Create table for user wallets and aggregate player statistics
CREATE TABLE IF NOT EXISTS public.user_wallets (
    user_id TEXT PRIMARY KEY REFERENCES public.users_profile(id) ON DELETE CASCADE,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 500.00,
    total_wagered NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_won NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_lost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_profit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_bets INTEGER NOT NULL DEFAULT 0,
    biggest_win NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    highest_multiplier NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create table for detailed game history and wager logs
CREATE TABLE IF NOT EXISTS public.game_bets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users_profile(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    game_name TEXT NOT NULL,
    bet_amount NUMERIC(14, 2) NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('win', 'loss')),
    payout NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    profit NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    multiplier NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_game_bets_user_id ON public.game_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_game_bets_created_at ON public.game_bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_bets_game_id ON public.game_bets(game_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_bets ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for Anon & Authenticated access via public client
DROP POLICY IF EXISTS "Public access users_profile" ON public.users_profile;
CREATE POLICY "Public access users_profile" ON public.users_profile 
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access user_wallets" ON public.user_wallets;
CREATE POLICY "Public access user_wallets" ON public.user_wallets 
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access game_bets" ON public.game_bets;
CREATE POLICY "Public access game_bets" ON public.game_bets 
    FOR ALL USING (true) WITH CHECK (true);
