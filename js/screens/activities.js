/* 1f · lato organizzatore (hub, richieste, dettaglio richiesta, chat, partecipanti, modifica, chiusura)
   1g · lato partecipante (richiesta, le mie attività, attività a cui partecipo, valutazione prima, valutazione finale)
   È la parte «vera» del test (Community): qui tutto è simulato in locale, con risposte automatiche credibili. */
(function () {
  const S = () => Store.s, esc = App.esc, save = () => Store.save();
  const AVC = ['#F5A25D', '#BA7BE0', '#6FD7E1', '#8194FF', '#7BD389', '#F27BA0', '#C08A1A'];
  const POOL = ['Luca', 'Sara', 'Marco', 'Elena', 'Giorgia', 'Davide', 'Irene', 'Tommaso', 'Bea', 'Omar'];
  const hue = n => [...n].reduce((h, c) => h * 31 + c.charCodeAt(0), 7) % AVC.length;
  const chev = () => ic('chev', { size: 16, color: '#CCD2D9', sw: 2 });
  const av = (name, size, i) => `<div class="av" style="width:${size}px;height:${size}px;background:${name === 'Tu' ? '#489DFE' : AVC[hue(name)]};font-size:${Math.round(size * .37)}px">${esc(name[0])}</div>`;
  const ACCEPT_MS = 5000;   // dopo quanto «l'organizzatore» accetta una richiesta

  /* ---------- stato ---------- */
  const P = () => (S().parts = S().parts || {});                 // attività a cui partecipo: id → { status, msg, at, pre, post }
  const find = id => Match.find(id) || (S().userActs || []).find(a => a.id === id);
  const mineAct = id => (S().userActs || []).find(a => a.id === id);
  const chatOf = id => (S().chats = S().chats || {})[id] = (S().chats[id] || []);
  const members = x => {                                          // persone nel gruppo (finte + reali)
    if (x.mine) return [{ n: 'Tu', org: true }].concat(...(x.requests || []).filter(r => r.status === 'accepted').map(r => [{ n: r.name }].concat((r.friends || []).map(f => ({ n: f, friendOf: r.name })))));
    const k = Math.max(1, (x.joined || 3) - 1), off = x.title.length % POOL.length;
    const list = [{ n: x.who, org: true }].concat(Array.from({ length: k }, (_, i) => ({ n: POOL[(off + i) % POOL.length] })));
    const me = P()[x.id];
    if (me && ['accepted', 'toRate', 'archived'].includes(me.status)) { list.push({ n: 'Tu' }); (me.friends || []).forEach(f => list.push({ n: f.name, friendOf: 'Tu' })); }
    return list;
  };
  /* richieste finte per le attività create da chi prova il prototipo */
  function seedRequests(a) {
    if (a.requests && a.requests.length) return;
    a.requests = [
      { id: 'r1', name: 'Luca', msg: 'Ciao, mi piacerebbe unirmi: corro due volte a settimana.', aff: 88, status: 'new', at: Date.now() - 36e5 },
      { id: 'r2', name: 'Sara', msg: 'Posso unirmi? Vengo con un\'amica se c\'è posto.', aff: 71, status: 'new', at: Date.now() - 6e5, friends: ['Giorgia'] },
      { id: 'r3', name: 'Marco', msg: 'Ho iniziato da poco, spero di non rallentarvi!', aff: 46, status: 'new', at: Date.now() - 72e5 },
      { id: 'r4', name: 'Elena', msg: 'Sono nuova in città e vorrei conoscere gente.', aff: null, status: 'new', at: Date.now() - 18e5 }
    ];
    save();
  }
  window.seedRequests = seedRequests;
  const ago = t => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'ora' : m < 60 ? `${m} min fa` : m < 1440 ? `${Math.round(m / 60)} h fa` : `${Math.round(m / 1440)} g fa`; };
  const affLabel = v => v == null ? ['gr', 'Da valutare'] : v >= 80 ? ['ok', 'Molto affine'] : v >= 60 ? ['bl', 'Affine'] : ['at', 'Poco affine'];

  /* accettazione simulata: chi chiede di partecipare riceve risposta dopo pochi secondi (anche dopo un ricaricamento) */
  function tick() {
    let changed = false;
    Object.entries(P()).forEach(([id, p]) => {
      if (p.status === 'pending' && Date.now() - p.at >= ACCEPT_MS) {
        const x = find(id); if (!x) return;
        p.status = 'accepted'; changed = true;
        const c = chatOf(id);
        if (!c.length) c.push({ from: x.who, org: 1, t: `Benvenuto/a! Ci vediamo ${x.when ? x.when.toLowerCase().replace(' · ', ' alle ') : 'presto'} a ${x.place || x.city}.` },
          { from: POOL[1], t: 'Ciao a tutti! Qualcuno viene in metro?' });
        Store.notify({ t: `${x.who} ha accettato la tua richiesta`, s: `${x.title} · ${x.when || ''}`, kind: 'accept', ref: id });
        if (App.current) { App.toast(`${x.who} ha accettato la tua richiesta`); App.updateTop(); if (['myActs', 'partHub', 'notifs', 'actDetail'].includes(App.current.name)) App.refresh(); }
      }
    });
    if (changed) save();
  }
  setInterval(tick, 1000);
  window.Acts = { tick, find: id => find(id), members: x => members(x) };

  /* ---------- 1g · 1 · Chiedi di partecipare (con amici registrati) ---------- */
  let friends = [];
  const free = x => Math.max(0, (x.max || 6) - members(x).length - 1);    // posti liberi dopo di te
  const friendChips = x => friends.map((f, i) => `<span class="chip sm on" data-act="rmFriend" data-i="${i}">${esc(f.name.split(' ')[0])} ×</span>`).join('');
  let single = false;
  App.screen('joinReq', {
    top: 'main',
    render(p) {
      const x = find(p.id); friends = []; single = false;
      return {
        html: `<div class="title-card"><span class="chip sm" style="align-self:center">Fase di prenotazione</span>
            <div class="h1n" style="font-size:26px;line-height:32px">${esc(x.title)}</div><div class="b15">Organizzato da ${esc(x.who)} · ${esc(x.when || '')}</div></div>
          ${Sec.card({ id: 'target', icon: 'target', title: 'Per chi', sub: 'La community di riferimento',
            body: `<div class="b15">${esc(x.perChi || 'Tutti, anche chi viene da solo')} · ${esc(x.interest)}${x.intensity ? ' · intensità ' + x.intensity.toLowerCase() : ''}</div>` })}
          ${Sec.card({ id: 'friends', icon: 'users', title: 'Aggiungi amici', sub: `Chi porti con te? · ${free(x)} posti liberi`, open: true,
            body: `<div id="fchips" class="fbtags"></div>
              <div class="inp">${ic('search', { color: '#7B7B7C' })}<input class="bare" id="fq" placeholder="Nome o codice NIA-…" autocomplete="off"></div>
              <div id="fres" style="display:flex;flex-direction:column;gap:6px"></div>
              <div id="fsingle"></div>
              <div class="b13">Solo chi è registrato al test si può aggiungere.</div>` })}
          ${Sec.card({ id: 'msg', icon: 'chat', title: 'Messaggio per l\'organizzatore', sub: 'Nota facoltativa per ' + esc(x.who),
            body: `<textarea class="inp" id="jmsg" style="height:110px" placeholder="Ciao, mi piacerebbe…" maxlength="240"></textarea>` })}
          <div class="sub">${ic('star', { color: '#7B7B7C' })}<div class="b15">Prima e dopo l'attività ti chiederemo di valutarla. Riceverai una notifica quando ${esc(x.who)} risponde.</div></div>`,
        cta: `<div class="bookbar"><div class="btn" id="jgo" data-act="send">Invia richiesta</div><span class="price">Gratis</span></div>`
      };
    },
    mount(v, p) {
      const x = find(p.id), q = v.querySelector('#fq');
      q.addEventListener('input', () => search(x, q.value));
    },
    actions: {
      addFriend(el) {
        const x = find(App.current.p.id), u = DATA.users.find(u => u.code === el.dataset.c);
        if (friends.length >= free(x)) return App.toast('Non ci sono altri posti liberi');
        friends.push(u); const q = document.getElementById('fq'); q.value = ''; search(x, ''); App.buzz();
      },
      rmFriend(el) { friends.splice(+el.dataset.i, 1); search(find(App.current.p.id), document.getElementById('fq').value); },
      single(el) { single = !single; el.classList.toggle('on', single); },
      send() {
        const id = App.current.p.id, m = document.getElementById('jmsg').value.trim();
        P()[id] = { status: 'pending', msg: m, at: Date.now(), friends: friends.slice(), single: friends.length ? single : false }; save();
        App.back();                                   // si torna alla locandina dell'attività
        App.toast(friends.length ? `Richiesta inviata per te e ${friends.length} amic${friends.length > 1 ? 'i' : 'o'}${single ? ' · più quella singola' : ''}` : 'Richiesta inviata');
      }
    }
  });
  function search(x, q) {
    document.getElementById('fchips').innerHTML = friendChips(x);
    document.getElementById('fsingle').innerHTML = friends.length ? `<div class="sub" style="align-items:flex-start"><div class="tx"><div class="h3" style="font-size:16px">+ Candidatura singola</div>
      <div class="b15">Verranno inoltrate due richieste: una per l'intero gruppo e una singola, così da consentire anche un'eventuale selezione individuale.</div></div>
      <button class="toggle${single ? ' on' : ''}" data-act="single" aria-label="Candidatura singola"></button></div>` : '';
    const box = document.getElementById('fres'), s = q.trim().toLowerCase();
    if (s.length < 2) { box.innerHTML = ''; return; }
    const hits = DATA.users.filter(u => !friends.includes(u) && (u.name.toLowerCase().includes(s) || u.code.toLowerCase().includes(s))).slice(0, 4);
    box.innerHTML = hits.length ? hits.map(u => `<div class="rw fhit" data-act="addFriend" data-c="${u.code}">${av(u.name, 38)}<div class="tx"><div class="h3" style="font-size:16px">${esc(u.name)}</div><div class="b13">${u.code} · ${esc(u.city)}</div></div>${ic('plus', { size: 20, color: '#489DFE' })}</div>`).join('')
      : `<div class="b13" style="padding:4px 6px">Nessun utente registrato con questo nome o codice. Chiedi al tuo amico di iscriversi al test e di darti il suo codice.</div>`;
  }

  /* ---------- 1g · 2 · Le mie attività ---------- */
  const ST = { pending: ['at', 'In attesa'], accepted: ['ok', 'Accettata'], toRate: ['po', 'Da valutare'], archived: ['gr', 'Archiviata'], rejected: ['di', 'Rifiutata'] };
  App.screen('myActs', {
    top: 'main', nav: true, tab: 'profile',
    render(p) {
      tick();
      const seg = p.seg || 'part';
      const part = Object.entries(P()).filter(([, v]) => v.status !== 'archived' && v.status !== 'left').map(([id, v]) => ({ x: find(id), v })).filter(r => r.x);
      const org = (S().userActs || []).filter(a => !a.archived);
      const arch = Object.entries(P()).filter(([, v]) => v.status === 'archived').map(([id, v]) => ({ x: find(id), v, role: 'Partecipato' })).filter(r => r.x)
        .concat((S().userActs || []).filter(a => a.archived).map(a => ({ x: a, v: { status: 'archived' }, role: 'Organizzato' })));
      const row = (x, pill, go, sub) => `<div class="c2 tap" style="border-radius:25px;padding:12px" data-go="${go}" data-p='{"id":"${x.id}"}'><div class="rw">
        <div class="thumb" style="width:56px;height:56px;border-radius:25px;${actCover(x)};--h:${actHue(x.interest)}">${x.photo ? '' : esc(x.title[0])}</div>
        <div class="tx"><div class="h3">${esc(x.title)}</div><div class="b15">${esc(sub)}</div></div>${pill}</div></div>`;
      const empty = (t, cta, go) => `<div class="card" style="align-items:center;text-align:center;padding:26px 18px"><div class="h3">${t}</div><div class="btn sm" data-go="${go}">${cta}</div></div>`;
      let body;
      if (seg === 'part') body = part.length ? part.map(({ x, v }) => row(x, `<span class="pl ${ST[v.status][0]}">${ST[v.status][1]}</span>`, 'partHub', `${(x.when || '').split(' · ')[0]} · ${x.who}`)).join('') : empty('Non partecipi ancora a nulla', 'Trova un\'attività', 'explore');
      else if (seg === 'org') body = org.length ? org.map(a => { seedRequests(a); const n = a.requests.filter(r => r.status === 'new').length; return row(a, n ? `<span class="pl bl">${n} richieste</span>` : '<span class="pl ok">Attiva</span>', 'actHub', `${(a.when || '').split(' · ')[0]} · organizzi tu`); }).join('') : empty('Non hai ancora creato attività', 'Crea un\'attività', 'create');
      else body = arch.length ? arch.map(({ x, role }) => row(x, `<span class="pl gr">${role}</span>`, 'actDetail', 'Valutata e archiviata')).join('') : `<div class="card" style="align-items:center;text-align:center;padding:26px 18px"><div class="h3">Archivio vuoto</div><div class="b15">Le attività finite e valutate arrivano qui.</div></div>`;
      return `<div class="h1">Le mie attività</div>
        <div class="seg"><div class="${seg === 'part' ? 'on' : ''}" data-act="seg" data-s="part">Partecipo</div><div class="${seg === 'org' ? 'on' : ''}" data-act="seg" data-s="org">Organizzo</div><div class="${seg === 'arch' ? 'on' : ''}" data-act="seg" data-s="arch">Archivio</div></div>
        ${body}`;
    },
    actions: { seg(el) { App.current.p.seg = el.dataset.s; App.refresh(); } }
  });

  /* ---------- hub (organizzatore e partecipante) ---------- */
  const hubRow = (icn, t, s, right, attrs) => `<div class="card tap" style="padding:18px 16px" ${attrs || ''}><div class="rw"><div class="ico${icn[1] ? ' b' : ''}">${ic(icn[0], { color: icn[1] ? '#489DFE' : '#000' })}</div><div class="tx"><div class="h3">${t}</div><div class="b15">${s}</div></div>${right != null ? right : chev()}</div></div>`;
  const hero = x => `<div class="hero acover phi" style="height:340px;${actCover(x)}">${x.photo ? '' : `<span class="acover-i" style="font-size:150px">${esc(x.title[0])}</span>`}</div>`;
  const unread = id => { const c = chatOf(id), seen = (S().chatSeen || {})[id] || 0; return Math.max(0, c.length - seen); };

  /* 1f · 1 · Hub organizzatore */
  App.screen('actHub', {
    top: 'main', nav: true, tab: 'profile',
    render(p) {
      const a = mineAct(p.id); if (!a) return 'Attività non trovata';
      seedRequests(a);
      const nNew = a.requests.filter(r => r.status === 'new').length, mem = members(a).length, un = unread(a.id);
      return {
        hero: hero(a), cls: 'hero360',
        html: `<div class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="chip sm" style="background:#F5F5F7;border:0">${esc(a.when || '')}</span><span class="chip sm" style="background:#F5F5F7;border:0">☀ 15°</span></div>
            <div class="h1n">${esc(a.title)}</div><div class="b15">#${esc(a.code || '')} · organizzi tu</div></div>
          ${hubRow(['users', 1], 'Richieste', 'Chi vuole partecipare', nNew ? `<span class="pl bl">${nNew} nuov${nNew > 1 ? 'e' : 'a'}</span>` : chev(), `data-go="requests" data-p='{"id":"${a.id}"}'`)}
          ${hubRow(['chat'], 'Chat del gruppo', un ? `${un} nuovi messaggi` : 'Scrivi ai partecipanti', null, `data-go="chat" data-p='{"id":"${a.id}"}'`)}
          ${hubRow(['user'], 'Partecipanti', `${mem} su ${a.max} posti`, null, `data-go="participants" data-p='{"id":"${a.id}"}'`)}
          ${hubRow(['pencil'], 'Modifica attività', 'Titolo, luogo, posti, descrizione', null, `data-go="actEdit" data-p='{"id":"${a.id}"}'`)}
          ${hubRow(['check'], 'Chiudi e valuta', 'Valuta i partecipanti e archivia', null, `data-go="orgRate" data-p='{"id":"${a.id}"}'`)}`
      };
    }
  });

  /* 1f · 2 · Richieste */
  App.screen('requests', {
    top: 'main', nav: true, tab: 'profile',
    render(p) {
      const a = mineAct(p.id), sort = p.sort || 'aff';
      const rs = a.requests.slice().sort((x, y) => sort === 'aff' ? (y.aff == null ? -1 : y.aff) - (x.aff == null ? -1 : x.aff) : y.at - x.at);
      const open = rs.filter(r => r.status === 'new'), done = rs.filter(r => r.status !== 'new');
      /* «Più recenti» serve proprio a decidere senza l'affinità: lì non la mostriamo (neanche nel dettaglio) */
      const row = r => { const l = affLabel(r.aff); return `<div class="c2 tap" style="border-radius:25px;padding:14px" data-go="reqDetail" data-p='{"id":"${a.id}","rid":"${r.id}","blind":${sort === 'new' ? 1 : 0}}'><div class="rw">${av(r.name, 46)}
        <div class="tx"><div class="h3">${esc(r.name)}${(r.friends || []).length ? ` <span class="b13">+ ${r.friends.length} amic${r.friends.length > 1 ? 'i' : 'o'}</span>` : ''}</div><div class="b15" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">«${esc(r.msg)}»</div></div>
        ${r.status === 'new' ? (sort === 'new' ? `<span class="b13">${ago(r.at)}</span>` : `<span class="pl ${l[0]}">${l[1]}</span>`) : `<span class="pl ${r.status === 'accepted' ? 'ok' : 'di'}">${r.status === 'accepted' ? 'Accettata' : 'Rifiutata'}</span>`}</div></div>`; };
      return `<div class="h1">Richieste</div>
        <div class="seg"><div class="${sort === 'aff' ? 'on' : ''}" data-act="sort" data-s="aff">Affinità</div><div class="${sort === 'new' ? 'on' : ''}" data-act="sort" data-s="new">Più recenti</div></div>
        ${sort === 'new' ? '<div class="b13" style="padding:0 6px">In ordine di arrivo, senza indicazioni di affinità: decidi tu.</div>' : ''}
        ${open.length ? open.map(row).join('') : '<div class="card" style="align-items:center;text-align:center;padding:22px"><div class="h3">Nessuna nuova richiesta</div></div>'}
        ${done.length ? `<div class="lab">Già gestite</div>${done.map(row).join('')}` : ''}`;
    },
    actions: { sort(el) { App.current.p.sort = el.dataset.s; App.refresh(); } }
  });

  /* 1f · 3 · Dettaglio richiesta */
  App.screen('reqDetail', {
    top: 'main', nav: true, tab: 'profile',
    render(p) {
      const a = mineAct(p.id), r = a.requests.find(x => x.id === p.rid), l = affLabel(r.aff), comp = r.aff == null ? 55 : Math.min(96, r.aff + 4);
      return {
        html: `<div class="h1">${esc(r.name)}</div>
          <div class="card"><div style="display:flex;flex-direction:column;align-items:center;gap:8px">${av(r.name, 88)}<div class="h2">${esc(r.name)}</div>${p.blind ? `<span class="b13">Richiesta ${ago(r.at)}</span>` : `<span class="pl ${l[0]}">${r.aff == null ? 'Affinità da calcolare: questionario incompleto' : l[1] + ' a questa attività'}</span>`}</div></div>
          ${Sec.card({ id: 'prof', icon: 'user', title: 'Vedi profilo', sub: 'Affidabilità nelle attività precedenti', open: true, body: Fb.partCard(r.name) })}
          <div class="card"><div class="b15">MESSAGGIO DI RICHIESTA</div><div class="b17" style="color:#000">${r.msg ? '«' + esc(r.msg) + '»' : '<span style="color:#7B7B7C">Nessun messaggio</span>'}</div></div>
          ${(r.friends || []).length ? `<div class="card"><div class="b15">VIENE CON</div>${r.friends.map(f => `<div class="rw">${av(f, 36)}<div class="h3" style="font-size:16px">${esc(f)}</div></div>`).join('')}<div class="b13">Accettando, entrano nel gruppo anche loro (${1 + r.friends.length} posti).</div></div>` : ''}
          ${p.blind ? '' : `<div class="card"><div class="b15">COMPATIBILITÀ CON IL GRUPPO</div><div class="tone"><div class="mk" style="left:${comp}%;background:#fff;border:3px solid #123F73"></div></div>
            <div style="display:flex;justify-content:space-between" class="b15"><span>Lontano</span><span>Molto vicino</span></div></div>`}
          ${r.status !== 'new' ? `<div class="gy"><div class="b15">Richiesta ${r.status === 'accepted' ? 'accettata' : 'rifiutata'}.</div></div>` : ''}`,
        cta: r.status === 'new' ? `<div style="display:flex;gap:8px"><div class="btn s" style="flex:1" data-act="decide" data-v="rejected">Rifiuta</div><div class="btn" style="flex:1" data-act="decide" data-v="accepted">Accetta</div></div>` : ''
      };
    },
    actions: {
      decide(el) {
        const p = App.current.p, a = mineAct(p.id), r = a.requests.find(x => x.id === p.rid), ok = el.dataset.v === 'accepted';
        if (ok && members(a).length + 1 + (r.friends || []).length > a.max) return App.toast('Posti insufficienti: aumenta i posti da «Modifica»');
        r.status = el.dataset.v;
        if (ok) { a.joined = members(a).length; chatOf(a.id).push({ sys: 1, t: `${r.name} si è unito/a al gruppo` }, { from: r.name, t: 'Grazie per avermi accettato/a! 🙌' }); }
        save(); App.toast(ok ? `${r.name} è nel gruppo` : `Richiesta di ${r.name} rifiutata`); App.back();
      }
    }
  });

  /* 1f · 4 / 1g · 4 · Chat di gruppo */
  const REPLIES = ['Perfetto 👍', 'Ci sono!', 'Io arrivo 10 minuti prima', 'Se piove cosa facciamo?', 'Porto io qualcosa da bere', 'Non vedo l\'ora'];
  App.screen('chat', {
    top: (p, t) => t.back + `<span class="gl">${ic('users', { size: 18 })}${members(find(p.id)).length}</span>`,
    render(p) {
      const x = find(p.id), c = chatOf(p.id);
      if (!c.length && x.mine) c.push({ sys: 1, t: 'Hai creato il gruppo. Scrivi un messaggio di benvenuto!' });
      (S().chatSeen = S().chatSeen || {})[p.id] = c.length; save();
      const org = x.mine ? 'organizzi tu' : `${x.who} organizza`;
      return {
        html: `<div class="h1" style="font-size:28px;line-height:36px">${esc(x.title)}</div><div class="b15" style="padding:0 4px;margin-top:-6px">Chat del gruppo · ${org}</div>
          <div class="b13" style="text-align:center">Oggi</div>
          <div id="msgs" style="display:flex;flex-direction:column;gap:8px;width:100%">${c.map(msgHtml(x)).join('')}</div>`,
        cta: `<div style="display:flex;gap:8px;align-items:center"><input class="inp" id="cin" style="flex:1;border-radius:100px" placeholder="Scrivi al gruppo…"><button class="csend" data-act="send" aria-label="Invia">${ic('send', { color: '#fff' })}</button></div>`
      };
    },
    mount(v) {
      v.scrollTop = v.scrollHeight;
      document.getElementById('cin').addEventListener('keydown', e => { if (e.key === 'Enter') App.screens.chat.actions.send(); });
    },
    actions: {
      send() {
        const p = App.current.p, x = find(p.id), i = document.getElementById('cin'), t = i.value.trim(); if (!t) return;
        const c = chatOf(p.id); c.push({ me: 1, t }); i.value = ''; save(); paint(x);
        const others = members(x).filter(m => m.n !== 'Tu');
        if (others.length) App.later(() => { const m = others[c.length % others.length]; c.push({ from: m.n, org: m.org ? 1 : 0, t: REPLIES[c.length % REPLIES.length] }); save(); paint(x); App.buzz(); }, 1600);
      }
    }
  });
  const msgHtml = x => m => m.sys ? `<div class="b13" style="text-align:center;padding:4px 0">${esc(m.t)}</div>`
    : m.me ? `<div class="msg me">${esc(m.t)}</div>`
    : `<div class="msg in"><div class="b13" style="color:${m.org ? '#489DFE' : AVC[hue(m.from)]}">${esc(m.from)}${m.org ? ' · organizza' : ''}</div>${esc(m.t)}</div>`;
  function paint(x) {
    const b = document.getElementById('msgs'); if (!b) return;
    b.innerHTML = chatOf(x.id).map(msgHtml(x)).join('');
    (S().chatSeen = S().chatSeen || {})[x.id] = chatOf(x.id).length; save();
    const v = document.getElementById('view'); v.scrollTo({ top: v.scrollHeight, behavior: 'smooth' });
  }

  /* 1f · 5 · Partecipanti */
  App.screen('participants', {
    top: 'main', nav: true, tab: 'profile',
    render(p) {
      const x = find(p.id), ms = members(x);
      return `<div class="h1">Partecipanti</div>
        <div class="card">${ms.map((m, i) => `${i ? '<div class="sep"></div>' : ''}<div class="rw">${av(m.n, 46, i)}<div class="tx"><div class="h3">${esc(m.n)}</div>${m.friendOf ? `<div class="b13">${m.friendOf === 'Tu' ? 'Viene con te' : 'Viene con ' + esc(m.friendOf)}</div>` : ''}</div>${m.org ? '<span class="pl bl">Organizza</span>' : ''}</div>`).join('')}</div>
        <div class="b15" style="padding:0 6px">${ms.length} su ${x.max || 6} posti</div>
        <div class="b13" style="padding:0 6px">Nel test i nomi sono visibili per verificare quanto l'abbinamento tra persone sia affidabile.</div>`;
    }
  });

  /* modifica attività (organizzatore) */
  App.screen('actEdit', {
    top: 'main',
    render(p) {
      const a = mineAct(p.id);
      return {
        html: `<div class="h1">Modifica attività</div>
          <label class="field"><span class="b13" style="padding:0 8px">Titolo</span><input class="inp" id="eTitle" value="${esc(a.title)}" maxlength="48"></label>
          <label class="field"><span class="b13" style="padding:0 8px">Luogo</span><input class="inp" id="ePlace" value="${esc(a.place)}"></label>
          <div class="inp" style="justify-content:space-between"><span style="flex:1;color:#7B7B7C">Max persone</span><button class="stp" data-act="max" data-d="-1">−</button><b id="eMax" style="min-width:26px;text-align:center;color:#000">${a.max}</b><button class="stp" data-act="max" data-d="1">+</button></div>
          <label class="field"><span class="b13" style="padding:0 8px">Descrizione</span><textarea class="nbox desc" id="eDesc">${esc(a.desc)}</textarea></label>
          <div class="b13" style="padding:0 6px">Chi partecipa riceve un messaggio in chat con le modifiche.</div>`,
        cta: `<div class="btn" data-act="save">Salva modifiche</div>`
      };
    },
    actions: {
      max(el) { const a = mineAct(App.current.p.id); a.max = Math.max(members(a).length, Math.min(30, a.max + +el.dataset.d)); document.getElementById('eMax').textContent = a.max; },
      save() {
        const a = mineAct(App.current.p.id), v = id => document.getElementById(id).value.trim();
        a.title = v('eTitle') || a.title; a.place = v('ePlace') || a.place; a.desc = v('eDesc') || a.desc;
        chatOf(a.id).push({ sys: 1, t: 'L\'organizzatore ha aggiornato i dettagli dell\'attività' }); save(); App.toast('Modifiche salvate'); App.back();
      }
    }
  });

  /* ---------- 1g · 3 · Attività a cui partecipo ---------- */
  App.screen('partHub', {
    top: 'main', nav: true, tab: 'profile',
    render(p) {
      tick();
      const x = find(p.id), st = P()[p.id]; if (!x || !st) return 'Attività non trovata';
      const ms = members(x).length, un = unread(x.id), pending = st.status === 'pending';
      const rates = (st.pre ? 1 : 0) + (st.post ? 1 : 0);
      return {
        hero: hero(x), cls: 'hero360',
        html: `<div class="card" style="padding:16px"><div style="display:flex;justify-content:space-between;align-items:center"><span class="chip sm" style="background:#F5F5F7;border:0">${esc(x.when || x.date || '')}</span><span class="pl ${ST[st.status][0]}">${ST[st.status][1]}</span></div>
            <div class="h1n">${esc(x.title)}</div><div class="b15">Organizza ${esc(x.who)} · ${ms} partecipanti</div></div>
          ${pending ? `<div class="card" style="gap:10px"><div class="rw"><div class="ndots"><i></i><i></i><i></i></div><div class="tx"><div class="h3">In attesa di ${esc(x.who)}</div><div class="b15">Ti avvisiamo appena risponde.</div></div></div>
              ${st.msg ? `<div class="gy"><div class="b15">Il tuo messaggio: «${esc(st.msg)}»</div></div>` : ''}</div>`
            : hubRow(['chat'], 'Chat del gruppo', un ? `${un} nuovi messaggi` : 'Scrivi al gruppo', un ? `<span class="pl bl">${un}</span>` : null, `data-go="chat" data-p='{"id":"${x.id}"}'`)}
          ${hubRow(['users'], 'Partecipanti', `${ms} persone`, null, `data-go="participants" data-p='{"id":"${x.id}"}'`)}
          ${hubRow(['pin'], 'Dettagli e luogo', x.place || x.city, null, `data-go="actInfo" data-p='{"id":"${x.id}"}'`)}
          ${pending ? '' : hubRow(['star'], 'Valutazione prima e dopo', !st.pre ? 'Valuta prima di partecipare' : !st.post ? 'Prima fatta · dopo a fine attività' : 'Completata', `<span class="pl ${rates === 2 ? 'ok' : rates ? 'bl' : 'at'}">${rates}/2</span>`,
            `data-go="${st.pre ? 'hostRate' : 'preRate'}" data-p='{"id":"${x.id}"}'`)}
          ${hubRow(['logout'], pending ? 'Annulla la richiesta' : 'Esci dall\'attività', '', null, 'data-act="leave"')}`
      };
    },
    actions: {
      leave() {
        App.pop(`<div class="h2">Vuoi uscire?</div><div class="b17">Lasci il gruppo e la chat. Potrai chiedere di nuovo di partecipare.</div>
          <div style="display:flex;gap:8px"><div class="btn g" style="flex:1" data-act="closeOv">Annulla</div><div class="btn" style="flex:1;background:#D63D2D" data-act="doLeave">Esci</div></div>`);
      },
      doLeave() { delete P()[App.current.p.id]; save(); App.closeOv(); App.toast('Sei uscito/a dall\'attività'); App.back(); }
    }
  });

  /* ---------- 1g · 5 · Valutazione prima ---------- */
  let pv = 0;
  App.screen('preRate', {
    top: 'main',
    render(p) {
      const x = find(p.id), st = P()[p.id]; pv = st.pre || 0;
      return {
        html: `<div class="h1">Prima di partecipare</div>
          <div class="c2"><div class="rw"><div class="thumb big" style="${actCover(x)};--h:${actHue(x.interest)}">${x.photo ? '' : esc(x.title[0])}</div><div class="tx"><div class="h3">${esc(x.title)}</div><div class="b15">Attività e persone</div></div></div></div>
          <div class="card"><div class="h3">Quanto ti sembra adatta a te, con queste persone?</div>${Rate.scale('pre', pv)}
            <div class="link" style="text-align:center" data-go="rateDeep" data-p='${esc(JSON.stringify({ id: x.id, item: { id: x.id + ':prima', title: x.title + ' · prima', type: 'community', interest: x.interest } }))}'>Valutazione approfondita</div></div>
          <div class="b13" style="text-align:center">Dopo l'attività ti chiederemo com'è andata.</div>`,
        cta: `<div class="btn${pv ? '' : ' hide'}" id="preGo" data-act="send">Salva · +${DATA.ratingPts} punti</div>`
      };
    },
    actions: {
      pick5(el) { if (el.dataset.n === 'quick') return App.actions.pick5(el); pv = +el.dataset.v; Rate.paint('pre', pv); App.buzz(); document.getElementById('preGo').classList.remove('hide'); },
      send() {
        const p = App.current.p, x = find(p.id); if (!pv) return;
        P()[p.id].pre = pv; save();
        Rate.save({ id: x.id + ':prima', title: x.title + ' · prima', type: 'community', rank: x.rank, aff: x.aff }, pv);
        App.back();
      }
    }
  });

  /* ---------- 1g · 6 · Chiusura e valutazione finale (organizzatore e partecipanti) ---------- */
  const FQ = ['È stata soddisfacente?', 'Era davvero affine a te?', 'Rispecchiava la descrizione?'];
  let fv = [];
  App.screen('finalRate', {
    top: 'main',
    render(p) {
      const x = find(p.id); fv = [0, 0, 0];
      return {
        html: `<div class="h1">Com'è andata?</div><div class="b17" style="padding:0 4px;margin-top:-6px">Valutazione finale · ${esc(x.title)}</div>
          <div class="card" style="gap:18px">${FQ.map((q, i) => `<div style="width:100%;display:flex;flex-direction:column;gap:8px"><div class="h3" style="font-size:16px">${p.role === 'org' && i === 1 ? 'Il gruppo era affine all\'attività?' : q}</div>${Rate.scale('f' + i, 0, 'No', 'Molto')}</div>`).join('')}</div>
          <div class="btn s" data-go="rateDeep" data-p='${esc(JSON.stringify({ id: x.id, item: { id: x.id + ':dopo', title: x.title + ' · dopo', type: 'community', interest: x.interest } }))}'>Valutazione approfondita</div>
          <div class="b13" style="padding:0 6px">Valutano organizzatore e partecipanti; poi l'attività passa in Archivio.</div>`,
        cta: `<div class="btn off" id="finGo" data-act="send">Invia e archivia · +${DATA.ratingPts} punti</div>`
      };
    },
    actions: {
      pick5(el) {
        if (el.dataset.n === 'quick') return App.actions.pick5(el);
        fv[+el.dataset.n.slice(1)] = +el.dataset.v; Rate.paint(el.dataset.n, +el.dataset.v); App.buzz();
        document.getElementById('finGo').classList.toggle('off', fv.some(v => !v));
      },
      send() {
        const p = App.current.p, x = find(p.id); if (fv.some(v => !v)) return;
        Rate.save({ id: x.id + ':dopo', title: x.title + ' · dopo', type: 'community', rank: x.rank, aff: x.aff }, fv[0], { likert: fv.slice() });
        if (p.role === 'org') { mineAct(x.id).archived = true; }
        else {
          const st = P()[x.id]; st.post = fv.slice(); st.status = 'archived';
          if (Store.completeTask('partecipa')) { App.toast('+' + DATA.tasks.find(t => t.id === 'partecipa').pts + ' punti · task «Partecipa» completato'); Store.notify({ t: 'Task completato: partecipa a un\'attività', s: 'Nuovo pezzo del biglietto', kind: 'tasks' }); }
        }
        save(); App.reset(['home', { name: 'myActs', p: { seg: 'arch' } }]);
      }
    }
  });

  /* ---------- Dettagli e luogo (per chi partecipa) ---------- */
  App.screen('actInfo', {
    top: 'main', nav: true, tab: 'profile',
    render(p) {
      const x = find(p.id), addr = x.place || x.city, q = encodeURIComponent(addr);
      const dates = x.dates && x.dates.length ? x.dates : [{ title: x.date || x.when, sub: 'Data dell\'incontro' }];
      return `<div class="h1">Dettagli e luogo</div>
        <div class="card" style="padding:0;overflow:hidden;gap:0">
          <div class="fmap"><i class="road r1"></i><i class="road r2"></i><i class="road r3"></i><i class="park"></i><div class="mpin">${ic('pin', { size: 30, color: '#fff', fill: '#489DFE' })}</div></div>
          <div style="padding:16px;display:flex;flex-direction:column;gap:10px"><div class="tx"><div class="h3">${esc(addr)}</div><div class="b15">${esc(x.city || '')}</div></div>
            <div style="display:flex;gap:8px"><a class="btn sm" style="flex:1;text-decoration:none" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">${ic('pin', { size: 18, color: '#fff' })}Apri in Mappe</a>
              <div class="btn sm s" style="flex:1" data-act="copyAddr">${ic('copy', { size: 18 })}Copia indirizzo</div></div></div></div>
        <div class="card"><div class="b15" style="text-transform:uppercase;letter-spacing:.4px">Quando</div>
          ${dates.map((d, i) => `${i ? '<div class="sep"></div>' : ''}<div class="rw">${ic('calendar', { size: 20 })}<div class="tx"><div class="h3" style="font-size:15px">${esc(d.title)}</div><div class="b13">${esc(d.sub || '')}</div></div></div>`).join('')}</div>
        <div class="card"><div class="b15" style="text-transform:uppercase;letter-spacing:.4px">Cosa sapere</div><div class="b17" style="white-space:pre-line;color:#000">${esc(x.desc || '')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${[x.intensity ? 'Intensità ' + x.intensity.toLowerCase() : '', `${x.max || 6} posti`, x.interest].filter(Boolean).map(c => `<span class="chip sm">${esc(c)}</span>`).join('')}</div></div>
        <div class="card tap" data-go="chat" data-p='{"id":"${x.id}"}' style="padding:16px"><div class="rw"><div class="ico b">${ic('chat', { color: '#489DFE' })}</div><div class="tx"><div class="h3">Domande?</div><div class="b15">Scrivi a ${esc(x.who)} nella chat del gruppo</div></div>${chev()}</div></div>`;
    },
    actions: { copyAddr() { const x = find(App.current.p.id); try { navigator.clipboard.writeText(x.place || x.city); } catch (e) { } App.toast('Indirizzo copiato'); } }
  });

  /* dati demo per le attività (usati da «Riempi dati demo») */
  window.seedActsDemo = () => {
    const ps = P();
    if (!ps.c2) ps.c2 = { status: 'pending', msg: 'Ciao! Gioco a burraco da anni, posso unirmi?', at: Date.now() };
    if (!ps.c3) { ps.c3 = { status: 'accepted', msg: 'Ci sono!', at: Date.now() - 864e5, pre: 4 }; chatOf('c3').push({ from: 'Chiara', org: 1, t: 'Treno delle 8:43 da Cadorna, carrozza di testa!' }, { me: 1, t: 'Perfetto, porto io l\'acqua' }, { from: 'Luca', t: 'Io arrivo in bici, ci siamo' }); }
    save();
  };
})();
