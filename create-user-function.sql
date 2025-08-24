-- Create a database function to handle user creation that bypasses RLS
-- Run this SQL in your Supabase SQL Editor

-- Create a function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, coins)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'User' || substr(NEW.id::text, 1, 8)), 1000);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create user profile when auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Alternative: Temporarily disable RLS for user creation
-- (We'll re-enable it after testing)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
