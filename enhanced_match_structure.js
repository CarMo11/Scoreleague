// Enhanced Match Data Structure for ScoreLeague
// Supporting 5 most common football betting markets

const enhancedMatchStructure = {
    id: "match_001",
    league: "Premier League",
    country: "England",
    date: "2025-07-29",
    time: "15:30",
    status: "upcoming", // upcoming, live, finished
    
    teams: {
        home: {
            name: "Manchester United",
            shortName: "MUN",
            logo: "https://logos.api-sports.io/football/teams/33.png"
        },
        away: {
            name: "Liverpool",
            shortName: "LIV", 
            logo: "https://logos.api-sports.io/football/teams/40.png"
        }
    },
    
    // Final scores (null until match finishes)
    score: {
        home: null,
        away: null,
        totalGoals: null
    },
    
    // All betting markets with odds
    markets: {
        // 1. Traditional 1X2
        match_result: {
            "1": 2.1,  // Home win
            "X": 3.4,  // Draw
            "2": 3.2   // Away win
        },
        
        // 2. Over/Under 2.5 Goals
        total_goals: {
            "over_2_5": 1.85,
            "under_2_5": 1.95
        },
        
        // 3. Both Teams to Score
        both_teams_score: {
            "yes": 1.75,
            "no": 2.05
        },
        
        // 4. Double Chance
        double_chance: {
            "1X": 1.35,  // Home win or draw
            "X2": 1.65,  // Draw or away win
            "12": 1.25   // Home win or away win
        },
        
        // 5. Correct Score (most popular options)
        correct_score: {
            "1-0": 8.5,
            "2-0": 12.0,
            "2-1": 9.5,
            "1-1": 6.5,
            "0-0": 11.0,
            "0-1": 13.0,
            "0-2": 21.0,
            "1-2": 15.0,
            "3-0": 25.0,
            "3-1": 18.0,
            "other": 4.2  // Any other score
        }
    },
    
    // Player data for future goal scorer markets
    players: {
        home: [
            { id: "p1", name: "Marcus Rashford", position: "Forward" },
            { id: "p2", name: "Bruno Fernandes", position: "Midfielder" }
        ],
        away: [
            { id: "p3", name: "Mohamed Salah", position: "Forward" },
            { id: "p4", name: "Sadio Mané", position: "Forward" }
        ]
    }
};

// Enhanced bet slip structure to support multiple markets
const enhancedBetSlip = {
    id: "bet_001",
    userId: "user123",
    matchId: "match_001",
    market: "both_teams_score",  // which market they're betting on
    selection: "yes",            // their specific choice
    odds: 1.75,
    stake: 50,
    potentialWin: 87.5,
    placedAt: "2025-07-29T10:30:00Z",
    status: "pending"            // pending, won, lost
};

// League structure for European focus
const europeanLeagues = [
    {
        id: "premier_league",
        name: "Premier League",
        country: "England",
        logo: "https://logos.api-sports.io/football/leagues/39.png",
        priority: 1
    },
    {
        id: "la_liga", 
        name: "La Liga",
        country: "Spain",
        logo: "https://logos.api-sports.io/football/leagues/140.png",
        priority: 2
    },
    {
        id: "bundesliga",
        name: "Bundesliga", 
        country: "Germany",
        logo: "https://logos.api-sports.io/football/leagues/78.png",
        priority: 3
    },
    {
        id: "serie_a",
        name: "Serie A",
        country: "Italy", 
        logo: "https://logos.api-sports.io/football/leagues/135.png",
        priority: 4
    },
    {
        id: "ligue_1",
        name: "Ligue 1",
        country: "France",
        logo: "https://logos.api-sports.io/football/leagues/61.png", 
        priority: 5
    },
    {
        id: "champions_league",
        name: "Champions League",
        country: "Europe",
        logo: "https://logos.api-sports.io/football/leagues/2.png",
        priority: 0  // Highest priority
    }
];

// Private league structure
const privateLeague = {
    id: "league_abc123",
    name: "Friends Premier League",
    createdBy: "user123",
    members: [
        { userId: "user123", username: "john_doe", joinedAt: "2025-07-20" },
        { userId: "user456", username: "jane_smith", joinedAt: "2025-07-21" }
    ],
    maxMembers: 10,
    competitions: {
        weekly: {
            currentWeek: 1,
            startDate: "2025-07-28",
            endDate: "2025-08-04",
            leaderboard: [
                { userId: "user123", points: 150, betsWon: 3 },
                { userId: "user456", points: 120, betsWon: 2 }
            ]
        },
        season: {
            startDate: "2025-07-01", 
            endDate: "2026-06-30",
            leaderboard: [
                { userId: "user123", points: 1250, betsWon: 28 },
                { userId: "user456", points: 980, betsWon: 22 }
            ]
        }
    },
    settings: {
        allowInvites: true,
        publicJoin: false,
        chatEnabled: true
    }
};

export { enhancedMatchStructure, enhancedBetSlip, europeanLeagues, privateLeague };
