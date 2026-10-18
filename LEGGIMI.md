# CEnTRO MVP · prototipo grafico

Apri `index.html` con un doppio clic: funziona senza server e senza connessione (font inclusi in `assets/fonts`).
Su desktop vedi il telefono (402 × 874) con a sinistra la **Mappa del prototipo** per saltare a qualsiasi schermata; sul telefono l'app va a tutto schermo e la mappa si apre dalla linguetta «Map» a sinistra.

- **Riempi dati demo**: crea Marta Rossi, compila il questionario a caso e porta alla home.
- **Ricomincia**: cancella tutto (i dati stanno solo nel `localStorage` del browser).

## Struttura
```
index.html            shell del telefono
css/fonts.css         DM Sans + DM Serif Text (locali)
css/base.css          componenti estratti dal mockup (card, btn, chip, pl, sc5, sheet…)
css/app.css           layout dell'app, stati, animazioni
js/data.js            questionario demo, task, punti (valori provvisori: si cambiano qui)
js/store.js           stato + persistenza, punti, avanzamento, profilo demo
js/router.js          navigazione a pila, barre, popup/sheet, toast, mappa
js/city.js            la città che cresce con le risposte
js/nia.js             Nia simulata: testo libero → date + descrizione
js/match.js           affinità persona-contenuto, ordine del feed e soglia (DATA.threshold)
js/rate.js            valutazione rapida/approfondita, punti e task di Esplora
js/screens/*.js       una schermata = App.screen('nome', { render, mount, actions })
```

## Tappe
1. ✅ Shell, barre, onboarding, questionario demo (10 domande a scala + 2 scelte secche sul fumo), sommario, profilo, riepilogo, home
2. ✅ Task e biglietto a frammenti, profilo, statistiche, impostazioni (dati, foto, notifiche, feed, privacy), centro notifiche, email giornaliera
3. ✅ Crea: una schermata con informazioni, descrizione (Nia o a mano) e date (singole o ricorrenti con eccezioni); cosa offre e clima fino a 3 + Esplora: feed Affini/Tutti con soglia, valutazione rapida e approfondita, dettaglio, locandina, bacheca
4. ✅ Attività community: richiesta con amici registrati (accettata in automatico dopo 5 s, nessun avviso se non accettata), le mie attività, hub organizzatore, richieste, chat, partecipanti, modifica, valutazione prima e finale con archivio
5. ✅ Match casa: gruppo con codici (solo registrati che hanno finito il questionario), riepilogo casa con mappa dei temi a pallini (Affini · Attenzione · Distanti), match col singolo, tema con slider, interessi in comune a cerchi proporzionali, tutto valutabile

**Profilo che evolve** (Statistiche): ogni voto sposta i tratti verso il contenuto (voto alto) o lontano (voto basso); approfondite ×1,5, «prima» ×1,2, «dopo un'attività» ×2. Il questionario resta il punto di partenza e si vede lo scostamento nel tempo (`Match.evolution()` in `js/match.js`).

**Feed adattivo**: l'affinità usa il profilo di oggi, quindi il feed si riordina mentre l'utente valuta (e glielo segnaliamo). In Statistiche: *stabilità del feed* (quanto l'ordine somiglia a quello del solo questionario) e *predittività del questionario*: profilo e feed stabili = il questionario aveva previsto bene; se cambiano molto, predice meno. Ogni voto salva anche posizione e affinità del momento.

**Match casa**: ogni coinquilino ha un profilo proprio e stabile (seme = codice). Il fumo è un vincolo secco: chi fuma in casa con chi non lo accetta = Distanti e limita la compatibilità.

Codici di prova per i coinquilini e gli amici: in `js/data.js` → `DATA.users` (Tommaso e Omar non hanno finito il questionario, per provare l'errore).

Dopo ogni modifica ai file alza il numero `?v=` in `index.html`, così il browser non usa la copia vecchia.
