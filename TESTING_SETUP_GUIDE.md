# ScoreLeague Testing Setup Guide
## For 4-8 Person Testing Group

### 🎯 Quick Start Checklist

## Phase 1: Backend Setup (Admin Only - You)

### ✅ Step 1: Supabase Database Setup
1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Navigate to SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Copy the entire content** of `database-schema.sql`
5. **Paste and click "Run"**
6. **Verify tables created** in Table Editor

### ✅ Step 2: Apply Security Fixes
Run these SQL scripts in order:
```sql
-- 1. Run fix-rls-policies.sql
-- 2. Run disable-email-confirmation.sql (for easier testing)
-- 3. Run fix-foreign-key.sql
```

### ✅ Step 3: Test Local Server
```bash
# In your App directory
python server.py
# Should open http://localhost:8000 automatically
```

### ✅ Step 4: Create Test League
1. Open the app in browser
2. Create your account (use simple password for testing)
3. Navigate to "Social" tab
4. Click "Create League"
5. Name: "Test League Week 1" (or similar)
6. Save the league code!

---

## Phase 2: Tester Onboarding (Your 4-8 Testers)

### 📧 Email Template for Testers
```
Subject: Join ScoreLeague Testing - Week 1

Hi [Name],

You're invited to test ScoreLeague, our sports betting game platform!

**How to Join:**
1. Visit: [Your URL - see deployment options below]
2. Create an account (use any username)
3. Go to "Social" tab
4. Click "Join League"
5. Enter code: [YOUR_LEAGUE_CODE]

**What to Test:**
- Place bets on matches
- Check the leaderboard
- Try different betting strategies
- Report any bugs or issues

Let's start testing! First weekly tournament ends Sunday.

Best,
[Your Name]
```

---

## Phase 3: Deployment Options

### Option A: Local Network Testing (Same WiFi)
```bash
# Find your local IP
ifconfig | grep "inet "
# Look for something like 192.168.1.XXX

# Start server
python server.py

# Share this URL with testers:
http://192.168.1.XXX:8000
```

### Option B: Public Testing with Cloudflare Tunnel
```bash
# The cloudflared binary is already in your directory
./create-tunnel.sh

# This will give you a public URL like:
# https://random-name.trycloudflare.com
# Share this URL with testers
```

### Option C: Deploy to Netlify (Recommended for stable testing)
```bash
# Deploy to Netlify
netlify deploy --prod

# Your app will be available at:
# https://scoreleague.netlify.app (or your custom domain)
```

---

## 📊 Week-by-Week Testing Plan

### Week 1: Core Functionality (Days 1-7)
**Goal**: Ensure basic features work for all users

#### Daily Testing Tasks:
- **Day 1-2**: Account Creation & League Joining
  - [ ] All testers create accounts successfully
  - [ ] Everyone joins the league with code
  - [ ] Verify all members appear in league roster

- **Day 3-4**: Betting System
  - [ ] Each tester places at least 3 bets
  - [ ] Test single bets and multi-bets
  - [ ] Verify coins deduct correctly
  - [ ] Check bet history updates

- **Day 5-6**: Live Updates
  - [ ] Leaderboard updates when bets resolve
  - [ ] Coins credit for wins
  - [ ] Match results reflected correctly

- **Day 7**: First Weekly Reset
  - [ ] System resets on Sunday
  - [ ] Weekly winners get bonus coins
  - [ ] New week starts fresh

#### Bug Report Template:
```
Bug: [Brief description]
User: [Username]
Time: [When it happened]
Steps to reproduce:
1. [Step 1]
2. [Step 2]
Expected: [What should happen]
Actual: [What happened]
Screenshot: [If applicable]
```

### Week 2: Competition & Social (Days 8-14)
**Goal**: Test competitive features and user interactions

#### Testing Focus:
- **Tournament Features**
  - [ ] Weekly bonus points calculate correctly
  - [ ] Tournament disciplines track properly
  - [ ] Achievement badges unlock

- **Performance Testing**
  - [ ] All 8 users active simultaneously
  - [ ] No lag in leaderboard updates
  - [ ] Data saves reliably

- **Edge Cases**
  - [ ] What happens with tie scores?
  - [ ] Betting on same match outcomes
  - [ ] Maximum bet amounts

### Week 3: Polish & Feedback (Days 15-21)
**Goal**: Refine based on feedback, prepare for larger launch

#### Final Testing:
- **Mobile Experience**
  - [ ] Test on iOS Safari
  - [ ] Test on Android Chrome
  - [ ] Check responsive design

- **Data Management**
  - [ ] Export/Import functionality
  - [ ] Account recovery
  - [ ] League statistics accuracy

- **User Experience**
  - [ ] Collect feature requests
  - [ ] Document pain points
  - [ ] Rate overall experience (1-10)

---

## 🎮 Testing Scenarios

### Scenario 1: "The Underdog Bet"
1. Find match with high odds (>5.0)
2. Place small bet (50 coins)
3. If wins, verify large payout
4. Check leaderboard position change

### Scenario 2: "The Safe Accumulator"
1. Select 3 favorites (low odds)
2. Create multi-bet slip
3. Verify combined odds calculate correctly
4. Test partial wins/losses

### Scenario 3: "The League Competition"
1. All testers bet on same match
2. Different outcomes selected
3. After match, compare results
4. Verify only winners get coins

### Scenario 4: "The Weekly Champion"
1. Track who leads each day
2. Document daily leaderboard changes
3. Verify Sunday reset and rewards
4. New week starts at 0

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### "Can't create account"
- Check Supabase auth settings
- Run `disable-email-confirmation.sql`
- Verify Supabase keys in config

#### "Bets not saving"
- Check browser console for errors
- Verify Supabase tables exist
- Check RLS policies are applied

#### "League code not working"
- Codes are case-sensitive
- Check league still exists
- Maximum members not reached

#### "Coins not updating"
- Force refresh (Ctrl+F5)
- Check localStorage data
- Verify auto-save is working

#### "Can't see other players"
- Ensure in same league
- Check real-time subscriptions
- Verify Supabase connection

---

## 📈 Success Metrics

### Week 1 Goals:
- ✅ 100% of testers successfully join
- ✅ 50+ total bets placed
- ✅ Zero critical bugs
- ✅ Weekly reset works

### Week 2 Goals:
- ✅ 75% daily active users
- ✅ 100+ total bets placed
- ✅ Social features used by all
- ✅ Performance stays smooth

### Week 3 Goals:
- ✅ Feature requests documented
- ✅ Mobile testing complete
- ✅ 8/10 average satisfaction
- ✅ Ready for 20+ users

---

## 📝 Feedback Collection

### Weekly Survey Questions:
1. How easy was it to use? (1-10)
2. Favorite feature?
3. Most confusing part?
4. Missing features?
5. Would you play with real money?
6. Would you recommend to friends?
7. Any bugs encountered?
8. Overall rating (1-10)

### Data to Track:
- Total bets per user
- Most popular bet types
- Average session length
- Peak usage times
- Feature usage statistics

---

## 🚀 After Testing Phase

### Next Steps:
1. **Analyze all feedback**
2. **Fix critical bugs**
3. **Implement top 3 requested features**
4. **Optimize performance**
5. **Prepare for 20-50 user test**
6. **Consider monetization options**

### Launch Checklist:
- [ ] All bugs from testing fixed
- [ ] Performance optimized for 50+ users
- [ ] Terms of service prepared
- [ ] Privacy policy ready
- [ ] Payment system integrated (if needed)
- [ ] Marketing materials created

---

## 💬 Communication Channels

### Set Up for Testing:
1. **WhatsApp/Telegram Group**: Quick bug reports
2. **Weekly Zoom**: Discuss progress (Sundays after reset)
3. **Google Sheet**: Track bugs and features
4. **Email**: Detailed feedback

### Contact Info Template:
```
Admin: [Your Name]
Email: [Your Email]
WhatsApp Group: [Link]
Bug Reports: [Google Sheet Link]
Emergency Contact: [Phone if needed]
```

---

## 🎯 Quick Commands Reference

### For Admin:
```bash
# Start local server
python server.py

# Make public with Cloudflare
./create-tunnel.sh

# Deploy to production
netlify deploy --prod

# Check Supabase logs
# Go to Supabase Dashboard > Logs > API
```

### For Testers:
```
1. Refresh page: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. Open console: F12 > Console tab
3. Clear cache: Settings > Clear browsing data
4. Report bug: Screenshot + description
```

---

## 🔍 Proxy Debug Headers & Diagnostics
 
 Use this section to troubleshoot odds proxy behavior from the frontend and backend.
 
 ### Enable lightweight proxy debug logging (backend)
 - Local run (temporary):
 ```bash
 LOG_PROXY_DEBUG=1 python3 server_multiuser.py
 ```
 - Render (production via blueprint): the service sets `LOG_PROXY_DEBUG=1` in `render.yaml`. You can also set it in the Render dashboard under Environment.
 
 ### Inspect headers in the browser
 1) Open `diag.html` on the frontend:
 - Local: `http://localhost:8000/diag.html` (or your local dev URL)
 - Production: `https://scoreleague.netlify.app/diag.html`
 
 2) Set API base if needed:
 - Use the "API Base Override" section to set `http://localhost:3001` for local API, or your deployed API URL.
 
 3) Click "Fetch Headers" beneath "Proxy Debug Headers". You should see for each endpoint:
 - `X-Proxy-Mode`: one of `cache`, `fallback-proxy`, `upstream`, `demo`, `upstream-empty`, `upstream-error`, `error`
 - `X-Cache-Key`: present when cache/upstream/fallback-proxy uses a cache key
 - `X-Upstream-Status`: present when an upstream HTTP error code is captured
 
 ### Verify via curl (CLI)
 ```bash
 # Sports list (expect headers exposed)
 curl -s -D - -o /dev/null "$API_BASE/api/odds/sports"
 
 # Sample odds request (soccer EPL) — replace API_BASE as needed
 curl -s -D - -o /dev/null "$API_BASE/api/odds?sport=soccer_epl"
 ```
 Look for these response headers:
 - `Access-Control-Expose-Headers: X-Proxy-Mode, X-Cache-Key, X-Upstream-Status`
 - `X-Proxy-Mode: <mode>`
 - Optionally `X-Cache-Key` and `X-Upstream-Status` depending on mode
 
 ### Bypass proxy cache (optional)
 To force a fresh fetch and skip the server-side cache, both odds endpoints accept a `bypass_cache` query parameter. The value is treated as truthy when one of `1`, `true`, `yes`, `on` is used. This flag is also forwarded to the fallback proxy, ensuring cache bypass behavior is consistent end-to-end.
 
 ```bash
 # Sports list (skip cache)
 curl -s -D - -o /dev/null "$API_BASE/api/odds/sports?bypass_cache=1"
 
 # Sample odds request (skip cache)
 curl -s -D - -o /dev/null "$API_BASE/api/odds?sport=soccer_epl&bypass_cache=1"
 ```
 
 Notes:
 - `/api/odds/sports` responses include a fixed header `X-Cache-Key: sports_list` for consistency across modes (cache, upstream, fallback-proxy, demo).
 - The Diagnostics UI (`diag.html`) includes a "Bypass cache" checkbox in the "Proxy Debug Headers" section. When checked, it appends `bypass_cache=1` to the test requests so you can easily compare headers with and without cache.

---

## ✅ Final Pre-Launch Checklist
  
  ### Technical:
- [ ] Supabase tables created
- [ ] RLS policies applied
- [ ] Auth working
- [ ] Server deployed
- [ ] SSL certificate (if custom domain)

### Content:
- [ ] Test matches loaded
- [ ] Odds displaying correctly
- [ ] League created
- [ ] Welcome message ready

### Team:
- [ ] 4-8 testers confirmed
- [ ] Communication channel set up
- [ ] Testing schedule agreed
- [ ] Feedback process clear

### Legal:
- [ ] Testing agreement (if needed)
- [ ] Data privacy explained
- [ ] No real money involved disclaimer

---

**You're ready to launch your testing phase! 🚀**

Remember: Start small, iterate quickly, and have fun testing!
