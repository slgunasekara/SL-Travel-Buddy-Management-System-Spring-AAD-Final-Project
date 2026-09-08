function renderLineChart(el, {labels, series, height = 300}) {
    const width = el.clientWidth || 800;
    const padL = 56, padR = 20, padT = 20, padB = 34;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const allValues = series.flatMap(s => s.data);
    let min = Math.min(0, ...allValues);
    let max = Math.max(1, ...allValues);
    if (min === max) {
        max = min + 1;
    }
    const pad = (max - min) * 0.1;
    min -= pad;
    max += pad;

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

function renderBarChart(el, {labels, data, color = "var(--accent)", height = 260, valueFmt = (v) => Fmt.money(v)}) {
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
        const x = padL + i * (innerW / n) + ((innerW / n) - barW) / 2;
        const y = yAt(v);
        const h = padT + innerH - y;
        bars += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="${color}">
      <title>${labels[i]}: ${valueFmt(v)}</title>
    </rect>`;
        bars += `<text x="${x + barW / 2}" y="${height - 10}" class="chart-axis-label" text-anchor="middle">${labels[i]}</text>`;
    });

    el.innerHTML = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" class="chart-svg">${gridSvg}${bars}</svg>`;
}

function renderDonutChart(el, {data, size = 220, valueFmt = (v) => Fmt.money(v)}) {
    // data = [{label, value, color}]
    const total = data.reduce((a, d) => a + d.value, 0);
    const cx = size / 2, cy = size / 2, r = size / 2 - 14, innerR = r * 0.6;

    if (total <= 0) {
        el.innerHTML = `<div class="donut-empty">No expense data for this range.</div>`;
        return;
    }

    let angle = -90; // start at top
    let slices = "";
    data.forEach(d => {
        const pct = d.value / total;
        const sweep = pct * 360;
        const startRad = (angle * Math.PI) / 180;
        const endRad = ((angle + sweep) * Math.PI) / 180;
        const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
        const ix1 = cx + innerR * Math.cos(startRad), iy1 = cy + innerR * Math.sin(startRad);
        const ix2 = cx + innerR * Math.cos(endRad), iy2 = cy + innerR * Math.sin(endRad);
        const largeArc = sweep > 180 ? 1 : 0;
        const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
        slices += `<path d="${path}" fill="${d.color}" class="donut-slice"><title>${d.label}: ${valueFmt(d.value)} (${(pct * 100).toFixed(1)}%)</title></path>`;
        angle += sweep;
    });

    const legend = data.map(d => `
    <div class="donut-legend-item">
      <span class="donut-legend-dot" style="background:${d.color}"></span>
      <span class="donut-legend-label">${d.label}</span>
      <span class="donut-legend-value">${valueFmt(d.value)}</span>
    </div>`).join("");

    el.innerHTML = `
    <div class="donut-wrap">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="donut-svg">
        ${slices}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-center-value">${valueFmt(total).replace("Rs. ", "")}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" class="donut-center-label">Total</text>
      </svg>
      <div class="donut-legend">${legend}</div>
    </div>`;
}
