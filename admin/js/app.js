/* Avvio del portale e accesso demo (nella demo la password non serve). */
(function () {
  A.page('login', {
    render() {
      return `<div class="login"><div class="login-art"><img src="../assets/icon.svg?v=2" width="56" height="56" alt=""><h1>Portale admin</h1><p>Tutti i dati del test CEnTRO: partecipanti, punteggi, analisi statistiche, contenuti e messaggi.</p></div>
        <div class="login-form"><div class="login-card"><h2>Accedi</h2>
          <div class="field"><label>Email</label><input class="in" value="${A.esc(AStore.s.admin.email)}" readonly></div>
          <div class="field"><label>Password</label><input class="in" type="password" placeholder="Nella demo non serve" disabled></div>
          <button class="btn" data-act="login">Entra nel portale</button><div class="note">Versione demo: i dati sono generati, non reali.</div></div></div></div>`;
    }
  });
  A.acts.login = () => { AStore.s.logged = true; AStore.save(); A.render(); };
  AStore.s.excluded = AStore.s.excluded || {};
  AStore.applyTheme(); A.reload(); A.render();
})();
