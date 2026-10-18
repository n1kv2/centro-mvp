/* 1a · Onboarding: video → registrazione → consenso → questionario → sommario → profilo e codice → riepilogo */
(function () {
  const esc = App.esc, S = () => Store.s;
  const steps = n => `<div class="steps">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>
    <div class="b15" style="align-self:flex-start;padding:0 4px">Passo ${n} di 6</div>`;

  /* ---------- 1 · Video di benvenuto ---------- */
  let vt = 0, vplaying = false, vsub = true, vspeed = 1;
  App.screen('welcome', {
    top: 'onb',
    render(p) {
      vt = 0; vplaying = false;
      const scenes = DATA.video.map((s, i) => `<div class="vscene" data-scene="${i}"><div class="ico b" style="width:64px;height:64px">${ic(['star', 'rate', 'gift'][i], { size: 30, color: '#489DFE' })}</div><b>${s.title}</b></div>`).join('');
      return {
        html: `<div class="h1">${p.review ? 'Rivedi il video' : 'Benvenuto'}</div>
        <div class="b17" style="padding:0 4px;margin-top:-6px">Guarda il video: ti spiega a cosa serve il test, come si valuta e cosa ottieni.</div>
        <div class="video phi" id="video" data-act="vtoggle">
          <div class="vchap" id="vchap">Video di spiegazione · 2–3 min</div>${scenes}
          <div class="play" id="vplay">${ic('play', { size: 30, color: '#fff', fill: '#fff' })}</div>
          <div class="vsub" id="vsubt"></div>
          <div class="vbar"><i id="vbar"></i></div>
          <span class="gl vexit" data-act="vfull" aria-label="Esci da schermo intero">${ic('close', { size: 20 })}</span>
        </div>
        <div style="display:flex;gap:8px">
          <span class="chip sm${vsub ? ' on' : ''}" data-act="vsub" id="cSub">Sottotitoli</span>
          <span class="chip sm" data-act="vspeed" id="cSpeed">${String(vspeed).replace('.', ',')}×</span>
          <span class="chip sm" data-act="vfull">${ic('expand', { size: 16, color: '#4D4D4D' })}Schermo intero</span></div>
        <div class="card"><div class="h3">Cosa vedrai nel video</div>
          <div class="b17">1 · Come funziona il feed «Affini»<br>2 · Come si valuta, in modo rapido o approfondito<br>3 · Task, punti e ricompensa finale</div></div>`,
        cta: p.review ? `<div class="btn" data-back>Torna indietro</div>` : `<div class="btn" data-go="register">Continua alla registrazione</div>`
      };
    },
    mount() { paintVideo(); },
    unmount() { vplaying = false; },
    actions: {
      vtoggle() {
        if (vt >= DATA.videoLen) vt = 0;
        vplaying = !vplaying;
        if (vplaying) {
          App.every(() => { if (!vplaying) return; vt = Math.min(DATA.videoLen, vt + .1 * vspeed); if (vt >= DATA.videoLen) { vplaying = false; App.toast('Video terminato'); } paintVideo(); }, 100);
        }
        paintVideo();
      },
      vsub(el) { vsub = !vsub; el.classList.toggle('on', vsub); paintVideo(); },
      vspeed(el) { vspeed = vspeed === 1 ? 1.5 : vspeed === 1.5 ? 2 : 1; el.textContent = String(vspeed).replace('.', ',') + '×'; },
      vfull(el, e) { e.stopPropagation(); const v = document.getElementById('video'); const ph = document.getElementById('phone'); if (v.classList.toggle('full')) ph.appendChild(v); else App.refresh(); }
    }
  });
  function paintVideo() {
    const v = document.getElementById('video'); if (!v) return;
    v.classList.toggle('playing', vplaying); v.classList.toggle('paused', !vplaying && vt > 0);
    document.getElementById('vbar').style.width = (vt / DATA.videoLen * 100) + '%';
    let si = -1; DATA.video.forEach((s, i) => { if (vt > 0 && vt >= s.t) si = i; });
    v.querySelectorAll('.vscene').forEach((el, i) => el.classList.toggle('on', i === si));
    const sub = document.getElementById('vsubt');
    sub.textContent = si >= 0 ? DATA.video[si].sub : ''; sub.classList.toggle('on', vsub && si >= 0);
    document.getElementById('vchap').style.opacity = vt > 0 ? 0 : 1;
    document.getElementById('vplay').innerHTML = ic(vplaying ? 'pause' : 'play', { size: 30, color: '#fff', fill: vplaying ? 'none' : '#fff', sw: vplaying ? 3 : 1.8 });
  }

  /* ---------- 2 · Registrazione ---------- */
  const F = [['nome', 'Nome', 'text', 'given-name'], ['cognome', 'Cognome', 'text', 'family-name'], ['email', 'Email', 'email', 'email'], ['tel', 'Numero di telefono', 'tel', 'tel']];
  const ERR = { nome: 'Inserisci il nome', cognome: 'Inserisci il cognome', email: 'Controlla l\'email (es. nome@email.it)', tel: 'Inserisci un numero valido' };
  const valid = (k, v) => k === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) : k === 'tel' ? v.replace(/\D/g, '').length >= 8 : v.trim().length > 0;
  App.screen('register', {
    top: 'onb',
    render() {
      const u = S().user;
      return {
        html: `${steps(1)}<div class="h1">Crea il tuo account</div>
        <div class="b17" style="padding:0 4px;margin-top:-6px">Serve per darti il codice utente e il voucher finale.</div>
        ${F.map(([k, l, t, ac]) => `<label class="field" data-f="${k}"><input class="inp" name="${k}" type="${t}" autocomplete="${ac}" placeholder="${l}" value="${esc(u[k])}" aria-label="${l}"><span class="ferr">${ERR[k]}</span></label>`).join('')}
        <div class="b13" style="padding:0 6px">Non condividiamo i tuoi dati con altri partecipanti.</div>
        <button class="link" data-act="demo">Compila con dati di prova</button>`,
        cta: `<div class="btn" data-act="next">Continua</div>`
      };
    },
    mount(v) {
      v.querySelectorAll('input').forEach(i => i.addEventListener('input', () => {
        S().user[i.name] = i.value; Store.save();
        const f = i.closest('.field'); if (f.classList.contains('bad') && valid(i.name, i.value)) f.classList.remove('bad');
      }));
    },
    actions: {
      demo() { Object.assign(S().user, { nome: 'Marta', cognome: 'Rossi', email: 'marta@email.it', tel: '333 123 4567' }); Store.save(); App.refresh(); },
      next() {
        let ok = true;
        F.forEach(([k]) => { const good = valid(k, S().user[k] || ''); document.querySelector(`[data-f="${k}"]`).classList.toggle('bad', !good); if (!good) ok = false; });
        if (!ok) { App.buzz(30); const b = document.querySelector('.field.bad input'); b && b.focus(); return; }
        App.go('consent');
      }
    }
  });

  /* ---------- 3 · Consenso e regole ----------
     Sezioni chiuse: vanno aperte e confermate una per una; la conferma chiude la sezione e mostra la spunta verde.
     «Accetto e continuo» si attiva solo con tutte le sezioni confermate. */
  const SECS = [
    ['doc', 'Cosa stiamo testando', `<div class="b17">Questo è un esperimento: misura quanto il questionario sa prevedere ciò che ti piace davvero. Analizziamo le tue risposte, le adattiamo ai contenuti della città e ti chiediamo di giudicare ogni risultato.</div>`],
    ['star', 'La regola del feed «Affini»', `<div class="b17"><b>1.</b> Il primo risultato è sempre il più affine a te.<br><b>2.</b> Gli altri seguono in ordine decrescente.<br><b>3.</b> Oltre una soglia ti avvisiamo: gli affini sono finiti.<br><b>4.</b> Poi puoi scegliere «Tutti» per valutare anche il resto.</div>
      <div class="gy" style="background:#E4F1FF"><div class="b15" style="color:#123F73">Ciò che testiamo è proprio questo: i primi sono davvero i più affini? I voti calano scorrendo il feed?</div></div>`],
    ['rules', 'Cosa devi fare', `<div class="b17">Valuta ogni risultato che vedi (veloce o approfondito), crea o partecipa a un'attività community e completa i task.</div>`],
    ['shield', 'I tuoi dati', `<div class="b17">Raccogliamo dati personali e psicometrici solo per questo test. Puoi leggere l'informativa e cancellare l'account dalle impostazioni.</div>`],
    ['trophy', 'Ricompense', `<div class="b17">Con il codice utente nell'app ufficiale: sconti su eventi e attività, funzioni premium di Nia per 3 mesi, resoconto di personalità con avatar. Più un voucher fino a 10 € dai punti dei task.</div>`]
  ];
  let openSec = -1;
  const readSet = () => (S().consentRead = S().consentRead || []);
  function secCard(i, review) {
    const [icn, title, body] = SECS[i], ok = readSet().includes(i), open = openSec === i;
    return `<div class="card acc${open ? ' open' : ''}${ok ? ' done' : ''}" data-sec="${i}">
      <div class="rw acc-h" data-act="secToggle" data-i="${i}" role="button" aria-expanded="${open}">
        <div class="ico ${ok ? 'gk' : 'b'}">${ok ? ic('check', { color: '#4F9A26', sw: 2.4 }) : ic(icn, { color: '#489DFE' })}</div>
        <div class="h3" style="flex:1">${title}</div>
        <span class="acc-chev">${ic('chev', { size: 16, color: '#9AA3AF', sw: 2 })}</span></div>
      <div class="acc-b"><div class="acc-in">${body}
        ${ok || review ? `<div class="btn g sm" data-act="secClose" data-i="${i}" style="align-self:flex-start">Chiudi</div>`
          : `<div class="btn sm" data-act="secOk" data-i="${i}" style="align-self:flex-start">${ic('check', { size: 18, color: '#fff', sw: 2.2 })}Ho letto e capito</div>`}</div></div></div>`;
  }
  function setOpen(i) {
    openSec = i;
    document.querySelectorAll('.acc').forEach(c => { const on = +c.dataset.sec === i; c.classList.toggle('open', on); c.querySelector('.acc-h').setAttribute('aria-expanded', on); });
  }
  App.screen('consent', {
    top: 'onb',
    render(p) {
      if (openSec >= SECS.length) openSec = -1;
      const n = readSet().length, all = n === SECS.length;
      return {
        html: `${p.review ? '' : steps(2)}<div class="h1">${p.review ? 'Le regole del test' : 'Prima di iniziare'}</div>
        ${p.review ? '' : `<div class="b17" style="padding:0 4px;margin-top:-6px">Apri ogni sezione e confermala per continuare.</div>`}
        ${SECS.map((x, i) => secCard(i, p.review)).join('')}
        ${p.review ? '' : `<div class="b13" style="padding:0 6px">Premendo «Accetto e continuo» dai il tuo consenso informato.</div>`}`,
        cta: p.review ? `<div class="btn" data-back>Ho capito</div>`
          : `${all ? '' : `<div class="b13" style="text-align:center">Sezioni confermate ${n} / ${SECS.length}</div>`}<div class="btn${all ? '' : ' off'}" data-act="accept">Accetto e continuo</div>`
      };
    },
    actions: {
      secToggle(el) { setOpen(openSec === +el.dataset.i ? -1 : +el.dataset.i); },
      secClose() { setOpen(-1); },
      secOk(el) {
        const i = +el.dataset.i, r = readSet();
        if (!r.includes(i)) r.push(i); Store.save(); App.buzz();
        const card = document.querySelector(`[data-sec="${i}"]`);
        card.classList.remove('open');
        App.later(() => {                       // a sezione chiusa, mostra la spunta verde
          openSec = -1; card.outerHTML = secCard(i, false);
          document.querySelector(`[data-sec="${i}"] .ico`).classList.add('pop-ok');
          const nx = SECS.findIndex((x, k) => !r.includes(k));
          App.later(() => { setOpen(nx); if (nx >= 0) document.querySelector(`[data-sec="${nx}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 250);
        }, 280);
        const n = r.length, all = n === SECS.length;
        document.querySelector('#cta .ctab').innerHTML = `${all ? '' : `<div class="b13" style="text-align:center">Sezioni confermate ${n} / ${SECS.length}</div>`}<div class="btn${all ? '' : ' off'}" data-act="accept">Accetto e continuo</div>`;
      },
      accept() {
        if (readSet().length < SECS.length) return;
        S().consentAt = Date.now(); Store.save();
        const first = Store.allQs().findIndex(q => S().answers[q.code] == null);
        if (first < 0) App.go('summary'); else App.go('qintro', { b: Store.allQs()[first].blk });
      }
    }
  });

  /* ---------- 8 · Profilo e codice utente ---------- */
  App.screen('profileSetup', {
    top: 'onb',
    render() {
      const u = S().user;
      return {
        html: `${steps(5)}<div class="h1">Il tuo profilo</div>
        <label style="align-self:center;position:relative;margin:4px 0;cursor:pointer" aria-label="Aggiungi foto">
          <div class="phi" style="width:130px;height:130px;border-radius:50%;border:4px solid rgba(72,157,254,.8);overflow:hidden;${u.photo ? `background:url(${u.photo}) center/cover` : ''}">${u.photo ? '' : 'Foto'}</div>
          <div style="position:absolute;right:0;bottom:0;width:42px;height:42px;border-radius:50%;background:#489DFE;border:3px solid #F5F5F7;display:flex;align-items:center;justify-content:center">${ic('camera', { size: 20, color: '#fff' })}</div>
          <input type="file" accept="image/*" id="photoIn" hidden></label>
        <textarea class="inp" id="bio" placeholder="Raccontati in due righe…" maxlength="160">${esc(u.bio)}</textarea>
        <div class="b13" style="text-align:right;margin-top:-6px;padding:0 8px" id="bioN">${(u.bio || '').length}/160</div>
        <div class="card"><div class="b15">Il tuo codice utente</div>
          <div style="display:flex;align-items:center;justify-content:space-between"><div class="h1n" style="letter-spacing:3px;font-size:32px">${S().code}</div>
          <button class="ico b" data-act="copy" aria-label="Copia codice">${ic('copy', { size: 20, color: '#489DFE' })}</button></div>
          <div class="b15">Ti servirà per creare «La nostra casa» e per l'app ufficiale.</div></div>`,
        cta: `<div class="btn" data-go="recap">Continua</div>`
      };
    },
    mount(v) {
      const b = v.querySelector('#bio');
      b.addEventListener('input', () => { S().user.bio = b.value; Store.save(); v.querySelector('#bioN').textContent = b.value.length + '/160'; });
      v.querySelector('#photoIn').addEventListener('change', e => readPhoto(e.target.files[0], url => { S().user.photo = url; Store.save(); App.refresh(); }));
    },
    actions: { copy() { copyCode(); } }
  });
  window.copyCode = () => { try { navigator.clipboard.writeText(S().code); } catch (e) { } App.toast('Codice copiato'); };
  /* ridimensiona la foto a 320px per non riempire localStorage */
  window.readPhoto = (file, cb) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'), k = 320 / Math.max(img.width, img.height); c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); cb(c.toDataURL('image/jpeg', .8)); }; img.src = r.result; };
    r.readAsDataURL(file);
  };

  /* ---------- 9 · Riepilogo informativo ---------- */
  const RC = [['Valuta ogni risultato', 'Anche quelli che non ti convincono.'], ['Il primo è il più affine', 'Guarda se i voti calano scorrendo il feed.'], ['Rispondi come sei', 'Non come vorresti essere.'],
    ['Veloce o approfondita', 'Un tocco per un voto; foto e testo per dire di più.'], ['Punti e buono evento', 'Al 100% dei task ricevi un evento gratis; i punti valgono fino a 10 €.']];
  App.screen('recap', {
    top: 'onb',
    render() {
      return {
        html: `${steps(6)}<div class="h1">Per un test attendibile</div>` +
          RC.map(([t, s], i) => `<div class="card" style="padding:14px 16px;min-height:86px;justify-content:center"><div class="rw"><div class="h1n" style="color:#489DFE;width:34px;font-size:34px">${i + 1}</div><div class="tx"><div class="h3">${t}</div><div class="b15">${s}</div></div></div></div>`).join(''),
        cta: `<div class="btn" data-act="finish">Vai alla home</div>`
      };
    },
    actions: {
      finish() {
        S().onbDone = true; Store.save();
        const pts = Store.completeTask('questionario');
        App.reset(['home']);
        if (pts) App.toast(`+${pts} punti · questionario completato`);
      }
    }
  });
})();
