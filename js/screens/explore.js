/* 1e · Esplora: scelta contenuti → feed Affini (card orizzontali) → soglia → «Tutti»; dettaglio community, locandina, bacheca */
(function () {
  const S = () => Store.s, esc = App.esc;
  const EX = () => (S().explore = S().explore || { types: ['community', 'evento'] });
  const KINDS = [['community', 'Attività community', 'Create dai tester · si può partecipare'], ['evento', 'Eventi', 'Contenuti del team'], ['attivita', 'Attività', 'Contenuti del team'], ['bacheca', 'Bacheca', 'Annunci e situazioni · solo questa']];
  const typeLabel = t => KINDS.find(k => k[0] === t)[1].replace('Attività community', 'Community');

  /* ---------- 1 · Scelta contenuti ---------- */
  App.screen('explore', {
    top: 'main', nav: true,
    render() {
      const t = EX().types;
      return {
        html: `<div class="h1">Cosa vuoi vedere?</div><div class="b17" style="padding:0 4px;margin-top:-6px">Puoi sceglierne più di uno. La bacheca si vede da sola.</div>
          ${KINDS.map(([k, ti, s]) => `<div class="opt2${t.includes(k) ? ' on' : ''}" data-act="tg" data-k="${k}"><div class="tx"><div class="h3">${ti}</div><div class="b15">${s}</div></div>
            ${k === 'bacheca' ? '<span class="pl gr">Da sola</span>' : ''}<div class="ck sq">${t.includes(k) ? ic('check', { size: 16, color: '#fff', sw: 2.6 }) : ''}</div></div>`).join('')}`,
        cta: `<div class="btn${t.length ? '' : ' off'}" data-act="show">Mostra i risultati</div>`
      };
    },
    actions: {
      tg(el) {
        const e = EX(), k = el.dataset.k;
        if (k === 'bacheca') e.types = e.types.includes('bacheca') ? [] : ['bacheca'];
        else { e.types = e.types.filter(x => x !== 'bacheca'); e.types = e.types.includes(k) ? e.types.filter(x => x !== k) : e.types.concat(k); }
        Store.save(); App.refresh();
      },
      show() { const t = EX().types; if (!t.length) return; App.go(t.includes('bacheca') ? 'board' : 'feed'); }
    }
  });

  /* ---------- 2 · Feed Affini / Tutti (+ 5 · soglia) ---------- */
  const carPos = {};                          // posizione del carosello per scheda
  const chipsOf = x => [x.interest].concat(x.offers || [], climatesOf(x).length ? climatesOf(x) : (x.cat ? [x.cat] : [])).filter(Boolean).slice(0, 3);
  function fcard(x) {
    const r = Rate.get(x.id), lb = Match.label(x.aff), open = x.type === 'community' ? 'actDetail' : 'poster';
    return `<div class="fcard" data-id="${x.id}">
      <div class="acover phi" style="height:180px;${actCover(x)}" data-go="${open}" data-p='{"id":"${x.id}"}'>${x.photo ? '' : `<span class="acover-i">${esc(x.title[0])}</span>`}
        <span class="gl" style="position:absolute;left:14px;top:14px;height:38px;font-size:15px">${esc(x.when || '')}</span>
        <span class="gl" style="position:absolute;right:14px;top:14px;height:38px;min-width:48px;padding:0 10px;color:#489DFE">#${x.rank}</span></div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:10px;flex:1">
        <div class="h1n" style="font-size:26px;line-height:32px;cursor:pointer" data-go="${open}" data-p='{"id":"${x.id}"}'>${esc(x.title)}</div>
        <div class="b15">${esc(x.who)} · ${Match.TYPE[x.type]} · ${esc(x.city || '')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${chipsOf(x).map(c => `<span class="chip sm">${esc(c)}</span>`).join('')}</div>
        <div class="rw"><span class="pl ${lb[0]}">${lb[1]}</span>${x.mine ? '<span class="pl gr">La tua attività</span>' : ''}</div>
        <div style="flex:1"></div>
        ${x.mine ? `<div class="btn s" style="height:48px" data-go="actHub" data-p='{"id":"${x.id}"}'>Apri la dashboard</div>`
          : r ? `<div class="rated"><div class="tx"><div class="b13">IL TUO VOTO${r.deep ? ' · APPROFONDITA' : ''}</div><div style="display:flex;gap:2px">${Rate.stars(r.v)}</div></div><span class="link" data-act="rate" data-id="${x.id}">Modifica</span></div>`
          : `<div style="display:flex;flex-direction:column;gap:8px"><div class="btn" style="height:48px" data-act="rate" data-id="${x.id}">Valuta</div>
            <div class="btn s" style="height:44px;font-size:15px" data-go="rateDeep" data-p='{"id":"${x.id}"}'>Valutazione approfondita</div></div>`}</div></div>`;
  }
  App.screen('feed', {
    top: 'main', nav: true,
    render(p) {
      const seg = p.seg || 'aff', types = EX().types.filter(t => t !== 'bacheca');
      const all = Match.feed(types), aff = all.filter(x => x.aff >= DATA.threshold), rest = all.filter(x => x.aff < DATA.threshold);
      const list = seg === 'aff' ? aff : rest;
      /* il feed si riordina con il profilo che cambia: lo segnaliamo quando l'ordine è diverso dall'ultima visita */
      const seen = (S().feedSeen = S().feedSeen || {}), key = seg + ':' + types.join(','), order = list.map(x => x.id).join(',');
      const updated = seen[key] && seen[key] !== order; seen[key] = order; Store.save();
      const rated = list.filter(x => Rate.get(x.id) || x.mine).length;
      const end = seg === 'aff' ? `<div class="fcard endc"><div class="okb">${ic('check', { size: 40, color: '#489DFE', sw: 2.4 })}</div>
          <div class="h2" style="text-align:center">Gli affini sono finiti</div><div class="b17" style="text-align:center">Hai visto tutti i contenuti in linea con il tuo profilo. Vuoi valutare anche gli altri?</div>
          <div class="btn" data-act="seg" data-s="all">Mostra «Tutti»</div></div>`
        : `<div class="fcard endc"><div class="okb">${ic('star', { size: 36, color: '#489DFE' })}</div><div class="h2" style="text-align:center">Hai visto tutto</div>
          <div class="b17" style="text-align:center">Puoi cambiare i contenuti da vedere o passare alla bacheca.</div><div class="btn s" data-go="explore">Cambia contenuti</div></div>`;
      const n = list.length + 1;
      return {
        html: `<div class="rw" style="justify-content:space-between"><div class="h1">Esplora</div><span class="link" data-go="explore" style="padding:6px 4px">${S().settings.distance ? `${S().settings.km} km · ` : ''}${types.map(typeLabel).join(' · ')} ${ic('chev', { size: 14, color: '#489DFE', sw: 2.4 })}</span></div>
          <div class="seg"><div class="${seg === 'aff' ? 'on' : ''}" data-act="seg" data-s="aff">Affini · ${aff.length}</div><div class="${seg === 'all' ? 'on' : ''}" data-act="seg" data-s="all">Tutti · ${rest.length}</div></div>
          ${updated ? `<div class="gy" style="background:#E4F1FF;flex-direction:row;align-items:center;gap:10px">${ic('sliders', { size: 18, color: '#123F73' })}<div class="b15" style="color:#123F73">Feed aggiornato in base alle tue ultime valutazioni.</div></div>` : ''}
          ${seg === 'all' ? `<div class="gy" style="background:#FFF6E5"><div class="b15" style="color:#8A5A00">Sotto la soglia: secondo il questionario sono meno affini a te. Valutali comunque.</div></div>` : ''}
          ${list.length ? `<div class="car" id="car">${list.map(fcard).join('')}${end}</div>
          <div class="dots" id="dots">${Array.from({ length: n }, (_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>
          <div class="card" style="padding:14px 16px;gap:8px"><div class="rw" style="justify-content:space-between"><span class="b15">Valutati</span><b class="h3">${rated} / ${list.length}</b></div>
            <div class="bar" style="height:6px"><i style="width:${list.length ? rated / list.length * 100 : 0}%"></i></div>
            <div class="b13">Il primo è il più affine. Valuta tutto, anche ciò che non ti convince.</div></div>`
          : `<div class="card" style="padding:28px 20px;align-items:center;text-align:center"><div class="h3">Niente da mostrare</div><div class="b15">Scegli altri tipi di contenuti.</div><div class="btn s" data-go="explore">Cambia contenuti</div></div>`}`
      };
    },
    mount(v, p) {
      const car = v.querySelector('#car'); if (!car) return;
      const key = p.seg || 'aff';
      if (carPos[key]) car.scrollLeft = carPos[key];
      const dots = v.querySelectorAll('#dots i');
      const upd = () => { carPos[key] = car.scrollLeft; const w = car.firstElementChild.offsetWidth + 12, i = Math.round(car.scrollLeft / w); dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
      car.addEventListener('scroll', upd, { passive: true }); upd();
      if (key === 'all' && !Store.taskDone('tutti')) { /* il task «Tutti» si completa valutando 3 contenuti sotto soglia */ }
    },
    actions: {
      seg(el) { App.current.p.seg = el.dataset.s; App.refresh(); },
      rate(el) {
        const x = Match.feed(EX().types.filter(t => t !== 'bacheca')).find(i => i.id === el.dataset.id);
        Rate.quick(x, { after: () => { App.refresh(); next(x.id); } });
      }
    }
  });
  /* dopo un voto il carosello scorre alla card successiva */
  function next(id) {
    const car = document.getElementById('car'); if (!car) return;
    const cards = Array.from(car.children), i = cards.findIndex(c => c.dataset.id === id);
    if (i >= 0 && cards[i + 1]) App.later(() => car.scrollTo({ left: cards[i + 1].offsetLeft - 16, behavior: 'smooth' }), 250);
  }

  /* inline rating box (dettaglio e locandina): Invia compare dopo aver scelto */
  let inl = 0;
  const inlineBox = (x, q) => {
    const r = Rate.get(x.id); inl = r ? r.v : 0;
    return `<div class="h3" style="font-size:16px">${q}</div>${Rate.scale('inl', inl)}
      <div class="btn${inl && !r ? '' : ' hide'}" style="height:46px" id="inlGo" data-act="inlSend">${r ? 'Aggiorna' : 'Invia'}</div>
      ${r ? `<div class="b13" style="text-align:center">Hai già votato ${r.v}/5${r.deep ? ' con valutazione approfondita' : ''}. Tocca un numero per cambiare.</div>` : ''}
      <div class="link" data-go="rateDeep" data-p='{"id":"${x.id}"}' style="text-align:center">Valutazione approfondita</div>`;
  };
  const inlineActions = {
    pick5(el) {
      if (el.dataset.n === 'quick') return App.actions.pick5(el);
      inl = +el.dataset.v; Rate.paint('inl', inl); App.buzz(); document.getElementById('inlGo').classList.remove('hide');
    },
    inlSend() { const x = Match.find(App.current.p.id); if (inl) { Rate.save(x, inl); App.refresh(); } }
  };
  const AVC = ['#6FD7E1', '#F5A25D', '#BA7BE0', '#8194FF', '#7BD389', '#F27BA0'];
  window.Inline = { box: inlineBox, actions: inlineActions };

  /* ---------- 6 · Dettaglio attività community ---------- */
  App.screen('actDetail', {
    top: 'main',
    render(p) {
      const x = Match.find(p.id); if (!x) return 'Attività non trovata';
      const joined = Math.min(x.max || 6, x.joined || 1), lb = Match.label(x.aff);
      return {
        hero: `<div class="hero acover phi" style="height:340px;${actCover(x)}">${x.photo ? '' : `<span class="acover-i" style="font-size:150px">${esc(x.title[0])}</span>`}</div>`,
        html: `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="chip sm">${esc(x.date || x.when || '')}</span><span class="chip sm">${ic('pin', { size: 14, color: '#4D4D4D' })}${esc(x.city || '')}</span></div>
            <div class="h1n">${esc(x.title)}</div>
            <div class="rw"><div class="av" style="width:34px;height:34px;background:#F5A25D;font-size:12px">${esc(x.who[0])}</div><div class="b15">#${x.code || 'TU-00000'} · ${esc(x.who)}</div><span class="pl ${lb[0]}" style="margin-left:auto">${lb[1]}</span></div>
            <div style="display:flex;flex-wrap:wrap;gap:6px">${[x.interest].concat(x.offers || [], climatesOf(x), x.intensity ? ['Intensità ' + x.intensity.toLowerCase()] : []).map(c => `<span class="chip sm">${esc(c)}</span>`).join('')}</div></div>
          <div class="card"><div class="rw"><div class="ico b">${ic('users', { color: '#489DFE' })}</div><div class="tx"><div class="h3">Partecipanti</div><div class="b15">${joined} su ${x.max || 6} posti</div></div></div>
            <div class="rw" style="padding-left:58px">${Array.from({ length: joined }, (_, i) => `<div class="av" style="width:34px;height:34px;background:${AVC[i % 6]};margin-left:${i ? -10 : 0}px"></div>`).join('')}</div></div>
          ${x.dates && x.dates.length ? `<div class="card"><div class="b15" style="text-transform:uppercase;letter-spacing:.4px">Date</div>${x.dates.map(d => `<div class="rw">${ic('calendar', { size: 20 })}<div class="tx"><div class="h3" style="font-size:15px">${esc(d.title)}</div><div class="b13">${esc(d.sub)}</div></div></div>`).join('')}</div>` : ''}
          <div class="card"><div class="b17" style="white-space:pre-line">${esc(x.desc || '')}</div></div>
          ${x.mine ? '' : `<div class="card">${inlineBox(x, 'Quanto è adatta a te?')}</div>`}`,
        cta: x.mine ? `<div class="btn" data-go="actHub" data-p='{"id":"${x.id}"}'>Apri la dashboard</div>`
          : (S().parts || {})[x.id] && S().parts[x.id].status === 'pending' ? `<div class="btn off">${ic('check', { size: 18, color: '#fff', sw: 2.4 })}Richiesta inviata</div><div class="b13" style="text-align:center">Ti avvisiamo con una notifica quando ${esc(x.who)} risponde.</div>`
          : (S().parts || {})[x.id] && S().parts[x.id].status !== 'archived' ? `<div class="btn" data-go="partHub" data-p='{"id":"${x.id}"}'>Vai alla tua partecipazione</div>`
          : (S().parts || {})[x.id] ? '' : `<div class="btn" data-go="joinReq" data-p='{"id":"${x.id}"}'>Chiedi di partecipare</div>`,
        cls: 'hero360'
      };
    },
    actions: inlineActions
  });

  /* ---------- 7 · Locandina evento / attività del team ---------- */
  const INFO = {
    Orari: x => x.open, Dove: x => x.place,
    Programma: () => 'Accoglienza, momento principale, chiacchiere finali. Il programma completo arriva dal team.',
    Ospiti: () => 'Artisti e ospiti da annunciare.',
    Recensioni: () => '«Bella atmosfera, ci torno.» · «Organizzato bene, un po\' affollato.» · «Perfetto anche da soli.»'
  };
  App.screen('poster', {
    top: 'main', nav: true,
    render(p) {
      const x = Match.find(p.id); if (!x) return 'Contenuto non trovato';
      const h = actHue(x.interest);
      return {
        hero: `<div class="hero gal" id="gal">${Array.from({ length: 8 }, (_, i) => `<div class="gslide" style="background:linear-gradient(${135 + i * 25}deg,hsl(${h + i * 18} 70% 66%),hsl(${h + 50 + i * 12} 62% 46%))"><span>${i ? '' : esc(x.cat)}</span></div>`).join('')}</div>
          <span class="gl galn" id="galn">1/8</span>`,
        html: `<div class="card"><div style="display:flex;justify-content:space-between"><span class="chip sm" style="background:#E4F1FF;border:0;color:#489DFE">${esc(x.cat)}</span><span class="chip sm">${esc(x.price)}</span></div>
            <div class="h1n">${esc(x.title)}</div><div class="b15">${esc(x.who)} · ${esc(x.city)} · ${Match.TYPE[x.type]} del team</div><div class="b15">${esc(x.when)}</div></div>
          <div class="card"><div class="rw"><div class="ico b">${ic('doc', { color: '#489DFE' })}</div><div class="h3">Riassunto AI</div></div><div class="b17">${esc(x.desc)}</div></div>
          <div class="card">${[['calendar', 'Orari', x.open], ['pin', 'Dove', x.place], ['doc', 'Programma', 'Tutte le attività previste'], ['star', 'Ospiti', 'Artisti e ospiti speciali'], ['chat', 'Recensioni', 'Cosa dice chi ha già partecipato']]
            .map(([i, t, s], k) => `${k ? '<div style="height:1px;background:#E3E3EA"></div>' : ''}<div class="rw tap-row" data-act="info" data-k="${t}"><div class="ico b">${ic(i, { color: '#489DFE' })}</div><div class="tx"><div class="h3">${t}</div><div class="b15">${esc(s)}</div></div>${ic('chev', { size: 16, color: '#CCD2D9', sw: 2 })}</div>`).join('')}</div>
          <div class="card">${inlineBox(x, 'Quanto fa al caso tuo?')}</div>`,
        cls: 'hero360'
      };
    },
    mount(v) {
      const g = v.querySelector('#gal'), n = document.getElementById('galn');
      g.addEventListener('scroll', () => { n.textContent = (Math.round(g.scrollLeft / g.offsetWidth) + 1) + '/8'; }, { passive: true });
    },
    actions: Object.assign({
      info(el) { const x = Match.find(App.current.p.id), k = el.dataset.k; App.sheet(`<div class="h2" style="padding:4px 4px 0">${k}</div><div class="card"><div class="b17">${esc(INFO[k](x))}</div></div><div class="btn g" data-act="closeOv">Chiudi</div>`); }
    }, inlineActions)
  });

  /* ---------- 8 · Bacheca ---------- */
  App.screen('board', {
    top: 'main', nav: true,
    render(p) {
      const seg = p.seg || 'aff', all = Match.board(), list = seg === 'aff' ? all.filter(x => x.rank <= DATA.boardThreshold) : all.filter(x => x.rank > DATA.boardThreshold);
      return `<div class="rw" style="justify-content:space-between"><div class="h1">Bacheca</div><span class="link" data-go="explore" style="padding:6px 4px">Cambia ${ic('chev', { size: 14, color: '#489DFE', sw: 2.4 })}</span></div>
        <div class="seg"><div class="${seg === 'aff' ? 'on' : ''}" data-act="seg" data-s="aff">Affini</div><div class="${seg === 'all' ? 'on' : ''}" data-act="seg" data-s="all">Tutti</div></div>
        <div class="b15" style="padding:0 4px">${seg === 'aff' ? 'Annunci ordinati per utilità per te.' : 'Sotto la soglia: probabilmente meno utili per te.'}</div>
        ${list.map(x => { const r = Rate.get(x.id); return `<div class="card"><div class="rw"><span class="rk">#${x.rank}</span><div class="h2" style="flex:1">${esc(x.title)}</div><span class="pl gr">${x.kind}</span></div>
          <div class="b17">${esc(x.text)}</div>
          ${r ? `<div class="rated"><div class="tx"><div class="b13">UTILITÀ</div><div style="display:flex;gap:2px">${Rate.stars(r.v)}</div></div><span class="link" data-act="rate" data-id="${x.id}">Modifica</span></div>`
            : `<div style="display:flex;gap:8px"><div class="btn" style="flex:1;height:46px" data-act="rate" data-id="${x.id}">Valuta utilità</div><button class="btn s ibtn" data-go="rateDeep" data-p='{"id":"${x.id}"}' aria-label="Valutazione approfondita" title="Valutazione approfondita">${ic('sliders', { size: 20, color: '#489DFE' })}</button></div>`}</div>`; }).join('')}
        ${seg === 'aff' ? `<div class="card" style="padding:22px 18px;align-items:center;text-align:center"><div class="h3">Gli annunci affini sono finiti</div><div class="btn s" data-act="seg" data-s="all">Mostra «Tutti»</div></div>` : ''}`;
    },
    actions: {
      seg(el) { App.current.p.seg = el.dataset.s; App.refresh(); },
      rate(el) { Rate.quick(Match.board().find(x => x.id === el.dataset.id)); }
    }
  });
})();
