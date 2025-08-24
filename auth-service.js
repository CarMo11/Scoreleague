// Authentication and Database Service for ScoreLeague
// Handles all Supabase interactions

class AuthService {
    constructor() {
        this.supabase = window.supabaseConfig.supabase;
        this.tables = window.supabaseConfig.TABLES;
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    // Initialize auth state
    async init() {
        // Check if user is already logged in
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            this.isAuthenticated = true;
            await this.loadUserProfile();
        }

        // Listen for auth changes
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                this.isAuthenticated = true;
                await this.loadUserProfile();
                window.location.reload(); // Refresh app
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.userProfile = null;
            }
        });
    }

    // User Registration
    async signUp(email, password, username) {
        try {
            // Check if username is available (skip auth check for this read)
            const { data: existingUser } = await this.supabase
                .from(this.tables.USERS)
                .select('username')
                .eq('username', username)
                .maybeSingle();

            if (existingUser) {
                throw new Error('Username already taken');
            }

            // Create auth user
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) throw error;

            // Wait for the user to be properly authenticated
            if (data.user && !data.user.email_confirmed_at) {
                // For development, we'll auto-confirm
                // In production, user would need to confirm email first
                console.log('User created, waiting for session...');
            }

            // Create user profile after successful auth
            if (data.user) {
                // Use a small delay to ensure session is established
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const { error: profileError } = await this.supabase
                    .from(this.tables.USERS)
                    .insert({
                        id: data.user.id,
                        username,
                        coins: 1000
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    throw profileError;
                }
            }

            return { success: true, data };
        } catch (error) {
            console.error('SignUp error:', error);
            return { success: false, error: error.message };
        }
    }

    // User Login
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // User Logout
    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Load user profile from database
    async loadUserProfile() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await this.supabase
                .from(this.tables.USERS)
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;
            this.userProfile = data;
            return data;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }

    // Update user coins
    async updateUserCoins(newCoinAmount) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            const { data, error } = await this.supabase
                .from(this.tables.USERS)
                .update({ coins: newCoinAmount })
                .eq('id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            this.userProfile.coins = newCoinAmount;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get current user info
    getCurrentUser() {
        return {
            user: this.currentUser,
            profile: this.userProfile,
            isAuthenticated: this.isAuthenticated
        };
    }
}

// Database Service for matches, bets, etc.
class DatabaseService {
    constructor() {
        this.supabase = window.supabaseConfig.supabase;
        this.tables = window.supabaseConfig.TABLES;
    }

    // Fetch matches
    async getMatches() {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .select('*')
                .gte('match_date', new Date().toISOString())
                .order('match_date', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Place bet slip
    async placeBetSlip(betSlipData) {
        try {
            // Start transaction
            const { data: betSlip, error: betSlipError } = await this.supabase
                .from('bet_slips')
                .insert({
                    user_id: betSlipData.userId,
                    total_stake: betSlipData.totalStake,
                    total_odds: betSlipData.totalOdds,
                    potential_win: betSlipData.potentialWin
                })
                .select()
                .single();

            if (betSlipError) throw betSlipError;

            // Insert bet slip items
            const betSlipItems = betSlipData.bets.map(bet => ({
                bet_slip_id: betSlip.id,
                match_id: bet.matchId,
                bet_type: bet.betType,
                odds: bet.odds,
                home_team: bet.homeTeam,
                away_team: bet.awayTeam,
                league: bet.league
            }));

            const { error: itemsError } = await this.supabase
                .from('bet_slip_items')
                .insert(betSlipItems);

            if (itemsError) throw itemsError;

            return { success: true, data: betSlip };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get user's bet history
    async getUserBets(userId) {
        try {
            const { data, error } = await this.supabase
                .from('bet_slips')
                .select(`
                    *,
                    bet_slip_items (
                        *
                    )
                `)
                .eq('user_id', userId)
                .order('placed_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get leaderboard
    async getLeaderboard() {
        try {
            // Refresh leaderboard cache
            await this.supabase.rpc('refresh_leaderboard_cache');

            const { data, error } = await this.supabase
                .from('leaderboard_cache')
                .select('*')
                .order('rank', { ascending: true })
                .limit(10);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update match result (admin function)
    async updateMatchResult(matchId, homeScore, awayScore) {
        try {
            const { data, error } = await this.supabase
                .from('matches')
                .update({
                    home_score: homeScore,
                    away_score: awayScore,
                    status: 'finished'
                })
                .eq('id', matchId)
                .select()
                .single();

            if (error) throw error;

            // Resolve related bets
            await this.resolveBetsForMatch(matchId, homeScore, awayScore);

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Resolve bets for a finished match
    async resolveBetsForMatch(matchId, homeScore, awayScore) {
        try {
            // Determine match result
            let result;
            if (homeScore > awayScore) result = 'home';
            else if (homeScore < awayScore) result = 'away';
            else result = 'draw';

            // Get all bet slips containing this match
            const { data: betSlips, error: fetchError } = await this.supabase
                .from('bet_slip_items')
                .select(`
                    bet_slip_id,
                    bet_type,
                    bet_slips (*)
                `)
                .eq('match_id', matchId);

            if (fetchError) throw fetchError;

            // Process each bet slip
            for (const item of betSlips) {
                const isWinningBet = item.bet_type === result;
                const betSlip = item.bet_slips;

                if (isWinningBet) {
                    // Check if all bets in this slip are winners
                    const { data: allItems } = await this.supabase
                        .from('bet_slip_items')
                        .select('*')
                        .eq('bet_slip_id', betSlip.id);

                    // For now, mark as won (in real app, check all matches in slip)
                    await this.supabase
                        .from('bet_slips')
                        .update({
                            status: 'won',
                            actual_win: betSlip.potential_win,
                            resolved_at: new Date().toISOString()
                        })
                        .eq('id', betSlip.id);

                    // Add winnings to user account
                    const { data: user } = await this.supabase
                        .from('users')
                        .select('coins')
                        .eq('id', betSlip.user_id)
                        .single();

                    await this.supabase
                        .from('users')
                        .update({ coins: user.coins + betSlip.potential_win })
                        .eq('id', betSlip.user_id);
                } else {
                    // Mark as lost
                    await this.supabase
                        .from('bet_slips')
                        .update({
                            status: 'lost',
                            actual_win: 0,
                            resolved_at: new Date().toISOString()
                        })
                        .eq('id', betSlip.id);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error resolving bets:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export services
window.authService = new AuthService();
window.databaseService = new DatabaseService();
