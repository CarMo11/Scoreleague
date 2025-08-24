# ScoreLeague Supabase Backend Setup Guide

## 🚀 Quick Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" and choose your organization
3. Fill in project details:
   - **Name**: ScoreLeague
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
4. Wait for project to be created (2-3 minutes)

### 2. Get Your Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### 3. Configure ScoreLeague
1. Open `supabase-config.js` in your ScoreLeague project
2. Replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'https://your-project-id.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```

### 4. Set Up Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `database-schema.sql`
4. Click "Run" to execute the SQL
5. Verify tables were created in **Table Editor**

### 5. Test the Integration
1. Start your local server: `python server.py`
2. Open `http://localhost:8000`
3. You should see the authentication gate
4. Try creating an account and logging in

## 📊 Database Tables Created

- **users**: User profiles with coins and usernames
- **matches**: Match data with odds and results
- **bet_slips**: Multi-bet combinations placed by users
- **bet_slip_items**: Individual bets within each slip
- **leaderboard_cache**: Optimized rankings data

## 🔐 Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Authentication**: Email/password with Supabase Auth
- **API Security**: Anon key only allows authorized operations
- **Data Validation**: Server-side validation for all operations

## 🎯 Features Now Available

### ✅ User Management
- Account registration with username
- Email/password authentication
- Persistent user profiles
- Coin balance management

### ✅ Real Data Persistence
- All bets saved to database
- Persistent leaderboards
- Match data from database
- User statistics tracking

### ✅ Professional Authentication
- Beautiful login/register UI
- Form validation and error handling
- Session management
- Secure logout

## 🔄 Migration from localStorage

The app automatically handles the transition:
- New users start with database storage
- Existing localStorage data can be migrated manually
- All new features require authentication

## 🚀 Next Steps After Setup

1. **Test user registration and login**
2. **Place test bets to verify database integration**
3. **Check leaderboards update correctly**
4. **Add real sports API integration**
5. **Deploy to production (Netlify + Supabase)**

## 🐛 Troubleshooting

### Common Issues:
- **"Invalid API key"**: Check your anon key is correct
- **"Project not found"**: Verify your project URL
- **"RLS policy violation"**: Ensure user is authenticated
- **"Table doesn't exist"**: Run the database schema SQL

### Debug Mode:
Open browser console to see detailed error messages and authentication status.

---

**Ready to transform ScoreLeague into a real multiplayer betting platform! 🏆**
