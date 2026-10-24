/* Partecipanti: elenco filtrabile e ordinabile, scheda completa di ogni tester. */
(function () {
  const { fmt, pct } = St, esc = A.esc;
  A.char = u => {
    if (!u.quizDone) return '—';
    const s = u.est.soc * 100, c = u.est.cur * 100, p = u.est.plan * 100;
    return s >= 55 && c >= 55 ? 'Esploratore Sociale' : s >= 55 ? 'Cuore della Festa' : c >= 55 ? 'Curioso Tranquillo' : p >= 55 ? 'Architetto' : 'Spirito Libero';
  };
  const STC = { Attivo: 'good', Inattivo: 'warn', Abbandonato: 'crit', Onboarding: 'brand', 'Senza consenso': 'mute' };
  const COLS = [
    ['name', 'Tester', u => u.name], ['status', 'Stato', u => u.status], ['char', 'Tipo', A.char], ['ratings', 'Voti', u => u.ratings.length, 1],
    ['days', 'Giorni domande', u => u.daysDone || 0, 1], ['parts', 'Attività', u => u.parts.length, 1], ['points', 'Punti', u => u.points, 1],
    ['quality', 'Qualità', u => u.quizDone ? u.quality.score : -1, 1], ['drift', 'Scostamento', u => u.ratings.length >= 3 ? u.drift : -1, 1], ['last', 'Ultimo accesso', u => u.lastAt, 1]
  ];
  const st = { sort: 'last', dir: -1, page: 0 };
  function list() {
    const q = (A.q.search || '').toLowerCase().trim(), ex = AStore.s.excluded || {};
    let L = A.D.users.filter(u => (!q || (u.name + ' ' + u.code + ' ' + u.email + ' ' + u.id).toLowerCase().includes(q)) && (!A.q.status || u.status === A.q.status) && (!A.q.char || A.char(u) === A.q.char)
      && (!A.q.flag || (A.q.flag === 'low' ? u.quizDone && u.quality.score < 60 : A.q.flag === 'ex' ? ex[u.id] : A.q.flag === 'house' ? u.house : A.q.flag === 'host' ? u.acts.length : true)));
    const c = COLS.find(x => x[0] === st.sort); L.sort((a, b) => { const x = c[2](a), y = c[2](b); return (x > y ? 1 : x < y ? -1 : 0) * st.dir; });
    return L;
  }
  const qBadge = u => !u.quizDone ? '<span class="muted">—</span>' : A.badge(u.quality.score >= 75 ? ['good', u.quality.score] : u.quality.score >= 60 ? ['warn', u.quality.score] : ['crit', u.quality.score]);
  function table() {
    const L = list(), per = 20, pages = Math.max(1, Math.ceil(L.length / per)); st.page = Math.min(st.page, pages - 1);
    const ex = AStore.s.excluded || {};
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${COLS.map(c => `<th class="sortable ${c[3] ? 'num' : ''}" data-act="sort" data-k="${c[0]}">${c[1]}${st.sort === c[0] ? (st.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('')}</tr></thead><tbody>
      ${L.slice(st.page * per, st.page * per + per).map(u => `<tr class="click" data-act="openUser" data-id="${u.id}" style="${ex[u.id] ? 'opacity:.5' : ''}">
        <td><div class="row">${A.av(u, 30)}<div><b>${esc(u.name)}</b><div class="muted" style="font-size:12px">${u.code} · ${u.age} anni · ${esc(u.area)}</div></div></div></td>
        <td>${A.badge([STC[u.status], u.status])}${ex[u.id] ? ' <span class="badge b-mute">Escluso</span>' : ''}</td><td>${esc(A.char(u))}</td>
        <td class="num">${u.ratings.length}</td><td class="num">${u.quizDone ? (u.daysDone || 0) + '/' + AStore.s.settings.dailyDays : '—'}</td><td class="num">${u.parts.length + u.acts.length}</td>
        <td class="num">${u.points}</td><td class="num">${qBadge(u)}</td><td class="num">${u.ratings.length >= 3 ? fmt(u.drift, 1) : '—'}</td><td class="num muted">${A.ago(u.lastAt)}</td></tr>`).join('') || `<tr><td colspan="10" class="empty">Nessun tester con questi filtri.</td></tr>`}
      </tbody></table></div>
      <div class="pager"><span>${L.length} tester</span><button class="btn s sm" data-act="pg" data-d="-1" ${st.page ? '' : 'disabled'}>Precedente</button><span>Pagina ${st.page + 1} di ${pages}</span><button class="btn s sm" data-act="pg" data-d="1" ${st.page < pages - 1 ? '' : 'disabled'}>Successiva</button></div>`;
  }
  const sel = (k, label, opts) => `<select class="in" data-ch="flt" data-k="${k}"><option value="">${label}</option>${opts.map(o => `<option ${A.q[k] === o[0] ? 'selected' : ''} value="${esc(o[0])}">${esc(o[1])}</option>`).join('')}</select>`;
  A.page('people', {
    title: 'Partecipanti', crumb: 'Tutti i tester del campione',
    render() {
      const chars = ['Esploratore Sociale', 'Cuore della Festa', 'Curioso Tranquillo', 'Architetto', 'Spirito Libero'];
      return `<div class="card"><div class="filters">
          ${sel('status', 'Tutti gli stati', Object.keys(STC).map(s => [s, s]))}
          ${sel('char', 'Tutti i tipi', chars.map(c => [c, c]))}
          ${sel('flag', 'Nessun filtro extra', [['low', 'Qualità bassa'], ['ex', 'Esclusi dalle analisi'], ['house', 'In un match casa'], ['host', 'Hanno creato attività']])}
          ${A.q.status || A.q.char || A.q.flag || A.q.search ? '<button class="btn g sm" data-act="clearF">Azzera filtri</button>' : ''}
          <span style="flex:1"></span><button class="btn s sm" data-act="csv">${A.ic('down', 16)}Esporta CSV</button></div>
        <div id="ptable">${table()}</div></div>`;
    },
    refresh() { st.page = 0; const t = document.getElementById('ptable'); if (t) t.innerHTML = table(); }
  });
  A.acts.sort = el => { const k = el.dataset.k; st.dir = st.sort === k ? -st.dir : -1; st.sort = k; document.getElementById('ptable').innerHTML = table(); };
  A.acts.pg = el => { st.page += +el.dataset.d; document.getElementById('ptable').innerHTML = table(); };
  A.acts.clearF = () => { A.q = {}; st.page = 0; A.render(); };
  A.inputs.flt = el => { A.q[el.dataset.k] = el.value; st.page = 0; A.render(); };
  A.acts.csv = () => {
    const L = list(), codes = A.D.ITEMS.map(i => i.code).concat(['FU1', 'FU2']);
    const head = ['id', 'codice', 'nome', 'email', 'eta', 'zona', 'stato', 'tipo', 'voti', 'giorni_domande', 'punti', 'qualita', 'scostamento', ...codes];
    const rows = L.map(u => [u.id, u.code, u.name, u.email, u.age, u.area, u.status, A.char(u), u.ratings.length, u.daysDone || 0, u.points, u.quizDone ? u.quality.score : '', u.ratings.length >= 3 ? u.drift.toFixed(1) : '', ...codes.map(c => (u.quiz[c] || {}).v || '')]);
    A.download('centro_partecipanti.csv', [head, ...rows].map(r => r.map(x => /[",;\n]/.test(String(x)) ? '"' + String(x).replace(/"/g, '""') + '"' : x).join(',')).join('\n'), 'text/csv');
    A.toast(`Esportati ${L.length} tester`);
  };

  /* ---------- scheda del tester ---------- */
  const DIM = [['soc', 'Socialità'], ['cur', 'Apertura'], ['plan', 'Organizzazione'], ['act', 'Attività']];
  function detail(u) {
    const s = AStore.s, ex = (s.excluded || {})[u.id], D = A.D, codes = D.ITEMS.map(i => i.code);
    const q = u.quality, msgs = (s.messages || []).filter(m => m.to === 'all' || (m.ids || []).includes(u.id));
    const house = u.house && D.houses.find(h => h.id === u.house);
    const sec = (t, body) => `<div class="stack"><h3 style="font:700 14px 'DM Sans'">${t}</h3>${body}</div>`;
    return `<div class="row">${A.av(u, 52)}<div style="flex:1"><div class="serif" style="font-size:24px">${esc(u.name)}</div><div class="muted">${u.code} · ${u.id} · ${esc(u.email)}</div></div><button class="iconbtn" data-act="close">${A.ic('x')}</button></div>
      <div class="row" style="flex-wrap:wrap">${A.badge([STC[u.status], u.status])}<span class="badge b-brand">${esc(A.char(u))}</span><span class="badge b-mute">${u.age} anni · ${esc(u.area)}</span>${u.speeder ? '<span class="badge b-crit"><i></i>Risponde di fretta</span>' : ''}</div>
      <div class="grid g4" style="gap:10px">${[['Punti', u.points], ['Voti', u.ratings.length], ['Giorni domande', (u.daysDone || 0) + '/' + s.settings.dailyDays], ['Completamento', u.progress + '%']].map(([k, v]) => `<div class="note"><div class="muted" style="font-size:11px">${k}</div><b style="font-size:18px">${v}</b></div>`).join('')}</div>
      <div class="note">Iscritto il ${A.dt(u.joinedAt, 1)} · ultimo accesso ${A.ago(u.lastAt)}${u.consent ? ' · consenso dato' : ' · <b>consenso non dato</b>'}</div>
      ${u.quizDone ? sec('Profilo: dichiarato e attuale', `<div class="muted" style="font-size:13px">Il profilo attuale si sposta con i voti. Scostamento medio <b>${fmt(u.drift, 1)} punti</b>.</div>
        ${DIM.map(([k, n]) => { const a = Math.round(u.est[k] * 100), b = Math.round(u.now[k] * 100); return `<div><div class="row sb" style="font-size:13px"><span>${n}</span><span class="muted">${a} → <b style="color:var(--ink)">${b}</b></span></div><div class="meter" style="height:8px;margin-top:4px"><i style="width:${a}%;background:var(--q250)"></i><i style="left:${Math.min(a, b)}%;width:${Math.abs(b - a)}%;background:${b >= a ? 'var(--s1)' : 'var(--s2)'}"></i></div></div>`; }).join('')}
        ${Ch.legend([['var(--q250)', 'Dal questionario'], ['var(--s1)', 'Spostamento in su'], ['var(--s2)', 'Spostamento in giù']])}`) : ''}
      ${sec('Risposte al questionario', u.quizDone || Object.keys(u.quiz).length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th class="num">Risposta</th><th class="num">Tempo</th><th>Domande del giorno</th></tr></thead><tbody>
        ${codes.concat(['FU1', 'FU2']).map(c => { const a = u.quiz[c], dd = u.daily.filter(x => x.code === c); return `<tr><td><b>${c}</b></td><td class="num">${a ? a.v : '—'}</td><td class="num ${a && a.ms < 1200 ? '' : 'muted'}" style="${a && a.ms < 1200 ? 'color:var(--crit);font-weight:700' : ''}">${a ? fmt(a.ms / 1000, 1) + ' s' : ''}</td><td>${dd.length ? `<div class="dots">${dd.map(x => `<i style="background:${x.v === (a || {}).v ? 'var(--good)' : Math.abs(x.v - ((a || {}).v || 3)) === 1 ? 'var(--warn)' : 'var(--crit)'}" title="Giorno ${x.d + 1}">${x.v}</i>`).join('')}</div>` : '<span class="muted">—</span>'}</td></tr>`; }).join('')}
        </tbody></table></div><div class="muted" style="font-size:12px">Pallini: verde uguale al questionario, giallo a un passo, rosso più lontano.</div>
        ${u.quizDone ? `<div class="note">Qualità ${q.score}/100 · tempo medio ${fmt(q.avgMs / 1000, 1)} s · ${q.fast} risposte sotto 1,2 s · ${q.distinct} valori diversi · ${q.neutral} risposte neutre</div>` : ''}` : '<div class="note">Non ha ancora iniziato il questionario.</div>')}
      ${sec(`Voti (${u.ratings.length})`, u.ratings.length ? `<div class="tbl-wrap" style="max-height:260px"><table class="tbl"><thead><tr><th>Contenuto</th><th>Feed</th><th class="num">Pos.</th><th class="num">Affinità</th><th class="num">Voto</th></tr></thead><tbody>
        ${u.ratings.slice().sort((a, b) => a.rank - b.rank).map(r => `<tr><td>${esc(r.title)}${r.deep ? ' <span class="badge b-brand">approfondito</span>' : ''}</td><td>${r.feed === 'affini' ? 'Affini' : 'Tutti'}</td><td class="num">${r.rank}</td><td class="num">${r.aff}%</td><td class="num"><b>${r.v}</b>/5</td></tr>`).join('')}</tbody></table></div>
        <div class="note">Correlazione affinità–voto per questo tester: <b>r = ${fmt(St.corr(u.ratings.map(r => r.aff), u.ratings.map(r => r.v)))}</b></div>` : '<div class="note">Nessun voto.</div>')}
      ${u.acts.length || u.parts.length ? sec('Community', `<div class="stack">${u.acts.map(id => { const a = D.byId[id]; return `<div class="note"><b>Organizza:</b> ${esc(a.title)} · ${a.status}${a.hostAvg ? ` · voto host ${fmt(a.hostAvg, 1)}/5 (${a.fbN})` : ''}</div>`; }).join('')}
        ${u.parts.map(p => { const a = D.byId[p.act]; return `<div class="row sb" style="font-size:13px"><span>${esc(a.title)} <span class="muted">di ${esc(a.who)}</span></span><span>${A.badge([p.status === 'conclusa' ? 'good' : p.status === 'non accolta' ? 'crit' : p.status === 'accettata' ? 'brand' : 'mute', p.status])} <span class="muted">aff. ${p.aff}%</span>${p.post ? ` · soddisfazione <b>${p.post[0]}</b>/5` : ''}</span></div>`; }).join('')}</div>`) : ''}
      ${house ? sec('Match casa', `<div class="stack">${house.pairs.filter(p => p.a === u.id || p.b === u.id).map(p => { const o = A.user(p.a === u.id ? p.b : p.a); return `<div class="row sb" style="font-size:13px"><span class="row">${A.av(o, 24)}${esc(o.name)}</span><span>previsto <b>${p.pred}%</b> · voto convivenza <b>${p.rate}</b>/5${p.smokeClash ? ' · <span style="color:var(--crit)">conflitto fumo</span>' : ''}</span></div>`; }).join('')}</div>`) : ''}
      ${sec('Messaggi dello staff ricevuti', msgs.length ? msgs.map(m => `<div class="note"><b>${esc(m.title)}</b> · ${A.dt(m.at, 1)}<br>${esc(m.body)}</div>`).join('') : '<div class="note">Nessuno.</div>')}
      ${sec('Note interne', `<textarea class="in" data-in="note" data-id="${u.id}" placeholder="Visibili solo al team">${esc((s.notes || {})[u.id] || '')}</textarea>`)}
      <div class="row" style="position:sticky;bottom:-22px;background:var(--surface);padding:12px 0"><button class="btn" data-act="msgUser" data-id="${u.id}">${A.ic('send', 16)}Scrivi a ${esc(u.nome)}</button><button class="btn s" data-act="exclude" data-id="${u.id}">${ex ? 'Includi nelle analisi' : 'Escludi dalle analisi'}</button></div>`;
  }
  A.acts.openUser = el => { const u = A.user(el.dataset.id); if (u) A.drawer(detail(u)); };
  A.inputs.note = el => { AStore.s.notes[el.dataset.id] = el.value; AStore.save(); };
  A.acts.exclude = el => {
    const s = AStore.s, id = el.dataset.id; s.excluded = s.excluded || {};
    if (s.excluded[id]) delete s.excluded[id]; else s.excluded[id] = 1;
    AStore.save(); A.restat(); A.render(); A.drawer(detail(A.user(id)));
    A.toast(s.excluded[id] ? 'Escluso dalle analisi: statistiche ricalcolate' : 'Di nuovo incluso nelle analisi');
  };
  A.acts.msgUser = el => { A.q.msgTo = el.dataset.id; A.close(); A.go('messages'); };
})();
