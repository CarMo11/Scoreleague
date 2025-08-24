// Simple ScoreLeague Test - Just Match Rendering
class SimpleScoreLeague {
    constructor() {
        this.mockMatches = [
            {
                id: 1,
                homeTeam: 'Manchester United',
                awayTeam: 'Liverpool',
                league: 'Premier League',
                time: '15:30',
                odds: { home: 2.10, draw: 3.40, away: 3.20 }
            },
            {
                id: 2,
                homeTeam: 'Chelsea',
                awayTeam: 'Arsenal',
                league: 'Premier League',
                time: '18:00',
                odds: { home: 2.20, draw: 3.30, away: 3.10 }
            },
            {
                id: 3,
                homeTeam: 'Barcelona',
                awayTeam: 'Real Madrid',
                league: 'La Liga',
                time: '16:00',
                odds: { home: 2.50, draw: 3.10, away: 2.80 }
            }
        ];
        
        this.init();
    }
    
    init() {
        console.log('SimpleScoreLeague initialized');
        this.renderMatches();
        this.setupNavigation();
    }
    
    setupNavigation() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                console.log('Tab clicked:', tabName);
                this.switchTab(tabName);
            });
        });
    }
    
    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update active page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        // Render content for specific tabs
        if (tabName === 'matches') {
            this.renderMatches();
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
        
        // Group matches by league
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
                matchCard.innerHTML = `
                    <div class="match-header">
                        <div class="match-info">
                            <div class="match-time">${match.time}</div>
                            <div class="match-teams">${match.homeTeam} vs ${match.awayTeam}</div>
                        </div>
                        <div class="odds-container">
                            <button class="odds-button" data-match-id="${match.id}" data-bet-type="home">
                                <span class="odds-value">${match.odds.home}</span>
                            </button>
                            <button class="odds-button" data-match-id="${match.id}" data-bet-type="draw">
                                <span class="odds-value">${match.odds.draw}</span>
                            </button>
                            <button class="odds-button" data-match-id="${match.id}" data-bet-type="away">
                                <span class="odds-value">${match.odds.away}</span>
                            </button>
                        </div>
                    </div>
                `;
                matchesList.appendChild(matchCard);
            });
        });
        
        console.log('Matches rendered successfully!');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SimpleScoreLeague...');
    window.scoreLeague = new SimpleScoreLeague();
});
