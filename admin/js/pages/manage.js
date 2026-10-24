/* Gestione: contenuti demo, messaggi dello staff, segnalazioni, impostazioni. Tutto salvato in AStore (letto dal prototipo). */
(function () {
  const esc = A.esc, s = () => AStore.s;
  const TYPES = [['evento', 'Evento'], ['attivita', 'Attività demo'], ['spot', 'Spot'], ['bacheca', 'Annuncio in bacheca']];
  const INT = ['Sport', 'Musica', 'Cucina', 'Arte', 'Giochi', 'Natura', 'Cinema', 'Lettura', 'Cultura'];
  const fld = (l, h) => `<div class="field"><label>${l}</label>${h}</div>`;

  A.page('content', {
    title: 'Contenuti', crumb: 'Eventi, attività demo, spot e bacheca',
    render(r) {
      const own = s().content, base = DATA.content.concat(DATA.board.map(b => Object.assign({ type: 'bacheca' }, b)));
      const form = `<div class="card"><h3>Nuovo contenuto</h3><div class="grid g3">
        ${fld('Tipo', `<select class="in" id="cType">${TYPES.map(t => `<option value="${t[0]}">${t[1]}</option>`).join('')}</select>`)}
        ${fld('Titolo', '<input class="in" id="cTitle" placeholder="Es. Aperitivo in terrazza">')}
        ${fld('Interesse', `<select class="in" id="cInt">${INT.map(i => `<option>${i}</option>`).join('')}</select>`)}
        ${fld('Chi lo propone', '<input class="in" id="cWho" value="Team CEnTRO">')}
        ${fld('Quando', '<input class="in" id="cWhen" placeholder="Sab 28 · 19:00">')}
        ${fld('Dove', '<input class="in" id="cPlace" placeholder="Via, Milano">')}</div>
        ${fld('Descrizione', '<textarea class="in" id="cDesc"></textarea>')}
        <div class="grid g4">${[['soc', 'Socialità'], ['cur', 'Novità'], ['plan', 'Struttura'], ['act', 'Movimento']].map(([k, l]) => fld(l + ' (0–100)', `<input class="in" type="range" min="0" max="100" value="50" id="cv_${k}">`)).join('')}</div>
        <div class="muted" style="font-size:12px">Il profilo del contenuto serve a calcolare l'affinità con ogni tester.</div>
        <div class="row"><button class="btn" data-act="cSave">${A.ic('plus', 16)}Pubblica nel prototipo</button></div></div>`;
      return (r[1] === 'new' || !own.length ? form : `<div class="row"><button class="btn" data-nav="content/new">${A.ic('plus', 16)}Nuovo contenuto</button></div>`) + `
      <div class="card"><h3>Contenuti creati dal team (${own.length})</h3>${own.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Titolo</th><th>Tipo</th><th>Interesse</th><th>Quando</th><th>Stato</th><th></th></tr></thead><tbody>
        ${own.map(c => `<tr><td><b>${esc(c.title)}</b></td><td>${(TYPES.find(t => t[0] === (c.spot ? 'spot' : c.type)) || [0, c.type])[1]}</td><td>${esc(c.interest || '')}</td><td>${esc(c.when || '')}</td><td>${A.badge(c.active !== false ? ['good', 'Attivo'] : ['mute', 'Sospeso'])}</td><td class="num"><button class="btn s sm" data-act="cToggle" data-id="${c.id}">${c.active !== false ? 'Sospendi' : 'Riattiva'}</button> <button class="btn g sm" data-act="cDel" data-id="${c.id}">${A.ic('trash', 14)}</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Nessun contenuto creato.</div>'}</div>
      <div class="card"><h3>Contenuti del prototipo (${base.length})</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>Titolo</th><th>Tipo</th><th class="num">Voti</th><th class="num">Voto medio</th></tr></thead><tbody>
        ${base.map(c => { const rs = A.D.users.flatMap(u => u.ratings.filter(x => x.id === c.id)); return `<tr><td class="muted">${c.id}</td><td><b>${esc(c.title)}</b></td><td>${c.type}</td><td class="num">${rs.length}</td><td class="num">${rs.length ? St.fmt(St.mean(rs.map(x => x.v)), 2) : '—'}</td></tr>`; }).join('')}</tbody></table></div></div>`;
    }
  });
  A.acts.cSave = () => {
    const g = id => document.getElementById(id).value.trim(), t = g('cType'), title = g('cTitle');
    if (!title) return A.toast('Scrivi un titolo');
    const v = {}; ['soc', 'cur', 'plan', 'act'].forEach(k => v[k] = +g('cv_' + k) / 100);
    const c = { id: 'x' + Date.now().toString(36), type: t === 'spot' ? 'evento' : t, spot: t === 'spot', title, interest: g('cInt'), who: g('cWho'), when: g('cWhen'), place: g('cPlace'), city: 'Milano', desc: g('cDesc'), text: g('cDesc'), kind: 'Annuncio', cat: 'Demo', price: 'Gratis', v, active: true, at: Date.now() };
    s().content.unshift(c); AStore.save(); A.reload(); A.go('content'); A.toast('Pubblicato: visibile nel prototipo di questo browser');
  };
  A.acts.cToggle = el => { const c = s().content.find(x => x.id === el.dataset.id); c.active = c.active === false; AStore.save(); A.reload(); A.render(); };
  A.acts.cDel = el => { s().content = s().content.filter(x => x.id !== el.dataset.id); AStore.save(); A.reload(); A.render(); A.toast('Contenuto eliminato'); };

  A.page('messages', {
    title: 'Messaggi', crumb: 'Arrivano nelle notifiche come «Staff CEnTRO»',
    render() {
      const to = A.q.msgTo, u = to && A.user(to), M = s().messages;
      return `<div class="grid g2"><div class="card"><h3>Nuovo messaggio</h3>
        ${fld('Destinatari', `<select class="in" id="mTo"><option value="all">Tutti i tester (${A.D.users.length})</option>${['Attivo', 'Inattivo', 'Abbandonato', 'Onboarding'].map(x => `<option value="st:${x}">Solo stato «${x}» (${A.D.users.filter(y => y.status === x).length})</option>`).join('')}${u ? `<option value="one:${u.id}" selected>Solo ${esc(u.name)}</option>` : ''}</select>`)}
        ${fld('Titolo', '<input class="in" id="mTitle" placeholder="Es. Nuove attività questo weekend">')}
        ${fld('Testo', '<textarea class="in" id="mBody" placeholder="Scrivi il messaggio"></textarea>')}
        <div class="row"><button class="btn" data-act="mSend">${A.ic('send', 16)}Invia</button></div></div>
        <div class="card"><h3>Storico (${M.length})</h3><div class="stack">${M.map(m => `<div class="note"><div class="row sb"><b style="color:var(--ink)">${esc(m.title)}</b><span class="muted" style="font-size:12px">${A.dt(m.at, 1)} · ${m.reach} destinatari</span></div>${esc(m.body)}</div>`).join('') || '<div class="empty">Nessun messaggio inviato.</div>'}</div></div></div>`;
    }
  });
  A.acts.mSend = () => {
    const to = document.getElementById('mTo').value, title = document.getElementById('mTitle').value.trim(), body = document.getElementById('mBody').value.trim();
    if (!title || !body) return A.toast('Scrivi titolo e testo');
    const ids = to === 'all' ? null : to.startsWith('st:') ? A.D.users.filter(u => u.status === to.slice(3)).map(u => u.id) : [to.slice(4)];
    s().messages.unshift({ id: 'm' + Date.now(), title, body, to: to === 'all' ? 'all' : 'some', ids, reach: ids ? ids.length : A.D.users.length, at: Date.now() });
    AStore.save(); A.q.msgTo = null; A.render(); A.toast('Messaggio inviato');
  };

  A.page('reports', {
    title: 'Segnalazioni', crumb: 'Feedback negativi con codice pratica',
    render() {
      return `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Codice</th><th>Da</th><th>Contro</th><th class="wrap">Testo</th><th>Stato</th></tr></thead><tbody>
        ${A.D.reports.map(r => { const st = s().reports[r.code] || 'aperta'; return `<tr><td><b>${r.code}</b></td><td>${esc(A.user(r.from).name)}</td><td>${esc(A.user(r.against).name)}</td><td class="wrap">${esc(r.text)}</td><td><select class="in" data-ch="rep" data-c="${r.code}">${['aperta', 'in verifica', 'chiusa'].map(x => `<option ${x === st ? 'selected' : ''}>${x}</option>`).join('')}</select></td></tr>`; }).join('')}</tbody></table></div></div>`;
    }
  });
  A.inputs.rep = el => { s().reports[el.dataset.c] = el.value; AStore.save(); A.render(); };

  A.page('settings', {
    title: 'Impostazioni', crumb: 'Account, tema e parametri del test',
    render() {
      const S = s(), st = S.settings, num = (k, l, min, max) => fld(l, `<input class="in" type="number" min="${min}" max="${max}" data-ch="set" data-k="${k}" value="${st[k]}">`);
      return `<div class="grid g2"><div class="card"><h3>Profilo admin</h3>
        ${fld('Nome', `<input class="in" data-ch="adm" data-k="name" value="${esc(S.admin.name)}">`)}${fld('Email', `<input class="in" data-ch="adm" data-k="email" value="${esc(S.admin.email)}">`)}${fld('Ruolo', `<input class="in" data-ch="adm" data-k="role" value="${esc(S.admin.role)}">`)}
        <h3>Tema</h3><div class="seg">${[['light', 'Chiaro'], ['dark', 'Scuro'], ['system', 'Sistema']].map(([k, l]) => `<button class="${S.theme === k ? 'on' : ''}" data-act="setTheme" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="row"><button class="btn s" data-act="logout">${A.ic('logout', 16)}Esci</button></div></div>
        <div class="card"><h3>Parametri del test</h3><div class="grid g2">${num('threshold', 'Soglia «Affini»', 30, 90)}${num('dailyPerDay', 'Domande del giorno', 1, 10)}${num('dailyDays', 'Giorni di domande', 1, 30)}${num('ratingPts', 'Punti per voto', 0, 50)}${num('deepPts', 'Punti voto approfondito', 0, 50)}</div>
        <h3>Campione simulato</h3><div class="grid g2">${num('n', 'Numero di tester', 20, 500)}${num('seed', 'Seme', 1, 9999)}</div>
        <div class="row" style="flex-wrap:wrap"><button class="btn s" data-act="expJson">${A.ic('down', 16)}Esporta JSON</button><button class="btn s" data-act="csv">Esporta CSV</button><button class="btn d" data-act="resetAll">Ripristina tutto</button></div></div></div>`;
    }
  });
  A.inputs.set = el => { s().settings[el.dataset.k] = +el.value; AStore.save(); A.reload(); A.toast('Salvato: statistiche ricalcolate'); };
  A.inputs.adm = el => { s().admin[el.dataset.k] = el.value; AStore.save(); A.render(); };
  A.acts.setTheme = el => { s().theme = el.dataset.v; AStore.save(); AStore.applyTheme(); A.render(); };
  A.acts.logout = () => { s().logged = false; AStore.save(); A.render(); };
  A.acts.expJson = () => A.download('centro_dati.json', JSON.stringify({ settings: s().settings, users: A.D.users.map(u => ({ id: u.id, code: u.code, status: u.status, quiz: u.quiz, ratings: u.ratings, daily: u.daily, points: u.points })) }), 'application/json');
  A.acts.resetAll = () => { AStore.reset(); A.reload(); A.render(); A.toast('Portale ripristinato'); };
})();
