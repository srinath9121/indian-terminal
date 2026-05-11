import React from "react";

/**
 * Terminal Card — matches monolith: #0f1520 bg, #1e2530 border, 8px radius
 */
export default function Card({ children, className = "", style = {}, alt = false }) {
  return (
    <div
      className={`rounded-lg border border-[var(--border)] ${className}`}
      style={{
        background: alt ? "var(--card-alt, #0d1219)" : "var(--card, #0f1520)",
        padding: "12px 14px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
