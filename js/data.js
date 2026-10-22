/* Dati del prototipo: questionario demo (10 domande dal questionario v0.4), task e premi.
   Valori di punti e soglie sono provvisori (README §10): si cambiano solo qui. */
window.DATA = {
  /* Questionario demo: 2 quartieri × 5 domande. trait/area servono al sommario. */
  blocks: [
    {
      id: 'Q1', n: 1, title: 'Come ti muovi tra le persone', color: '#F06139',
      intro: 'Poche domande per capire come ti piace stare con gli altri: rispondi d\'istinto, non esiste una risposta giusta.',
      done: 'Hai costruito il tuo primo quartiere. Il prossimo ti aspetta.',
      qs: [
        { code: 'E1', text: 'Mi viene naturale iniziare una conversazione con persone che conosco appena.', trait: 'E' },
        { code: 'SA2', text: 'Partecipare a un\'attività con persone mai viste prima mi incuriosisce.', trait: 'E' },
        { code: 'SP2', text: 'Mi diverto di più quando i programmi nascono sul momento.', trait: 'SP' },
        { code: 'O3', text: 'Mi emoziono davanti a musica, arte o paesaggi.', trait: 'O' },
        { code: 'C1', text: 'Mi organizzo la settimana in anticipo.', trait: 'C' }
      ]
    },
    {
      id: 'Q2', n: 2, title: 'Come vivi in casa', color: '#8B1EBA',
      intro: 'Pensa a come vivi di solito in casa, o a come vivresti in una casa condivisa.',
      done: 'Anche la via delle abitudini è costruita. La tua città è completa.',
      qs: [
        { code: 'PR1', text: 'Passo a casa la maggior parte delle mie serate.', area: 'Presenza in casa', A: 'Spesso fuori', B: 'Quasi sempre a casa' },
        { code: 'OB1', text: 'Nei giorni feriali vado a dormire dopo mezzanotte.', area: 'Orologio biologico', A: 'Diurno', B: 'Notturno' },
        { code: 'CS2', text: 'Per stare bene in casa ho bisogno che gli spazi comuni siano in ordine.', area: 'Cura degli spazi', A: 'Quando serve', B: 'Sempre in ordine' },
        { code: 'VO3', text: 'Mi piace avere musica o TV accese mentre sono in casa.', area: 'Volume della casa', A: 'Silenzio', B: 'Casa animata' },
        { code: 'OS3', text: 'Invito spesso amici a casa.', area: 'Ospiti', A: 'Mai ospiti', B: 'Sempre ospiti' },
        /* fumo: scelte secche, non una scala (B2 del questionario completo) */
        { code: 'FU1', type: 'choice', text: 'Fumi?', opts: ['No', 'Sì, ma solo fuori casa', 'Sì, anche in casa'] },
        { code: 'FU2', type: 'choice', text: 'Cosa accetti dai coinquilini?', opts: ['Che nessuno fumi', 'Che si fumi solo fuori casa', 'Che si fumi anche in casa'] }
      ]
    }
  ],
  scale: ['Per niente', 'Poco', 'Neutro', 'Abbastanza', 'Moltissimo'],
  scaleColors: ['#F06139', '#D43998', '#BB2DCE', '#8B1EBA', '#1E42BA'],
  interests: ['Sport', 'Musica', 'Cucina', 'Arte', 'Giochi', 'Natura', 'Cinema', 'Lettura'],

  /* 8 task = 8 frammenti del biglietto omaggio */
  tasks: [
    { id: 'questionario', label: 'Completa il questionario', pts: 50, where: 'Onboarding', icon: 'doc', go: 'summary', desc: 'Le tue risposte costruiscono il profilo.' },
    { id: 'affini', label: 'Valuta i risultati Affini', pts: 40, where: 'Esplora · Affini', icon: 'search', go: 'explore', desc: 'Dai un voto a tutto il feed, fino alla soglia.' },
    { id: 'tutti', label: 'Guarda anche «Tutti»', pts: 20, where: 'Esplora · Tutti', icon: 'search', go: 'explore', desc: 'Dopo gli affini, valuta anche il resto.' },
    { id: 'eventi', label: 'Valuta Eventi e Attività', pts: 20, where: 'Esplora', icon: 'star', go: 'explore', desc: 'Apri le locandine del team e valutale.' },
    { id: 'casa', label: 'Crea il match della tua casa', pts: 30, where: 'Match', icon: 'house', go: 'match', desc: 'Aggiungi i coinquilini con il loro codice.' },
    { id: 'casa_val', label: 'Valuta il match dei coinquilini', pts: 15, where: 'Match', icon: 'house', go: 'match', desc: 'Dicci se il risultato ti sembra giusto.' },
    { id: 'crea', label: 'Crea un\'attività community', pts: 40, where: 'Crea', icon: 'plus', go: 'create', desc: 'Pubblica un\'attività vera per gli altri tester.' },
    { id: 'partecipa', label: 'Partecipa a un\'attività community', pts: 60, where: 'Esplora · Community', icon: 'users', go: 'explore', desc: 'Chiedi di partecipare, vai e valutala.' }
  ],
  ratingPts: 5,          // punti per ogni valutazione rapida
  deepRatingPts: 10,     // punti per ogni valutazione approfondita
  eurPerPoint: 0.025,    // 400 punti = 10 €
  maxEur: 10,

  video: [
    { t: 0, title: 'Il feed «Affini»', sub: 'Il primo risultato è sempre il più affine a te. Gli altri seguono in ordine.' },
    { t: 4, title: 'Valutare', sub: 'Un tocco per un voto veloce, oppure la valutazione approfondita con foto e testo.' },
    { t: 8, title: 'Task e premi', sub: 'Completa i task: ottieni punti, un voucher fino a 10 € e un biglietto omaggio.' }
  ],
  videoLen: 12
};

/* Contenuti finti condivisi tra le tappe (la Community sarà poi l'unico contenuto reale) */
DATA.community = [
  { id: 'c1', title: 'Corsa al parco', who: 'Anna', when: 'Sab 14 · 10:00', where: 'Parco Sempione, Milano', interest: 'Sport', hue: 145 },
  { id: 'c2', title: 'Torneo di carte', who: 'Paolo', when: 'Dom 15 · 18:00', where: 'Isola, Milano', interest: 'Giochi', hue: 260 },
  { id: 'c3', title: 'Gita al lago', who: 'Chiara', when: 'Sab 21 · 9:00', where: 'Lago di Como', interest: 'Natura', hue: 195 }
];
/* notifiche e valutazioni di esempio caricate da «Riempi dati demo» */
DATA.demoNotifs = [
  { t: 'Anna ha accettato la tua richiesta', s: 'Corsa al parco · Sab 14 · 10:00', at: '9:12', kind: 'accept', read: false },
  { t: 'Nuove attività community di oggi', s: '3 nuove · email giornaliera', at: '8:00', kind: 'mail', read: false },
  { t: 'Luca ha chiesto di partecipare', s: 'Corsa al parco', at: 'ieri', kind: 'request', read: true },
  { t: 'Valuta «Gita al lago»', s: 'Fallo ora e ottieni punti', at: 'ieri', kind: 'rate', read: true },
  { t: 'Nuovo messaggio in «Gita al lago»', s: 'Chiara: treno delle 8:43 da Cadorna!', at: '10:05', kind: 'chat', ref: 'c3', read: false },
  { t: 'Sara ha chiesto di partecipare', s: 'Corsa al parco', at: 'ieri', kind: 'request', read: true },
  { t: 'Task completato: valuta i risultati Affini', s: '+40 punti · nuovo pezzo del biglietto', at: 'ieri', kind: 'tasks', read: true }
];
DATA.demoRatings = [
  { id: 'c1', title: 'Corsa al parco', kind: 'Community', v: 4 },
  { id: 'e1', title: 'Concerto jazz', kind: 'Evento', v: 2 },
  { id: 'b3', title: 'Annuncio bacheca #3', kind: 'Bacheca', v: 5 },
  { id: 'casa', title: 'La nostra casa', kind: 'Match', v: 4 }
];

/* ---------- Esplora: contenuti finti del team + community di esempio ----------
   v = profilo del contenuto (0–1): soc socialità, cur novità, plan organizzazione, act energia.
   L'affinità con la persona viene da questo profilo + interessi (js/match.js). */
DATA.threshold = 60;
DATA.boardThreshold = 3;  // in bacheca: i primi 3 per utilità sono gli «affini»   // soglia di sbarramento «Affini» (valore X da definire, README §6.2)
DATA.content = [
  { id: 'c1', type: 'community', title: 'Corsa al parco', who: 'Anna', code: 'AX-12345', when: 'Sab 14 · 10:00', date: '15 Gen · 10:00', city: 'Milano', place: 'Parco Sempione, Milano', interest: 'Sport', offers: ['Sfidarsi'], climate: 'Competitivo', intensity: 'Media', max: 6, joined: 4, v: { soc: .7, cur: .4, plan: .7, act: .9 }, desc: 'Corsa leggera di 6 km nel parco, a passo di chi c\'è. Dopo caffè insieme.' },
  { id: 'c2', type: 'community', title: 'Torneo di carte', who: 'Paolo', code: 'PB-20931', when: 'Dom 15 · 18:00', date: '16 Gen · 18:00', city: 'Milano', place: 'Isola, Milano', interest: 'Giochi', offers: ['Conoscere persone'], climate: 'Competitivo', intensity: 'Leggera', max: 8, joined: 5, v: { soc: .8, cur: .3, plan: .5, act: .2 }, desc: 'Burraco e scopa al tavolo grande del circolo. Si fanno coppie a caso.' },
  { id: 'c3', type: 'community', title: 'Gita al lago', who: 'Chiara', code: 'CM-55102', when: 'Sab 21 · 9:00', date: '22 Gen · 9:00', city: 'Como', place: 'Lago di Como', interest: 'Natura', offers: ['Scoprire qualcosa di nuovo', 'Rilassarsi'], climate: 'Rilassato', intensity: 'Media', max: 10, joined: 6, v: { soc: .6, cur: .8, plan: .6, act: .6 }, desc: 'Treno da Cadorna, passeggiata sul lungolago e pranzo al sacco.' },
  { id: 'c4', type: 'community', title: 'Cena multietnica', who: 'Samir', code: 'SK-77841', when: 'Ven 20 · 20:00', date: '21 Gen · 20:00', city: 'Milano', place: 'NoLo, Milano', interest: 'Cucina', offers: ['Conoscere persone', 'Scoprire qualcosa di nuovo'], climate: 'Collaborativo', intensity: 'Leggera', max: 8, joined: 3, v: { soc: .9, cur: .9, plan: .4, act: .3 }, desc: 'Ognuno porta un piatto del proprio paese o della propria regione.' },
  { id: 'c5', type: 'community', title: 'Book club del giovedì', who: 'Giulia', code: 'GL-31207', when: 'Gio 19 · 19:00', date: '20 Gen · 19:00', city: 'Milano', place: 'Biblioteca Sormani', interest: 'Lettura', offers: ['Stimolo intellettuale'], climate: 'Rilassato', intensity: 'Leggera', max: 12, joined: 7, v: { soc: .4, cur: .7, plan: .8, act: .1 }, desc: 'Questo mese «Le città invisibili». Anche solo per ascoltare.' },
  { id: 'c6', type: 'community', title: 'Laboratorio di ceramica', who: 'Elena', code: 'EV-44019', when: 'Sab 21 · 15:00', date: '22 Gen · 15:00', city: 'Milano', place: 'Ortica, Milano', interest: 'Arte', offers: ['Imparare o migliorare'], climate: 'Creativo', intensity: 'Leggera', max: 6, joined: 2, v: { soc: .4, cur: .8, plan: .5, act: .3 }, desc: 'Tornio e modellazione a mano. Il materiale lo porto io.' },
  { id: 'c7', type: 'community', title: 'Calcetto 5 contro 5', who: 'Luca', code: 'LR-90122', when: 'Mer 18 · 21:00', date: '19 Gen · 21:00', city: 'Milano', place: 'Centro sportivo Iseo', interest: 'Sport', offers: ['Sfidarsi', 'Conoscere persone'], climate: 'Competitivo', intensity: 'Alta', max: 10, joined: 8, v: { soc: .8, cur: .2, plan: .6, act: 1 }, desc: 'Manca sempre qualcuno: livello amatoriale, si gioca per divertirsi.' },
  { id: 'c8', type: 'community', title: 'Jam session acustica', who: 'Marco', code: 'MT-12088', when: 'Dom 22 · 17:00', date: '23 Gen · 17:00', city: 'Milano', place: 'Navigli, Milano', interest: 'Musica', offers: ['Rilassarsi', 'Conoscere persone'], climate: 'Creativo', intensity: 'Leggera', max: 8, joined: 4, v: { soc: .7, cur: .6, plan: .2, act: .3 }, desc: 'Chitarre, voci e percussioni. Senza scaletta, si suona quello che viene.' },
  { id: 'e1', type: 'evento', title: 'Concerto jazz', who: 'Teatro Nuovo', city: 'Milano', place: 'Via Verdi 12, Milano', when: 'Ven 20 · 21:00', interest: 'Musica', cat: 'Arte e Creatività', price: '12 €', open: 'Apertura porte 20:00', v: { soc: .5, cur: .6, plan: .6, act: .2 }, desc: 'Serata di jazz dal vivo con quartetto locale, ingresso libero fino a esaurimento posti. Atmosfera raccolta, adatta anche a chi viene da solo.' },
  { id: 'e2', type: 'evento', title: 'Mostra fotografica «Periferie»', who: 'Spazio Forma', city: 'Milano', place: 'Piazza Tito Lucrezio Caro 1', when: 'Tutti i giorni · 10–19', interest: 'Arte', cat: 'Arte e Creatività', price: 'Gratis', open: 'Dalle 10 alle 19', v: { soc: .2, cur: .9, plan: .5, act: .2 }, desc: 'Quaranta scatti sulle periferie italiane. Percorso di un\'ora, visite guidate il sabato.' },
  { id: 'e3', type: 'evento', title: 'Stand-up comedy night', who: 'Zelig Lab', city: 'Milano', place: 'Viale Monza 140', when: 'Gio 19 · 21:30', interest: 'Cinema', cat: 'Spettacolo', price: '8 €', open: 'Ingresso dalle 21:00', v: { soc: .7, cur: .5, plan: .3, act: .3 }, desc: 'Cinque comici emergenti, dieci minuti a testa. Si ride, si beve, si chiacchiera.' },
  { id: 'e4', type: 'evento', title: 'Festival street food', who: 'Comune di Milano', city: 'Milano', place: 'Parco Lambro', when: 'Sab 21 – Dom 22', interest: 'Cucina', cat: 'Cibo e Festa', price: 'Gratis', open: 'Dalle 12 a mezzanotte', v: { soc: .9, cur: .7, plan: .2, act: .5 }, desc: 'Trenta food truck, musica dal vivo e tavolate comuni. Si va anche in gruppo.' },
  { id: 'a1', type: 'attivita', title: 'Yoga all\'alba', who: 'Team CEnTRO', city: 'Milano', place: 'Parco Sempione', when: 'Ogni martedì · 7:00', interest: 'Sport', cat: 'Benessere', price: '5 €', open: 'Lezione di 60 minuti', v: { soc: .3, cur: .4, plan: .9, act: .6 }, desc: 'Sessione dolce per tutti i livelli. Porta il tappetino, il tè lo offriamo noi.' },
  { id: 'a2', type: 'attivita', title: 'Visita guidata ai Navigli', who: 'Team CEnTRO', city: 'Milano', place: 'Darsena', when: 'Dom 22 · 10:30', interest: 'Cultura', cat: 'Cultura', price: '10 €', open: 'Durata 2 ore', v: { soc: .5, cur: .8, plan: .7, act: .5 }, desc: 'Storia, chiuse leonardesche e botteghe nascoste, con una guida del quartiere.' },
  { id: 'a3', type: 'attivita', title: 'Workshop di cucina giapponese', who: 'Team CEnTRO', city: 'Milano', place: 'Cucina Condivisa, Isola', when: 'Mer 18 · 19:00', interest: 'Cucina', cat: 'Cibo e Festa', price: '25 €', open: 'Durata 3 ore', v: { soc: .6, cur: .9, plan: .6, act: .3 }, desc: 'Ramen e gyoza da zero. Si cucina in coppia e si cena tutti insieme.' }
];
DATA.board = [
  { id: 'b1', title: 'Cerco compagno di corsa la mattina', kind: 'Annuncio', text: 'Corro alle 7 al parco Sempione, 5–8 km. Mi piacerebbe avere qualcuno con cui motivarmi.', v: { soc: .6, cur: .3, plan: .8, act: .9 } },
  { id: 'b2', title: 'Chi organizza un gruppo di studio?', kind: 'Domanda', text: 'Preparo un concorso pubblico e studiare da solo è dura. Biblioteca o bar, mi adeguo.', v: { soc: .5, cur: .5, plan: .9, act: .2 } },
  { id: 'b3', title: 'Regalo divano a due posti', kind: 'Annuncio', text: 'In buono stato, da ritirare entro fine mese in zona Città Studi. Serve un furgone.', v: { soc: .2, cur: .2, plan: .4, act: .4 } },
  { id: 'b4', title: 'Volontari per pulire il parco', kind: 'Situazione', text: 'Sabato mattina con guanti e sacchi: due ore e poi focaccia per tutti.', v: { soc: .7, cur: .5, plan: .5, act: .7 } },
  { id: 'b5', title: 'Scambio libri in cortile', kind: 'Situazione', text: 'Ogni prima domenica del mese: porti un libro, ne prendi un altro.', v: { soc: .5, cur: .8, plan: .4, act: .1 } },
  { id: 'b6', title: 'Cerco stanza da febbraio', kind: 'Annuncio', text: 'Studentessa, tranquilla, non fumo. Budget 550 €, zona M2.', v: { soc: .3, cur: .3, plan: .7, act: .3 } }
];

/* Utenti registrati al test (finti): solo loro si possono aggiungere come amici a una richiesta */
DATA.users = [
  { name: 'Giulia Bianchi', code: 'NIA-7QK2M', city: 'Milano' }, { name: 'Luca Ferri', code: 'NIA-3HD8P', city: 'Milano' },
  { name: 'Sara Conti', code: 'NIA-9WX4T', city: 'Monza' }, { name: 'Davide Russo', code: 'NIA-2LB6R', city: 'Milano' },
  { name: 'Irene Gallo', code: 'NIA-5ZT3Y', city: 'Milano' }, { name: 'Tommaso Greco', code: 'NIA-8MV7C', city: 'Sesto S.G.', noQuiz: true },
  { name: 'Beatrice Marino', code: 'NIA-4RP9J', city: 'Milano' }, { name: 'Omar Haddad', code: 'NIA-6GN2E', city: 'Milano', noQuiz: true },
  { name: 'Chiara Lombardi', code: 'NIA-1KS5W', city: 'Como' }, { name: 'Marco Esposito', code: 'NIA-7TF4Q', city: 'Milano' }
];

/* Match casa: 9 temi della convivenza (aree D1–D9 del questionario) */
DATA.themes = [
  { k: 'PR', name: 'Presenza in casa', d: 'Quanto spesso vi troverete quando rientri', A: 'Spesso fuori', B: 'Quasi sempre a casa' },
  { k: 'OB', name: 'Orologio biologico', d: 'Quali sono gli orari della casa', A: 'Diurno', B: 'Notturno' },
  { k: 'FU', name: 'Fumo in casa', d: 'Chi fuma e cosa accetta: sì o no, senza vie di mezzo', cat: true },
  { k: 'CS', name: 'Cura degli spazi', d: 'Pulizia di cucina, bagno e aree comuni', A: 'Quando serve', B: 'Sempre in ordine' },
  { k: 'VO', name: 'Volume della casa', d: 'Musica, TV, voci', A: 'Silenzio', B: 'Casa animata' },
  { k: 'OS', name: 'Ospiti', d: 'Frequenza e gestione delle visite', A: 'Mai ospiti', B: 'Sempre ospiti' },
  { k: 'VC', name: 'Vita comune', d: 'Quanto ti vogliono nella loro vita', A: 'Ognuno per sé', B: 'Come una famiglia' },
  { k: 'CM', name: 'Comunicazione', d: 'Come preferiscono gestire il dialogo', A: 'Il necessario', B: 'Si parla di tutto' },
  { k: 'FR', name: 'Flessibilità regole', d: 'Compromessi sulle regole', A: 'Regole chiare', B: 'Si decide strada facendo' }
];
