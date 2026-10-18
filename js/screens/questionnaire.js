/* 1a · Questionario demo (10 domande, 2 quartieri) con la città che cresce + sommario a 5 schede */
(function () {
  const esc = App.esc, S = () => Store.s;
  const Q = () => Store.allQs();
  const blk = id => DATA.blocks.find(b => b.id === id);
  const pill = t => `<span class="gl">${t}</span>`;

  /* ---------- 4 · Intro blocco ---------- */
  App.screen('qintro', {
    top: (p, t) => t.back + pill(`Domande ${Store.answered()}/${Q().length}`),
    render(p) {
      const b = blk(p.b), min = Math.max(1, Math.round(b.qs.length * 9 / 60));
      return {
        hero: City(),
        html: `<div class="b15" style="align-self:flex-start;padding:0 4px;color:#BB2DCE;font-weight:700;letter-spacing:.5px">QUARTIERE ${b.n}</div>
          <div class="h1">${b.title}</div>
          <div class="b17" style="padding:0 4px;margin-top:-6px">${b.intro}</div>
          <div style="display:flex;gap:8px;padding:0 4px"><span class="chip sm">${b.qs.length} domande</span><span class="chip sm">~${min} minut${min > 1 ? 'i' : 'o'}</span></div>`,
        cta: `<div class="btn" data-act="start">Inizia il blocco</div>`
      };
    },
    actions: {
      start() {
        const b = blk(App.current.p.b), all = Q();
        let i = all.findIndex(q => q.blk === b.id && S().answers[q.code] == null);
        if (i < 0) i = all.findIndex(q => q.blk === b.id);
        App.go('q', { i });
      }
    }
  });

  /* ---------- 5 · Domanda ---------- */
  let shownAt = 0;
  App.screen('q', {
    top(p, t) {
      const q = Q()[p.i], b = blk(q.blk), k = b.qs.findIndex(x => x.code === q.code) + 1;
      return t.back + pill(`${k} / ${b.qs.length}`) + `<span class="gl" style="width:46px;padding:0" data-act="qset" aria-label="Opzioni">${ic('sliders')}</span>`;
    },
    render(p) {
      const q = Q()[p.i], v = S().answers[q.code];
      shownAt = Date.now();
      return {
        hero: City({ current: v == null ? q.code : null }),
        html: q.type === 'choice' ? `<div class="h1n qtxt" style="padding:0 4px;font-size:28px;line-height:36px">${esc(q.text)}</div>
          <div class="b15" style="padding:0 4px">Scegli una risposta: qui non ci sono vie di mezzo.</div>
          ${q.opts.map((o, i) => `<div class="opt2${v === i + 1 ? ' on' : ''}" data-act="ans" data-v="${i + 1}" role="radio" aria-checked="${v === i + 1}"><div class="tx"><div class="h3">${esc(o)}</div></div><div class="ck">${v === i + 1 ? ic('check', { size: 16, color: '#fff', sw: 2.6 }) : ''}</div></div>`).join('')}`
          : `<div class="h1n qtxt" style="padding:0 4px;font-size:28px;line-height:36px">${esc(q.text)}</div>
          <div style="height:10px;flex:none"></div>
          <div style="width:100%;display:flex;justify-content:space-between" class="b15"><span>Per niente</span><span>Moltissimo</span></div>
          <div class="lik${v ? ' has' : ''}" role="radiogroup">${DATA.scaleColors.map((c, i) => `<button role="radio" aria-checked="${v === i + 1}" aria-label="${DATA.scale[i]}" class="${v === i + 1 ? 'on' : ''}" style="background:${c}" data-act="ans" data-v="${i + 1}">${i + 1}</button>`).join('')}</div>
          <div class="h3" style="text-align:center;min-height:22px" id="qlab">${v ? DATA.scale[v - 1] : ''}</div>
          <div class="b13" style="text-align:center">${S().auto ? 'Avanza da sola tra mezzo secondo · tocca per cambiare' : 'Scegli un valore, poi «Avanti»'}</div>`,
        cta: `<div class="btn${v ? '' : ' off'}" data-act="next" id="qnext">${p.edit ? 'Salva' : 'Avanti'}</div>`
      };
    },
    actions: {
      ans(el) {
        const p = App.current.p, q = Q()[p.i], v = +el.dataset.v, first = S().answers[q.code] == null;
        S().answers[q.code] = v; S().times[q.code] = Date.now() - shownAt; Store.save();
        App.buzz();
        if (q.type === 'choice') document.querySelectorAll('.opt2').forEach(b => { const on = +b.dataset.v === v; b.classList.toggle('on', on); b.querySelector('.ck').innerHTML = on ? ic('check', { size: 16, color: '#fff', sw: 2.6 }) : ''; });
        else {
          document.querySelectorAll('.lik button').forEach(b => { b.classList.toggle('on', +b.dataset.v === v); b.setAttribute('aria-checked', +b.dataset.v === v); });
          document.querySelector('.lik').classList.add('has');
          document.getElementById('qlab').textContent = DATA.scale[v - 1];
        }
        document.getElementById('qnext').classList.remove('off');
        /* l'edificio sale */
        const hero = document.querySelector('#view .city');
        if (hero) hero.outerHTML = City({ fresh: first ? q.code : null });
        if (S().auto) { clearTimeout(this._t); this._t = App.later(() => advance(), 550); }
      },
      next() { advance(); },
      qset() {
        App.sheet(`<div class="h2" style="padding:4px 4px 0">Opzioni del questionario</div>
          <div class="card" style="flex-direction:row;align-items:center;gap:12px"><div class="tx"><div class="h3">Avanzamento automatico</div><div class="b15">Passa alla domanda successiva dopo ~0,5 s</div></div>
          <button class="toggle${S().auto ? ' on' : ''}" data-act="autoT" aria-label="Avanzamento automatico"></button></div>
          <div class="card tap" style="flex-direction:row;align-items:center;gap:12px" data-act="fillR"><div class="tx"><div class="h3">Rispondi a caso</div><div class="b15">Solo per la demo: compila le domande mancanti</div></div>${ic('chev', { size: 16, color: '#CCD2D9', sw: 2 })}</div>
          <div class="btn g" data-act="closeOv">Chiudi</div>`);
      },
      autoT(el) { S().auto = !S().auto; Store.save(); el.classList.toggle('on', S().auto); },
      fillR() { Store.fillRandom(); App.closeOv(); App.go('summary'); }
    }
  });
  function advance() {
    const p = App.current.p; if (App.current.name !== 'q') return;
    const all = Q(), q = all[p.i];
    if (S().answers[q.code] == null) return;
    if (p.edit) return App.back();
    const nx = all[p.i + 1];
    if (!nx || nx.blk !== q.blk) {
      if (Store.blockAnswered(q.blk) < blk(q.blk).qs.length) {   // domande saltate nel blocco
        const miss = all.findIndex(x => x.blk === q.blk && S().answers[x.code] == null); return App.go('q', { i: miss });
      }
      return App.go('qdone', { b: q.blk });
    }
    App.go('q', { i: p.i + 1 });
  }

  /* ---------- 6 · Blocco completato ---------- */
  App.screen('qdone', {
    top: (p, t) => t.back + pill(`${blk(p.b).qs.length} / ${blk(p.b).qs.length}`),
    render(p) {
      const b = blk(p.b), last = DATA.blocks[DATA.blocks.length - 1].id === b.id;
      return {
        hero: City(),
        cnStyle: 'align-items:center',
        html: `<div style="width:84px;height:84px;border-radius:50%;background:#489DFE;display:flex;align-items:center;justify-content:center;margin-top:-6px;animation:popin .5s cubic-bezier(.3,1.5,.5,1)">${ic('check', { size: 44, color: '#fff', sw: 2.6 })}</div>
          <div class="h1" style="align-self:center;text-align:center">${last ? 'Città completata' : 'Quartiere completato'}</div>
          <div class="h3">${b.title}</div>
          <div class="b17" style="text-align:center">${b.done}</div>
          <span class="chip sm" style="width:100%;justify-content:center">Domande ${Store.answered()} / ${Q().length}</span>`,
        cta: last ? `<div class="btn" data-go="summary">Scopri il tuo profilo</div>` : `<div class="btn" data-act="nextB">Prossimo blocco</div>`
      };
    },
    actions: {
      nextB() { const i = DATA.blocks.findIndex(b => b.id === App.current.p.b); App.go('qintro', { b: DATA.blocks[i + 1].id }); }
    }
  });

  /* ---------- 7 · Sommario questionario (5 schede) ---------- */
  const TABS = ['Profilo', 'Casa', 'Interessi', 'Risposte', 'Qualità'];
  window.Summary = { TABS, radar, traitBar, tabBody };
  function radar(b5) {
    const keys = Object.keys(b5), cx = 160, cy = 108, R = 72;
    const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / keys.length; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    const poly = r => keys.map((k, i) => pt(i, r).map(n => n.toFixed(1)).join(',')).join(' ');
    let s = `<svg width="100%" height="220" viewBox="-24 0 368 220">`;
    [.33, .66, 1].forEach(f => s += `<polygon points="${poly(R * f)}" fill="none" stroke="#E3E3EA"/>`);
    s += `<polygon points="${keys.map((k, i) => pt(i, R * b5[k] / 100).map(n => n.toFixed(1)).join(',')).join(' ')}" fill="rgba(72,157,254,.25)" stroke="#489DFE" stroke-width="2.5" stroke-linejoin="round" style="transition:all .4s"/>`;
    keys.forEach((k, i) => { const [x, y] = pt(i, R + 16), an = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end'; s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" font-size="12" font-weight="700" font-family="DM Sans" fill="#4D4D4D" text-anchor="${an}">${k}</text>`; });
    return s + '</svg>';
  }
  function traitBar(a, b, v) {
    return `<div style="width:100%;display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between" class="b15"><span>${a}</span><span>${b}</span></div>
      <div class="tone" style="background:#EEEEF2"><i style="position:absolute;left:${v}%;top:-4px;width:24px;height:24px;margin-left:-12px;border-radius:50%;background:#489DFE;border:3px solid #fff;box-shadow:0 0 6px rgba(72,157,254,.5);box-sizing:border-box"></i></div></div>`;
  }
  function tabBody(t, ctx) {
    const pr = Store.profile();
    if (t === 'Profilo') return `<div class="card"><div class="h2">Il tuo profilo</div><div style="align-self:stretch">${radar(pr.big5)}</div>
        <div class="b13">Versione di prova: con 10 domande il profilo è solo indicativo.</div></div>
      <div class="card"><div class="h3">Tratti più marcati</div>${pr.traits.map(x => traitBar(x.a, x.b, x.v)).join('')}</div>`;
    if (t === 'Casa') {
      const qs = DATA.blocks[1].qs.filter(q => q.type !== 'choice'), fu = c => { const q = DATA.blocks[1].qs.find(x => x.code === c), v = S().answers[c]; return v ? q.opts[v - 1] : '—'; };
      return `<div class="card"><div class="h2">Come vivi in casa</div><div class="b15">Dove ti collochi su ogni tema della convivenza. Servirà per il match con i coinquilini.</div>
        ${qs.map(q => traitBar(q.A, q.B, ((S().answers[q.code] || 3) - 1) * 25 * .9 + 5).replace('<div style="width:100%;display:flex;flex-direction:column;gap:6px">', `<div style="width:100%;display:flex;flex-direction:column;gap:6px"><div class="h3" style="font-size:15px">${q.area}</div>`)).join('')}
        <div class="gy" style="gap:6px"><div class="h3" style="font-size:15px">Fumo · scelta secca</div><div class="b15">Tu: <b style="color:#000">${esc(fu('FU1'))}</b></div><div class="b15">Accetti: <b style="color:#000">${esc(fu('FU2'))}</b></div></div></div>`;
    }
    if (t === 'Interessi') {
      const a = c => S().answers[c] || 3;
      const sc = { Sport: a('E1') + a('SA2') * .5, Musica: a('O3') + a('VO3') * .5, Cucina: a('OS3') + a('PR1') * .4, Arte: a('O3') * 1.2, Giochi: a('SA2') + a('OS3') * .4, Natura: a('O3') * .6 + (6 - a('PR1')) * .6, Cinema: a('PR1') * .7 + a('VO3') * .4, Lettura: (6 - a('E1')) * .6 + a('C1') * .5 };
      const top = Object.entries(sc).sort((x, y) => y[1] - x[1]);
      const max = top[0][1];
      return `<div class="card"><div class="h2">I tuoi interessi</div><div class="b15">Stimati dalle risposte: nel questionario completo li indichi direttamente.</div>
        ${top.map(([k, v], i) => `<div class="rw"><span class="b17" style="width:84px;color:#000">${k}</span><div class="bar" style="flex:1"><i style="width:${Math.round(v / max * 100)}%;${i > 2 ? 'background:#C9DDF5' : ''}"></i></div></div>`).join('')}</div>`;
    }
    if (t === 'Risposte') {
      return `<div class="card" style="gap:6px"><div class="h2">Le tue risposte</div><div class="b15">Tocca una risposta per cambiarla.</div>
        ${Q().map((q, i) => { const v = S().answers[q.code]; return `<div class="rw tap" style="padding:10px 0;border-top:1px solid #EEEEF2;cursor:pointer" data-go="q" data-p='{"i":${i},"edit":1}'>
          <div class="tx"><div class="b15" style="color:#000">${esc(q.text)}</div></div>
          ${q.type === 'choice' ? `<span class="pl ${v ? 'bl' : 'gr'}" style="white-space:normal;height:auto;padding:4px 10px;max-width:46%;text-align:right">${v ? esc(q.opts[v - 1]) : '—'}</span>`
            : `<span class="pl ${v ? 'bl' : 'gr'}" style="${v ? `background:${DATA.scaleColors[v - 1]}22;color:${DATA.scaleColors[v - 1]}` : ''}">${v ? v + ' · ' + DATA.scale[v - 1] : '—'}</span>`}</div>`; }).join('')}</div>`;
    }
    const ql = Store.quality(), lvl = ql.score >= 75 ? ['ok', 'Affidabili'] : ql.score >= 50 ? ['at', 'Da verificare'] : ['di', 'Poco affidabili'];
    return `<div class="card"><div class="h2">Qualità delle risposte</div>
      <div style="display:flex;align-items:center;gap:16px">${ring(ql.score, 84, 6)}<div><div class="h1n" style="font-size:38px;line-height:42px">${ql.score}</div><span class="pl ${lvl[0]}">${lvl[1]}</span></div></div>
      <div class="gy" style="padding:12px 14px;gap:8px">
        <div class="rw" style="justify-content:space-between"><span class="b17">Tempo medio</span><b class="h3">${ql.avg ? ql.avg.toFixed(1).replace('.', ',') + ' s' : '—'}</b></div>
        <div class="rw" style="justify-content:space-between"><span class="b17">Risposte troppo rapide</span><b class="h3">${ql.fast}</b></div>
        <div class="rw" style="justify-content:space-between"><span class="b17">Risposte neutre</span><b class="h3">${ql.neutral} / ${ql.n}</b></div>
        <div class="rw" style="justify-content:space-between"><span class="b17">Valori diversi usati</span><b class="h3">${ql.distinct} / 5</b></div></div>
      <div class="b13">Indicatori calcolati come in score.js (versione semplificata). Servono al team per pesare le tue risposte.</div></div>`;
  }

  App.screen('summary', {
    top: (p, t) => t.back + (p.view ? '' : `<span class="gl" data-act="go">Fine</span>`),
    render(p) {
      const t = p.tab || 'Profilo';
      return {
        hero: p.view ? '' : City(),
        cls: p.view ? '' : 'sum-hero',
        html: `${p.view ? '<div class="h1">Il tuo questionario</div>' : `<div class="steps">${[1,2,3,4,5,6].map(i => `<i class="${i <= 4 ? 'on' : ''}"></i>`).join('')}</div><div class="b15" style="align-self:flex-start;padding:0 4px">Passo 4 di 6 · Il tuo risultato</div>`}
          <div class="tabs" id="sumTabs">${TABS.map(x => `<span class="chip sm${x === t ? ' on' : ''}" data-act="tab" data-t="${x}">${x}</span>`).join('')}</div>
          <div id="sumBody" style="display:contents">${tabBody(t)}</div>`,
        cta: p.view ? '' : `<div class="btn" data-act="go">Continua</div>`
      };
    },
    actions: {
      tab(el) { App.current.p.tab = el.dataset.t; App.refresh(); },
      go() { App.go('profileSetup'); }
    }
  });
})();
