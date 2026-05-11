import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Eager load — always needed
import Pulse from "./pages/Pulse";

// Lazy load — only when navigated to
const Macro = lazy(() => import("./pages/Macro"));
const Markets = lazy(() => import("./pages/Markets"));
const GeoMap = lazy(() => import("./pages/GeoMap"));
const Commodities = lazy(() => import("./pages/Commodities"));
const RiskRadar = lazy(() => import("./pages/RiskRadar"));
const AdaniIntel = lazy(() => import("./pages/AdaniIntel"));
const Alerts = lazy(() => import("./pages/Alerts"));

function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        height: "60vh",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--muted)",
        fontFamily: "var(--mono)",
        fontSize: 12,
        letterSpacing: 1,
      }}
    >
      LOADING MODULE...
    </div>
  );
}

export default function App() {
  // Polling is now started inside Layout (which wraps every page)
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Pulse />} />
          <Route path="/pulse" element={<Pulse />} />
          <Route path="/macro" element={<Macro />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/geo-map" element={<GeoMap />} />
          <Route path="/commodities" element={<Commodities />} />
          <Route path="/risk-radar" element={<RiskRadar />} />
          <Route path="/adani-intel" element={<AdaniIntel />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
