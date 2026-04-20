/** Vanilla HTML data visualization — no React, no build step */

import { DesignTokens } from "../../utils/design-tokens.js";

export interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

export function vanillaDataVizComponent(tokens: DesignTokens, data?: DataPoint[], type?: "bar" | "donut"): string {
  const items = data ?? [
    { label: "A", value: 40 },
    { label: "B", value: 65 },
    { label: "C", value: 30 },
    { label: "D", value: 80 },
  ];
  const chartType = type ?? "bar";
  const dataJson = JSON.stringify(items);

  return `<div class="v-dataviz">
  <canvas id="v-chart" class="v-chart"></canvas>
  <div id="v-legend" class="v-legend"></div>
</div>
<style>
  .v-dataviz {
    background: ${tokens.colors.surface};
    border-radius: 0.75rem;
    padding: 1.5rem;
    max-width: 600px;
    margin: 0 auto;
  }
  .v-chart {
    width: 100%;
    height: 300px;
  }
  .v-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
    font-family: ${tokens.typography.fontFamily};
    font-size: 0.875rem;
    color: ${tokens.colors.textMuted};
  }
  .v-legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .v-legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
</style>
<script>
  (() => {
    const data = ${dataJson};
    const type = "${chartType}";
    const colors = ['${tokens.colors.primary}', '${tokens.colors.secondary}', '${tokens.colors.accent}', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    const canvas = document.getElementById('v-chart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;

    if (type === 'bar') {
      const max = Math.max(...data.map(d => d.value));
      const barW = (w - 60) / data.length - 10;
      const chartH = h - 40;
      data.forEach((d, i) => {
        const barH = (d.value / max) * chartH;
        const x = 40 + i * (barW + 10);
        const y = chartH - barH + 10;
        ctx.fillStyle = d.color || colors[i % colors.length];
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 4);
        ctx.fill();
        ctx.fillStyle = '${tokens.colors.textMuted}';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barW / 2, h - 5);
        ctx.fillText(d.value.toString(), x + barW / 2, y - 5);
      });
    } else {
      const cx = w / 2, cy = h / 2;
      const radius = Math.min(w, h) * 0.35;
      const innerR = radius * 0.6;
      const total = data.reduce((s, d) => s + d.value, 0);
      let start = -Math.PI / 2;
      data.forEach((d, i) => {
        const sweep = (d.value / total) * Math.PI * 2;
        const end = start + sweep;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, start, end);
        ctx.arc(cx, cy, innerR, end, start, true);
        ctx.closePath();
        ctx.fillStyle = d.color || colors[i % colors.length];
        ctx.fill();
        start = end;
      });
      ctx.fillStyle = '${tokens.colors.text}';
      ctx.font = 'bold 20px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total.toString(), cx, cy);
    }

    const legend = document.getElementById('v-legend');
    data.forEach((d, i) => {
      const item = document.createElement('div');
      item.className = 'v-legend-item';
      item.innerHTML = '<div class="v-legend-dot" style="background:' + (d.color || colors[i % colors.length]) + '"></div>' + d.label + ': ' + d.value;
      legend.appendChild(item);
    });
  })();
</script>`;
}
