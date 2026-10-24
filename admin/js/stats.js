/* Motore statistico: funzioni di base + tutte le analisi del test, calcolate sui tester inclusi.
   Ogni risultato porta con sé il verdetto in parole semplici, così le pagine non devono interpretare i numeri. */
(function () {
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;
  const variance = a => { const m = mean(a); return a.length > 1 ? a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1) : NaN; };
  const sd = a => Math.sqrt(variance(a));
  function corr(x, y) {
    const n = Math.min(x.length, y.length); if (n < 3) return NaN;
    const mx = mean(x), my = mean(y); let a = 0, b = 0, c = 0;
    for (let i = 0; i < n; i++) { const dx = x[i] - mx, dy = y[i] - my; a += dx * dy; b += dx * dx; c += dy * dy; }
    return b && c ? a / Math.sqrt(b * c) : NaN;
  }
  const rank = a => { const s = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]), r = new Array(a.length); for (let i = 0; i < s.length;) { let j = i; while (j + 1 < s.length && s[j + 1][0] === s[i][0]) j++; for (let k = i; k <= j; k++) r[s[k][1]] = (i + j) / 2 + 1; i = j + 1; } return r; };
  const spearman = (x, y) => corr(rank(x), rank(y));
  /* distribuzione t (beta incompleta regolarizzata) per i p-value */
  function lgamma(z) { const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, .1208650973866179e-2, -.5395239384953e-5]; let x = z, y = z, t = x + 5.5; t -= (x + .5) * Math.log(t); let s = 1.000000000190015; for (const c of g) s += c / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
  function betacf(a, b, x) { let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; let h = d; for (let m = 1; m <= 200; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-7) break; } return h; }
  function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
  const pT = (t, df) => ibeta(df / (df + t * t), df / 2, .5);                  // p bilaterale
  const pR = (r, n) => n > 2 && Math.abs(r) < 1 ? pT(r * Math.sqrt((n - 2) / (1 - r * r)), n - 2) : NaN;
  function ciR(r, n) { if (n < 4) return [NaN, NaN]; const z = Math.atanh(r), se = 1 / Math.sqrt(n - 3); return [Math.tanh(z - 1.96 * se), Math.tanh(z + 1.96 * se)]; }
  function cohenD(a, b) { const na = a.length, nb = b.length, sp = Math.sqrt(((na - 1) * variance(a) + (nb - 1) * variance(b)) / (na + nb - 2)); return sp ? (mean(a) - mean(b)) / sp : NaN; }
  function welch(a, b) { const va = variance(a) / a.length, vb = variance(b) / b.length, t = (mean(a) - mean(b)) / Math.sqrt(va + vb), df = (va + vb) ** 2 / (va * va / (a.length - 1) + vb * vb / (b.length - 1)); return { t, df, p: pT(t, df) }; }
  function alpha(rows) {                                          // rows: [[i1,i2,...], ...]
    const k = rows[0] ? rows[0].length : 0; if (k < 2 || rows.length < 3) return NaN;
    const iv = Array.from({ length: k }, (_, j) => variance(rows.map(r => r[j]))), tv = variance(rows.map(r => r.reduce((s, x) => s + x, 0)));
    return k / (k - 1) * (1 - iv.reduce((s, x) => s + x, 0) / tv);
  }
  function linreg(x, y) { const mx = mean(x), my = mean(y); let a = 0, b = 0; x.forEach((v, i) => { a += (v - mx) * (y[i] - my); b += (v - mx) ** 2; }); const m = b ? a / b : 0; return { m, q: my - m * mx }; }
  const hist = (a, lo, hi, bins) => { const w = (hi - lo) / bins, h = Array.from({ length: bins }, (_, i) => ({ x0: lo + i * w, x1: lo + (i + 1) * w, n: 0 })); a.forEach(v => { const i = Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / w))); h[i].n++; }); return h; };

  /* verdetti in parole semplici: [classe badge, etichetta] */
  const V = {
    alpha: a => a >= .9 ? ['good', 'Eccellente'] : a >= .8 ? ['good', 'Buona'] : a >= .7 ? ['good', 'Accettabile'] : a >= .6 ? ['warn', 'Discutibile'] : ['crit', 'Scarsa'],
    r: r => { const x = Math.abs(r); return x >= .5 ? ['good', 'Forte'] : x >= .3 ? ['good', 'Moderata'] : x >= .1 ? ['warn', 'Debole'] : ['crit', 'Nulla']; },
    retest: r => r >= .7 ? ['good', 'Stabile'] : r >= .5 ? ['warn', 'Abbastanza stabile'] : ['crit', 'Instabile'],
    d: d => { const x = Math.abs(d); return x >= .8 ? ['good', 'Grande'] : x >= .5 ? ['good', 'Media'] : x >= .2 ? ['warn', 'Piccola'] : ['crit', 'Trascurabile']; },
    p: p => p < .001 ? 'p < 0,001' : 'p = ' + fmt(p, 3),
    itot: r => r >= .4 ? ['good', 'Ottima'] : r >= .3 ? ['good', 'Buona'] : r >= .2 ? ['warn', 'Al limite'] : ['crit', 'Da rivedere']
  };
  const fmt = (x, d = 2) => x == null || isNaN(x) ? '–' : x.toFixed(d).replace('.', ',');
  const pct = (x, d = 0) => isNaN(x) ? '–' : (x * 100).toFixed(d).replace('.', ',') + '%';

  /* ---------- tutte le analisi ---------- */
  function run(D) {
    const ex = AStore.s.excluded || {};
    const all = D.users, U = all.filter(u => !ex[u.id]), Q = U.filter(u => u.quizDone);
    const qv = (u, c) => (u.quiz[c] || {}).v, LIK = D.ITEMS.map(i => i.code);
    const out = { n: U.length, nAll: all.length, nQ: Q.length, excluded: all.length - U.length };

    /* attendibilità: α per costrutto multi-item e totale (item invertiti) */
    out.constructs = D.CONSTRUCTS.filter(c => c.items.length > 1).map(c => {
      const rows = Q.map(u => c.items.map(([code, s]) => s > 0 ? qv(u, code) : 6 - qv(u, code)));
      const a = alpha(rows), tot = rows.map(r => r.reduce((s, x) => s + x, 0));
      const items = c.items.map(([code, s], j) => {
        const rest = rows.map(r => r.reduce((s2, x, k) => k === j ? s2 : s2 + x, 0)), it = rows.map(r => r[j]);
        return { code, sign: s, itot: corr(it, rest), aid: alpha(rows.map(r => r.filter((_, k) => k !== j))) };
      });
      return { k: c.k, name: c.name, alpha: a, n: rows.length, items, sem: sd(tot) * Math.sqrt(Math.max(0, 1 - a)), verdict: V.alpha(a) };
    });
    const sign = { SP2: -1 };
    const fullRows = Q.map(u => LIK.map(c => sign[c] ? 6 - qv(u, c) : qv(u, c)));
    out.alphaAll = alpha(fullRows);
    out.alphaMean = mean(out.constructs.map(c => c.alpha));
    out.corrMatrix = LIK.map((a, i) => LIK.map((b, j) => corr(Q.map(u => qv(u, a)), Q.map(u => qv(u, b)))));

    /* stabilità test-retest: prima risposta del giorno vs questionario */
    out.retest = LIK.map(code => {
      const pairs = Q.map(u => { const d = u.daily.find(x => x.code === code); return d ? [qv(u, code), d.v] : null; }).filter(Boolean);
      const r = corr(pairs.map(p => p[0]), pairs.map(p => p[1])), same = pairs.filter(p => p[0] === p[1]).length / (pairs.length || 1), near = pairs.filter(p => Math.abs(p[0] - p[1]) <= 1).length / (pairs.length || 1);
      return { code, n: pairs.length, r, same, near, verdict: V.retest(r) };
    });
    out.retestAvg = mean(out.retest.map(x => x.r).filter(x => !isNaN(x)));

    /* validità predittiva: affinità stimata dal questionario ↔ voto dato */
    const RT = Q.flatMap(u => u.ratings.map(r => Object.assign({ u }, r))), RF = RT.filter(r => r.type !== 'bacheca');
    out.nRatings = RT.length; out.nDeep = RT.filter(r => r.deep).length;
    out.pred = { r: corr(RF.map(r => r.aff), RF.map(r => r.v)), rho: spearman(RF.map(r => r.aff), RF.map(r => r.v)), n: RF.length };
    out.pred.p = pR(out.pred.r, out.pred.n); out.pred.ci = ciR(out.pred.r, out.pred.n); out.pred.verdict = V.r(out.pred.r);
    out.byAff = [];
    for (let lo = 20; lo < 100; lo += 10) { const g = RF.filter(r => r.aff >= lo && r.aff < lo + 10).map(r => r.v); if (g.length) out.byAff.push({ x: lo + 5, label: lo + '–' + (lo + 9), m: mean(g), n: g.length, se: sd(g) / Math.sqrt(g.length) }); }
    out.byRank = [];
    for (let k = 1; k <= 16; k += 3) { const g = RF.filter(r => r.rank >= k && r.rank < k + 3).map(r => r.v); if (g.length) out.byRank.push({ label: k + '–' + (k + 2), m: mean(g), n: g.length }); }
    const A = RF.filter(r => r.feed === 'affini').map(r => r.v), T = RF.filter(r => r.feed === 'tutti').map(r => r.v);
    out.affVsAll = { mA: mean(A), mT: mean(T), nA: A.length, nT: T.length, d: cohenD(A, T), test: welch(A, T) }; out.affVsAll.verdict = V.d(out.affVsAll.d);
    /* precisione: dei primi 3 suggerimenti di ciascuno, quanti sono piaciuti (voto ≥ 4) */
    const top3 = RF.filter(r => r.rank <= 3), rest = RF.filter(r => r.rank > 3);
    out.prec3 = top3.filter(r => r.v >= 4).length / (top3.length || 1); out.base = rest.filter(r => r.v >= 4).length / (rest.length || 1);
    out.lift = out.prec3 / out.base;

    /* validità convergente: costrutto dichiarato ↔ comportamento osservato */
    const pref = (u, k) => { const rs = u.ratings.filter(r => D.byId[r.id] && D.byId[r.id].v); return rs.length >= 4 ? corr(rs.map(r => D.byId[r.id].v[k]), rs.map(r => r.v)) : NaN; };
    const sc = (u, k) => k === 'soc' ? (qv(u, 'E1') + qv(u, 'SA2') + qv(u, 'OS3')) / 3 : k === 'plan' ? (qv(u, 'C1') + 6 - qv(u, 'SP2') + qv(u, 'CS2')) / 3 : k === 'cur' ? qv(u, 'O3') : qv(u, 'PR1');
    const conv = (label, k, crit, f, critLabel) => { const pts = Q.map(u => [sc(u, k), f(u)]).filter(p => !isNaN(p[1])); const r = corr(pts.map(p => p[0]), pts.map(p => p[1])); return { label, crit: critLabel, r, n: pts.length, p: pR(r, pts.length), verdict: V.r(r), expect: crit }; };
    out.convergent = [
      conv('Socialità', 'soc', '+', u => pref(u, 'soc'), 'preferisce contenuti molto sociali'),
      conv('Socialità', 'soc', '+', u => u.parts.filter(p => p.status !== 'non accolta').length + u.acts.length * 2, 'richieste e attività create'),
      conv('Apertura', 'cur', '+', u => pref(u, 'cur'), 'preferisce contenuti nuovi e insoliti'),
      conv('Organizzazione', 'plan', '+', u => pref(u, 'plan'), 'preferisce attività strutturate'),
      conv('Presenza in casa', 'home', '−', u => pref(u, 'act'), 'preferisce attività movimentate')
    ];
    out.convergent.forEach(c => { c.ok = c.expect === '+' ? c.r > .1 : c.r < -.1; });

    /* allineamento recensioni ↔ questionario (community) */
    const P = D.parts.filter(p => !ex[p.user]), PC = P.filter(p => p.post);
    out.review = {
      n: PC.length,
      affSat: corr(PC.map(p => p.aff), PC.map(p => p.post[0])),
      affFit: corr(PC.map(p => p.aff), PC.map(p => p.post[1])),
      preSat: corr(PC.map(p => p.pre), PC.map(p => p.post[0])),
      hostSat: corr(PC.map(p => p.host), PC.map(p => p.post[0]))
    };
    out.review.p = pR(out.review.affSat, PC.length); out.review.verdict = V.r(out.review.affSat);
    out.review.byAff = [[0, 50, 'Sotto 50'], [50, 65, '50–64'], [65, 80, '65–79'], [80, 101, '80+']].map(([a, b, l]) => { const g = PC.filter(p => p.aff >= a && p.aff < b); return { label: l, m: mean(g.map(p => p.post[0])), fit: mean(g.map(p => p.post[1])), n: g.length }; }).filter(g => g.n);
    /* coerenza tra i voti dati in fretta e quelli approfonditi */
    const deep = RT.filter(r => r.likert); out.deepAgree = corr(deep.map(r => r.v), deep.map(r => r.likert[1]));

    /* deviazione dal costrutto: profilo dichiarato vs profilo dai voti */
    const K = [['soc', 'Socialità'], ['cur', 'Apertura'], ['plan', 'Organizzazione'], ['act', 'Attività']];
    const QR = Q.filter(u => u.ratings.length >= 3);
    out.drift = {
      n: QR.length, avg: mean(QR.map(u => u.drift)), hist: hist(QR.map(u => u.drift), 0, 30, 12),
      high: QR.filter(u => u.drift > 12).length / (QR.length || 1),
      dims: K.map(([k, name]) => ({ k, name, est: mean(QR.map(u => u.est[k])), now: mean(QR.map(u => u.now[k])), shift: mean(QR.map(u => u.now[k] - u.est[k])), abs: mean(QR.map(u => Math.abs(u.now[k] - u.est[k]))) })),
      top: QR.slice().sort((a, b) => b.drift - a.drift).slice(0, 8)
    };
    out.drift.verdict = out.drift.avg < 6 ? ['good', 'Profili confermati'] : out.drift.avg < 12 ? ['warn', 'Scostamento moderato'] : ['crit', 'Profili poco aderenti'];

    /* efficacia delle singole domande */
    const prefK = { soc: 'soc', cur: 'cur', plan: 'plan', home: 'act' };
    out.items = D.ITEMS.map(it => {
      const c = out.constructs.find(x => x.items.some(i => i.code === it.code)), ci = c ? c.items.find(i => i.code === it.code) : null;
      const rt = out.retest.find(x => x.code === it.code), vals = Q.map(u => qv(u, it.code));
      let crit = NaN;
      if (prefK[it.c]) { const pts = Q.map(u => [qv(u, it.code), pref(u, prefK[it.c])]).filter(p => !isNaN(p[1])); crit = corr(pts.map(p => p[0]), pts.map(p => p[1])) * (it.l < 0 ? -1 : 1) * (it.c === 'home' ? -1 : 1); }
      const dist = [1, 2, 3, 4, 5].map(v => vals.filter(x => x === v).length / vals.length);
      const ms = Q.map(u => (u.quiz[it.code] || {}).ms).filter(Boolean).sort((a, b) => a - b);
      const s_it = ci ? ci.itot : .3, s_rt = rt ? rt.r : NaN, s_cr = isNaN(crit) ? .15 : crit;
      const score = Math.round(Math.max(0, Math.min(100, (Math.max(0, s_it) / .6 * 35 + Math.max(0, s_rt) / .8 * 30 + Math.max(0, s_cr) / .35 * 25 + (1 - Math.max(...dist)) / .7 * 10))));
      const q = DATA.blocks.flatMap(b => b.qs).find(x => x.code === it.code) || {};
      return { code: it.code, text: q.text || '', c: it.c, cname: (D.CONSTRUCTS.find(x => x.k === it.c) || {}).name, itot: ci ? ci.itot : NaN, aid: ci ? ci.aid : NaN, alpha: c ? c.alpha : NaN, retest: s_rt, crit, dist, mean: mean(vals), sd: sd(vals), medMs: ms[Math.floor(ms.length / 2)], score };
    }).sort((a, b) => b.score - a.score);
    out.items.forEach(i => i.verdict = i.score >= 65 ? ['good', 'Tenere'] : i.score >= 45 ? ['warn', 'Migliorare'] : ['crit', 'Riscrivere o togliere']);

    /* qualità dei dati */
    out.quality = {
      speeders: Q.filter(u => u.quality.fast >= 5), flat: Q.filter(u => u.quality.distinct < 3), neutral: Q.filter(u => u.quality.neutral >= 6),
      low: all.filter(u => u.quizDone && u.quality.score < 60), times: Q.map(u => u.quality.avgMs / 1000), avgScore: mean(Q.map(u => u.quality.score)),
      incomplete: U.filter(u => u.consent && !u.quizDone).length, noConsent: U.filter(u => !u.consent).length,
      missingDaily: Q.filter(u => (u.daysDone || 0) < 3).length
    };
    /* alpha ricalcolato senza i tester a bassa qualità (per mostrare l'effetto della pulizia) */
    const clean = Q.filter(u => u.quality.score >= 60); out.quality.alphaClean = alpha(clean.map(u => LIK.map(c => sign[c] ? 6 - qv(u, c) : qv(u, c))));
    out.quality.predClean = (() => { const rs = clean.flatMap(u => u.ratings.filter(r => r.type !== 'bacheca')); return corr(rs.map(r => r.aff), rs.map(r => r.v)); })();

    /* soglia del feed «Affini»: precisione e copertura per ogni soglia */
    out.thr = [];
    const liked = RF.filter(r => r.v >= 4).length || 1;
    for (let t = 30; t <= 90; t += 5) {
      const sel = RF.filter(r => r.aff >= t), hit = sel.filter(r => r.v >= 4).length;
      out.thr.push({ t, prec: sel.length ? hit / sel.length : NaN, cov: sel.length / (RF.length || 1), rec: hit / liked, f1: sel.length ? 2 * (hit / sel.length) * (hit / liked) / ((hit / sel.length) + (hit / liked)) : 0 });
    }
    out.thrBest = out.thr.reduce((b, x) => x.f1 > b.f1 ? x : b, out.thr[0]);

    /* community */
    const acts = D.activities;
    out.community = {
      acts: acts.length, parts: P.length, accepted: P.filter(p => p.status === 'accettata' || p.status === 'conclusa').length / (P.length || 1),
      noShow: PC.filter(p => p.noShow).length / (PC.length || 1), hostAvg: mean(PC.map(p => p.host)),
      hostDist: [1, 2, 3, 4, 5].map(v => PC.filter(p => p.host === v).length), orgDist: [1, 2, 3, 4].map(v => PC.filter(p => p.orgLevel === v).length),
      byInterest: Object.entries(acts.reduce((m, a) => { (m[a.interest] = m[a.interest] || []).push(a); return m; }, {})).map(([k, l]) => ({ k, n: l.length, sat: mean(PC.filter(p => l.some(a => a.id === p.act)).map(p => p.post[0])) })).sort((a, b) => b.n - a.n)
    };

    /* match casa */
    const pairs = D.houses.flatMap(h => h.pairs).filter(p => !ex[p.a] && !ex[p.b]);
    out.house = { n: pairs.length, houses: D.houses.length, r: corr(pairs.map(p => p.pred), pairs.map(p => p.rate)), pairs };
    out.house.p = pR(out.house.r, pairs.length); out.house.verdict = V.r(out.house.r);
    const sm = pairs.filter(p => p.smokeClash), ns = pairs.filter(p => !p.smokeClash);
    out.house.smoke = { n: sm.length, m: mean(sm.map(p => p.rate)), mOk: mean(ns.map(p => p.rate)) };

    /* andamento e imbuto */
    out.daily = Array.from({ length: D.DAYS }, (_, d) => {
      const act = U.filter(u => u.ratings.some(r => r.day === d) || u.daily.some(x => x.day === d) || u.joinDay === d).length;
      return { d, date: D.dayDate(d), joined: U.filter(u => u.joinDay <= d).length, active: act, ratings: RT.filter(r => r.day === d).length };
    });
    out.funnel = [
      ['Iscritti', U.length], ['Consenso dato', U.filter(u => u.consent).length], ['Questionario completo', Q.length],
      ['Almeno un voto', Q.filter(u => u.ratings.length).length], ['Domande del giorno ≥ 3 giorni', Q.filter(u => (u.daysDone || 0) >= 3).length],
      ['Ha partecipato a un\'attività', Q.filter(u => u.parts.some(p => p.status === 'conclusa' || p.status === 'accettata')).length]
    ];
    out.status = ['Attivo', 'Inattivo', 'Abbandonato', 'Onboarding', 'Senza consenso'].map(s => [s, U.filter(u => u.status === s).length]);
    return out;
  }

  window.St = { mean, sd, variance, corr, spearman, alpha, cohenD, welch, pR, ciR, linreg, hist, V, fmt, pct, run };
})();
