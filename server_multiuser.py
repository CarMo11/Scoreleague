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
            odds_key = os.environ.get('ODDS_API_KEY')
            if not odds_key:
                self.send_json_response({'error': 'Odds API key not configured (set ODDS_API_KEY env var)'}, 501)
                return
            upstream = f"https://api.the-odds-api.com/v4/sports/?apiKey={odds_key}"
            try:
                req = urllib.request.Request(upstream, headers={'User-Agent': 'ScoreLeague/1.0'})
                with urllib.request.urlopen(req, timeout=12) as resp:
                    body = resp.read().decode('utf-8')
                    data = json.loads(body)
                    self.send_json_response(data)
            except urllib.error.HTTPError as e:
                self.send_json_response({'error': 'Upstream error', 'status': e.code}, 502)
            except Exception as e:
                self.send_json_response({'error': f'Proxy error: {type(e).__name__}'}, 502)
        
        elif path == '/api/odds':
            odds_key = os.environ.get('ODDS_API_KEY')
            if not odds_key:
                self.send_json_response({'error': 'Odds API key not configured (set ODDS_API_KEY env var)'}, 501)
                return
            params = parse_qs(query)
            sport = (params.get('sport') or params.get('sportKey') or [''])[0].strip()
            if not sport:
                self.send_json_response({'error': 'Missing sport query param'}, 400)
                return
            regions = (params.get('regions') or ['uk'])[0]
            markets = (params.get('markets') or ['h2h,totals'])[0]
            odds_format = (params.get('oddsFormat') or ['decimal'])[0]
            upstream = (
                f"https://api.the-odds-api.com/v4/sports/{quote(sport)}/odds/"
                f"?regions={regions}&markets={markets}&oddsFormat={odds_format}&apiKey={odds_key}"
            )
            try:
                req = urllib.request.Request(upstream, headers={'User-Agent': 'ScoreLeague/1.0'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    body = resp.read().decode('utf-8')
                    data = json.loads(body)
                    self.send_json_response(data)
            except urllib.error.HTTPError as e:
                try:
                    err_body = e.read().decode('utf-8')
                except Exception:
                    err_body = ''
                # Gracefully degrade on common rate/authorization issues
                if e.code in (401, 402, 429):
                    # Return empty odds list so frontend can continue without errors
                    self.send_json_response([])
                else:
                    self.send_json_response({'error': 'Upstream error', 'status': e.code, 'body': err_body[:2000]}, 502)
            except Exception as e:
                self.send_json_response({'error': f'Proxy error: {type(e).__name__}'}, 502)

        
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
        allowed = os.environ.get('ALLOWED_ORIGINS', 'https://scoreleague.netlify.app,https://scoreleague.onrender.com,http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000').split(',')
        allowed = [o.strip() for o in allowed if o.strip()]
        if origin and origin in allowed:
            return origin
        return allowed[0] if allowed else '*'

    def send_json_response(self, data, status_code=200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        cors_origin = self._get_cors_origin()
        self.send_header('Access-Control-Allow-Origin', cors_origin)
        self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token')
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
