const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Data storage
const DATA_FILE = path.join(__dirname, 'multiuser_data.json');

// Initialize data structure
let gameData = {
    users: {},
    leagues: {},
    matches: [],
    bets: {},
    version: "1.0.0",
    lastUpdated: new Date().toISOString()
};

// Load existing data
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            gameData = { ...gameData, ...JSON.parse(data) };
            console.log('✅ Loaded existing game data');
        }
    } catch (error) {
        console.log('⚠️ Could not load existing data, starting fresh');
    }
}

// Save data
function saveData() {
    try {
        gameData.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(gameData, null, 2));
        console.log('💾 Data saved successfully');
    } catch (error) {
        console.error('❌ Error saving data:', error);
    }
}

// Initialize demo matches
function initializeDemoMatches() {
    if (gameData.matches.length === 0) {
        gameData.matches = [
            {
                id: 'match_1',
                homeTeam: 'FC Schalke 04',
                awayTeam: 'Hertha BSC',
                league: '2. Bundesliga',
                date: '2024-08-10',
                time: '15:30',
                status: 'upcoming',
                markets: {
                    '1x2': {
                        '1': { label: 'Schalke Win', odds: 2.10 },
                        'X': { label: 'Draw', odds: 3.40 },
                        '2': { label: 'Hertha Win', odds: 3.20 }
                    },
                    'over_under': {
                        'over': { label: 'Over 2.5', odds: 1.85 },
                        'under': { label: 'Under 2.5', odds: 1.95 }
                    },
                    'both_teams': {
                        'yes': { label: 'Both Score', odds: 1.70 },
                        'no': { label: 'No Both Score', odds: 2.10 }
                    }
                }
            },
            {
                id: 'match_2',
                homeTeam: 'Hamburger SV',
                awayTeam: 'FC Köln',
                league: '2. Bundesliga',
                date: '2024-08-10',
                time: '18:30',
                status: 'upcoming',
                markets: {
                    '1x2': {
                        '1': { label: 'Hamburg Win', odds: 1.95 },
                        'X': { label: 'Draw', odds: 3.60 },
                        '2': { label: 'Köln Win', odds: 3.80 }
                    },
                    'over_under': {
                        'over': { label: 'Over 2.5', odds: 1.90 },
                        'under': { label: 'Under 2.5', odds: 1.90 }
                    },
                    'both_teams': {
                        'yes': { label: 'Both Score', odds: 1.75 },
                        'no': { label: 'No Both Score', odds: 2.05 }
                    }
                }
            },
            {
                id: 'match_3',
                homeTeam: 'Borussia Dortmund',
                awayTeam: 'Bayern Munich',
                league: 'Bundesliga',
                date: '2024-08-11',
                time: '18:30',
                status: 'upcoming',
                markets: {
                    '1x2': {
                        '1': { label: 'Dortmund Win', odds: 3.20 },
                        'X': { label: 'Draw', odds: 3.80 },
                        '2': { label: 'Bayern Win', odds: 2.05 }
                    },
                    'over_under': {
                        'over': { label: 'Over 2.5', odds: 1.65 },
                        'under': { label: 'Under 2.5', odds: 2.25 }
                    },
                    'both_teams': {
                        'yes': { label: 'Both Score', odds: 1.55 },
                        'no': { label: 'No Both Score', odds: 2.40 }
                    }
                }
            },
            {
                id: 'match_4',
                homeTeam: 'Arsenal',
                awayTeam: 'Manchester City',
                league: 'Premier League',
                date: '2024-08-11',
                time: '16:30',
                status: 'upcoming',
                markets: {
                    '1x2': {
                        '1': { label: 'Arsenal Win', odds: 2.80 },
                        'X': { label: 'Draw', odds: 3.40 },
                        '2': { label: 'City Win', odds: 2.40 }
                    },
                    'over_under': {
                        'over': { label: 'Over 2.5', odds: 1.70 },
                        'under': { label: 'Under 2.5', odds: 2.15 }
                    },
                    'both_teams': {
                        'yes': { label: 'Both Score', odds: 1.60 },
                        'no': { label: 'No Both Score', odds: 2.30 }
                    }
                }
            },
            {
                id: 'match_5',
                homeTeam: 'Real Madrid',
                awayTeam: 'Barcelona',
                league: 'La Liga',
                date: '2024-08-12',
                time: '21:00',
                status: 'upcoming',
                markets: {
                    '1x2': {
                        '1': { label: 'Real Win', odds: 2.20 },
                        'X': { label: 'Draw', odds: 3.60 },
                        '2': { label: 'Barca Win', odds: 3.00 }
                    },
                    'over_under': {
                        'over': { label: 'Over 2.5', odds: 1.80 },
                        'under': { label: 'Under 2.5', odds: 2.00 }
                    },
                    'both_teams': {
                        'yes': { label: 'Both Score', odds: 1.65 },
                        'no': { label: 'No Both Score', odds: 2.20 }
                    }
                }
            }
        ];
        saveData();
        console.log('🏈 Initialized demo matches');
    }
}

// Generate unique IDs
function generateId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Normalize market and selection codes for backward-compat
function normalizeMarket(market) {
    const m = String(market || '').toLowerCase();
    if (['match_result', '1x2', 'match-winner', 'matchwinner'].includes(m)) return 'match_result';
    if (['double_chance', 'doublechance', 'dc'].includes(m)) return 'double_chance';
    if (['total_goals', 'over_under', 'overunder', 'over_under_2_5', 'over2_5', 'under2_5', 'ou', 'ou2_5'].includes(m)) return 'total_goals';
    if (['btts', 'both_teams', 'both_teams_to_score', 'bothteamstoscore', 'bothteams'].includes(m)) return 'btts';
    return m;
}

function normalizeSelection(selection, market) {
    const sel = String(selection || '').toLowerCase();
    const m = normalizeMarket(market);
    if (m === 'match_result') {
        if (sel === '1' || sel === 'home' || sel === 'home_win') return 'home';
        if (sel === 'x' || sel === 'draw') return 'draw';
        if (sel === '2' || sel === 'away' || sel === 'away_win') return 'away';
    }
    if (m === 'double_chance') {
        if (['1x', '1-x', '1orx'].includes(sel)) return '1x';
        if (['12', '1-2', '1or2'].includes(sel)) return '12';
        if (['x2', 'x-2', 'xor2'].includes(sel)) return 'x2';
    }
    if (m === 'total_goals') {
        if (sel.startsWith('over')) return 'over';
        if (sel.startsWith('under')) return 'under';
    }
    if (m === 'btts') {
        if (sel === 'yes' || sel === 'y') return 'yes';
        if (sel === 'no' || sel === 'n') return 'no';
    }
    return sel;
}

// Compute settlement winners for all supported markets
function computeMarketResults(homeGoals, awayGoals) {
    const h = Number(homeGoals) || 0;
    const a = Number(awayGoals) || 0;
    const total = h + a;
    const results = {
        match_result: (h > a) ? 'home' : (h < a ? 'away' : 'draw'),
        double_chance: new Set(), // fill with 1x, 12, x2
        total_goals: (total >= 3) ? 'over' : 'under',
        btts: (h > 0 && a > 0) ? 'yes' : 'no'
    };
    if (h >= a) results.double_chance.add('1x');
    if (h !== a) results.double_chance.add('12');
    if (a >= h) results.double_chance.add('x2');
    return results;
}

// API Routes
// Health check
app.get('/health', (req, res) => {
    res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
    res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// User registration/login
app.post('/api/auth/login', (req, res) => {
    const { username } = req.body;
    
    if (!username || username.trim().length < 2) {
        return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }
    
    const userId = generateId('user_');
    const cleanUsername = username.trim();
    
    // Check if username exists
    const existingUser = Object.values(gameData.users).find(u => u.username === cleanUsername);
    if (existingUser) {
        // Return existing user
        res.json({
            success: true,
            user: existingUser
        });
    } else {
        // Create new user
        const newUser = {
            id: userId,
            username: cleanUsername,
            coins: 1000,
            joinedAt: new Date().toISOString(),
            stats: {
                totalBets: 0,
                totalWinnings: 0,
                biggestWin: 0,
                totalCombinedOdds: 0
            }
        };
        
        gameData.users[userId] = newUser;
        saveData();
        
        res.json({
            success: true,
            user: newUser
        });
    }
});

// Get matches
app.get('/api/matches', (req, res) => {
    res.json({
        success: true,
        matches: gameData.matches
    });
});

// Settle all bets for a match based on final score
app.post('/api/matches/:matchId/settle', (req, res) => {
    const { matchId } = req.params;
    let { homeGoals, awayGoals } = req.body || {};
    const h = Math.max(0, parseInt(homeGoals, 10) || 0);
    const a = Math.max(0, parseInt(awayGoals, 10) || 0);

    // Find match
    const matchIdx = gameData.matches.findIndex(m => m && String(m.id) === String(matchId));
    if (matchIdx === -1) {
        return res.status(404).json({ error: 'Match not found' });
    }
    const match = gameData.matches[matchIdx];

    // Update match state
    match.status = 'finished';
    match.score = { home: h, away: a };

    // Compute winners
    const results = computeMarketResults(h, a);

    // Iterate all user bets and settle those belonging to this match
    let settled = 0;
    let won = 0;
    const settledBets = [];
    for (const [uid, list] of Object.entries(gameData.bets)) {
        if (!Array.isArray(list)) continue;
        for (const bet of list) {
            try {
                if (!bet || bet.status !== 'pending') continue;
                if (String(bet.matchId) !== String(matchId)) continue;
                const market = normalizeMarket(bet.market);
                const sel = normalizeSelection(bet.selection, market);

                let isWinner = false;
                if (market === 'match_result') {
                    isWinner = (sel === results.match_result);
                } else if (market === 'double_chance') {
                    isWinner = results.double_chance.has(sel);
                } else if (market === 'total_goals') {
                    isWinner = (sel === results.total_goals);
                } else if (market === 'btts') {
                    isWinner = (sel === results.btts);
                } else {
                    // Unknown market: leave pending
                    continue;
                }

                bet.status = isWinner ? 'won' : 'lost';
                settled += 1;
                if (isWinner) {
                    won += 1;
                    const user = gameData.users[uid];
                    if (user) {
                        const stake = Number(bet.stake || 0);
                        const odds = Number(bet.odds || 1);
                        const payout = Math.round(Number(bet.potentialWin || 0) || (stake * (isFinite(odds) && odds > 0 ? odds : 1)));
                        user.coins = Math.max(0, Math.round(Number(user.coins || 0)) + payout);
                        user.stats = user.stats || {};
                        user.stats.totalWinnings = Math.max(0, Math.round(Number(user.stats.totalWinnings || 0)) + payout);
                        user.stats.biggestWin = Math.max(Math.round(Number(user.stats.biggestWin || 0)), payout);
                        io.emit('betSettled', { bet, user });
                    }
                } else {
                    const user = gameData.users[uid];
                    if (user) io.emit('betSettled', { bet, user });
                }
                settledBets.push(bet.id);
            } catch (e) {
                // continue
            }
        }
    }

    saveData();
    io.emit('matchSettled', { matchId, score: { home: h, away: a }, results: {
        match_result: results.match_result,
        double_chance: Array.from(results.double_chance),
        total_goals: results.total_goals,
        btts: results.btts
    }});

    res.json({ success: true, match, settled, won });
});

// Create league
app.post('/api/leagues/create', (req, res) => {
    const { name, creatorId, description } = req.body;
    
    if (!name || !creatorId) {
        return res.status(400).json({ error: 'League name and creator required' });
    }
    
    const leagueId = generateId('league_');
    const inviteCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    
    const league = {
        id: leagueId,
        name: name.trim(),
        description: description?.trim() || '',
        creatorId,
        inviteCode,
        members: [creatorId],
        createdAt: new Date().toISOString(),
        settings: {
            maxMembers: 10
        }
    };
    
    gameData.leagues[leagueId] = league;
    saveData();
    
    // Notify all connected clients
    io.emit('leagueCreated', league);
    
    res.json({
        success: true,
        league
    });
});

// Join league
app.post('/api/leagues/join', (req, res) => {
    const { inviteCode, userId } = req.body;
    
    if (!inviteCode || !userId) {
        return res.status(400).json({ error: 'Invite code and user ID required' });
    }
    
    const league = Object.values(gameData.leagues).find(l => l.inviteCode === inviteCode.toUpperCase());
    
    if (!league) {
        return res.status(404).json({ error: 'League not found' });
    }
    
    if (league.members.includes(userId)) {
        return res.status(400).json({ error: 'Already a member of this league' });
    }
    
    if (league.members.length >= league.settings.maxMembers) {
        return res.status(400).json({ error: 'League is full' });
    }
    
    league.members.push(userId);
    saveData();
    
    // Notify all connected clients
    io.emit('leagueUpdated', league);
    
    res.json({
        success: true,
        league
    });
});

// Get user's leagues
app.get('/api/leagues/user/:userId', (req, res) => {
    const { userId } = req.params;
    
    const userLeagues = Object.values(gameData.leagues).filter(league => 
        league.members.includes(userId)
    );
    
    res.json({
        success: true,
        leagues: userLeagues
    });
});

// Place bet
app.post('/api/bets/place', (req, res) => {
    const { userId, matchId, market, selection, odds, stake, leagueIds, match } = req.body;
    
    if (!userId || !matchId || !market || !selection || !odds || !stake) {
        return res.status(400).json({ error: 'Missing required bet information' });
    }
    
    const user = gameData.users[userId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.coins < stake) {
        return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    const betId = generateId('bet_');
    const bet = {
        id: betId,
        userId,
        matchId,
        match: match || null,
        market,
        selection,
        odds,
        stake,
        potentialWin: Math.round(stake * odds),
        placedAt: new Date().toISOString(),
        status: 'pending',
        leagueIds: leagueIds || []
    };
    
    // Deduct coins
    user.coins -= stake;
    user.stats.totalBets += 1;
    
    // Store bet
    if (!gameData.bets[userId]) {
        gameData.bets[userId] = [];
    }
    gameData.bets[userId].push(bet);
    
    saveData();
    
    // Notify all connected clients
    io.emit('betPlaced', { bet, user });
    
    res.json({
        success: true,
        bet,
        user
    });
});

// Get user bets
app.get('/api/bets/user/:userId', (req, res) => {
    const { userId } = req.params;
    
    const userBets = gameData.bets[userId] || [];
    
    res.json({
        success: true,
        bets: userBets
    });
});

// Settle a bet (won/lost) and credit coins for Node mode
app.post('/api/bets/settle', (req, res) => {
    const { betId, result } = req.body || {};
    const lower = String(result || '').toLowerCase();
    if (!betId || (lower !== 'won' && lower !== 'lost')) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Find bet across all users
    let foundUserId = null;
    let betRef = null;
    for (const [uid, list] of Object.entries(gameData.bets)) {
        if (!Array.isArray(list)) continue;
        const idx = list.findIndex(b => b && b.id === betId);
        if (idx >= 0) {
            betRef = list[idx];
            foundUserId = uid;
            break;
        }
    }
    if (!betRef) {
        return res.status(404).json({ error: 'Bet not found' });
    }

    const prevStatus = String(betRef.status || 'pending').toLowerCase();
    if (prevStatus !== 'pending') {
        return res.status(400).json({ error: 'Bet already settled' });
    }

    const user = gameData.users[foundUserId];
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    betRef.status = lower; // 'won' | 'lost'

    // Credit payout on wins
    if (lower === 'won') {
        const stake = Number(betRef.stake || 0);
        const odds = Number(betRef.odds || 1);
        const payout = Math.round(Number(betRef.potentialWin || 0) || (stake * (isFinite(odds) && odds > 0 ? odds : 1)));
        user.coins = Math.max(0, Math.round(Number(user.coins || 0)) + payout);
        user.stats = user.stats || {};
        user.stats.totalWinnings = Math.max(0, Math.round(Number(user.stats.totalWinnings || 0)) + payout);
        user.stats.biggestWin = Math.max(Math.round(Number(user.stats.biggestWin || 0)), payout);
    }

    saveData();
    io.emit('betSettled', { bet: betRef, user });

    res.json({ success: true, bet: betRef, user });
});

// Get league leaderboard
app.get('/api/leagues/:leagueId/leaderboard', (req, res) => {
    const { leagueId } = req.params;
    
    const league = gameData.leagues[leagueId];
    if (!league) {
        return res.status(404).json({ error: 'League not found' });
    }
    
    const leaderboard = league.members.map(userId => {
        const user = gameData.users[userId];
        const userBets = gameData.bets[userId] || [];
        
        // Calculate league-specific stats
        const leagueBets = userBets.filter(bet => 
            bet.leagueIds && bet.leagueIds.includes(leagueId)
        );
        
        const leagueWinnings = leagueBets
            .filter(bet => bet.status === 'won')
            .reduce((sum, bet) => sum + bet.potentialWin, 0);
        
        return {
            ...user,
            leagueStats: {
                bets: leagueBets.length,
                winnings: leagueWinnings,
                totalStaked: leagueBets.reduce((sum, bet) => sum + bet.stake, 0)
            }
        };
    }).sort((a, b) => b.coins - a.coins);
    
    res.json({
        success: true,
        leaderboard
    });
});

// WebSocket connections
io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);
    
    // Send current game state
    socket.emit('gameState', {
        matches: gameData.matches,
        leagues: gameData.leagues
    });
    
    socket.on('disconnect', () => {
        console.log('👋 User disconnected:', socket.id);
    });
});

// Initialize and start server
loadData();
initializeDemoMatches();

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 ScoreLeague Multi-User Server running on:');
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Network: http://192.168.178.51:${PORT}`);
    console.log('');
    console.log('📱 Share the network URL with your testers!');
    console.log('🏆 Ready for private league competition!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n💾 Saving data before shutdown...');
    saveData();
    process.exit(0);
});
