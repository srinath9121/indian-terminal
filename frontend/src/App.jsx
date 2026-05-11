import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Pulse from "./pages/Pulse";
import Macro from "./pages/Macro";
import AdaniIntel from "./pages/AdaniIntel";
import RiskRadar from "./pages/RiskRadar";
import GeoMap from "./pages/GeoMap";
import Markets from "./pages/Markets";
import Commodities from "./pages/Commodities";
import Alerts from "./pages/Alerts";
import { useTerminalStore } from "./store/useTerminalStore";

export default function App() {
  const startPolling = useTerminalStore((state) => state.startPolling);

  useEffect(() => {
    // Start polling every 15 seconds
    const intervalId = startPolling(15000);
    return () => clearInterval(intervalId);
  }, [startPolling]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Pulse />} />
        <Route path="/macro" element={<Macro />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/geo-map" element={<GeoMap />} />
        <Route path="/commodities" element={<Commodities />} />
        <Route path="/risk-radar" element={<RiskRadar />} />
        <Route path="/adani-intel" element={<AdaniIntel />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </BrowserRouter>
  );
}
