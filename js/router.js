/* Navigazione a pila, barre alta/bassa, overlay (popup e sheet), toast, pannello demo */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const screens = {};
  let stack = [], cur = null, timers = [];

  const App = {
    esc, screens,
    /* registra una schermata:
       { top:'onb'|'main'|'q'|fn, nav:bool, noBack:bool, render(p)->{html,cta,hero}|string, mount(view,p), actions:{} } */
    screen(name, def) { screens[name] = def; },
    get stack() { return stack; },
    get current() { return stack[stack.length - 1]; },

    go(name, p) { saveScroll(); stack.push({ name, p: p || {} }); render(1); },
    replace(name, p) { stack[stack.length - 1] = { name, p: p || {} }; render(1); },
    backTo(name) { const i = stack.map(x => x.name).lastIndexOf(name); if (i < 0) return App.go(name); stack = stack.slice(0, i + 1); render(-1); },
    back() { if (stack.length > 1) { stack.pop(); render(-1); } },
    reset(list) { stack = list.map(x => typeof x === 'string' ? { name: x, p: {} } : x); render(1); },
    tab(name) { if (stack.length === 1 && stack[0].name === name) return; stack = [{ name: 'home', p: {} }]; if (name !== 'home') stack.push({ name, p: {} }); render(0); },
    refresh() { render(0, true); },

    later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; },
    every(fn, ms) { const t = setInterval(fn, ms); timers.push(t); return t; },

    /* ---- overlay ---- */
    sheet(html) { openOv(`<div class="dim" data-act="closeOv"></div><div class="sheet"><div class="grab"></div>${html}</div>`); },
    pop(html) { openOv(`<div class="dim" data-act="closeOv"></div><div class="pop">${html}</div>`); },
    closeOv() { const o = $('#ov'); o.classList.remove('on'); setTimeout(() => { if (!o.classList.contains('on')) o.innerHTML = ''; }, 300); },
    toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2200); },
    buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms || 12); } catch (e) { } },
    /* assegna punti di un task con toast */
    award(taskId) { const p = Store.completeTask(taskId); if (p) { App.toast(`+${p} punti · task completato`); updateTop(); } return p; },
    updateTop() { updateTop(); },

    /* azioni globali (data-act) */
    actions: {
      closeOv() { App.closeOv(); },
      progress() { progressPop(); },
      help() { helpSheet(); },
      notifs() { App.go('notifs'); }
    }
  };
  window.App = App;

  /* altezza dello spaziatore = pulsanti fissi + barra bassa + margine; segue i cambi di altezza dei pulsanti */
  function fitPad() {
    const p = document.getElementById('vpad'); if (!p) return;
    const ch = $('#cta').offsetHeight, nav = $('#phone').classList.contains('has-nav') ? $('#nav').offsetHeight + 24 : 0;
    p.style.height = Math.max(ch + nav + 16, nav ? nav + 40 : 40) + 'px';
  }
  if (window.ResizeObserver) new ResizeObserver(fitPad).observe(document.getElementById('cta'));

  /* ricorda dove eri nella schermata che lasci, per tornarci con «Indietro» */
  function saveScroll() { const c = App.current; if (c) c.scroll = $('#view').scrollTop; }

  function openOv(html) { const o = $('#ov'); o.innerHTML = html; requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('on'))); }

  /* ---------- barra alta ---------- */
  const backBtn = (dis) => `<span class="gl${dis ? ' off' : ''}" data-back>${ic('back', { size: 20 })}Indietro</span>`;
  const helpBtn = () => `<span class="gl" style="width:46px;padding:0" data-act="help" aria-label="Aiuto">${ic('help')}</span>`;
  function mainRight() {
    const pct = Store.progress(), un = Store.unread();
    return `<div style="display:flex;gap:8px;align-items:center">
      <span class="gl" style="width:46px;padding:0;position:relative" data-act="notifs" aria-label="Notifiche">${ic('bell')}${un ? '<i class="dot-new"></i>' : ''}</span>
      <span class="gl" data-act="progress" aria-label="Avanzamento">${ring(pct)}${pct}%</span></div>`;
  }
  function topHtml(sc, p) {
    const dis = stack.length < 2 || sc.noBack;
    if (typeof sc.top === 'function') return sc.top(p, { back: backBtn(dis), help: helpBtn(), main: mainRight() });
    if (sc.top === 'none') return '';
    if (sc.top === 'onb') return backBtn(dis) + helpBtn();
    return backBtn(dis) + mainRight();
  }
  function updateTop() { const c = App.current; if (c) $('#top').innerHTML = topHtml(screens[c.name], c.p); }

  /* ---------- barra bassa ---------- */
  const TABS = [['home', 'Home', 'home'], ['profile', 'Profilo', 'user'], ['stats', 'Statistiche', 'stats']];
  function navHtml(sc) {
    const on = sc.tab || 'home';
    return TABS.map(([id, l, i]) => `<div class="nv${on === id ? ' on' : ''}" data-tab="${id}">${ic(i, { size: 24, color: on === id ? '#489DFE' : '#000' })}<span>${l}</span></div>`).join('');
  }

  /* ---------- render ---------- */
  function render(dir, keepScroll) {
    timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = [];
    if (cur && cur.unmount) cur.unmount();
    const c = App.current, sc = screens[c.name];
    if (!sc) { console.warn('schermata mancante', c.name); return; }
    cur = sc;
    let out = sc.render(c.p, c);
    if (typeof out === 'string') out = { html: out };
    const v = $('#view'), st = keepScroll ? v.scrollTop : dir < 0 ? (c.scroll || 0) : 0;
    v.className = (sc.nav ? 'nav-on' : '') + (out.hero ? ' has-hero' : '') + (out.cls ? ' ' + out.cls : '');
    /* in fondo uno spaziatore vero (non padding: Safari su iPhone non lo conta nello scroll) */
    v.innerHTML = (out.hero || '') + `<div class="cn"${out.cnStyle ? ` style="${out.cnStyle}"` : ''}>${out.html}</div><div class="vpad" id="vpad"></div>`;
    $('#top').innerHTML = topHtml(sc, c.p);
    $('#cta').innerHTML = out.cta ? `<div class="ctab">${out.cta}</div>` : '';
    $('#nav').innerHTML = sc.nav ? navHtml(sc) : '';
    $('#phone').classList.toggle('has-nav', !!sc.nav);
    fitPad();
    v.scrollTop = st; $('#phone').classList.toggle('scrolled', st > 12);
    if (!keepScroll && dir) { v.classList.add(dir > 0 ? 'enter' : 'enter-back'); }
    $('#nvf').innerHTML = sc.nav ? ' ' : '';
    if (!keepScroll) App.closeOv();
    if (sc.mount) sc.mount(v, c.p, c);
    try { sessionStorage.setItem('centro_stack', JSON.stringify(stack)); } catch (e) { }
    Side.mark(c.name);
  }

  /* ---------- eventi delegati ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-back],[data-go],[data-tab],[data-act]');
    if (!el || !el.closest('#phone,#side')) return;
    if (el.hasAttribute('disabled') || el.classList.contains('off')) return;
    if (el.hasAttribute('data-back')) return App.back();
    if (el.dataset.tab) return App.tab(el.dataset.tab);
    if (el.dataset.go) { let p = {}; try { p = el.dataset.p ? JSON.parse(el.dataset.p) : {}; } catch (x) { } App.closeOv(); return App.go(el.dataset.go, p); }
    const a = el.dataset.act, sc = cur || {};
    if (sc.actions && sc.actions[a]) return sc.actions[a](el, e);
    if (App.actions[a]) return App.actions[a](el, e);
    console.warn('azione non gestita', a);
  });

  /* ---------- popup avanzamento ---------- */
  function progressPop() {
    const pct = Store.progress(), pts = Store.points(), eur = Store.eur();
    App.pop(`<div style="display:flex;justify-content:space-between;align-items:center"><div class="h2">Il tuo avanzamento</div>
      <button class="ico x" data-act="closeOv" aria-label="Chiudi">${ic('close', { size: 18 })}</button></div>
      <div style="display:flex;align-items:center;gap:16px">${ring(pct, 84, 4)}<div class="h1n" style="font-size:42px;line-height:46px">${pct}%</div>
      <div class="b15" style="margin-left:auto;text-align:right">${Store.fragments()} / ${DATA.tasks.length}<br>task</div></div>
      <div class="gy" style="padding:12px 14px"><div class="rw" style="justify-content:space-between"><span class="b17">Punti</span><b class="h3">${pts}</b></div>
      <div class="rw" style="justify-content:space-between"><span class="b17">Valore in €</span><b class="h3">${eur.toFixed(2).replace('.', ',')} €</b></div></div>
      <div class="b13">Voucher fino a 10 €: lo riscatti nell'app ufficiale.</div>
      <div class="btn" data-go="tasks">Vai ai task</div>`);
  }

  /* ---------- aiuto «?» ---------- */
  function helpSheet() {
    const row = (icn, t, s, attrs) => `<div class="card tap" style="flex-direction:row;align-items:center;gap:12px;padding:14px 16px" ${attrs}>
      <div class="ico b">${ic(icn, { color: '#489DFE' })}</div><div class="tx"><div class="h3">${t}</div><div class="b15">${s}</div></div>${ic('chev', { size: 16, color: '#CCD2D9', sw: 2 })}</div>`;
    App.sheet(`<div class="h2" style="padding:4px 4px 0">Aiuto</div>
      ${row('video', 'Rivedi il video', '2–3 minuti, con sottotitoli', 'data-go="welcome" data-p=\'{"review":1}\'')}
      ${row('rules', 'Le regole del test', 'Feed Affini, soglia, valutazioni', 'data-go="consent" data-p=\'{"review":1}\'')}
      ${row('rate', 'Come si valuta', 'Rapida (1–5) o approfondita', 'data-act="rateHelp"')}
      <div class="btn g" data-act="closeOv">Chiudi</div>`);
  }
  App.actions.rateHelp = () => App.pop(`<div class="h2">Come si valuta</div>
    <div class="b17"><b>Rapida:</b> scegli un numero da 1 a 5, poi «Invia».<br><br><b>Approfondita:</b> più domande, foto, video o audio e un commento libero.</div>
    <div class="gy" style="background:#E4F1FF"><div class="b15" style="color:#123F73">Ogni valutazione vale punti. Valuta anche ciò che non ti convince: è il dato più utile.</div></div>
    <div class="btn" data-act="closeOv">Ho capito</div>`);

  /* ---------- pannello laterale: mappa del prototipo (solo per chi presenta) ---------- */
  const Side = {
    map: [],
    build(map) {
      this.map = map;
      const s = $('#side');
      s.innerHTML = `<div class="tt">Mappa del prototipo</div><div class="b13" style="margin-top:4px">Salta a qualsiasi schermata. Non fa parte dell'app.</div>
        <div class="row"><button class="mini" data-act="demoFill">Riempi dati demo</button><button class="mini r" data-act="demoReset">Ricomincia</button>
        <button class="mini" data-act="sideClose" id="sideX" style="display:none">Chiudi</button></div>` +
        map.map(g => `<h4>${g.t}</h4>` + g.items.map(([n, l, p]) => `<button class="sl${screens[n] ? '' : ' dis'}" data-jump="${n}" ${p ? `data-p='${JSON.stringify(p)}'` : ''}>${l}</button>`).join('')).join('');
    },
    mark(name) { document.querySelectorAll('#side .sl').forEach(b => b.classList.toggle('cur', b.dataset.jump === name)); }
  };
  App.Side = Side;
  document.addEventListener('click', e => {
    const b = e.target.closest('#side [data-jump]'); if (!b) return;
    let p = {}; try { p = b.dataset.p ? JSON.parse(b.dataset.p) : {}; } catch (x) { }
    const n = b.dataset.jump, onb = ['welcome', 'register', 'consent', 'qintro', 'q', 'qdone', 'summary', 'profileSetup', 'recap'];
    stack = onb.includes(n) ? [] : [{ name: 'home', p: {} }];
    if (!(stack.length && n === 'home')) stack.push({ name: n, p });
    render(1);
    $('#side').classList.remove('open');
  });
  App.actions.demoFill = () => {
    const u = Store.s.user;
    if (!u.nome) Object.assign(u, { nome: 'Marta', cognome: 'Rossi', email: 'marta@email.it', tel: '333 123 4567' });
    if (!u.bio) u.bio = 'Corro, cucino con gli amici e cerco una casa tranquilla.';
    Store.s.consentRead = [0, 1, 2, 3, 4];
    Store.fillRandom(); Store.s.consentAt = Store.s.consentAt || Date.now(); Store.s.onbDone = true;
    Store.completeTask('questionario');
    if (window.seedActsDemo) seedActsDemo();
    if (!Store.s.house || !Store.s.house.members.length) Store.s.house = { name: 'La nostra casa', members: [{ name: 'Giulia Bianchi', code: 'NIA-7QK2M' }, { name: 'Luca Ferri', code: 'NIA-3HD8P' }, { name: 'Sara Conti', code: 'NIA-9WX4T' }] };
    if (!Store.s.notifs.some(n => n.kind === 'mail')) Store.s.notifs = DATA.demoNotifs.map((n, i) => Object.assign({ id: 'd' + i }, n)).concat(Store.s.notifs);
    DATA.demoRatings.forEach(r => { if (!Store.s.ratings[r.id]) Store.s.ratings[r.id] = Object.assign({ at: Date.now() }, r); });
    Store.save();
    App.toast('Dati demo pronti'); App.reset(['home']);
  };
  App.actions.demoReset = () => { if (confirm('Cancellare tutti i dati del prototipo e ricominciare?')) { Store.reset(); try { sessionStorage.removeItem('centro_stack'); } catch (e) { } App.reset(['welcome']); } };
  App.actions.sideClose = () => $('#side').classList.remove('open');

  document.getElementById('view').addEventListener('scroll', e => document.getElementById('phone').classList.toggle('scrolled', e.target.scrollTop > 12), { passive: true });

  /* La mappa del prototipo serve solo a chi presenta: compare in locale (file, localhost) o con ?demo=1 nell'indirizzo.
     Online, per i tester, non c'è. */
  const isDemo = () => {
    try { if (/[?&]demo=1/.test(location.search)) sessionStorage.setItem('centro_demo', '1'); if (/[?&]demo=0/.test(location.search)) sessionStorage.removeItem('centro_demo'); } catch (e) { }
    let flag = false; try { flag = sessionStorage.getItem('centro_demo') === '1'; } catch (e) { }
    return flag || location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  };
  App.start = function (map) {
    if (!isDemo()) { ['side', 'sideBtn'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); }); document.body.classList.add('live'); }
    else Side.build(map);
    if ($('#sideBtn')) $('#sideBtn').onclick = () => { $('#side').classList.add('open'); $('#sideX').style.display = ''; };
    let saved = null; try { saved = JSON.parse(sessionStorage.getItem('centro_stack')); } catch (e) { }
    if (saved && saved.length && saved.every(x => screens[x.name])) stack = saved;
    else stack = [{ name: Store.s.onbDone ? 'home' : 'welcome', p: {} }];
    render(0);
  };
})();
