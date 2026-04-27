import logging
from datetime import datetime
import pytz
from src.nse_session import nse_session_manager

IST = pytz.timezone('Asia/Kolkata')
logger = logging.getLogger(__name__)

class OptionsFetcher:
    WATCHLIST = [
        'ADANIENT','ADANIPORTS','ADANIPOWER','ADANIGREEN',
        'ADANIENSOL','ATGL','NDTV','AMBUJACEM','ACC','ADANIWILM'
    ]
    def fetch_options_chain(self, symbol: str) -> dict:
        session = nse_session_manager.get_session()
        url = f'https://www.nseindia.com/api/option-chain-equities?symbol={symbol}'
        resp = session.get(url, timeout=10)
        data = resp.json()
        records = data['records']['data']
        spot = data['records']['underlyingValue']
        strikes = {}
        for r in records:
            s = r['strikePrice']
            if s not in strikes: strikes[s] = {'ce_oi':0,'pe_oi':0,'ce_iv':0,'pe_iv':0}
            if 'CE' in r:
                strikes[s]['ce_oi'] += r['CE']['openInterest']
                strikes[s]['ce_iv']  = r['CE'].get('impliedVolatility', 0)
            if 'PE' in r:
                strikes[s]['pe_oi'] += r['PE']['openInterest']
                strikes[s]['pe_iv']  = r['PE'].get('impliedVolatility', 0)
        total_call_oi = sum(v['ce_oi'] for v in strikes.values())
        total_put_oi  = sum(v['pe_oi'] for v in strikes.values())
        pcr = round(total_put_oi / total_call_oi, 3) if total_call_oi > 0 else 0
        # OTM puts: strikes below spot
        otm_put_oi = sum(v['pe_oi'] for s, v in strikes.items() if s < spot)
        # IV average across near-ATM strikes (spot +-10%)
        atm_range = [s for s in strikes if spot*0.9 <= s <= spot*1.1]
        avg_iv = sum(strikes[s]['pe_iv'] for s in atm_range) / len(atm_range) if atm_range else 0
        # Max pain calculation
        min_loss, max_pain = float('inf'), spot
        for test in strikes:
            loss = sum(max(0,test-s)*v['ce_oi'] + max(0,s-test)*v['pe_oi']
                     for s,v in strikes.items())
            if loss < min_loss: min_loss, max_pain = loss, test
        return {
            'symbol': symbol, 'spot': round(spot,2),
            'total_call_oi': total_call_oi, 'total_put_oi': total_put_oi,
            'pcr': pcr, 'otm_put_oi': otm_put_oi,
            'avg_iv': round(avg_iv,2), 'max_pain': max_pain,
            'max_pain_distance_pct': round((spot-max_pain)/spot*100,2),
            'timestamp': datetime.now(IST).isoformat()
        }

    def compute_anomaly_score(self, current: dict, history: list) -> dict:
        # history = list of last 14 sessions of fetch_options_chain results
        if len(history) < 5:
            return {'score': 0, 'reason': 'Insufficient history'}
        avg_pcr    = sum(h['pcr'] for h in history) / len(history)
        avg_put_oi = sum(h['otm_put_oi'] for h in history) / len(history)
        avg_iv     = sum(h['avg_iv'] for h in history) / len(history)
        pcr_z    = (current['pcr'] - avg_pcr) / max(avg_pcr * 0.3, 0.01)
        put_oi_z = (current['otm_put_oi'] - avg_put_oi) / max(avg_put_oi * 0.3, 1)
        iv_z     = (current['avg_iv'] - avg_iv) / max(avg_iv * 0.3, 0.01)
        score = min(100, max(0,
            30 * min(pcr_z / 2, 1.0) +
            40 * min(put_oi_z / 1.5, 1.0) +
            30 * min(iv_z / 2, 1.0)
        ))
        return {
            'score': round(score),
            'pcr': current['pcr'], 'avg_pcr': round(avg_pcr,3),
            'pcr_deviation_pct': round((current['pcr']-avg_pcr)/avg_pcr*100,1) if avg_pcr > 0 else 0,
            'otm_put_oi': current['otm_put_oi'], 'avg_otm_put_oi': round(avg_put_oi),
            'iv': current['avg_iv'], 'avg_iv': round(avg_iv,2),
            'status': 'CRITICAL' if score>75 else 'ACTIVE' if score>50 else 'WATCH' if score>25 else 'CLEAR'
        }
