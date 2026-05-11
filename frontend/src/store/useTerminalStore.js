import { create } from 'zustand';
import { getMarketOverview } from '../services/marketData';
import { getMacroIndicators } from '../services/macroData';
import { getAdaniStocks } from '../services/adaniData';
import { fetchApi } from '../services/api';

export const useTerminalStore = create((set, get) => ({
  marketData:   null,
  macroData:    null,
  adaniStocks:  [],
  globalSignal: null,
  alertsData:   null,
  isLoading:    true,
  lastUpdated:  null,

  fetchData: async () => {
    set({ isLoading: true });

    const [market, macro, adani, signal, alerts] = await Promise.all([
      getMarketOverview(),
      getMacroIndicators(),
      getAdaniStocks(),
      fetchApi("/signals"),
      fetchApi("/alerts"),
    ]);

    set({
      marketData:   market,
      macroData:    macro,
      adaniStocks:  adani,
      globalSignal: signal
        ? { ...signal, irs: macro?.irs?.score, irsZone: macro?.irs?.zone, irsMode: macro?.irs?.mode }
        : null,
      alertsData:   alerts,
      isLoading:    false,
      lastUpdated:  new Date().toISOString(),
    });
  },

  startPolling: (intervalMs = 15000) => {
    get().fetchData();
    const id = setInterval(() => get().fetchData(), intervalMs);
    return id;
  },
}));
