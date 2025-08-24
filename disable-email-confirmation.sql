-- Disable email confirmation for development/testing
-- Run this SQL in your Supabase SQL Editor

-- Update the existing user to be confirmed (replace with your actual user ID if needed)
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW() 
WHERE email = 'moritz.lange9D@gmx.de';
