-- Fix the foreign key constraint issue
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing users table and recreate without the problematic foreign key
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate users table without foreign key constraint to auth.users
CREATE TABLE public.users (
    id UUID PRIMARY KEY,  -- Remove the REFERENCES auth.users(id) constraint
    username VARCHAR(50) UNIQUE NOT NULL,
    coins INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on the new table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Also recreate the other tables that might reference users
DROP TABLE IF EXISTS public.bet_slips CASCADE;
DROP TABLE IF EXISTS public.bet_slip_items CASCADE;
DROP TABLE IF EXISTS public.leaderboard_cache CASCADE;

-- Recreate bet_slips table
CREATE TABLE public.bet_slips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,  -- Remove foreign key constraint
    total_stake INTEGER NOT NULL,
    total_odds DECIMAL(8,2) NOT NULL,
    potential_win INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    actual_win INTEGER DEFAULT 0,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Recreate bet_slip_items table
CREATE TABLE public.bet_slip_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bet_slip_id UUID NOT NULL,  -- Remove foreign key constraint
    match_id INTEGER REFERENCES public.matches(id) NOT NULL,
    bet_type VARCHAR(10) NOT NULL,
    odds DECIMAL(4,2) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    league VARCHAR(100) NOT NULL
);

-- Recreate leaderboard_cache table
CREATE TABLE public.leaderboard_cache (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,  -- Remove foreign key constraint
    username VARCHAR(50) NOT NULL,
    total_coins_won INTEGER DEFAULT 0,
    biggest_odds DECIMAL(8,2) DEFAULT 0,
    total_successful_odds DECIMAL(8,2) DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on all tables
ALTER TABLE public.bet_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_slip_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache DISABLE ROW LEVEL SECURITY;
