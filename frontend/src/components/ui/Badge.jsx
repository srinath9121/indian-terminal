import React from "react";

/**
 * Tiny Terminal Badge
 * Matches the exact technical look of the original monolith.
 */
const COLORS = {
  green:  { bg: "#052e16", text: "#22c55e" },
  red:    { bg: "#2d0a0a", text: "#ef4444" },
  yellow: { bg: "#2d1f0a", text: "#f59e0b" },
  blue:   { bg: "#0a1f2d", text: "#38bdf8" },
  bullish: { bg: "#052e16", text: "#22c55e" },
  defensive: { bg: "#2d0a0a", text: "#ef4444" },
  neutral: { bg: "#2d1f0a", text: "#f59e0b" },
};

export default function Badge({ children, tone = "green", color }) {
  // Support both 'tone' and 'color' props for compatibility
  const key = color || tone || "green";
  const c = COLORS[key] || COLORS.green;

  return (
    <span
      className="inline-flex items-center justify-center rounded-[3px] border px-[5px] py-[1px] font-mono text-[9px] font-bold uppercase tracking-[0.08em]"
      style={{
        backgroundColor: c.bg,
        color: c.text,
        borderColor: `${c.text}33`,
      }}
    >
      {children}
    </span>
  );
}
