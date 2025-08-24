-- Fix Row Level Security Policies for User Registration
-- Run this SQL in your Supabase SQL Editor to fix the RLS issue

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create new policies that allow user registration
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Also ensure authenticated users can read matches (this should already exist)
DROP POLICY IF EXISTS "Anyone can view matches" ON public.matches;
CREATE POLICY "Anyone can view matches" ON public.matches
    FOR SELECT USING (true);

-- Fix leaderboard policy to allow authenticated users to read
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard_cache;
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_cache
    FOR SELECT USING (true);
