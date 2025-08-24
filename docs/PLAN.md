# Codebase Explanation Plan

## Notes
- Post-login white screen bug fixed for both online and offline/demo login by ensuring main app UI is shown, user data is set, and matches are loaded.
- Combination bet quick-stakes now include a "0" button for one-tap reset, matching user request and mobile UX standards.
- Netlify publish directory updated from 'dist' to project root ('.') to serve correct files for deployment.
- .netlifyignore confirmed to exclude large binaries (e.g., ngrok) from deployment bundle.
- Local server started on port 8080 for direct mobile access via LAN IP.
- Next: verify mobile access via local server and resolve any remaining deployment issues.
- Next phase: Ensure test users can log in, all user actions (bets, likes, etc.) are saved, and each user has a persistent game history for testing and review.
- Supabase-backed "My Bets" tab implemented: reads slips and bet selections from DB when online, with localStorage fallback (merges both 'placedBets' and legacy 'userBets').
- Leaderboard refresh now triggered after successful online bet placement, using refresh_leaderboard_cache SQL function via Supabase RPC.
- Supabase queries and rendering now match latest schema (bet_slips, bet_slip_items).
- Bet slip inserts now include league_id when relevant, enabling correct leaderboard attribution for league bets.
- Bet selections are now saved to Supabase (bet_slip_items) when placing bets, enabling "My Bets" and "Recent" views to render selection details from the database.
- "Recent Bets" toggle and inline view added to bet slip area; now only shows finished bets (Won/Lost) from Supabase or localStorage fallback, not current/pending bets.
- User accounts and login are required for all participants.
- Each user's winnings and losses must be accurately saved and displayed.
- Leaderboard must reflect correct coin winnings for all users, matching actual bet outcomes.
- All users should start with the same coin balance for a given time section (e.g., tournament or season start).
- For now, all bets are entered into the private league (no personal/league choice; everything is compared in the league context for easier testing).
- Only successful bets (wins) should be surfaced to users; bet history UI should not show all placed bets, only winnings. Leaderboard should focus solely on coins earned from successful bets for MVP/testing.
- When a user wins a bet, winnings are credited to their league account (weekly coins), increasing their available balance for further bets and their leaderboard standing. All users start with the same weekly coin budget, and winnings are added on top.
- Added gradeSlip(slipId, 'won'|'lost') helper to settle bets, credit winnings to league coins, and refresh leaderboard cache (admin/testing only for now).
- gradeSlip now prevents double-settlement and avoids settled_at schema mismatch.
- Prevented switching to hidden My Bets tab after bet placement in all flows.
- On session restore, ensure league membership coins are synced by calling ensurePrivateLeague if online.
- Fix: Offline leaderboard fallback now shows username string, not object.

## Task List
- [x] Fix post-login white screen (app requires refresh to show main UI)
- [x] Add zero quick stake button to combination bet area
- [x] Update Netlify publish directory to root for deployment
- [x] Ensure .netlifyignore excludes large binaries (ngrok, etc.)
- [x] Start local server for LAN/mobile access
- [ ] Verify mobile access via local server and resolve deployment issues
- [x] Implement persistent user authentication (test users can log in)
- [x] Save all user actions (bets, likes, etc.) for each user
- [x] Implement and verify game/bet history per user (Supabase and local fallback)
- [x] Implement "Recent Bets" toggle/view in bet slip (last 7 days, inline)
- [x] Save bet selections to Supabase (bet_slip_items) when placing bets
- [ ] Verify Supabase-backed bet history and leaderboard refresh in production
- [x] Implement and verify gradeSlip() helper for bet settlement and leaderboard update
- [ ] Validate that all users start with the correct initial coin balance in the same time window
- [ ] Validate that winnings/losses and leaderboard coins are accurate and synchronized for all users
- [ ] Update flow so all bets are treated as league bets only (no personal/league toggle, for initial rollout/testing)
- [ ] Update bet history/"My Bets" UI to only show successful (won) bets, not all placed bets

## Current Goal
Ensure winnings credit league coins and leaderboard correctly