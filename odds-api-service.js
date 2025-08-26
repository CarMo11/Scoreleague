// The Odds API Integration Service
if (typeof window !== 'undefined' && window.OddsAPIService) {
    // Already loaded once, skip redefining to avoid duplicate identifier error
    console.warn('OddsAPIService already defined, skipping re-load');
} else {
class OddsAPIService {
    constructor() {
        // API key order of precedence:
        // 1) localStorage value (user-provided)
        // 2) hard-coded fallback demo key
        const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('odds_api_key') : null;
        this.apiKey = storedKey || '083420a27f629c4c7e730cb10f70a125';
        // NOTE: the fallback key is subject to rate limits. Encourage testers to add their own.
        this.baseUrl = 'https://api.the-odds-api.com/v4';
        // Prefer calling our server proxy to keep the real key private
        this.apiBase = (typeof window !== 'undefined' && typeof window.API_BASE !== 'undefined') ? (window.API_BASE || '') : '';
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }

    // Allow runtime update of the API key and persist to localStorage
    setApiKey(newKey = '') {
        this.apiKey = (newKey || '').trim();
        if (typeof localStorage !== 'undefined') {
            if (this.apiKey) {
                localStorage.setItem('odds_api_key', this.apiKey);
            } else {
                localStorage.removeItem('odds_api_key');
            }
        }
        // Clear cache to force fresh fetches with new key
        this.cache.clear();
        console.log('🔑 Odds API key updated to', this.apiKey ? this.apiKey.slice(0, 6) + '...' : 'EMPTY');
    }

    // Get available sports (free endpoint)
    async getSports() {
        const isFileProtocol = (typeof window !== 'undefined') && (window.location.protocol === 'file:');
        // Prefer server proxy in non-local environments
        if (!isFileProtocol) {
            try {
                const url = `${this.apiBase}/api/odds/sports`;
                const response = await fetch(url);
                if (response.ok) {
                    return await response.json();
                }
                // If proxy not configured, fall through to direct only if client key is present
            } catch (_) {}
        }
        // Fallback (may require client key)
        try {
            const response = await fetch(`${this.baseUrl}/sports/?apiKey=${this.apiKey}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching sports:', error);
            return null;
        }
    }

    // Get odds for a specific sport (uses quota)
    async getOdds(sportKey = 'soccer_epl', regions = 'uk', markets = 'h2h,totals') {
        const cacheKey = `${sportKey}_${regions}_${markets}`;
        
        // Detect local/offline context
        const isLocalEnv = (typeof window !== 'undefined') && (
            window.location.protocol === 'file:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
        );

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('Using cached odds data');
                return cached.data;
            }
        }

        // Prefer server proxy to keep key private (works on localhost when served by our Python server)
        try {
            const proxyUrl = `${this.apiBase}/api/odds?sport=${encodeURIComponent(sportKey)}&regions=${regions}&markets=${markets}&oddsFormat=decimal`;
            console.log('Fetching odds via proxy:', proxyUrl);
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const data = await response.json();
                this.cache.set(cacheKey, { data, timestamp: Date.now() });
                console.log(`Fetched ${Array.isArray(data) ? data.length : 0} matches via proxy`);
                return data;
            }
            // If proxy is not configured (e.g., 501) or fails, try direct only if we have a client key
        } catch (_) {
            // ignore and try fallback
        }

        try {
            if (isFileProtocol) {
                console.warn('🛈 File protocol detected – skipping direct network calls, returning demo null');
                return null;
            }
            if (!this.apiKey) {
                console.warn('No client API key set; skipping direct The Odds API request.');
                return null;
            }
            const url = `${this.baseUrl}/sports/${sportKey}/odds/?regions=${regions}&markets=${markets}&oddsFormat=decimal&apiKey=${this.apiKey}`;
            console.log('Fetching odds directly from:', url);
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please get a free key from https://the-odds-api.com/');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            console.log(`Fetched ${Array.isArray(data) ? data.length : 0} matches from The Odds API`);
            return data;
        } catch (error) {
            console.error('Error fetching odds:', error);
            return null;
        }
    }

    // Convert API data to our app format
    convertToAppFormat(apiData) {
        if (!apiData || !Array.isArray(apiData)) return [];

        return apiData.map((match, index) => {
            // Find h2h (head-to-head) market for match result odds
            const h2hMarket = match.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
            const totalsMarket = match.bookmakers?.[0]?.markets?.find(m => m.key === 'totals');

            // Extract odds from h2h market
            let homeOdds = 2.0, drawOdds = 3.0, awayOdds = 2.5;
            if (h2hMarket && h2hMarket.outcomes) {
                const homeOutcome = h2hMarket.outcomes.find(o => o.name === match.home_team);
                const awayOutcome = h2hMarket.outcomes.find(o => o.name === match.away_team);
                const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');

                if (homeOutcome) homeOdds = homeOutcome.price;
                if (awayOutcome) awayOdds = awayOutcome.price;
                if (drawOutcome) drawOdds = drawOutcome.price;
            }

            // Extract totals odds (over/under)
            let overOdds = 1.85, underOdds = 1.95;
            if (totalsMarket && totalsMarket.outcomes) {
                const overOutcome = totalsMarket.outcomes.find(o => o.name === 'Over');
                const underOutcome = totalsMarket.outcomes.find(o => o.name === 'Under');
                
                if (overOutcome) overOdds = overOutcome.price;
                if (underOutcome) underOdds = underOutcome.price;
            }

            // Determine match status and time
            const commenceTime = new Date(match.commence_time);
            const now = new Date();
            const isUpcoming = commenceTime > now;
            const timeDiff = Math.abs(commenceTime - now);
            const isLive = !isUpcoming && timeDiff < (2 * 60 * 60 * 1000); // Within 2 hours

            return {
                id: match.id || `api_${index}`,
                homeTeam: match.home_team,
                awayTeam: match.away_team,
                league: this.getLeagueName(match.sport_key),
                time: commenceTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                date: commenceTime.toLocaleDateString(),
                status: isLive ? 'live' : (isUpcoming ? 'upcoming' : 'finished'),
                score: isLive ? { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) } : null,
                markets: {
                    match_result: {
                        home: homeOdds,
                        draw: drawOdds,
                        away: awayOdds
                    },
                    total_goals: {
                        over: overOdds,
                        under: underOdds
                    },
                    both_teams_score: {
                        yes: 1.72,
                        no: 2.05
                    }
                }
            };
        });
    }

    // Convert sport key to readable league name
    getLeagueName(sportKey) {
        const leagueMap = {
            'soccer_epl': 'Premier League',
            'soccer_spain_la_liga': 'La Liga',
            'soccer_germany_bundesliga': 'Bundesliga',
            'soccer_germany_bundesliga2': '2. Bundesliga',
            'soccer_italy_serie_a': 'Serie A',
            'soccer_italy_serie_b': 'Serie B',
            'soccer_france_ligue_one': 'Ligue 1',
            'soccer_france_ligue_two': 'Ligue 2',
            'soccer_uefa_champs_league': 'Champions League',
            'soccer_uefa_europa_league': 'Europa League',
            'soccer_england_efl_champ': 'Championship'
        };
        return leagueMap[sportKey] || 'Football League';
    }

    // Get multiple leagues at once (prioritizing currently active leagues)
    async getMultipleLeagues() {
        // Start with 2. Bundesliga for immediate testing (currently active)
        const leagues = [
            'soccer_germany_bundesliga2',  // 2. Bundesliga (currently running)
            'soccer_england_efl_champ',    // Championship (currently running)
            'soccer_germany_bundesliga',   // Bundesliga (starts soon)
            'soccer_epl'                   // Premier League (starts in 2 weeks)
        ];
        const allMatches = [];

        for (const league of leagues) {
            console.log(`Fetching matches for ${league}...`);
            const odds = await this.getOdds(league);
            if (odds && odds.length > 0) {
                const converted = this.convertToAppFormat(odds);
                console.log(`Found ${converted.length} matches for ${this.getLeagueName(league)}`);
                allMatches.push(...converted);
            } else {
                console.log(`No matches found for ${this.getLeagueName(league)}`);
            }
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`Total matches loaded: ${allMatches.length}`);
        return allMatches;
    }
}

// Make it globally available
window.OddsAPIService = OddsAPIService;
window.oddsAPIService = new OddsAPIService();
}

