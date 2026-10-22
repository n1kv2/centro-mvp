/* Sezione a card del design CEnTRO: icona nel cerchio, titolo, sottotitolo, freccia; si apre sul posto.
   Sec.card({ id, icon, title, sub, body, open, done, off, staticOpen })
   Lo stato aperto/chiuso resta nei parametri della schermata, così sopravvive ai ridisegni. */
(function () {
  const isOpen = (id, def) => { const o = (App.current && App.current.p._open) || null; return o ? o.includes(id) : !!def; };
  window.Sec = {
    card(o) {
      const open = o.staticOpen || isOpen(o.id, o.open);
      return `<div class="sx${open ? ' open' : ''}${o.done ? ' done' : ''}${o.off ? ' off' : ''}${o.staticOpen ? ' static' : ''}${o.cls ? ' ' + o.cls : ''}" data-sx="${o.id}">
        <div class="sx-h" ${o.staticOpen || o.off ? '' : `data-act="sx" role="button" aria-expanded="${open}"`}>
          <div class="sx-i">${ic(o.icon || 'doc', { color: o.done ? '#4F9A26' : open ? '#489DFE' : '#000' })}</div>
          <div class="sx-t"><b>${o.title}</b>${o.sub ? `<span>${o.sub}</span>` : ''}</div>
          ${o.staticOpen ? (o.right || '') : `<span class="sx-c">${ic('down', { size: 18, color: open ? '#489DFE' : '#CCD2D9', sw: 2.2 })}</span>`}</div>
        <div class="sx-b"><div class="sx-in">${o.body || ''}</div></div></div>`;
    },
    /* apre una sezione da codice (es. dopo un errore) */
    open(id) {
      const p = App.current.p; p._open = p._open || []; if (!p._open.includes(id)) p._open.push(id);
      const el = document.querySelector(`[data-sx="${id}"]`); if (el) el.classList.add('open');
    }
  };
  App.actions.sx = el => {
    const box = el.closest('.sx'), id = box.dataset.sx, p = App.current.p, on = !box.classList.contains('open');
    p._open = (p._open || Array.from(document.querySelectorAll('.sx.open')).map(x => x.dataset.sx)).filter(x => x !== id);
    if (on) p._open.push(id);
    box.classList.toggle('open', on); el.setAttribute('aria-expanded', on);
    const c = box.querySelector('.sx-c svg'); if (c) c.setAttribute('stroke', on ? '#489DFE' : '#CCD2D9');
    const i = box.querySelector('.sx-i svg'); if (i && !box.classList.contains('done')) i.setAttribute('stroke', on ? '#489DFE' : '#000');
  };
})();
