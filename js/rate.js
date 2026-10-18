/* Valutazione: scala 1–5 ovunque, «Invia» compare solo dopo aver scelto un numero, «Valutazione approfondita» sempre disponibile (README §6.4).
   Ogni voto salva anche posizione nel feed e affinità: è il dato che serve al team. */
(function () {
  const S = () => Store.s, esc = App.esc;
  let cur = null, qv = 0;

  const scale = (name, v, lo, hi) => `<div style="width:100%;display:flex;flex-direction:column;gap:6px">
    <div class="sc5" data-n="${name}">${[1, 2, 3, 4, 5].map(i => `<div class="${v === i ? 'on' : ''}" data-act="pick5" data-n="${name}" data-v="${i}" role="radio" aria-checked="${v === i}">${i}</div>`).join('')}</div>
    <div style="display:flex;justify-content:space-between" class="b13"><span>${lo || 'Per niente'}</span><span>${hi || 'Moltissimo'}</span></div></div>`;
  /* aggiorna una scala sul posto senza ridisegnare la schermata */
  const paint = (name, v) => document.querySelectorAll(`.sc5[data-n="${name}"] > div`).forEach(d => { const on = +d.dataset.v === v; d.classList.toggle('on', on); d.setAttribute('aria-checked', on); });
  const stars = v => Array.from({ length: 5 }, (_, i) => ic('star', { size: 16, color: i < v ? '#FEC458' : '#CCD2D9', fill: i < v ? '#FEC458' : 'none', sw: 1.5 })).join('');

  const Rate = {
    scale, paint, stars,
    get: id => (S().ratings || {})[id],
    /* salva un voto; i punti arrivano solo la prima volta per contenuto */
    save(item, v, extra) {
      S().ratings = S().ratings || {};
      const prev = S().ratings[item.id];
      const deep = !!(extra && extra.deep);
      S().ratings[item.id] = Object.assign({}, prev, {
        id: item.id, title: item.title, kind: Match.TYPE[item.type] || item.kind || 'Contenuto', type: item.type, v,
        rank: item.rank, aff: item.aff, feed: (item.type === 'bacheca' ? item.rank <= DATA.boardThreshold : item.aff >= DATA.threshold) ? 'affini' : 'tutti', at: Date.now()
      }, extra || {}, { deep: deep || (prev && prev.deep) });
      let pts = 0;
      if (!prev) pts += Store.addPoints(DATA.ratingPts);
      if (deep && !(prev && prev.deep)) pts += Store.addPoints(DATA.deepRatingPts);
      Store.save();
      const t = Rate.checkTasks();
      App.toast(t ? `+${pts + t.pts} punti · task «${t.label}» completato` : pts ? `Valutazione salvata · +${pts} punti` : 'Valutazione aggiornata');
      App.updateTop();
      return pts;
    },
    /* task legati alle valutazioni in Esplora */
    checkTasks() {
      const r = S().ratings || {}, types = (S().explore && S().explore.types) || ['community', 'evento'];
      const feed = Match.feed(types.filter(t => t !== 'bacheca')).filter(x => !x.mine);
      const done = [];
      const aff = feed.filter(x => x.aff >= DATA.threshold);
      if (aff.length && aff.every(x => r[x.id])) done.push('affini');
      if (Object.values(r).filter(x => x.feed === 'tutti' && x.type !== 'bacheca').length >= 3) done.push('tutti');
      const vals = Object.values(r);
      if (vals.some(x => x.type === 'evento') && vals.some(x => x.type === 'attivita')) done.push('eventi');
      let last = null;
      done.forEach(id => { if (Store.completeTask(id)) { last = DATA.tasks.find(t => t.id === id); Store.notify({ t: 'Task completato: ' + last.label, s: `+${last.pts} punti · nuovo pezzo del biglietto`, kind: 'tasks' }); } });
      return last;
    },
    /* sheet di valutazione rapida (1e · 3) */
    quick(item, opt) {
      opt = opt || {};
      cur = { item, after: opt.after }; qv = (Rate.get(item.id) || {}).v || 0;
      const q = item.type === 'bacheca' ? 'Quanto ti è utile questo annuncio?' : 'Quanto sembra adatta ai tuoi gusti dichiarati nel questionario?';
      App.sheet(`<div class="h2">${esc(item.title)}</div><div class="b17">${q}</div>
        ${scale('quick', qv)}
        <input class="inp" id="qComment" placeholder="Aggiungi un commento (facoltativo)" value="${esc((Rate.get(item.id) || {}).comment || '')}">
        <div class="btn s" data-act="rqDeep">Valutazione approfondita</div>
        <div class="btn${qv ? '' : ' hide'}" data-act="rqSave" id="rqSave">Salva · +${DATA.ratingPts} punti</div>`);
    }
  };
  window.Rate = Rate;

  /* azioni globali dello sheet rapido */
  App.actions.pick5 = el => {
    if (el.dataset.n !== 'quick') return;
    qv = +el.dataset.v; paint('quick', qv); App.buzz();
    document.getElementById('rqSave').classList.remove('hide');
  };
  App.actions.rqSave = () => {
    if (!cur || !qv) return;
    const c = document.getElementById('qComment').value.trim();
    Rate.save(cur.item, qv, c ? { comment: c } : null);
    App.closeOv();
    const after = cur.after; cur = null;
    if (after) after(); else App.refresh();
  };
  App.actions.rqDeep = () => { const it = cur && cur.item; App.closeOv(); if (it) App.go('rateDeep', { id: it.id }); };

  /* ---------- 1e · 4 · Valutazione approfondita ---------- */
  const QS = {
    community: ['Mi sembra adatta a me', 'Mi piacerebbe partecipare', 'Le persone sembrano compatibili', 'La descrizione è chiara'],
    evento: ['Mi sembra adatta a me', 'Ci andrei davvero', 'Il prezzo mi sembra giusto', 'Le informazioni sono chiare'],
    attivita: ['Mi sembra adatta a me', 'Ci andrei davvero', 'Il prezzo mi sembra giusto', 'Le informazioni sono chiare'],
    bacheca: ['Mi è utile', 'È pertinente per me', 'È scritto in modo chiaro'],
    casa: ['Il risultato mi sembra giusto', 'Rispecchia la mia esperienza', 'Mi aiuta a decidere']
  };
  let deep = { lik: [], media: [] };
  App.screen('rateDeep', {
    top: 'main',
    render(p) {
      const it = p.item || Match.find(p.id) || { id: p.id, title: 'Contenuto', type: 'community' };
      const prev = Rate.get(it.id) || {};
      const qs = QS[it.type] || QS.community;
      deep = { lik: prev.likert ? prev.likert.slice() : qs.map((q, i) => i === 0 && prev.v ? prev.v : 0), media: prev.mediaList ? prev.mediaList.slice() : [] };
      return {
        html: `<div class="h1">Valutazione</div>
          <div class="c2"><div class="rw"><div class="thumb big" style="--h:${actHue(it.interest)}">${esc((it.title || '?')[0])}</div>
            <div class="tx"><div class="h3">${esc(it.title)}</div><div class="b15">${Match.TYPE[it.type] || 'Contenuto'}${it.rank ? ` · #${it.rank} nel tuo feed` : ''}</div></div></div></div>
          <div class="card" style="gap:18px">${qs.map((q, i) => `<div style="width:100%;display:flex;flex-direction:column;gap:8px"><div class="h3" style="font-size:16px">${q}</div>${scale('d' + i, deep.lik[i], 'No', 'Sì')}</div>`).join('')}</div>
          <label class="c2 tap" style="cursor:pointer"><div class="rw">${ic('clip')}<div class="h3" style="flex:1">Allega foto, video o audio</div>${ic('plus')}</div>
            <input type="file" id="mediaIn" accept="image/*,video/*,audio/*" multiple hidden>
            <div class="media" id="mediaList">${mediaHtml()}</div></label>
          <textarea class="inp" id="deepText" placeholder="Scrivi cosa ti piace o cosa non ti convince…">${esc(prev.text || '')}</textarea>`,
        cta: `<div class="btn${deep.lik.some(Boolean) ? '' : ' off'}" id="deepGo" data-act="send">Invia valutazione · +${DATA.deepRatingPts} punti</div>`
      };
    },
    mount(v) {
      v.querySelector('#mediaIn').addEventListener('change', e => {
        Array.from(e.target.files).slice(0, 6).forEach(f => deep.media.push({ name: f.name, kind: f.type.split('/')[0] }));
        document.getElementById('mediaList').innerHTML = mediaHtml();
      });
    },
    actions: {
      pick5(el) {
        const i = +el.dataset.n.slice(1), v = +el.dataset.v; deep.lik[i] = v; paint(el.dataset.n, v); App.buzz();
        document.getElementById('deepGo').classList.remove('off');
      },
      rmMedia(el, e) { e.preventDefault(); deep.media.splice(+el.dataset.i, 1); document.getElementById('mediaList').innerHTML = mediaHtml(); },
      send() {
        const p = App.current.p, it = p.item || Match.find(p.id) || { id: p.id, title: 'Contenuto', type: 'community' };
        const vals = deep.lik.filter(Boolean); if (!vals.length) return;
        const v = deep.lik[0] || Math.round(vals.reduce((s, x) => s + x, 0) / vals.length);
        Rate.save(it, v, { deep: true, likert: deep.lik.slice(), text: document.getElementById('deepText').value.trim(), media: deep.media.length, mediaList: deep.media.slice() });
        if (p.onDone) App.actions[p.onDone] && App.actions[p.onDone]();
        App.back();
      }
    }
  });
  const mediaHtml = () => deep.media.map((m, i) => `<span class="chip sm">${ic(m.kind === 'video' ? 'video' : m.kind === 'audio' ? 'mic' : 'camera', { size: 15, color: '#4D4D4D' })}${esc(m.name.length > 16 ? m.name.slice(0, 14) + '…' : m.name)}<b data-act="rmMedia" data-i="${i}" style="margin-left:2px">×</b></span>`).join('');
})();
