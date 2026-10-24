/* Grafici SVG leggeri. Ogni segno ha un tooltip (data-tip); le linee hanno il mirino verticale.
   Colori solo da token CSS, così il tema scuro usa i suoi passi validati. */
(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const W = 640, PL = 44, PR = 14, PT = 14, PB = 30;
  const nice = v => { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; };
  const ticks = (max, n = 4) => { const s = nice(max / n); const out = []; for (let v = 0; v <= max + 1e-9; v += s) out.push(+v.toFixed(6)); return out; };
  const wrap = (svg, h, cls = '') => `<div class="chart ${cls}"><svg viewBox="0 0 ${W} ${h}" role="img">${svg}</svg></div>`;
  const tip = html => ` data-tip="${esc(html)}"`;

  function yAxis(h, max, fmt, min = 0) {
    const ih = h - PT - PB, t = ticks(max - min);
    return '<g class="grid">' + t.map(v => { const y = PT + ih - v / (max - min) * ih; return `<line x1="${PL}" x2="${W - PR}" y1="${y}" y2="${y}"/><text x="${PL - 8}" y="${y + 4}" text-anchor="end">${fmt(v + min)}</text>`; }).join('') + '</g>';
  }

  /* linee (una o più serie sulla stessa scala) */
  function line({ labels, series, h = 240, yFmt = v => v, max, every = 1 }) {
    const ih = h - PT - PB, iw = W - PL - PR, n = labels.length;
    const top = max || nice(Math.max(1, ...series.flatMap(s => s.values)) * 1.1) ;
    const x = i => PL + (n === 1 ? iw / 2 : i / (n - 1) * iw), y = v => PT + ih - v / top * ih;
    let g = yAxis(h, top, yFmt);
    g += labels.map((l, i) => i % every === 0 || i === n - 1 ? `<text x="${x(i)}" y="${h - 10}" text-anchor="middle">${esc(l)}</text>` : '').join('');
    g += series.map(s => { const d = s.values.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
      return (s.area ? `<path d="${d} L${x(n - 1)} ${PT + ih} L${x(0)} ${PT + ih}Z" fill="${s.color}" opacity=".08"/>` : '') + `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`; }).join('');
    g += series.map(s => { const i = n - 1; return `<circle cx="${x(i)}" cy="${y(s.values[i])}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`; }).join('');
    g += `<line class="guide" x1="0" x2="0" y1="${PT}" y2="${PT + ih}" stroke="var(--axis)" stroke-dasharray="3 3" opacity="0"/>`;
    const bw = iw / Math.max(1, n - 1);
    g += labels.map((l, i) => `<rect class="hit" x="${x(i) - bw / 2}" y="${PT}" width="${bw}" height="${ih}" data-gx="${x(i)}"${tip(`<div class="muted">${esc(l)}</div>` + series.map(s => `<div class="tr"><i style="background:${s.color}"></i>${esc(s.name)} <b style="font-size:12px;margin-left:auto">${yFmt(s.values[i])}</b></div>`).join(''))}/>`).join('');
    return wrap(g, h);
  }

  /* barre verticali; ref = linea di riferimento orizzontale */
  function bars({ data, h = 220, yFmt = v => v, max, min = 0, ref, refLabel, color = 'var(--s1)', labels = true }) {
    const ih = h - PT - PB, iw = W - PL - PR, n = data.length, top = max || nice(Math.max(...data.map(d => d.value)) * 1.15);
    const slot = iw / n, bw = Math.min(56, slot * .62), y = v => PT + ih - (v - min) / (top - min) * ih;
    let g = yAxis(h, top, yFmt, min);
    data.forEach((d, i) => {
      const cx = PL + slot * i + slot / 2, yy = y(Math.max(min, d.value)), hh = PT + ih - yy, r = Math.min(4, bw / 2, hh);
      g += `<path class="mk" d="M${cx - bw / 2} ${PT + ih} V${yy + r} Q${cx - bw / 2} ${yy} ${cx - bw / 2 + r} ${yy} H${cx + bw / 2 - r} Q${cx + bw / 2} ${yy} ${cx + bw / 2} ${yy + r} V${PT + ih}Z" fill="${d.color || color}"/>`;
      if (labels) g += `<text class="val" x="${cx}" y="${yy - 6}" text-anchor="middle">${yFmt(d.value)}</text>`;
      g += `<text x="${cx}" y="${h - 10}" text-anchor="middle">${esc(d.label)}</text>`;
      g += `<rect class="hit" x="${cx - slot / 2}" y="${PT}" width="${slot}" height="${ih}"${tip(d.tip || `<b>${yFmt(d.value)}</b><div class="muted">${esc(d.label)}</div>`)}/>`;
    });
    if (ref != null) { const yy = y(ref); g += `<line x1="${PL}" x2="${W - PR}" y1="${yy}" y2="${yy}" stroke="var(--ink-3)" stroke-dasharray="4 4"/><text x="${W - PR}" y="${yy - 6}" text-anchor="end" class="lbl">${esc(refLabel || '')}</text>`; }
    g += `<line class="axis" x1="${PL}" x2="${W - PR}" y1="${PT + ih}" y2="${PT + ih}"/>`;
    return wrap(g, h);
  }

  /* barre orizzontali (classifiche, imbuto) */
  function hbars({ data, max, fmt = v => v, color = 'var(--s1)', lw = 190, rowH = 30, sub }) {
    const top = max || Math.max(...data.map(d => d.value)) || 1, iw = W - lw - 70, h = data.length * rowH + 6;
    let g = '';
    data.forEach((d, i) => {
      const y = 4 + i * rowH, w = Math.max(2, d.value / top * iw), bh = rowH - 12;
      g += `<text class="lbl" x="${lw - 10}" y="${y + bh / 2 + 4}" text-anchor="end">${esc(d.label)}</text>`;
      g += `<rect x="${lw}" y="${y}" width="${iw}" height="${bh}" rx="4" fill="var(--line-2)"/>`;
      g += `<rect class="mk" x="${lw}" y="${y}" width="${w}" height="${bh}" rx="4" fill="${d.color || color}"/>`;
      g += `<text class="val" x="${lw + w + 8}" y="${y + bh / 2 + 4}">${fmt(d.value)}${d.extra ? ` <tspan class="lbl" style="font-weight:400">${esc(d.extra)}</tspan>` : ''}</text>`;
      g += `<rect class="hit" x="0" y="${y - 4}" width="${W}" height="${rowH}"${tip(d.tip || `<b>${fmt(d.value)}</b><div class="muted">${esc(d.label)}</div>`)}/>`;
    });
    return wrap(g, h);
  }

  /* istogramma */
  function hist({ bins, h = 200, color = 'var(--s1)', xFmt = v => v, mark, markLabel }) {
    const ih = h - PT - PB, iw = W - PL - PR, top = nice(Math.max(1, ...bins.map(b => b.n)) * 1.1), bw = iw / bins.length;
    const x0 = bins[0].x0, x1 = bins[bins.length - 1].x1, X = v => PL + (v - x0) / (x1 - x0) * iw;
    let g = yAxis(h, top, v => v);
    bins.forEach((b, i) => {
      const hh = b.n / top * ih, x = PL + i * bw + 1;
      g += `<rect class="mk" x="${x}" y="${PT + ih - hh}" width="${bw - 2}" height="${hh}" rx="${Math.min(4, hh / 2)}" fill="${b.color || color}"/>`;
      g += `<rect class="hit" x="${x}" y="${PT}" width="${bw}" height="${ih}"${tip(`<b>${b.n}</b> tester<div class="muted">${xFmt(b.x0)} – ${xFmt(b.x1)}</div>`)}/>`;
    });
    for (let i = 0; i <= bins.length; i += Math.ceil(bins.length / 6)) g += `<text x="${PL + i * bw}" y="${h - 10}" text-anchor="middle">${xFmt(x0 + i * (x1 - x0) / bins.length)}</text>`;
    if (mark != null) g += `<line x1="${X(mark)}" x2="${X(mark)}" y1="${PT}" y2="${PT + ih}" stroke="var(--ink)" stroke-dasharray="4 4"/><text x="${X(mark) + 6}" y="${PT + 10}" class="lbl">${esc(markLabel || '')}</text>`;
    g += `<line class="axis" x1="${PL}" x2="${W - PR}" y1="${PT + ih}" y2="${PT + ih}"/>`;
    return wrap(g, h);
  }

  /* dispersione con retta di regressione */
  function scatter({ pts, xMax = 100, yMax = 5, yMin = 1, xMin = 0, h = 260, reg, xLabel = '', yLabel = '', color = 'var(--s1)', r = 4.5 }) {
    const ih = h - PT - PB - 8, iw = W - PL - PR, X = v => PL + (v - xMin) / (xMax - xMin) * iw, Y = v => PT + ih - (v - yMin) / (yMax - yMin) * ih;
    let g = '<g class="grid">';
    for (let v = yMin; v <= yMax; v++) g += `<line x1="${PL}" x2="${W - PR}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${PL - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
    g += '</g>';
    for (let v = xMin; v <= xMax; v += (xMax - xMin) / 5) g += `<text x="${X(v)}" y="${PT + ih + 18}" text-anchor="middle">${Math.round(v)}</text>`;
    g += `<text x="${W - PR}" y="${h - 2}" text-anchor="end">${esc(xLabel)}</text><text x="${PL}" y="${PT - 2}">${esc(yLabel)}</text>`;
    pts.forEach(p => g += `<circle class="mk" cx="${X(p.x)}" cy="${Y(p.y)}" r="${r}" fill="${p.color || color}" fill-opacity=".55" stroke="var(--surface)" stroke-width="1"${p.tip ? tip(p.tip) : ''}/>`);
    if (reg) { const L = St.linreg(pts.map(p => p.x), pts.map(p => p.y)); g += `<line x1="${X(xMin)}" x2="${X(xMax)}" y1="${Y(L.q + L.m * xMin)}" y2="${Y(L.q + L.m * xMax)}" stroke="var(--ink)" stroke-width="2" stroke-dasharray="6 4"/>`; }
    return wrap(g, h);
  }

  /* punti con barra d'errore (media ± 1,96·es) */
  function dotci({ data, h = 230, yMin = 1, yMax = 5, color = 'var(--s1)', yFmt = v => St.fmt(v, 1) }) {
    const ih = h - PT - PB, iw = W - PL - PR, slot = iw / data.length, Y = v => PT + ih - (v - yMin) / (yMax - yMin) * ih;
    let g = '<g class="grid">'; for (let v = yMin; v <= yMax; v++) g += `<line x1="${PL}" x2="${W - PR}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${PL - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`; g += '</g>';
    const path = data.map((d, i) => (i ? 'L' : 'M') + (PL + slot * i + slot / 2) + ' ' + Y(d.m)).join(' ');
    g += `<path d="${path}" fill="none" stroke="${color}" stroke-width="2" opacity=".5"/>`;
    data.forEach((d, i) => {
      const cx = PL + slot * i + slot / 2, e = 1.96 * (d.se || 0);
      if (e) g += `<line x1="${cx}" x2="${cx}" y1="${Y(Math.min(yMax, d.m + e))}" y2="${Y(Math.max(yMin, d.m - e))}" stroke="${color}" stroke-width="2"/>`;
      g += `<circle class="mk" cx="${cx}" cy="${Y(d.m)}" r="6" fill="${color}" stroke="var(--surface)" stroke-width="2"/>`;
      g += `<text x="${cx}" y="${h - 10}" text-anchor="middle">${esc(d.label)}</text>`;
      g += `<rect class="hit" x="${cx - slot / 2}" y="${PT}" width="${slot}" height="${ih}"${tip(`<b>${yFmt(d.m)}</b> voto medio<div class="muted">${esc(d.label)} · ${d.n} voti</div>`)}/>`;
    });
    return wrap(g, h);
  }

  /* mappa di calore divergente (−1 rosso · 0 grigio · +1 blu) */
  function heat({ labels, m }) {
    const n = labels.length, cell = Math.min(46, (W - 60) / n), h = 40 + n * cell;
    const col = v => { const t = Math.max(-1, Math.min(1, v)); return t >= 0 ? `color-mix(in srgb,var(--div-pos) ${Math.round(t * 100)}%,var(--div-mid))` : `color-mix(in srgb,var(--div-neg) ${Math.round(-t * 100)}%,var(--div-mid))`; };
    let g = '';
    labels.forEach((l, i) => { g += `<text class="lbl" x="${54}" y="${36 + i * cell + cell / 2 + 4}" text-anchor="end">${l}</text><text class="lbl" x="${60 + i * cell + cell / 2}" y="${26}" text-anchor="middle">${l}</text>`; });
    m.forEach((row, i) => row.forEach((v, j) => {
      g += `<rect class="mk" x="${60 + j * cell + 1}" y="${32 + i * cell + 1}" width="${cell - 2}" height="${cell - 2}" rx="5" fill="${i === j ? 'var(--line)' : col(v)}"${i === j ? '' : tip(`<b>r = ${St.fmt(v)}</b><div class="muted">${labels[i]} × ${labels[j]}</div>`)}/>`;
      if (i !== j && Math.abs(v) >= .3) g += `<text x="${60 + j * cell + cell / 2}" y="${32 + i * cell + cell / 2 + 4}" text-anchor="middle" style="fill:${Math.abs(v) > .55 ? '#fff' : 'var(--ink)'};font-weight:700;pointer-events:none">${St.fmt(v, 1)}</text>`;
    }));
    return `<div class="chart"><svg viewBox="0 0 ${60 + n * cell + 10} ${h}" style="max-width:${60 + n * cell + 10}px">${g}</svg></div>`;
  }

  /* barre impilate al 100% (distribuzione delle risposte Likert) */
  const LK = ['var(--lk1)', 'var(--lk2)', 'var(--lk3)', 'var(--lk4)', 'var(--lk5)'];
  function stack100({ rows, lw = 60, rowH = 26, names = DATA.scale }) {
    const iw = W - lw - 10, h = rows.length * rowH + 4;
    let g = '';
    rows.forEach((r, i) => {
      const y = 2 + i * rowH; let x = lw;
      g += `<text class="lbl" x="${lw - 8}" y="${y + rowH / 2 + 2}" text-anchor="end">${esc(r.label)}</text>`;
      r.parts.forEach((p, k) => {
        const w = p * iw; if (w <= 0) return;
        g += `<rect class="mk" x="${x + 1}" y="${y}" width="${Math.max(0, w - 2)}" height="${rowH - 8}" rx="3" fill="${LK[k]}"${tip(`<b>${St.pct(p)}</b><div class="muted">${esc(r.label)} · ${esc(names[k])}</div>`)}/>`;
        if (w > 30) g += `<text x="${x + w / 2}" y="${y + rowH / 2 + 1}" text-anchor="middle" style="fill:${k === 2 ? 'var(--ink)' : '#fff'};font-weight:700;pointer-events:none">${Math.round(p * 100)}</text>`;
        x += w;
      });
    });
    return wrap(g, h);
  }
  const legend = items => `<div class="legend">${items.map(([c, l, ln]) => `<span><i class="${ln ? 'ln' : ''}" style="background:${c}"></i>${esc(l)}</span>`).join('')}</div>`;
  const likertLegend = () => legend(DATA.scale.map((s, i) => [LK[i], s]));

  /* tooltip e mirino: delega globale */
  const T = () => document.getElementById('tip');
  document.addEventListener('mousemove', e => {
    const el = e.target.closest && e.target.closest('[data-tip]'), t = T(); if (!t) return;
    document.querySelectorAll('.guide').forEach(g => g.setAttribute('opacity', 0));
    if (!el) { t.classList.remove('on'); return; }
    t.innerHTML = el.dataset.tip; t.classList.add('on');
    const r = t.getBoundingClientRect(); let x = e.clientX + 14, y = e.clientY + 14;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14; if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
    t.style.left = x + 'px'; t.style.top = y + 'px';
    if (el.dataset.gx) { const gl = el.ownerSVGElement && el.ownerSVGElement.querySelector('.guide'); if (gl) { gl.setAttribute('x1', el.dataset.gx); gl.setAttribute('x2', el.dataset.gx); gl.setAttribute('opacity', 1); } }
  });
  document.addEventListener('scroll', () => { const t = T(); if (t) t.classList.remove('on'); }, true);

  window.Ch = { line, bars, hbars, hist, scatter, dotci, heat, stack100, legend, likertLegend, esc, LK };
})();
