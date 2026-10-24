/* Dashboard: lo stato del test in un colpo d'occhio, con gli avvisi che chiedono attenzione. */
(function () {
  const { fmt, pct } = St;
  A.page('dashboard', {
    title: 'Dashboard', crumb: 'Panoramica del test',
    render() {
      const S = A.S, D = A.D, s = AStore.s, ic = A.ic;
      const active = D.users.filter(u => u.status === 'Attivo').length, last = S.daily[S.daily.length - 1], prev = S.daily[S.daily.length - 8] || S.daily[0];
      const greet = new Date().getHours() < 13 ? 'Buongiorno' : new Date().getHours() < 18 ? 'Buon pomeriggio' : 'Buonasera';
      /* avvisi calcolati */
      const al = [];
      const weak = S.items.filter(i => i.verdict[0] === 'crit');
      if (weak.length) al.push(['crit', `${weak.map(i => i.code).join(', ')}: ${weak.length > 1 ? 'domande che misurano' : 'domanda che misura'} poco il costrutto`, 'Punteggio di efficacia sotto 45. Valuta di riscriverla.', 'analysis/items']);
      const lowA = S.constructs.filter(c => c.alpha < .7);
      lowA.forEach(c => al.push(['warn', `Attendibilità ${c.name.toLowerCase()} ${fmt(c.alpha)}`, 'Sotto la soglia di 0,70: le domande del costrutto non vanno d\'accordo tra loro.', 'analysis/reliability']));
      if (S.quality.low.length) al.push(['warn', `${S.quality.low.length} tester con risposte poco affidabili`, 'Risposte troppo veloci o tutte uguali. Puoi escluderli dalle analisi.', 'analysis/quality']);
      const openR = D.reports.filter(r => (s.reports[r.code] || 'aperta') !== 'chiusa');
      if (openR.length) al.push(['crit', `${openR.length} segnalazion${openR.length > 1 ? 'i' : 'e'} da gestire`, 'Feedback negativi sugli host con codice pratica.', 'reports']);
      if (Math.abs(S.thrBest.t - s.settings.threshold) >= 10) al.push(['brand', `Soglia «Affini» consigliata: ${S.thrBest.t}`, `Oggi è ${s.settings.threshold}. Con ${S.thrBest.t} il feed bilancia meglio precisione e varietà.`, 'analysis/feed']);
      if (S.pred.r >= .3) al.push(['good', 'Il questionario prevede i gusti', `Correlazione affinità–voto r = ${fmt(S.pred.r)} su ${S.pred.n} voti.`, 'analysis/validity']);
      const days = S.daily.map(d => d.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }));
      const evts = [];
      D.users.forEach(u => { u.ratings.slice(-2).forEach(r => evts.push({ t: D.dayDate(r.day).getTime() + (u.i * 37 % 600) * 6e4, u, txt: `ha votato <b>${A.esc(r.title)}</b> ${'★'.repeat(r.v)}` })); });
      D.parts.filter(p => p.post).slice(-30).forEach(p => { const u = A.user(p.user), a = D.byId[p.act]; evts.push({ t: D.dayDate(p.day + 1).getTime() + (u.i * 53 % 500) * 6e4, u, txt: `ha lasciato un feedback su <b>${A.esc(a.title)}</b>` }); });
      evts.sort((a, b) => b.t - a.t);
      return `
      <div class="row sb"><div><div class="serif" style="font-size:22px">${greet}, ${A.esc(s.admin.name.split(' ')[0])}</div><div class="muted">Test in corso da ${D.DAYS} giorni · aggiornato ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div></div>
        <div class="row"><button class="btn s" data-nav="messages">${ic('send', 16)}Scrivi ai tester</button><button class="btn" data-nav="content/new">${ic('plus', 16)}Nuovo contenuto</button></div></div>
      <div class="grid g6">
        ${A.metric({ k: 'Partecipanti', v: S.nAll, sub: `+${last.joined - prev.joined} negli ultimi 7 giorni` })}
        ${A.metric({ k: 'Attivi', v: active, sub: `${pct(active / S.nAll)} · ultimi 3 giorni` })}
        ${A.metric({ k: 'Questionari', v: pct(S.nQ / S.nAll), sub: `${S.nQ} completati` })}
        ${A.metric({ k: 'Voti raccolti', v: S.nRatings.toLocaleString('it-IT'), sub: `${S.nDeep} approfonditi` })}
        ${A.metric({ k: 'Attendibilità', v: fmt(S.alphaMean), verdict: St.V.alpha(S.alphaMean), sub: 'α di Cronbach medio dei costrutti' })}
        ${A.metric({ k: 'Validità predittiva', v: fmt(S.pred.r), verdict: S.pred.verdict, sub: 'affinità ↔ voto' })}
      </div>
      <div class="grid g3">
        <div class="card span2"><div class="card-h"><div><h3>Iscritti e attivi</h3><div class="sub">Persone ogni giorno del test</div></div><span class="sp"></span>${Ch.legend([['var(--s1)', 'Iscritti totali', 1], ['var(--s2)', 'Attivi nel giorno', 1]])}</div>
          ${Ch.line({ labels: days, every: 2, series: [{ name: 'Iscritti totali', color: 'var(--s1)', values: S.daily.map(d => d.joined), area: true }, { name: 'Attivi nel giorno', color: 'var(--s2)', values: S.daily.map(d => d.active) }] })}</div>
        <div class="card"><h3>Cosa richiede attenzione</h3>
          <div class="stack">${al.map(([c, t, d, go]) => `<button class="interp ${c === 'brand' ? '' : c}" style="text-align:left" data-nav="${go}"><b>${t}</b><br><span class="ink2">${d}</span></button>`).join('') || '<div class="empty">Nessun avviso.</div>'}</div></div>
      </div>
      <div class="grid g3">
        <div class="card"><h3>Percorso dei tester</h3><div class="sub">Quanti arrivano a ogni tappa</div>
          ${Ch.hbars({ data: S.funnel.map(([l, v]) => ({ label: l, value: v, extra: pct(v / S.funnel[0][1]), tip: `<b>${v}</b> tester<div class="muted">${l} · ${pct(v / S.funnel[0][1])} degli iscritti</div>` })), lw: 230, max: S.funnel[0][1] })}</div>
        <div class="card"><h3>Voto medio per posizione nel feed</h3><div class="sub">Se il questionario funziona, i primi suggerimenti piacciono di più</div>
          ${Ch.bars({ data: S.byRank.map(b => ({ label: b.label, value: b.m, tip: `<b>${fmt(b.m)}</b> voto medio<div class="muted">Posizioni ${b.label} · ${b.n} voti</div>` })), yFmt: v => fmt(v, 1), max: 5, min: 1, ref: St.mean(S.byRank.map(b => b.m)), refLabel: 'media' })}</div>
        <div class="card"><h3>Stato dei partecipanti</h3><div class="sub">Clicca per vedere l'elenco</div>
          ${Ch.hbars({ data: S.status.map(([l, v], i) => ({ label: l, value: v, color: ['var(--good)', 'var(--warn)', 'var(--crit)', 'var(--s1)', 'var(--ink-3)'][i] })), lw: 130 })}
          <div class="row" style="flex-wrap:wrap">${S.status.map(([l]) => `<button class="chip" data-act="peopleStatus" data-v="${l}">${l}</button>`).join('')}</div></div>
      </div>
      <div class="grid g2">
        <div class="card"><div class="card-h"><h3>Ultime attività</h3><span class="sp"></span><button class="btn g sm" data-nav="people">Tutti i partecipanti</button></div>
          <div class="stack">${evts.slice(0, 7).map(e => `<div class="row" style="cursor:pointer" data-act="openUser" data-id="${e.u.id}">${A.av(e.u, 30)}<div style="flex:1;min-width:0"><b>${A.esc(e.u.name)}</b> <span class="ink2">${e.txt}</span></div><span class="muted" style="font-size:12px">${A.dt(e.t)}</span></div>`).join('')}</div></div>
        <div class="card"><div class="card-h"><h3>Domande più efficaci</h3><span class="sp"></span><button class="btn g sm" data-nav="analysis/items">Analisi delle domande</button></div><div class="sub">Quanto ogni domanda misura il suo costrutto (0–100)</div>
          ${Ch.hbars({ data: S.items.map(i => ({ label: i.code + ' · ' + i.cname, value: i.score, color: i.verdict[0] === 'good' ? 'var(--s1)' : i.verdict[0] === 'warn' ? 'var(--warn)' : 'var(--crit)', tip: `<b>${i.score}/100 · ${i.verdict[1]}</b><div class="muted">${A.esc(i.text)}</div>` })), max: 100, lw: 170, rowH: 26 })}</div>
      </div>`;
    }
  });
  A.acts.peopleStatus = el => { A.q.status = el.dataset.v; A.go('people'); };
})();
