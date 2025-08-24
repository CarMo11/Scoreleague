// COMPREHENSIVE BETTING FUNCTIONALITY FIX
// This script ensures the odds selection and betting slip work perfectly

console.log('🎯 Loading Comprehensive Betting Fix...');

// Global betting fix that runs independently
class BettingFix {
    constructor() {
        this.betSlip = [];
        this.initialized = false;
        this.setupComplete = false;
        
        // Start the fix process
        this.init();
    }
    
    init() {
        console.log('🎯 Initializing betting fix...');
        
        // Wait for DOM and app to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
        
        // Also setup after short delays to catch dynamic content
        setTimeout(() => this.setup(), 500);
        setTimeout(() => this.setup(), 1000);
        setTimeout(() => this.setup(), 2000);
    }
    
    setup() {
        if (this.setupComplete) return;
        
        console.log('🎯 Setting up betting functionality...');
        
        // Make sure we have access to the main app
        if (window.app) {
            // Enhance the main app's betting functionality
            this.enhanceMainApp();
        }
        
        // Setup our own event delegation for odds buttons
        this.setupEventDelegation();
        
        // Monitor for new odds buttons being added
        this.setupMutationObserver();
        
        this.setupComplete = true;
        console.log('✅ Betting fix setup complete');
    }
    
    enhanceMainApp() {
        console.log('🎯 Enhancing main app betting functionality...');
        
        if (window.app && typeof window.app.addToBetSlip === 'function') {
            // Store original function
            const originalAddToBetSlip = window.app.addToBetSlip.bind(window.app);
            
            // Override with enhanced version
            window.app.addToBetSlip = (button) => {
                console.log('🎯 Enhanced addToBetSlip called:', button);
                
                try {
                    // Call original function
                    const result = originalAddToBetSlip(button);
                    
                    // Force UI updates
                    this.forceUIUpdate();
                    
                    return result;
                } catch (error) {
                    console.error('❌ Error in addToBetSlip:', error);
                    // Fallback to our own implementation
                    this.addToBetSlipFallback(button);
                }
            };
        } else {
            console.log('🎯 Main app not ready, using fallback implementation');
            this.createBettingFunctionality();
        }
    }
    
    setupEventDelegation() {
        console.log('🎯 Setting up event delegation for odds buttons...');
        
        // Remove any existing listeners first
        document.removeEventListener('click', this.handleOddsClick);
        
        // Add comprehensive event delegation
        document.addEventListener('click', (e) => this.handleOddsClick(e), true);
        
        console.log('✅ Event delegation setup complete');
    }
    
    handleOddsClick = (e) => {
        const button = e.target.closest('.odds-button');
        if (!button) return;
        
        console.log('🎯 Odds button clicked via delegation:', button);
        
        // Prevent default behavior
        e.preventDefault();
        e.stopPropagation();
        
        // Extract data
        const matchId = parseInt(button.dataset.matchId);
        const market = button.dataset.market;
        const selection = button.dataset.selection;
        const odds = parseFloat(button.dataset.odds);
        
        console.log('🎯 Button data:', { matchId, market, selection, odds });
        
        // Validate data
        if (!matchId || !market || !selection || !odds) {
            console.error('❌ Invalid button data:', { matchId, market, selection, odds });
            return;
        }
        
        // Try main app first, then fallback
        if (window.app && typeof window.app.addToBetSlip === 'function') {
            console.log('🎯 Using main app addToBetSlip');
            window.app.addToBetSlip(button);
        } else {
            console.log('🎯 Using fallback addToBetSlip');
            this.addToBetSlipFallback(button);
        }
    }
    
    addToBetSlipFallback(button) {
        const matchId = parseInt(button.dataset.matchId);
        const market = button.dataset.market;
        const selection = button.dataset.selection;
        const odds = parseFloat(button.dataset.odds);
        
        console.log('🎯 Fallback addToBetSlip:', { matchId, market, selection, odds });
        
        // Get match data (try main app first, then create mock)
        let match = null;
        if (window.app && window.app.mockMatches) {
            match = window.app.mockMatches.find(m => m.id === matchId);
        }
        
        if (!match) {
            // Create minimal match data
            match = {
                id: matchId,
                homeTeam: 'Team A',
                awayTeam: 'Team B',
                league: 'Unknown League'
            };
        }
        
        // Check for existing bet
        const existingBetIndex = this.betSlip.findIndex(b => 
            b.matchId === matchId && b.market === market && b.selection === selection
        );
        
        if (existingBetIndex !== -1) {
            // Remove bet (toggle off)
            this.betSlip.splice(existingBetIndex, 1);
            button.classList.remove('selected');
            console.log('🎯 Bet removed from slip');
        } else {
            // Remove any existing bet for this match (one bet per match)
            const existingMatchBetIndex = this.betSlip.findIndex(b => b.matchId === matchId);
            if (existingMatchBetIndex !== -1) {
                const oldBet = this.betSlip[existingMatchBetIndex];
                const oldButton = document.querySelector(
                    `[data-match-id="${matchId}"][data-market="${oldBet.market}"][data-selection="${oldBet.selection}"]`
                );
                if (oldButton) {
                    oldButton.classList.remove('selected');
                }
                this.betSlip.splice(existingMatchBetIndex, 1);
            }
            
            // Add new bet
            const bet = {
                id: Date.now(),
                matchId: matchId,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                market: market,
                selection: selection,
                betDescription: this.getBetDescription(market, selection, match),
                odds: odds,
                league: match.league
            };
            
            this.betSlip.push(bet);
            button.classList.add('selected');
            console.log('🎯 Bet added to slip:', bet);
        }
        
        // Force UI update
        this.forceUIUpdate();
    }
    
    getBetDescription(market, selection, match) {
        switch (market) {
            case 'match_result':
                switch (selection) {
                    case 'home': return `${match.homeTeam} Win`;
                    case 'draw': return 'Draw';
                    case 'away': return `${match.awayTeam} Win`;
                }
                break;
            case 'total_goals':
                return selection === 'over' ? 'Over 2.5 Goals' : 'Under 2.5 Goals';
            case 'both_teams_score':
                return selection === 'yes' ? 'Both Teams Score - Yes' : 'Both Teams Score - No';
            default:
                return `${market}: ${selection}`;
        }
        return `${market}: ${selection}`;
    }
    
    forceUIUpdate() {
        console.log('🎯 Forcing UI update...');
        
        // Update bet slip count
        const countElement = document.getElementById('betslip-count');
        if (countElement) {
            const currentCount = window.app ? window.app.betSlip?.length || 0 : this.betSlip.length;
            countElement.textContent = currentCount;
            console.log('🎯 Updated bet slip count:', currentCount);
        }
        
        // Update bet slip UI if on bet slip tab
        const betSlipTab = document.querySelector('[data-tab="betslip"]');
        const betSlipPage = document.getElementById('betslip');
        
        if (betSlipPage && betSlipPage.classList.contains('active')) {
            console.log('🎯 Updating bet slip UI...');
            this.updateBetSlipUI();
        }
        
        // Force visual feedback
        this.addVisualFeedback();
    }
    
    addVisualFeedback() {
        // Add a brief visual indicator that something happened
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
            animation: slideIn 0.3s ease-out;
        `;
        
        const currentCount = window.app ? window.app.betSlip?.length || 0 : this.betSlip.length;
        notification.textContent = currentCount > 0 ? `${currentCount} bet(s) selected` : 'Bet removed';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    updateBetSlipUI() {
        const betSlipContent = document.getElementById('betslip-content');
        if (!betSlipContent) return;
        
        const currentBetSlip = window.app ? window.app.betSlip || [] : this.betSlip;
        
        if (currentBetSlip.length === 0) {
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
            let totalOdds = 1;
            let betsHtml = '';
            
            currentBetSlip.forEach((bet) => {
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
                        <button class="remove-bet-btn" onclick="window.bettingFix.removeBet(${bet.id})">
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
                    <div class="stake-input-container">
                        <label for="stake-input">Stake:</label>
                        <input type="number" id="stake-input" min="10" max="1000" value="10" placeholder="10">
                        <span>coins</span>
                    </div>
                    <div class="potential-win">
                        <span class="win-label">Potential Win:</span>
                        <span class="win-value" id="potential-win-amount">${(10 * totalOdds).toFixed(0)}</span>
                        <span class="win-coins">coins</span>
                    </div>
                    <button id="place-bet-btn" class="place-bet-btn">Place Bet</button>
                </div>
            `;
            
            // Add stake input listener
            const stakeInput = document.getElementById('stake-input');
            if (stakeInput) {
                stakeInput.addEventListener('input', () => {
                    const stake = parseInt(stakeInput.value) || 0;
                    const potentialWin = document.getElementById('potential-win-amount');
                    if (potentialWin) {
                        potentialWin.textContent = (stake * totalOdds).toFixed(0);
                    }
                });
            }
        }
        
        console.log('✅ Bet slip UI updated');
    }
    
    removeBet(betId) {
        console.log('🎯 Removing bet:', betId);
        
        if (window.app && window.app.betSlip) {
            const index = window.app.betSlip.findIndex(bet => bet.id === betId);
            if (index !== -1) {
                const bet = window.app.betSlip[index];
                window.app.betSlip.splice(index, 1);
                
                // Remove visual selection
                const button = document.querySelector(
                    `[data-match-id="${bet.matchId}"][data-market="${bet.market}"][data-selection="${bet.selection}"]`
                );
                if (button) {
                    button.classList.remove('selected');
                }
            }
        } else {
            const index = this.betSlip.findIndex(bet => bet.id === betId);
            if (index !== -1) {
                this.betSlip.splice(index, 1);
            }
        }
        
        this.forceUIUpdate();
    }
    
    setupMutationObserver() {
        // Watch for new odds buttons being added to the DOM
        const observer = new MutationObserver((mutations) => {
            let newButtonsAdded = false;
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList?.contains('odds-button') || 
                            node.querySelector?.('.odds-button')) {
                            newButtonsAdded = true;
                        }
                    }
                });
            });
            
            if (newButtonsAdded) {
                console.log('🎯 New odds buttons detected, ensuring functionality...');
                // Small delay to ensure DOM is settled
                setTimeout(() => this.forceUIUpdate(), 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('✅ Mutation observer setup for odds buttons');
    }
    
    createBettingFunctionality() {
        // Create basic betting functionality if main app is missing
        console.log('🎯 Creating fallback betting functionality...');
        
        if (!window.app) {
            window.app = {};
        }
        
        window.app.betSlip = window.app.betSlip || this.betSlip;
        window.app.addToBetSlip = window.app.addToBetSlip || ((button) => this.addToBetSlipFallback(button));
    }
}

// Add some CSS for visual feedback
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .odds-button.selected {
        background-color: #4CAF50 !important;
        color: white !important;
        border-color: #4CAF50 !important;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.3) !important;
    }
    
    .odds-button:hover {
        background-color: #f0f0f0 !important;
        transform: translateY(-1px);
        transition: all 0.2s ease;
    }
    
    .odds-button.selected:hover {
        background-color: #45a049 !important;
    }
`;
document.head.appendChild(style);

// Initialize the betting fix
window.bettingFix = new BettingFix();

console.log('✅ Comprehensive Betting Fix Loaded Successfully!');
