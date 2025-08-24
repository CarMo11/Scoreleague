#!/usr/bin/env python3
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# Simple in-memory balances keyed by userId
BALANCES = {}
DEFAULT_BALANCE = 1000


def get_balance(user_id):
    if user_id not in BALANCES:
        BALANCES[user_id] = DEFAULT_BALANCE
    return BALANCES[user_id]


def set_balance(user_id, value):
    BALANCES[user_id] = max(0, int(value))


class Handler(BaseHTTPRequestHandler):
    server_version = "MockBetAPI/1.0"

    def log_message(self, format, *args):
        # Minimal console logging
        print("[mock-api]", format % args)

    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def _send_json(self, code=200, data=None):
        payload = json.dumps(data if data is not None else {}).encode('utf-8')
        self.send_response(code)
        self._send_cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_text(self, code=200, text="OK"):
        body = text.encode('utf-8')
        self.send_response(code)
        self._send_cors()
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        # CORS preflight support
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ('/health', '/api/health'):
            return self._send_json(200, {"ok": True, "service": "mock-api"})
        return self._send_text(404, 'Not Found')

    def do_POST(self):
        path = urlparse(self.path).path
        if path == '/api/bets/place':
            try:
                length = int(self.headers.get('Content-Length', '0') or 0)
                raw = self.rfile.read(length) if length > 0 else b''
                data = json.loads(raw.decode('utf-8') or '{}') if raw else {}
            except Exception as e:
                return self._send_json(400, {"error": f"Invalid JSON: {e}"})

            user_id = data.get('userId') or 'anon'
            total_stake = data.get('totalStake') or 0
            try:
                total_stake = int(round(float(total_stake)))
            except Exception:
                total_stake = 0

            old_balance = get_balance(user_id)
            new_balance = max(0, old_balance - total_stake)
            set_balance(user_id, new_balance)

            print(f"[mock-api] user={user_id} stake={total_stake} old={old_balance} new={new_balance}")
            return self._send_json(200, {"newBalance": new_balance})

        return self._send_text(404, 'Not Found')


def run(host='0.0.0.0', port=3000):
    httpd = HTTPServer((host, port), Handler)
    print(f"[mock-api] Listening on http://{host}:{port}")
    print("[mock-api] Endpoints:\n  GET  /health\n  POST /api/bets/place")
    httpd.serve_forever()


if __name__ == '__main__':
    run()
