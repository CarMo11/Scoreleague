// Test script to simulate clicking My Bets tab
console.log("Testing My Bets functionality...");
console.log("Current localStorage placedBets:", localStorage.getItem('placedBets'));
console.log("Current userCoins:", localStorage.getItem('userCoins'));

// Simulate clicking My Bets tab
if (window.scoreLeague) {
    console.log("ScoreLeague instance found, calling switchTab('mybets')");
    window.scoreLeague.switchTab('mybets');
} else {
    console.log("ScoreLeague instance not found");
}
