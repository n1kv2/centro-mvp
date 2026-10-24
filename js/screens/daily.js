/* Domande del giorno: per 10 giorni, ogni giorno N domande riprese dal questionario (3 nel prototipo, 10 nell'MVP).
   Servono a misurare quanto variano le risposte di ogni item nel tempo (stabilità test-retest).
   Si possono rimandare: vengono riproposte a ogni nuova apertura dell'app finché non le completi.
   Rotazione bilanciata: ordine fisso per persona (seme = codice), ogni giorno le N successive → in 10 giorni ogni item torna ~3 volte. */
(function () {
  const S = () => Store.s, esc = App.esc, save = () => Store.save();
  const CFG = Object.assign({ perDay: 3, days: 10, pts: 5 }, DATA.daily);
  DATA.daily = CFG;

  const pad = n => String(n).padStart(2, '0');
  const dayKey = off => { const d = new Date(); d.setDate(d.getDate() + (S().dayOffset || 0) + (off || 0)); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const D = () => (S().daily = S().daily || { start: null, log: {} });
  const pool = () => Store.allQs().filter(q => q.type !== 'choice');
  function order() {
    const d = D(); if (d.order) return d.order;
    let h = [...(S().code || 'x')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const r = () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; };
    const codes = pool().map(q => q.code);
    for (let i = codes.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [codes[i], codes[j]] = [codes[j], codes[i]]; }
    d.order = codes; save(); return codes;
  }
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  /* stato di oggi: indice del giorno, domande assegnate, risposte */
  function today() {
    const d = D(), k = dayKey();
    if (!d.start) { d.start = k; save(); }
    const idx = daysBetween(d.start, k);
    if (idx >= CFG.days) return { k, idx, over: true };
    if (!d.log[k]) {
      const o = order(), n = o.length, items = Array.from({ length: CFG.perDay }, (_, j) => o[(idx * CFG.perDay + j) % n]);
      d.log[k] = { idx, items, answers: {}, done: false, later: 0 }; save();
    }
    return Object.assign({ k, idx }, d.log[k]);
  }
  const pending = () => S().onbDone && !today().over && !today().done;
  const qOf = code => Store.allQs().find(q => q.code === code);

  /* invito: una card in cima alla home + un popup alla prima apertura di ogni sessione */
  window.Daily = {
    CFG, today, pending,
    card() {
      if (!S().onbDone) return '';
      const t = today();
      if (t.over) return '';
      const n = Object.keys(t.answers).length;
      if (t.done) return `<div class="sub" style="background:#EAF6E2"><span class="ri">${ic('check', { color: '#4F9A26', sw: 2.4 })}</span><div class="b15" style="color:#2E6B16">Domande di oggi fatte · giorno ${t.idx + 1} di ${CFG.days}</div></div>`;
      return `<div class="card tap" data-go="daily" data-p='{"k":0}' style="flex-direction:row;align-items:center;gap:14px;padding:18px 16px;border:2px solid #C9DDF5">
        <div class="sx-i" style="background:#E4F1FF">${ic('doc', { color: '#489DFE' })}</div>
        <div class="tx"><div class="h3">Le domande di oggi</div><div class="b15">${n ? `${n} di ${CFG.perDay} fatte` : `${CFG.perDay} domande · meno di un minuto`} · giorno ${t.idx + 1} di ${CFG.days}</div></div>
        ${ic('chev', { size: 16, color: '#CCD2D9', sw: 2 })}</div>`;
    },
    prompt() {
      if (!pending()) return;
      const flag = 'centro_daily_' + today().k;
      try { if (sessionStorage.getItem(flag)) return; sessionStorage.setItem(flag, '1'); } catch (e) { }
      const t = today();
      App.pop(`<div class="h2">Le tue ${CFG.perDay} domande di oggi</div>
        <div class="b17">Ti riproponiamo alcune domande del questionario: rispondi d'istinto, come ti senti oggi. Non esiste la risposta «giusta» o coerente con le volte prima.</div>
        <div class="sub">${ic('calendar', { color: '#7B7B7C' })}<div class="b15">Giorno ${t.idx + 1} di ${CFG.days} · +${CFG.pts} punti</div></div>
        <div class="btn" data-act="dailyGo">Rispondi ora</div><div class="btn g" data-act="dailyLater">Più tardi</div>`);
    }
  };
  App.actions.dailyGo = () => { App.closeOv(); App.go('daily', { k: 0 }); };
  App.actions.dailyLater = () => { const t = today(); D().log[t.k].later++; save(); App.closeOv(); App.toast('Te le riproponiamo alla prossima apertura'); };

  /* ---------- una domanda per schermata, come nel questionario ---------- */
  let shownAt = 0;
  App.screen('daily', {
    top: (p, t) => t.back + `<span class="gl">${(p.k || 0) + 1} / ${CFG.perDay}</span>`,
    render(p) {
      const t = today(), k = p.k || 0, q = qOf(t.items[k]), v = (t.answers[q.code] || {}).v;
      shownAt = Date.now();
      return {
        html: `<div class="b15" style="padding:0 4px;color:#BB2DCE;font-weight:700;letter-spacing:.5px">DOMANDE DI OGGI · GIORNO ${t.idx + 1} DI ${CFG.days}</div>
          <div class="h1n qtxt" style="padding:0 4px">${esc(q.text)}</div>
          <div style="height:10px;flex:none"></div>
          <div style="width:100%;display:flex;justify-content:space-between" class="b15"><span>Per niente</span><span>Moltissimo</span></div>
          <div class="lik${v ? ' has' : ''}" role="radiogroup">${DATA.scaleColors.map((c, i) => `<button role="radio" aria-checked="${v === i + 1}" class="${v === i + 1 ? 'on' : ''}" style="background:${c}" data-act="ans" data-v="${i + 1}">${i + 1}</button>`).join('')}</div>
          <div class="h3" style="text-align:center;min-height:22px" id="qlab">${v ? DATA.scale[v - 1] : ''}</div>
          <div class="b13" style="text-align:center">Rispondi d'istinto: conta come ti senti oggi.</div>`,
        cta: `<div class="btn${v ? '' : ' off'}" id="dnext" data-act="next">${k + 1 < CFG.perDay ? 'Avanti' : 'Fine'}</div><div class="btn ghost" data-act="later">Più tardi</div>`
      };
    },
    actions: {
      ans(el) {
        const t = today(), k = App.current.p.k || 0, code = t.items[k], v = +el.dataset.v;
        D().log[t.k].answers[code] = { v, ms: Date.now() - shownAt, at: Date.now() }; save(); App.buzz();
        document.querySelectorAll('.lik button').forEach(b => { const on = +b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
        document.querySelector('.lik').classList.add('has'); document.getElementById('qlab').textContent = DATA.scale[v - 1];
        document.getElementById('dnext').classList.remove('off');
        if (S().auto) App.later(() => App.screens.daily.actions.next(), 550);
      },
      next() {
        const t = today(), k = App.current.p.k || 0; if (App.current.name !== 'daily' || !t.answers[t.items[k]]) return;
        if (k + 1 < CFG.perDay) return App.replace('daily', { k: k + 1 });
        D().log[t.k].done = true; save();
        const first = !S().dailyPts || !S().dailyPts.includes(t.k);
        if (first) { (S().dailyPts = S().dailyPts || []).push(t.k); Store.addPoints(CFG.pts); }
        App.replace('dailyDone', { pts: first ? CFG.pts : 0 });
      },
      later() { App.actions.dailyLater(); App.reset(['home']); }
    }
  });

  /* ---------- fatto per oggi: confronto con il questionario ---------- */
  App.screen('dailyDone', {
    top: 'main', nav: true,
    render(p) {
      const t = today(), demo = !!document.getElementById('side');
      return {
        cnStyle: 'align-items:center',
        html: `<div style="height:20px;flex:none"></div><div class="okc">${ic('check', { size: 48, color: '#fff', sw: 2.6 })}</div>
          <div class="h1" style="align-self:center">Fatto per oggi</div>
          <div class="b17" style="text-align:center">Giorno ${t.idx + 1} di ${CFG.days}. Domani ti riproponiamo altre ${CFG.perDay} domande.</div>
          ${p.pts ? `<span class="pl bl">+${p.pts} punti</span>` : ''}
          <div class="card" style="gap:12px"><div class="h3">Oggi e al questionario</div>
            ${t.items.map(c => { const q = qOf(c), a = (t.answers[c] || {}).v, b = S().answers[c]; return `<div style="display:flex;flex-direction:column;gap:6px"><div class="b15" style="color:#000">${esc(q.text)}</div>
              <div class="rw" style="gap:8px"><span class="pl gr">Questionario ${b || '—'}</span>${ic('chev', { size: 14, color: '#9AA3AF', sw: 2 })}<span class="pl bl">Oggi ${a}</span>${b && a !== b ? `<span class="b13">${a > b ? '+' : '−'}${Math.abs(a - b)}</span>` : '<span class="b13">uguale</span>'}</div></div>`; }).join('<div class="sep"></div>')}</div>
          ${demo ? `<button class="link" data-act="nextDay">Simula il giorno dopo (solo demo)</button>` : ''}`,
        cta: `<div class="btn" data-act="home">Torna alla home</div>`
      };
    },
    actions: {
      home() { App.reset(['home']); },
      nextDay() { S().dayOffset = (S().dayOffset || 0) + 1; save(); try { sessionStorage.removeItem('centro_daily_' + today().k); } catch (e) { } App.reset(['home']); App.toast('È il giorno dopo (simulato)'); Daily.prompt(); }
    }
  });

  /* ---------- in Statistiche: quanto variano le risposte nel tempo ---------- */
  window.Daily.statsCard = function () {
    const log = D().log, days = Object.values(log).filter(x => Object.keys(x.answers).length);
    if (!days.length) return Sec.card({ id: 'time', icon: 'calendar', title: 'Risposte nel tempo', sub: 'Si riempie con le domande del giorno',
      body: `<div class="b15">Ogni giorno, per ${CFG.days} giorni, ti riproponiamo ${CFG.perDay} domande del questionario. Qui vedrai quanto cambiano le tue risposte.</div>` });
    const per = {};
    days.forEach(x => Object.entries(x.answers).forEach(([c, a]) => (per[c] = per[c] || []).push({ v: a.v, idx: x.idx })));
    const rows = Object.entries(per).map(([c, l]) => {
      const base = S().answers[c], vals = l.map(x => x.v), all = base ? [base].concat(vals) : vals;
      const mean = all.reduce((s, v) => s + v, 0) / all.length, sd = Math.sqrt(all.reduce((s, v) => s + (v - mean) ** 2, 0) / all.length);
      return { c, l, base, sd };
    }).sort((a, b) => b.sd - a.sd);
    const avg = rows.reduce((s, r) => s + r.sd, 0) / rows.length;
    const lv = avg < .5 ? ['ok', 'Stabili'] : avg < 1 ? ['at', 'Abbastanza stabili'] : ['di', 'Molto variabili'];
    return Sec.card({ id: 'time', icon: 'calendar', title: 'Risposte nel tempo', sub: `${days.length} giorni su ${CFG.days} · ${rows.length} domande ripetute`, open: true,
      body: `<div class="rw" style="justify-content:space-between"><span class="b15">Variazione media</span><span class="pl ${lv[0]}">±${avg.toFixed(1).replace('.', ',')} · ${lv[1]}</span></div>
        ${rows.slice(0, 5).map(r => `<div style="display:flex;flex-direction:column;gap:6px"><div class="b15" style="color:#000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(qOf(r.c).text)}</div>
          <div class="dline">${r.base ? `<i class="q" title="Questionario">${r.base}</i>` : ''}${r.l.map(x => `<i style="background:${DATA.scaleColors[x.v - 1]}" title="Giorno ${x.idx + 1}">${x.v}</i>`).join('')}</div></div>`).join('')}
        <div class="b13">Il primo numero (bordato) è la risposta al questionario, poi un pallino per ogni giorno. Risposte stabili = l'item misura bene.</div>` });
  };
})();
