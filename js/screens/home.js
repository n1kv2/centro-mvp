/* 1b · Home + segnaposto delle schermate delle prossime tappe */
(function () {
  const S = () => Store.s;
  const greet = () => { const h = new Date().getHours(); return h < 13 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'; };
  const actCard = (go, grad, icn, t, s) => `<div class="card tap" data-go="${go}" style="padding:20px 18px;flex-direction:row;align-items:center;gap:14px">
    <div style="width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,${grad});display:flex;align-items:center;justify-content:center;flex:none">${ic(icn, { size: 28, color: '#fff' })}</div>
    <div class="tx"><div class="h2">${t}</div><div class="b15">${s}</div></div>${ic('chev', { size: 16, color: '#CCD2D9', sw: 2 })}</div>`;

  App.screen('home', {
    top: 'main', nav: true, tab: 'home',
    mount() { if (window.Daily) App.later(() => Daily.prompt(), 500); },
    render() {
      return `<div class="h1">${greet()}, ${App.esc(S().user.nome || 'ospite')}.</div>
        <div class="b17" style="padding:0 4px;margin-top:-6px">Cosa vuoi fare oggi?</div>
        <div style="height:12px;flex:none"></div>
        ${window.Daily ? Daily.card() : ''}
        ${actCard('create', '#F06139,#D43998', 'plus', 'Crea', 'Un\'attività community reale')}
        ${actCard('match', '#BB2DCE,#471EBA', 'house', 'Match', 'La mia casa e i coinquilini')}
        ${actCard('explore', '#489DFE,#1E42BA', 'search', 'Esplora', 'Community, eventi, attività, bacheca')}`;
    }
  });

  /* ---------- segnaposto: schermate in arrivo nelle prossime tappe ---------- */
  const soon = (name, title, tab, what) => App.screen(name, {
    top: 'main', nav: true, tab,
    render() {
      return `<div class="h1">${title}</div>
        <div class="card soon"><div class="rw"><div class="ico b">${ic('sliders', { color: '#489DFE' })}</div><div class="tx"><div class="h3">In costruzione</div><div class="b15">Arriva nella prossima tappa del prototipo.</div></div></div>
        <div class="b15">${what}</div></div>`;
    }
  });
})();
