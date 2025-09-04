#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import threading
import time
from urllib.parse import urlparse, parse_qs, unquote, quote
from datetime import datetime
import uuid
import urllib.request
import urllib.error

# Simple in-memory caches for odds endpoints to conserve API credits
ODDS_CACHE_TTL = int(os.environ.get('ODDS_CACHE_TTL_SECONDS', '1800'))  # 30 minutes default
ODDS_SPORTS_CACHE = {'data': None, 'ts': 0}
ODDS_CACHE = {}  # key -> {'data': list, 'ts': float}

# Optional lightweight debug logging for proxy paths
LOG_PROXY_DEBUG = os.environ.get('LOG_PROXY_DEBUG', '0').lower() in ('1', 'true', 'yes', 'on')
def proxy_log(path, mode, detail=''):
    if LOG_PROXY_DEBUG:
        try:
            print(f"🔎 [{datetime.now().isoformat()}] {path} mode={mode} {detail}".strip())
        except Exception:
            pass

class MultiUserGameServer:
    def __init__(self):
        # Allow overriding data directory for cloud hosts with persistent disks
        data_dir = os.environ.get('DATA_DIR', '.')
        self.data_file = os.path.join(data_dir, 'multiuser_data.json')
        self.game_data = {
            'users': {},
            'leagues': {},
            'matches': [],
            'bets': {},
            'version': '1.0.0',
            'lastUpdated': datetime.now().isoformat()
        }
        self.load_data()
        self.initialize_demo_matches()
    
    def load_data(self):
        """Load existing game data"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    loaded_data = json.load(f)
                    self.game_data.update(loaded_data)
                print('✅ Loaded existing game data')
        except Exception as e:
            print(f'⚠️ Could not load existing data: {e}')
    
    def save_data(self):
        """Save game data to file"""
        try:
            self.game_data['lastUpdated'] = datetime.now().isoformat()
            with open(self.data_file, 'w') as f:
                json.dump(self.game_data, f, indent=2)
            print('💾 Data saved successfully')
        except Exception as e:
            print(f'❌ Error saving data: {e}')
    
    def generate_id(self, prefix=''):
        """Generate unique ID"""
        return f"{prefix}{int(time.time())}{uuid.uuid4().hex[:6]}"
    
    def initialize_demo_matches(self):
        """Initialize demo matches if none exist"""
        if not self.game_data['matches']:
            self.game_data['matches'] = [
                {
                    'id': 'match_1',
                    'homeTeam': 'FC Schalke 04',
                    'awayTeam': 'Hertha BSC',
                    'league': '2. Bundesliga',
                    'date': '2024-08-10',
                    'time': '15:30',
                    'status': 'upcoming',
                    'markets': {
                        '1x2': {
                            '1': {'label': 'Schalke Win', 'odds': 2.10},
                            'X': {'label': 'Draw', 'odds': 3.40},
                            '2': {'label': 'Hertha Win', 'odds': 3.20}
                        },
                        'over_under': {
                            'over': {'label': 'Over 2.5', 'odds': 1.85},
                            'under': {'label': 'Under 2.5', 'odds': 1.95}
                        },
                        'both_teams': {
                            'yes': {'label': 'Both Score', 'odds': 1.70},
                            'no': {'label': 'No Both Score', 'odds': 2.10}
                        }
                    }
                },
                {
                    'id': 'match_2',
                    'homeTeam': 'Hamburger SV',
                    'awayTeam': 'FC Köln',
                    'league': '2. Bundesliga',
                    'date': '2024-08-10',
                    'time': '18:30',
                    'status': 'upcoming',
                    'markets': {
                        '1x2': {
                            '1': {'label': 'Hamburg Win', 'odds': 1.95},
                            'X': {'label': 'Draw', 'odds': 3.60},
                            '2': {'label': 'Köln Win', 'odds': 3.80}
                        },
                        'over_under': {
                            'over': {'label': 'Over 2.5', 'odds': 1.90},
                            'under': {'label': 'Under 2.5', 'odds': 1.90}
                        },
                        'both_teams': {
                            'yes': {'label': 'Both Score', 'odds': 1.75},
                            'no': {'label': 'No Both Score', 'odds': 2.05}
                        }
                    }
                },
                {
                    'id': 'match_3',
                    'homeTeam': 'Borussia Dortmund',
                    'awayTeam': 'Bayern Munich',
                    'league': 'Bundesliga',
                    'date': '2024-08-11',
                    'time': '18:30',
                    'status': 'upcoming',
                    'markets': {
                        '1x2': {
                            '1': {'label': 'Dortmund Win', 'odds': 3.20},
                            'X': {'label': 'Draw', 'odds': 3.80},
                            '2': {'label': 'Bayern Win', 'odds': 2.05}
                        },
                        'over_under': {
                            'over': {'label': 'Over 2.5', 'odds': 1.65},
                            'under': {'label': 'Under 2.5', 'odds': 2.25}
                        },
                        'both_teams': {
                            'yes': {'label': 'Both Score', 'odds': 1.55},
                            'no': {'label': 'No Both Score', 'odds': 2.40}
                        }
                    }
                },
                {
                    'id': 'match_4',
                    'homeTeam': 'Arsenal',
                    'awayTeam': 'Manchester City',
                    'league': 'Premier League',
                    'date': '2024-08-11',
                    'time': '16:30',
                    'status': 'upcoming',
                    'markets': {
                        '1x2': {
                            '1': {'label': 'Arsenal Win', 'odds': 2.80},
                            'X': {'label': 'Draw', 'odds': 3.40},
                            '2': {'label': 'City Win', 'odds': 2.40}
                        },
                        'over_under': {
                            'over': {'label': 'Over 2.5', 'odds': 1.70},
                            'under': {'label': 'Under 2.5', 'odds': 2.15}
                        },
                        'both_teams': {
                            'yes': {'label': 'Both Score', 'odds': 1.60},
                            'no': {'label': 'No Both Score', 'odds': 2.30}
                        }
                    }
                },
                {
                    'id': 'match_5',
                    'homeTeam': 'Real Madrid',
                    'awayTeam': 'Barcelona',
                    'league': 'La Liga',
                    'date': '2024-08-12',
                    'time': '21:00',
                    'status': 'upcoming',
                    'markets': {
                        '1x2': {
                            '1': {'label': 'Real Win', 'odds': 2.20},
                            'X': {'label': 'Draw', 'odds': 3.60},
                            '2': {'label': 'Barca Win', 'odds': 3.00}
                        },
                        'over_under': {
                            'over': {'label': 'Over 2.5', 'odds': 1.80},
                            'under': {'label': 'Under 2.5', 'odds': 2.00}
                        },
                        'both_teams': {
                            'yes': {'label': 'Both Score', 'odds': 1.65},
                            'no': {'label': 'No Both Score', 'odds': 2.20}
                        }
                    }
                }
            ]
            self.save_data()
            print('🏈 Initialized demo matches')

# Global game server instance
game_server = MultiUserGameServer()

# --- Helpers for settlement parity with Node backend ---
def normalize_market(market: str) -> str:
    m = str(market or '').lower()
    if m in ('match_result', '1x2', 'match-winner', 'matchwinner'):
        return 'match_result'
    if m in ('double_chance', 'doublechance', 'dc'):
        return 'double_chance'
    if m in ('total_goals', 'over_under', 'overunder', 'over_under_2_5', 'over2_5', 'under2_5', 'ou', 'ou2_5'):
        return 'total_goals'
    if m in ('btts', 'both_teams', 'both_teams_to_score', 'bothteamstoscore', 'bothteams'):
        return 'btts'
    return m


def normalize_selection(selection: str, market: str) -> str:
    sel = str(selection or '').lower()
    m = normalize_market(market)
    if m == 'match_result':
        if sel in ('1', 'home', 'home_win'):
            return 'home'
        if sel in ('x', 'draw'):
            return 'draw'
        if sel in ('2', 'away', 'away_win'):
            return 'away'
    if m == 'double_chance':
        if sel in ('1x', '1-x', '1orx'):
            return '1x'
        if sel in ('12', '1-2', '1or2'):
            return '12'
        if sel in ('x2', 'x-2', 'xor2'):
            return 'x2'
    if m == 'total_goals':
        if sel.startswith('over'):
            return 'over'
        if sel.startswith('under'):
            return 'under'
    if m == 'btts':
        if sel in ('yes', 'y'):
            return 'yes'
        if sel in ('no', 'n'):
            return 'no'
    return sel


def compute_market_results(home_goals: int, away_goals: int):
    h = int(home_goals or 0)
    a = int(away_goals or 0)
    total = h + a
    results = {
        'match_result': 'home' if h > a else ('away' if h < a else 'draw'),
        'double_chance': set(),
        'total_goals': 'over' if total >= 3 else 'under',  # threshold 2.5
        'btts': 'yes' if (h > 0 and a > 0) else 'no'
    }
    if h >= a:
        results['double_chance'].add('1x')
    if h != a:
        results['double_chance'].add('12')
    if a >= h:
        results['double_chance'].add('x2')
    return results

# --- Odds/demo helpers -------------------------------------------------------
def convert_local_matches_to_app_format(local_matches):
    """Convert stored demo/local matches (which may use legacy market keys)
    into the app's expected format used by the frontend odds renderer.

    Expected output per match:
      {
        'id': str,
        'homeTeam': str,
        'awayTeam': str,
        'league': str,
        'date': str,  # optional
        'time': str,  # optional
        'status': 'upcoming'|'live'|'finished',
        'markets': {
          'match_result': { 'home': float, 'draw': float, 'away': float },
          'total_goals': { 'over': float, 'under': float },
          'both_teams_score': { 'yes': float, 'no': float }
        }
      }
    """
    out = []
    try:
        for m in (local_matches or []):
            if not isinstance(m, dict):
                continue
            markets = m.get('markets') or {}
            # Normalize legacy keys -> new keys
            # 1X2 -> match_result
            match_result = None
            if isinstance(markets.get('match_result'), dict):
                mr = markets.get('match_result') or {}
                try:
                    # already in new form
                    match_result = {
                        'home': float(mr.get('home')) if mr.get('home') is not None else None,
                        'draw': float(mr.get('draw')) if mr.get('draw') is not None else None,
                        'away': float(mr.get('away')) if mr.get('away') is not None else None,
                    }
                except Exception:
                    match_result = None
            if match_result is None and isinstance(markets.get('1x2'), dict):
                try:
                    mm = markets.get('1x2')
                    h = mm.get('1', {}).get('odds')
                    d = mm.get('X', {}).get('odds')
                    a = mm.get('2', {}).get('odds')
                    match_result = {'home': float(h), 'draw': float(d), 'away': float(a)}
                except Exception:
                    match_result = None

            # over_under -> total_goals
            total_goals = None
            if isinstance(markets.get('total_goals'), dict):
                tg = markets.get('total_goals') or {}
                try:
                    total_goals = {
                        'over': float(tg.get('over')) if tg.get('over') is not None else None,
                        'under': float(tg.get('under')) if tg.get('under') is not None else None,
                    }
                except Exception:
                    total_goals = None
            if total_goals is None and isinstance(markets.get('over_under'), dict):
                try:
                    ou = markets.get('over_under')
                    over = ou.get('over', {}).get('odds')
                    under = ou.get('under', {}).get('odds')
                    total_goals = {'over': float(over), 'under': float(under)}
                except Exception:
                    total_goals = None

            # both_teams -> both_teams_score
            btts = None
            if isinstance(markets.get('both_teams_score'), dict):
                bs = markets.get('both_teams_score') or {}
                try:
                    btts = {
                        'yes': float(bs.get('yes')) if bs.get('yes') is not None else None,
                        'no': float(bs.get('no')) if bs.get('no') is not None else None,
                    }
                except Exception:
                    btts = None
            if btts is None and isinstance(markets.get('both_teams'), dict):
                try:
                    bt = markets.get('both_teams')
                    yes = bt.get('yes', {}).get('odds')
                    no = bt.get('no', {}).get('odds')
                    btts = {'yes': float(yes), 'no': float(no)}
                except Exception:
                    btts = None

            # Compose normalized markets, skipping any that failed to parse
            norm_markets = {}
            if isinstance(match_result, dict) and all(k in match_result and isinstance(match_result[k], (int, float)) for k in ('home','draw','away')):
                norm_markets['match_result'] = match_result
            if isinstance(total_goals, dict) and all(k in total_goals and isinstance(total_goals[k], (int, float)) for k in ('over','under')):
                norm_markets['total_goals'] = total_goals
            if isinstance(btts, dict) and all(k in btts and isinstance(btts[k], (int, float)) for k in ('yes','no')):
                norm_markets['both_teams_score'] = btts

            # Build normalized match object
            out.append({
                'id': m.get('id') or f"demo_{int(time.time())}",
                'homeTeam': m.get('homeTeam') or m.get('home') or 'Home',
                'awayTeam': m.get('awayTeam') or m.get('away') or 'Away',
                'league': m.get('league') or 'Football League',
                'date': m.get('date') or '',
                'time': m.get('time') or '',
                'status': m.get('status') or 'upcoming',
                'markets': norm_markets or {
                    'match_result': { 'home': 2.0, 'draw': 3.2, 'away': 2.8 },
                    'total_goals': { 'over': 1.85, 'under': 1.95 },
                    'both_teams_score': { 'yes': 1.72, 'no': 2.05 }
                }
            })
    except Exception:
        pass
    return out

def get_demo_sports_list():
    """Provide a minimal sports list so clients can operate even when upstream is unavailable.
    Includes the leagues we fetch by default on the client.
    """
    try:
        return [
            { 'key': 'soccer_germany_bundesliga2', 'group': 'Soccer', 'title': '2. Bundesliga' },
            { 'key': 'soccer_england_efl_champ',   'group': 'Soccer', 'title': 'Championship' },
            { 'key': 'soccer_germany_bundesliga',  'group': 'Soccer', 'title': 'Bundesliga' },
            { 'key': 'soccer_epl',                 'group': 'Soccer', 'title': 'Premier League' },
        ]
    except Exception:
        return []

class MultiUserRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        # API endpoints
        if parsed_path.path.startswith('/api/'):
            self.handle_api_get(parsed_path)
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/'):
            self.handle_api_post(parsed_path)
        else:
            self.send_error(404)
    
    def handle_api_get(self, parsed_path):
        """Handle API GET requests"""
        path = parsed_path.path
        query = parsed_path.query or ''
        
        # Health checks for client online/offline detection
        if path == '/health' or path == '/api/health':
            self.send_json_response({
                'ok': True,
                'uptime': time.time(),
                'timestamp': datetime.now().isoformat()
            })
            return
        
        if path == '/api/matches':
            self.send_json_response({
                'success': True,
                'matches': game_server.game_data['matches']
            })
        
        elif path.startswith('/api/matches/'):
            # Return a single match by ID
            parts = path.split('/')
            match_id_raw = parts[-1] if len(parts) >= 4 else None
            match_id = unquote(match_id_raw) if match_id_raw else None
            found = None
            if match_id:
                for m in game_server.game_data['matches']:
                    try:
                        if m and str(m.get('id')) == str(match_id):
                            found = m
                            break
                    except Exception:
                        continue
            if found:
                self.send_json_response({ 'success': True, 'match': found })
            else:
                self.send_json_response({ 'error': 'Match not found' }, 404)
        
        # --- Secure server-side proxy for The Odds API ---
        elif path == '/api/odds/sports':
            params_sp = parse_qs(query or '')
            bypass_sp = str((params_sp.get('bypass_cache') or [''])[0]).lower() in ('1','true','yes','on')
            # Serve sports from cache when fresh
            try:
                if isinstance(ODDS_SPORTS_CACHE.get('data'), list) and ODDS_SPORTS_CACHE['data'] and (time.time() - ODDS_SPORTS_CACHE.get('ts', 0) < ODDS_CACHE_TTL) and not bypass_sp:
                    proxy_log('/api/odds/sports', 'cache', f"age={int(time.time() - ODDS_SPORTS_CACHE.get('ts', 0))}s size={len(ODDS_SPORTS_CACHE['data'])}")
                    self.send_json_response(ODDS_SPORTS_CACHE['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Cache-Key': 'sports_list'})
                    return
            except Exception:
                pass
            odds_key = os.environ.get('ODDS_API_KEY')
            if not odds_key:
                # Fallback: proxy to production API to avoid 501 during local dev
                fallback_base = os.environ.get('FALLBACK_PROXY_BASE', 'https://scoreleague-api.onrender.com').rstrip('/')
                try:
                    req_host = self.headers.get('Host', '')
                    fb_host = urlparse(fallback_base).netloc
                except Exception:
                    fb_host = ''
                # Avoid recursion if running on the same host as the fallback
                if fallback_base and fb_host and req_host != fb_host:
                    try:
                        upstream_fb = f"{fallback_base}/api/odds/sports" + ("?bypass_cache=1" if bypass_sp else "")
                        req = urllib.request.Request(upstream_fb, headers={'User-Agent': 'ScoreLeague/1.0'})
                        with urllib.request.urlopen(req, timeout=12) as resp:
                            body = resp.read().decode('utf-8')
                            data = json.loads(body)
                            if isinstance(data, list) and data:
                                ODDS_SPORTS_CACHE['data'] = data
                                ODDS_SPORTS_CACHE['ts'] = time.time()
                                proxy_log('/api/odds/sports', 'fallback-proxy', f"items={len(data)} base={fallback_base}")
                                self.send_json_response(data, extra_headers={'X-Proxy-Mode': 'fallback-proxy', 'X-Cache-Key': 'sports_list'})
                                return
                            # On empty result, prefer any cached data
                            if isinstance(ODDS_SPORTS_CACHE.get('data'), list) and ODDS_SPORTS_CACHE['data'] and not bypass_sp:
                                proxy_log('/api/odds/sports', 'fallback-proxy-empty->cache', f"size={len(ODDS_SPORTS_CACHE['data'])}")
                                self.send_json_response(ODDS_SPORTS_CACHE['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Cache-Key': 'sports_list'})
                                return
                            # Provide minimal demo list so clients can still function
                            proxy_log('/api/odds/sports', 'fallback-proxy-empty->demo')
                            self.send_json_response(get_demo_sports_list(), extra_headers={'X-Proxy-Mode': 'demo', 'X-Cache-Key': 'sports_list'})
                            return
                    except Exception as ex:
                        proxy_log('/api/odds/sports', 'fallback-proxy-error', f"{type(ex).__name__}")
                        pass
                # Graceful degrade if fallback fails
                proxy_log('/api/odds/sports', 'demo')
                self.send_json_response(get_demo_sports_list(), extra_headers={'X-Proxy-Mode': 'demo', 'X-Cache-Key': 'sports_list'})
                return
            upstream = f"https://api.the-odds-api.com/v4/sports/?apiKey={odds_key}"
            try:
                req = urllib.request.Request(upstream, headers={'User-Agent': 'ScoreLeague/1.0'})
                with urllib.request.urlopen(req, timeout=12) as resp:
                    body = resp.read().decode('utf-8')
                    data = json.loads(body)
                    if isinstance(data, list) and data:
                        ODDS_SPORTS_CACHE['data'] = data
                        ODDS_SPORTS_CACHE['ts'] = time.time()
                        proxy_log('/api/odds/sports', 'upstream', f"items={len(data)}")
                        self.send_json_response(data, extra_headers={'X-Proxy-Mode': 'upstream', 'X-Cache-Key': 'sports_list'})
                    else:
                        # Prefer cached data on empty
                        if isinstance(ODDS_SPORTS_CACHE.get('data'), list) and ODDS_SPORTS_CACHE['data'] and not bypass_sp:
                            proxy_log('/api/odds/sports', 'upstream-empty->cache', f"size={len(ODDS_SPORTS_CACHE['data'])}")
                            self.send_json_response(ODDS_SPORTS_CACHE['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Cache-Key': 'sports_list'})
                        else:
                            proxy_log('/api/odds/sports', 'upstream-empty')
                            self.send_json_response(data, extra_headers={'X-Proxy-Mode': 'upstream-empty', 'X-Cache-Key': 'sports_list'})
            except urllib.error.HTTPError as e:
                # Avoid 5xx to keep CORS friendly; prefer cache, else demo list
                try:
                    if isinstance(ODDS_SPORTS_CACHE.get('data'), list) and ODDS_SPORTS_CACHE['data'] and not bypass_sp:
                        proxy_log('/api/odds/sports', 'upstream-error->cache', f"status={e.code}")
                        self.send_json_response(ODDS_SPORTS_CACHE['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Upstream-Status': str(e.code), 'X-Cache-Key': 'sports_list'})
                    else:
                        proxy_log('/api/odds/sports', 'upstream-error->demo', f"status={e.code}")
                        self.send_json_response(get_demo_sports_list(), extra_headers={'X-Proxy-Mode': 'upstream-error', 'X-Upstream-Status': str(e.code), 'X-Cache-Key': 'sports_list'})
                except Exception:
                    proxy_log('/api/odds/sports', 'upstream-error->demo')
                    self.send_json_response(get_demo_sports_list(), extra_headers={'X-Proxy-Mode': 'upstream-error', 'X-Cache-Key': 'sports_list'})
            except Exception as e:
                # Avoid 5xx to keep CORS friendly; prefer cache, else demo list
                try:
                    if isinstance(ODDS_SPORTS_CACHE.get('data'), list) and ODDS_SPORTS_CACHE['data'] and not bypass_sp:
                        proxy_log('/api/odds/sports', 'error->cache', f"{type(e).__name__}")
                        self.send_json_response(ODDS_SPORTS_CACHE['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Cache-Key': 'sports_list'})
                    else:
                        proxy_log('/api/odds/sports', 'error->demo', f"{type(e).__name__}")
                        self.send_json_response(get_demo_sports_list(), extra_headers={'X-Proxy-Mode': 'error', 'X-Cache-Key': 'sports_list'})
                except Exception:
                    proxy_log('/api/odds/sports', 'error->demo')
                    self.send_json_response(get_demo_sports_list(), extra_headers={'X-Proxy-Mode': 'error', 'X-Cache-Key': 'sports_list'})
        
        elif path == '/api/odds':
            odds_key = os.environ.get('ODDS_API_KEY')
            if not odds_key:
                # Fallback: proxy to production API to avoid 501 during local dev
                fallback_base = os.environ.get('FALLBACK_PROXY_BASE', 'https://scoreleague-api.onrender.com').rstrip('/')
                try:
                    req_host = self.headers.get('Host', '')
                    fb_host = urlparse(fallback_base).netloc
                except Exception:
                    fb_host = ''
                # Avoid recursion if running on the same host as the fallback
                if fallback_base and fb_host and req_host != fb_host:
                    try:
                        # Build cache key from query
                        try:
                            params_fb = parse_qs(query or '')
                            bypass_fb = str((params_fb.get('bypass_cache') or [''])[0]).lower() in ('1','true','yes','on')
                            sport_fb = (params_fb.get('sport') or params_fb.get('sportKey') or [''])[0].strip()
                            regions_fb = (params_fb.get('regions') or ['uk'])[0]
                            markets_fb = (params_fb.get('markets') or ['h2h,totals'])[0]
                            odds_format_fb = (params_fb.get('oddsFormat') or ['decimal'])[0]
                            cache_key_fb = f"{sport_fb}|{regions_fb}|{markets_fb}|{odds_format_fb}"
                            c = ODDS_CACHE.get(cache_key_fb)
                            if c and isinstance(c.get('data'), list) and c['data'] and (time.time() - c.get('ts', 0) < ODDS_CACHE_TTL) and not bypass_fb:
                                proxy_log('/api/odds', 'cache', f"key={cache_key_fb} size={len(c['data'])}")
                                self.send_json_response(c['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Cache-Key': cache_key_fb})
                                return
                        except Exception:
                            cache_key_fb = None
                        q = query
                        # Forward bypass intent to upstream fallback to skip its cache too
                        if 'bypass_cache=1' not in (q or '') and (locals().get('bypass_fb') or False):
                            q = (q + ('&' if q else '') + 'bypass_cache=1')
                        upstream_fb = f"{fallback_base}/api/odds" + (f"?{q}" if q else "")
                        req = urllib.request.Request(upstream_fb, headers={'User-Agent': 'ScoreLeague/1.0'})
                        with urllib.request.urlopen(req, timeout=15) as resp:
                            body = resp.read().decode('utf-8')
                            data = json.loads(body)
                            if isinstance(data, list) and data:
                                if cache_key_fb:
                                    ODDS_CACHE[cache_key_fb] = {'data': data, 'ts': time.time()}
                                proxy_log('/api/odds', 'fallback-proxy', f"key={cache_key_fb or ''} items={len(data)} base={fallback_base}")
                                self.send_json_response(data, extra_headers={'X-Proxy-Mode': 'fallback-proxy', 'X-Cache-Key': (cache_key_fb or '')})
                                return
                            # Prefer cached on empty
                            if cache_key_fb and not (locals().get('bypass_fb') or False):
                                c = ODDS_CACHE.get(cache_key_fb)
                                if c and c.get('data'):
                                    proxy_log('/api/odds', 'fallback-proxy-empty->cache', f"key={cache_key_fb} size={len(c['data'])}")
                                    self.send_json_response(c['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Cache-Key': cache_key_fb})
                                    return
                            # Final fallback: serve normalized local demo matches
                            demo = convert_local_matches_to_app_format(game_server.game_data.get('matches'))
                            proxy_log('/api/odds', 'fallback-proxy-empty->demo')
                            self.send_json_response({ 'matches': demo }, extra_headers={'X-Proxy-Mode': 'demo'})
                            return
                    except Exception as ex:
                        proxy_log('/api/odds', 'fallback-proxy-error', f"{type(ex).__name__}")
                        pass
                # Graceful degrade if fallback fails
                demo = convert_local_matches_to_app_format(game_server.game_data.get('matches'))
                proxy_log('/api/odds', 'demo')
                self.send_json_response({ 'matches': demo }, extra_headers={'X-Proxy-Mode': 'demo'})
                return
            params = parse_qs(query)
            bypass = str((params.get('bypass_cache') or [''])[0]).lower() in ('1','true','yes','on')
            sport = (params.get('sport') or params.get('sportKey') or [''])[0].strip()
            if not sport:
                proxy_log('/api/odds', 'bad-request', 'missing sport')
                self.send_json_response({'error': 'Missing sport query param'}, 400)
                return
            regions = (params.get('regions') or ['uk'])[0]
            markets = (params.get('markets') or ['h2h,totals'])[0]
            odds_format = (params.get('oddsFormat') or ['decimal'])[0]
            # Serve from cache if fresh
            try:
                cache_key = f"{sport}|{regions}|{markets}|{odds_format}"
                c = ODDS_CACHE.get(cache_key)
                if c and isinstance(c.get('data'), list) and c['data'] and (time.time() - c.get('ts', 0) < ODDS_CACHE_TTL) and not bypass:
                    proxy_log('/api/odds', 'cache', f"key={cache_key} size={len(c['data'])}")
                    self.send_json_response(c['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Cache-Key': cache_key})
                    return
            except Exception:
                pass
            upstream = (
                f"https://api.the-odds-api.com/v4/sports/{quote(sport)}/odds/"
                f"?regions={regions}&markets={markets}&oddsFormat={odds_format}&apiKey={odds_key}"
            )
            try:
                req = urllib.request.Request(upstream, headers={'User-Agent': 'ScoreLeague/1.0'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    body = resp.read().decode('utf-8')
                    data = json.loads(body)
                    if isinstance(data, list) and data:
                        ODDS_CACHE[cache_key] = {'data': data, 'ts': time.time()}
                        proxy_log('/api/odds', 'upstream', f"key={cache_key} items={len(data)}")
                        self.send_json_response(data, extra_headers={'X-Proxy-Mode': 'upstream', 'X-Cache-Key': cache_key})
                    else:
                        c = ODDS_CACHE.get(cache_key)
                        if c and c.get('data') and not bypass:
                            proxy_log('/api/odds', 'upstream-empty->cache', f"key={cache_key} size={len(c['data'])}")
                            self.send_json_response(c['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Cache-Key': cache_key})
                        else:
                            proxy_log('/api/odds', 'upstream-empty', f"key={cache_key}")
                            self.send_json_response(data, extra_headers={'X-Proxy-Mode': 'upstream-empty', 'X-Cache-Key': cache_key})
            except urllib.error.HTTPError as e:
                try:
                    err_body = e.read().decode('utf-8')
                except Exception:
                    err_body = ''
                # Gracefully degrade on common rate/authorization issues
                if e.code in (400, 401, 402, 403, 404, 429, 500, 502, 503, 504):
                    # Return empty odds list so frontend can continue without errors
                    proxy_log('/api/odds', 'upstream-error', f"status={e.code}")
                    self.send_json_response([], extra_headers={'X-Proxy-Mode': 'upstream-error', 'X-Upstream-Status': str(e.code)})
                else:
                    self.send_json_response({'error': 'Upstream error', 'status': e.code, 'body': err_body[:2000]}, 502)
            except Exception as e:
                # Avoid 5xx; prefer cached, else normalized demo matches
                try:
                    cache_key_safe = f"{sport}|{regions}|{markets}|{odds_format}"
                    c = ODDS_CACHE.get(cache_key_safe)
                    if c and c.get('data') and not bypass:
                        proxy_log('/api/odds', 'error->cache', f"key={cache_key_safe} {type(e).__name__}")
                        self.send_json_response(c['data'], extra_headers={'X-Proxy-Mode': 'cache', 'X-Cache-Key': cache_key_safe})
                    else:
                        demo = convert_local_matches_to_app_format(game_server.game_data.get('matches'))
                        proxy_log('/api/odds', 'error->demo', f"{type(e).__name__}")
                        self.send_json_response({'matches': demo}, extra_headers={'X-Proxy-Mode': 'demo'})
                except Exception:
                    demo = convert_local_matches_to_app_format(game_server.game_data.get('matches'))
                    proxy_log('/api/odds', 'error->demo')
                    self.send_json_response({'matches': demo}, extra_headers={'X-Proxy-Mode': 'demo'})

        
        elif path.startswith('/api/leagues/user/'):
            user_id = path.split('/')[-1]
            user_leagues = [league for league in game_server.game_data['leagues'].values() 
                          if user_id in league['members']]
            self.send_json_response({
                'success': True,
                'leagues': user_leagues
            })
        
        elif path.startswith('/api/bets/user/'):
            user_id = path.split('/')[-1]
            user_bets = game_server.game_data['bets'].get(user_id, [])
            self.send_json_response({
                'success': True,
                'bets': user_bets
            })
        
        elif '/leaderboard' in path:
            league_id = path.split('/')[-2]
            league = game_server.game_data['leagues'].get(league_id)
            if league:
                leaderboard = []
                for user_id in league['members']:
                    user = game_server.game_data['users'].get(user_id)
                    if user:
                        user_bets = game_server.game_data['bets'].get(user_id, [])
                        league_bets = [bet for bet in user_bets 
                                     if 'leagueIds' in bet and league_id in bet['leagueIds']]
                        
                        league_winnings = sum(bet['potentialWin'] for bet in league_bets 
                                            if bet['status'] == 'won')
                        
                        leaderboard.append({
                            **user,
                            'leagueStats': {
                                'bets': len(league_bets),
                                'winnings': league_winnings,
                                'totalStaked': sum(bet['stake'] for bet in league_bets)
                            }
                        })
                
                leaderboard.sort(key=lambda x: x['coins'], reverse=True)
                self.send_json_response({
                    'success': True,
                    'leaderboard': leaderboard
                })
            else:
                self.send_json_response({'error': 'League not found'}, 404)
        
        else:
            self.send_json_response({'error': 'Endpoint not found'}, 404)
    
    def handle_api_post(self, parsed_path):
        """Handle API POST requests"""
        path = parsed_path.path
        
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except:
            self.send_json_response({'error': 'Invalid JSON'}, 400)
            return
        
        if path == '/api/auth/login':
            username = data.get('username', '').strip()
            if len(username) < 2:
                self.send_json_response({'error': 'Username must be at least 2 characters'}, 400)
                return
            
            # Check if user exists
            existing_user = None
            for user in game_server.game_data['users'].values():
                if user['username'] == username:
                    existing_user = user
                    break
            
            if existing_user:
                self.send_json_response({
                    'success': True,
                    'user': existing_user
                })
            else:
                # Create new user
                user_id = game_server.generate_id('user_')
                new_user = {
                    'id': user_id,
                    'username': username,
                    'coins': 1000,
                    'joinedAt': datetime.now().isoformat(),
                    'stats': {
                        'totalBets': 0,
                        'totalWinnings': 0,
                        'biggestWin': 0,
                        'totalCombinedOdds': 0
                    }
                }
                
                game_server.game_data['users'][user_id] = new_user
                game_server.save_data()
                
                self.send_json_response({
                    'success': True,
                    'user': new_user
                })
        
        elif path == '/api/leagues/create':
            name = data.get('name', '').strip()
            creator_id = data.get('creatorId')
            description = data.get('description', '').strip()
            
            if not name or not creator_id:
                self.send_json_response({'error': 'League name and creator required'}, 400)
                return
            
            league_id = game_server.generate_id('league_')
            invite_code = uuid.uuid4().hex[:8].upper()
            
            league = {
                'id': league_id,
                'name': name,
                'description': description,
                'creatorId': creator_id,
                'inviteCode': invite_code,
                'members': [creator_id],
                'createdAt': datetime.now().isoformat(),
                'settings': {
                    'maxMembers': 10
                }
            }
            
            game_server.game_data['leagues'][league_id] = league
            game_server.save_data()
            
            self.send_json_response({
                'success': True,
                'league': league
            })
        
        elif path == '/api/leagues/join':
            invite_code = data.get('inviteCode', '').upper()
            user_id = data.get('userId')
            
            if not invite_code or not user_id:
                self.send_json_response({'error': 'Invite code and user ID required'}, 400)
                return
            
            league = None
            for l in game_server.game_data['leagues'].values():
                if l['inviteCode'] == invite_code:
                    league = l
                    break
            
            if not league:
                self.send_json_response({'error': 'League not found'}, 404)
                return
            
            if user_id in league['members']:
                self.send_json_response({'error': 'Already a member of this league'}, 400)
                return
            
            if len(league['members']) >= league['settings']['maxMembers']:
                self.send_json_response({'error': 'League is full'}, 400)
                return
            
            league['members'].append(user_id)
            game_server.save_data()
            
            self.send_json_response({
                'success': True,
                'league': league
            })
        
        elif path == '/api/bets/place':
            user_id = data.get('userId')
            match_id = data.get('matchId')
            market = data.get('market')
            selection = data.get('selection')
            odds = data.get('odds')
            stake = data.get('stake')
            league_ids = data.get('leagueIds', [])
            
            if not all([user_id, match_id, market, selection, odds, stake]):
                self.send_json_response({'error': 'Missing required bet information'}, 400)
                return
            
            user = game_server.game_data['users'].get(user_id)
            if not user:
                self.send_json_response({'error': 'User not found'}, 404)
                return
            
            if user['coins'] < stake:
                self.send_json_response({'error': 'Insufficient coins'}, 400)
                return
            
            bet_id = game_server.generate_id('bet_')
            bet = {
                'id': bet_id,
                'userId': user_id,
                'matchId': match_id,
                'market': market,
                'selection': selection,
                'odds': odds,
                'stake': stake,
                'potentialWin': round(stake * odds),
                'placedAt': datetime.now().isoformat(),
                'status': 'pending',
                'leagueIds': league_ids
            }
            
            # Deduct coins
            user['coins'] -= stake
            user['stats']['totalBets'] += 1
            
            # Store bet
            if user_id not in game_server.game_data['bets']:
                game_server.game_data['bets'][user_id] = []
            game_server.game_data['bets'][user_id].append(bet)
            
            game_server.save_data()
            
            self.send_json_response({
                'success': True,
                'bet': bet,
                'user': user
            })
        
        elif path.startswith('/api/matches/') and path.endswith('/settle'):
            # Admin protection (enabled only if ADMIN_TOKEN is set)
            admin_token = os.environ.get('ADMIN_TOKEN')
            if admin_token:
                provided = self.headers.get('X-Admin-Token') or self.headers.get('x-admin-token') or ''
                if provided != admin_token:
                    self.send_json_response({'error': 'Forbidden: admin token required'}, 403)
                    return
            # Example: /api/matches/match_1/settle
            parts = path.split('/')
            match_id = parts[3] if len(parts) >= 5 else None
            try:
                h = max(0, int(data.get('homeGoals', 0) or 0))
                a = max(0, int(data.get('awayGoals', 0) or 0))
            except Exception:
                self.send_json_response({'error': 'Invalid score values'}, 400)
                return

            # Find match
            match_idx = -1
            for i, m in enumerate(game_server.game_data['matches']):
                try:
                    if m and str(m.get('id')) == str(match_id):
                        match_idx = i
                        break
                except Exception:
                    continue
            if match_idx == -1:
                self.send_json_response({'error': 'Match not found'}, 404)
                return

            match = game_server.game_data['matches'][match_idx]
            # Update match state
            match['status'] = 'finished'
            match['score'] = { 'home': h, 'away': a }

            # Compute winners for markets
            results = compute_market_results(h, a)

            # Iterate all user bets and settle those for this match
            settled = 0
            won = 0
            for uid, bets in game_server.game_data['bets'].items():
                if not isinstance(bets, list):
                    continue
                for bet in bets:
                    try:
                        if not bet or str(bet.get('status', 'pending')).lower() != 'pending':
                            continue
                        if str(bet.get('matchId')) != str(match_id):
                            continue

                        market = normalize_market(bet.get('market'))
                        sel = normalize_selection(bet.get('selection'), market)

                        is_winner = False
                        if market == 'match_result':
                            is_winner = (sel == results['match_result'])
                        elif market == 'double_chance':
                            is_winner = sel in results['double_chance']
                        elif market == 'total_goals':
                            is_winner = (sel == results['total_goals'])
                        elif market == 'btts':
                            is_winner = (sel == results['btts'])
                        else:
                            # Unknown market - leave as pending
                            continue

                        bet['status'] = 'won' if is_winner else 'lost'
                        settled += 1

                        # On win, credit payout
                        if is_winner:
                            won += 1
                            user = game_server.game_data['users'].get(uid)
                            if user:
                                try:
                                    stake = float(bet.get('stake', 0) or 0)
                                    odds = float(bet.get('odds', 1) or 1)
                                    potential = bet.get('potentialWin')
                                    payout = int(round(potential if isinstance(potential, (int, float)) else stake * (odds if odds and odds > 0 else 1)))
                                except Exception:
                                    payout = int(round(float(bet.get('potentialWin') or 0)))
                                user['coins'] = max(0, int(round(float(user.get('coins', 0)) + payout)))
                                stats = user.setdefault('stats', {})
                                stats['totalWinnings'] = max(0, int(round(float(stats.get('totalWinnings', 0)) + payout)))
                                stats['biggestWin'] = max(int(round(float(stats.get('biggestWin', 0)))), int(payout))
                    except Exception:
                        # Skip on any data issue with this bet
                        continue

            game_server.save_data()

            self.send_json_response({
                'success': True,
                'match': match,
                'settled': settled,
                'won': won,
                'results': {
                    'match_result': results['match_result'],
                    'double_chance': sorted(list(results['double_chance'])),
                    'total_goals': results['total_goals'],
                    'btts': results['btts']
                }
            })

        elif path == '/api/bets/settle':
            # Admin protection (enabled only if ADMIN_TOKEN is set)
            admin_token = os.environ.get('ADMIN_TOKEN')
            if admin_token:
                provided = self.headers.get('X-Admin-Token') or self.headers.get('x-admin-token') or ''
                if provided != admin_token:
                    self.send_json_response({'error': 'Forbidden: admin token required'}, 403)
                    return
            bet_id = data.get('betId')
            result = str(data.get('result', '')).lower()
            if not bet_id or result not in ('won', 'lost'):
                self.send_json_response({'error': 'Invalid parameters'}, 400)
                return
            
            # Locate bet across all users
            found_user_id = None
            bet_ref = None
            for uid, bets in game_server.game_data['bets'].items():
                if not isinstance(bets, list):
                    continue
                for b in bets:
                    if b and b.get('id') == bet_id:
                        bet_ref = b
                        found_user_id = uid
                        break
                if bet_ref:
                    break
            
            if not bet_ref:
                self.send_json_response({'error': 'Bet not found'}, 404)
                return
            
            prev_status = str(bet_ref.get('status', 'pending')).lower()
            if prev_status != 'pending':
                self.send_json_response({'error': 'Bet already settled'}, 400)
                return
            
            user = game_server.game_data['users'].get(found_user_id)
            if not user:
                self.send_json_response({'error': 'User not found'}, 404)
                return
            
            # Settle
            bet_ref['status'] = result
            if result == 'won':
                try:
                    stake = float(bet_ref.get('stake', 0) or 0)
                    odds = float(bet_ref.get('odds', 1) or 1)
                    payout = int(round(bet_ref.get('potentialWin') or (stake * (odds if (odds and odds > 0) else 1))))
                except Exception:
                    payout = int(round(float(bet_ref.get('potentialWin') or 0)))
                user['coins'] = max(0, int(round(float(user.get('coins', 0)) + payout)))
                stats = user.setdefault('stats', {})
                stats['totalWinnings'] = max(0, int(round(float(stats.get('totalWinnings', 0)) + payout)))
                stats['biggestWin'] = max(int(round(float(stats.get('biggestWin', 0)))), int(payout))
            
            game_server.save_data()
            self.send_json_response({'success': True, 'bet': bet_ref, 'user': user})
        
        else:
            self.send_json_response({'error': 'Endpoint not found'}, 404)
    
    def _get_cors_origin(self):
        """Determine allowed CORS origin based on request Origin and env."""
        origin = self.headers.get('Origin', '')
        allowed = os.environ.get('ALLOWED_ORIGINS', 'https://scoreleague.netlify.app,https://scoreleague.onrender.com,http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000,http://localhost:8080,http://127.0.0.1:8080').split(',')
        allowed = [o.strip() for o in allowed if o.strip()]
        if origin and origin in allowed:
            return origin
        # Allow same-host origins (ignoring port) for LAN/mobile testing
        try:
            if origin:
                o = urlparse(origin)
                origin_host = (o.hostname or '').strip().lower()
                req_host_header = (self.headers.get('Host', '') or '').strip().lower()
                req_hostname = req_host_header
                # Extract hostname from Host header (handle IPv6 [::1]:3001 and IPv4 host:port)
                if req_hostname.startswith('['):
                    end = req_hostname.find(']')
                    if end != -1:
                        req_hostname = req_hostname[1:end]
                if ':' in req_hostname:
                    req_hostname = req_hostname.split(':', 1)[0]
                loopbacks = {'localhost', '127.0.0.1', '::1'}
                if origin_host == req_hostname or (origin_host in loopbacks and req_hostname in loopbacks):
                    return origin
        except Exception:
            pass
        return allowed[0] if allowed else '*'

    def send_json_response(self, data, status_code=200, extra_headers=None):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        cors_origin = self._get_cors_origin()
        self.send_header('Access-Control-Allow-Origin', cors_origin)
        self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token')
        # Expose debug headers to the browser for diagnostics (diag.html)
        self.send_header('Access-Control-Expose-Headers', 'X-Proxy-Mode, X-Cache-Key, X-Upstream-Status')
        if isinstance(extra_headers, dict):
            for hk, hv in extra_headers.items():
                try:
                    self.send_header(str(hk), str(hv))
                except Exception:
                    pass
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        cors_origin = self._get_cors_origin()
        self.send_header('Access-Control-Allow-Origin', cors_origin)
        self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token')
        self.end_headers()

if __name__ == '__main__':
    # Use PORT from environment when deployed (e.g., Render/Railway), default to 3001 locally
    try:
        PORT = int(os.environ.get('PORT', '3001'))
    except Exception:
        PORT = 3001

    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), MultiUserRequestHandler) as httpd:
        print('🚀 ScoreLeague Multi-User Server running on:')
        print(f'   Local:  http://localhost:{PORT}')
        print(f'   Public: Bind 0.0.0.0:{PORT} (your host/platform will provide the external URL)')
        print('')
        print('📱 Share the public URL from your hosting dashboard')
        print('🏆 Ready for private league competition!')
        print('')
        print('Press Ctrl+C to stop the server')

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n💾 Saving data before shutdown...')
            game_server.save_data()
            print('👋 Server stopped')
