# ScoreLeague

A multi-user sports betting game with local dev server, Render API, and Netlify frontend.

## Diagnostics Quick Start

Use the diagnostics page and proxy debug headers to troubleshoot the odds data pipeline.

### 1) Open the diagnostics page
- Local frontend: http://localhost:8000/diag.html
- Production frontend: https://scoreleague.netlify.app/diag.html

### 2) Set API base
- In the "API Base Override" section of `diag.html`, set your API base.
  - Local API: `http://localhost:3001`
  - Production API: your Render URL (e.g., `https://scoreleague-api.onrender.com`)

### 3) Inspect Proxy Debug Headers
- In `diag.html`, click "Fetch Headers" under "Proxy Debug Headers".
- You will see for `/api/odds/sports` and `/api/odds?sport=soccer_epl`:
  - `X-Proxy-Mode`: cache | fallback-proxy | upstream | demo | upstream-empty | upstream-error | error
  - `X-Cache-Key`: present when a cache key is used
  - `X-Upstream-Status`: present when upstream responded with an HTTP error

### 4) Verify via curl
```bash
# Replace API_BASE accordingly
curl -s -D - -o /dev/null "$API_BASE/api/odds/sports"
curl -s -D - -o /dev/null "$API_BASE/api/odds?sport=soccer_epl"
```
Expect these headers in the response:
- `Access-Control-Expose-Headers: X-Proxy-Mode, X-Cache-Key, X-Upstream-Status`
- `X-Proxy-Mode: <mode>` (+ `X-Cache-Key`/`X-Upstream-Status` depending on mode)

## Backend proxy logging

Enable lightweight proxy debug logging to get breadcrumbs of proxy decisions (cache, fallback, upstream, demo) in server logs.

- Local run:
```bash
LOG_PROXY_DEBUG=1 python3 server_multiuser.py
```
- Render (production):
  - The blueprint `render.yaml` sets `LOG_PROXY_DEBUG=1` by default.
  - Alternatively, set it in the Render dashboard under Environment for `scoreleague-api`.

## More details

- See `TESTING_SETUP_GUIDE.md` > "Proxy Debug Headers & Diagnostics" for step-by-step instructions.
- `server_multiuser.py` exposes debug headers via `send_json_response()` for CORS-safe access.
- `diag.html` fetches and displays the headers in the UI.
