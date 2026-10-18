/* Stato del prototipo + persistenza in localStorage (poi API, README §8) */
(function () {
  const KEY = 'centro_mvp_proto_v1';
  const code = () => 'NIA-' + Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random() * 32 | 0]).join('');
  const fresh = () => ({
    v: 1,
    user: { nome: '', cognome: '', email: '', tel: '', bio: '', photo: '' },
    code: code(),
    consentAt: null,
    onbDone: false,
    answers: {}, times: {},
    auto: true,
    tasks: {},            // id -> true
    bonus: 0,             // punti extra (valutazioni singole)
    ratings: {},          // id contenuto -> { v, deep, at }
    notifs: [
      { id: 'n1', t: 'Benvenuto nel test', s: 'Completa i task per sbloccare il biglietto omaggio', at: 'ora', read: false, kind: 'tasks' }
    ],
    settings: { mail: true, req: true, chat: true, remind: false, distance: false, km: 10, city: 'Milano' },
    consentRead: []
  });

  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
  S = Object.assign(fresh(), S); S.settings = Object.assign(fresh().settings, S.settings);

  const Store = {
    get s() { return S; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } },
    reset() { S = fresh(); this.save(); },
    set(path, v) { const k = path.split('.'); let o = S; while (k.length > 1) o = o[k.shift()]; o[k[0]] = v; this.save(); },

    /* ---- task, punti, avanzamento ---- */
    taskDone(id) { return !!S.tasks[id]; },
    completeTask(id) {
      if (S.tasks[id]) return 0;
      S.tasks[id] = true; this.save();
      const t = DATA.tasks.find(x => x.id === id); return t ? t.pts : 0;
    },
    addPoints(n) { S.bonus += n; this.save(); return n; },
    points() { return DATA.tasks.reduce((s, t) => s + (S.tasks[t.id] ? t.pts : 0), 0) + S.bonus; },
    eur() { return Math.min(DATA.maxEur, this.points() * DATA.eurPerPoint); },
    fragments() { return DATA.tasks.filter(t => S.tasks[t.id]).length; },
    progress() { return Math.round(this.fragments() / DATA.tasks.length * 100); },
    unread() { return S.notifs.filter(n => !n.read).length; },
    notify(n) { S.notifs.unshift(Object.assign({ id: 'n' + Date.now(), at: 'ora', read: false }, n)); this.save(); },

    /* ---- questionario ---- */
    allQs() { return DATA.blocks.flatMap(b => b.qs.map(q => Object.assign({ blk: b.id }, q))); },
    answered() { return this.allQs().filter(q => S.answers[q.code] != null).length; },
    blockAnswered(id) { return DATA.blocks.find(b => b.id === id).qs.filter(q => S.answers[q.code] != null).length; },
    fillRandom() {
      this.allQs().forEach(q => { if (S.answers[q.code] == null) { S.answers[q.code] = 1 + (Math.random() * (q.type === 'choice' ? 2 : 5) | 0); S.times[q.code] = 2000 + Math.random() * 5000; } });
      this.save();
    },

    /* Profilo dimostrativo: le 5 domande del quartiere 1 spostano una base fissa. 0–100 */
    profile() {
      const a = c => (S.answers[c] || 3);
      const sh = v => (v - 3) * 12;
      const E = 50 + sh(a('E1')) * .6 + sh(a('SA2')) * .6;
      const O = 55 + sh(a('O3')) * 1.1;
      const C = 52 + sh(a('C1')) * 1.1;
      const SP = 50 + sh(a('SP2')) * 1.2;
      const cl = v => Math.round(Math.max(6, Math.min(96, v)));
      return {
        big5: { Apertura: cl(O), Coscienziosità: cl(C), Estroversione: cl(E), Amicalità: cl(64 + sh(a('SA2')) * .3), Stabilità: cl(58 - sh(a('SP2')) * .2) },
        traits: [
          { a: 'Riservato', b: 'Socievole', v: cl(E) },
          { a: 'Spontaneo', b: 'Pianificatore', v: cl((C + (100 - SP)) / 2) },
          { a: 'Tradizionale', b: 'Curioso', v: cl(O) }
        ]
      };
    },
    /* tr facoltativo: { soc, plan, cur } 0–100 (profilo di oggi); senza, usa il questionario */
    character(tr) {
      const p = this.profile(), t = tr ? [{ v: tr.soc }, { v: tr.plan }, { v: tr.cur }] : p.traits;
      if (t[0].v >= 55 && t[2].v >= 55) return { name: 'L\'Esploratore Sociale', d: 'Curiosità e voglia di persone nuove' };
      if (t[0].v >= 55) return { name: 'Il Cuore della Festa', d: 'Stai bene in mezzo agli altri' };
      if (t[2].v >= 55) return { name: 'Il Curioso Tranquillo', d: 'Scopri il mondo con i tuoi tempi' };
      if (t[1].v >= 55) return { name: 'L\'Architetto', d: 'Ami i piani chiari e le cose fatte bene' };
      return { name: 'Lo Spirito Libero', d: 'Segui l\'ispirazione del momento' };
    },
    /* Qualità delle risposte: tempo medio e varietà (versione semplificata di score.js) */
    quality() {
      const qs = this.allQs().filter(q => q.type !== 'choice'), vals = qs.map(q => S.answers[q.code]).filter(v => v != null);
      const ts = qs.map(q => S.times[q.code]).filter(Boolean);
      const avg = ts.length ? ts.reduce((s, x) => s + x, 0) / ts.length / 1000 : 0;
      const distinct = new Set(vals).size;
      const fast = ts.filter(t => t < 1200).length;
      const neutral = vals.filter(v => v === 3).length;
      return { avg, distinct, fast, neutral, n: vals.length,
        score: Math.round(Math.max(20, Math.min(100, 100 - fast * 8 - Math.max(0, neutral - 4) * 6 - (distinct < 3 ? 20 : 0)))) };
    }
  };
  window.Store = Store;
})();
