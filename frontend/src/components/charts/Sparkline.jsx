import React from "react";

/**
 * Sparkline SVG Component
 * Deterministic line chart for tiny space-constrained areas.
 */
export default function Sparkline({ color = "var(--green)", points = [], height = 32, width = 90 }) {
  if (!points || points.length < 2) return (
    <div style={{ height, width }} className="flex items-center justify-center">
      <div className="h-[1px] w-full bg-[var(--border)]" />
    </div>
  );

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  
  const pts = points
    .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline 
        fill="none" 
        stroke={color} 
        strokeWidth="1.5" 
        points={pts}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
