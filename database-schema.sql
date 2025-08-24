-- ScoreLeague Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Enable Row Level Security
-- Note: JWT secret is managed automatically by Supabase, no need to set it manually

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    coins INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table for storing match data
CREATE TABLE public.matches (
    id SERIAL PRIMARY KEY,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    league VARCHAR(100) NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, live, finished, cancelled
    home_score INTEGER DEFAULT NULL,
    away_score INTEGER DEFAULT NULL,
    odds_home DECIMAL(4,2) NOT NULL,
    odds_draw DECIMAL(4,2) NOT NULL,
    odds_away DECIMAL(4,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bets table for storing user bets
CREATE TABLE public.bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    match_id INTEGER REFERENCES public.matches(id) NOT NULL,
    bet_type VARCHAR(10) NOT NULL, -- 'home', 'draw', 'away'
    odds DECIMAL(4,2) NOT NULL,
    stake INTEGER NOT NULL,
    potential_win INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, won, lost, cancelled
    actual_win INTEGER DEFAULT 0,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Bet slips table for multi-bet combinations
CREATE TABLE public.bet_slips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    total_stake INTEGER NOT NULL,
    total_odds DECIMAL(8,2) NOT NULL,
    potential_win INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, won, lost, cancelled
    actual_win INTEGER DEFAULT 0,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Bet slip items (individual bets within a slip)
CREATE TABLE public.bet_slip_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bet_slip_id UUID REFERENCES public.bet_slips(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES public.matches(id) NOT NULL,
    bet_type VARCHAR(10) NOT NULL,
    odds DECIMAL(4,2) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    league VARCHAR(100) NOT NULL
);

-- Leaderboard cache table for performance
CREATE TABLE public.leaderboard_cache (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    username VARCHAR(50) NOT NULL,
    total_coins_won INTEGER DEFAULT 0,
    biggest_odds DECIMAL(8,2) DEFAULT 0,
    total_successful_odds DECIMAL(8,2) DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_bets_user_id ON public.bets(user_id);
CREATE INDEX idx_bets_match_id ON public.bets(match_id);
CREATE INDEX idx_bets_status ON public.bets(status);
CREATE INDEX idx_bet_slips_user_id ON public.bet_slips(user_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_date ON public.matches(match_date);
CREATE INDEX idx_leaderboard_rank ON public.leaderboard_cache(rank);

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_slip_items ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can only see/manage their own bets
CREATE POLICY "Users can view own bets" ON public.bets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets" ON public.bets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bet slips" ON public.bet_slips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bet slips" ON public.bet_slips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Everyone can read matches and leaderboard
CREATE POLICY "Anyone can view matches" ON public.matches
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_cache
    FOR SELECT USING (true);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update leaderboard cache
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM public.leaderboard_cache;
    
    INSERT INTO public.leaderboard_cache (user_id, username, total_coins_won, biggest_odds, total_successful_odds, total_bets, rank)
    SELECT 
        u.id,
        u.username,
        COALESCE(stats.total_coins_won, 0),
        COALESCE(stats.biggest_odds, 0),
        COALESCE(stats.total_successful_odds, 0),
        COALESCE(stats.total_bets, 0),
        ROW_NUMBER() OVER (ORDER BY COALESCE(stats.total_coins_won, 0) DESC) as rank
    FROM public.users u
    LEFT JOIN (
        SELECT 
            user_id,
            SUM(CASE WHEN status = 'won' THEN actual_win ELSE 0 END) as total_coins_won,
            MAX(total_odds) as biggest_odds,
            SUM(CASE WHEN status = 'won' THEN total_odds ELSE 0 END) as total_successful_odds,
            COUNT(*) as total_bets
        FROM public.bet_slips
        GROUP BY user_id
    ) stats ON u.id = stats.user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample matches for testing
INSERT INTO public.matches (home_team, away_team, league, match_date, odds_home, odds_draw, odds_away) VALUES
('Manchester United', 'Liverpool', 'Premier League', NOW() + INTERVAL '2 hours', 2.1, 3.4, 3.2),
('Chelsea', 'Arsenal', 'Premier League', NOW() + INTERVAL '5 hours', 2.2, 3.3, 3.1),
('Tottenham', 'Manchester City', 'Premier League', NOW() + INTERVAL '1 day', 3.8, 3.5, 1.9),
('Barcelona', 'Real Madrid', 'La Liga', NOW() + INTERVAL '3 hours', 2.5, 3.1, 2.8),
('Atletico Madrid', 'Sevilla', 'La Liga', NOW() + INTERVAL '1 day 2 hours', 2.0, 3.2, 3.5),
('Bayern Munich', 'Borussia Dortmund', 'Bundesliga', NOW() + INTERVAL '4 hours', 1.8, 3.6, 4.2),
('RB Leipzig', 'Bayer Leverkusen', 'Bundesliga', NOW() + INTERVAL '1 day 3 hours', 2.3, 3.4, 2.9),
('Juventus', 'AC Milan', 'Serie A', NOW() + INTERVAL '6 hours', 2.4, 3.0, 3.1),
('Inter Milan', 'Napoli', 'Serie A', NOW() + INTERVAL '1 day 4 hours', 2.1, 3.3, 3.4);
