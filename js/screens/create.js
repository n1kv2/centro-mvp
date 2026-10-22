/* 1c · Crea un'attività community.
   1 · una sola schermata con tre sezioni separate: informazioni, descrizione (con Nia o a mano), date (singole o ricorrenti)
   2 · cosa offre (fino a 3) → 3 · clima (fino a 3) → 4 · intensità → anteprima → pubblicata */
(function () {
  const esc = App.esc, S = () => Store.s;
  const D = () => {
    const d = (S().draft = S().draft || {});
    return Object.assign(d, Object.assign({ interest: '', max: 6, offers: [], climates: [], climateOther: '', descMode: 'nia', text: '', descText: '',
      sched: { mode: 'single', singles: [], rule: null, exc: [] } }, d));
  };
  const save = () => Store.save();
  const steps = n => `<div class="steps">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const NIA_GRAD = 'linear-gradient(90deg,#FB815F 0%,#F256B6 23%,#E453F7 44%,#A540E4 62%,#5E52E9 79%,#377BF9 97%)';
  const spark = (c, s) => `<svg width="${s || 20}" height="${s || 20}" viewBox="0 0 24 24" fill="${c || '#fff'}" style="flex:none"><path d="M10 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM18 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></svg>`;
  const MAX_PICK = 3;

  const INTERESTS = ['Sport', 'Arte', 'Cucina', 'Giochi', 'Musica', 'Natura'];
  const HUE = { Sport: 145, Arte: 20, Cucina: 35, Giochi: 260, Musica: 300, Natura: 195, Cultura: 225, Lettura: 230 };
  const OFFERS = [['Conoscere persone', 'Stare con gente nuova'], ['Sfidarsi', 'Mettersi alla prova'], ['Imparare o migliorare', 'Crescere in qualcosa'], ['Scoprire qualcosa di nuovo', 'Provare, esplorare'],
    ['Rilassarsi', 'Staccare la testa'], ['Fare del bene', 'Aiutare gli altri'], ['Utilità o carriera', 'Competenze e contatti'], ['Stimolo intellettuale', 'Idee e confronto']];
  const CLIMATES = [['Rilassato', 'Senza pressione, ognuno col suo ritmo'], ['Collaborativo', 'Si fa insieme, ci si aiuta'], ['Competitivo', 'Si gioca per vincere'], ['Creativo', 'Si inventa e si sperimenta']];
  const INTENS = [['Leggera', 'Si partecipa senza fatica', 1], ['Media', 'Serve un po\' di impegno', 2], ['Alta', 'Richiede molto sforzo', 3]];
  const MS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const DN = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  window.actCover = a => a.photo ? `background:url(${a.photo}) center/cover` : `--h:${HUE[a.interest] != null ? HUE[a.interest] : 220}`;
  window.actHue = i => HUE[i] != null ? HUE[i] : 220;

  const opt = (t, s, on, attrs) => `<div class="opt2${on ? ' on' : ''}" ${attrs}><div class="tx"><div class="h3">${t}</div>${s ? `<div class="b15">${s}</div>` : ''}</div>
    <div class="ck sq">${on ? ic('check', { size: 16, color: '#fff', sw: 2.6 }) : ''}</div></div>`;

  /* ---------- date: modello e testo ---------- */
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseIso = s => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
  const tclean = t => (t || '').replace(/^0(\d)/, '$1');
  const short = d => `${DN[d.getDay()].slice(0, 3)} ${d.getDate()} ${MS[d.getMonth()]}`;
  const tomorrow = () => iso(new Date(Date.now() + 864e5));
  /* sched → { dates:[{kind,title,sub}], count, cardWhen } (stesso formato di Nia, usato da card e dettaglio) */
  function buildDates(sc) {
    const out = { dates: [], count: 0, cardWhen: '' };
    if (sc.mode === 'rule' && sc.rule) {
      const r = sc.rule, from = parseIso(r.from), first = new Date(from); first.setDate(first.getDate() + ((r.dow - first.getDay() + 7) % 7));
      const last = new Date(first); last.setDate(last.getDate() + 7 * (r.weeks - 1));
      const inSerie = x => { const d = parseIso(x.d); return d >= first && d <= last && d.getDay() === r.dow; };
      const skips = sc.exc.filter(x => x.skip && inSerie(x)).length;
      out.count = r.weeks - skips;
      out.dates.push({ kind: 'rule', title: `Ogni ${DN[r.dow].toLowerCase()} · ${tclean(r.start)}–${tclean(r.end)}`, sub: `Dal ${first.getDate()} ${MS[first.getMonth()]} al ${last.getDate()} ${MS[last.getMonth()]} · ${out.count} date` });
      sc.exc.forEach(x => { const d = parseIso(x.d); out.dates.push(x.skip ? { kind: 'skip', title: `${short(d)} · saltata`, sub: 'Nessun incontro' } : { kind: 'exc', title: `${short(d)} · ${tclean(r.start)}`, sub: `Eccezione: ${x.note}` }); });
      out.cardWhen = `Ogni ${DN[r.dow].toLowerCase()} · ${tclean(r.start)}`;
    } else {
      const ss = sc.singles.slice().sort((a, b) => a.d < b.d ? -1 : 1);
      ss.forEach(x => out.dates.push({ kind: 'single', title: `${short(parseIso(x.d))} · ${tclean(x.start)}–${tclean(x.end)}`, sub: 'Data singola' }));
      out.count = ss.length;
      if (ss.length) out.cardWhen = `${short(parseIso(ss[0].d))} · ${tclean(ss[0].start)}${ss.length > 1 ? ` · +${ss.length - 1}` : ''}`;
    }
    return out;
  }
  window.buildDates = buildDates;
  const PILL = { rule: ['bl', 'Ricorrente'], single: ['gr', 'Singola'], exc: ['at', 'Eccezione'], skip: ['di', 'Saltata'] };

  /* ---------- sezioni della schermata 1 ---------- */
  function descSection(d) {
    const nia = d.descMode === 'nia';
    let body;
    if (!nia) body = `<textarea class="nbox desc" id="desc" placeholder="Descrivi l'attività: cosa si fa, cosa portare, eventuali note…">${esc(d.descText)}</textarea>`;
    else if (!d.descText) body = `<textarea class="nbox" id="niaText" placeholder="Scrivi come ti viene, Nia la rende chiara e ordinata">${esc(d.text)}</textarea>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">${EX.map((e, i) => `<span class="chip sm exm" data-act="ex" data-i="${i}">«${e}»</span>`).join('')}</div>
      <div class="btn${d.text.trim() ? '' : ' off'}" id="niaGo" style="background:${NIA_GRAD};gap:10px;height:48px" data-act="niaGo">${spark()}Sistema con Nia</div>`;
    else body = `<textarea class="nbox desc" id="desc">${esc(d.descText)}</textarea>
      <div class="nprompt soft">${spark('#C058F0', 20)}<input id="niaEdit" placeholder="Chiedi una modifica a Nia"><button class="nsend" data-act="editNia" aria-label="Invia a Nia">${ic('chev', { size: 18, color: '#fff', sw: 2.4 })}</button></div>
      <button class="link" data-act="niaReset" style="align-self:flex-start;padding:2px 4px">Riscrivi da capo</button>`;
    return `<div style="position:relative;display:flex;flex-direction:column;gap:12px"><div class="nseg"><div class="${nia ? 'on' : ''}" data-act="descMode" data-m="nia"><span>Con Nia</span></div><div class="${nia ? '' : 'on'}" data-act="descMode" data-m="man"><span>A mano</span></div></div>
      ${body}<span class="ferr" style="display:block;min-height:0"></span>
      <div class="nload" id="nload"><div class="ndots"><i></i><i></i><i></i></div><div class="h3">Nia sta sistemando la descrizione…</div></div></div>`;
  }
  function dateList(d) {
    const rule = d.sched.mode === 'rule';
    return buildDates(d.sched).dates.map((x, i) => `${i ? '<div class="sep"></div>' : ''}<div class="rw"><div class="ico" style="background:#F5F5F7">${ic('calendar')}</div>
      <div class="tx"><div class="h3" style="font-size:16px">${esc(x.title)}</div><div class="b15">${esc(x.sub)}</div></div><span class="pl ${PILL[x.kind][0]}">${PILL[x.kind][1]}</span>
      ${x.kind === 'rule' ? '' : `<button class="rmx" data-act="rmDate" data-i="${rule ? i - 1 : i}" aria-label="Rimuovi">${ic('close', { size: 14, color: '#9AA3AF', sw: 2.2 })}</button>`}</div>`).join('');
  }
  function dateSection(d) {
    const sc = d.sched, rule = sc.mode === 'rule', r = sc.rule;
    const list = dateList(d);
    const ruleForm = r ? `<div class="gy" style="gap:10px">
        <div style="display:flex;gap:8px"><label class="field" style="flex:1"><span class="b13" style="padding:0 8px">Ogni</span><select class="inp" id="rDow">${DN.map((x, i) => `<option value="${i}"${r.dow === i ? ' selected' : ''}>${x.toLowerCase()}</option>`).join('')}</select></label>
          <label class="field"><span class="b13" style="padding:0 8px">Dal</span><input class="inp" type="date" id="rFrom" value="${r.from}"></label></div>
        <div style="display:flex;gap:8px"><label class="field"><span class="b13" style="padding:0 8px">Inizio</span><input class="inp" type="time" id="rStart" value="${r.start}"></label>
          <label class="field"><span class="b13" style="padding:0 8px">Fine</span><input class="inp" type="time" id="rEnd" value="${r.end}"></label></div>
        <div class="rw" style="justify-content:space-between;padding:0 4px"><span class="b17" style="color:#000">Per quante settimane</span>
          <div class="rw" style="width:auto;gap:8px"><button class="stp" data-act="weeks" data-d="-1" aria-label="Meno">−</button><b style="min-width:26px;text-align:center">${r.weeks}</b><button class="stp" data-act="weeks" data-d="1" aria-label="Più">+</button></div></div></div>` : '';
    return `<div class="seg"><div class="${rule ? '' : 'on'}" data-act="schedMode" data-m="single">Date singole</div><div class="${rule ? 'on' : ''}" data-act="schedMode" data-m="rule">Ricorrente</div></div>
      ${ruleForm}
      <div id="dateList" style="display:flex;flex-direction:column;gap:10px">${list}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="chip sm" data-act="addDate">${ic('plus', { size: 16, color: '#4D4D4D' })}${rule ? 'Aggiungi eccezione' : 'Aggiungi data'}</span></div>
      ${rule ? `<div class="b13">Le date ricorrenti restano una sola attività: chi partecipa si iscrive alla serie.</div>` : ''}`;
  }
  const EX = ['Corsa tranquilla di 6 km nel parco, poi caffè insieme per chi vuole', 'Giochi da tavolo per principianti, porto io Catan e Dixit'];

  /* ---------- 1 · Informazioni, descrizione, date ---------- */
  const TARGETS = ['Tutti', 'Principianti', 'Studenti', 'Lavoratori', 'Nuovi in città', 'Chi viene da solo'];
  App.screen('create', {
    top: 'main',
    render() {
      const d = D(), all = INTERESTS.concat(d.interest && !INTERESTS.includes(d.interest) ? [d.interest] : []), b = buildDates(d.sched);
      const h = d.coverHue != null ? d.coverHue : d.interest ? actHue(d.interest) : null;
      const bg = d.photo ? `background-image:url(${d.photo})` : h == null ? '' : `background:linear-gradient(160deg,hsl(${h} 80% 88%),hsl(${h + 12} 75% 74%) 55%,hsl(${h + 24} 70% 62%))`;
      return {
        hero: `<div class="cover${d.photo ? ' has-img' : ''}" style="${bg}"></div>
          <div class="cover-tags"><span class="pl">Passo 1 di 4</span></div>
          <div class="cover-act"><label class="gl">${ic('camera', { size: 18, color: '#C2541B' })}Modifica copertina<input type="file" accept="image/*" id="coverIn" hidden></label>
            <span class="gl sq" data-act="niaCover" aria-label="Copertina suggerita da Nia">${ic('sparkle', { size: 18, color: '#C2541B' })}</span></div>`,
        cls: 'cover-on',
        html: `<div class="title-card" data-f="title"><input class="title-in" id="title" placeholder="Titolo dell'attività" maxlength="48" value="${esc(d.title || '')}" aria-label="Titolo"></div>
          ${Sec.card({ id: 'cat', icon: 'grid', title: 'Categoria', sub: d.interest || 'Scegli il tema della tua attività', done: !!d.interest, open: !d.interest,
            body: `<div class="fbtags">${all.map(i => `<span class="chip${d.interest === i ? ' on' : ''}" data-act="interest" data-v="${esc(i)}">${esc(i)}</span>`).join('')}<span class="chip" data-act="addInterest" aria-label="Altro interesse">+</span></div>` })}
          ${Sec.card({ id: 'dates', icon: 'calendar', title: 'Data e ora', sub: b.count ? `${b.cardWhen}${d.sched.mode === 'rule' ? ` · ${b.count} date` : ''}` : 'Imposta il giorno e gli orari', done: b.count > 0, body: dateSection(d) })}
          ${Sec.card({ id: 'place', icon: 'pin', title: 'Luogo', sub: d.place || 'Inserisci l\'indirizzo del ritrovo', done: !!(d.place || '').trim(),
            body: `<input class="inp" id="place" placeholder="Es. Parco Sempione, ingresso nord" value="${esc(d.place || '')}" aria-label="Luogo">
              <div class="sub">${ic('lock', { color: '#7B7B7C' })}<div class="b15">L'indirizzo esatto lo vedono solo i partecipanti accettati.</div></div>` })}
          ${Sec.card({ id: 'desc', icon: 'info', title: 'Informazioni', sub: d.descText ? d.descText.split('\n')[0] : 'Descrivi brevemente cosa si farà', done: !!d.descText.trim(), body: descSection(d) })}
          ${Sec.card({ id: 'seats', icon: 'seat', title: 'Posti disponibili', sub: `${d.max} persone`, done: true,
            body: `<div class="rw" style="justify-content:space-between"><span class="b17" style="color:#000">Numero massimo di partecipanti</span><div class="rw" style="width:auto;gap:8px">
              <button class="stp" data-act="max" data-d="-1" aria-label="Meno">−</button><b style="min-width:26px;text-align:center">${d.max}</b><button class="stp" data-act="max" data-d="1" aria-label="Più">+</button></div></div>` })}
          ${Sec.card({ id: 'target', icon: 'target', title: 'Per chi', sub: d.perChi || 'Il pubblico ideale (facoltativo)', done: !!d.perChi,
            body: `<div class="fbtags">${TARGETS.map(t => `<span class="chip sm${d.perChi === t ? ' on' : ''}" data-act="perChi" data-v="${t}">${t}</span>`).join('')}</div>` })}`,
        cta: `<div class="btn" data-act="next">Avanti</div>`
      };
    },
    mount(v) {
      const d = D(), bind = (id, fn) => { const e = v.querySelector('#' + id); if (e) e.addEventListener('input', () => fn(e)); return e; };
      document.getElementById('coverIn').addEventListener('change', e => readPhoto(e.target.files[0], url => { d.photo = url; save(); App.refresh(); }));
      bind('title', e => { d.title = e.value; save(); e.closest('.title-card').classList.remove('bad'); });
      bind('place', e => { d.place = e.value; save(); const sx = e.closest('.sx'); sx.classList.remove('bad'); sx.querySelector('.sx-t span').textContent = e.value || 'Inserisci l\'indirizzo del ritrovo'; sx.classList.toggle('done', !!e.value.trim()); });
      bind('niaText', e => { d.text = e.value; save(); document.getElementById('niaGo').classList.toggle('off', !e.value.trim()); });
      const ds = bind('desc', e => { d.descText = e.value; save(); fit(e); e.closest('.sx').classList.remove('bad'); });
      if (ds) fit(ds);
      const ne = v.querySelector('#niaEdit'); if (ne) ne.addEventListener('keydown', e => { if (e.key === 'Enter') App.screens.create.actions.editNia(); });
      const r = d.sched.rule, rupd = () => { save(); document.getElementById('dateList').innerHTML = dateList(d); };
      if (r) {
        bind('rDow', e => { r.dow = +e.value; rupd(); }); bind('rFrom', e => { if (e.value) { r.from = e.value; rupd(); } });
        bind('rStart', e => { r.start = e.value; rupd(); }); bind('rEnd', e => { r.end = e.value; rupd(); });
        ['rDow'].forEach(id => v.querySelector('#' + id).addEventListener('change', e => { r.dow = +e.target.value; rupd(); }));
      }
    },
    actions: {
      interest(el) { D().interest = el.dataset.v; save(); App.refresh(); },
      perChi(el) { const d = D(); d.perChi = d.perChi === el.dataset.v ? '' : el.dataset.v; save(); App.refresh(); },
      niaCover() { const d = D(); d.photo = ''; d.coverHue = Math.floor(Math.random() * 360); save(); App.refresh(); App.toast('Nia · nuova copertina proposta'); },
      addInterest() {
        App.sheet(`<div class="h2" style="padding:4px 4px 0">Altro interesse</div><input class="inp" id="newInt" placeholder="Es. Fotografia" maxlength="20"><div class="btn" data-act="saveInt">Aggiungi</div>`);
        setTimeout(() => document.getElementById('newInt').focus(), 320);
      },
      saveInt() { const v = document.getElementById('newInt').value.trim(); if (v) { D().interest = v.charAt(0).toUpperCase() + v.slice(1); save(); } App.closeOv(); App.refresh(); },
      max(el) { const d = D(); d.max = Math.max(2, Math.min(30, d.max + +el.dataset.d)); save(); App.refresh(); },
      /* descrizione */
      descMode(el) { D().descMode = el.dataset.m; save(); App.refresh(); },
      ex(el) { D().text = EX[+el.dataset.i]; save(); App.refresh(); },
      niaGo() {
        const d = D(); if (!d.text.trim()) return;
        document.getElementById('nload').classList.add('on');
        App.later(() => { d.nia = Nia.parse(d.text, d).desc; d.descText = Nia.descText(d.nia); save(); App.refresh(); App.toast('Nia · descrizione pronta, puoi modificarla'); }, 1300);
      },
      editNia() {
        const d = D(), i = document.getElementById('niaEdit'), p = i.value.trim(); if (!p) return;
        const base = d.nia && Nia.descText(d.nia) === d.descText ? d.nia : null;
        if (base) { const r = Nia.edit(base, p); d.nia = r.d; d.descText = Nia.descText(r.d); App.toast('Nia · ' + r.msg); }
        else { d.descText = d.descText.replace(/\s*$/, '') + `\nNote: ${p.charAt(0).toUpperCase() + p.slice(1).replace(/\.?$/, '.')}`; App.toast('Nia · l\'ho aggiunto alle note'); }
        save(); App.refresh();
      },
      niaReset() { const d = D(); d.descText = ''; d.nia = null; save(); App.refresh(); },
      /* date */
      schedMode(el) {
        const sc = D().sched; sc.mode = el.dataset.m;
        if (sc.mode === 'rule' && !sc.rule) { const t = new Date(Date.now() + 864e5); sc.rule = { dow: t.getDay(), from: iso(t), start: '18:00', end: '20:00', weeks: 8 }; }
        save(); App.refresh();
      },
      weeks(el) { const r = D().sched.rule; r.weeks = Math.max(2, Math.min(30, r.weeks + +el.dataset.d)); save(); App.refresh(); },
      addDate() { dateSheet(D().sched.mode === 'rule'); },
      rmDate(el) { const sc = D().sched, i = +el.dataset.i; (sc.mode === 'rule' ? sc.exc : sc.singles.sort((a, b) => a.d < b.d ? -1 : 1)).splice(i, 1); save(); App.refresh(); },
      next() {
        const d = D(), b = buildDates(d.sched); let ok = true, first = null;
        [['title', !!(d.title || '').trim()], ['cat', !!d.interest], ['dates', b.count > 0], ['place', !!(d.place || '').trim()], ['desc', !!d.descText.trim()]].forEach(([k, good]) => {
          const el = k === 'title' ? document.querySelector('[data-f="title"]') : document.querySelector(`[data-sx="${k}"]`);
          el.classList.toggle('bad', !good); if (!good) { ok = false; first = first || el; if (k !== 'title') Sec.open(k); }
        });
        if (!ok) App.toast('Completa le sezioni evidenziate');
        if (!ok) { App.buzz(30); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
        App.go('createOffer');
      }
    }
  });
  const fit = ta => { ta.style.height = 'auto'; ta.style.height = Math.max(120, ta.scrollHeight + 2) + 'px'; };

  /* sheet: data singola oppure eccezione alla serie */
  function dateSheet(isExc) {
    const d = D(), r = d.sched.rule;
    App.sheet(`<div class="h2" style="padding:4px 4px 0">${isExc ? 'Aggiungi eccezione' : 'Aggiungi data'}</div>
      <label class="field"><span class="b13" style="padding:0 8px">Giorno</span><input class="inp" type="date" id="sDate" value="${tomorrow()}"></label>
      ${isExc ? `<div class="seg"><div class="on" data-act="excKind" data-k="skip">Salta questa data</div><div data-act="excKind" data-k="note">Cambia qualcosa</div></div>
          <input class="inp hide" id="sNote" placeholder="Es. partenza da Piazza Duomo">`
        : `<div style="display:flex;gap:8px"><label class="field"><span class="b13" style="padding:0 8px">Inizio</span><input class="inp" type="time" id="sStart" value="18:00"></label>
          <label class="field"><span class="b13" style="padding:0 8px">Fine</span><input class="inp" type="time" id="sEnd" value="20:00"></label></div>`}
      <div class="btn" data-act="saveDate">Salva</div>`);
    let kind = 'skip';
    App.actions.excKind = el => { kind = el.dataset.k; el.parentNode.querySelectorAll('div').forEach(x => x.classList.toggle('on', x === el)); document.getElementById('sNote').classList.toggle('hide', kind !== 'note'); };
    App.actions.saveDate = () => {
      const v = id => (document.getElementById(id) || {}).value, dt = v('sDate'); if (!dt) return;
      if (isExc) d.sched.exc.push(kind === 'skip' ? { d: dt, skip: true } : { d: dt, skip: false, note: v('sNote') || 'Cambio di programma' });
      else d.sched.singles.push({ d: dt, start: v('sStart') || '18:00', end: v('sEnd') || '20:00' });
      save(); App.closeOv(); App.refresh();
    };
  }

  /* ---------- 2 · Cosa offre (fino a 3) ---------- */
  function limitShake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); App.buzz([20, 40, 20]); App.toast(`Massimo ${MAX_PICK} scelte: togline una`); }
  App.screen('createOffer', {
    top: 'main',
    render() {
      const d = D();
      return {
        html: `${steps(2)}<div class="h1">Cosa offre?</div>
          <div class="b17" style="padding:0 4px;margin-top:-6px;display:flex;justify-content:space-between;width:100%;box-sizing:border-box"><span>Scegli fino a ${MAX_PICK}</span><span class="pl bl">${d.offers.length} / ${MAX_PICK}</span></div>
          ${OFFERS.map(([t, s]) => opt(t, s, d.offers.includes(t), `data-act="pick" data-v="${t}"`)).join('')}`,
        cta: `<div class="btn${d.offers.length ? '' : ' off'}" data-go="createClimate">Avanti</div>`
      };
    },
    actions: {
      pick(el) {
        const d = D(), v = el.dataset.v, i = d.offers.indexOf(v);
        if (i >= 0) d.offers.splice(i, 1); else if (d.offers.length >= MAX_PICK) return limitShake(el); else d.offers.push(v);
        save(); App.refresh();
      }
    }
  });

  /* ---------- 3 · Clima (fino a 3, anche «Altro») ---------- */
  const climateCount = d => d.climates.length + (d.climateOther.trim() ? 1 : 0);
  App.screen('createClimate', {
    top: 'main',
    render() {
      const d = D(), n = climateCount(d), otherOn = d.climateOpen || !!d.climateOther.trim();
      return {
        html: `${steps(3)}<div class="h1">Che clima si respira?</div>
          <div class="b17" style="padding:0 4px;margin-top:-6px;display:flex;justify-content:space-between;width:100%;box-sizing:border-box"><span>Scegli fino a ${MAX_PICK}</span><span class="pl bl" id="ccount">${n} / ${MAX_PICK}</span></div>
          ${CLIMATES.map(([t, s]) => opt(t, s, d.climates.includes(t), `data-act="pick" data-v="${t}"`)).join('')}
          <div class="opt2${otherOn ? ' on' : ''}" data-act="other"><div class="tx"><div class="h3">Altro…</div>
            ${otherOn ? `<input class="bare" id="cOther" placeholder="Descrivilo in una parola" maxlength="24" value="${esc(d.climateOther)}" style="font:400 15px 'DM Sans';margin-top:4px">` : ''}</div>
            <div class="ck sq">${d.climateOther.trim() ? ic('check', { size: 16, color: '#fff', sw: 2.6 }) : ''}</div></div>`,
        cta: `<div class="btn${n ? '' : ' off'}" data-go="createIntensity" id="cGo">Avanti</div>`
      };
    },
    mount(v) {
      const i = v.querySelector('#cOther'); if (!i) return;
      i.addEventListener('click', e => e.stopPropagation());
      i.addEventListener('input', () => {
        const d = D(); d.climateOther = i.value; save();
        const n = climateCount(d); document.getElementById('ccount').textContent = `${n} / ${MAX_PICK}`; document.getElementById('cGo').classList.toggle('off', !n);
      });
      if (!i.value) i.focus();
    },
    actions: {
      pick(el) {
        const d = D(), v = el.dataset.v, i = d.climates.indexOf(v);
        if (i >= 0) d.climates.splice(i, 1); else if (climateCount(d) >= MAX_PICK) return limitShake(el); else d.climates.push(v);
        save(); App.refresh();
      },
      other(el) {
        const d = D();
        if (d.climateOpen || d.climateOther.trim()) { d.climateOpen = false; d.climateOther = ''; }
        else if (climateCount(d) >= MAX_PICK) return limitShake(el);
        else d.climateOpen = true;
        save(); App.refresh();
      }
    }
  });

  /* ---------- 4 · Intensità ---------- */
  App.screen('createIntensity', {
    top: 'main',
    render() {
      const d = D();
      return {
        html: `${steps(4)}<div class="h1">Quanto impegno richiede?</div><div class="b17" style="padding:0 4px;margin-top:-6px">Sforzo fisico o mentale, secondo il tipo di attività.</div>
          ${INTENS.map(([t, s, n]) => `<div class="opt2 tall${d.intensity === t ? ' on' : ''}" data-act="pick" data-v="${t}"><div class="rw"><div class="tx"><div class="h2">${t}</div><div class="b15">${s}</div></div>${d.intensity === t ? ic('check', { color: '#489DFE', sw: 2.4 }) : ''}</div>
            <div style="display:flex;gap:6px">${[1, 2, 3].map(k => `<i class="meter${k <= n ? ' on' : ''}"></i>`).join('')}</div></div>`).join('')}`,
        cta: `<div class="btn${d.intensity ? '' : ' off'}" data-go="createPreview">Vedi anteprima</div>`
      };
    },
    actions: { pick(el) { D().intensity = el.dataset.v; save(); App.refresh(); } }
  });

  /* card attività come la vedono gli altri (riusata in Esplora) */
  window.actCard = (a, o) => {
    o = o || {};
    const chips = [a.interest].concat(a.offers || [], climatesOf(a), a.intensity ? ['Intensità ' + a.intensity.toLowerCase()] : []);
    return `<div class="acard">
      <div class="acover phi" style="${actCover(a)}">${a.photo ? '' : `<span class="acover-i">${esc(a.interest || '').slice(0, 1)}</span>`}
        ${a.when ? `<span class="gl" style="position:absolute;left:14px;top:14px;height:38px;font-size:15px">${esc(a.when)}</span>` : ''}${o.badge || ''}</div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
        <div class="h1n" style="font-size:26px;line-height:32px">${esc(a.title)}</div>
        <div class="b15">${esc(a.who)} · ${esc(a.place || a.where || '')}${a.max ? ` · ${a.max} posti` : ''}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${chips.filter(Boolean).map(c => `<span class="chip sm">${esc(c)}</span>`).join('')}</div>${o.extra || ''}</div></div>`;
  };

  /* ---------- 7 · Anteprima ---------- */
  App.screen('createPreview', {
    top: 'main',
    render() {
      const d = D(), a = Object.assign({}, d, { who: S().user.nome || 'Tu', when: buildDates(d.sched).cardWhen, climates: d.climates.concat(d.climateOther.trim() ? [d.climateOther.trim()] : []) });
      return {
        html: `<div class="h1">Anteprima</div><div class="b17" style="padding:0 4px;margin-top:-6px">Così la vedranno gli altri tester in Esplora.</div>
          ${actCard(a)}
          <div class="card" style="padding:16px"><div class="b15" style="text-transform:uppercase;letter-spacing:.4px">Descrizione</div><div class="b17" style="white-space:pre-line;color:#000">${esc(d.descText || '')}</div></div>
          <div class="gy" style="background:#E4F1FF"><div class="b15" style="color:#123F73">Appena pubblicata compare nel feed di tutti i tester, ordinata per affinità con ciascuno.</div></div>`,
        cta: `<div class="btn" data-act="publish">Conferma e pubblica</div><div class="btn s" data-act="edit">Modifica</div>`
      };
    },
    actions: {
      edit() { App.backTo('create'); },
      publish() {
        const d = D(), id = 'u' + Date.now().toString(36);
        const b = buildDates(d.sched);
        const act = Object.assign({}, d, { id, who: S().user.nome || 'Tu', code: S().code.replace('NIA-', ''), mine: true, when: b.cardWhen, dates: b.dates, count: b.count, desc: d.descText, createdAt: Date.now(), joined: 1, requests: [],
          climates: d.climates.concat(d.climateOther.trim() ? [d.climateOther.trim()] : []) });
        ['nia', 'text', 'descMode', 'climateOther', 'climateOpen', 'descText'].forEach(k => delete act[k]);
        S().myActs = (S().myActs || []).concat([{ id, role: 'org', status: 'Attiva' }]);
        S().userActs = (S().userActs || []).concat([act]);
        S().draft = null; save();
        const pts = Store.completeTask('crea');
        App.reset(['home', { name: 'createDone', p: { id, pts } }]);
      }
    }
  });

  /* ---------- 8 · Pubblicata ---------- */
  App.screen('createDone', {
    top: 'main', nav: true, noBack: true,
    render(p) {
      return {
        cnStyle: 'align-items:center',
        html: `<div style="height:120px;flex:none"></div>
          <div class="okc">${ic('check', { size: 48, color: '#fff', sw: 2.6 })}</div>
          <div class="h1" style="align-self:center">Attività pubblicata</div>
          <div class="b17" style="text-align:center">La trovi in «Le mie attività», dove gestisci richieste e chat.</div>
          <span class="pl bl">${p.pts ? `+${p.pts} punti · task completato` : 'Attività aggiunta alle tue'}</span>`,
        cta: `<div class="btn" data-go="actHub" data-p='{"id":"${p.id}"}'>Apri la dashboard</div><div class="btn s" data-act="home">Torna alla home</div>`,
        cls: 'cta-nav'
      };
    },
    mount() { App.updateTop(); },
    actions: { home() { App.reset(['home']); } }
  });
})();
