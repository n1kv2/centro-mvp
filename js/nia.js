/* Nia simulata: dal testo libero ricava date (singole o regola ricorrente + eccezioni) e una descrizione ordinata.
   Nel prodotto vero è una chiamata a un modello (README §6.5); qui è un parser a regole, con fallback manuale. */
(function () {
  const DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const DAYS_RX = ['domenic', 'luned', 'marted', 'mercoled', 'gioved', 'venerd', 'sabat'];
  const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const MSHORT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const pad = n => String(n).padStart(2, '0');
  const hm = m => `${m / 60 | 0}:${pad(m % 60)}`;
  const dLabel = d => `${DAYS[d.getDay()].replace(/^./, c => c.toUpperCase()).slice(0, 3)} ${d.getDate()} ${MSHORT[d.getMonth()]}`;
  const longLabel = d => `${DAYS[d.getDay()].replace(/^./, c => c.toUpperCase())} ${d.getDate()} ${MSHORT[d.getMonth()]}`;

  function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function nextDow(dow, from) { const d = new Date(from); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7 || 7)); return d; }

  /* orari: «alle 9:30», «dalle 20», «dalle 18 alle 20», «9.30-11» */
  function parseTimes(t) {
    let m = t.match(/dalle\s+(\d{1,2})(?:[:.](\d{2}))?\s*(?:alle|-|–)\s*(\d{1,2})(?:[:.](\d{2}))?/);
    if (m) return [m[1] * 60 + (+m[2] || 0), m[3] * 60 + (+m[4] || 0)];
    m = t.match(/(\d{1,2})[:.](\d{2})\s*(?:-|–)\s*(\d{1,2})(?:[:.](\d{2}))?/);
    if (m) return [m[1] * 60 + +m[2], m[3] * 60 + (+m[4] || 0)];
    m = t.match(/(?:alle|dalle|ore|h)\s*(\d{1,2})(?:[:.](\d{2}))?/) || t.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (m) { const s = m[1] * 60 + (+m[2] || 0); return [s, s + 120]; }
    if (/\bsera\b|serata/.test(t)) return [20 * 60, 23 * 60];
    if (/mattin/.test(t)) return [10 * 60, 12 * 60];
    if (/pomeriggio/.test(t)) return [15 * 60, 17 * 60];
    return null;
  }
  /* date esplicite: «il 15 e il 22 gennaio», «15/1», «3 novembre» */
  function parseDates(t, base) {
    const out = [];
    const mrx = new RegExp(`((?:\\d{1,2}(?:\\s*(?:,|e|ed)\\s*(?:il\\s+)?)?)+)\\s*(${MONTHS.join('|')})`, 'g');
    let m;
    while ((m = mrx.exec(t))) {
      const mon = MONTHS.indexOf(m[2]);
      (m[1].match(/\d{1,2}/g) || []).forEach(dd => {
        const d = new Date(base.getFullYear(), mon, +dd); if (d < base) d.setFullYear(d.getFullYear() + 1); out.push(d);
      });
    }
    const srx = /\b(\d{1,2})\/(\d{1,2})\b/g;
    while ((m = srx.exec(t))) { const d = new Date(base.getFullYear(), +m[2] - 1, +m[1]); if (d < base) d.setFullYear(d.getFullYear() + 1); out.push(d); }
    if (/\bdomani\b/.test(t)) { const d = new Date(base); d.setDate(d.getDate() + 1); out.push(d); }
    return out;
  }
  /* fine serie: «fino a fine marzo», «fino al 30 marzo», «per 6 settimane» */
  function parseEnd(t, start) {
    let m = t.match(/fino a (?:fine )?(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/);
    if (m) { const mon = MONTHS.indexOf(m[1]); let d = new Date(start.getFullYear(), mon + 1, 0); if (d < start) d = new Date(start.getFullYear() + 1, mon + 1, 0); return d; }
    m = t.match(/fino al? (\d{1,2}) (\w+)/);
    if (m && MONTHS.includes(m[2])) { let d = new Date(start.getFullYear(), MONTHS.indexOf(m[2]), +m[1]); if (d < start) d.setFullYear(d.getFullYear() + 1); return d; }
    m = t.match(/per (\d{1,2}) settimane/);
    if (m) { const d = new Date(start); d.setDate(d.getDate() + 7 * (+m[1] - 1)); return d; }
    const d = new Date(start); d.setDate(d.getDate() + 7 * 9); return d;   // default: 10 settimane
  }
  /* eccezioni: «tranne il 5 aprile», «salta il 24 dicembre», «il 5 aprile partenza da Piazza Duomo» */
  function parseExceptions(t, base, orig) {
    const out = [];
    const rx = /(tranne|salvo|eccetto|salta(?:ndo)?)\s+(?:il\s+)?(\d{1,2})\s+(\w+)/g; let m;
    while ((m = rx.exec(t))) if (MONTHS.includes(m[3])) { const d = new Date(base.getFullYear(), MONTHS.indexOf(m[3]), +m[2]); if (d < base) d.setFullYear(d.getFullYear() + 1); out.push({ d, skip: true, note: 'Saltata' }); }
    const rx2 = /(?:il|ma il)\s+(\d{1,2})\s+(\w+)\s+([^,.;]+)/g;
    while ((m = rx2.exec(t))) if (MONTHS.includes(m[2]) && !/^(e|ed|,)/.test(m[3].trim()) && m[3].trim().length > 6) { const d = new Date(base.getFullYear(), MONTHS.indexOf(m[2]), +m[1]); if (d < base) d.setFullYear(d.getFullYear() + 1); out.push({ d, skip: false, note: orig.substr(m.index + m[0].length - m[3].length, m[3].length).trim().replace(/^./, c => c.toUpperCase()) }); }
    return out;
  }

  const TIPS = {
    Sport: ['adatta a chi inizia e a chi vuole tenere il ritmo con altri.', 'scarpe comode e una borraccia.', 'in caso di pioggia forte salta e lo scriviamo in chat.'],
    Giochi: ['nessuna esperienza richiesta: le regole si spiegano al tavolo.', 'se vuoi, il tuo gioco preferito.', 'chi arriva tardi si unisce alla partita successiva.'],
    Cucina: ['si cucina insieme, a ognuno il suo compito.', 'un grembiule e un contenitore per gli avanzi.', 'segnala in chat allergie o intolleranze.'],
    Musica: ['va bene qualsiasi livello: conta la voglia di suonare o ascoltare.', 'il tuo strumento, se ne hai uno.', 'il volume resta da salotto: rispettiamo i vicini.'],
    Arte: ['non serve saper disegnare: si sperimenta.', 'quello che ti ispira, il materiale base c\'è.', 'alla fine chi vuole mostra il suo lavoro.'],
    _: ['aperta a tutti, senza bisogno di esperienza.', 'solo la voglia di stare in compagnia.', 'eventuali cambi li scriviamo nella chat del gruppo.']
  };

  function cleanSentence(text) {
    const W = '[\\wàèéìòù]+';
    let s = text.replace(new RegExp(`\\b(ogni|tutti i|tutte le)\\s+${W}`, 'gi'), '').replace(/(tranne|salvo|eccetto|salta(ndo)?)\s+(il\s+)?\d{1,2}\s+\S+/gi, '')
      .replace(/\bdalle\s*\d{1,2}([:.]\d{2})?\s*(alle|-|–)\s*\d{1,2}([:.]\d{2})?/gi, '').replace(/\b(alle|dalle|ore)\s*\d{1,2}([:.]\d{2})?/gi, '')
      .replace(/\b\d{1,2}[:.]\d{2}\b/g, '').replace(/\bil\s+\d{1,2}(\s*(e|,)\s*(il\s+)?\d{1,2})*\s+\w+/gi, '').replace(/fino a[^,.]*/gi, '')
      .replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').replace(/^[,\s]+|[,\s]+$/g, '');
    if (!s) return '';
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return /[.!?]$/.test(s) ? s : s + '.';
  }

  window.Nia = {
    hm, dLabel,
    /* testo libero + bozza → { dates:[...], count, cardWhen, desc:{lead,info,bring,note}, understood } */
    parse(text, draft) {
      const t = ' ' + text.toLowerCase().replace(/’/g, "'") + ' ', base = today();
      const times = parseTimes(t) || [18 * 60, 20 * 60];
      const res = { dates: [], count: 0, cardWhen: '', understood: [] };
      const dowIdx = DAYS_RX.findIndex(d => new RegExp(`(^|\\s)${d}`).test(t));
      const recurring = dowIdx >= 0 && /(ogni|tutti i|tutte le)\s/.test(t);
      if (recurring) {
        const start = nextDow(dowIdx, base), end = parseEnd(t, start), ex = parseExceptions(t, base, ' ' + text.replace(/’/g, "'") + ' ');
        let n = 0; for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) if (!ex.some(e => e.skip && +e.d === +d)) n++;
        const dn = DAYS[dowIdx];
        res.dates.push({ kind: 'rule', dow: dowIdx, start: hm(times[0]), end: hm(times[1]), from: +start, to: +end,
          title: `Ogni ${dn} · ${hm(times[0])}–${hm(times[1])}`, sub: `Dal ${start.getDate()} ${MSHORT[start.getMonth()]} al ${end.getDate()} ${MSHORT[end.getMonth()]} · ${n} date` });
        ex.forEach(e => res.dates.push({ kind: e.skip ? 'skip' : 'exc', title: `${longLabel(e.d)} · ${e.skip ? 'saltata' : hm(times[0])}`, sub: e.skip ? 'Nessun incontro' : `Eccezione: ${e.note}` }));
        res.count = n; res.cardWhen = `Ogni ${dn} · ${hm(times[0])}`;
        res.understood.push('una regola ricorrente');
      } else {
        let ds = parseDates(t, base);
        if (!ds.length && dowIdx >= 0) ds = [nextDow(dowIdx, base)];
        ds.sort((a, b) => a - b).forEach(d => res.dates.push({ kind: 'single', d: +d, start: hm(times[0]), end: hm(times[1]), title: `${longLabel(d)} · ${hm(times[0])}–${hm(times[1])}`, sub: 'Data singola' }));
        res.count = ds.length; res.cardWhen = ds.length ? `${dLabel(ds[0])} · ${hm(times[0])}${ds.length > 1 ? ` · +${ds.length - 1}` : ''}` : '';
        if (ds.length) res.understood.push(ds.length > 1 ? `${ds.length} date` : 'una data');
      }
      const tips = TIPS[draft && draft.interest] || TIPS._;
      const lead = cleanSentence(text) || `${draft && draft.title ? draft.title : 'Un\'attività'} insieme ad altre persone della città.`;
      res.desc = { lead: lead + (draft && draft.place ? ` Ritrovo: ${draft.place}.` : ''), info: tips[0], bring: tips[1], note: tips[2] };
      return res;
    },
    /* modifica con un prompt: regole semplici e credibili */
    edit(desc, prompt) {
      const p = prompt.toLowerCase(), d = Object.assign({}, desc);
      if (/più (breve|corta)|accorcia|riassum/.test(p)) { d.lead = d.lead.split('. ')[0].replace(/\.?$/, '.'); d.info = ''; return { d, msg: 'Ho accorciato la descrizione.' }; }
      if (/informal|simpatic|amichevol/.test(p)) { d.lead = 'Ciao! ' + d.lead; d.note = d.note + ' Vi aspettiamo 🙂'; return { d, msg: 'Ho reso il tono più amichevole.' }; }
      let m = p.match(/porta(?:re)?\s+(.+)/); if (m) { d.bring = m[1].replace(/\.$/, '') + '.'; return { d, msg: 'Ho aggiornato «Porta con te».' }; }
      m = p.match(/(?:aggiungi|scrivi)(?: che)?\s+(.+)/); if (m) { d.note = (d.note ? d.note + ' ' : '') + m[1].charAt(0).toUpperCase() + m[1].slice(1).replace(/\.?$/, '.'); return { d, msg: 'Ho aggiunto la nota.' }; }
      d.note = (d.note ? d.note + ' ' : '') + prompt.charAt(0).toUpperCase() + prompt.slice(1).replace(/\.?$/, '.');
      return { d, msg: 'Fatto: l\'ho aggiunto alle note.' };
    },
    descText(d) { return d.lead + '\n\n' + [d.info && `Info: ${d.info}`, d.bring && `Porta con te: ${d.bring}`, d.note && `Note: ${d.note}`].filter(Boolean).join('\n'); }
  };
})();
