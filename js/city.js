/* Città del questionario: un quartiere per blocco, un edificio per risposta.
   Gru gialla sull'edificio in costruzione, albero + lampione a quartiere completo, sole che si sposta. */
window.City = function (opt) {
  opt = opt || {};
  const S = Store.s, blocks = DATA.blocks;
  const all = Store.allQs(), N = all.length;
  const done = Store.answered();
  const cur = opt.current;                 // codice della domanda in corso (gru)
  const fresh = opt.fresh;                 // codice appena risposto (animazione)
  const h = opt.mini ? 190 : 320;
  const ground = 46;
  /* sole: da sinistra-basso a destra-alto con l'avanzamento */
  const p = N ? done / N : 0;
  const sunL = 12 + p * 66, sunT = (opt.mini ? 50 : 125) - Math.sin(p * Math.PI) * (opt.mini ? 30 : 45);
  let html = `<div class="city${opt.mini ? ' mini' : ''}" aria-hidden="true">
    <div class="sun" style="left:${sunL}%;top:${sunT}px"></div>
    <div class="hill" style="left:-15%;bottom:30px;width:75%;height:${opt.mini ? 70 : 130}px;background:#B9ABE6;opacity:.6"></div>
    <div class="hill" style="left:42%;bottom:20px;width:85%;height:${opt.mini ? 80 : 150}px;background:#C9B6E9;opacity:.7"></div>`;
  /* layout: N edifici + uno spazio tra i quartieri */
  const gaps = blocks.length - 1, slots = N + gaps * .8;
  const W = 100 / (slots + 1);          // larghezza slot in %
  const bw = W * .82;
  let x = W * .5, k = 0;
  const maxH = opt.mini ? 90 : 150;
  blocks.forEach((b, bi) => {
    const startX = x;
    b.qs.forEach((q, qi) => {
      const v = S.answers[q.code];
      const base = [.45, .72, .4, .6, .52][qi % 5];
      const hh = Math.round(maxH * (v != null ? (.32 + base * .45 + v * .06) : base * .5 + .15));
      const left = x;
      if (v == null) {
        html += `<div class="bld empty" style="left:${left}%;width:${bw}%;height:${hh}px;border-color:${b.color}"></div>`;
      } else {
        let wins = '';
        for (let wy = 8; wy < hh - 12; wy += 20) wins += `<i style="left:20%;width:20%;top:${wy}px"></i><i style="left:58%;width:20%;top:${wy}px"></i>`;
        html += `<div class="bld${fresh === q.code ? ' pop-in' : ''}" style="left:${left}%;width:${bw}%;height:${hh}px;background:linear-gradient(180deg,${b.color},${b.color}CC)">${wins}</div>`;
      }
      if (cur === q.code) {
        const ch = hh + 40;
        html += `<div class="crane" style="left:${left + bw * .45}%;width:3px;height:${ch}px;background:#F5B800"></div>
          <div class="crane" style="left:${left - bw * .1}%;bottom:${ground + ch}px;width:${bw * 1.25}%;height:4px;background:#F5B800"></div>
          <div class="crane" style="left:${left + bw * .95}%;bottom:${ground + ch - 16}px;width:2px;height:16px;background:#C99700"></div>`;
      }
      x += W; k++;
    });
    const complete = Store.blockAnswered(b.id) === b.qs.length;
    if (complete) {
      const tx = x - W * .1;
      html += `<svg class="tree" style="left:${tx}%" width="20" height="34" viewBox="0 0 20 34"><rect x="8.5" y="20" width="3" height="14" fill="#7A5A3A"/><circle cx="10" cy="13" r="9" fill="#5FB34A"/><circle cx="6" cy="16" r="5" fill="#4FA23D"/></svg>`;
      html += `<svg class="lamp" style="left:${startX - W * .45}%" width="12" height="44" viewBox="0 0 12 44"><rect x="5" y="8" width="2" height="36" fill="#5B4F7A"/><circle cx="6" cy="7" r="5" fill="#FFE9A8"/><circle cx="6" cy="7" r="9" fill="#FFE9A8" opacity=".25"/></svg>`;
    }
    if (bi < gaps) x += W * .8;
  });
  html += `<div class="ground"></div><div class="road"></div></div>`;
  return html;
};
