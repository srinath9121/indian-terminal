import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Pulse", href: "/" },
  { label: "Macro", href: "/macro" },
  { label: "Markets", href: "/markets" },
  { label: "Geo Map", href: "/geo-map" },
  { label: "Commodities", href: "/commodities" },
  { label: "Risk Radar", href: "/risk-radar" },
  { label: "Adani Intel", href: "/adani-intel" },
  { label: "Alerts", href: "/alerts" },
];

export default function Navbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-IN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <div className="text-sm font-extrabold tracking-[0.16em] text-white">
          INDIA MACRO TERMINAL
        </div>

        <nav className="hidden items-center gap-6 text-xs font-medium tracking-[0.12em] text-[var(--muted)] lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) =>
                `transition hover:text-white ${
                  isActive ? "text-white underline underline-offset-8" : ""
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-[var(--green)]">● LIVE</span>
          <span className="text-white tabular-nums">{formatTime(time)} IST</span>
        </div>
      </div>
    </header>
  );
}
