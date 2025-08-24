// Debug script to test My Bets functionality
console.log("=== TESTING MY BETS FUNCTIONALITY ===");

// Test localStorage
console.log("localStorage placedBets:", localStorage.getItem("placedBets"));
console.log("localStorage userCoins:", localStorage.getItem("userCoins"));

// Test ScoreLeague instance
if (window.scoreLeague) {
    console.log("ScoreLeague instance found!");
    console.log("ScoreLeague placedBets array:", window.scoreLeague.placedBets);
    console.log("ScoreLeague currentUser:", window.scoreLeague.currentUser);
    console.log("ScoreLeague userCoins:", window.scoreLeague.userCoins);
    
    console.log("Attempting to click My Bets tab...");
    const myBetsTab = document.querySelector("[data-tab=\"mybets\"]");
    if (myBetsTab) {
        console.log("My Bets tab found, clicking...");
        myBetsTab.click();
    } else {
        console.log("My Bets tab not found");
    }
} else {
    console.log("ScoreLeague instance not found");
}

console.log("=== DIRECT TEST OF RENDERMYBETS ===");
if (window.scoreLeague) {
    console.log("Calling renderMyBets directly...");
    window.scoreLeague.renderMyBets();
} else {
    console.log("ScoreLeague instance not found for renderMyBets");
}

// Test if we can inject a test bet
console.log("=== INJECTING TEST BET ===");
if (window.scoreLeague) {
    const testBet = {
        id: 'test-' + Date.now(),
        bets: [{
            matchId: 1,
            homeTeam: "Test Team A",
            awayTeam: "Test Team B",
            betType: "home",
            odds: 2.5
        }],
        stake: 50,
        totalOdds: 2.5,
        potentialWin: 125,
        placedAt: new Date().toISOString(),
        status: 'pending',
        actualWin: 0
    };
    
    console.log("Adding test bet:", testBet);
    window.scoreLeague.placedBets.push(testBet);
    
    // Save to localStorage
    localStorage.setItem('placedBets', JSON.stringify(window.scoreLeague.placedBets));
    
    console.log("Test bet added, calling renderMyBets again...");
    window.scoreLeague.renderMyBets();
} else {
    console.log("Cannot inject test bet - ScoreLeague instance not found");
}
