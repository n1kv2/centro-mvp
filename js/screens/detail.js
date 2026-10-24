/* Dettaglio unico per Community, Eventi e Attività del team: stessa struttura, stesse forme.
   Copertina → card del titolo → Info rapide → sezioni a card → (solo community) Feedback dell'host → valutazione per il test. */
(function () {
  const S = () => Store.s, esc = App.esc;
  const PER_CHI = { Sport: 'Chi corre o vuole iniziare', Giochi: 'Appassionati · anche principianti', Natura: 'Chi ama camminare', Cucina: 'Curiosi in cucina', Lettura: 'Lettori di ogni livello',
    Arte: 'Chi vuole sperimentare', Musica: 'Musicisti e ascoltatori', Cultura: 'Curiosi della città', Cinema: 'Chi ama ridere' };
  const AVC = ['#6FD7E1', '#F5A25D', '#BA7BE0', '#8194FF', '#7BD389', '#F27BA0'];
  const row = (icn, label, value, em) => `<div class="row-i"><span class="ri">${ic(icn, { size: 22 })}</span><div class="rt"><small>${label}</small><b>${esc(value || '—')}</b>${em ? `<em>${em}</em>` : ''}</div></div>`;
  const fmap = place => `<div class="fmap" style="border-radius:25px"><i class="road r1"></i><i class="road r2"></i><i class="road r3"></i><i class="park"></i><div class="mpin">${ic('pin', { size: 30, color: '#fff', fill: '#489DFE' })}</div></div>`;
  const chips = list => `<div class="fbtags">${list.filter(Boolean).map(c => `<span class="chip sm">${esc(c)}</span>`).join('')}</div>`;
  function cover(x, tags) {
    const h = actHue(x.interest), bg = x.photo ? `background-image:url(${x.photo})` : `background:linear-gradient(160deg,hsl(${h} 80% 88%),hsl(${h + 12} 75% 74%) 55%,hsl(${h + 24} 70% 62%))`;
    return `<div class="cover${x.photo ? ' has-img' : ''}" style="${bg}">${x.photo ? '' : `<span class="cv-i">${esc(x.title[0])}</span>`}</div>
      ${tags.length ? `<div class="cover-tags">${tags.map(t => `<span class="pl demo">${esc(t)}</span>`).join('')}</div>` : ''}`;
  }
  function related(x) {
    const all = Match.feed([x.type]).filter(y => y.id !== x.id);
    const same = all.filter(y => y.interest === x.interest), rest = all.filter(y => y.interest !== x.interest);
    return same.concat(rest).slice(0, 3).map(y => `<div class="mini-card" data-go="${y.type === 'community' ? 'actDetail' : 'poster'}" data-p='{"id":"${y.id}"}'>
      <div class="thumb" style="--h:${actHue(y.interest)}">${esc(y.title[0])}</div><div class="tx"><div class="h3" style="font-size:16px">${esc(y.title)}</div><div class="b13">${esc(y.when || '')} · ${esc(y.city || '')}</div></div>${ic('chev', { size: 16, color: '#CCD2D9', sw: 2 })}</div>`).join('<div class="sep"></div>');
  }
  const liked = id => (S().liked || []).includes(id);
  const actions = x => `<div class="t-actions"><button class="ib" data-act="share" aria-label="Condividi">${ic('share', { size: 18 })}</button>
    <button class="ib${liked(x.id) ? ' on' : ''}" data-act="like" data-id="${x.id}" aria-label="Salva">${ic('heart', { size: 18, color: liked(x.id) ? '#E5486B' : '#000', fill: liked(x.id) ? '#E5486B' : 'none' })}</button></div>`;
  const common = Object.assign({
    share() { try { navigator.clipboard.writeText(location.href.split('#')[0]); } catch (e) { } App.toast('Link copiato (nel test non si condivide davvero)'); },
    like(el) { const id = el.dataset.id, l = S().liked = S().liked || [], i = l.indexOf(id); if (i >= 0) l.splice(i, 1); else l.push(id); Store.save(); App.refresh(); App.toast(i >= 0 ? 'Tolta dai salvati' : 'Salvata'); }
  }, Inline.actions);

  /* ---------- Attività community ---------- */
  App.screen('actDetail', {
    top: 'main',
    render(p) {
      const x = Match.find(p.id); if (!x) return 'Attività non trovata';
      const lb = Match.label(x.aff), joined = Math.min(x.max || 6, x.joined || 1), part = (S().parts || {})[x.id];
      const dates = x.dates && x.dates.length ? x.dates : [{ title: x.date || x.when, sub: 'Durata indicativa 2 ore' }];
      const body = `${Sec.card({ id: 'info', icon: 'info', title: 'Informazioni', sub: 'Tutto quello che devi sapere', open: true,
          body: `<div class="b17" style="color:#000;white-space:pre-line">${esc(x.desc || '')}</div>${chips((x.offers || []).concat(climatesOf(x)))}` })}
        ${Sec.card({ id: 'when', icon: 'calendar', title: 'Quando', sub: 'Giorni, orari e durata dell\'esperienza',
          body: dates.map((d, i) => `${i ? '<div class="sep"></div>' : ''}${row('calendar', d.sub || 'Data', d.title)}`).join('') })}
        ${Sec.card({ id: 'where', icon: 'pin', title: 'Dove', sub: 'Mappa della location e indirizzo',
          body: `${fmap()}${row('pin', 'Zona', x.place || x.city, 'Indirizzo esatto dopo la conferma')}` })}
        ${Sec.card({ id: 'target', icon: 'target', title: 'Target', sub: 'La community di riferimento',
          body: `${row('users', 'Per chi', x.perChi || PER_CHI[x.interest] || 'Tutti, anche chi viene da solo')}${chips([x.interest, x.intensity ? 'Intensità ' + x.intensity.toLowerCase() : '', ...climatesOf(x)])}` })}
        ${Sec.card({ id: 'people', icon: 'users', title: 'Partecipanti', sub: `${joined} su ${x.max || 6} posti`,
          body: `<div class="rw">${Array.from({ length: joined }, (_, i) => `<div class="av" style="width:38px;height:38px;background:${AVC[i % 6]};margin-left:${i ? -10 : 0}px"></div>`).join('')}<span class="b15" style="margin-left:6px">${(x.max || 6) - joined} posti liberi</span></div>` })}
        ${Sec.card({ id: 'rel', icon: 'next', title: 'Correlati e suggeriti', sub: 'Esperienze simili vicino a te', body: related(x) })}
        ${Fb.hostCard(x, false)}
        ${x.mine ? '' : `<div class="card">${Inline.box(x, 'Quanto è adatta a te?')}</div>`}`;
      let cta;
      if (x.mine) cta = `<div class="btn" data-go="actHub" data-p='{"id":"${x.id}"}'>Apri la dashboard</div>`;
      else if (part && part.status === 'pending') cta = `<div class="bookbar"><div class="btn off">${ic('check', { size: 18, color: '#fff', sw: 2.4 })}Richiesta inviata</div><span class="price">Gratis</span></div>`;
      else if (part && part.status !== 'archived') cta = `<div class="bookbar"><div class="btn" data-go="partHub" data-p='{"id":"${x.id}"}'>La tua partecipazione</div><div class="btn s" style="flex:none;width:54px;padding:0" data-go="chat" data-p='{"id":"${x.id}"}' aria-label="Chat">${ic('chat')}</div></div>`;
      else if (!part) cta = `<div class="bookbar"><div class="btn" data-go="joinReq" data-p='{"id":"${x.id}"}'>Chiedi di partecipare</div><span class="price">Gratis</span></div>`;
      return {
        hero: cover(x, []), cls: 'cover-on',
        html: `<div class="title-card"><div class="rw" style="justify-content:space-between"><span class="chip sm">${esc(x.interest)}</span>${actions(x)}</div>
            <div class="h1n" style="font-size:28px;line-height:34px">${esc(x.title)}</div>
            <div class="b15">Organizzato da ${esc(x.mine ? 'te' : x.who)} · #${esc(x.code || '')}</div>
            ${x.mine ? '' : `<div class="rw"><span class="pl ${lb[0]}">${lb[1]}</span></div>`}</div>
          <div class="card" style="gap:14px"><div class="b15" style="text-align:center;font-style:italic;font-family:'DM Serif Text',serif;color:#123F73">Info rapide</div>
            ${row('clock', 'Quando', x.when || x.date)}<div class="sep"></div>${row('pin', 'Dove', x.place || x.city, 'Indirizzo esatto dopo la conferma')}<div class="sep"></div>${row('users', 'Per chi', x.perChi || PER_CHI[x.interest] || 'Tutti')}</div>
          ${body}`,
        cta
      };
    },
    actions: common
  });

  /* ---------- Eventi e Attività del team ---------- */
  const PROG = x => [['Accoglienza', 'Si entra, ci si conosce'], [x.type === 'evento' ? 'Momento principale' : 'L\'attività', x.desc.split('.')[0]], ['Chiusura', 'Chiacchiere e saluti']];
  App.screen('poster', {
    top: 'main', nav: true,
    render(p) {
      const x = Match.find(p.id); if (!x) return 'Contenuto non trovato';
      const lb = Match.label(x.aff), free = /gratis/i.test(x.price || '');
      return {
        hero: cover(x, [x.spot ? 'Spot' : 'Demo']), cls: 'cover-on',
        html: `<div class="title-card"><div class="rw" style="justify-content:space-between"><span class="chip sm">${esc(x.cat)}</span>${actions(x)}</div>
            <div class="h1n" style="font-size:28px;line-height:34px">${esc(x.title)}</div>
            <div class="b15">${esc(x.who)} · ${esc(x.city)}</div><div class="rw"><span class="pl ${lb[0]}">${lb[1]}</span><span class="pl gr">${esc(x.price)}</span></div></div>
          <div class="card" style="gap:14px"><div class="b15" style="text-align:center;font-style:italic;font-family:'DM Serif Text',serif;color:#123F73">Info rapide</div>
            ${row('clock', 'Quando', x.when)}<div class="sep"></div>${row('pin', 'Dove', x.place)}<div class="sep"></div>${row('coin', 'Costo', x.price)}</div>
          ${Sec.card({ id: 'info', icon: 'info', title: 'Informazioni', sub: 'Riassunto del contenuto', open: true, body: `<div class="b17" style="color:#000">${esc(x.desc)}</div>` })}
          ${Sec.card({ id: 'when', icon: 'calendar', title: 'Quando', sub: 'Giorni e orari', body: `${row('calendar', 'Data', x.when)}${row('clock', 'Orari', x.open)}` })}
          ${Sec.card({ id: 'where', icon: 'pin', title: 'Dove', sub: 'Mappa della location e indirizzo', body: `${fmap()}${row('pin', 'Indirizzo', x.place)}` })}
          ${Sec.card({ id: 'prog', icon: 'doc', title: 'Programma', sub: 'Scandisci gli orari e le attività', body: PROG(x).map((r, i) => `${i ? '<div class="sep"></div>' : ''}${row('next', r[0], r[1])}`).join('') })}
          ${Sec.card({ id: 'target', icon: 'target', title: 'Target', sub: 'Definisci il pubblico ideale', body: `${row('users', 'Per chi', PER_CHI[x.interest] || 'Tutti')}${chips([x.interest, x.cat])}` })}
          ${Sec.card({ id: 'cost', icon: 'coin', title: 'Costo e prenotazione', sub: free ? 'Gratuito' : x.price, body: `<div class="sub">${ic('coin', { color: '#7B7B7C' })}<div class="b15">${free ? 'Ingresso libero fino a esaurimento posti.' : 'Prezzo ' + esc(x.price) + '. La prenotazione vera si farà nell\'app ufficiale: qui conta la tua valutazione.'}</div></div>` })}
          ${Sec.card({ id: 'cond', icon: 'shield', title: 'Condizioni', sub: 'Note, politiche di rimborso e regole', body: `<div class="b15">Rimborso fino a 48 ore prima. Si chiede puntualità e rispetto degli spazi.</div>` })}
          ${Sec.card({ id: 'faq', icon: 'help', title: 'FAQ', sub: 'Dubbi utili e frequenti', body: `<div class="h3" style="font-size:15px">Posso venire da solo?</div><div class="b15">Sì: è pensato anche per chi arriva senza compagnia.</div><div class="sep"></div><div class="h3" style="font-size:15px">Serve esperienza?</div><div class="b15">No, nessuna.</div>` })}
          ${Sec.card({ id: 'rel', icon: 'next', title: 'Correlati e suggeriti', sub: 'Esperienze simili vicino a te', body: related(x) })}
          <div class="card">${Inline.box(x, 'Quanto fa al caso tuo?')}</div>`
      };
    },
    actions: common
  });
})();
