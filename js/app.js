/* Avvio + mappa del prototipo (pannello laterale per chi presenta) */
(function () {
  const clock = () => { const d = new Date(); document.getElementById('clock').textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };
  clock(); setInterval(clock, 30000);
  App.start([
    { t: '1a · Onboarding e questionario', items: [['welcome', '1 · Video di benvenuto'], ['register', '2 · Registrazione'], ['consent', '3 · Consenso e regole'], ['qintro', '4 · Intro blocco', { b: 'Q1' }], ['q', '5 · Domanda', { i: 2 }], ['qdone', '6 · Blocco completato', { b: 'Q1' }], ['summary', '7 · Sommario questionario'], ['profileSetup', '8 · Profilo e codice utente'], ['recap', '9 · Riepilogo informativo']] },
    { t: '1b · Navigazione', items: [['home', '1 · Home'], ['tasks', '3 · Task e buono evento'], ['profile', '4 · Profilo'], ['stats', '5 · Statistiche'], ['stats', '6 · Statistiche · Questionario', { seg: 'q' }], ['settings', '7 · Impostazioni'], ['setNotifs', '8 · Impostazioni · notifiche'], ['setPrivacy', '9 · Impostazioni · privacy'], ['setData', 'Dati personali'], ['setFeed', 'Feed e territorio']] },
    { t: '1c · Crea', items: [['create', '1 · Informazioni, descrizione, date'], ['createOffer', '2 · Cosa offre'], ['createClimate', '3 · Clima'], ['createIntensity', '4 · Intensità'], ['createPreview', '5 · Anteprima']] },
    { t: '1d · Match casa', items: [['match', '1–2 · Gruppo'], ['matchHouse', '3 · Match della casa', { sel: 'all' }], ['matchThemes', '5 · Tutti i temi', { sel: 'all' }], ['matchTheme', '6 · Tema singolo', { i: 0, sel: 'all' }], ['matchInterests', '7 · Interessi in comune', { sel: 'all' }]] },
    { t: '1e · Esplora', items: [['explore', '1 · Scelta contenuti'], ['feed', '2 · Feed Affini'], ['rateDeep', '4 · Valutazione approfondita', { id: 'c1' }], ['feed', '5 · Feed «Tutti»', { seg: 'all' }], ['actDetail', '6 · Dettaglio community', { id: 'c1' }], ['poster', '7 · Locandina evento', { id: 'e1' }], ['board', '8 · Bacheca']] },
    { t: '1f · Organizzatore', items: [['myActs', 'Le mie attività · Organizzo', { seg: 'org' }]] },
    { t: '1g · Partecipante', items: [['joinReq', '1 · Richiesta di partecipazione', { id: 'c4' }], ['myActs', '2 · Le mie attività'], ['partHub', '3 · Attività a cui partecipo', { id: 'c3' }], ['chat', '4 · Chat di gruppo', { id: 'c3' }], ['preRate', '5 · Valutazione prima', { id: 'c3' }], ['hostRate', '6 · Valutazione finale e feedback host', { id: 'c3' }], ['report', 'Segnalazione al team', { id: 'c3', who: 'Chiara', role: 'organizzatore' }], ['fbThanks', 'Grazie per il feedback', { name: 'Chiara' }]] },
    { t: '1h · Notifiche', items: [['notifs', '1 · Centro notifiche'], ['mail', '2 · Email giornaliera']] }
  ]);
})();
