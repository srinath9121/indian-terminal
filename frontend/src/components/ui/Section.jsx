import React from "react";

/**
 * Section — matches monolith: #0f1520 card with header row
 * Supports optional right-side action button.
 */
export default function Section({ title, children, action, actionLabel = "View All", className = "" }) {
  return (
    <div
      className={`rounded-lg border border-[var(--border)] ${className}`}
      style={{ background: "var(--card)", padding: 14 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[11px] font-bold tracking-[0.08em] text-[var(--text)]">{title}</div>
        {action && (
          <button
            onClick={action}
            className="border-none bg-transparent font-mono text-[10px] text-[var(--blue)] cursor-pointer hover:underline"
          >
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
