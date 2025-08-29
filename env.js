(function(){
  // Build-time replaced on Netlify using env.template.js; this file is a safe local default
  try {
    if (typeof window !== 'undefined') {
      const current = (typeof window.API_BASE === 'string') ? window.API_BASE.trim() : '';
      if (!current) {
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        window.API_BASE = isLocal ? 'http://localhost:3002' : 'https://scoreleague-api.onrender.com';
      }
      try { console.log('env.js: API_BASE =', window.API_BASE); } catch(_) {}
    }
  } catch(e) {}
})();
