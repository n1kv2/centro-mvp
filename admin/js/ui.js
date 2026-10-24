/* Guscio del portale: router a hash, barra laterale, eventi delegati, pannelli, utilità di formato. */
(function () {
  const P = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 19v-1a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    flask: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10',
    plus: 'M12 5v14M5 12h14',
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    flag: 'M4 22V4M4 4h13l-2 4 2 4H4',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    x: 'M18 6 6 18M6 6l12 12',
    down: 'M12 3v12M7 10l5 5 5-5M5 21h14',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    check: 'M20 6 9 17l-5-5',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    refresh: 'M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5',
    ext: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3',
    house: 'M3 10.5 12 3l9 7.5M5 9v11h14V9M10 20v-6h4v6',
    edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6'
  };
  const ic = (n, s = 18, w = 1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n]}"/></svg>`;
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const badge = ([cls, label]) => `<span class="badge b-${cls}"><i></i>${esc(label)}</span>`;
  const av = (u, s = 32) => `<span class="av" style="width:${s}px;height:${s}px;background:${u.color};font-size:${Math.round(s * .38)}px">${esc(u.nome[0] + u.cognome[0])}</span>`;
  const dt = (t, time) => { const d = new Date(t); return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + (time ? ' · ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : ''); };
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 60 ? Math.max(1, m) + ' min fa' : m < 1440 ? Math.round(m / 60) + ' h fa' : Math.round(m / 1440) + ' g fa'; };

  /* scheda metrica: numero grande + verdetto + spiegazione semplice + formula */
  const metric = ({ k, v, verdict, say, how, sub }) => `<div class="card kpi"><div class="row sb"><span class="k">${esc(k)}</span>${verdict ? badge(verdict) : ''}</div><div class="v">${v}</div>${sub ? `<div class="d">${sub}</div>` : ''}${say ? `<div class="ink2" style="font-size:13px">${say}</div>` : ''}${how ? `<div class="formula">${how}</div>` : ''}</div>`;

  const pages = {}, acts = {}, inputs = {};
  const A = window.A = {
    ic, esc, badge, av, dt, ago, metric, acts, inputs, D: null, S: null, route: [], q: {},
    page(name, def) { pages[name] = def; },
    reload() { A.D = Sim.generate(AStore.s.settings); A.S = St.run(A.D); },
    restat() { A.S = St.run(A.D); },
    user: id => A.D.users.find(u => u.id === id),
    go(h) { if (location.hash === '#/' + h) A.render(); else location.hash = '#/' + h; },
    render() {
      const root = document.getElementById('root'), s = AStore.s;
      if (!s.logged) { root.innerHTML = pages.login.render(); return; }
      const r = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/'); A.route = r;
      const pg = pages[r[0]] || pages.dashboard, keepY = A._same === r.join('/') ? scrollY : 0;
      const open = A.D.reports.filter(x => (s.reports[x.code] || 'aperta') !== 'chiusa').length;
      const NAV = [['dashboard', 'home', 'Dashboard'], ['people', 'users', 'Partecipanti'], ['analysis', 'flask', 'Analisi statistica'], null,
        ['content', 'plus', 'Contenuti'], ['messages', 'send', 'Messaggi'], ['reports', 'flag', 'Segnalazioni', open], null, ['settings', 'gear', 'Impostazioni']];
      root.innerHTML = `<div class="app"><aside class="side">
        <div class="brand"><img src="../assets/icon.svg?v=2" width="32" height="32" alt=""><div><b>CEnTRO</b><br><span>Portale admin · demo</span></div></div>
        ${NAV.map(n => n ? `<button class="nav-i ${r[0] === n[0] ? 'on' : ''}" data-nav="${n[0]}">${ic(n[1])}${n[2]}${n[3] ? `<span class="cnt">${n[3]}</span>` : ''}</button>` : '<div class="sep"></div>').join('')}
        <div class="foot">${A.S.nAll} tester simulati · seme ${s.settings.seed}<br>Dati generati, non reali.<br><a href="../" target="_blank" rel="noopener">Apri il prototipo ${ic('ext', 12)}</a></div>
      </aside><div class="main"><header class="top"><div><div class="crumb">${esc(pg.crumb || 'CEnTRO')}</div><h1>${esc(typeof pg.title === 'function' ? pg.title() : pg.title)}</h1></div><span class="sp"></span>
        <label class="search">${ic('search', 16)}<input data-in="search" placeholder="Cerca un tester, codice o email" value="${esc(A.q.search || '')}"></label>
        <button class="iconbtn" data-act="theme" title="Tema chiaro / scuro">${ic(document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches) ? 'sun' : 'moon')}</button>
        <button class="me" data-nav="settings"><span class="av" style="background:var(--brand)">${esc(s.admin.name.split(' ').map(x => x[0]).join('').slice(0, 2))}</span><span style="text-align:left;line-height:1.2"><b style="font-size:13px">${esc(s.admin.name)}</b><br><span class="muted" style="font-size:12px">${esc(s.admin.role)}</span></span></button>
      </header><main class="content">${pg.render(r)}</main></div></div>`;
      if (pg.mount) pg.mount(r);
      scrollTo(0, keepY); A._same = r.join('/');
    },
    toast(t) { const el = document.getElementById('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(A._tt); A._tt = setTimeout(() => el.classList.remove('on'), 2400); },
    drawer(html) { A.close(); const o = document.createElement('div'); o.className = 'overlay'; o.id = 'ov'; o.innerHTML = `<div class="drawer">${html}</div>`; o.addEventListener('click', e => { if (e.target === o) A.close(); }); document.body.appendChild(o); },
    modal(html) { A.close(); const o = document.createElement('div'); o.className = 'modal-bg'; o.id = 'ov'; o.innerHTML = `<div class="modal">${html}</div>`; o.addEventListener('click', e => { if (e.target === o) A.close(); }); document.body.appendChild(o); },
    close() { const o = document.getElementById('ov'); if (o) o.remove(); },
    download(name, text, type = 'text/plain') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  };

  acts.theme = () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    AStore.s.theme = cur === 'dark' ? 'light' : 'dark'; AStore.save(); AStore.applyTheme(); A.render();
  };
  acts.close = () => A.close();
  inputs.search = el => {
    A.q.search = el.value;
    if (A.route[0] !== 'people') { A.go('people'); setTimeout(() => { const i = document.querySelector('[data-in=search]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 0); }
    else if (pages.people.refresh) pages.people.refresh();
  };

  document.addEventListener('click', e => {
    const n = e.target.closest('[data-nav]'); if (n) { e.preventDefault(); A.go(n.dataset.nav); return; }
    const a = e.target.closest('[data-act]'); if (a && acts[a.dataset.act]) { e.preventDefault(); acts[a.dataset.act](a, e); }
  });
  document.addEventListener('input', e => { const i = e.target.closest('[data-in]'); if (i && inputs[i.dataset.in]) inputs[i.dataset.in](i, e); });
  document.addEventListener('change', e => { const i = e.target.closest('[data-ch]'); if (i && inputs[i.dataset.ch]) inputs[i.dataset.ch](i, e); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') A.close(); });
  addEventListener('hashchange', () => { A.close(); A.render(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (AStore.s.theme === 'system') A.render(); });
})();
