// ScoreLeague App Logic - Minimal Working Version
class ScoreLeague {
    constructor() {
        console.log('ScoreLeague constructor called');
        this.currentTab = 'matches';
        this.betSlip = [];
        this.userCoins = parseInt(localStorage.getItem('scoreleague_coins') || '1000');
        this.username = localStorage.getItem('scoreleague_username') || 'Anonymous';
        this.placedBets = JSON.parse(localStorage.getItem('scoreleague_placed_bets') || '[]');
        this.userScore = 0; // Simplified
        this.achievements = JSON.parse(localStorage.getItem('scoreleague_achievements') || '[]');
        
        this.mockMatches = [
            // Premier League
            {
                id: 1,
                homeTeam: 'Manchester United',
                awayTeam: 'Liverpool',
                league: 'Premier League',
                time: '15:30',
                date: '2025-07-25',
                odds: { home: 2.10, draw: 3.40, away: 3.20 },
                result: null
            },
            {
                id: 2,
                homeTeam: 'Chelsea',
                awayTeam: 'Arsenal',
                league: 'Premier League',
                time: '18:00',
                date: '2025-07-25',
                odds: { home: 2.20, draw: 3.30, away: 3.10 },
                result: null
            },
            {
                id: 3,
                homeTeam: 'Manchester City',
                awayTeam: 'Tottenham',
                league: 'Premier League',
                time: '20:30',
                date: '2025-07-25',
                odds: { home: 1.75, draw: 3.80, away: 4.50 },
                result: null
            },
            // La Liga
            {
                id: 4,
                homeTeam: 'Barcelona',
                awayTeam: 'Real Madrid',
                league: 'La Liga',
                time: '16:00',
                date: '2025-07-25',
                odds: { home: 2.50, draw: 3.10, away: 2.80 },
                result: null
            },
            {
                id: 5,
                homeTeam: 'Atletico Madrid',
                awayTeam: 'Sevilla',
                league: 'La Liga',
                time: '21:00',
                date: '2025-07-25',
                odds: { home: 2.00, draw: 3.20, away: 3.60 },
                result: null
            },
            // Bundesliga
            {
                id: 6,
                homeTeam: 'Bayern Munich',
                awayTeam: 'Borussia Dortmund',
                league: 'Bundesliga',
                time: '17:30',
                date: '2025-07-25',
                odds: { home: 1.85, draw: 3.60, away: 4.20 },
                result: null
            },
            {
                id: 7,
                homeTeam: 'RB Leipzig',
                awayTeam: 'Bayer Leverkusen',
                league: 'Bundesliga',
                time: '19:30',
                date: '2025-07-25',
                odds: { home: 2.40, draw: 3.40, away: 2.90 },
                result: null
            },
            // Ligue 1
            {
                id: 8,
                homeTeam: 'PSG',
                awayTeam: 'Marseille',
                league: 'Ligue 1',
                time: '20:00',
                date: '2025-07-25',
                odds: { home: 1.60, draw: 4.00, away: 5.50 },
                result: null
            },
            {
                id: 9,
                homeTeam: 'Lyon',
                awayTeam: 'Monaco',
                league: 'Ligue 1',
                time: '22:00',
                date: '2025-07-25',
                odds: { home: 2.80, draw: 3.20, away: 2.50 },
                result: null
            },
            // Champions League
            {
                id: 10,
                homeTeam: 'Inter Milan',
                awayTeam: 'AC Milan',
                league: 'Champions League',
                time: '21:00',
                date: '2025-07-26',
                odds: { home: 2.20, draw: 3.10, away: 3.30 },
                result: null
            }
        ];

        this.mockRankings = [
            { username: 'BetMaster', wins: 8, revenue: 1840.50 },
            { username: 'SportsPro', wins: 6, revenue: 1520.80 },
            { username: 'LuckyGuesser', wins: 5, revenue: 1280.20 },
            { username: 'FootballFan', wins: 4, revenue: 960.40 },
            { username: 'OddsWizard', wins: 3, revenue: 720.70 }
        ];

        this.init();
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
    
    updateWeeklyProgress() {
        // Calculate weekly stats from placed bets
        const weeklyStats = this.calculateWeeklyStats();
        
        // Update stats display
        document.getElementById('coins-spent').textContent = weeklyStats.coinsSpent;
        document.getElementById('bets-placed').textContent = weeklyStats.betsPlaced;
        document.getElementById('win-rate').textContent = weeklyStats.winRate + '%';
        
        // Update progress bar
        const progressPercentage = Math.min((weeklyStats.coinsSpent / weeklyStats.weeklyTarget) * 100, 100);
        document.getElementById('weekly-progress-fill').style.width = progressPercentage + '%';
        
        // Update progress text
        document.getElementById('weekly-coins-used').textContent = weeklyStats.coinsSpent;
        document.getElementById('weekly-coins-target').textContent = weeklyStats.weeklyTarget;
        
        // Update days left (simulate week countdown)
        const daysLeft = this.getDaysLeftInWeek();
        document.getElementById('days-left').textContent = daysLeft;
    }
    
    calculateWeeklyStats() {
        const weeklyTarget = 500; // Weekly coin spending target
        let coinsSpent = 0;
        let betsPlaced = 0;
        let betsWon = 0;
        
        // Calculate from placed bets
        this.placedBets.forEach(bet => {
            coinsSpent += bet.stake;
            betsPlaced++;
            if (bet.status === 'Won') {
                betsWon++;
            }
        });
        
        const winRate = betsPlaced > 0 ? Math.round((betsWon / betsPlaced) * 100) : 0;
        
        return {
            coinsSpent,
            betsPlaced,
            winRate,
            weeklyTarget
        };
    }
    
    getDaysLeftInWeek() {
        // Simulate days left in week (for demo purposes)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
        return Math.max(1, daysUntilSunday);
    }
    
    checkAchievements() {
        this.achievementDefinitions.forEach(achievement => {
            if (!this.achievements.includes(achievement.id) && achievement.condition()) {
                this.achievements.push(achievement.id);
                this.showAchievement(achievement);
                this.saveToLocalStorage();
            }
        });
    }
    
    showAchievement(achievement) {
        const notification = document.getElementById('achievement-notification');
        const icon = notification.querySelector('.achievement-icon');
        const title = notification.querySelector('.achievement-title');
        const description = notification.querySelector('.achievement-description');
        
        icon.textContent = achievement.icon;
        title.textContent = achievement.name;
        description.textContent = achievement.description;
        
        notification.classList.add('show');
        
        // Hide after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
    
    checkWinStreak(targetStreak) {
        if (this.placedBets.length < targetStreak) return false;
        
        // Get last few bets and check if they're all wins
        const recentBets = this.placedBets.slice(-targetStreak);
        return recentBets.every(bet => bet.status === 'Won');
    }
    
    animateCoinCounter() {
        const coinCounter = document.querySelector('.coin-counter');
        if (coinCounter) {
            coinCounter.classList.add('animate');
            setTimeout(() => {
                coinCounter.classList.remove('animate');
            }, 600);
        }
    }

    init() {
        this.loadUserData();
        this.renderMatches();
        this.updateUI();
        this.updateBetSlipUI();
        this.renderMyBets();
        this.renderRankings();
        this.updateWeeklyProgress();
        
        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Username change
        document.getElementById('change-name-btn').addEventListener('click', () => {
            this.showUsernameModal();
        });

        document.getElementById('save-username').addEventListener('click', () => {
            this.saveUsername();
        });

        document.getElementById('cancel-username').addEventListener('click', () => {
            this.hideUsernameModal();
        });

        // Bet slip actions
        document.getElementById('place-bet-btn').addEventListener('click', () => {
            this.placeBets();
        });

        // Quick stake buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-stake-btn')) {
                const amount = parseInt(e.target.dataset.amount);
                const stakeInput = document.getElementById('total-stake');
                const currentStake = parseInt(stakeInput.value) || 0;
                const newStake = Math.min(currentStake + amount, this.userCoins);
                stakeInput.value = newStake;
                this.updateBetSlip();
            }
        });
        
        // Clear all button
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            if (this.betSlip.length > 0) {
                this.betSlip = [];
                this.updateBetSlipUI();
                this.updateOddsSelection();
            }
        });

        document.getElementById('total-stake').addEventListener('input', () => {
            this.updateBetSlipUI();
        });
    }

    setupMobileOptimizations() {
        // Prevent zoom on input focus for iOS
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (window.innerWidth < 768) {
                    const viewport = document.querySelector('meta[name=viewport]');
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
            });
            
            input.addEventListener('blur', () => {
                if (window.innerWidth < 768) {
                    const viewport = document.querySelector('meta[name=viewport]');
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
                }
            });
        });

        // Add haptic feedback for mobile (if supported)
        if ('vibrate' in navigator) {
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('odds-button') || 
                    e.target.classList.contains('place-bet-btn') ||
                    e.target.classList.contains('nav-tab')) {
                    navigator.vibrate(10); // Short haptic feedback
                }
            });
        }

        // Optimize scroll behavior for mobile
        if (window.innerWidth < 768) {
            document.body.style.overscrollBehavior = 'none';
        }

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateBetSlipUI();
            }, 100);
        });

        // Prevent pull-to-refresh on mobile
        document.body.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            if (touch.clientY > 0 && window.scrollY === 0) {
                e.preventDefault();
            }
        }, { passive: false });

        document.body.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            if (touch.clientY > 0 && window.scrollY === 0) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.page').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Update content when switching tabs
        if (tabName === 'matches') {
            this.renderMatches();
        } else if (tabName === 'betslip') {
            this.updateBetSlipUI();
        } else if (tabName === 'mybets') {
            this.renderMyBets();
        } else if (tabName === 'rankings') {
            this.renderRankings();
        }
    }

    renderMatches() {
        console.log('Rendering matches...');
        const matchesList = document.getElementById('matches-list');
        
        if (!matchesList) {
            console.error('matches-list element not found!');
            return;
        }
        
        matchesList.innerHTML = '';
        
        // Simple grouping by league (like working version)
        const matchesByLeague = {};
        this.mockMatches.forEach(match => {
            if (!matchesByLeague[match.league]) {
                matchesByLeague[match.league] = [];
            }
            matchesByLeague[match.league].push(match);
        });
        
        // Render each league
        Object.keys(matchesByLeague).forEach(league => {
            // League header
            const leagueHeader = document.createElement('div');
            leagueHeader.className = 'league-header';
            leagueHeader.innerHTML = `<h3>${league}</h3>`;
            matchesList.appendChild(leagueHeader);
            
            // Matches in this league
            matchesByLeague[league].forEach(match => {
                const matchCard = document.createElement('div');
                matchCard.className = 'match-card';
                
                const canBet = this.userCoins > 0;
                
                // Generate team colors based on team names
                const homeColor = this.getTeamColor(match.homeTeam);
                const awayColor = this.getTeamColor(match.awayTeam);
                
                matchCard.innerHTML = `
                    <div class="match-header">
                        <div class="match-info">
                            <div class="match-time">${match.time}</div>
                            <div class="team-icons">
                                <div class="team-icon" style="background-color: ${homeColor}">${match.homeTeam.charAt(0)}</div>
                                <div class="team-icon" style="background-color: ${awayColor}">${match.awayTeam.charAt(0)}</div>
                            </div>
                            <div class="match-teams">${match.homeTeam}<br>${match.awayTeam}</div>
                        </div>
                        <div class="match-score">
                            <span>0</span>
                            <span>0</span>
                        </div>
                        <div class="odds-container">
                            <button class="odds-button" data-match-id="${match.id}" data-bet-type="home" ${!canBet ? 'disabled' : ''}>
                                <span class="odds-value">${match.odds.home}</span>
                            </button>
                            <button class="odds-button" data-match-id="${match.id}" data-bet-type="draw" ${!canBet ? 'disabled' : ''}>
                                <span class="odds-value">${match.odds.draw}</span>
                            </button>
                            <button class="odds-button" data-match-id="${match.id}" data-bet-type="away" ${!canBet ? 'disabled' : ''}>
                                <span class="odds-value">${match.odds.away}</span>
                            </button>
                        </div>
                    </div>
                `;

                // Add click listeners to odds buttons
                matchCard.querySelectorAll('.odds-button:not([disabled])').forEach(button => {
                    button.addEventListener('click', (e) => {
                        this.addToBetSlip(e.target.closest('.odds-button'));
                    });
                });

                matchesList.appendChild(matchCard);
            });
        });
        
        console.log('Matches rendered successfully!');
    }

    groupMatchesByLeague(matches) {
        return matches.reduce((groups, match) => {
            const league = match.league;
            if (!groups[league]) {
                groups[league] = [];
            }
            groups[league].push(match);
            return groups;
        }, {});
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    addToBetSlip(button) {
        const matchId = parseInt(button.dataset.matchId);
        const betType = button.dataset.betType;
        const match = this.mockMatches.find(m => m.id === matchId);
        
        if (!match) return;

        // Remove existing bet for this match
        this.betSlip = this.betSlip.filter(bet => bet.matchId !== matchId);

        // Add new bet
        const bet = {
            matchId: matchId,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            betType: betType,
            odds: match.odds[betType],
            time: match.time
        };

        this.betSlip.push(bet);

        // Update UI
        this.updateBetSlipCount();
        this.updateOddsSelection();
        
        // Show feedback
        button.classList.add('selected');
    }

    updateOddsSelection() {
        // Clear all selections
        document.querySelectorAll('.odds-button').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Mark selected bets
        this.betSlip.forEach(bet => {
            const button = document.querySelector(`[data-match-id="${bet.matchId}"][data-bet-type="${bet.betType}"]`);
            if (button) {
                button.classList.add('selected');
            }
        });
    }

    updateBetSlipCount() {
        document.getElementById('betslip-count').textContent = this.betSlip.length;
    }

    updateBetSlipUI() {
        const betslipContent = document.getElementById('betslip-content');
        const placeBetBtn = document.getElementById('place-bet-btn');
        const stakeInput = document.getElementById('total-stake');
        const clearAllBtn = document.getElementById('clear-all-btn');
        const stake = parseInt(stakeInput.value) || 0;

        // Update max stake
        stakeInput.max = this.userCoins;
        document.getElementById('available-coins').textContent = this.userCoins;
        
        // Show/hide clear all button
        if (clearAllBtn) {
            clearAllBtn.style.display = this.betSlip.length > 0 ? 'block' : 'none';
        }

        if (this.betSlip.length === 0) {
            betslipContent.innerHTML = `
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
            placeBetBtn.disabled = true;
        } else {
            let totalOdds = this.betSlip.reduce((sum, bet) => sum * bet.odds, 1);
            let potentialWin = stake * totalOdds;

            betslipContent.innerHTML = `
                <div class="bet-items">
                    ${this.betSlip.map(bet => `
                        <div class="bet-item">
                            <div class="bet-match">${bet.homeTeam} vs ${bet.awayTeam}</div>
                            <div class="bet-selection">
                                ${this.getBetTypeLabel(bet.betType)} @ ${bet.odds}
                                <span class="bet-odds">${bet.odds}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="bet-summary">
                    <p><strong>Total Odds: ${totalOdds.toFixed(2)}</strong></p>
                    <p>Potential Win: ${potentialWin.toFixed(0)} coins</p>
                </div>
            `;
            
            placeBetBtn.disabled = stake <= 0 || stake > this.userCoins;
        }
    }

    getBetTypeLabel(betType) {
        const labels = {
            home: 'Home Win (1)',
            draw: 'Draw (X)',
            away: 'Away Win (2)'
        };
        return labels[betType] || betType;
    }

    placeBets() {
        const stake = parseInt(document.getElementById('total-stake').value);
        
        if (stake <= 0 || stake > this.userCoins || this.betSlip.length === 0) {
            return;
        }

        // Create bet record
        const bet = {
            id: Date.now(),
            bets: [...this.betSlip],
            stake: stake,
            timestamp: new Date().toISOString(),
            status: 'pending',
            totalOdds: this.betSlip.reduce((sum, bet) => sum * bet.odds, 1)
        };

        // Save bet
        this.placedBets.push(bet);
        this.saveToLocalStorage();
        
        // Deduct coins
        this.userCoins -= stake;
        
        // Clear bet slip
        this.betSlip = [];
        this.updateBetSlipUI();
        this.updateUI();
        this.updateWeeklyProgress();
        
        // Check for achievements
        this.checkAchievements();
        
        // Animate coin counter
        this.animateCoinCounter();
        
        alert('Bets placed successfully!');
    }

    renderMyBets() {
        const mybetsContent = document.getElementById('mybets-content');
        
        if (this.placedBets.length === 0) {
            mybetsContent.innerHTML = `
                <div class="empty-bets">
                    <p>No bets placed yet</p>
                    <p>Place some bets to see them here</p>
                </div>
            `;
            return;
        }

        mybetsContent.innerHTML = this.placedBets.map(bet => {
            const date = new Date(bet.timestamp).toLocaleDateString();
            const status = this.getBetStatus(bet);
            const revenue = this.calculateBetRevenue(bet);
            
            return `
                <div class="bet-history-item">
                    <div class="bet-history-header">
                        <div class="bet-date">${date}</div>
                        <div class="bet-stake">${bet.stake} coins</div>
                    </div>
                    <div class="bet-details">
                        ${bet.bets.map(singleBet => `
                            <div>${singleBet.homeTeam} vs ${singleBet.awayTeam} - ${this.getBetTypeLabel(singleBet.betType)} @ ${singleBet.odds}</div>
                        `).join('')}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="bet-status ${status.toLowerCase()}">${status}</span>
                        ${revenue > 0 ? `<span style="color: #40916C; font-weight: 600;">+${revenue.toFixed(0)} coins</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    getBetStatus(bet) {
        let allResolved = true;
        let allWon = true;

        bet.bets.forEach(singleBet => {
            const match = this.mockMatches.find(m => m.id === singleBet.matchId);
            if (!match || match.result === null) {
                allResolved = false;
            } else if (match.result !== singleBet.betType) {
                allWon = false;
            }
        });

        if (!allResolved) return 'Pending';
        return allWon ? 'Won' : 'Lost';
    }

    calculateBetRevenue(bet) {
        const status = this.getBetStatus(bet);
        if (status === 'Won') {
            return bet.stake * bet.totalOdds;
        }
        return 0;
    }

    calculateUserScore() {
        let totalRevenue = 0;
        let wins = 0;

        this.placedBets.forEach(bet => {
            const revenue = this.calculateBetRevenue(bet);
            if (revenue > 0) {
                totalRevenue += revenue;
                wins++;
            }
        });

        return { revenue: totalRevenue, wins };
    }

    renderRankings() {
        const rankingsList = document.getElementById('rankings-list');
        
        // Add current user to rankings if they have revenue
        let allRankings = [...this.mockRankings];
        const userScore = this.calculateUserScore();
        if (userScore.revenue > 0) {
            allRankings.push({
                username: this.username,
                wins: userScore.wins,
                revenue: userScore.revenue,
                isCurrentUser: true
            });
        }

        // Sort by revenue
        allRankings.sort((a, b) => b.revenue - a.revenue);

        rankingsList.innerHTML = allRankings.map((ranking, index) => {
            const position = index + 1;
            let positionClass = '';
            if (position === 1) positionClass = 'gold';
            else if (position === 2) positionClass = 'silver';
            else if (position === 3) positionClass = 'bronze';

            return `
                <div class="ranking-item ${ranking.isCurrentUser ? 'current-user' : ''}">
                    <div class="ranking-position ${positionClass}">${position}</div>
                    <div class="ranking-info">
                        <div class="ranking-username">${ranking.username} ${ranking.isCurrentUser ? '(You)' : ''}</div>
                        <div class="ranking-stats">${ranking.wins} successful bets</div>
                    </div>
                    <div class="ranking-score">${ranking.revenue.toFixed(0)} coins</div>
                </div>
            `;
        }).join('');
    }

    showUsernameModal() {
        const modal = document.getElementById('username-modal');
        const input = document.getElementById('username-input');
        input.value = this.username === 'Anonymous' ? '' : this.username;
        modal.classList.add('active');
        input.focus();
    }

    hideUsernameModal() {
        document.getElementById('username-modal').classList.remove('active');
    }

    saveUsername() {
        const newUsername = document.getElementById('username-input').value.trim();
        if (newUsername && newUsername.length <= 20) {
            this.username = newUsername;
            this.saveToLocalStorage();
            this.updateUI();
            this.renderRankings();
            this.hideUsernameModal();
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('scoreleague_coins', this.userCoins.toString());
        localStorage.setItem('scoreleague_username', this.username);
        localStorage.setItem('scoreleague_placed_bets', JSON.stringify(this.placedBets));
        localStorage.setItem('scoreleague_achievements', JSON.stringify(this.achievements));
    }

    updateUI() {
        document.getElementById('username').textContent = this.username;
        document.getElementById('coin-amount').textContent = this.userCoins;
        this.updateBetSlipCount();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ScoreLeague...');
    try {
        const app = new ScoreLeague();
        console.log('ScoreLeague initialized successfully:', app);
    } catch (error) {
        console.error('Error initializing ScoreLeague:', error);
    }
});
