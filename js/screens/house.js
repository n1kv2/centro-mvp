/* 1d · Match · la mia casa: gruppo (non è una chat) → match della casa / con un coinquilino → mappa dei temi → tema singolo (slider) → interessi in comune.
   Tre stati soltanto: Affini (verde), Attenzione (giallo), Distanti (rosso). Fuori dal dettaglio solo il pallino colorato, senza parole.
   Le percentuali compaiono solo nel riepilogo. */
(function () {
  const S = () => Store.s, esc = App.esc, save = () => Store.save();
  const H = () => (S().house = S().house || { name: 'La nostra casa', members: [] });
  const AVC = ['#6FD7E1', '#F5A25D', '#BA7BE0', '#8194FF', '#7BD389', '#F27BA0'];
  const first = n => n.split(' ')[0];
  const av = (name, size, i) => `<div class="av" style="width:${size}px;height:${size}px;background:${name === 'Tu' || i < 0 ? '#9971E4' : AVC[i % AVC.length]};font-size:${Math.round(size * .37)}px">${esc(name[0])}</div>`;
  const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const chev = () => ic('chev', { size: 16, color: '#CCD2D9', sw: 2 });

  /* Profili: i tuoi dal questionario; quelli dei coinquilini (finti) sono profili propri, indipendenti dai tuoi
     e sempre uguali per lo stesso codice (generatore pseudo-casuale con seme = codice). */
  const a = c => S().answers[c] || 3, pos5 = v => 10 + (v - 1) * 20;
  function rng(seed) { let x = hash(seed + '·centro'); return () => { x = x + 0x6D2B79F5 | 0; let t = Math.imul(x ^ x >>> 15, 1 | x); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function mine() {
    return { PR: pos5(a('PR1')), OB: pos5(a('OB1')), CS: pos5(a('CS2')), VO: pos5(a('VO3')), OS: pos5(a('OS3')),
      VC: pos5(a('SA2')) * .8 + 10, CM: pos5(a('E1')) * .8 + 12, FR: 100 - pos5(a('C1')) * .9,
      smoke: { fuma: (S().answers.FU1 || 1) - 1, accetta: (S().answers.FU2 || 2) - 1 } };
  }
  const cache = {};
  function theirs(m) {
    if (cache[m.code]) return cache[m.code];
    const r = rng(m.code), o = {};
    DATA.themes.forEach(t => { if (!t.cat) o[t.k] = Math.round(10 + (r() + r() + r()) / 3 * 80); });   // le persone si addensano verso il centro
    const f = r(), ac = r();
    o.smoke = { fuma: f < .65 ? 0 : f < .88 ? 1 : 2, accetta: ac < .35 ? 0 : ac < .85 ? 1 : 2 };
    return (cache[m.code] = o);
  }
  /* fumo: vincolo secco. Distanti se uno fuma in casa e l'altro non lo accetta; Attenzione se fuma fuori e l'altro vuole una casa senza fumo */
  const FUMA = ['Non fuma', 'Fuma solo fuori', 'Fuma anche in casa'], ACC = ['Casa senza fumo', 'Ok fuori casa', 'Ok anche in casa'];
  const smokePair = (x, y) => { const one = (p, q) => p.fuma === 2 && q.accetta < 2 ? 2 : p.fuma === 1 && q.accetta === 0 ? 1 : 0; return Math.max(one(x, y), one(y, x)); };

  const status = d => d < 20 ? 'ok' : d < 40 ? 'at' : 'di';
  const SL = { ok: 'Affini', at: 'Attenzione', di: 'Distanti' };
  const dot = k => `<i class="sdot ${k}" aria-label="${SL[k]}"></i>`;
  const ADVICE = { ok: 'Le vostre abitudini si somigliano: qui la convivenza parte facile.', at: 'Abitudini un po\' diverse: chiarite aspettative e confini prima di decidere.', di: 'Qui siete lontani: è il tema su cui il dialogo conta di più.' };
  function themeState(t, sel) {
    const mm = H().members.filter(m => sel === 'all' || m.code === sel);
    if (t.cat) {
      const me = mine().smoke, ms = mm.map(m => { const sm = theirs(m).smoke, c = smokePair(me, sm); return { m, sm, c, k: ['ok', 'at', 'di'][c] }; });
      const c = ms.length ? Math.max(...ms.map(x => x.c)) : 0;
      return { cat: true, d: c * 30, k: ['ok', 'at', 'di'][c], me, ms };
    }
    const me = mine()[t.k], ms = mm.map(m => ({ m, v: theirs(m)[t.k], k: status(Math.abs(theirs(m)[t.k] - me)) }));
    const d = ms.length ? Math.max(...ms.map(x => Math.abs(x.v - me))) : 0;
    return { d, k: status(d), me, ms };
  }
  const smokeConflict = m => smokePair(mine().smoke, theirs(m).smoke) === 2;
  /* compatibilità: media delle distanze sui temi a scala; un conflitto sul fumo in casa la limita (vincolo non negoziabile) */
  const compat = m => {
    const me = mine(), o = theirs(m), ts = DATA.themes.filter(t => !t.cat);
    let v = Math.round(Math.max(25, Math.min(96, 100 - ts.reduce((s, t) => s + Math.abs(me[t.k] - o[t.k]), 0) / ts.length * 1.3)));
    const sp = smokePair(me.smoke, o.smoke); if (sp === 2) v = Math.min(v, 45); else if (sp === 1) v -= 6;
    return v;
  };
  const style = v => v >= 82 ? ['Sintonia naturale', 'Ritmi e abitudini si somigliano quasi ovunque.'] : v >= 68 ? ['Integrazione creativa', 'Sfumature diverse, ma i ritmi coincidono dove conta.']
    : v >= 55 ? ['Equilibrio da costruire', 'Alcuni temi vi avvicinano, altri vi dividono.'] : ['Convivenza da negoziare', 'Molte differenze: parlatene prima di decidere.'];
  const pctColor = v => v >= 75 ? '#6ABD3D' : v >= 60 ? '#E9A62B' : '#F55F4F';
  const bigRing = (v, size) => { size = size || 116; const sw = 10, r = size / 2 - sw / 2, C = 2 * Math.PI * r;
    return `<div class="bring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#EEF0F4" stroke-width="${sw}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${pctColor(v)}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C * v / 100} ${C}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>
      <div><b style="font-size:${size > 90 ? 28 : 18}px">${v}%</b>${size > 90 ? '<span>affinità</span>' : ''}</div></div>`; };
  const legend = () => `<div class="legend">${['ok', 'at', 'di'].map(k => `<span>${dot(k)}${SL[k]}</span>`).join('')}</div>`;

  /* selettore: la casa o un coinquilino, come una fila di avatar */
  const whoSel = sel => `<div class="who">${[{ c: 'all', n: 'Casa' }].concat(H().members.map(m => ({ c: m.code, n: first(m.name) }))).map((x, i) => `<button class="whoi${sel === x.c ? ' on' : ''}" data-act="sel" data-c="${x.c}">
      <span class="whoc" style="background:${x.c === 'all' ? '#E4F1FF' : AVC[(i - 1) % AVC.length]}">${x.c === 'all' ? ic('house', { size: 22, color: '#489DFE' }) : esc(x.n[0])}</span><span class="whon">${esc(x.n)}</span></button>`).join('')}</div>`;
  const selAct = { sel(el) { App.current.p.sel = el.dataset.c; App.current.p.k = null; App.refresh(); } };
  const linkCard = (go, p, icn, t, s) => `<div class="card tap" style="padding:16px" data-go="${go}" data-p='${JSON.stringify(p)}'><div class="rw"><div class="ico b">${ic(icn, { color: '#489DFE' })}</div><div class="tx"><div class="h3">${t}</div><div class="b15">${s}</div></div>${chev()}</div></div>`;

  /* mappa dei temi: righe = temi, colonne = coinquilini, un pallino per incrocio; ogni riga apre il tema */
  function themeMap(sel) {
    const ms = H().members.filter(m => sel === 'all' || m.code === sel);
    return `<div class="tmap" style="--n:${ms.length}"><div class="tmap-h"><span class="b13" style="justify-content:flex-start">Tocca un tema per i dettagli</span>${ms.map(m => `<span>${av(m.name, 26, H().members.indexOf(m))}</span>`).join('')}<span></span></div>
      ${DATA.themes.map((t, i) => { const s = themeState(t, sel); return `<div class="tmap-r tpill" data-go="matchTheme" data-p='{"i":${i},"sel":"${sel}"}' role="button"><span class="tmap-n">${t.name}</span>${s.ms.map(x => `<span>${dot(x.k)}</span>`).join('')}<span>${chev()}</span></div>`; }).join('')}</div>`;
  }

  /* rating box comune (Invia compare dopo aver scelto un numero) */
  let mv = 0;
  const rateBox = (id, title, q) => {
    const r = Rate.get(id); mv = r ? r.v : 0;
    return `<div class="card"><div class="h3">${q}</div>${Rate.scale('m', mv)}
      <div class="btn${mv && !r ? '' : ' hide'}" style="height:46px" id="mGo" data-act="mSend" data-id="${id}" data-t="${esc(title)}">${r ? 'Aggiorna' : 'Invia'}</div>
      ${r ? `<div class="b13" style="text-align:center">Hai votato ${r.v}/5. Tocca un numero per cambiare.</div>` : ''}
      <div class="link" style="text-align:center" data-go="rateDeep" data-p='${esc(JSON.stringify({ id, item: { id, title, type: 'casa', kind: 'Match' } }))}'>Valutazione approfondita</div></div>`;
  };
  const rateActions = {
    pick5(el) { if (el.dataset.n === 'quick') return App.actions.pick5(el); mv = +el.dataset.v; Rate.paint('m', mv); App.buzz(); document.getElementById('mGo').classList.remove('hide'); },
    mSend(el) {
      if (!mv) return;
      Rate.save({ id: el.dataset.id, title: el.dataset.t, type: 'casa', kind: 'Match' }, mv);
      if (Store.completeTask('casa_val')) { App.toast('+' + DATA.tasks.find(t => t.id === 'casa_val').pts + ' punti · task «Valuta il match» completato'); App.updateTop(); }
      App.refresh();
    }
  };

  /* ---------- 1 · 2 · Gruppo ---------- */
  App.screen('match', {
    top: 'main', nav: true,
    render() {
      const h = H(), ms = h.members;
      return {
        html: `<div class="h1 tap-row" data-act="rename">${esc(h.name)} ${ic('pencil', { size: 18, color: '#9AA8BE' })}</div>
          <div class="b15" style="padding:0 4px;margin-top:-6px">Tocca il nome per rinominarla</div>
          ${ms.length ? `<div class="card"><div class="h3">Coinquilini · ${ms.length}</div>${ms.map((m, i) => `${i ? '<div class="sep"></div>' : ''}<div class="rw">${av(m.name, 46, i)}<div class="tx"><div class="h3">${esc(first(m.name))}</div><div class="b13">${m.code}</div></div>
              <button class="ico" style="width:36px;height:36px" data-act="rm" data-c="${m.code}" aria-label="Rimuovi">${ic('close', { size: 16 })}</button></div>`).join('')}</div>`
            : `<div class="card"><div style="align-self:center;width:84px;height:84px;border-radius:50%;border:2px dashed #CCD2D9;display:flex;align-items:center;justify-content:center">${ic('users', { size: 32, color: '#9AA8BE' })}</div>
              <div class="h3" style="text-align:center">Aggiungi i tuoi coinquilini</div><div class="b15" style="text-align:center">Inserisci il loro codice utente. Devono avere un profilo e aver completato il questionario.</div></div>`}
          <div class="field" id="addF"><div style="display:flex;gap:8px;width:100%"><input class="inp" id="hcode" style="flex:1;text-transform:uppercase;letter-spacing:1px" placeholder="NIA-_____" maxlength="9" autocomplete="off">
            <div class="btn${ms.length ? ' s' : ''}" style="width:auto;padding:0 20px" data-act="add">${ms.length ? '+' : 'Aggiungi'}</div></div><span class="ferr" id="herr"></span></div>
          <button class="link" data-act="demoCode" style="align-self:flex-start;padding:2px 6px">Nessun codice a portata? Usa un coinquilino di prova</button>
          <div class="b13" style="padding:0 6px">Il gruppo compare anche nell'area Match di ogni coinquilino. Non è una chat.</div>`,
        cta: ms.length ? `<div class="btn" data-act="see">Vedi il match della casa</div>` : ''
      };
    },
    mount(v) { const i = v.querySelector('#hcode'); i.addEventListener('keydown', e => { if (e.key === 'Enter') App.screens.match.actions.add(); }); i.addEventListener('input', () => document.getElementById('addF').classList.remove('bad')); },
    actions: {
      add() {
        const i = document.getElementById('hcode'); let c = i.value.trim().toUpperCase().replace(/\s/g, ''); if (!c) return;
        if (!c.startsWith('NIA-')) c = 'NIA-' + c.replace(/^NIA/, '');
        const err = t => { document.getElementById('herr').textContent = t; document.getElementById('addF').classList.add('bad'); App.buzz(30); };
        if (c === S().code) return err('Questo è il tuo codice.');
        if (H().members.some(m => m.code === c)) return err('È già nel gruppo.');
        const u = DATA.users.find(u => u.code === c);
        if (!u) return err('Nessun utente registrato con questo codice.');
        if (u.noQuiz) return err(`${first(u.name)} non ha ancora completato il questionario.`);
        if (H().members.length >= 5) return err('Massimo 5 coinquilini.');
        H().members.push({ name: u.name, code: u.code }); save(); App.toast(`${first(u.name)} aggiunto/a alla casa`); App.refresh();
      },
      demoCode() { const u = DATA.users.find(u => !u.noQuiz && !H().members.some(m => m.code === u.code)); if (u) { document.getElementById('hcode').value = u.code; App.screens.match.actions.add(); } },
      rm(el) { H().members = H().members.filter(m => m.code !== el.dataset.c); save(); App.refresh(); },
      rename() {
        App.sheet(`<div class="h2" style="padding:4px 4px 0">Nome della casa</div><input class="inp" id="hname" value="${esc(H().name)}" maxlength="28"><div class="btn" data-act="saveName">Salva</div>`);
        App.actions.saveName = () => { const v = document.getElementById('hname').value.trim(); if (v) { H().name = v; save(); } App.closeOv(); App.refresh(); };
      },
      see() { const pts = Store.completeTask('casa'); if (pts) { App.toast(`+${pts} punti · task «Crea il match della casa» completato`); App.updateTop(); } App.go('matchHouse', { sel: 'all' }); }
    }
  });

  /* ---------- 3 · 4 · Match della casa / con un coinquilino ---------- */

  /* ---------- 3 · 4 · Match della casa / con un coinquilino ---------- */
  App.screen('matchHouse', {
    top: 'main', nav: true,
    render(p) {
      const h = H(), sel = p.sel || 'all';
      if (!h.members.length) return `<div class="h1">Match della casa</div><div class="card"><div class="b17">Aggiungi almeno un coinquilino.</div><div class="btn" data-go="match">Aggiungi</div></div>`;
      if (sel === 'all') {
        const cs = h.members.map(m => compat(m)), tot = Math.round(cs.reduce((s, x) => s + x, 0) / cs.length), [sn, sd] = style(tot);
        return `<div class="h1">${esc(h.name)}</div>${whoSel(sel)}
          <div class="card" style="flex-direction:row;align-items:center;gap:16px">${bigRing(tot)}<div class="tx" style="gap:6px"><div class="b13">STILE DELLA CASA</div><div class="h1n" style="font-size:24px;line-height:28px">${sn}</div><div class="b15">${sd}</div></div></div>
          ${h.members.some(smokeConflict) ? `<div class="card alert"><div class="rw">${dot('di')}<div class="tx"><div class="h3">Vincolo da risolvere: fumo in casa</div><div class="b15">${h.members.filter(smokeConflict).map(m => esc(first(m.name))).join(', ')} e tu avete scelte incompatibili. Non è una questione di sfumature.</div></div></div></div>` : ''}
          <div class="card" style="gap:14px"><div class="h3">Con ciascuno</div>${h.members.map((m, i) => `<div class="rw tap-row" data-act="sel" data-c="${m.code}">${av(m.name, 40, i)}<div class="tx" style="gap:6px"><div class="h3" style="font-size:16px">${esc(first(m.name))}</div>
            <div class="bar" style="height:6px"><i style="width:${cs[i]}%;background:${pctColor(cs[i])}"></i></div></div><b class="h3" style="min-width:44px;text-align:right">${cs[i]}%</b></div>`).join('')}</div>
          <div class="card" style="gap:12px"><div class="rw" style="justify-content:space-between"><div class="h3">Mappa dei temi</div>${legend()}</div>${themeMap('all')}</div>
          ${linkCard('matchInterests', { sel }, 'star', 'Interessi in comune', 'Cosa vi piace fare insieme')}
          ${rateBox('casa:sommario', esc(h.name) + ' · match', 'Questo risultato ti sembra giusto?')}
          <div class="b13" style="padding:0 6px">Una stima basata sul questionario: la realtà può essere diversa e il dialogo conta più dei numeri.</div>`;
      }
      const i = h.members.findIndex(m => m.code === sel), m = h.members[i], c = compat(m), nm = first(m.name);
      const st = DATA.themes.map((t, k) => ({ t, k, s: themeState(t, sel) }));
      const grp = key => st.filter(x => x.s.k === key);
      const block = (key, title) => { const g = grp(key); return g.length ? `<div class="card" style="gap:4px"><div class="rw" style="padding-bottom:6px">${dot(key)}<div class="h3">${title}</div><span class="b13" style="margin-left:auto">${g.length}</span></div>
        ${g.map(x => `<div class="rw tap-row trw tpill" data-go="matchTheme" data-p='{"i":${x.k},"sel":"${sel}"}' role="button"><div class="tx"><div class="b17" style="color:#000">${x.t.name}</div></div><span class="b13">Dettagli</span>${chev()}</div>`).join('')}</div>` : ''; };
      const best = grp('ok').slice(0, 2).map(x => x.t.name.toLowerCase()), worst = grp('di').concat(grp('at')).slice(0, 2).map(x => x.t.name.toLowerCase());
      return `<div class="h1">Tu e ${esc(nm)}</div>${whoSel(sel)}
        <div class="card" style="flex-direction:row;align-items:center;gap:14px">${av(m.name, 64, i)}<div class="tx" style="gap:4px"><div class="h2">${esc(nm)}</div>
          <div class="b15">${best.length ? `Affini su ${best.join(' e ')}.` : ''} ${worst.length ? `Da chiarire: ${worst.join(' e ')}.` : ''}</div></div>${bigRing(c, 64)}</div>
        ${smokeConflict(m) ? `<div class="card alert"><div class="rw">${dot('di')}<div class="tx"><div class="h3">Fumo in casa: incompatibili</div><div class="b15">${esc(nm)}: ${FUMA[theirs(m).smoke.fuma].toLowerCase()}. Tu: ${ACC[mine().smoke.accetta].toLowerCase()}.</div></div></div></div>` : ''}
        ${block('ok', 'Vi unisce')}${block('at', 'Da chiarire')}${block('di', 'Vi distingue')}
        ${linkCard('matchInterests', { sel }, 'star', 'Interessi in comune', `Cosa piace a te e a ${esc(nm)}`)}
        ${rateBox('casa:' + sel, 'Match con ' + nm, 'Questo risultato ti sembra giusto?')}`;
    },
    actions: Object.assign({}, selAct, rateActions)
  });

  /* ---------- 5 · Tutti i temi (mappa a pagina intera) ---------- */
  App.screen('matchThemes', {
    top: 'main', nav: true,
    render(p) {
      const sel = p.sel || 'all';
      return `<div class="h1">Tutti i temi</div>${whoSel(sel)}
        <div class="card" style="gap:12px">${legend()}${themeMap(sel)}</div>
        <div class="b13" style="padding:0 6px">Apri un tema per vedere dove si colloca ognuno.</div>`;
    },
    actions: selAct
  });

  /* ---------- 6 · Tema singolo: dove si colloca ognuno, si scorre di lato tra i 9 temi ---------- */
  /* scala del tema: una riga per persona sulla stessa linea, con una guida verticale sulla tua posizione.
     Così ogni pallino si legge da solo e il confronto con te è immediato. */
  function scaleHtml(t, s, h) {
    const rows = [{ n: 'Tu', v: s.me, c: '#9971E4', me: true }].concat(s.ms.map(x => ({ n: first(x.m.name), v: x.v, c: AVC[h.members.indexOf(x.m) % AVC.length], k: x.k })));
    return `<div class="lanes"><div class="lane-ends"><span>${t.A}</span><span>${t.B}</span></div>
      ${rows.map(r => `<div class="lane${r.me ? ' me' : ''}"><span class="lname">${esc(r.n)}</span>
        <div class="ltrack"><i class="lguide" style="left:${s.me}%"></i><i class="ldot" style="left:${r.v}%;background:${r.c}"></i></div>
        <span class="lst">${r.k ? dot(r.k) : ''}</span></div>`).join('')}
      <div class="b13" style="padding-left:58px">La linea tratteggiata è la tua posizione.</div></div>`;
  }
  /* fumo: niente slider, solo le scelte di ognuno */
  function smokeHtml(s, h) {
    const row = (n, c, sm, k) => `<div class="smk">${'<span class="pav" style="background:' + c + '">' + esc(n === 'Tu' ? 'Tu' : n[0]) + '</span>'}<div class="tx"><div class="h3" style="font-size:15px">${esc(n)}</div>
      <div class="b13">${FUMA[sm.fuma]} · ${ACC[sm.accetta]}</div></div>${k ? dot(k) : ''}</div>`;
    return `<div class="smks">${row('Tu', '#9971E4', s.me)}${s.ms.map(x => row(first(x.m.name), AVC[h.members.indexOf(x.m) % AVC.length], x.sm, x.k)).join('')}</div>`;
  }
  function smokeAdvice(s) {
    const bad = s.ms.filter(x => x.c === 2), mid = s.ms.filter(x => x.c === 1);
    if (bad.length) return `Incompatibili: ${bad.map(x => first(x.m.name)).join(', ')} e tu non potete convivere senza cambiare qualcosa. È un sì o un no, non una sfumatura.`;
    if (mid.length) return `Si fuma solo fuori, ma tu preferisci una casa senza fumo: mettetevi d'accordo su balcone e spazi comuni.`;
    return 'Nessun conflitto: le scelte sul fumo sono compatibili.';
  }
  App.screen('matchTheme', {
    top: 'main', nav: true,
    render(p) {
      const sel = p.sel || 'all', i = p.i || 0, h = H(), who = sel === 'all' ? 'la casa' : first(h.members.find(m => m.code === sel).name);
      const cards = DATA.themes.map((t, k) => { const s = themeState(t, sel); return `<div class="card tcard"><div class="rw"><div class="h2" style="flex:1">${t.name}</div><span class="stag ${s.k}">${dot(s.k)}${SL[s.k]}</span></div>
          <div class="b15">${t.d}</div>${s.cat ? smokeHtml(s, h) : scaleHtml(t, s, h)}<div class="advice ${s.k}">${s.cat ? smokeAdvice(s) : ADVICE[s.k]}</div></div>`; }).join('');
      const t = DATA.themes[i];
      return `<div class="h1" id="tTitle">${t.name}</div><div class="b15" style="padding:0 4px;margin-top:-6px">Tu e ${esc(who)} · tema ${i + 1} di ${DATA.themes.length}</div>
        <div class="car" id="tcar">${cards}</div>
        <div class="dots" id="tdots">${DATA.themes.map((x, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
        ${rateBox(`casa:${sel}:${t.k}`, `${t.name} · ${who}`, 'Questo risultato ti sembra giusto?')}`;
    },
    mount(v, p) {
      const car = v.querySelector('#tcar'), w = () => car.firstElementChild.offsetWidth + 12;
      car.scrollLeft = (p.i || 0) * w();
      let tm; car.addEventListener('scroll', () => {
        const k = Math.round(car.scrollLeft / w()); v.querySelectorAll('#tdots i').forEach((d, j) => d.classList.toggle('on', j === k));
        document.getElementById('tTitle').textContent = DATA.themes[k].name;
        clearTimeout(tm); tm = setTimeout(() => { if (k !== (App.current.p.i || 0)) { App.current.p.i = k; App.refresh(); } }, 400);
      }, { passive: true });
    },
    actions: rateActions
  });

  /* ---------- 7 · Interessi in comune: area dei cerchi proporzionale alla quota ---------- */
  const CAT = { Sport: 'Sport', Natura: 'Sport', Cucina: 'Cucina', Musica: 'Cultura', Arte: 'Cultura', Cinema: 'Cultura', Lettura: 'Cultura', Giochi: 'Svago', Cultura: 'Cultura' };
  const BUB = { Sport: '#BADE8E', Natura: '#A8DCCB', Cucina: '#FFD59A', Musica: '#E7B6E2', Arte: '#FEC2B0', Cinema: '#B0A9F1', Lettura: '#C9D3E6', Giochi: '#98C3F1', Cultura: '#F3C7A0' };
  const PHRASE = { Sport: 'Qui lo sport non è un dettaglio: è la cosa seria di questa casa.', Cucina: 'Cene insieme assicurate: la cucina sarà la stanza più vissuta.', Musica: 'Playlist condivise e qualche concerto insieme.',
    Arte: 'Mostre e laboratori: avete occhi curiosi per le stesse cose.', Cinema: 'Serate film sul divano: su questo andate d\'accordo.', Natura: 'Gite fuori porta nel weekend: amate stare all\'aria aperta.',
    Giochi: 'Tavolo da gioco sempre pronto: una casa competitiva, in senso buono.', Lettura: 'Libri che girano per casa: vi piace leggere e parlarne.', Cultura: 'Musei e città da scoprire: la cultura vi accomuna.' };
  function interestShares(sel) {
    const all = Object.keys(PHRASE), myTop = Object.entries(Match.interests()).sort((x, y) => y[1] - x[1]).slice(0, 3).map(x => x[0]);
    const people = [{ n: 'Tu', i: -1, ints: myTop }].concat(H().members.map((m, i) => ({ m, i })).filter(x => sel === 'all' || x.m.code === sel)
      .map(({ m, i }) => { const r = rng(m.code + ':int'), pick = () => all[Math.floor(r() * all.length)]; return { n: first(m.name), i, ints: [...new Set([pick(), pick(), r() < .6 ? myTop[Math.floor(r() * 3)] : pick()])] }; }));
    const who = {}; people.forEach(pp => pp.ints.forEach(k => (who[k] = who[k] || []).push(pp)));
    const tot = Object.values(who).reduce((s, x) => s + x.length, 0);
    return Object.entries(who).map(([k, ps]) => ({ k, ps, share: Math.round(ps.length / tot * 100), all: ps.length === people.length })).sort((x, y) => y.share - x.share);
  }
  function pack(items, W, Hh) {
    const max = items.length ? items[0].share : 1, placed = [], grid = [];
    for (let y = 0; y <= Hh; y += 4) for (let x = 0; x <= W; x += 4) grid.push([x, y]);
    grid.sort((a, b) => Math.hypot(a[0] - W / 2, (a[1] - Hh / 2) * 1.25) - Math.hypot(b[0] - W / 2, (b[1] - Hh / 2) * 1.25));
    return items.map(x => {
      const r0 = Math.max(22, 74 * Math.sqrt(x.share / max));   // area ∝ quota
      for (let r = r0; r >= 18; r *= .92) {
        const g = grid.find(([cx, cy]) => cx - r >= 0 && cx + r <= W && cy - r >= 0 && cy + r <= Hh && placed.every(q => Math.hypot(q.x - cx, q.y - cy) >= q.r + r + 5));
        if (g) { placed.push({ x: g[0], y: g[1], r }); return { x: g[0] / W * 100, y: g[1] / Hh * 100, d: r * 2 }; }
      }
      return null;
    });
  }
  App.screen('matchInterests', {
    top: 'main', nav: true,
    render(p) {
      const sel = p.sel || 'all', f = p.f || 'Tutti', h = H();
      const sh = interestShares(sel).filter(x => f === 'Tutti' || CAT[x.k] === f).slice(0, 8), pick = sh.find(x => x.k === p.k) || sh[0];
      const pos = pack(sh, 330, 250);
      return `<div class="h1">Interessi in comune</div>${whoSel(sel)}
        <div class="card" style="gap:12px"><div class="bubbles">${sh.map((x, i) => pos[i] ? `<button class="bub${pick && pick.k === x.k ? ' on' : ''}" data-act="pick" data-k="${x.k}" style="left:${pos[i].x}%;top:${pos[i].y}%;width:${pos[i].d}px;height:${pos[i].d}px;background:${BUB[x.k]}">
            <b style="font-size:${pos[i].d > 110 ? 17 : pos[i].d > 70 ? 14 : 11}px">${x.k}</b>${pos[i].d > 70 ? `<span>${x.share}%</span>` : ''}</button>` : '').join('')}</div>
          <div class="tabs">${['Tutti', 'Sport', 'Cultura', 'Cucina', 'Svago'].map(c => `<span class="chip sm${f === c ? ' on' : ''}" data-act="f" data-c="${c}">${c}</span>`).join('')}</div>
          <div class="b13">Più grande il cerchio, più è condiviso in casa.</div></div>
        ${pick ? `<div class="card" style="gap:10px"><div class="rw"><i class="sdot" style="background:${BUB[pick.k]};width:14px;height:14px"></i><div class="h3" style="flex:1">${pick.k}</div><b class="h3">${pick.share}%</b></div>
            <div class="b17" style="color:#000">${PHRASE[pick.k]}</div>
            <div class="rw" style="gap:6px;flex-wrap:wrap"><span class="b13" style="margin-right:4px">Piace a</span>${pick.ps.map(pp => `<span class="chip sm" style="height:32px;padding:0 10px 0 4px;gap:6px">${av(pp.n, 24, pp.i)}${esc(pp.n)}</span>`).join('')}</div></div>`
          : '<div class="card"><div class="b15">Nessun interesse in questa categoria.</div></div>'}
        ${rateBox(`casa:${sel}:interessi`, 'Interessi in comune', 'Quanto ti sembra affidabile questo match?')}`;
    },
    actions: Object.assign({
      pick(el) { App.current.p.k = el.dataset.k; App.refresh(); },
      f(el) { App.current.p.f = el.dataset.c; App.current.p.k = null; App.refresh(); }
    }, selAct, rateActions)
  });
})();
