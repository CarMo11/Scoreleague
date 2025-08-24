// Script to inject a test bet and trigger My Bets rendering
console.log('=== INJECTING TEST BET ===');

// Create a test bet
const testBet = {
    id: Date.now(),
    userId: 'momo',
    totalStake: 50,
    totalOdds: 3.8,
    potentialWin: 190,
    placedAt: new Date().toISOString(),
    status: 'pending',
    actualWin: 0,
    bets: [{
        matchId: 1,
        betType: 'home',
        odds: 3.8,
        homeTeam: 'Tottenham',
        awayTeam: 'Manchester City',
        league: 'Premier League'
    }]
};

// Add to localStorage
const existingBets = JSON.parse(localStorage.getItem('placedBets') || '[]');
existingBets.push(testBet);
localStorage.setItem('placedBets', JSON.stringify(existingBets));

console.log('Test bet added to localStorage:', testBet);
console.log('Total bets in localStorage:', existingBets.length);

// Update ScoreLeague placedBets array if available
if (window.scoreLeague) {
    window.scoreLeague.placedBets.push(testBet);
    console.log('Test bet added to ScoreLeague.placedBets array');
    console.log('ScoreLeague.placedBets length:', window.scoreLeague.placedBets.length);
    
    // Trigger renderMyBets
    console.log('Calling renderMyBets...');
    window.scoreLeague.renderMyBets();
    
    // Switch to My Bets tab
    console.log('Switching to My Bets tab...');
    window.scoreLeague.switchTab('mybets');
} else {
    console.log('ScoreLeague instance not found');
}

console.log('=== TEST BET INJECTION COMPLETE ===');
