import React, { useEffect } from "react";
import Navbar from "./Navbar";
import { useTerminalStore } from "../../store/useTerminalStore";

/**
 * Layout — wraps every page.
 * Starts data polling on mount.
 * Matches monolith: sticky nav + padded content area.
 */
export default function Layout({ children }) {
  const startPolling = useTerminalStore((s) => s.startPolling);

  useEffect(() => {
    const id = startPolling(15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <main style={{ padding: "16px 20px" }}>
        {children}
      </main>
    </div>
  );
}
