# Diagnostics and Proxy Debug Headers

This guide explains how to troubleshoot the odds data pipeline using the diagnostics page and the proxy debug headers exposed by the backend.

## What are Proxy Debug Headers?

The backend adds these headers to responses from odds endpoints:

- X-Proxy-Mode: cache | fallback-proxy | upstream | demo | upstream-empty | upstream-error | error
- X-Cache-Key: cache key used (when applicable)
- X-Upstream-Status: upstream HTTP status code or error (when applicable)

These are exposed to browsers via `Access-Control-Expose-Headers: X-Proxy-Mode, X-Cache-Key, X-Upstream-Status` inside `send_json_response()` in `server_multiuser.py`.

## Quick checks in the browser

1. Open the diagnostics page:
   - Local: http://localhost:8000/diag.html
   - Prod: https://scoreleague.netlify.app/diag.html
2. Set API Base in the "API Base Override" section:
   - Local API: http://localhost:3001
   - Prod API: e.g. https://scoreleague-api.onrender.com
3. Click "Fetch Headers" under "Proxy Debug Headers".
   - You should see headers for `/api/odds/sports` and `/api/odds?sport=soccer_epl`.

## Verify via curl

Replace `$API_BASE` as needed.

```bash
# Sports list
curl -s -D - -o /dev/null "$API_BASE/api/odds/sports"

# Sample odds request (EPL)
curl -s -D - -o /dev/null "$API_BASE/api/odds?sport=soccer_epl"
```

Confirm the response includes:
- `Access-Control-Expose-Headers: X-Proxy-Mode, X-Cache-Key, X-Upstream-Status`
- `X-Proxy-Mode: <mode>` (+ `X-Cache-Key`/`X-Upstream-Status` where applicable)

## Enable backend logging of proxy decisions

You can enable lightweight structured logs to quickly see proxy decisions.

- Local:
```bash
LOG_PROXY_DEBUG=1 python3 server_multiuser.py
```

- Render (production):
  - `render.yaml` sets `LOG_PROXY_DEBUG=1` in the blueprint.
  - If your service already exists, set `LOG_PROXY_DEBUG=1` in the Render dashboard under Environment for `scoreleague-api`.

## Common scenarios and what they mean

- X-Proxy-Mode: cache
  - A cached response was returned. If stale or incorrect, clear cache in your diagnostics UI.

- X-Proxy-Mode: upstream
  - The backend called the real upstream (The Odds API) directly using `ODDS_API_KEY`.

- X-Proxy-Mode: fallback-proxy
  - The backend proxied to the configured `FALLBACK_PROXY_BASE` (default `https://scoreleague-api.onrender.com`). Useful when no `ODDS_API_KEY` is configured locally.

- X-Proxy-Mode: demo
  - No data available from upstream/fallback; demo data provided. Check upstream availability and API key configuration.

- X-Proxy-Mode: upstream-empty
  - Upstream returned an empty payload; check that the sport key is valid and the upstream API is returning data.

- X-Proxy-Mode: upstream-error (with X-Upstream-Status)
  - Upstream returned a non-2xx status. Use `X-Upstream-Status` to see the HTTP code. Check API key, rate limits, or upstream status.

## API Base overrides (client)

`env.js` determines `window.API_BASE` using:
- Query params: `?api_base=` or `?api=`
- localStorage key: `api_base`
- Smart defaults:
  - localhost/127.0.0.1 -> http://localhost:3001
  - otherwise -> https://scoreleague-api.onrender.com

This lets testers point the frontend at a local or remote API instance.

## Where in code

- Backend header exposure: `server_multiuser.py` -> `send_json_response()`
- Odds endpoints: `/api/odds` and `/api/odds/sports` within `MultiUserRequestHandler`
- Diagnostics UI: `diag.html` (Proxy Debug Headers section)
- Client odds service: `odds-api-service.js`

## Troubleshooting tips

- If headers are missing in JS, ensure CORS expose headers are present:
  - `Access-Control-Expose-Headers` includes `X-Proxy-Mode, X-Cache-Key, X-Upstream-Status`.
- If browser shows stale data, use `cache: 'no-store'` on fetch or clear caches via the diagnostics UI (and unregister SW if needed).
- If you cannot start the local API because the port is in use, another instance is already running on 3001.
- If Render logs do not show proxy debug lines, verify `LOG_PROXY_DEBUG=1` in the service environment and redeploy.
