/* Feedback della community (design «valutazioni»): solo per le attività community.
   · Chi partecipa valuta l'attività/organizzatore su 5 livelli → cosa ha avuto valore / cosa ha pesato → invio anonimo.
   · L'organizzatore valuta i comportamenti dei partecipanti su 4 livelli, o l'assenza (avvisato / in ritardo / no show).
   · «Problema» apre la segnalazione al team Sicurezza con codice pratica; non finisce mai nel profilo pubblico.
   · Il pubblico vede solo segnali aggregati: livello a colori, tag ricorrenti, numero di attività. Niente stelle. */
(function () {
  const S = () => Store.s, esc = App.esc, save = () => Store.save();

  /* livelli pubblici (colori dal design) */
  const HOST_LV = {
    viola: { c: '#3445B4', b: '#EEF0FF', t: 'Spesso oltre le attese', d: 'Le attività superano frequentemente quanto promesso per cura, coinvolgimento e organizzazione.' },
    verde: { c: '#447B28', b: '#EEF7E8', t: 'Organizzazione affidabile', d: 'Le esperienze sono solide e ben gestite, con piccoli margini per renderle ancora più curate.' },
    turchese: { c: '#1C7C7D', b: '#E6F5F5', t: 'In linea con quanto descritto', d: 'La promessa viene rispettata con costanza; i dettagli possono ora rendere l\'esperienza ancora più ricca.' },
    giallo: { c: '#946400', b: '#FFF6DE', t: 'Esperienze variabili', d: 'Alcune attività funzionano meglio di altre: i feedback indicano come renderle più costanti.' },
    rosso: { c: '#B83227', b: '#FDECEA', t: 'Aspetti da considerare', d: 'Sono emerse priorità concrete su cui intervenire per far crescere le prossime attività.' },
    grigio1: { c: '#5B6472', b: '#F2F3F5', t: 'Nuovo organizzatore', d: 'Questo organizzatore sta iniziando il suo percorso. Il livello apparirà dopo le prime attività verificate.' },
    grigio2: { c: '#5B6472', b: '#F2F3F5', t: 'Profilo in aggiornamento', d: 'I feedback stanno arrivando, ma il campione è ancora ridotto. Il livello si formerà con altre attività verificate.' },
    oro: { c: '#9A6A00', b: '#FFF4D6', t: 'In miglioramento', d: 'Le attività più recenti mostrano un\'evoluzione positiva, con esperienze sempre più curate e coerenti.' }
  };
  const PART_LV = {
    viola: { c: '#3445B4', b: '#EEF0FF', t: 'Valorizza il gruppo', d: 'Partecipa con costanza, rispetta persone e spazi e contribuisce positivamente all\'esperienza.' },
    verde: { c: '#447B28', b: '#EEF7E8', t: 'Affidabilità consolidata', d: 'In più attività si è dimostrato puntuale, corretto e affidabile.' },
    turchese: { c: '#1C7C7D', b: '#E6F5F5', t: 'Partecipazione regolare', d: 'Ha partecipato correttamente, senza particolari aspetti positivi o criticità ricorrenti.' },
    giallo: { c: '#946400', b: '#FFF6DE', t: 'Affidabilità variabile', d: 'Il comportamento non è ancora costante: alcune esperienze sono positive, altre presentano ritardi o difficoltà organizzative.' },
    grigio1: { c: '#5B6472', b: '#F2F3F5', t: 'Nuovo partecipante', d: 'Non ha ancora concluso attività sufficienti.' },
    grigio2: { c: '#5B6472', b: '#F2F3F5', t: 'Profilo in formazione', d: 'Sono presenti alcuni feedback, ma non abbastanza per determinare un livello.' },
    oro: { c: '#9A6A00', b: '#FFF4D6', t: 'In miglioramento', d: 'Le partecipazioni più recenti mostrano un\'evoluzione positiva, con una presenza sempre più affidabile e collaborativa.' }
  };
  /* dati finti aggregati degli host e dei partecipanti */
  const HOSTS = {
    Anna: ['viola', 12, ['Affidabile', 'Cura dei dettagli', 'Puntualità perfetta']], Paolo: ['verde', 7, ['Accogliente', 'Ben organizzato']],
    Chiara: ['turchese', 5, ['Fedele alla descrizione', 'Clima rilassato']], Samir: ['oro', 4, ['Accogliente', 'Idee originali']],
    Giulia: ['grigio2', 2, []], Elena: ['grigio1', 0, []], Luca: ['giallo', 6, ['Energia', 'Orari da chiarire']], Marco: ['verde', 9, ['Atmosfera', 'Coinvolgente']]
  };
  const PARTS = { Luca: ['viola', ['Puntuale', 'Di ottima compagnia', 'Rispetta gli accordi']], Sara: ['verde', ['Di buona compagnia', 'Accogliente']],
    Marco: ['giallo', ['Ritardo senza preavviso']], Elena: ['grigio1', []], Giorgia: ['turchese', ['Corretto e rispettoso']], Davide: ['oro', ['In crescita']] };

  /* scale di valutazione */
  const USER_SC = {
    5: ['Oltre le attese', 'Più curata e coinvolgente di quanto promesso.'], 4: ['Ottima', 'Ben organizzata, chiara e molto piacevole.'],
    3: ['Come atteso', 'L\'esperienza ha rispettato la descrizione.'], 2: ['Poco chiara', 'Alcune informazioni o passaggi non erano chiari.'],
    1: ['Problema', 'È successo qualcosa che la community deve conoscere.']
  };
  const ORG_SC = {
    4: ['Ha contribuito', 'Ha reso l\'esperienza più semplice, inclusiva o piacevole.'], 3: ['Tutto regolare', 'Ha partecipato con rispetto, senza elementi particolari da segnalare.'],
    2: ['Da considerare', 'Un comportamento concreto ha inciso sull\'organizzazione o sul gruppo.'], 1: ['Problema', 'Un episodio di sicurezza che ha destabilizzato l\'attività.']
  };
  const SC_COL = { 5: '#3445B4', 4: '#447B28', 3: '#1C7C7D', 2: '#E9A62B', 1: '#F55F4F' };
  const ORG_COL = { 4: '#447B28', 3: '#1C7C7D', 2: '#E9A62B', 1: '#F55F4F' };
  const TAGS = {
    userPos: ['Accoglienza', 'Organizzazione', 'Puntualità', 'Cura dei dettagli', 'Clima del gruppo', 'Fedele alla descrizione'],
    userNeg: ['Ritardi', 'Informazioni poco chiare', 'Diversa dalla descrizione', 'Gruppo poco accogliente', 'Cambi all\'ultimo'],
    orgPos: ['Puntuale', 'Di ottima compagnia', 'Rispetta gli accordi', 'Accogliente', 'Propositivo'],
    orgNeg: ['Ritardo senza preavviso', 'Regole o spazi non rispettati', 'Poco collaborativo', 'Ha disturbato il gruppo'],
    danger: ['Comportamento inaccettabile', 'Segnala problema di sicurezza']
  };
  const ABS = [['avvisato', 'Aveva avvisato', 'Ha comunicato per tempo che non avrebbe partecipato.'], ['tardi', 'Aveva avvisato, in ritardo', 'Ha comunicato in ritardo che non avrebbe partecipato.'],
    ['noshow', 'No show', 'Non si è presentato e non ha comunicato la propria assenza.']];

  const lvlBox = (L, k) => `<div class="lvl" style="--lc:${L.c};--lb:${L.b}"><div class="lk">${ic('sparkle', { size: 16, color: L.c })}${k}</div><div class="lt">${L.t}</div><div class="ld">${L.d}</div></div>`;
  const hostOf = x => x.mine ? ['grigio1', (S().userActs || []).filter(a => a.archived).length, []] : (HOSTS[x.who] || ['grigio2', 1, []]);

  /* ---------- scheda pubblica sul dettaglio: «Cosa aspettarsi da …» ---------- */
  function hostCard(x, open) {
    const [k, n, tags] = hostOf(x), L = HOST_LV[k], name = x.mine ? 'te' : esc(x.who);
    return Sec.card({ id: 'fb', icon: 'star', title: 'Feedback community', sub: 'Cosa dice chi ha già partecipato', open,
      body: `<div class="mid-title">Cosa aspettarsi da <i>${name}</i></div>
        <div class="b15">Qui non troverai stelle o recensioni personali: solo segnali ricorrenti e generali, per proteggere chi ha partecipato.</div>
        ${lvlBox(L, 'VALUTAZIONE GENERALE')}
        ${tags.length ? `<div class="b13" style="font-style:italic">Tag più frequenti</div><div class="fbtags">${tags.map(t => `<span class="chip sm on">${t}</span>`).join('')}</div>` : ''}
        <div class="b15">Attività organizzate: <b style="color:#000">${n}</b></div>
        <div class="btn s" style="height:46px" data-act="fbInfo">Come funzionano i feedback</div>` });
  }
  /* affidabilità di chi chiede di partecipare (vista dall'organizzatore) */
  function partCard(name) {
    const [k, tags] = PARTS[name] || ['grigio1', []], L = PART_LV[k];
    return `${lvlBox(L, 'AFFIDABILITÀ')}${tags.length ? `<div class="fbtags">${tags.map(t => `<span class="chip sm">${t}</span>`).join('')}</div>` : ''}`;
  }
  App.actions.fbInfo = () => App.sheet(`<div class="h2" style="padding:4px 4px 0">Come funzionano i feedback</div>
    <div class="card" style="gap:10px"><div class="b17" style="color:#000">Dopo ogni attività, chi ha partecipato e chi organizza lasciano un feedback anonimo su <b>comportamenti</b>, non su persone.</div>
    <div class="sub">${ic('shield', { color: '#7B7B7C' })}<div class="b15">Un singolo feedback non viene mai mostrato da solo: entra in un gruppo anonimo e il livello si aggiorna solo quando i segnali sono ricorrenti.</div></div>
    <div class="sub">${ic('flag', { color: '#7B7B7C' })}<div class="b15">I problemi di sicurezza vanno al team, non nel profilo pubblico. Le segnalazioni false hanno conseguenze.</div></div>
    <div class="b13">Livelli possibili</div><div class="fbtags">${Object.values(HOST_LV).map(L => `<span class="chip sm" style="border-color:${L.c};color:${L.c}">${L.t}</span>`).join('')}</div></div>
    <div class="btn g" data-act="closeOv">Ho capito</div>`);

  /* ---------- blocco «livello + tag» riusato da partecipante e organizzatore ---------- */
  function scaleBlock(st, kind) {
    const SC = kind === 'org' ? ORG_SC : USER_SC, COL = kind === 'org' ? ORG_COL : SC_COL, max = kind === 'org' ? 4 : 5;
    const v = st.v, neg = v && v <= 2;
    const tags = !v ? [] : kind === 'org' ? (neg ? TAGS.orgNeg : TAGS.orgPos) : (neg ? TAGS.userNeg : TAGS.userPos);
    const danger = v === 1;
    const flagged = st.tags.some(t => TAGS.danger.includes(t)) || (kind === 'org' && v === 1);
    return `<div class="fbscale" role="radiogroup">${Array.from({ length: max }, (_, i) => i + 1).map(i => `<button class="${v === i ? 'on' : ''}" style="--fc:${COL[i]}" data-act="fbLv" data-v="${i}" data-k="${kind}" aria-label="${SC[i][0]}">${i}</button>`).join('')}</div>
      <div style="display:flex;justify-content:space-between" class="b13"><span>${SC[1][0]}</span><span>${SC[max][0]}</span></div>
      ${v ? `<div class="fbpick"><b>${SC[v][0]}</b><span class="b15">${SC[v][1]}</span></div>
        <div class="h3" style="font-size:16px">${neg ? 'Cosa ha pesato di più?' : 'Cosa ha avuto più valore?'}</div>
        <div class="fbtags">${tags.map(t => `<span class="chip sm${st.tags.includes(t) ? ' on' : ''}" data-act="fbTag" data-t="${esc(t)}" data-k="${kind}">${t}</span>`).join('')}
          ${danger && kind === 'user' ? TAGS.danger.map(t => `<span class="chip sm warn${st.tags.includes(t) ? ' on' : ''}" data-act="fbTag" data-t="${t}" data-k="${kind}">${ic('flag', { size: 14, color: '#C0392B' })}${t}</span>`).join('') : ''}</div>
        ${flagged ? `<div class="alertbox"><b>Questo richiede attenzione e un intervento concreto</b><div class="b15">Non finirà nel profilo pubblico: sarà gestito dal team Sicurezza. La tua identità resterà sempre protetta e anonima.</div>
          <div class="btn s" style="height:44px;color:#C0392B" data-act="fbReport" data-k="${kind}">${ic('flag', { size: 18, color: '#C0392B' })}Compila la segnalazione</div></div>` : ''}
        <div class="sub">${ic('lock', { color: '#7B7B7C' })}<div class="b15">I feedback non sono riconducibili a te.</div></div>` : ''}`;
  }

  /* ---------- 1 · Chi partecipa: valutazione finale (test + feedback all'organizzatore) ---------- */
  const FQ = ['È stata soddisfacente?', 'Era davvero affine a te?', 'Rispecchiava la descrizione?'];
  let hr = null;
  App.screen('hostRate', {
    top: 'main',
    render(p) {
      const x = Acts.find(p.id);
      if (!hr || hr.id !== p.id) hr = { id: p.id, f: [0, 0, 0], v: 0, tags: [] };
      const ready = hr.f.every(Boolean) && hr.v;
      return {
        html: `<div class="h1">Com'è andata?</div><div class="b17" style="padding:0 4px;margin-top:-6px">Valutazione finale · ${esc(x.title)}</div>
          ${Sec.card({ id: 'test', icon: 'stats', title: 'Per il test', sub: 'Tre domande sull\'attività', staticOpen: true,
            body: FQ.map((q, i) => `<div style="display:flex;flex-direction:column;gap:8px"><div class="h3" style="font-size:16px">${q}</div>${Rate.scale('hf' + i, hr.f[i], 'No', 'Molto')}</div>`).join('') })}
          ${Sec.card({ id: 'host', icon: 'face', title: 'Feedback a ' + esc(x.who), sub: 'Anonimo · meno di un minuto', staticOpen: true,
            body: `<div class="b17" style="color:#000">Com'è andata con il gruppo? ✨</div>${scaleBlock(hr, 'user')}` })}
          <div class="b13" style="padding:0 6px">Valutano organizzatore e partecipanti; poi l'attività passa in Archivio.</div>`,
        cta: `<div class="btn${ready ? '' : ' off'}" id="hrGo" data-act="send">Invia in forma anonima · +${DATA.ratingPts} punti</div>`
      };
    },
    actions: {
      pick5(el) {
        if (el.dataset.n === 'quick') return App.actions.pick5(el);
        hr.f[+el.dataset.n.slice(2)] = +el.dataset.v; Rate.paint(el.dataset.n, +el.dataset.v); App.buzz();
        document.getElementById('hrGo').classList.toggle('off', !(hr.f.every(Boolean) && hr.v));
      },
      send() {
        if (!(hr.f.every(Boolean) && hr.v)) return;
        const id = hr.id, x = Acts.find(id);
        Rate.save({ id: id + ':dopo', title: x.title + ' · dopo', type: 'community', rank: x.rank, aff: x.aff }, hr.f[0], { likert: hr.f.slice() });
        (S().hostFb = S().hostFb || {})[id] = { v: hr.v, tags: hr.tags.slice(), at: Date.now() };
        const st = S().parts[id]; st.post = hr.f.slice(); st.status = 'archived';
        const pts = Store.completeTask('partecipa');
        if (pts) Store.notify({ t: 'Task completato: partecipa a un\'attività', s: 'Nuovo pezzo del biglietto', kind: 'tasks' });
        save(); hr = null;
        App.reset(['home', { name: 'myActs', p: { seg: 'arch' } }, { name: 'fbThanks', p: { name: x.who, pts } }]);
      }
    }
  });
  App.actions.fbLv = el => {
    const st = el.dataset.k === 'org' ? orgSt() : hr, v = +el.dataset.v;
    if (st.v && (st.v <= 2) !== (v <= 2)) st.tags = [];       // cambia il gruppo di tag: si riparte
    if (v !== 1) st.tags = st.tags.filter(t => !TAGS.danger.includes(t));
    st.v = v; App.buzz(); App.refresh();
  };
  App.actions.fbTag = el => {
    const st = el.dataset.k === 'org' ? orgSt() : hr, t = el.dataset.t, i = st.tags.indexOf(t);
    if (i >= 0) st.tags.splice(i, 1); else if (st.tags.length < 3 || TAGS.danger.includes(t)) st.tags.push(t); else return App.toast('Al massimo 3');
    App.refresh();
  };
  App.actions.fbReport = el => {
    const p = App.current.p, x = Acts.find(p.id);
    const who = el.dataset.k === 'org' ? (org && org.sel ? org.sel : 'un partecipante') : x.who;
    App.go('report', { id: p.id, who, role: el.dataset.k === 'org' ? 'partecipante' : 'organizzatore' });
  };

  /* ---------- Segnalazione al team Sicurezza ---------- */
  App.screen('report', {
    top: 'main',
    render(p) {
      if (p.code) return {
        cnStyle: 'align-items:center',
        html: `<div style="height:40px;flex:none"></div><div class="okc">${ic('check', { size: 48, color: '#fff', sw: 2.6 })}</div>
          <div class="h1" style="align-self:center;text-align:center">Segnalazione inviata</div>
          <div class="b17" style="text-align:center">Gli altri utenti non vedranno accuse o dettagli non verificati. Se servirà, il team applicherà una limitazione di sicurezza direttamente al profilo. Potresti essere ricontattato dal nostro centro di assistenza per ulteriori accertamenti. Ti ringraziamo.</div>
          <div class="b13">CODICE PRATICA</div><div class="pcode">${p.code}</div><div class="b15">Il Team CEnTRO</div>`,
        cta: `<div class="btn" data-back>Torna alla valutazione</div>`
      };
      return {
        html: `<div class="h1">Modulo di segnalazione</div><div class="b17" style="padding:0 4px;margin-top:-6px">Segnala un comportamento inadeguato ${p.role === 'organizzatore' ? 'dell\'organizzatore' : 'di ' + esc(p.who)}</div>
          <div class="card" style="gap:12px"><div class="mid-title" style="font-size:20px;line-height:26px">La tua sicurezza è la nostra priorità</div>
            <div class="b17" style="color:#4D4D4D">Ci dispiace che l'esperienza non sia stata all'altezza. Descrivi brevemente cosa è successo. Il nostro team verificherà l'accaduto entro 24 ore per prendere i provvedimenti necessari. La tua identità resterà sempre protetta e anonima.</div>
            <textarea class="inp" id="rep" style="height:150px" placeholder="Descrivi meglio la situazione…" maxlength="1200"></textarea>
            <div class="b13">Si precisa che eventuali dichiarazioni false comporteranno i provvedimenti previsti dai Termini e Condizioni della piattaforma.</div></div>`,
        cta: `<div class="btn off" id="repGo" data-act="send" style="background:#C0392B">Invia segnalazione</div>`
      };
    },
    mount(v) { const t = v.querySelector('#rep'); if (t) t.addEventListener('input', () => document.getElementById('repGo').classList.toggle('off', t.value.trim().length < 10)); },
    actions: {
      send() {
        const t = document.getElementById('rep').value.trim(); if (t.length < 10) return;
        const d = new Date(), code = `CP-${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}-${10 + Math.floor(Math.random() * 89)}`;
        (S().reports = S().reports || []).push({ code, act: App.current.p.id, who: App.current.p.who, text: t, at: Date.now() }); save();
        App.current.p.code = code; App.refresh();
      }
    }
  });

  /* ---------- Conferma «Grazie per il feedback» ---------- */
  App.screen('fbThanks', {
    top: 'main', nav: true, tab: 'profile',
    render(p) {
      return {
        cnStyle: 'align-items:center',
        html: `<div style="height:60px;flex:none"></div><div class="okc">${ic('check', { size: 48, color: '#fff', sw: 2.6 })}</div>
          <div class="b13" style="letter-spacing:.5px">FEEDBACK RICEVUTO</div><div class="h1" style="align-self:center;text-align:center">Grazie per il feedback</div>
          <div class="b17" style="text-align:center">Il tuo contributo entra in un gruppo anonimo di altre valutazioni. Non sarà mostrato da solo e non aggiornerà subito il profilo ${p.name ? 'di ' + esc(p.name) : 'dei partecipanti'}.</div>
          ${p.pts ? `<span class="pl bl">+${p.pts} punti · task completato</span>` : ''}
          <div class="btn s" style="height:46px;width:auto;padding:0 20px" data-act="fbInfo">Come funzionano i feedback</div>`,
        cta: `<div class="btn" data-back>Continua</div>`
      };
    }
  });

  /* ---------- 2 · Chi organizza: «Valuta i comportamenti, non le persone» ---------- */
  let org = null;
  const orgSt = () => org.st[org.sel] = org.st[org.sel] || { v: 0, tags: [], present: true, abs: null };
  App.screen('orgRate', {
    top: 'main',
    render(p) {
      const a = Acts.find(p.id), ms = Acts.members(a).filter(m => m.n !== 'Tu');
      if (!org || org.id !== p.id) org = { id: p.id, sel: ms[0] ? ms[0].n : null, st: {}, done: {} };
      const allDone = ms.every(m => org.done[m.n]);
      const person = org.sel && !org.done[org.sel] ? (() => {
        const st = orgSt(), n = esc(org.sel);
        const absBody = `<div class="b15">Indica soltanto se aveva avvisato. Un'assenza comunicata non produce alcun segnale negativo.</div>
          ${ABS.map(([k, t, d]) => `<div class="opt2${st.abs === k ? ' on' : ''}" data-act="orgAbs" data-v="${k}"><div class="tx"><div class="h3">${t}</div><div class="b15">${d.replace('presentato', 'presentato/a')}</div></div><div class="ck">${st.abs === k ? ic('check', { size: 16, color: '#fff', sw: 2.6 }) : ''}</div></div>`).join('')}`;
        const can = st.present ? !!st.v : !!st.abs;
        return Sec.card({ id: 'p:' + org.sel, icon: 'user', title: n, sub: 'Partecipante verificato', staticOpen: true,
          body: `<div class="seg"><div class="${st.present ? 'on' : ''}" data-act="orgPres" data-v="1">Era presente</div><div class="${st.present ? '' : 'on'}" data-act="orgPres" data-v="0">Non era presente</div></div>
            ${st.present ? `<div class="b17" style="color:#000">Come valuteresti la sua partecipazione all'attività?</div>${scaleBlock(st, 'org')}` : absBody}
            <div class="btn${can ? '' : ' off'}" style="height:48px" data-act="orgOk">Conferma</div>` });
      })() : '';
      return {
        html: `<div class="h1">Chiudi e valuta</div><div class="b17" style="padding:0 4px;margin-top:-6px">${esc(a.title)}</div>
          ${Sec.card({ id: 'intro', icon: 'users', title: 'Valuta i comportamenti, non le persone', sub: `${ms.filter(m => org.done[m.n]).length} di ${ms.length} valutati`, staticOpen: true,
            body: `<div class="sub">${ic('heart', { color: '#7B7B7C' })}<div class="b15">Il tuo contributo aiuterà la community a connettersi meglio, favorendo interazioni più consapevoli e affini.</div></div>
              ${ms.length ? ms.map((m, i) => `<div class="selp${org.sel === m.n && !org.done[m.n] ? ' on' : ''}${org.done[m.n] ? ' done' : ''}" data-act="orgSel" data-n="${esc(m.n)}">
                <div class="av" style="background:${['#F5A25D', '#BA7BE0', '#6FD7E1', '#8194FF', '#7BD389'][i % 5]}">${esc(m.n[0])}</div>
                <div class="tx"><div class="h3">${esc(m.n)}</div><div class="b15">${org.done[m.n] ? 'Valutato' : m.friendOf ? 'Amico/a di ' + esc(m.friendOf) : 'Partecipante'}</div></div>
                <span class="rd">${org.done[m.n] ? ic('check', { size: 14, color: '#fff', sw: 3 }) : ''}</span></div>`).join('')
              : '<div class="b15">Nessun partecipante da valutare: puoi chiudere l\'attività.</div>'}` })}
          ${person}`,
        cta: `<div class="btn${allDone ? '' : ' off'}" data-act="close">Invia e archivia</div>`
      };
    },
    actions: {
      orgSel(el) { org.sel = el.dataset.n; if (org.done[org.sel]) delete org.done[org.sel]; App.refresh(); },
      orgPres(el) { const st = orgSt(); st.present = el.dataset.v === '1'; App.refresh(); },
      orgAbs(el) { orgSt().abs = el.dataset.v; App.refresh(); },
      orgOk() {
        const st = orgSt(); if (st.present ? !st.v : !st.abs) return;
        org.done[org.sel] = true;
        const a = Acts.find(org.id), next = Acts.members(a).filter(m => m.n !== 'Tu').find(m => !org.done[m.n]);
        org.sel = next ? next.n : null; App.buzz(); App.refresh();
      },
      close() {
        const a = Acts.find(org.id), ms = Acts.members(a).filter(m => m.n !== 'Tu'); if (!ms.every(m => org.done[m.n])) return;
        (S().orgFb = S().orgFb || {})[org.id] = org.st;
        const own = (S().userActs || []).find(u => u.id === org.id); if (own) own.archived = true; save();
        const id = org.id; org = null;
        App.reset(['home', { name: 'myActs', p: { seg: 'arch' } }, { name: 'fbThanks', p: {} }]);
      }
    }
  });

  window.Fb = { hostCard, partCard, HOST_LV, hostOf };
})();
