/* Analisi statistica: tutto calcolato in automatico sui tester inclusi.
   Ogni scheda dice cosa misura, il numero, il verdetto e cosa fare. */
(function () {
  const { fmt, pct, V } = St, esc = A.esc;
  const TABS = [['reliability', 'Attendibilità'], ['validity', 'Validità'], ['drift', 'Deviazione dal costrutto'], ['items', 'Domande'], ['reviews', 'Recensioni'], ['quality', 'Qualità dati'], ['feed', 'Feed e soglia'], ['community', 'Community'], ['house', 'Match casa']];
  const intro = (t, d) => `<div class="note" style="font-size:13.5px"><b style="color:var(--ink)">${t}</b> ${d}</div>`;
  const interp = (cls, html) => `<div class="interp ${cls}">${html}</div>`;
  const card = (t, sub, body, cls = '') => `<div class="card ${cls}"><h3>${t}</h3>${sub ? `<div class="sub">${sub}</div>` : ''}${body}</div>`;
  const vcls = v => v[0] === 'good' ? 'good' : v[0] === 'warn' ? 'warn' : 'crit';

  const R = {
    reliability(S) {
      const c = S.constructs, rt = S.retest;
      return intro('L\'attendibilità dice se il test misura in modo coerente e stabile.', 'Coerenza interna: le domande dello stesso costrutto devono andare d\'accordo (α di Cronbach). Stabilità: rispondendo di nuovo alla stessa domanda nei giorni dopo, la risposta deve restare simile (test-retest).') + `
      <div class="grid g4">
        ${A.metric({ k: 'α medio dei costrutti', v: fmt(S.alphaMean), verdict: V.alpha(S.alphaMean), say: `Su tutti i 10 item insieme α = ${fmt(S.alphaAll)}: è normale che sia più basso, perché misurano costrutti diversi`, how: 'α = k/(k−1) · (1 − Σσ²ᵢ / σ²ₜₒₜ)' })}
        ${c.map(x => A.metric({ k: 'α ' + x.name, v: fmt(x.alpha), verdict: x.verdict, say: `${x.items.length} item · errore di misura ±${fmt(x.sem, 1)} punti`, how: 'SEM = σ · √(1 − α)' })).join('')}
        ${A.metric({ k: 'Test-retest medio', v: fmt(S.retestAvg), verdict: V.retest(S.retestAvg), say: 'Questionario vs domande del giorno', how: 'r di Pearson tra prima e seconda risposta' })}
      </div>
      <div class="grid g2">
        ${card('Contributo di ogni item alla coerenza', 'Correlazione item-resto e α se l\'item viene tolto', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Costrutto</th><th>Item</th><th class="num">r item-resto</th><th class="num">α senza item</th><th>Giudizio</th></tr></thead><tbody>
          ${c.flatMap(x => x.items.map(i => `<tr><td>${x.name}</td><td><b>${i.code}</b>${i.sign < 0 ? ' <span class="muted">(invertito)</span>' : ''}</td><td class="num">${fmt(i.itot)}</td><td class="num" style="${i.aid > x.alpha + .01 ? 'color:var(--crit);font-weight:700' : ''}">${fmt(i.aid)}</td><td>${A.badge(V.itot(i.itot))}</td></tr>`)).join('')}</tbody></table></div>
          ${(() => { const bad = c.flatMap(x => x.items.filter(i => i.aid > x.alpha + .01).map(i => [i, x])); return bad.length ? interp('warn', bad.map(([i, x]) => `Togliendo <b>${i.code}</b> l'α di ${x.name.toLowerCase()} salirebbe da ${fmt(x.alpha)} a <b>${fmt(i.aid)}</b>: la domanda misura altro.`).join('<br>')) : interp('good', 'Nessun item abbassa la coerenza del suo costrutto.'); })()}`)}
        ${card('Stabilità nel tempo per item', 'Correlazione tra risposta nel questionario e risposta nelle domande del giorno', Ch.bars({ data: rt.map(x => ({ label: x.code, value: Math.max(0, x.r), color: x.r >= .7 ? 'var(--s1)' : x.r >= .5 ? 'var(--warn)' : 'var(--crit)', tip: `<b>r = ${fmt(x.r)} · ${x.verdict[1]}</b><div class="muted">${x.code} · ${x.n} coppie<br>Identica ${pct(x.same)} · entro 1 punto ${pct(x.near)}</div>` })), max: 1, yFmt: v => fmt(v, 1), ref: .7, refLabel: 'soglia 0,70' }) + `<div class="muted" style="font-size:12px">Blu stabile, giallo abbastanza stabile, rosso instabile.</div>`)}
      </div>
      ${card('Correlazioni tra le domande', 'Domande dello stesso costrutto dovrebbero correlare tra loro (blu). Rosso: relazione inversa, come per gli item invertiti.', `<div class="row" style="align-items:flex-start;gap:28px">${Ch.heat({ labels: A.D.ITEMS.map(i => i.code), m: S.corrMatrix })}<div class="stack" style="max-width:320px">${Ch.legend([['var(--div-neg)', 'Correlazione negativa'], ['var(--div-mid)', 'Nessuna'], ['var(--div-pos)', 'Correlazione positiva']])}
        <div class="note">Costrutti: <b>Socialità</b> E1, SA2, OS3, VO3 · <b>Organizzazione</b> C1, CS2, SP2 (invertito) · <b>Apertura</b> O3 · <b>Casa</b> PR1 · <b>Ritmo</b> OB1.</div>
        <div class="muted" style="font-size:12px">Passa sulle celle per leggere il valore esatto.</div></div></div>`)}`;
    },

    validity(S) {
      const p = S.pred, a = S.affVsAll;
      return intro('La validità dice se il test misura davvero quello che deve misurare.', 'Predittiva: l\'affinità calcolata dal questionario deve prevedere quanto un contenuto piacerà. Convergente: il carattere dichiarato deve ritrovarsi nel comportamento nell\'app.') + `
      <div class="grid g4">
        ${A.metric({ k: 'Affinità ↔ voto', v: fmt(p.r), verdict: p.verdict, say: `Su ${p.n.toLocaleString('it-IT')} voti · ${V.p(p.p)}`, how: `r di Pearson · IC 95% ${fmt(p.ci[0])} – ${fmt(p.ci[1])} · ρ di Spearman ${fmt(p.rho)}` })}
        ${A.metric({ k: 'Affini vs Tutti', v: 'd = ' + fmt(a.d), verdict: a.verdict, say: `Voto medio ${fmt(a.mA, 2)} contro ${fmt(a.mT, 2)}`, how: `d di Cohen · t di Welch ${fmt(a.test.t, 1)}, ${V.p(a.test.p)}` })}
        ${A.metric({ k: 'Precisione top 3', v: pct(S.prec3), verdict: S.lift >= 1.3 ? ['good', 'Utile'] : S.lift >= 1.1 ? ['warn', 'Poco utile'] : ['crit', 'Inutile'], say: `I primi 3 suggerimenti piacciono (voto ≥ 4) nel ${pct(S.prec3)} dei casi, gli altri nel ${pct(S.base)}`, how: `lift = ${fmt(S.lift)}× rispetto al caso` })}
        ${A.metric({ k: 'Coerenza voto rapido ↔ approfondito', v: fmt(S.deepAgree), verdict: V.r(S.deepAgree), say: 'Le stelle date al volo concordano con le domande di approfondimento', how: `${S.nDeep} voti approfonditi` })}
      </div>
      <div class="grid g2">
        ${card('Voto medio per fascia di affinità', 'Se il questionario funziona, la curva sale: più affinità, voti più alti. Barre: intervallo di confidenza al 95%.', Ch.dotci({ data: S.byAff }))}
        ${card('Voto medio per posizione nel feed', 'Primo suggerimento in alto a sinistra', Ch.bars({ data: S.byRank.map(b => ({ label: b.label, value: b.m, tip: `<b>${fmt(b.m)}</b><div class="muted">posizioni ${b.label} · ${b.n} voti</div>` })), max: 5, min: 1, yFmt: v => fmt(v, 1) }))}
      </div>
      ${card('Validità convergente', 'Ogni costrutto confrontato con un comportamento osservato che dovrebbe andargli dietro', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Costrutto dichiarato</th><th>Comportamento osservato</th><th>Atteso</th><th class="num">r</th><th class="num">n</th><th class="num">p</th><th>Esito</th></tr></thead><tbody>
        ${S.convergent.map(c => `<tr><td><b>${c.label}</b></td><td>${c.crit}</td><td>${c.expect === '+' ? 'positivo' : 'negativo'}</td><td class="num">${fmt(c.r)}</td><td class="num">${c.n}</td><td class="num">${V.p(c.p)}</td><td>${c.ok ? A.badge([Math.abs(c.r) >= .3 ? 'good' : 'warn', Math.abs(c.r) >= .3 ? 'Confermato' : 'Debole ma nella direzione giusta']) : A.badge(['crit', 'Non confermato'])}</td></tr>`).join('')}</tbody></table></div>
        ${interp(p.r >= .3 ? 'good' : p.r >= .1 ? 'warn' : 'crit', p.r >= .3 ? `Il questionario prevede i gusti in modo <b>${p.verdict[1].toLowerCase()}</b>: chi ha un'affinità alta vota in media ${fmt(a.mA - a.mT, 2)} stelle in più. Il feed «Affini» ha senso.` : 'La relazione tra affinità e voti è debole: rivedi pesi e domande prima di usare il feed «Affini».')}`)}`;
    },

    drift(S) {
      const d = S.drift;
      return intro('La deviazione dal costrutto confronta il profilo dichiarato nel questionario con quello che emerge dai voti.', 'Ogni voto sposta il profilo verso il contenuto votato (in su se piace, in giù se no). Poca deviazione vuol dire che le persone si comportano come hanno detto; tanta deviazione indica domande che non colgono il costrutto, o un costrutto che cambia nel contesto.') + `
      <div class="grid g4">
        ${A.metric({ k: 'Scostamento medio', v: fmt(d.avg, 1), verdict: d.verdict, say: 'Punti su 100 per dimensione', how: 'media |profilo dai voti − profilo dichiarato|' })}
        ${A.metric({ k: 'Tester molto deviati', v: pct(d.high), say: 'Scostamento oltre 12 punti', sub: `${Math.round(d.high * d.n)} su ${d.n}` })}
        ${d.dims.slice(0, 2).map(x => A.metric({ k: 'Spostamento ' + x.name, v: (x.shift >= 0 ? '+' : '') + fmt(x.shift * 100, 1), say: `Dichiarato ${Math.round(x.est * 100)} → oggi ${Math.round(x.now * 100)}` })).join('')}
      </div>
      <div class="grid g2">
        ${card('Distribuzione dello scostamento', 'Quanti tester per ogni livello di deviazione', Ch.hist({ bins: d.hist, xFmt: v => Math.round(v), mark: d.avg, markLabel: 'media' }))}
        ${card('Dichiarato e attuale, per dimensione', 'Media del campione', Ch.hbars({ data: d.dims.flatMap(x => [{ label: x.name + ' · dichiarato', value: Math.round(x.est * 100), color: 'var(--q250)' }, { label: x.name + ' · dai voti', value: Math.round(x.now * 100), color: 'var(--s1)' }]), max: 100, lw: 200, rowH: 24 }) + Ch.legend([['var(--q250)', 'Dal questionario'], ['var(--s1)', 'Dai voti']]))}
      </div>
      ${card('Tester più lontani dal proprio profilo', 'Da controllare: possono essere risposte date a caso o gusti cambiati', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tester</th><th class="num">Scostamento</th>${d.dims.map(x => `<th class="num">${x.name}</th>`).join('')}<th class="num">Voti</th><th class="num">Qualità</th></tr></thead><tbody>
        ${d.top.map(u => `<tr class="click" data-act="openUser" data-id="${u.id}"><td><div class="row">${A.av(u, 26)}<b>${esc(u.name)}</b></div></td><td class="num"><b>${fmt(u.drift, 1)}</b></td>${d.dims.map(x => { const v = Math.round((u.now[x.k] - u.est[x.k]) * 100); return `<td class="num" style="color:${v > 0 ? 'var(--s1)' : v < 0 ? 'var(--s2)' : 'inherit'}">${v > 0 ? '+' : ''}${v}</td>`; }).join('')}<td class="num">${u.ratings.length}</td><td class="num">${u.quality.score}</td></tr>`).join('')}</tbody></table></div>`)}`;
    },

    items(S) {
      const it = S.items;
      return intro('Quali domande misurano meglio il loro costrutto.', 'Il punteggio di efficacia (0–100) unisce quattro prove: quanto la domanda va d\'accordo con le altre dello stesso costrutto (35%), quanto è stabile nel tempo (30%), quanto prevede il comportamento nell\'app (25%) e quanto distingue le persone, cioè se non rispondono tutti uguale (10%).') + `
      <div class="grid g3">
        ${A.metric({ k: 'Domanda migliore', v: it[0].code, verdict: it[0].verdict, say: esc(it[0].text), sub: `${it[0].score}/100 · ${it[0].cname}` })}
        ${A.metric({ k: 'Domanda peggiore', v: it[it.length - 1].code, verdict: it[it.length - 1].verdict, say: esc(it[it.length - 1].text), sub: `${it[it.length - 1].score}/100 · ${it[it.length - 1].cname}` })}
        ${A.metric({ k: 'Da rivedere', v: it.filter(i => i.verdict[0] !== 'good').length + ' su ' + it.length, say: 'Domande sotto 65 punti di efficacia' })}
      </div>
      ${card('Classifica di efficacia', 'Ordinata dalla più efficace. Passa sulle barre per il testo della domanda.', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Item</th><th class="wrap">Domanda</th><th>Costrutto</th><th class="num">Efficacia</th><th class="num">r item-resto</th><th class="num">Test-retest</th><th class="num">Predice il comportamento</th><th class="num">Media ± ds</th><th class="num">Tempo mediano</th><th>Cosa fare</th></tr></thead><tbody>
        ${it.map((i, k) => `<tr><td class="muted">${k + 1}</td><td><b>${i.code}</b></td><td class="wrap">${esc(i.text)}</td><td>${i.cname}</td><td class="num"><div class="row" style="justify-content:flex-end"><div class="meter" style="width:70px"><i style="width:${i.score}%;background:${i.verdict[0] === 'good' ? 'var(--s1)' : i.verdict[0] === 'warn' ? 'var(--warn)' : 'var(--crit)'}"></i></div><b>${i.score}</b></div></td><td class="num">${fmt(i.itot)}</td><td class="num">${fmt(i.retest)}</td><td class="num">${fmt(i.crit)}</td><td class="num">${fmt(i.mean, 1)} ± ${fmt(i.sd, 1)}</td><td class="num">${fmt(i.medMs / 1000, 1)} s</td><td>${A.badge(i.verdict)}</td></tr>`).join('')}</tbody></table></div>`)}
      ${card('Come rispondono i tester', 'Distribuzione delle risposte per ogni domanda. Una domanda in cui quasi tutti scelgono la stessa risposta distingue poco.', Ch.stack100({ rows: it.map(i => ({ label: i.code, parts: i.dist })) }) + Ch.likertLegend())}
      ${interp(it[it.length - 1].score < 45 ? 'crit' : 'warn', `<b>Suggerimento:</b> ${it.filter(i => i.verdict[0] === 'crit').map(i => `riscrivi <b>${i.code}</b> («${esc(i.text)}»): misura poco ${i.cname.toLowerCase()} e cambia molto da un giorno all'altro`).join('; ') || 'nessuna domanda è da togliere; lavora su quelle in giallo.'}. Le domande in cima alla classifica sono quelle da tenere anche nella versione breve del questionario.`)}`;
    },

    reviews(S) {
      const r = S.review;
      return intro('Quanto le recensioni si allineano a quello che il questionario aveva previsto.', 'Dopo ogni attività i partecipanti dicono quanto si sono trovati bene e quanto il gruppo era adatto a loro. Se il questionario funziona, chi aveva un\'affinità alta lascia recensioni migliori.') + `
      <div class="grid g4">
        ${A.metric({ k: 'Affinità ↔ soddisfazione', v: fmt(r.affSat), verdict: r.verdict, say: `${r.n} recensioni · ${V.p(r.p)}` })}
        ${A.metric({ k: 'Affinità ↔ «gruppo adatto a me»', v: fmt(r.affFit), verdict: V.r(r.affFit), say: 'Seconda domanda della recensione' })}
        ${A.metric({ k: 'Aspettativa ↔ esperienza', v: fmt(r.preSat), verdict: V.r(r.preSat), say: 'Voto prima dell\'attività contro voto dopo' })}
        ${A.metric({ k: 'Voto host ↔ soddisfazione', v: fmt(r.hostSat), verdict: V.r(r.hostSat), say: 'Il giudizio sull\'host segue l\'esperienza' })}
      </div>
      <div class="grid g2">
        ${card('Soddisfazione per fascia di affinità prevista', 'Media delle recensioni dopo l\'attività', Ch.bars({ data: r.byAff.map(b => ({ label: b.label, value: b.m, tip: `<b>${fmt(b.m)}</b> soddisfazione<div class="muted">affinità ${b.label} · ${b.n} recensioni</div>` })), max: 5, min: 1, yFmt: v => fmt(v, 1) }))}
        ${card('«Il gruppo era adatto a me»', 'Stessa divisione per affinità', Ch.bars({ data: r.byAff.map(b => ({ label: b.label, value: b.fit, color: 'var(--s3)', tip: `<b>${fmt(b.fit)}</b><div class="muted">affinità ${b.label} · ${b.n} recensioni</div>` })), max: 5, min: 1, yFmt: v => fmt(v, 1) }))}
      </div>
      ${interp(r.affSat >= .3 ? 'good' : r.affSat >= .1 ? 'warn' : 'crit', r.affSat >= .3 ? 'Le recensioni confermano il questionario: le attività previste come affini sono anche quelle in cui le persone si trovano meglio.' : r.affSat >= .1 ? 'Le recensioni vanno nella direzione prevista ma con poca forza: servono più dati o pesi diversi per le attività di gruppo.' : 'Le recensioni non seguono l\'affinità prevista.')}`;
    },

    quality(S) {
      const q = S.quality;
      const lst = q.low.slice().sort((a, b) => a.quality.score - b.quality.score), ex = AStore.s.excluded || {};
      return intro('La qualità dei dati controlla che le risposte siano sincere e ponderate.', 'Si segnalano i tester che rispondono troppo in fretta (meno di 1,2 secondi a domanda), che danno sempre la stessa risposta o quasi tutte neutre. Escluderli rende le altre analisi più pulite.') + `
      <div class="grid g4">
        ${A.metric({ k: 'Qualità media', v: Math.round(q.avgScore) + '/100', verdict: q.avgScore >= 75 ? ['good', 'Buona'] : ['warn', 'Da controllare'] })}
        ${A.metric({ k: 'Troppo veloci', v: q.speeders.length, say: '5 o più risposte sotto 1,2 s' })}
        ${A.metric({ k: 'Risposte piatte', v: q.flat.length + q.neutral.length, say: `${q.flat.length} con meno di 3 valori diversi · ${q.neutral.length} quasi tutte neutre` })}
        ${A.metric({ k: 'Dati mancanti', v: q.incomplete + q.missingDaily, say: `${q.incomplete} questionari interrotti · ${q.missingDaily} con meno di 3 giorni di domande` })}
      </div>
      <div class="grid g2">
        ${card('Tempo medio di risposta per tester', 'La maggior parte riflette 3–8 secondi a domanda; il gruppo a sinistra risponde senza leggere', Ch.hist({ bins: St.hist(q.times, 0, 10, 20).map(b => Object.assign(b, { color: b.x1 <= 1.5 ? 'var(--crit)' : 'var(--s1)' })), xFmt: v => fmt(v, 1) + ' s', mark: 1.2, markLabel: '1,2 s' }))}
        ${card('Effetto della pulizia', 'Le stesse statistiche senza i tester con qualità sotto 60', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Misura</th><th class="num">Tutti</th><th class="num">Senza qualità bassa</th></tr></thead><tbody>
          <tr><td>α totale (10 item)</td><td class="num">${fmt(S.alphaAll)}</td><td class="num"><b>${fmt(q.alphaClean)}</b></td></tr>
          <tr><td>Affinità ↔ voto</td><td class="num">${fmt(S.pred.r)}</td><td class="num"><b>${fmt(q.predClean)}</b></td></tr></tbody></table></div>
          ${interp('', `Escludere i ${lst.filter(u => !ex[u.id]).length} tester segnalati ${q.alphaClean > S.alphaAll ? 'alza' : 'cambia poco'} l'attendibilità. Puoi farlo con un clic qui sotto; si annulla dalle impostazioni o dalla scheda del tester.`)}
          <div class="row"><button class="btn" data-act="exAll" ${lst.some(u => !ex[u.id]) ? '' : 'disabled'}>Escludi tutti i segnalati</button>${S.excluded ? `<button class="btn s" data-act="exNone">Reincludi ${S.excluded} esclusi</button>` : ''}</div>`)}
      </div>
      ${card(`Tester segnalati (${lst.length})`, 'Clicca su una riga per aprire la scheda', `<div class="tbl-wrap" style="max-height:420px"><table class="tbl"><thead><tr><th>Tester</th><th class="num">Qualità</th><th class="num">Tempo medio</th><th class="num">Risposte veloci</th><th class="num">Valori diversi</th><th class="num">Neutre</th><th>Stato</th></tr></thead><tbody>
        ${lst.map(u => `<tr class="click" data-act="openUser" data-id="${u.id}"><td><div class="row">${A.av(u, 26)}<b>${esc(u.name)}</b></div></td><td class="num"><b style="color:var(--crit)">${u.quality.score}</b></td><td class="num">${fmt(u.quality.avgMs / 1000, 1)} s</td><td class="num">${u.quality.fast}/10</td><td class="num">${u.quality.distinct}</td><td class="num">${u.quality.neutral}</td><td>${ex[u.id] ? A.badge(['mute', 'Escluso']) : A.badge(['warn', 'Incluso'])}</td></tr>`).join('')}</tbody></table></div>`)}`;
    },

    feed(S) {
      const t = S.thr, cur = AStore.s.settings.threshold, b = S.thrBest, c = t.find(x => x.t === cur) || t.reduce((p, x) => Math.abs(x.t - cur) < Math.abs(p.t - cur) ? x : p);
      return intro('La soglia decide da quale affinità un contenuto entra nel feed «Affini».', 'Alzandola si mostrano meno contenuti ma più azzeccati (precisione); abbassandola se ne mostrano di più ma con più errori. La soglia consigliata massimizza l\'equilibrio tra precisione e contenuti piaciuti recuperati (F1).') + `
      <div class="grid g4">
        ${A.metric({ k: 'Soglia attuale', v: cur, say: `Precisione ${pct(c.prec)} · copertura ${pct(c.cov)}` })}
        ${A.metric({ k: 'Soglia consigliata', v: b.t, verdict: b.t === cur ? ['good', 'Già in uso'] : ['warn', 'Diversa da quella in uso'], say: `Precisione ${pct(b.prec)} · copertura ${pct(b.cov)}`, how: 'F1 = 2·P·R / (P + R)' })}
        ${A.metric({ k: 'Lift del top 3', v: fmt(S.lift) + '×', say: 'Quanto i primi 3 suggerimenti battono il resto' })}
        <div class="card kpi"><span class="k">Applica al prototipo</span><div class="row"><input class="in" type="number" min="30" max="90" step="5" value="${cur}" id="thrIn" style="width:90px"><button class="btn" data-act="applyThr">Applica</button></div><div class="ink2" style="font-size:13px">La soglia passa subito al prototipo aperto in questo browser.</div>${b.t !== cur ? `<button class="btn s sm" data-act="applyThr" data-v="${b.t}">Usa la consigliata (${b.t})</button>` : ''}</div>
      </div>
      ${card('Precisione e copertura per ogni soglia', 'Precisione: quota di contenuti sopra soglia votati 4 o 5. Copertura: quota di contenuti che supera la soglia.', Ch.line({ labels: t.map(x => String(x.t)), series: [{ name: 'Precisione', color: 'var(--s1)', values: t.map(x => x.prec * 100) }, { name: 'Copertura', color: 'var(--s2)', values: t.map(x => x.cov * 100) }, { name: 'F1', color: 'var(--s3)', values: t.map(x => x.f1 * 100) }], max: 100, yFmt: v => Math.round(v) + '%' }) + Ch.legend([['var(--s1)', 'Precisione', 1], ['var(--s2)', 'Copertura', 1], ['var(--s3)', 'F1 (equilibrio)', 1]]))}`;
    },

    community(S) {
      const c = S.community, D = A.D;
      return intro('Come funziona la parte community.', 'Attività create dai tester, richieste di partecipazione, presenze e giudizi sugli host secondo la scala di «design valutazioni».') + `
      <div class="grid g4">
        ${A.metric({ k: 'Attività create', v: c.acts, say: `${c.parts} richieste di partecipazione` })}
        ${A.metric({ k: 'Richieste accolte', v: pct(c.accepted) })}
        ${A.metric({ k: 'Assenze', v: pct(c.noShow), verdict: c.noShow < .08 ? ['good', 'Basse'] : ['warn', 'Da seguire'], say: 'Partecipanti accettati che non si sono presentati' })}
        ${A.metric({ k: 'Voto medio agli host', v: fmt(c.hostAvg, 1) + '/5', say: `${D.reports.length} segnalazioni con codice pratica` })}
      </div>
      <div class="grid g3">
        ${card('Giudizi dei partecipanti sull\'host', 'Scala a 5 livelli', Ch.bars({ data: ['Pessima', 'Scarsa', 'Nella media', 'Buona', 'Ottima'].map((l, i) => ({ label: l, value: c.hostDist[i], color: i === 0 ? 'var(--crit)' : 'var(--s1)' })) }))}
        ${card('Giudizi dell\'host sui partecipanti', 'Scala a 4 livelli, assenze escluse', Ch.bars({ data: ['Problematico', 'Così così', 'Bene', 'Ottimo'].map((l, i) => ({ label: l, value: c.orgDist[i], color: 'var(--s7)' })) }))}
        ${card('Attività per interesse', 'Numero e soddisfazione media', Ch.hbars({ data: c.byInterest.map(x => ({ label: x.k, value: x.n, extra: isNaN(x.sat) ? '' : '· ' + fmt(x.sat, 1) + '★' })), lw: 90, rowH: 26 }))}
      </div>
      ${card('Tutte le attività community', '', `<div class="tbl-wrap" style="max-height:420px"><table class="tbl"><thead><tr><th>Attività</th><th>Organizza</th><th>Interesse</th><th>Stato</th><th class="num">Richieste</th><th class="num">Voto host</th></tr></thead><tbody>
        ${D.activities.map(a => `<tr class="click" data-act="openUser" data-id="${a.org}"><td><b>${esc(a.title)}</b><div class="muted" style="font-size:12px">${a.id} · ${esc(a.place)}</div></td><td>${esc(A.user(a.org).name)}</td><td>${a.interest}</td><td>${A.badge([a.status === 'conclusa' ? 'mute' : 'brand', a.status])}</td><td class="num">${D.parts.filter(p => p.act === a.id).length}/${a.max}</td><td class="num">${a.hostAvg ? `<b style="color:${a.hostAvg < 2.5 ? 'var(--crit)' : 'inherit'}">${fmt(a.hostAvg, 1)}</b> <span class="muted">(${a.fbN})</span>` : '—'}</td></tr>`).join('')}</tbody></table></div>`)}`;
    },

    house(S) {
      const h = S.house;
      return intro('Il match casa prevede la compatibilità tra coinquilini dalle abitudini (presenza, orari, ordine, ospiti) e dal vincolo sul fumo.', 'Qui la previsione viene confrontata con il voto che i coinquilini danno alla convivenza.') + `
      <div class="grid g4">
        ${A.metric({ k: 'Previsione ↔ voto convivenza', v: fmt(h.r), verdict: h.verdict, say: `${h.n} coppie in ${h.houses} case · ${V.p(h.p)}` })}
        ${A.metric({ k: 'Coppie con conflitto fumo', v: h.smoke.n, say: `Voto medio ${fmt(h.smoke.m, 1)} contro ${fmt(h.smoke.mOk, 1)} delle altre` })}
        ${A.metric({ k: 'Case formate', v: h.houses })}
        ${A.metric({ k: 'Compatibilità media prevista', v: Math.round(St.mean(h.pairs.map(p => p.pred))) + '%' })}
      </div>
      ${card('Compatibilità prevista e voto alla convivenza', 'Ogni punto è una coppia di coinquilini; in rosso le coppie con conflitto sul fumo. La retta tratteggiata è la tendenza.', Ch.scatter({ pts: h.pairs.map(p => ({ x: p.pred, y: p.rate + (((p.pred * 7) % 10) - 5) / 40, color: p.smokeClash ? 'var(--crit)' : 'var(--s1)', tip: `<b>${p.pred}% → ${p.rate}/5</b><div class="muted">${esc(A.user(p.a).name)} e ${esc(A.user(p.b).name)}${p.smokeClash ? '<br>conflitto sul fumo' : ''}</div>` })), xMin: 20, xMax: 100, reg: true, xLabel: 'compatibilità prevista (%)', yLabel: 'voto convivenza', r: 6 }) + Ch.legend([['var(--s1)', 'Coppia'], ['var(--crit)', 'Conflitto fumo']]))}
      ${interp(vcls(h.verdict), h.r >= .3 ? 'La previsione del match casa regge: le coppie con compatibilità alta vivono meglio insieme. Il vincolo sul fumo come esclusione secca è giustificato dai voti bassi delle coppie in conflitto.' : 'Con così poche coppie il risultato è ancora incerto: raccogli altri voti alla convivenza.')}`;
    }
  };

  A.page('analysis', {
    title: 'Analisi statistica', crumb: 'Calcolata in automatico sul campione',
    render(r) {
      const tab = TABS.some(t => t[0] === r[1]) ? r[1] : 'reliability', S = A.S;
      return `<div class="row sb"><div class="tabs" style="flex:1">${TABS.map(([k, l]) => `<button class="tab ${k === tab ? 'on' : ''}" data-nav="analysis/${k}">${l}</button>`).join('')}</div></div>
        <div class="row muted" style="font-size:13px">${A.ic('info', 16)}Calcolato su ${S.n} tester inclusi${S.excluded ? ` (${S.excluded} esclusi)` : ''}, ${S.nQ} con questionario completo. Dati simulati.</div>
        ${R[tab](S)}`;
    }
  });
  A.acts.applyThr = el => {
    const v = +(el.dataset.v || document.getElementById('thrIn').value); if (!(v >= 30 && v <= 90)) return A.toast('Scegli un valore tra 30 e 90');
    AStore.s.settings.threshold = v; AStore.save(); A.reload(); A.render(); A.toast('Soglia «Affini» impostata a ' + v);
  };
  A.acts.exAll = () => { const s = AStore.s; s.excluded = s.excluded || {}; A.S.quality.low.forEach(u => s.excluded[u.id] = 1); AStore.save(); A.restat(); A.render(); A.toast('Tester segnalati esclusi: statistiche ricalcolate'); };
  A.acts.exNone = () => { AStore.s.excluded = {}; AStore.save(); A.restat(); A.render(); A.toast('Tutti i tester di nuovo inclusi'); };
})();
