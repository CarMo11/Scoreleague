// odds-api-service.js (root)

// If already loaded, don’t redefine (avoids duplicate identifier errors during HMR or multi-bundle)
if (typeof window !== 'undefined' && window.OddsAPIService) {
  console.warn('OddsAPIService already defined, skipping re-load');
} else {

class OddsAPIService {
  constructor() {
    // API key precedence: user-provided localStorage value only (no hardcoded fallback!)
    const storedKey = (typeof localStorage !== 'undefined')
      ? localStorage.getItem('odds_api_key')
      : null;

    this.apiKey  = (storedKey || '').trim();             // <- no demo key bundled
    this.baseUrl = 'https://api.the-odds-api.com/v4';    // direct API (fallback only)
    this.apiBase = (typeof window !== 'undefined' && typeof window.API_BASE !== 'undefined')
      ? (window.API_BASE || '')
      : '';                                              // server proxy (preferred)

    this.cache = new Map();                              // simple in-memory cache
    this.cacheTimeout = 10 * 60 * 1000;                  // 10 minutes
  }

  // Allow runtime update of the API key and persist to localStorage
  setApiKey(newKey = '') {
    this.apiKey = (newKey || '').trim();
    if (typeof localStorage !== 'undefined') {
      if (this.apiKey) localStorage.setItem('odds_api_key', this.apiKey);
      else localStorage.removeItem('odds_api_key');
    }
    this.cache.clear(); // force fresh data after key change
    console.log('🔑 Odds API key updated to', this.apiKey ? this.apiKey.slice(0, 6) + '…' : 'EMPTY');
  }

  // Get available sports (free endpoint via proxy; only direct-call if a client key exists)
  async getSports() {
    const isFileProtocol = (typeof window !== 'undefined') && (window.location.protocol === 'file:');

    // Prefer server proxy in any non-file context
    if (!isFileProtocol && this.apiBase) {
      try {
        const url = `${this.apiBase}/api/odds/sports`;
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) return await response.json();
        // fall through to direct only if client key is set
      } catch (_) { /* ignore and try fallback */ }
    }

    // Fallback (only if a client key is explicitly set by the user)
    if (!this.apiKey) {
      console.warn('No client API key set; skipping direct sports fetch.');
      return null;
    }

    try {
      const url = `${this.baseUrl}/sports/?apiKey=${this.apiKey}`;
      const safeUrl = `${this.baseUrl}/sports/?apiKey=***`;
      console.log('Fetching sports directly from:', safeUrl);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error('Error fetching sports:', err);
      return null;
    }
  }

  // Get odds for a specific league; prefer proxy; fallback to direct only with a user key
  async getOdds(sportKey = 'soccer_epl', regions = 'uk', markets = 'h2h,totals') {
    const cacheKey = `${sportKey}_${regions}_${markets}`;

    // Serve from cache if fresh
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('Using cached odds data');
        return cached.data;
      }
    }

    // Try server proxy first (keeps real key private)
    if (this.apiBase) {
      try {
        const proxyUrl =
          `${this.apiBase}/api/odds?sport=${encodeURIComponent(sportKey)}&regions=${regions}&markets=${markets}&oddsFormat=decimal`;
        console.log('Fetching odds via proxy:', proxyUrl);
        const response = await fetch(proxyUrl, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
          console.log(`Fetched ${Array.isArray(data) ? data.length : 0} matches via proxy`);
          return data;
        }
        // fall through to direct only if a client key is set
      } catch (_) { /* ignore and try fallback */ }
    }

    // Direct call only if a user key is present
    if (!this.apiKey) {
      console.warn('No client API key set; skipping direct The Odds API request.');
      return null;
    }

    try {
      const url =
        `${this.baseUrl}/sports/${sportKey}/odds/?regions=${regions}&markets=${markets}&oddsFormat=decimal&apiKey=${this.apiKey}`;
      const safeUrl =
        `${this.baseUrl}/sports/${sportKey}/odds/?regions=${regions}&markets=${markets}&oddsFormat=decimal&apiKey=***`;
      console.log('Fetching odds directly from:', safeUrl);

      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 401) throw new Error('Invalid API key. Get a free key at https://the-odds-api.com/');
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      console.log(`Fetched ${Array.isArray(data) ? data.length : 0} matches from The Odds API`);
      return data;
    } catch (err) {
      console.error('Error fetching odds:', err);
      return null;
    }
  }

  // Convert API data to our app format
  convertToAppFormat(apiData) {
    if (!apiData || !Array.isArray(apiData)) return [];
    return apiData.map((match, index) => {
      const h2hMarket = match.bookmakers?.[0]?.markets?.find(m => m.key === 'h2h');
      const totalsMarket = match.bookmakers?.[0]?.markets?.find(m => m.key === 'totals');

      let homeOdds = 2.0, drawOdds = 3.0, awayOdds = 2.5;
      if (h2hMarket?.outcomes) {
        const homeOutcome = h2hMarket.outcomes.find(o => o.name === match.home_team);
        const awayOutcome = h2hMarket.outcomes.find(o => o.name === match.away_team);
        const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');
        if (homeOutcome) homeOdds = homeOutcome.price;
        if (awayOutcome) awayOdds = awayOutcome.price;
        if (drawOutcome) drawOdds = drawOutcome.price;
      }

      let overOdds = 1.85, underOdds = 1.95;
      if (totalsMarket?.outcomes) {
        const overOutcome = totalsMarket.outcomes.find(o => o.name === 'Over');
        const underOutcome = totalsMarket.outcomes.find(o => o.name === 'Under');
        if (overOutcome) overOdds = overOutcome.price;
        if (underOutcome) underOdds = underOutcome.price;
      }

      const commenceTime = new Date(match.commence_time);
      const now = new Date();
      const isUpcoming = commenceTime > now;
      const isLive = !isUpcoming && Math.abs(commenceTime - now) < (2 * 60 * 60 * 1000);

      return {
        id: match.id || `api_${index}`,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        league: this.getLeagueName(match.sport_key),
        time: commenceTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: commenceTime.toLocaleDateString(),
        status: isLive ? 'live' : (isUpcoming ? 'upcoming' : 'finished'),
        score: isLive ? { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) } : null,
        markets: {
          match_result: { home: homeOdds, draw: drawOdds, away: awayOdds },
          total_goals: { over: overOdds, under: underOdds },
          both_teams_score: { yes: 1.72, no: 2.05 }
        }
      };
    });
  }

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

  // Convenience: fetch a few leagues (throttled) and flatten
  async getMultipleLeagues() {
    const leagues = [
      'soccer_germany_bundesliga2',
      'soccer_england_efl_champ',
      'soccer_germany_bundesliga',
      'soccer_epl'
    ];
    const allMatches = [];
    for (const league of leagues) {
      console.log(`Fetching matches for ${league}…`);
      const odds = await this.getOdds(league);
      if (odds?.length) {
        const converted = this.convertToAppFormat(odds);
        console.log(`Found ${converted.length} matches for ${this.getLeagueName(league)}`);
        allMatches.push(...converted);
      } else {
        console.log(`No matches found for ${this.getLeagueName(league)}`);
      }
      await new Promise(r => setTimeout(r, 200)); // tiny delay
    }
    console.log(`Total matches loaded: ${allMatches.length}`);
    return allMatches;
  }
}

// Export to window
window.OddsAPIService = OddsAPIService;
window.oddsAPIService = new OddsAPIService();

} // end guard
