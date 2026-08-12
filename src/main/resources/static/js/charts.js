/* =========================================================================
   charts.js — tiny dependency-free SVG line chart, used for the 30-day
   profit chart on the dashboard (mirrors the JavaFX LineChart).
   ========================================================================= */

function renderLineChart(el, { labels, series, height = 300 }) {
  const width = el.clientWidth || 800;
  const padL = 56, padR = 20, padT = 20, padB = 34;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const allValues = series.flatMap(s => s.data);
  let min = Math.min(0, ...allValues);
  let max = Math.max(1, ...allValues);
  if (min === max) { max = min + 1; }
  const pad = (max - min) * 0.1;
  min -= pad; max += pad;

  const n = labels.length;
  const xAt = i => padL + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const yAt = v => padT + innerH - ((v - min) / (max - min)) * innerH;

  const gridLines = 4;
  let gridSvg = "";
  for (let g = 0; g <= gridLines; g++) {
    const v = min + ((max - min) * g) / gridLines;
    const y = yAt(v);
    gridSvg += `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" class="chart-grid" />`;
    gridSvg += `<text x="${padL - 8}" y="${y + 4}" class="chart-axis-label" text-anchor="end">${Math.round(v).toLocaleString()}</text>`;
  }

  const step = Math.max(1, Math.round(n / 8));
  let xLabelsSvg = "";
  for (let i = 0; i < n; i += step) {
    xLabelsSvg += `<text x="${xAt(i)}" y="${height - 8}" class="chart-axis-label" text-anchor="middle">${labels[i]}</text>`;
  }

  let seriesSvg = "";
  series.forEach(s => {
    const pts = s.data.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
    seriesSvg += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />`;
    s.data.forEach((v, i) => {
      seriesSvg += `<circle cx="${xAt(i)}" cy="${yAt(v)}" r="2.5" fill="${s.color}">
        <title>${labels[i]} — ${s.name}: ${Fmt.money(v)}</title>
      </circle>`;
    });
  });

  const legendSvg = series.map((s, i) =>
    `<span class="chart-legend-item"><span class="chart-legend-dot" style="background:${s.color}"></span>${s.name}</span>`
  ).join("");

  el.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" class="chart-svg">
      ${gridSvg}
      ${seriesSvg}
      ${xLabelsSvg}
    </svg>
    <div class="chart-legend">${legendSvg}</div>`;
}

function renderBarChart(el, { labels, data, color = "var(--accent)", height = 260, valueFmt = (v) => Fmt.money(v) }) {
  const width = el.clientWidth || 800;
  const padL = 56, padR = 20, padT = 20, padB = 44;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(1, ...data);
  const n = data.length;
  const gap = 10;
  const barW = n > 0 ? Math.max(6, innerW / n - gap) : 10;

  const yAt = v => padT + innerH - (v / max) * innerH;

  let gridSvg = "";
  for (let g = 0; g <= 4; g++) {
    const v = (max * g) / 4;
    const y = yAt(v);
    gridSvg += `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" class="chart-grid" />`;
    gridSvg += `<text x="${padL - 8}" y="${y + 4}" class="chart-axis-label" text-anchor="end">${Math.round(v).toLocaleString()}</text>`;
  }

  let bars = "";
  data.forEach((v, i) => {
    const x = padL + i * (innerW / n) + ( (innerW/n) - barW)/2;
    const y = yAt(v);
    const h = padT + innerH - y;
    bars += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="${color}">
      <title>${labels[i]}: ${valueFmt(v)}</title>
    </rect>`;
    bars += `<text x="${x + barW / 2}" y="${height - 10}" class="chart-axis-label" text-anchor="middle">${labels[i]}</text>`;
  });

  el.innerHTML = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" class="chart-svg">${gridSvg}${bars}</svg>`;
}
