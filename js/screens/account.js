/* 1b · Task e buono, profilo, statistiche, impostazioni  ·  1h · notifiche ed email giornaliera */
(function () {
  const esc = App.esc, S = () => Store.s;
  const eur = v => v.toFixed(2).replace('.', ',') + ' €';
  const chev = () => ic('chev', { size: 16, color: '#CCD2D9', sw: 2 });
  const sep = '<div style="height:1px;background:#E3E3EA"></div>';
  /* riga di menu dentro una card: icona, testo, freccia */
  const row = (icn, t, s, attrs, o) => {
    o = o || {};
    return `<div class="rw tap-row" ${attrs || ''}><div class="ico ${o.plain ? '' : 'b'}" ${o.icoStyle ? `style="${o.icoStyle}"` : ''}>${ic(icn, { color: o.color || (o.plain ? '#000' : '#489DFE'), fill: o.fill })}</div>
      <div class="tx"><div class="h3"${o.red ? ' style="color:#D63D2D"' : ''}>${t}</div>${s ? `<div class="b15">${s}</div>` : ''}</div>${o.right != null ? o.right : chev()}</div>`;
  };
  const card = rows => `<div class="card">${rows.join(sep)}</div>`;
  const TASK_GO = { affini: 'explore', tutti: 'explore', eventi: 'explore', partecipa: 'explore', casa: 'match', casa_val: 'match', crea: 'create' };

  /* ---------- 3 · Task e biglietto omaggio ----------
     Il biglietto è un'unica immagine divisa in 8 pezzi: il pezzo N si scopre quando completi il task N. */
  function ticket() {
    const N = DATA.tasks.length, f = Store.fragments(), full = f === N;
    const seen = S().ticketSeen || [];
    const tiles = DATA.tasks.map((t, i) => {
      const on = Store.taskDone(t.id), fresh = on && !seen.includes(t.id);
      const c = i % 4, r = i / 4 | 0;
      return `<div class="tk-tile${on ? ' on' : ''}${fresh ? ' fresh' : ''}" style="--x:${c / 3 * 100}%;--y:${r * 100}%;animation-delay:${fresh ? 300 + i * 90 : 0}ms" data-act="tile" data-i="${i}">
        ${on ? '' : `<span>${ic('lock', { size: 14, color: '#9AA8BE', sw: 2 })}${i + 1}</span>`}</div>`;
    }).join('');
    S().ticketSeen = DATA.tasks.filter(t => Store.taskDone(t.id)).map(t => t.id); Store.save();
    return `<div class="tk3${full ? ' full' : ''}"><div class="tk-grid">${tiles}</div>
      <div class="tk-label">${ic('ticket', { size: 16, color: '#123F73' })}Biglietto omaggio</div>
      ${full ? `<div class="tk-done"><b>Evento gratis</b><span>Sbloccato · lo trovi nell'app ufficiale</span></div>` : ''}</div>`;
  }
  App.screen('tasks', {
    top: 'main', nav: true, tab: 'profile',
    render() {
      const N = DATA.tasks.length, f = Store.fragments(), e = Store.eur();
      const next = DATA.tasks.findIndex(t => !Store.taskDone(t.id)), nt = DATA.tasks[next];
      const rowT = (t, i) => {
        const d = Store.taskDone(t.id);
        return `<div class="trow${d ? ' done' : ''}${i === next ? ' next' : ''}" ${d ? '' : `data-go="${t.go}"`}>
          <div class="tnum">${d ? ic('check', { size: 18, color: '#fff', sw: 2.6 }) : i + 1}</div>
          <div class="tx"><div class="h3" style="font-size:16px">${t.label}</div><div class="b13">${d ? 'Fatto · pezzo ' + (i + 1) + ' sbloccato' : t.where}</div></div>
          <span class="pl ${d ? 'ok' : 'bl'}">+${t.pts}</span>${d ? '' : chev()}</div>`;
      };
      return `<div class="h1">Task</div>
        <div class="b17" style="padding:0 4px;margin-top:-6px">Ogni task ti dà punti e scopre un pezzo del biglietto omaggio.</div>
        <div class="card" style="gap:14px">${ticket()}
          <div class="rw"><div class="tx"><div class="h2">${f === N ? 'Biglietto completo' : `${f} di ${N} pezzi`}</div>
            <div class="b15">${f === N ? 'Hai finito il test: grazie!' : `Ancora ${N - f} task per un ingresso gratis a un evento.`}</div></div>
            <div class="tk-pct">${Math.round(f / N * 100)}%</div></div></div>
        <div class="stat2">
          <div class="card st"><div class="b13">PUNTI</div><div class="h1n" style="font-size:34px;line-height:38px">${Store.points()}</div><div class="b13">valutazioni incluse</div></div>
          <div class="card st"><div class="b13">VOUCHER</div><div class="h1n" style="font-size:34px;line-height:38px">${e.toFixed(2).replace('.', ',')} €</div>
            <div class="bar" style="height:6px"><i style="width:${e / DATA.maxEur * 100}%;background:linear-gradient(90deg,#75A2FC,#C58BFD)"></i></div><div class="b13">su ${DATA.maxEur} €</div></div></div>
        ${nt ? `<div class="lab">Prossimo task</div>
          <div class="card nextc" data-go="${nt.go}">
            <div class="rw"><div class="ngr">${ic(nt.icon, { size: 24, color: '#fff' })}</div>
              <div class="tx"><div class="b13">PEZZO ${next + 1} · ${nt.where.toUpperCase()}</div><div class="h2">${nt.label}</div></div></div>
            <div class="b15">${nt.desc}</div>
            <div class="btn">Inizia · +${nt.pts} punti</div></div>` : ''}
        <div class="lab">Tutti i task · ${f}/${N}</div>
        <div class="card" style="padding:6px 8px;gap:0">${DATA.tasks.map(rowT).join('')}</div>
        <div class="b13" style="padding:0 6px">Ogni valutazione vale anche +${DATA.ratingPts} punti (+${DATA.deepRatingPts} se approfondita). Il voucher si riscatta solo nell'app ufficiale.</div>`;
    },
    actions: {
      tile(el) {
        const i = +el.dataset.i, t = DATA.tasks[i], d = Store.taskDone(t.id);
        App.toast(d ? `Pezzo ${i + 1}: ${t.label} ✓` : `Pezzo ${i + 1}: ${t.label}`);
      }
    }
  });

  /* ---------- 4 · Profilo ---------- */
  App.screen('profile', {
    top: 'main', nav: true, tab: 'profile',
    render() {
      const u = S().user, un = Store.unread(), acts = Object.values(S().parts || {}).filter(x => x.status !== 'archived').length + (S().userActs || []).filter(a => !a.archived).length;
      return `<div class="h1">Profilo</div>
        <div class="card" style="align-items:center;gap:10px;padding:22px 16px">
          <div style="position:relative;margin:2px 0;cursor:pointer" data-go="setPhoto">${avatar(130)}
            <div style="position:absolute;right:0;bottom:0;width:42px;height:42px;border-radius:50%;background:#489DFE;border:3px solid #fff;display:flex;align-items:center;justify-content:center">${ic('pencil', { size: 20, color: '#fff' })}</div></div>
          <div class="h2" style="font-size:24px;line-height:30px">${esc(u.nome)} ${esc(u.cognome)}</div>
          <div class="b17" style="text-align:center">${u.bio ? esc(u.bio) : '<span data-go="setPhoto" style="color:#489DFE;cursor:pointer">Aggiungi una descrizione</span>'}</div></div>
        <div class="card"><div class="b15">Il tuo codice utente</div>
          <div style="display:flex;align-items:center;justify-content:space-between"><div class="h1n" style="letter-spacing:3px;font-size:32px">${S().code}</div>
          <button class="ico b" data-act="copy" aria-label="Copia codice">${ic('copy', { size: 20, color: '#489DFE' })}</button></div></div>
        <div class="card tap" data-go="myActs" style="padding:18px 16px">${row('calendar', 'Le mie attività', acts ? `${acts} attive · organizzo e partecipo` : 'Organizzo e partecipo')}</div>
        <div class="card tap" data-go="match" style="padding:18px 16px">${row('house', 'La mia casa', S().house ? `«${esc(S().house.name)}» · ${S().house.members.length} coinquilini` : 'Crea il gruppo con i coinquilini', '', { plain: 1 })}</div>
        <div class="card tap" data-go="tasks" style="padding:18px 16px">${row('trophy', 'Task e punti', `${Store.points()} punti · ${Store.progress()}% completato`, '', { plain: 1 })}</div>
        <div class="card tap" data-go="notifs" style="padding:18px 16px">${row('bell', 'Notifiche', un ? `${un} nuov${un > 1 ? 'e' : 'a'}` : 'Nessuna nuova', '', { plain: 1 })}</div>
        <div class="card tap" data-go="settings" style="padding:18px 16px">${row('cog', 'Impostazioni', 'Account, privacy, aiuto', '', { plain: 1 })}</div>`;
    },
    actions: { copy() { copyCode(); } }
  });
  window.avatar = (size, border) => {
    const u = S().user, ini = ((u.nome || '?')[0] + (u.cognome || '')[0] || '').toUpperCase();
    return u.photo ? `<div style="width:${size}px;height:${size}px;border-radius:50%;border:4px solid rgba(72,157,254,.8);background:url(${u.photo}) center/cover;box-sizing:border-box"></div>`
      : `<div style="width:${size}px;height:${size}px;border-radius:50%;border:4px solid rgba(72,157,254,.8);background:linear-gradient(135deg,#8CDBFF,#489DFE);display:flex;align-items:center;justify-content:center;color:#fff;font:700 ${size * .34}px 'DM Sans';box-sizing:border-box">${esc(ini)}</div>`;
  };

  /* ---------- 5–6 · Statistiche (Valutazioni | Questionario) ---------- */
  const stars = v => Array.from({ length: 5 }, (_, i) => ic('star', { size: 16, color: i < v ? '#FEC458' : '#CCD2D9', fill: i < v ? '#FEC458' : 'none', sw: 1.5 })).join('');
  App.screen('stats', {
    top: 'main', nav: true, tab: 'stats',
    render(p) {
      const ev = Match.evolution(), pc = k => Math.round(ev.now[k] * 100);
      const seg = p.seg || 'val', ch = Store.character({ soc: pc('soc'), plan: pc('plan'), cur: pc('cur') }), chQ = Store.character(), rs = Object.values(S().ratings || {}).sort((a, b) => (b.at || 0) - (a.at || 0));
      let body;
      if (seg === 'val') {
        const avg = rs.length ? rs.reduce((s, r) => s + r.v, 0) / rs.length : 0;
        body = rs.length ? `<div class="card" style="gap:14px">
            <div class="rw" style="justify-content:space-between"><div class="tx"><div class="h3">${rs.length} valutazion${rs.length > 1 ? 'i' : 'e'}</div><div class="b13">Voto medio ${avg.toFixed(1).replace('.', ',')}</div></div><div style="display:flex;gap:2px">${stars(Math.round(avg))}</div></div>
            ${rs.map(r => `<div class="rw" style="border-top:1px solid #EEEEF2;padding-top:12px"><div class="tx"><div class="h3" style="font-size:16px">${esc(r.title)}</div><div class="b13">${r.kind}${r.deep ? ' · approfondita' : ''}</div></div><div style="display:flex;gap:2px">${stars(r.v)}</div></div>`).join('')}</div>`
          : `<div class="card" style="align-items:center;text-align:center;padding:26px 18px"><div class="ico b" style="width:56px;height:56px">${ic('star', { size: 26, color: '#489DFE' })}</div>
            <div class="h3">Nessuna valutazione ancora</div><div class="b15">Ogni contenuto che valuti in Esplora o nel Match compare qui.</div>
            <div class="btn sm" data-go="explore" style="margin-top:4px">Vai a Esplora</div></div>`;
      } else {
        const t = p.tab || 'Profilo', pr = Store.profile();
        const marked = pr.traits.map(x => x.v >= 50 ? x.b : x.a);
        body = `<div class="tabs">${Summary.TABS.map(x => `<span class="chip sm${x === t ? ' on' : ''}" data-act="tab" data-t="${x}">${x}</span>`).join('')}</div>
          ${t === 'Profilo' ? `<div class="gy" style="background:#E4F1FF;gap:6px"><div class="b15" style="color:#123F73">TRATTI PIÙ MARCATI</div><div style="display:flex;flex-wrap:wrap;gap:6px">${marked.map(m => `<span class="chip sm" style="background:#fff;border:0">${m}</span>`).join('')}</div></div>` : ''}
          ${Summary.tabBody(t)}
          <div class="b13" style="padding:0 6px">Scala 0–100 · versione di prova non validata.</div>`;
      }
      return `<div class="h1">Statistiche</div>
        <div class="card"><div style="display:flex;flex-direction:column;align-items:center;gap:6px">
          <div class="charav">${ic('user', { size: 54, color: '#fff', sw: 1.4 })}</div>
          <div class="h1n" style="font-size:26px;text-align:center">${ch.name}</div><div class="b15" style="text-align:center">${ch.d}</div>
          ${chQ.name !== ch.name ? `<span class="pl gr">Dal questionario: ${chQ.name}</span>` : ''}</div></div>
        ${evoCard(ev)}
        <div class="seg"><div class="${seg === 'val' ? 'on' : ''}" data-act="seg" data-s="val">Valutazioni</div><div class="${seg === 'q' ? 'on' : ''}" data-act="seg" data-s="q">Questionario</div></div>
        ${body}`;
    },
    actions: {
      seg(el) { App.current.p.seg = el.dataset.s; App.refresh(); },
      tab(el) { App.current.p.tab = el.dataset.t; App.refresh(); }
    }
  });

  /* profilo di oggi vs questionario: pallino vuoto = questionario, pieno = oggi */
  const EVO = [['soc', 'Riservato', 'Socievole'], ['cur', 'Abitudinario', 'Curioso'], ['plan', 'Spontaneo', 'Pianificatore'], ['act', 'Tranquillo', 'Energico']];
  function spark(sr) {
    if (sr.length < 2) return '';
    const W = 120, Hh = 34, mx = Math.max(10, ...sr), pts = sr.map((v, i) => `${(i / (sr.length - 1) * W).toFixed(1)},${(Hh - 3 - v / mx * (Hh - 6)).toFixed(1)}`).join(' ');
    return `<svg width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" style="flex:none"><polyline points="${pts}" fill="none" stroke="#489DFE" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }
  function evoCard(ev) {
    const rows = EVO.map(([k, a, b]) => {
      const q = Math.round(ev.base[k] * 100), n = Math.round(ev.now[k] * 100), d = n - q;
      return `<div class="evo"><div class="rw" style="justify-content:space-between"><span class="b13">${a}</span><span class="b13" style="color:${Math.abs(d) < 2 ? '#9AA3AF' : '#123F73'};font-weight:700">${Math.abs(d) < 2 ? '=' : (d > 0 ? '+' : '−') + Math.abs(d)}</span><span class="b13">${b}</span></div>
        <div class="evo-t"><i class="evo-line" style="left:${Math.min(q, n)}%;width:${Math.abs(d)}%"></i><i class="evo-q" style="left:${q}%"></i><i class="evo-n" style="left:${n}%"></i></div></div>`;
    }).join('');
    return `<div class="card" style="gap:14px"><div class="rw"><div class="tx"><div class="h3">Il tuo profilo oggi</div><div class="b13">Cambia con valutazioni e partecipazioni, e con lui il tuo feed</div></div></div>
      ${rows}
      <div class="rw" style="gap:14px;font:400 13px 'DM Sans';color:#7B7B7C"><span class="rw" style="width:auto;gap:6px"><i class="evo-q leg"></i>Questionario</span><span class="rw" style="width:auto;gap:6px"><i class="evo-n leg"></i>Oggi</span></div>
      <div class="gy" style="flex-direction:row;align-items:center;gap:12px"><div class="tx"><div class="b13">SCOSTAMENTO DAL QUESTIONARIO</div><div class="h1n" style="font-size:30px;line-height:34px">${Math.round(ev.dist)}%</div>
        <div class="b13">${ev.n ? `su ${ev.n} valutazion${ev.n > 1 ? 'i' : 'e'}${ev.parts ? ` · ${ev.parts} partecipazion${ev.parts > 1 ? 'i' : 'e'}` : ''}` : 'Valuta qualcosa per vederlo cambiare'}</div></div>${spark(ev.series)}</div>
      ${predCard(ev)}</div>`;
  }
  /* predittività: profilo e feed stabili = il questionario ti aveva previsto bene */
  function predCard(ev) {
    const st = Match.stability(), score = Math.round(Math.max(0, Math.min(100, (100 - ev.dist * 3) * .5 + st.pct * .5)));
    const lv = score >= 75 ? ['ok', 'Alta'] : score >= 50 ? ['at', 'Media'] : ['di', 'Bassa'];
    return `<div class="gy" style="gap:10px"><div class="rw" style="justify-content:space-between"><div class="b13">STABILITÀ DEL FEED</div><b class="h3">${st.pct}%</b></div>
      <div class="bar" style="height:6px"><i style="width:${st.pct}%"></i></div>
      <div class="b13">${st.changes.length ? `${st.changes.length} contenuti hanno cambiato posizione rispetto al questionario${st.changes[0] ? ` (es. «${App.esc(st.changes[0].title)}» da #${st.changes[0].from} a #${st.changes[0].to})` : ''}.` : 'L\'ordine è ancora quello previsto dal questionario.'}</div>
      <div class="rw" style="justify-content:space-between;border-top:1px solid #E3E3EA;padding-top:10px"><div class="tx"><div class="h3" style="font-size:15px">Predittività del questionario</div><div class="b13">Profilo e feed stabili = ti aveva previsto bene</div></div>
        <span class="pl ${lv[0]}">${lv[1]}</span></div></div>`;
  }

  /* ---------- 7 · Impostazioni ---------- */
  App.screen('settings', {
    top: 'main', nav: true, tab: 'profile',
    render() {
      return `<div class="h1">Impostazioni</div>
        <div class="lab">Account</div>${card([row('user', 'Dati personali', 'Nome, email, telefono', 'data-go="setData"'), row('camera', 'Foto e descrizione', '', 'data-go="setPhoto"')])}
        <div class="lab">Preferenze</div>${card([row('bell', 'Notifiche', '', 'data-go="setNotifs"'), row('pin', 'Feed e territorio', S().settings.distance ? `Entro ${S().settings.km} km da ${esc(S().settings.city)}` : 'Filtro distanza facoltativo', 'data-go="setFeed"')])}
        <div class="lab">Dati</div>${card([row('lock', 'Privacy e dati', '', 'data-go="setPrivacy"'), row('doc', 'Le mie risposte', 'Rivedi il questionario', 'data-go="summary" data-p=\'{"view":1}\'')])}
        <div class="lab">Aiuto</div>${card([row('play', 'Rivedi video e regole', '', 'data-act="help"', { fill: '#489DFE' })])}
        <div class="btn s" style="color:#D63D2D;margin-top:8px" data-act="logout">Esci</div>`;
    },
    actions: {
      logout() {
        App.pop(`<div class="h2">Vuoi uscire?</div><div class="b17">I tuoi dati restano salvati: potrai rientrare con la tua email.</div>
          <div style="display:flex;gap:8px"><div class="btn g" style="flex:1" data-act="closeOv">Annulla</div><div class="btn" style="flex:1;background:#D63D2D" data-act="doLogout">Esci</div></div>`);
      },
      doLogout() { S().loggedOut = true; Store.save(); App.reset(['login']); }
    }
  });

  /* accesso dopo «Esci» (simulato) */
  App.screen('login', {
    top: 'none', noBack: true,
    render() {
      return { html: `<div style="height:40px"></div><div class="h1">Bentornato</div><div class="b17" style="padding:0 4px;margin-top:-6px">Accedi con l'email della registrazione: ti mandiamo un link.</div>
        <input class="inp" id="lmail" type="email" value="${esc(S().user.email)}" placeholder="Email" aria-label="Email">`,
        cta: `<div class="btn" data-act="in">Inviami il link</div>` };
    },
    actions: {
      in() { App.toast('Link inviato (simulato) · accesso eseguito'); S().loggedOut = false; Store.save(); App.later(() => App.reset(['home']), 700); }
    }
  });

  /* dati personali */
  App.screen('setData', {
    top: 'main', nav: true, tab: 'profile',
    render() {
      const u = S().user, f = (k, l, t) => `<label class="field"><span class="b13" style="padding:0 8px">${l}</span><input class="inp" name="${k}" type="${t}" value="${esc(u[k])}" aria-label="${l}"></label>`;
      return `<div class="h1">Dati personali</div>${f('nome', 'Nome', 'text')}${f('cognome', 'Cognome', 'text')}${f('email', 'Email', 'email')}${f('tel', 'Telefono', 'tel')}
        <div class="btn" data-act="save" style="margin-top:6px">Salva</div>`;
    },
    actions: {
      save() { document.querySelectorAll('#view input').forEach(i => S().user[i.name] = i.value.trim()); Store.save(); App.toast('Dati salvati'); App.back(); }
    }
  });

  /* foto e descrizione */
  App.screen('setPhoto', {
    top: 'main', nav: true, tab: 'profile',
    render() {
      return `<div class="h1">Foto e descrizione</div>
        <label style="align-self:center;position:relative;cursor:pointer">${avatar(150)}
          <div style="position:absolute;right:4px;bottom:4px;width:44px;height:44px;border-radius:50%;background:#489DFE;border:3px solid #F5F5F7;display:flex;align-items:center;justify-content:center">${ic('camera', { size: 20, color: '#fff' })}</div>
          <input type="file" accept="image/*" id="photoIn" hidden></label>
        ${S().user.photo ? `<button class="link" data-act="rm" style="color:#D63D2D">Rimuovi foto</button>` : ''}
        <textarea class="inp" id="bio" placeholder="Raccontati in due righe…" maxlength="160">${esc(S().user.bio)}</textarea>
        <div class="b13" style="padding:0 8px">Gli altri tester la vedono nelle richieste e tra i partecipanti.</div>
        <div class="btn" data-act="save">Salva</div>`;
    },
    mount(v) { v.querySelector('#photoIn').addEventListener('change', e => readPhoto(e.target.files[0], url => { S().user.photo = url; Store.save(); App.refresh(); })); },
    actions: {
      rm() { S().user.photo = ''; Store.save(); App.refresh(); },
      save() { S().user.bio = document.getElementById('bio').value.trim(); Store.save(); App.toast('Profilo aggiornato'); App.back(); }
    }
  });

  /* ---------- 8 · Impostazioni · notifiche ---------- */
  const NOPTS = [['mail', 'Email giornaliera', 'Nuove attività community del giorno'], ['req', 'Richieste e accettazioni', 'Chi chiede di partecipare e le risposte'], ['chat', 'Messaggi in chat', 'Gruppi delle attività'], ['remind', 'Promemoria valutazioni', 'Cose da valutare']];
  App.screen('setNotifs', {
    top: 'main', nav: true, tab: 'profile',
    render() {
      return `<div class="h1">Notifiche</div>
        ${card(NOPTS.map(([k, t, s]) => `<div class="rw"><div class="tx"><div class="h3" style="font-size:16px">${t}</div><div class="b13">${s}</div></div><button class="toggle${S().settings[k] ? ' on' : ''}" data-act="tg" data-k="${k}" aria-label="${t}" aria-pressed="${!!S().settings[k]}"></button></div>`))}
        <div class="b13" style="padding:0 6px">Le notifiche restano sempre visibili nel centro notifiche dell'app.</div>
        <div class="card tap" data-go="mail" style="padding:16px">${row('mail', 'Anteprima email di oggi', 'Come arriva nella tua casella')}</div>`;
    },
    actions: { tg(el) { const k = el.dataset.k; S().settings[k] = !S().settings[k]; Store.save(); el.classList.toggle('on', S().settings[k]); el.setAttribute('aria-pressed', S().settings[k]); } }
  });

  /* feed e territorio: filtro distanza facoltativo (di default spento, README §6.3) */
  App.screen('setFeed', {
    top: 'main', nav: true, tab: 'profile',
    render() {
      const st = S().settings;
      return `<div class="h1">Feed e territorio</div>
        <div class="card"><div class="rw"><div class="tx"><div class="h3" style="font-size:16px">Filtro distanza</div><div class="b13">Di default vedi tutto, ovunque sia</div></div>
          <button class="toggle${st.distance ? ' on' : ''}" data-act="tg" aria-label="Filtro distanza"></button></div>
          <div id="kmBox" style="display:${st.distance ? 'flex' : 'none'};flex-direction:column;gap:12px">${sep}
            <label class="field"><span class="b13" style="padding:0 8px">Città</span><input class="inp" id="city" value="${esc(st.city)}"></label>
            <div class="rw" style="justify-content:space-between"><span class="b17">Entro</span><b class="h3" id="kmV">${st.km} km</b></div>
            <input type="range" min="1" max="50" value="${st.km}" id="km" class="range"></div></div>
        <div class="gy" style="background:#E4F1FF"><div class="b15" style="color:#123F73">L'ordine del feed «Affini» non cambia: il filtro nasconde solo ciò che è troppo lontano.</div></div>`;
    },
    mount(v) {
      const st = S().settings, km = v.querySelector('#km');
      km.addEventListener('input', () => { st.km = +km.value; v.querySelector('#kmV').textContent = km.value + ' km'; Store.save(); });
      v.querySelector('#city').addEventListener('input', e => { st.city = e.target.value; Store.save(); });
    },
    actions: { tg(el) { const st = S().settings; st.distance = !st.distance; Store.save(); el.classList.toggle('on', st.distance); document.getElementById('kmBox').style.display = st.distance ? 'flex' : 'none'; } }
  });

  /* ---------- 9 · Impostazioni · privacy ---------- */
  App.screen('setPrivacy', {
    top: 'main', nav: true, tab: 'profile',
    render() {
      const d = S().consentAt ? new Date(S().consentAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : '—';
      return `<div class="h1">Privacy e dati</div>
        ${card([row('shield', 'Informativa privacy', 'Dati personali e psicometrici', 'data-act="policy"'),
          row('check', 'Consenso informato', `Accettato il ${d}`, 'data-go="consent" data-p=\'{"review":1}\'', { right: '<span class="pl ok">Attivo</span>' }),
          row('download', 'Scarica i miei dati', 'File JSON con risposte e valutazioni', 'data-act="export"')])}
        <div class="card tap" data-act="del">${row('close', 'Cancella account', 'Perderai tutti i dati', '', { red: 1, color: '#D63D2D', icoStyle: 'background:#FFE4E4' })}</div>`;
    },
    actions: {
      policy() {
        App.sheet(`<div class="h2" style="padding:4px 4px 0">Informativa privacy</div><div class="card"><div class="b17">Testo dell'informativa da definire (README §10).<br><br>
          <b>Cosa raccogliamo:</b> dati di registrazione, risposte al questionario, valutazioni, attività create e messaggi.<br><br><b>Perché:</b> solo per misurare quanto il questionario predice i gusti.<br><br><b>Per quanto:</b> fino alla fine del test, poi in forma anonima.</div></div>
          <div class="btn g" data-act="closeOv">Chiudi</div>`);
      },
      export() {
        const blob = new Blob([JSON.stringify(S(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `centro-dati-${S().code}.json`; a.click();
        App.toast('File con i tuoi dati scaricato');
      },
      del() {
        App.pop(`<div class="h2">Cancellare l'account?</div><div class="b17">Risposte, valutazioni, punti e attività verranno eliminati. Non si può annullare.</div>
          <div style="display:flex;gap:8px"><div class="btn g" style="flex:1" data-act="closeOv">Annulla</div><div class="btn" style="flex:1;background:#D63D2D" data-act="doDel">Cancella</div></div>`);
      },
      doDel() { Store.reset(); try { sessionStorage.removeItem('centro_stack'); } catch (e) { } App.reset(['welcome']); App.toast('Account cancellato'); }
    }
  });

  /* ---------- 1h · Centro notifiche ---------- */
  const NGO = { accept: ['myActs', 'Apri attività'], request: ['myActs', 'Vedi richiesta'], rate: ['myActs', 'Valuta ora'], mail: ['mail', 'Leggi email'], tasks: ['tasks', 'Vai ai task'] };
  App.screen('notifs', {
    top: 'main', nav: true, tab: 'profile',
    render() {
      const ns = S().notifs;
      return `<div class="rw" style="justify-content:space-between"><div class="h1">Notifiche</div>${Store.unread() ? '<button class="link" data-act="allRead">Segna tutte lette</button>' : ''}</div>
        ${ns.length ? ns.map(n => `<div class="card tap notif${n.read ? '' : ' new'}" style="padding:16px" data-act="open" data-id="${n.id}">
          <div class="rw"><div class="tx"><div class="h3">${esc(n.t)}</div><div class="b15">${esc(n.s)}</div></div>${n.read ? `<span class="b13">${n.at}</span>` : '<span class="pl bl">Nuova</span>'}</div>
          ${!n.read && n.kind === 'accept' ? `<div style="display:flex;gap:8px"><div class="btn" style="flex:1;height:44px" data-act="open" data-id="${n.id}">Apri attività</div><div class="btn s" style="flex:1;height:44px" data-act="open" data-id="${n.id}" data-to="chat">Chat</div></div>` : ''}</div>`).join('')
          : `<div class="card" style="align-items:center;text-align:center;padding:26px"><div class="ico b">${ic('bell', { color: '#489DFE' })}</div><div class="h3">Nessuna notifica</div></div>`}`;
    },
    actions: {
      open(el, e) {
        e.stopPropagation();
        const n = S().notifs.find(x => x.id === el.dataset.id); if (!n) return;
        n.read = true; Store.save();
        if (n.ref) return App.go(el.dataset.to === 'chat' ? 'chat' : 'partHub', { id: n.ref });
        App.go(el.dataset.to || (NGO[n.kind] || ['tasks'])[0], el.dataset.to === 'chat' ? { id: 'c3' } : n.kind === 'accept' ? {} : {});
      },
      allRead() { S().notifs.forEach(n => n.read = true); Store.save(); App.refresh(); }
    }
  });

  /* ---------- 1h · Email giornaliera ---------- */
  App.screen('mail', {
    top: (p, t) => t.back,
    render() {
      const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
      return `<div class="card" style="padding:0;overflow:hidden;gap:0">
        <div style="padding:16px;border-bottom:1px solid #E3E3EA;display:flex;flex-direction:column;gap:4px"><div class="b13">Da: Nia Test · A: ${esc(S().user.email || 'tu@email.it')}</div><div class="b13">${today} · 8:00</div><div class="h2">Le nuove attività di oggi</div></div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
          <div class="b17">Ciao ${esc(S().user.nome || '')}, ecco tutte le attività community pubblicate oggi, a prescindere dall'abbinamento. Controlla: quella che ti piace molto compare nel tuo feed Affini?</div>
          ${DATA.community.map(a => `<div class="c2 tap" style="flex-direction:row;align-items:center;border-radius:25px" data-go="explore">
            <div class="thumb" style="--h:${a.hue}">${a.interest[0]}</div><div class="tx"><div class="h3">${a.title}</div><div class="b13">Community · ${a.where.split(', ').pop()} · ${a.when}</div></div>${chev()}</div>`).join('')}
          <div class="b13" style="text-align:center">Non vuoi più riceverla? Impostazioni › Notifiche</div></div></div>
        <div class="b13" style="padding:0 6px">Visibile anche nell'area personale sul sito.</div>`;
    }
  });
})();
