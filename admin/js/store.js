/* Stato del portale admin, condiviso con il prototipo (stesso sito → stesso localStorage).
   Il prototipo legge da qui: messaggi dello staff, contenuti creati, parametri del test (soglia, domande del giorno). */
(function () {
  const KEY = 'centro_admin_v1';
  const fresh = () => ({
    v: 1, logged: false, theme: 'system',
    admin: { name: 'Admin demo', email: 'admin@centro.demo', role: 'Ricercatore' },
    settings: { threshold: 60, dailyPerDay: 3, dailyDays: 10, ratingPts: 5, deepPts: 10, seed: 7, n: 150 },
    content: [],      // contenuti creati dal team: { id, type, title, ..., active }
    messages: [],     // messaggi dello staff: { id, title, body, to: 'all'|'segment'|'one', target, reach, at }
    reports: {},      // codice pratica → stato ('aperta' | 'in verifica' | 'chiusa')
    notes: {}         // note interne per partecipante
  });
  let S; try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = fresh(); }
  S.settings = Object.assign(fresh().settings, S.settings);
  window.AStore = {
    get s() { return S; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } },
    reset() { const keep = { logged: S.logged, theme: S.theme }; S = Object.assign(fresh(), keep); this.save(); },
    applyTheme() {
      const t = S.theme; if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    }
  };
})();
