export interface DataVizOptions {
  typescript: boolean;
  styling: "tailwind" | "css_modules" | "styled_components";
  darkMode: boolean;
  responsive: boolean;
  animated: boolean;
  ariaLabels: boolean;
  keyboardNav: boolean;
}

export function dataVizComponent(opts: DataVizOptions): string {
  const ext = opts.typescript ? "tsx" : "jsx";
  const typeAnnotation = opts.typescript ? ": React.FC<DataVizProps>" : "";
  const propsInterface = opts.typescript ? `
interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface DataVizProps {
  data: DataPoint[];
  type?: 'bar' | 'donut';
  title?: string;
  height?: number;
}
` : "";

  const tw = opts.styling === "tailwind";

  return `// DataViz.${ext}
import React, { useEffect, useRef } from 'react';

${propsInterface}
const DataViz${typeAnnotation} = ({ data, type = 'bar', title, height = 300 }) => {
  const canvasRef = useRef${opts.typescript ? "<HTMLCanvasElement>(null)" : "(null)"};

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    ctx.clearRect(0, 0, w, h);

    if (type === 'bar') {
      drawBarChart(ctx, data, w, h, colors);
    } else {
      drawDonutChart(ctx, data, w, h, colors);
    }
  }, [data, type]);

  return (
    <div ${tw ? `className="${opts.darkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 ${opts.responsive ? "w-full" : ""}"` : `style={{ background: '${opts.darkMode ? "#1f2937" : "#fff"}', borderRadius: '0.75rem', padding: '1.5rem' }}`}>
      {title && <h3 ${tw ? `className="text-lg font-semibold ${opts.darkMode ? "text-white" : "text-gray-900"} mb-4"` : `style={{ fontSize: '1.125rem', fontWeight: 600, color: '${opts.darkMode ? "#fff" : "#111827"}', marginBottom: '1rem' }}`}>{title}</h3>}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: height + 'px' }}
        ${opts.ariaLabels ? `role="img" aria-label={title || "Data visualization"}` : ""}
      />
      {/* Legend */}
      <div ${tw ? `className="flex flex-wrap gap-4 mt-4"` : `style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}`}>
        {data.map((d, i) => (
          <div key={i} ${tw ? `className="flex items-center gap-2"` : `style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}`}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: d.color || ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][i % 7] }} />
            <span ${tw ? `className="text-sm ${opts.darkMode ? "text-gray-400" : "text-gray-600"}"` : `style={{ fontSize: '0.875rem', color: '${opts.darkMode ? "#9ca3af" : "#4b5563"}' }}`}>{d.label}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function drawBarChart(ctx${opts.typescript ? ": CanvasRenderingContext2D" : ""}, data${opts.typescript ? ": DataPoint[]" : ""}, w${opts.typescript ? ": number" : ""}, h${opts.typescript ? ": number" : ""}, colors${opts.typescript ? ": string[]" : ""}) {
  const max = Math.max(...data.map(d => d.value));
  const barWidth = (w - 60) / data.length - 10;
  const chartHeight = h - 40;

  data.forEach((d, i) => {
    const barHeight = (d.value / max) * chartHeight;
    const x = 40 + i * (barWidth + 10);
    const y = chartHeight - barHeight + 10;

    ctx.fillStyle = d.color || colors[i % colors.length];
    ${opts.animated ? `
    // Animated bar (simplified - for full animation use requestAnimationFrame)
    ctx.globalAlpha = 0.9;` : ""}
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 4);
    ctx.fill();
    ${opts.animated ? `ctx.globalAlpha = 1.0;` : ""}

    // Label
    ctx.fillStyle = '${opts.darkMode ? "#9ca3af" : "#6b7280"}';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barWidth / 2, h - 5);

    // Value
    ctx.fillText(d.value.toString(), x + barWidth / 2, y - 5);
  });
}

function drawDonutChart(ctx${opts.typescript ? ": CanvasRenderingContext2D" : ""}, data${opts.typescript ? ": DataPoint[]" : ""}, w${opts.typescript ? ": number" : ""}, h${opts.typescript ? ": number" : ""}, colors${opts.typescript ? ": string[]" : ""}) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.35;
  const innerRadius = radius * 0.6;
  const total = data.reduce((s, d) => s + d.value, 0);

  let startAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const endAngle = startAngle + sweep;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = d.color || colors[i % colors.length];
    ctx.fill();

    startAngle = endAngle;
  });

  // Center text
  ctx.fillStyle = '${opts.darkMode ? "#fff" : "#111827"}';
  ctx.font = 'bold 20px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total.toString(), cx, cy);
}

export default DataViz;`;
}
