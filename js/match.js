/* Affinità persona-contenuto (versione dimostrativa dell'algoritmo, README §6.3).
   Profilo della persona dal questionario demo, profilo del contenuto da DATA.content[].v; risultato riscalato 22–96
   così il feed ha sempre una testa molto affine, una soglia e una coda. */
/* clima: le attività dei tester ne hanno fino a 3 (array), i contenuti del team uno solo */
window.climatesOf = x => x.climates || (x.climate ? [x.climate] : []);
(function () {
  const a = c => Store.s.answers[c] || 3;
  function personQ() {
    const pr = Store.profile();
    return {
      soc: pr.traits[0].v / 100, plan: pr.traits[1].v / 100, cur: pr.traits[2].v / 100,
      act: Math.max(0, Math.min(1, .5 + (a('E1') - 3) * .08 + (a('SA2') - 3) * .06 - (a('PR1') - 3) * .08))
    };
  }
  function interestsQ() {
    const sc = { Sport: a('E1') + a('SA2') * .5, Musica: a('O3') + a('VO3') * .5, Cucina: a('OS3') + a('PR1') * .4, Arte: a('O3') * 1.2, Giochi: a('SA2') + a('OS3') * .4,
      Natura: a('O3') * .6 + (6 - a('PR1')) * .6, Cinema: a('PR1') * .7 + a('VO3') * .4, Lettura: (6 - a('E1')) * .6 + a('C1') * .5, Cultura: a('O3') * .8 + a('C1') * .3 };
    const max = Math.max(...Object.values(sc)), min = Math.min(...Object.values(sc));
    const out = {}; Object.keys(sc).forEach(k => out[k] = max > min ? (sc[k] - min) / (max - min) : .5); return out;
  }
  /* profilo di un'attività creata da un tester, ricavato dalle sue scelte */
  function vOf(x) {
    if (x.v) return x.v;
    const o = x.offers || [], has = t => o.includes(t), cl = climatesOf(x);
    return {
      soc: has('Conoscere persone') ? .85 : cl.includes('Collaborativo') ? .7 : .5,
      cur: has('Scoprire qualcosa di nuovo') || has('Stimolo intellettuale') ? .8 : cl.includes('Creativo') ? .7 : .45,
      plan: x.dates && x.dates.some(d => d.kind === 'rule') ? .8 : .55,
      act: { Leggera: .2, Media: .55, Alta: .9 }[x.intensity] || .5
    };
  }
  function raw(x, p, ints) {
    const v = vOf(x);
    const d = Math.abs(v.soc - p.soc) * 1.2 + Math.abs(v.cur - p.cur) + Math.abs(v.plan - p.plan) * .8 + Math.abs(v.act - p.act) * .7;
    return (1 - d / 3.7) + (x.interest && ints[x.interest] != null ? ints[x.interest] * .45 : .15);
  }
  function scale(list) {
    if (!list.length) return list;
    const rs = list.map(x => x._r), mx = Math.max(...rs), mn = Math.min(...rs);
    list.forEach(x => { x.aff = Math.round(mx > mn ? 22 + (x._r - mn) / (mx - mn) * 74 : 70); delete x._r; });
    return list.sort((x, y) => y.aff - x.aff);
  }
  const label = aff => aff >= 82 ? ['ok', 'Molto in linea'] : aff >= DATA.threshold ? ['bl', 'In linea con te'] : aff >= 42 ? ['gr', 'Abbastanza'] : ['gr', 'Poco in linea'];
  const TYPE = { community: 'Community', evento: 'Evento', attivita: 'Attività', bacheca: 'Bacheca' };

  window.Match = {
    TYPE, label, personQ, interestsQ,
    /* profilo e interessi di oggi: questionario + quello che le valutazioni hanno spostato */
    person() { return Match.evolution().now; },
    interests() { return Match.evolution().intsNow; },
    /* tutti i contenuti dei tipi scelti, ordinati per affinità; rank = posizione nel feed.
       Le attività create da chi guarda restano fuori dal suo feed: non le valuta lui. */
    feed(types, withMine, fromQuiz) {
      const ev = fromQuiz ? null : Match.evolution(), p = ev ? ev.now : personQ(), ints = ev ? ev.intsNow : interestsQ();
      const mine = !withMine ? [] : (Store.s.userActs || []).map(x => Object.assign({ type: 'community', city: (x.place || '').split(',').pop().trim() }, x));
      const list = DATA.content.concat(mine).filter(x => types.includes(x.type)).map(x => Object.assign({}, x, { _r: raw(x, p, ints) }));
      scale(list).forEach((x, i) => x.rank = i + 1);
      return list;
    },
    board(fromQuiz) {
      const ev = fromQuiz ? null : Match.evolution(), p = ev ? ev.now : personQ(), ints = ev ? ev.intsNow : interestsQ();
      const list = DATA.board.map(x => Object.assign({ type: 'bacheca' }, x, { _r: raw(x, p, ints) }));
      scale(list).forEach((x, i) => x.rank = i + 1);
      return list;
    },
    /* Profilo che evolve: ogni voto sposta i tratti verso (voto alto) o lontano da (voto basso) il profilo del contenuto.
       Approfondite ×1,5, valutazione prima ×1,2, dopo un'attività ×2. Il questionario resta il punto di partenza. */
    evolution() {
      const K = ['soc', 'cur', 'plan', 'act'], base = personQ(), now = Object.assign({}, base), series = [0];
      const intsQ = interestsQ(), intsNow = Object.assign({}, intsQ);
      const pool = DATA.content.concat(DATA.board, Store.s.userActs || []);
      const rs = Object.values(Store.s.ratings || {}).filter(r => !String(r.id).startsWith('casa')).sort((x, y) => (x.at || 0) - (y.at || 0));
      let n = 0;
      rs.forEach(r => {
        const it = pool.find(x => x.id === String(r.id).split(':')[0]); if (!it) return;
        const v = vOf(it); let w = (r.v - 3) / 2;
        if (r.deep) w *= 1.5; if (/:prima$/.test(r.id)) w *= 1.2; if (/:dopo$/.test(r.id)) w *= 2;
        K.forEach(k => { const d = v[k] - now[k]; now[k] = Math.max(0, Math.min(1, now[k] + (w > 0 ? w * d * .14 : w * d * .07))); });
        if (it.interest && intsNow[it.interest] != null) intsNow[it.interest] = Math.max(0, Math.min(1, intsNow[it.interest] + w * .12));
        n++; series.push(K.reduce((s, k) => s + Math.abs(now[k] - base[k]), 0) / K.length * 100);
      });
      const parts = Object.values(Store.s.parts || {}).filter(x => x.status === 'archived').length;
      return { base, now, intsQ, intsNow, n, parts, series, dist: series[series.length - 1] };
    },
    /* Stabilità del feed: quanto l'ordine di oggi somiglia a quello previsto dal solo questionario.
       Stabile = il questionario aveva previsto bene; se cambia molto, la sua predittività è minore. */
    stability() {
      const T = ['community', 'evento', 'attivita'], q = Match.feed(T, false, true), now = Match.feed(T);
      const rq = {}; q.forEach(x => rq[x.id] = x.rank);
      const N = q.length, moved = now.reduce((s, x) => s + Math.abs(x.rank - rq[x.id]), 0) / N;
      const topQ = new Set(q.filter(x => x.aff >= DATA.threshold).map(x => x.id)), topN = now.filter(x => x.aff >= DATA.threshold).map(x => x.id);
      const inter = topN.filter(id => topQ.has(id)).length, uni = new Set([...topQ, ...topN]).size;
      return { pct: Math.round(Math.max(0, 100 - moved / (N / 2) * 100)), overlap: uni ? Math.round(inter / uni * 100) : 100, moved: Math.round(moved * 10) / 10,
        changes: now.filter(x => x.rank !== rq[x.id]).map(x => ({ id: x.id, title: x.title, from: rq[x.id], to: x.rank })) };
    },
    find(id) {
      const T = ['community', 'evento', 'attivita'], mine = ((Store.s.explore || {}).types || []).filter(t => t !== 'bacheca');
      return (mine.length && Match.feed(mine).find(x => x.id === id)) || Match.feed(T).find(x => x.id === id) || Match.board().find(x => x.id === id) || Match.feed(T, true).find(x => x.id === id);
    }
  };
})();
