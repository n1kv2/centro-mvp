/* Campione simulato di tester (deterministico: stesso seme → stessi dati).
   Modello: ogni tester ha tratti latenti «veri» (z); le risposte al questionario sono λ·z + errore,
   i voti ai contenuti dipendono dall'affinità VERA, il feed è ordinato con l'affinità STIMATA dal questionario.
   Così le statistiche (attendibilità, validità, item) misurano davvero quanto il questionario prevede i voti.
   Scelte volute per la demo: VO3 è un item debole e instabile; ~8% di tester risponde di fretta. */
(function () {
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const Phi = z => 1 / (1 + Math.exp(-1.702 * z));          // logistica ≈ normale cumulata

  /* struttura del questionario demo: item → costrutto, saturazione λ, stabilità dell'errore nel tempo */
  const ITEMS = [
    { code: 'E1', c: 'soc', l: .88, st: .70 }, { code: 'SA2', c: 'soc', l: .82, st: .60 }, { code: 'OS3', c: 'soc', l: .65, st: .55 },
    { code: 'O3', c: 'cur', l: .80, st: .65 },
    { code: 'C1', c: 'plan', l: .85, st: .70 }, { code: 'SP2', c: 'plan', l: -.78, st: .55 }, { code: 'CS2', c: 'plan', l: .68, st: .60 },
    { code: 'PR1', c: 'home', l: .80, st: .65 }, { code: 'OB1', c: 'night', l: .75, st: .70 },
    { code: 'VO3', c: 'soc', l: .22, st: .10 }                                   // item debole: da rivedere
  ];
  const CONSTRUCTS = [
    { k: 'soc', name: 'Socialità', items: [['E1', 1], ['SA2', 1], ['OS3', 1], ['VO3', 1]] },
    { k: 'plan', name: 'Organizzazione', items: [['C1', 1], ['SP2', -1], ['CS2', 1]] },
    { k: 'cur', name: 'Apertura', items: [['O3', 1]] },
    { k: 'home', name: 'Presenza in casa', items: [['PR1', 1]] },
    { k: 'night', name: 'Ritmo notturno', items: [['OB1', 1]] }
  ];
  const THR = [-1.3, -.45, .45, 1.3];
  const toLik = x => 1 + THR.filter(t => x > t).length;
  const NOMI = ['Giulia', 'Luca', 'Sara', 'Marco', 'Elena', 'Davide', 'Irene', 'Tommaso', 'Beatrice', 'Omar', 'Chiara', 'Federico', 'Martina', 'Alessandro', 'Sofia', 'Matteo', 'Aurora', 'Lorenzo', 'Alice', 'Gabriele', 'Giorgia', 'Riccardo', 'Anna', 'Edoardo', 'Noemi', 'Pietro', 'Camilla', 'Samir', 'Ginevra', 'Filippo', 'Emma', 'Nicolò', 'Rebecca', 'Simone', 'Viola', 'Andrea', 'Bianca', 'Jacopo', 'Ludovica', 'Leonardo'];
  const COGNOMI = ['Rossi', 'Ferri', 'Conti', 'Russo', 'Gallo', 'Greco', 'Marino', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Bruno', 'Costa', 'Fontana', 'Moretti', 'Barbieri', 'Lombardi', 'Galli', 'Mancini', 'Rizzo', 'Leone', 'De Luca', 'Martini', 'Serra', 'Vitale', 'Esposito', 'Caruso', 'Ferrara', 'Santoro', 'Pellegrini'];
  const QUARTIERI = ['Città Studi', 'Isola', 'NoLo', 'Navigli', 'Porta Romana', 'Bicocca', 'Lambrate', 'Bovisa', 'Centro', 'Sesto S.G.', 'Monza'];
  const AVC = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
  const INTERESTS = ['Sport', 'Musica', 'Cucina', 'Arte', 'Giochi', 'Natura', 'Cinema', 'Lettura', 'Cultura'];
  const ACT_T = { Sport: ['Corsa del mattino', 'Calcetto al parco', 'Yoga in terrazza'], Musica: ['Jam session', 'Karaoke tra amici'], Cucina: ['Cena a tema', 'Pizza fatta in casa'],
    Arte: ['Disegno dal vero', 'Laboratorio di acquerello'], Giochi: ['Serata giochi da tavolo', 'Torneo di Risiko'], Natura: ['Trekking in Grigna', 'Picnic al parco'],
    Cinema: ['Cineforum', 'Maratona di film'], Lettura: ['Book club', 'Scambio libri'], Cultura: ['Visita a Brera', 'Passeggiata storica'] };

  function generate(cfg) {
    const R = mulberry(cfg.seed * 7919 + 17), N = cfg.n;
    const rnd = (a, b) => a + R() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = l => l[Math.floor(R() * l.length)];
    const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const DAYS = 14, today = new Date(); today.setHours(12, 0, 0, 0);
    const start = new Date(today); start.setDate(start.getDate() - (DAYS - 1));
    const dayDate = d => { const x = new Date(start); x.setDate(x.getDate() + d); return x; };

    /* contenuti: quelli del prototipo + quelli creati dal team nel portale */
    const extra = (AStore.s.content || []).filter(c => c.active !== false);
    const content = DATA.content.concat(extra.filter(c => c.type !== 'bacheca')).map(c => Object.assign({}, c));
    const board = DATA.board.map(b => Object.assign({ type: 'bacheca' }, b)).concat(extra.filter(c => c.type === 'bacheca').map(c => Object.assign({}, c)));

    const users = [];
    for (let i = 0; i < N; i++) {
      const nome = pick(NOMI), cognome = pick(COGNOMI);
      const z = { soc: gauss(), cur: gauss(), plan: gauss() };
      z.home = -.45 * z.soc + Math.sqrt(1 - .2) * gauss(); z.night = .3 * z.soc - .35 * z.plan + .88 * gauss();
      const speeder = R() < .08;
      /* percorso: chi si ferma dove */
      const joinDay = Math.min(DAYS - 1, Math.floor(Math.pow(R(), 1.8) * 9));
      const consent = R() > .04, quizDone = consent && R() > .08;
      const engage = quizDone ? clamp(.25 + R() * .9 - (speeder ? .2 : 0), 0, 1) : 0;
      const alive = Math.max(0, Math.round(engage * (DAYS - joinDay)));
      const lastDay = quizDone ? Math.min(DAYS - 1, joinDay + Math.max(0, alive - 1)) : joinDay;
      /* risposte al questionario */
      const quiz = {}, err = {};
      ITEMS.forEach(it => {
        const e = gauss(); err[it.code] = e;
        const x = speeder ? (R() < .6 ? 0 : gauss() * 1.4) : it.l * z[it.c] + Math.sqrt(1 - it.l * it.l) * e;
        quiz[it.code] = { v: toLik(x), ms: Math.round(speeder ? rnd(450, 1100) : Math.exp(rnd(7.6, 9.2))) };
      });
      const f = R(); quiz.FU1 = { v: f < .7 ? 1 : f < .9 ? 2 : 3, ms: Math.round(rnd(1500, 4000)) };
      const g = R(); quiz.FU2 = { v: g < .35 ? 1 : g < .85 ? 2 : 3, ms: Math.round(rnd(1500, 4000)) };
      if (!quizDone) Object.keys(quiz).forEach((k, j) => { if (j > 3 + (i % 5)) delete quiz[k]; });
      const u = {
        i, id: 'T' + String(i + 1).padStart(3, '0'), nome, cognome, name: nome + ' ' + cognome,
        code: 'NIA-' + Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(R() * 32)]).join(''),
        email: (nome + '.' + cognome).toLowerCase().replace(/[^a-z.]/g, '') + (i % 7) + '@email.it', age: ri(19, 34), area: pick(QUARTIERI),
        color: AVC[i % 8], z, err, speeder, joinDay, lastDay, consent, quizDone, quiz, engage,
        joinedAt: +dayDate(joinDay) - rnd(0, 8) * 36e5, ratings: [], impressions: 0, daily: [], acts: [], parts: [], points: 0, tasks: {}
      };
      users.push(u);
    }
    const qv = (u, c) => (u.quiz[c] || {}).v;
    /* profilo stimato dal questionario (0–1) e interessi stimati: come nell'app */
    users.forEach(u => {
      const a = c => qv(u, c) || 3, n01 = v => (v - 1) / 4;
      u.est = { soc: n01((a('E1') + a('SA2')) / 2), cur: n01(a('O3')), plan: n01((a('C1') + 6 - a('SP2')) / 2), act: clamp(.5 + (a('E1') - 3) * .08 + (a('SA2') - 3) * .06 - (a('PR1') - 3) * .08, 0, 1) };
      u.tru = { soc: Phi(u.z.soc), cur: Phi(u.z.cur), plan: Phi(u.z.plan), act: Phi(.5 * u.z.soc - .5 * u.z.home) };
      const ti = { Sport: u.z.soc * .4 - u.z.home * .4, Musica: u.z.cur * .5, Cucina: u.z.soc * .3 + u.z.home * .3, Arte: u.z.cur * .6, Giochi: u.z.soc * .5, Natura: u.z.cur * .3 - u.z.home * .3, Cinema: u.z.home * .5, Lettura: u.z.plan * .3 - u.z.soc * .3, Cultura: u.z.cur * .5 + u.z.plan * .2 };
      u.intTrue = {}; INTERESTS.forEach(k => u.intTrue[k] = Phi(ti[k] + gauss() * .45));
      const sc = { Sport: a('E1') + a('SA2') * .5, Musica: a('O3') + a('VO3') * .5, Cucina: a('OS3') + a('PR1') * .4, Arte: a('O3') * 1.2, Giochi: a('SA2') + a('OS3') * .4, Natura: a('O3') * .6 + (6 - a('PR1')) * .6, Cinema: a('PR1') * .7 + a('VO3') * .4, Lettura: (6 - a('E1')) * .6 + a('C1') * .5, Cultura: a('O3') * .8 + a('C1') * .3 };
      const mx = Math.max(...Object.values(sc)), mn = Math.min(...Object.values(sc)); u.intEst = {}; INTERESTS.forEach(k => u.intEst[k] = mx > mn ? (sc[k] - mn) / (mx - mn) : .5);
    });
    const vOf = x => x.v || { soc: .5, cur: .5, plan: .5, act: .5 };
    const util = (p, ints, x) => { const v = vOf(x), d = Math.abs(v.soc - p.soc) * 1.2 + Math.abs(v.cur - p.cur) + Math.abs(v.plan - p.plan) * .8 + Math.abs(v.act - p.act) * .7; return (1 - d / 3.7) + (x.interest && ints[x.interest] != null ? ints[x.interest] * .45 : .15); };

    /* feed e voti: ordinato con la stima, votato con la verità */
    const allU = []; users.forEach(u => content.concat(board).forEach(x => allU.push(util(u.tru, u.intTrue, x))));
    const uMean = allU.reduce((s, x) => s + x, 0) / allU.length, uSd = Math.sqrt(allU.reduce((s, x) => s + (x - uMean) ** 2, 0) / allU.length);
    const rateOf = (u, x, rank) => clamp(Math.round(3 + 1.25 * (util(u.tru, u.intTrue, x) - uMean) / uSd - rank * .025 + gauss() * (u.speeder ? 1.6 : .75)), 1, 5);
    users.forEach(u => {
      if (!u.quizDone) return;
      [[content.filter(x => x.type !== 'bacheca'), 'feed'], [board, 'bacheca']].forEach(([list, kind]) => {
        const scored = list.map(x => ({ x, r: util(u.est, u.intEst, x) })), mx = Math.max(...scored.map(s => s.r)), mn = Math.min(...scored.map(s => s.r));
        scored.forEach(s => s.aff = Math.round(mx > mn ? 22 + (s.r - mn) / (mx - mn) * 74 : 70));
        scored.sort((a, b) => b.aff - a.aff).forEach((s, k) => s.rank = k + 1);
        const depth = kind === 'bacheca' ? ri(2, list.length) : Math.round(clamp(4 + u.engage * 13 + gauss() * 2, 3, list.length));
        scored.slice(0, depth).forEach(s => {
          u.impressions++;
          if (R() > .86 - u.engage * .1) return;                         // visto ma non votato
          const v = rateOf(u, s.x, s.rank), deep = R() < .14 + u.engage * .1;
          const day = clamp(u.joinDay + Math.floor(R() * (u.lastDay - u.joinDay + 1)), 0, DAYS - 1);
          u.ratings.push({ id: s.x.id, type: s.x.type, title: s.x.title, rank: s.rank, aff: s.aff, feed: kind === 'bacheca' ? (s.rank <= 3 ? 'affini' : 'tutti') : (s.aff >= cfg.threshold ? 'affini' : 'tutti'), v, deep,
            likert: deep ? [v, clamp(v + Math.round(gauss() * .7), 1, 5), clamp(v + Math.round(gauss()), 1, 5), clamp(Math.round(3.6 + gauss() * .9), 1, 5)] : null, day, ms: Math.round(rnd(1500, 9000)) });
        });
      });
    });

    /* domande del giorno (test-retest) */
    const likCodes = ITEMS.map(i => i.code), per = cfg.dailyPerDay;
    users.forEach(u => {
      if (!u.quizDone) return;
      const order = likCodes.slice(); for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
      const span = Math.min(cfg.dailyDays, DAYS - u.joinDay);
      let done = 0;
      for (let d = 0; d < span; d++) {
        const day = u.joinDay + d; if (day > u.lastDay + 1) break;
        if (R() > .35 + u.engage * .6) continue;                         // giorno saltato
        done++;
        for (let j = 0; j < per; j++) {
          const code = order[(d * per + j) % order.length], it = ITEMS.find(x => x.code === code);
          const e = it.st * u.err[code] + Math.sqrt(1 - it.st * it.st) * gauss();
          const x = u.speeder ? gauss() * 1.3 : it.l * (u.z[it.c] + gauss() * .12) + Math.sqrt(1 - it.l * it.l) * e;
          u.daily.push({ day, d, code, v: toLik(x), ms: Math.round(Math.exp(rnd(7.3, 8.8))) });
        }
      }
      u.daysDone = done;
    });

    /* community: attività create dai tester, richieste, partecipazioni, feedback */
    const actives = users.filter(u => u.quizDone && u.engage > .35);
    const activities = [];
    for (let k = 0; k < Math.round(N * .15); k++) {
      const org = pick(actives.filter(u => R() < Phi(u.z.soc + .3)).concat(actives.slice(0, 1))), interest = pick(INTERESTS), day = clamp(org.joinDay + ri(0, 6), 0, DAYS - 1);
      const a = { id: 'A' + String(k + 1).padStart(3, '0'), type: 'community', title: pick(ACT_T[interest]), interest, org: org.id, who: org.nome, day, max: ri(4, 10),
        v: { soc: clamp(rnd(.3, 1), 0, 1), cur: rnd(.2, .95), plan: rnd(.2, .9), act: rnd(.1, .95) }, place: org.area + ', Milano', status: day < DAYS - 3 ? 'conclusa' : 'in programma' };
      activities.push(a); org.acts.push(a.id);
    }
    const parts = [], reports = [];
    activities.forEach(a => {
      const cands = actives.filter(u => u.id !== a.org).map(u => [u, R() + u.z.soc * .3]).sort((x, y) => y[1] - x[1]).map(x => x[0]).slice(0, ri(2, a.max + 2));
      cands.forEach((u, j) => {
        const pAff = Math.round(clamp(util(u.est, u.intEst, a) * 70, 15, 98)), tU = util(u.tru, u.intTrue, a);
        const accepted = j < a.max && R() > .12, st = !accepted ? (R() < .5 ? 'in attesa' : 'non accolta') : a.status === 'conclusa' ? 'conclusa' : 'accettata';
        const p = { act: a.id, user: u.id, status: st, aff: pAff, day: a.day };
        if (st === 'conclusa' || st === 'accettata') p.pre = clamp(Math.round(3 + (tU - uMean) / uSd + gauss() * .8), 1, 5);
        if (st === 'conclusa') {
          const sat = clamp(Math.round(3.3 + 1.1 * (tU - uMean) / uSd + gauss() * .8), 1, 5);
          p.post = [sat, clamp(Math.round(3 + 1.2 * (tU - uMean) / uSd + gauss() * .7), 1, 5), clamp(Math.round(3.6 + gauss() * .8), 1, 5)];
          p.host = clamp(Math.round(sat + gauss() * .6), 1, 5);
          p.noShow = R() < .05; p.orgLevel = p.noShow ? null : clamp(Math.round(3.1 + gauss() * .7), 1, 4);
          if (p.host === 1 && R() < .6) { const code = 'CP-' + String(10 + Math.floor(R() * 89)) + String(a.day + 1).padStart(2, '0') + '-' + ri(10, 99); reports.push({ code, act: a.id, from: u.id, against: a.org, day: a.day + 1, text: pick(['L\'organizzatore ha cambiato luogo all\'ultimo senza avvisare e un partecipante si è sentito escluso.', 'Durante l\'attività ci sono stati commenti offensivi verso una persona del gruppo.', 'Ritardo di oltre un\'ora e comportamento aggressivo quando gliel\'abbiamo fatto notare.']) }); p.report = code; }
        }
        parts.push(p); u.parts.push(p);
      });
    });
    if (!reports.length) reports.push({ code: 'CP-2410-37', act: activities[0].id, from: users[3].id, against: activities[0].org, day: 9, text: 'Comportamento scortese verso una partecipante.' });

    /* match casa: gruppi di 2–4 coinquilini */
    const houses = [], pool = users.filter(u => u.quizDone).sort(() => R() - .5);
    let h = 0;
    while (pool.length > 3 && houses.length < Math.round(N * .12)) {
      const m = pool.splice(0, ri(2, 4)), H = { id: 'H' + String(++h).padStart(2, '0'), members: m.map(x => x.id), pairs: [] };
      for (let a = 0; a < m.length; a++) for (let b = a + 1; b < m.length; b++) {
        const keys = ['PR1', 'OB1', 'CS2', 'OS3'], pred = Math.round(clamp(100 - keys.reduce((s, k) => s + Math.abs((qv(m[a], k) || 3) - (qv(m[b], k) || 3)), 0) / keys.length * 22, 25, 96));
        const truth = 100 - (Math.abs(m[a].z.home - m[b].z.home) + Math.abs(m[a].z.night - m[b].z.night) + Math.abs(m[a].z.plan - m[b].z.plan) + Math.abs(m[a].z.soc - m[b].z.soc)) / 4 * 30;
        const smokeClash = (qv(m[a], 'FU1') === 3 && qv(m[b], 'FU2') < 3) || (qv(m[b], 'FU1') === 3 && qv(m[a], 'FU2') < 3);
        H.pairs.push({ a: m[a].id, b: m[b].id, pred: smokeClash ? Math.min(pred, 45) : pred, rate: clamp(Math.round(1 + (truth - 20) / 20 + gauss() * .7 - (smokeClash ? 1 : 0)), 1, 5), smokeClash });
      }
      houses.push(H); m.forEach(x => x.house = H.id);
    }

    /* profilo «di oggi» dai voti (come Match.evolution) e scostamento dal questionario */
    const byId = {}; content.concat(board, activities).forEach(x => byId[x.id] = x);
    users.forEach(u => {
      const now = Object.assign({}, u.est), K = ['soc', 'cur', 'plan', 'act'];
      u.ratings.slice().sort((a, b) => a.day - b.day).forEach(r => {
        const x = byId[r.id]; if (!x) return; const v = vOf(x); let w = (r.v - 3) / 2; if (r.deep) w *= 1.5;
        K.forEach(k => { const d = v[k] - now[k]; now[k] = clamp(now[k] + (w > 0 ? w * d * .14 : w * d * .07), 0, 1); });
      });
      u.now = now; u.drift = K.reduce((s, k) => s + Math.abs(now[k] - u.est[k]), 0) / K.length * 100;
      /* qualità delle risposte */
      const vals = ITEMS.map(it => qv(u, it.code)).filter(Boolean), ts = ITEMS.map(it => (u.quiz[it.code] || {}).ms).filter(Boolean);
      const avg = ts.length ? ts.reduce((s, x) => s + x, 0) / ts.length : 0, fast = ts.filter(t => t < 1200).length, distinct = new Set(vals).size;
      u.quality = { avgMs: avg, fast, distinct, neutral: vals.filter(v => v === 3).length, score: Math.round(clamp(100 - fast * 8 - (distinct < 3 ? 25 : 0) - Math.max(0, vals.filter(v => v === 3).length - 4) * 6, 15, 100)) };
      /* task e punti (stesse regole dell'app) */
      const T = u.tasks, rs = u.ratings;
      if (u.quizDone) T.questionario = 50;
      const affs = rs.filter(r => r.feed === 'affini' && r.type !== 'bacheca'); if (affs.length >= 4) T.affini = 40;
      if (rs.filter(r => r.feed === 'tutti' && r.type !== 'bacheca').length >= 3) T.tutti = 20;
      if (rs.some(r => r.type === 'evento') && rs.some(r => r.type === 'attivita')) T.eventi = 20;
      if (u.house) { T.casa = 30; if (R() < .7) T.casa_val = 15; }
      if (u.acts.length) T.crea = 40;
      if (u.parts.some(p => p.status === 'conclusa')) T.partecipa = 60;
      u.points = Object.values(T).reduce((s, x) => s + x, 0) + rs.length * cfg.ratingPts + rs.filter(r => r.deep).length * cfg.deepPts + (u.daysDone || 0) * 5;
      u.progress = Math.round(Object.keys(T).length / 8 * 100);
      /* stato */
      u.status = !u.consent ? 'Senza consenso' : !u.quizDone ? 'Onboarding' : u.lastDay >= DAYS - 3 ? 'Attivo' : u.lastDay - u.joinDay < 2 ? 'Abbandonato' : 'Inattivo';
      u.lastAt = +dayDate(u.lastDay) + rnd(-5, 8) * 36e5;
    });
    /* livelli aggregati degli host */
    activities.forEach(a => { const fb = parts.filter(p => p.act === a.id && p.host); a.hostAvg = fb.length ? fb.reduce((s, p) => s + p.host, 0) / fb.length : null; a.fbN = fb.length; });

    return { DAYS, start: +start, dayDate, users, content, board, activities, parts, reports, houses, ITEMS, CONSTRUCTS, byId, cfg };
  }
  window.Sim = { generate, ITEMS, CONSTRUCTS };
})();
