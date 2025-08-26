(function(){
  const MANUAL_KEY = 'manual_final_scores';

  function getManualMap(){
    try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || '{}'); } catch(_) { return {}; }
  }
  function setManual(matchId, home, away){
    try {
      const m = getManualMap();
      m[String(matchId)] = { home: Number(home), away: Number(away) };
      localStorage.setItem(MANUAL_KEY, JSON.stringify(m));
      return true;
    } catch(_) { return false; }
  }

  async function getFinalScore(matchId, homeTeam, awayTeam){
    // 1) Manual override for testing
    try {
      const m = getManualMap();
      const r = m[String(matchId)];
      if (r && Number.isFinite(Number(r.home)) && Number.isFinite(Number(r.away))) {
        return { home: Number(r.home), away: Number(r.away) };
      }
    } catch(_) {}

    // 2) Optional app hook (user can define window.getFinalScoreHook)
    try {
      if (typeof window.getFinalScoreHook === 'function') {
        const r = await window.getFinalScoreHook({ matchId, homeTeam, awayTeam });
        if (r && Number.isFinite(Number(r.home)) && Number.isFinite(Number(r.away))) {
          return { home: Number(r.home), away: Number(r.away) };
        }
      }
    } catch(_) {}

    // 3) No provider configured
    return null;
  }

  window.scoreService = {
    getFinalScore,
    setManualFinalScore: setManual
  };
})();
