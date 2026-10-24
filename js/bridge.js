/* Ponte con il portale admin (/admin): stesso sito → stesso localStorage.
   Legge parametri del test, contenuti creati dal team e messaggi dello staff (che diventano notifiche). */
(function () {
  const KEY = 'centro_admin_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const A = read(), st = A.settings || {};
  if (st.threshold) DATA.threshold = st.threshold;
  DATA.daily = { perDay: st.dailyPerDay || 3, days: st.dailyDays || 10 };
  if (st.ratingPts != null) DATA.ratingPts = st.ratingPts;
  if (st.deepPts != null) DATA.deepRatingPts = st.deepPts;
  (A.content || []).filter(c => c.active !== false).forEach(c => {
    const x = Object.assign({ desc: c.desc || 'Proposta del team CEnTRO.', city: 'Milano', who: 'Team CEnTRO', price: 'Gratis', cat: 'Demo', open: c.when || '' }, c);
    if (!x.desc) x.desc = 'Proposta del team CEnTRO.';
    if (c.type === 'bacheca') { if (!DATA.board.some(b => b.id === c.id)) DATA.board.push({ id: c.id, title: c.title, kind: 'Annuncio', text: x.desc, v: c.v }); }
    else if (!DATA.content.some(y => y.id === c.id)) DATA.content.push(x);
  });

  /* messaggi dello staff → notifiche (una volta sola ciascuno) */
  function sync() {
    const s = Store.s, M = (read().messages || []).filter(m => m.to === 'all'); s.staffSeen = s.staffSeen || [];
    let n = 0;
    M.slice().reverse().forEach(m => { if (s.staffSeen.includes(m.id)) return; s.staffSeen.push(m.id); Store.notify({ kind: 'staff', t: m.title, s: m.body, ts: m.at }); n++; });
    if (n) Store.save();
    return n;
  }
  sync();
  addEventListener('storage', e => { if (e.key === KEY && sync() && window.App && App.refresh) { App.refresh(); if (App.updateTop) App.updateTop(); } });
  window.Bridge = { sync };
})();
