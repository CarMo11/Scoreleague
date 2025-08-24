// ScoreLeague App Logic - Working Version
class ScoreLeague {
    constructor() {
        console.log('ScoreLeague constructor called');
        this.currentTab = 'matches';
        this.betSlip = [];
        
        // Initialize with default values - will be loaded from database after auth
        this.userCoins = 1000;
        this.username = 'Loading...';
        this.placedBets = [];
        this.currentUser = null;
        
        // Reference to our Supabase services
        this.authService = window.authService;
        this.databaseService = window.databaseService;
        
        this.mockMatches = [
            {
                id: 1,
                homeTeam: 'Manchester City',
                awayTeam: 'Liverpool',
                league: 'Premier League',
                time: '15:30',
                status: 'upcoming',
                markets: {
                    match_result: {
                        home: 2.1,
                        draw: 3.4,
                        away: 3.2
                    },
                    total_goals: {
                        over: 1.85,
                        under: 1.95
                    },
                    both_teams_score: {
                        yes: 1.72,
                        no: 2.05
                    }
                }
            },
            {
                id: 2,
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                league: 'Premier League',
                time: '18:00',
                status: 'live',
                score: { home: 1, away: 0 },
                markets: {
                    match_result: {
                        home: 1.95,
                        draw: 3.6,
                        away: 3.8
                    },
                    total_goals: {
                        over: 1.90,
                        under: 1.90
                    },
                    both_teams_score: {
                        yes: 1.80,
                        no: 2.00
                    }
                }
            },
            {
                id: 3,
                homeTeam: 'Tottenham',
                awayTeam: 'Newcastle',
                league: 'Premier League',
                time: '20:30',
                status: 'upcoming',
                markets: {
                    match_result: {
                        home: 2.3,
                        draw: 3.2,
                        away: 2.9
                    },
                    total_goals: {
                        over: 1.88,
                        under: 1.92
                    },
                    both_teams_score: {
                        yes: 1.75,
                        no: 2.10
                    }
                }
            },
            {
                id: 4,
                homeTeam: 'Real Madrid',
                awayTeam: 'Barcelona',
                league: 'La Liga',
                time: '21:00',
                status: 'upcoming',
                markets: {
                    match_result: {
                        home: 2.4,
                        draw: 3.1,
                        away: 2.8
                    },
                    total_goals: {
                        over: 1.83,
                        under: 1.97
                    },
                    both_teams_score: {
                        yes: 1.70,
                        no: 2.15
                    }
                }
            },
            {
                id: 5,
                homeTeam: 'Atletico Madrid',
                awayTeam: 'Sevilla',
                league: 'La Liga',
                time: '19:30',
                status: 'upcoming',
                markets: {
                    match_result: {
                        home: 2.0,
                        draw: 3.3,
                        away: 3.5
                    },
                    total_goals: {
                        over: 2.10,
                        under: 1.75
                    },
                    both_teams_score: {
                        yes: 1.95,
                        no: 1.85
                    }
                }
            },
            {
                id: 6,
                homeTeam: 'Bayern Munich',
                awayTeam: 'Borussia Dortmund',
                league: 'Bundesliga',
                time: '18:30',
                status: 'upcoming',
                markets: {
                    match_result: {
                        home: 1.8,
                        draw: 3.7,
                        away: 4.2
                    },
                    total_goals: {
                        over: 1.75,
                        under: 2.05
                    },
                    both_teams_score: {
                        yes: 1.65,
                        no: 2.25
                    }
                }
            },
            {
                id: 7,
                homeTeam: 'RB Leipzig',
                awayTeam: 'Bayer Leverkusen',
                league: 'Bundesliga',
                time: '15:30',
                status: 'upcoming',
                markets: {
                    match_result: {
                        home: 2.2,
                        draw: 3.4,
                        away: 3.0
                    },
                    total_goals: {
                        over: 1.92,
                        under: 1.88
                    },
                    both_teams_score: {
                        yes: 1.78,
                        no: 2.02
                    }
                }
            },
            {
                id: 8,
                homeTeam: 'Juventus',
                awayTeam: 'AC Milan',
                league: 'Serie A',
                time: '20:45',
                status: 'upcoming',
                markets: {
                    match_result: {
                        home: 2.5,
                        draw: 3.0,
                        away: 2.7
                    },
                    total_goals: {
                        over: 1.95,
                        under: 1.85
                    },
                    both_teams_score: {
                        yes: 1.82,
                        no: 1.98
                    }
                }
            },
            {
                id: 9,
                homeTeam: 'PSG',
                awayTeam: 'Marseille',
                league: 'Ligue 1',
                time: '21:00',
                status: 'upcoming',
                markets: {
                    match_result: {
                        home: 1.6,
                        draw: 4.0,
                        away: 5.5
                    },
                    total_goals: {
                        over: 1.70,
                        under: 2.15
                    },
                    both_teams_score: {
                        yes: 1.60,
                        no: 2.35
                    }
                }
            }
        ];
        
        this.init();
    }
    
    init() {
        console.log('Initializing ScoreLeague...');
        this.setupEventListeners();
        this.initializeWithAuth();
    }
    
    // Initialize app with authentication data
    async initializeWithAuth() {
        try {
            // Wait for auth service to be ready
            await this.authService.init();
            
            // Get current user
            this.currentUser = this.authService.getCurrentUser();
            
            if (this.currentUser) {
                // Load user profile
                const profile = await this.authService.loadUserProfile();
                if (profile) {
                    this.userCoins = profile.coins;
                    this.username = profile.username;
                }
                
                // Load user bets
                await this.loadUserBets();
                
                // Load matches from database
                await this.loadMatches();
            }
            
            // Update UI with loaded data
            this.updateUI();
            
            // Load user bets from database or localStorage
            await this.loadUserBets();
            
            // Clear any test bets on initialization
            this.clearAllBets();
            
            // Initial render
            this.renderMatches();
            this.updateUI();
            
            console.log('ScoreLeague initialized successfully:', this);
        
        // Force initial My Bets rendering to ensure it works
        console.log('*** FORCING INITIAL MY BETS RENDER ***');
        setTimeout(() => {
            this.renderMyBets();
            console.log('*** INITIAL MY BETS RENDER COMPLETE ***');
        }, 1000);
        
        // FINAL FIX: Ensure My Bets tab is always accessible
        setTimeout(() => {
            console.log('*** APPLYING FINAL MY BETS FIX ***');
            const myBetsTab = document.querySelector('[data-tab="mybets"]');
            if (myBetsTab) {
                // Remove any existing listeners and add a direct one
                myBetsTab.onclick = () => {
                    console.log('My Bets tab clicked - direct handler');
                    this.switchTab('mybets');
                };
                console.log('Direct My Bets tab handler applied');
            }
        }, 2000);
            
        } catch (error) {
            console.error('Error initializing with auth:', error);
            // Fallback to mock data if database fails
            this.updateUI();
            this.renderMatches();
            this.renderWeeklyProgress();
            
            // Test navigation setup
            this.testNavigation();
            console.log('ScoreLeague initialized with fallback data');
        }
        
        // Try to load real match data from The Odds API (with delay to ensure script loads)
        setTimeout(async () => {
            await this.loadRealMatches();
        }, 1000);
    }
    
    // Load user bets from database
    async loadUserBets() {
        if (!this.currentUser) return;
        
        try {
            const result = await this.databaseService.getUserBets(this.currentUser.id);
            if (result.success) {
                this.placedBets = result.data || [];
            }
        } catch (error) {
            console.error('Error loading user bets:', error);
        }
    }
    
    // Load matches from database
    async loadMatches() {
        try {
            const result = await this.databaseService.getMatches();
            if (result.success && result.data.length > 0) {
                // Convert database matches to our format
                this.mockMatches = result.data.map(match => ({
                    id: match.id,
                    homeTeam: match.home_team,
                    awayTeam: match.away_team,
                    league: match.league,
                    time: new Date(match.match_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    date: new Date(match.match_date).toLocaleDateString(),
                    markets: {
                        match_result: {
                            home: parseFloat(match.odds_home) || 2.0,
                            draw: parseFloat(match.odds_draw) || 3.0,
                            away: parseFloat(match.odds_away) || 2.5
                        },
                        total_goals: {
                            over: 1.85,
                            under: 1.95
                        },
                        both_teams_score: {
                            yes: 1.72,
                            no: 2.05
                        }
                    },
                    score: match.home_score !== null ? {
                        home: match.home_score,
                        away: match.away_score
                    } : null,
                    status: match.status
                }));
            }
        } catch (error) {
            console.error('Error loading matches:', error);
            // Keep using mock matches if database fails
        }
    }
    
    setupEventListeners() {
        console.log('🚀 SIMPLE & RELIABLE EVENT HANDLERS LOADING...');
        console.log('Setting up event listeners...');
        
        // Store reference to this for use in event handlers
        const self = this;
        
        // Navigation tabs - simple and reliable approach
        const navTabs = document.querySelectorAll('.nav-tab');
        console.log('Found navigation tabs:', navTabs.length);
        
        // Simple, direct event listeners on each tab
        navTabs.forEach((tab, index) => {
            const tabName = tab.dataset.tab;
            console.log(`Setting up listener for tab ${index}: ${tabName}`);
            
            // Remove any existing listeners by cloning
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
            
            // Add click listener to the new tab
            newTab.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('*** TAB CLICKED ***:', tabName);
                
                // Call switchTab method
                if (self.switchTab) {
                    console.log('Calling self.switchTab for:', tabName);
                    self.switchTab(tabName);
                } else {
                    console.error('switchTab method not found on self');
                }
                
                return false;
            });
            
            console.log(`✅ Event listener added for ${tabName} tab`);
        });
        
        console.log('✅ All navigation event listeners set up successfully');
        
        // Settings button
        const changeNameBtn = document.getElementById('change-name-btn');
        if (changeNameBtn) {
            changeNameBtn.addEventListener('click', () => this.showUsernameModal());
        }
        
        // Username modal
        const saveUsernameBtn = document.getElementById('save-username');
        const cancelUsernameBtn = document.getElementById('cancel-username');
        if (saveUsernameBtn) {
            saveUsernameBtn.addEventListener('click', () => this.saveUsername());
        }
        if (cancelUsernameBtn) {
            cancelUsernameBtn.addEventListener('click', () => this.hideUsernameModal());
        }
        
        // Stake input event listener
        const stakeInput = document.getElementById('total-stake');
        if (stakeInput) {
            stakeInput.addEventListener('input', () => this.updatePotentialWin());
        }
        
        // Quick stake buttons
        document.querySelectorAll('.quick-stake-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.textContent.replace('+', ''));
                const stakeInput = document.getElementById('total-stake');
                if (stakeInput) {
                    const currentStake = parseInt(stakeInput.value) || 0;
                    stakeInput.value = currentStake + amount;
                    this.updatePotentialWin();
                }
            });
        });
        
        // Place Bets button
        const placeBetBtn = document.getElementById('place-bet-btn');
        if (placeBetBtn) {
            placeBetBtn.addEventListener('click', () => this.placeBets());
        }
        
        // Profile button
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showProfileModal());
        }
        
        // Close profile modal
        const closeProfileBtn = document.getElementById('close-profile-btn');
        if (closeProfileBtn) {
            closeProfileBtn.addEventListener('click', () => this.hideProfileModal());
        }
        
        // Close profile modal when clicking outside
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    this.hideProfileModal();
                }
            });
        }
    }
    
    testNavigation() {
        console.log('Testing navigation setup...');
        const tabs = document.querySelectorAll('.nav-tab');
        const pages = document.querySelectorAll('.page');
        console.log('Found tabs:', tabs.length);
        console.log('Found pages:', pages.length);
        
        tabs.forEach(tab => {
            console.log('Tab:', tab.dataset.tab, 'exists');
        });
        
        pages.forEach(page => {
            console.log('Page:', page.id, 'exists');
        });
        
        // Navigation system is ready
        document.title = 'ScoreLeague - Free Sports Betting';
    }
    
    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        try {
            // Update tab buttons
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
            if (targetTab) {
                targetTab.classList.add('active');
                console.log('Tab button updated:', tabName);
            } else {
                console.error('Tab button not found:', tabName);
                return;
            }
            
            // Update page content
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            const targetPage = document.getElementById(tabName);
            if (targetPage) {
                targetPage.classList.add('active');
                console.log('Page content updated:', tabName);
            } else {
                console.error('Page content not found:', tabName);
                return;
            }
            
            this.currentTab = tabName;
            
            // Render content for specific tabs
            if (tabName === 'matches') {
                console.log('Rendering matches for tab switch');
                this.renderMatches();
            } else if (tabName === 'betslip') {
                console.log('Updating bet slip UI for tab switch');
                this.updateBetSlipUI();
            } else if (tabName === 'mybets') {
                console.log('*** SWITCHING TO MY BETS TAB - FORCING REFRESH ***');
                // Force refresh of bet data before rendering
                this.loadUserBets();
                this.renderMyBets();
                console.log('*** MY BETS TAB REFRESH COMPLETE ***');
            } else if (tabName === 'rankings') {
                console.log('Rendering rankings for tab switch');
                this.renderRankings();
            }
            
            console.log('Tab switch completed successfully:', tabName);
        } catch (error) {
            console.error('Error switching tabs:', error);
        }
    }
    
    renderMatches() {
        console.log('Rendering matches...');
        console.log('Mock matches data:', this.mockMatches);
        
        const matchesList = document.getElementById('matches-list');
        console.log('Found matches-list element:', matchesList);
        
        if (!matchesList) {
            console.error('matches-list element not found!');
            return;
        }

        let html = '';
        let currentLeague = '';

        this.mockMatches.forEach(match => {
            // Add league header if different from current
            if (match.league !== currentLeague) {
                currentLeague = match.league;
                html += `
                    <div class="league-header">
                        <h3>${match.league}</h3>
                    </div>
                `;
            }

            html += `
                <div class="match-card enhanced" data-match-id="${match.id}">
                    <div class="match-header">
                        <div class="match-info">
                            <div class="match-time">${match.time}</div>
                            <div class="team-icons">
                                <div class="team-icon">${match.homeTeam.charAt(0)}</div>
                                <div class="team-icon">${match.awayTeam.charAt(0)}</div>
                            </div>
                            <div class="match-teams">
                                ${match.homeTeam}<br>
                                ${match.awayTeam}
                            </div>
                        </div>
                        <div class="match-score">
                            ${match.status === 'live' ? `${match.score?.home || 0} - ${match.score?.away || 0}` : ''}
                            <div style="font-size: 10px; color: #999;">${match.status}</div>
                        </div>
                    </div>
                    
                    <div class="betting-markets">
                        <!-- Match Result Market -->
                        <div class="market-section">
                            <div class="market-title">Match Result</div>
                            <div class="market-odds" style="display: flex !important; flex-direction: row !important; gap: 8px !important; flex-wrap: nowrap !important; justify-content: flex-end !important;">
                                <button class="odds-button" style="display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: center !important; gap: 4px !important;" 
                                        data-match-id="${match.id}" 
                                        data-market="match_result" 
                                        data-selection="home"
                                        data-odds="${match.markets.match_result.home}">
                                    <span class="odds-label">1</span>
                                    <span class="odds-value">${match.markets.match_result.home}</span>
                                </button>
                                <button class="odds-button" style="display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: center !important; gap: 4px !important;" 
                                        data-match-id="${match.id}" 
                                        data-market="match_result" 
                                        data-selection="draw"
                                        data-odds="${match.markets.match_result.draw}">
                                    <span class="odds-label">X</span>
                                    <span class="odds-value">${match.markets.match_result.draw}</span>
                                </button>
                                <button class="odds-button" style="display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: center !important; gap: 4px !important;" 
                                        data-match-id="${match.id}" 
                                        data-market="match_result" 
                                        data-selection="away"
                                        data-odds="${match.markets.match_result.away}">
                                    <span class="odds-label">2</span>
                                    <span class="odds-value">${match.markets.match_result.away}</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Total Goals Market -->
                        <div class="market-section">
                            <div class="market-title">Total Goals</div>
                            <div class="market-odds" style="display: flex !important; flex-direction: row !important; gap: 8px !important; flex-wrap: nowrap !important; justify-content: flex-end !important;">
                                <button class="odds-button" style="display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: center !important; gap: 4px !important;" 
                                        data-match-id="${match.id}" 
                                        data-market="total_goals" 
                                        data-selection="over"
                                        data-odds="${match.markets.total_goals.over}">
                                    <span class="odds-label">O2.5</span>
                                    <span class="odds-value">${match.markets.total_goals.over}</span>
                                </button>
                                <button class="odds-button" style="display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: center !important; gap: 4px !important;" 
                                        data-match-id="${match.id}" 
                                        data-market="total_goals" 
                                        data-selection="under"
                                        data-odds="${match.markets.total_goals.under}">
                                    <span class="odds-label">U2.5</span>
                                    <span class="odds-value">${match.markets.total_goals.under}</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Both Teams Score Market -->
                        <div class="market-section">
                            <div class="market-title">Both Score</div>
                            <div class="market-odds" style="display: flex !important; flex-direction: row !important; gap: 8px !important; flex-wrap: nowrap !important; justify-content: flex-end !important;">
                                <button class="odds-button" style="display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: center !important; gap: 4px !important;" 
                                        data-match-id="${match.id}" 
                                        data-market="both_teams_score" 
                                        data-selection="yes"
                                        data-odds="${match.markets.both_teams_score.yes}">
                                    <span class="odds-label">Yes</span>
                                    <span class="odds-value">${match.markets.both_teams_score.yes}</span>
                                </button>
                                <button class="odds-button" style="display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: center !important; gap: 4px !important;" 
                                        data-match-id="${match.id}" 
                                        data-market="both_teams_score" 
                                        data-selection="no"
                                        data-odds="${match.markets.both_teams_score.no}">
                                    <span class="odds-label">No</span>
                                    <span class="odds-value">${match.markets.both_teams_score.no}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        matchesList.innerHTML = html;
        

        
        // Restore previously selected odds
        this.restoreOddsSelection();
        
        // Attach event listeners to the newly created odds buttons
        this.attachOddsButtonListeners();
        
        console.log('Matches rendered successfully!');
    }
    
    attachOddsButtonListeners() {
        const oddsButtons = document.querySelectorAll('.odds-button');
        oddsButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const matchId = parseInt(button.dataset.matchId);
                const market = button.dataset.market;
                const selection = button.dataset.selection;
                const odds = parseFloat(button.dataset.odds);
                
                console.log('Odds button clicked:', { matchId, market, selection, odds });
                
                // Call addToBetSlip method
                this.addToBetSlip(button);
            });
        });
    }
    
    restoreOddsSelection() {
        // Add 'selected' class to odds buttons that are in the bet slip
        this.betSlip.forEach(bet => {
            const oddsButton = document.querySelector(
                `[data-match-id="${bet.matchId}"][data-market="${bet.market}"][data-selection="${bet.selection}"]`
            );
            if (oddsButton) {
                oddsButton.classList.add('selected');
            }
        });
    }
    
    getTeamColor(teamName) {
        // Generate consistent colors based on team name
        const colors = [
            '#e74c3c', '#3498db', '#9b59b6', '#e67e22', 
            '#1abc9c', '#f39c12', '#2ecc71', '#34495e',
            '#8e44ad', '#16a085', '#27ae60', '#2980b9',
            '#c0392b', '#d35400', '#7f8c8d', '#2c3e50'
        ];
        
        let hash = 0;
        for (let i = 0; i < teamName.length; i++) {
            hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }
    
    renderWeeklyProgress() {
        // Calculate weekly stats
        const stats = this.calculateWeeklyStats();
        
        // Update progress display
        document.getElementById('coins-spent').textContent = stats.coinsSpent;
        document.getElementById('bets-placed').textContent = stats.betsPlaced;
        document.getElementById('win-rate').textContent = stats.winRate + '%';
        document.getElementById('weekly-coins-used').textContent = stats.coinsSpent;
        document.getElementById('weekly-coins-target').textContent = '500';
        document.getElementById('days-left').textContent = '3';
        
        // Update progress bar
        const progressFill = document.getElementById('weekly-progress-fill');
        const progressPercent = Math.min((stats.coinsSpent / 500) * 100, 100);
        progressFill.style.width = progressPercent + '%';
    }
    
    calculateWeeklyStats() {
        // Simple mock stats for now
        return {
            coinsSpent: 150,
            betsPlaced: 8,
            winRate: 62
        };
    }
    
    addToBetSlip(button) {
        const matchId = parseInt(button.dataset.matchId);
        const market = button.dataset.market;
        const selection = button.dataset.selection;
        const odds = parseFloat(button.dataset.odds);
        
        console.log('🎯 Looking for match:', { matchId, availableMatches: this.mockMatches.map(m => m.id) });
        const match = this.mockMatches.find(m => m.id === matchId);
        
        if (!match) {
            console.error('Match not found:', matchId, 'Available matches:', this.mockMatches);
            return;
        }
        
        console.log('🎯 Adding to bet slip:', { matchId, market, selection, odds });
        
        // Check if this exact bet already exists (toggle functionality)
        const existingBetIndex = this.betSlip.findIndex(b => 
            b.matchId === matchId && b.market === market && b.selection === selection
        );
        
        if (existingBetIndex !== -1) {
            // Remove bet from slip (toggle off)
            this.betSlip.splice(existingBetIndex, 1);
            button.classList.remove('selected');
            console.log('Bet removed from slip:', { matchId, market, selection });
        } else {
            // Check if there's already ANY bet for this match (enforce one bet per match)
            const existingMatchBetIndex = this.betSlip.findIndex(b => b.matchId === matchId);
            
            if (existingMatchBetIndex !== -1) {
                // Remove the existing bet for this match and its visual selection
                const oldBet = this.betSlip[existingMatchBetIndex];
                const oldButton = document.querySelector(
                    `[data-match-id="${matchId}"][data-market="${oldBet.market}"][data-selection="${oldBet.selection}"]`
                );
                if (oldButton) {
                    oldButton.classList.remove('selected');
                }
                this.betSlip.splice(existingMatchBetIndex, 1);
                console.log('Replaced existing bet for match:', { 
                    matchId, oldMarket: oldBet.market, oldSelection: oldBet.selection, 
                    newMarket: market, newSelection: selection 
                });
            }
            
            // Create readable bet description
            const betDescription = this.getBetDescription(market, selection, match);
            
            // Add new bet to slip
            const bet = {
                id: Date.now(),
                matchId: matchId,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                market: market,
                selection: selection,
                betDescription: betDescription,
                odds: odds,
                league: match.league
            };
            
            this.betSlip.push(bet);
            button.classList.add('selected');
            console.log('Bet added to slip:', bet);
        }
        
        this.updateBetSlipCount();
        this.updateBetSlipUI();
        // Stay on matches page to allow selecting multiple bets from different matches
    }
    
    getBetDescription(market, selection, match) {
        switch (market) {
            case 'match_result':
                switch (selection) {
                    case 'home': return `${match.homeTeam} to win`;
                    case 'draw': return 'Draw';
                    case 'away': return `${match.awayTeam} to win`;
                }
                break;
            case 'total_goals':
                switch (selection) {
                    case 'over': return 'Over 2.5 Goals';
                    case 'under': return 'Under 2.5 Goals';
                    case 'over_2_5': return 'Over 2.5 Goals';
                    case 'under_2_5': return 'Under 2.5 Goals';
                }
                break;
            case 'both_teams_score':
                switch (selection) {
                    case 'yes': return 'Both Teams to Score - Yes';
                    case 'no': return 'Both Teams to Score - No';
                }
                break;
        }
        return `${market.replace('_', ' ')}: ${selection}`; // Fallback with better formatting
    }
    
    updateBetSlipCount() {
        const countElement = document.getElementById('betslip-count');
        if (countElement) {
            countElement.textContent = this.betSlip.length;
        }
    }
    
    updateBetSlipUI() {
        console.log('Updating bet slip UI');
        const betSlipContent = document.getElementById('betslip-content');
        
        if (!betSlipContent) {
            console.error('Bet slip content element not found');
            return;
        }
        
        if (this.betSlip.length === 0) {
            // Show empty state
            betSlipContent.innerHTML = `
                <div class="empty-betslip">
                    <div class="empty-icon">🎯</div>
                    <p><strong>Ready to start betting?</strong></p>
                    <p>Tap on match odds to add them to your bet slip</p>
                    <div class="empty-tip">
                        <span class="tip-icon">💡</span>
                        <span>Tip: You can combine multiple bets for higher odds!</span>
                    </div>
                </div>
            `;
        } else {
            // Show selected bets
            let totalOdds = 1;
            let betsHtml = '';
            
            this.betSlip.forEach((bet, index) => {
                totalOdds *= bet.odds;
                
                betsHtml += `
                    <div class="bet-item" data-bet-id="${bet.id}">
                        <div class="bet-match">
                            <div class="bet-teams">${bet.homeTeam} vs ${bet.awayTeam}</div>
                            <div class="bet-league">${bet.league}</div>
                        </div>
                        <div class="bet-selection">
                            <div class="bet-type">${bet.betDescription}</div>
                            <div class="bet-odds">${bet.odds}</div>
                        </div>
                        <button class="remove-bet-btn" onclick="window.app.removeBet(${bet.id})">
                            ✕
                        </button>
                    </div>
                `;
            });
            
            betSlipContent.innerHTML = `
                <div class="betslip-bets">
                    ${betsHtml}
                </div>
                <div class="betslip-summary">
                    <div class="total-odds">
                        <span class="odds-label">Combined Odds:</span>
                        <span class="odds-value">${totalOdds.toFixed(2)}</span>
                    </div>
                    <div class="potential-win">
                        <span class="win-label">Potential Win:</span>
                        <span class="win-value" id="potential-win-amount">0</span>
                        <span class="win-coins">coins</span>
                    </div>
                </div>
            `;
            
            // Update potential win when stake changes
            this.updatePotentialWin();
        }
        
        // Enable/disable Place Bets button based on bet slip content
        const placeBetBtn = document.getElementById('place-bet-btn');
        if (placeBetBtn) {
            placeBetBtn.disabled = this.betSlip.length === 0;
        }
    }
    
    removeBet(betId) {
        console.log('Removing bet:', betId);
        
        // Find the bet to get match and bet type info
        const betToRemove = this.betSlip.find(bet => bet.id === betId);
        if (betToRemove) {
            // Remove visual selection from the odds button
            const oddsButton = document.querySelector(`[data-match-id="${betToRemove.matchId}"][data-bet-type="${betToRemove.betType}"]`);
            if (oddsButton) {
                oddsButton.classList.remove('selected');
            }
        }
        
        this.betSlip = this.betSlip.filter(bet => bet.id !== betId);
        this.updateBetSlipCount();
        this.updateBetSlipUI();
    }
    
    updatePotentialWin() {
        const stakeInput = document.getElementById('total-stake');
        const potentialWinElement = document.getElementById('potential-win-amount');
        
        if (!stakeInput || !potentialWinElement) return;
        
        const stake = parseInt(stakeInput.value) || 0;
        let totalOdds = 1;
        
        this.betSlip.forEach(bet => {
            totalOdds *= bet.odds;
        });
        
        const potentialWin = Math.round(stake * totalOdds);
        potentialWinElement.textContent = potentialWin;
    }
    
    renderMyBets() {
        console.log('=== RENDERING MY BETS ===');
        
        const myBetsContainer = document.getElementById('mybets-content');
        if (!myBetsContainer) {
            console.error('My bets container not found!');
            return;
        }
        
        // Always check localStorage first for bet data
        let betsToShow = [];
        const storedBets = localStorage.getItem('placedBets');
        
        if (storedBets) {
            try {
                betsToShow = JSON.parse(storedBets);
                console.log('Found', betsToShow.length, 'bets in localStorage');
            } catch (error) {
                console.error('Error parsing stored bets:', error);
            }
        }
        
        // Fallback to internal array if localStorage is empty
        if (betsToShow.length === 0 && this.placedBets && this.placedBets.length > 0) {
            betsToShow = this.placedBets;
            console.log('Using internal placedBets array:', betsToShow.length, 'bets');
        }
        
        // Clear container
        myBetsContainer.innerHTML = '';
        
        if (betsToShow.length === 0) {
            myBetsContainer.innerHTML = `
                <div class="no-bets">
                    <p>No bets placed yet</p>
                    <p>Place your first bet to see it here!</p>
                </div>
            `;
            console.log('No bets found, showing empty state');
            return;
        }
        
        // Sort bets by date (newest first)
        betsToShow.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
        
        let betsHtml = '';
        betsToShow.forEach(betSlip => {
            const placedDate = new Date(betSlip.placedAt).toLocaleDateString();
            const placedTime = new Date(betSlip.placedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Create bet details HTML
            let betDetailsHtml = '';
            if (betSlip.bets && betSlip.bets.length > 0) {
                betDetailsHtml = betSlip.bets.map(bet => `
                    <div class="bet-item">
                        <div class="bet-match">
                            <strong>${bet.homeTeam} vs ${bet.awayTeam}</strong>
                            <span class="bet-league">${bet.league}</span>
                        </div>
                        <div class="bet-selection">
                            <span class="bet-type">${bet.betType === 'home' ? bet.homeTeam : bet.betType === 'away' ? bet.awayTeam : 'Draw'}</span>
                            <span class="bet-odds">@${bet.odds}</span>
                        </div>
                    </div>
                `).join('');
            }
            
            const statusClass = betSlip.status === 'won' ? 'won' : betSlip.status === 'lost' ? 'lost' : 'pending';
            const statusText = betSlip.status === 'won' ? 'WON' : betSlip.status === 'lost' ? 'LOST' : 'PENDING';
            
            betsHtml += `
                <div class="bet-slip-card ${statusClass}">
                    <div class="bet-slip-header">
                        <div class="bet-slip-info">
                            <span class="bet-slip-id">#${betSlip.id}</span>
                            <span class="bet-slip-date">${placedDate} ${placedTime}</span>
                        </div>
                        <div class="bet-slip-status ${statusClass}">
                            ${statusText}
                        </div>
                    </div>
                    <div class="bet-slip-details">
                        ${betDetailsHtml}
                    </div>
                    <div class="bet-slip-summary">
                        <div class="summary-row">
                            <span>Stake:</span>
                            <span class="value">${betSlip.totalStake} coins</span>
                        </div>
                        <div class="summary-row">
                            <span>Total Odds:</span>
                            <span class="value">${betSlip.totalOdds.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span>Potential Win:</span>
                            <span class="value potential-win">${betSlip.potentialWin} coins</span>
                        </div>
                        ${betSlip.actualWin ? `
                            <div class="summary-row">
                                <span>Actual Win:</span>
                                <span class="value actual-win">${betSlip.actualWin} coins</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        myBetsContainer.innerHTML = betsHtml;
        console.log(`Rendered ${betsToShow.length} bet slips`);
    }
    
    renderRankings() {
        console.log('Rendering rankings');
        const rankingsContainer = document.getElementById('rankings-list');
        if (!rankingsContainer) return;
        
        // Generate mock rankings data (in real app, this would come from backend)
        const mockRankings = this.generateMockRankings();
        
        // Add current user to rankings if they have placed bets
        const userStats = this.calculateUserStats();
        if (userStats.totalBets > 0) {
            mockRankings.push({
                username: this.username,
                totalCoinsWon: userStats.totalCoinsWon,
                biggestOdds: userStats.biggestOdds,
                totalSuccessfulOdds: userStats.totalSuccessfulOdds,
                totalBets: userStats.totalBets,
                isCurrentUser: true
            });
        }
        
        // Sort by total coins won (descending)
        mockRankings.sort((a, b) => b.totalCoinsWon - a.totalCoinsWon);
        
        // Render rankings
        let rankingsHtml = '';
        mockRankings.forEach((user, index) => {
            const rank = index + 1;
            const rankIcon = this.getRankIcon(rank);
            const userClass = user.isCurrentUser ? 'current-user' : '';
            
            rankingsHtml += `
                <div class="ranking-item ${userClass}">
                    <div class="rank-info">
                        <div class="rank-number">
                            <span class="rank-icon">${rankIcon}</span>
                            <span class="rank-text">#${rank}</span>
                        </div>
                        <div class="user-details">
                            <div class="username">${user.username}${user.isCurrentUser ? ' (You)' : ''}</div>
                            <div class="user-stats">
                                <span class="stat">💰 ${user.totalCoinsWon} coins won</span>
                                <span class="stat">💎 Best odds: ${user.biggestOdds.toFixed(2)}x</span>
                                <span class="stat">🔥 Total successful odds: ${user.totalSuccessfulOdds.toFixed(1)}x</span>
                                <span class="stat">🎯 ${user.totalBets} bets placed</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (rankingsHtml === '') {
            rankingsHtml = `
                <div class="empty-rankings">
                    <div class="empty-icon">🏆</div>
                    <p><strong>No rankings yet</strong></p>
                    <p>Place some bets to appear on the leaderboard!</p>
                </div>
            `;
        }
        
        rankingsContainer.innerHTML = rankingsHtml;
    }
    
    generateMockRankings() {
        return [
            {
                username: 'BettingKing',
                totalCoinsWon: 2450,
                biggestOdds: 8.5,
                totalSuccessfulOdds: 45.8,
                totalBets: 23,
                isCurrentUser: false
            },
            {
                username: 'OddsHunter',
                totalCoinsWon: 1890,
                biggestOdds: 12.3,
                totalSuccessfulOdds: 38.7,
                totalBets: 18,
                isCurrentUser: false
            },
            {
                username: 'SportsPro',
                totalCoinsWon: 1650,
                biggestOdds: 6.8,
                totalSuccessfulOdds: 52.4,
                totalBets: 31,
                isCurrentUser: false
            },
            {
                username: 'LuckyStreak',
                totalCoinsWon: 1420,
                biggestOdds: 15.2,
                totalSuccessfulOdds: 29.6,
                totalBets: 12,
                isCurrentUser: false
            },
            {
                username: 'FootballFan',
                totalCoinsWon: 980,
                biggestOdds: 4.5,
                totalSuccessfulOdds: 23.1,
                totalBets: 27,
                isCurrentUser: false
            }
        ];
    }
    
    calculateUserStats() {
        let totalCoinsWon = 0;
        let biggestOdds = 0;
        let totalSuccessfulOdds = 0;
        
        this.placedBets.forEach(bet => {
            if (bet.status === 'won') {
                totalCoinsWon += bet.actualWin;
                totalSuccessfulOdds += bet.totalOdds;
            }
            // Track biggest odds from all bets (won or lost)
            if (bet.totalOdds > biggestOdds) {
                biggestOdds = bet.totalOdds;
            }
        });
        
        return {
            totalCoinsWon,
            biggestOdds,
            totalSuccessfulOdds,
            totalBets: this.placedBets.length
        };
    }
    
    getRankIcon(rank) {
        switch(rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '🏅';
        }
    }
    
    showUsernameModal() {
        const modal = document.getElementById('username-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    hideUsernameModal() {
        const modal = document.getElementById('username-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    saveUsername() {
        const input = document.getElementById('username-input');
        if (input && input.value.trim()) {
            this.username = input.value.trim();
            localStorage.setItem('scoreleague_username', this.username);
            this.updateUI();
            this.hideUsernameModal();
        }
    }
    
    updateUI() {
        document.getElementById('username').textContent = this.username;
        document.getElementById('coin-amount').textContent = this.userCoins;
        
        // Update available coins in bet slip
        const availableCoinsElement = document.getElementById('available-coins');
        if (availableCoinsElement) {
            availableCoinsElement.textContent = this.userCoins;
        }
        
        this.updateBetSlipCount();
    }
    
    showProfileModal() {
        this.updateProfileStats();
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    hideProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    updateProfileStats() {
        // Update current balance
        const balanceElement = document.getElementById('profile-balance');
        if (balanceElement) {
            balanceElement.textContent = this.userCoins + ' coins';
        }
        
        // Calculate statistics from placed bets
        const totalBets = this.placedBets.length;
        let totalCoinsWon = 0;
        let biggestOdds = 0;
        let wonBets = 0;
        
        this.placedBets.forEach(bet => {
            if (bet.status === 'won') {
                totalCoinsWon += bet.actualWin;
                wonBets++;
                if (bet.totalOdds > biggestOdds) {
                    biggestOdds = bet.totalOdds;
                }
            }
        });
        
        // Update statistics
        const totalBetsElement = document.getElementById('profile-total-bets');
        if (totalBetsElement) {
            totalBetsElement.textContent = totalBets;
        }
        
        const biggestOddsElement = document.getElementById('profile-biggest-odds');
        if (biggestOddsElement) {
            biggestOddsElement.textContent = biggestOdds > 0 ? biggestOdds.toFixed(2) : '-';
        }
        
        const coinsWonElement = document.getElementById('profile-coins-won');
        if (coinsWonElement) {
            coinsWonElement.textContent = totalCoinsWon + ' coins';
        }
        
        // Update recent bets
        this.updateRecentBets();
    }
    
    updateRecentBets() {
        const recentBetsContainer = document.getElementById('profile-recent-bets');
        if (!recentBetsContainer) return;
        
        if (this.placedBets.length === 0) {
            recentBetsContainer.innerHTML = '<div class="no-bets">No bets placed yet</div>';
            return;
        }
        
        // Show last 5 bets
        const recentBets = this.placedBets.slice(-5).reverse();
        let betsHtml = '';
        
        recentBets.forEach(bet => {
            const date = new Date(bet.placedAt).toLocaleDateString();
            const time = new Date(bet.placedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Get first bet for display (in case of multiple bets in slip)
            const firstBet = bet.bets[0];
            const matchDisplay = bet.bets.length > 1 ? 
                `${firstBet.homeTeam} vs ${firstBet.awayTeam} +${bet.bets.length - 1} more` :
                `${firstBet.homeTeam} vs ${firstBet.awayTeam}`;
            
            betsHtml += `
                <div class="recent-bet-item">
                    <div class="recent-bet-header">
                        <div class="recent-bet-match">${matchDisplay}</div>
                        <div class="recent-bet-status ${bet.status}">${bet.status.toUpperCase()}</div>
                    </div>
                    <div class="recent-bet-details">
                        <span>Stake: ${bet.stake} coins</span>
                        <span>Odds: ${bet.totalOdds.toFixed(2)}</span>
                        <span>${date} ${time}</span>
                    </div>
                </div>
            `;
        });
        
        recentBetsContainer.innerHTML = betsHtml;
    }
    
    async placeBets() {
        if (this.betSlip.length === 0) {
            alert('Please add some bets to your bet slip first!');
            return;
        }
        
        const stakeInput = document.getElementById('total-stake');
        const stake = parseInt(stakeInput.value) || 0;
        
        if (stake <= 0) {
            alert('Please enter a valid stake amount!');
            return;
        }
        
        if (stake > this.userCoins) {
            alert('Insufficient coins! You only have ' + this.userCoins + ' coins.');
            return;
        }
        
        // Calculate total odds and potential win
        let totalOdds = 1;
        this.betSlip.forEach(bet => totalOdds *= bet.odds);
        const potentialWin = Math.round(stake * totalOdds);
        
        try {
        // Get current user and ensure we have a valid user ID
        let currentUser = this.authService.getCurrentUser();
        
        // Fallback: if authService doesn't have user, check if we have user data loaded
        if (!currentUser || !currentUser.id) {
            // Check if we have username and coins loaded (indicates we're logged in)
            if (this.username && this.username !== 'Loading...' && this.userCoins > 0) {
                // Create a mock user object for database operations
                currentUser = {
                    id: this.username, // Use username as ID for now
                    email: this.username + '@scoreleague.com'
                };
                console.log('Using fallback user data for bet placement:', currentUser);
            } else {
                alert('Please log in to place bets.');
                return;
            }
        } else {
            console.log('Current user for bet placement:', currentUser);
        }
        
        // Create bet slip data for database
        const betSlipData = {
            userId: currentUser.id,
            totalStake: stake,
            totalOdds: totalOdds,
            potentialWin: potentialWin,
            status: 'pending',
            bets: this.betSlip.map(bet => ({
                matchId: bet.matchId,
                betType: bet.betType,
                odds: bet.odds,
                homeTeam: bet.homeTeam,
                awayTeam: bet.awayTeam,
                league: bet.league
            }))
        };
        
        console.log('Bet slip data to be sent:', betSlipData);
        
        // Try to place bet slip in database, fall back to localStorage if it fails
        let result;
        try {
            result = await this.databaseService.placeBetSlip(betSlipData);
        } catch (error) {
            console.log('Database operation failed, using localStorage fallback:', error);
            result = { success: false, error: 'Database unavailable' };
        }
        
        if (!result.success) {
            console.log('Database bet placement failed, using localStorage fallback');
            // Fallback to localStorage for bet persistence
            const localBetSlip = {
                id: Date.now(),
                userId: currentUser.id,
                totalStake: stake,
                totalOdds: totalOdds,
                potentialWin: potentialWin,
                placedAt: new Date().toISOString(),
                status: 'pending',
                bets: this.betSlip.map(bet => ({
                    matchId: bet.matchId,
                    betType: bet.betType,
                    odds: bet.odds,
                    homeTeam: bet.homeTeam,
                    awayTeam: bet.awayTeam,
                    league: bet.league
                }))
            };
            
            // Save to localStorage
            const existingBets = JSON.parse(localStorage.getItem('placedBets') || '[]');
            existingBets.push(localBetSlip);
            localStorage.setItem('placedBets', JSON.stringify(existingBets));
            
            // Update local placedBets array
            this.placedBets.push(localBetSlip);
            
            console.log('Bet saved to localStorage:', localBetSlip);
        }
        
        // Update user coins (database or localStorage)
        const newCoinAmount = this.userCoins - stake;
        
        try {
            const coinResult = await this.authService.updateUserCoins(newCoinAmount);
            if (coinResult.success) {
                console.log('Coins updated in database');
            } else {
                throw new Error(coinResult.error);
            }
        } catch (error) {
            console.log('Database coin update failed, using localStorage fallback:', error);
            // Fallback to localStorage for coin persistence
            localStorage.setItem('userCoins', newCoinAmount.toString());
        }
        
        // Update local state
        this.userCoins = newCoinAmount;
        
        // Try to reload user bets from database, fall back to localStorage
        try {
            await this.loadUserBets();
        } catch (error) {
            console.log('Failed to load bets from database, using localStorage:', error);
            // Load from localStorage as fallback
            this.placedBets = JSON.parse(localStorage.getItem('placedBets') || '[]');
        }
        
        // Clear bet slip
        this.betSlip = [];
        
        // Update UI
        this.updateUI();
        this.updateBetSlipUI();
        
        // Show success notification with animation
        this.showBetPlacedNotification(stake, potentialWin, betSlipData.bets.length);
        
        // Animate coin counter
        this.animateCoinDeduction();
        
        // Switch to matches tab after brief delay
        setTimeout(() => {
            this.switchTab('matches');
        }, 1500);
        
    } catch (error) {
        console.error('Error placing bet:', error);
        alert('Error placing bet. Please try again.');
    }
}
    
    showBetPlacedNotification(stake, potentialWin, betCount) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'bet-success-notification';
        notification.innerHTML = `
            <div class="success-content">
                <div class="success-icon">🎯</div>
                <div class="success-text">
                    <div class="success-title">Bet Placed Successfully!</div>
                    <div class="success-details">
                        <span>${betCount} bet${betCount > 1 ? 's' : ''} • ${stake} coins staked</span>
                        <span class="potential-win">Potential win: ${potentialWin} coins</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
    
    animateCoinDeduction() {
        const coinCounter = document.querySelector('.coin-counter');
        if (coinCounter) {
            coinCounter.classList.add('animate');
            setTimeout(() => {
                coinCounter.classList.remove('animate');
            }, 600);
        }
    }
    
    // Clear all test bets from localStorage and internal arrays
    clearAllBets() {
        console.log('🧹 Clearing all test bets...');
        
        // Clear localStorage
        localStorage.removeItem('placedBets');
        localStorage.removeItem('betSlip');
        localStorage.removeItem('userCoins');
        
        // Clear internal arrays
        this.placedBets = [];
        this.betSlip = [];
        
        // Reset coins to default
        this.userCoins = 1000;
        
        console.log('✅ All test bets cleared successfully');
    }
    
    // Load real matches from The Odds API
    async loadRealMatches() {
        console.log('🏈 Attempting to load real match data from The Odds API...');
        
        // Check if the API service is available
        if (!window.oddsAPIService) {
            console.log('⚠️ Odds API service not available, using mock data');
            return;
        }
        
        try {
            // First, check if we have a valid API key
            if (window.oddsAPIService.apiKey === 'YOUR_API_KEY_HERE') {
                console.log('⚠️ Please set your API key in odds-api-service.js');
                console.log('📝 Get a free API key from: https://the-odds-api.com/');
                return;
            }
            
            // Try to get Premier League matches first
            console.log('📡 Fetching Premier League matches...');
            const realMatches = await window.oddsAPIService.getOdds('soccer_epl');
            
            if (realMatches && realMatches.length > 0) {
                // Convert API data to our app format
                const convertedMatches = window.oddsAPIService.convertToAppFormat(realMatches);
                
                if (convertedMatches.length > 0) {
                    console.log(`✅ Loaded ${convertedMatches.length} real matches from API`);
                    
                    // Replace mock matches with real data
                    this.mockMatches = convertedMatches;
                    
                    // Re-render the UI with real data
                    this.renderMatches();
                    
                    console.log('🎉 Real match data successfully integrated!');
                    return;
                }
            }
            
            console.log('⚠️ No matches returned from API, keeping mock data');
            
        } catch (error) {
            console.error('❌ Error loading real matches:', error);
            
            if (error.message.includes('Invalid API key')) {
                console.log('🔑 Please check your API key in odds-api-service.js');
                console.log('📝 Get a free API key from: https://the-odds-api.com/');
            } else if (error.message.includes('HTTP 429')) {
                console.log('⏰ API rate limit reached, using mock data');
            } else {
                console.log('🌐 Network or API error, using mock data');
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ScoreLeague...');
    try {
        const app = new ScoreLeague();
        // Make app globally accessible for bet removal and other functions
        window.scoreLeague = app;
        console.log('ScoreLeague initialized successfully:', app);
        
        // Force render matches after initialization
        console.log('Forcing initial render...');
        app.renderMatches();
        console.log('Initial render complete');
    } catch (error) {
        console.error('Error initializing ScoreLeague:', error);
        console.error('Error stack:', error.stack);
    }
});
