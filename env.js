(function(){
  // Build-time replaced on Netlify using env.template.js; this file is a safe local default
  try {
    if (typeof window !== 'undefined') {
      const current = (typeof window.API_BASE === 'string') ? window.API_BASE.trim() : '';
      // 1) URL param override (?api_base=... or ?api=...)
      try {
        const usp = new URLSearchParams(window.location.search);
        const paramBase = (usp.get('api_base') || usp.get('api') || '').trim();
        if (paramBase) {
          window.API_BASE = paramBase;
          try { localStorage.setItem('api_base', paramBase); } catch (_) {}
        }

        // Optional: allow setting a client Odds API key via URL param for quick local testing
        // Usage: ?odds_key=YOUR_KEY (stored to localStorage as 'odds_api_key')
        const oddsKey = (usp.get('odds_key') || '').trim();
        if (oddsKey) {
          try { localStorage.setItem('odds_api_key', oddsKey); } catch (_) {}
        }
      } catch (_) {}

      // 2) localStorage override (if not already set)
      if (!window.API_BASE || !String(window.API_BASE).trim()) {
        try {
          const saved = localStorage.getItem('api_base');
          if (saved && saved.trim()) {
            window.API_BASE = saved.trim();
          }
        } catch (_) {}
      }

      // 3) Default based on host if still unset
      if (!window.API_BASE || !String(window.API_BASE).trim()) {
        const hn = String(window.location.hostname || '').trim();
        const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(hn);
        // RFC1918 private ranges + common mDNS/LAN hostnames
        const isPrivateIP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hn);
        const isMdnsLan = /\.(local|lan)$/i.test(hn);
        const isLocalNetwork = isPrivateIP || isMdnsLan;
        window.API_BASE = isLocalHost
          ? 'http://localhost:3001'
          : (isLocalNetwork ? `http://${hn}:3001` : 'https://scoreleague-api.onrender.com');
      }
      try { console.log('env.js: API_BASE =', window.API_BASE); } catch(_) {}
    }
  } catch(e) {}
})();
