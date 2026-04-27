import requests
import logging
from datetime import datetime
import pytz

IST = pytz.timezone('Asia/Kolkata')
logger = logging.getLogger(__name__)


class LegalFetcher:
    """Fetches legal filings from CourtListener and SEBI for Adani Group stocks."""

    SEARCH_TERMS = {
        'ADANIENT':    ['Adani Enterprises', 'Gautam Adani', 'Adani Group'],
        'ADANIPORTS':  ['Adani Ports', 'Adani Logistics'],
        'ADANIPOWER':  ['Adani Power'],
        'ADANIGREEN':  ['Adani Green', 'Adani Renewable'],
        'ADANIENSOL':  ['Adani Energy Solutions'],
        'ATGL':        ['Adani Total Gas'],
        'NDTV':        ['NDTV', 'New Delhi Television'],
        'AMBUJACEM':   ['Ambuja Cements'],
        'ACC':         ['ACC Ltd', 'ACC Limited'],
        'ADANIWILM':   ['Adani Wilmar'],
    }

    _HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        'Accept': 'application/json',
    }

    def fetch_courtlistener(self, symbol: str) -> list:
        """Fetch US federal court dockets from CourtListener free REST API."""
        terms = self.SEARCH_TERMS.get(symbol, ['Adani'])
        results = []
        for term in terms[:2]:  # max 2 searches to avoid rate limit
            try:
                url = (
                    f'https://www.courtlistener.com/api/rest/v3/dockets/'
                    f'?q={term}&order_by=-date_created&format=json'
                )
                resp = requests.get(url, timeout=15, headers=self._HEADERS)
                if resp.status_code == 200:
                    data = resp.json()
                    for r in data.get('results', [])[:5]:
                        date_str = r.get('date_created', '')[:10]
                        try:
                            days_ago = (datetime.now() - datetime.fromisoformat(date_str)).days
                        except Exception:
                            days_ago = 999
                        results.append({
                            'source': 'CourtListener',
                            'court': r.get('court', ''),
                            'title': r.get('case_name', ''),
                            'date': date_str,
                            'url': f'https://www.courtlistener.com{r.get("absolute_url", "")}',
                            'days_ago': days_ago,
                        })
                else:
                    logger.warning(f"CourtListener returned {resp.status_code} for '{term}'")
            except Exception as e:
                logger.warning(f"CourtListener fetch failed for '{term}': {e}")
        return results

    def fetch_sebi_orders(self, symbol: str) -> list:
        """Fetch SEBI enforcement orders mentioning the company.
        
        SEBI's website is difficult to scrape reliably, so this returns
        a graceful empty list on failure rather than crashing.
        """
        terms = self.SEARCH_TERMS.get(symbol, ['Adani'])
        results = []
        for term in terms[:1]:  # only 1 search for SEBI
            try:
                url = (
                    f'https://www.sebi.gov.in/sebiweb/ajax/getOrderData.jsp'
                    f'?name=&fromDate=&toDate=&searchTxt={term}'
                )
                resp = requests.get(url, timeout=15, headers={
                    **self._HEADERS,
                    'Referer': 'https://www.sebi.gov.in/enforcement/orders.html',
                })
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                        for item in data.get('data', [])[:5]:
                            date_str = item.get('date', '')
                            try:
                                dt = datetime.strptime(date_str, '%d-%b-%Y')
                                days_ago = (datetime.now() - dt).days
                                date_str = dt.strftime('%Y-%m-%d')
                            except Exception:
                                days_ago = 999
                            results.append({
                                'source': 'SEBI',
                                'court': 'SEBI',
                                'title': item.get('subject', item.get('title', '')),
                                'date': date_str,
                                'url': f'https://www.sebi.gov.in{item.get("link", "")}',
                                'days_ago': days_ago,
                            })
                    except Exception:
                        # SEBI might return HTML instead of JSON
                        logger.warning(f"SEBI response was not valid JSON for '{term}'")
                else:
                    logger.warning(f"SEBI returned {resp.status_code} for '{term}'")
            except Exception as e:
                logger.warning(f"SEBI fetch failed for '{term}': {e}")
        return results

    def compute_legal_score(self, filings: list) -> dict:
        """Compute a legal risk score based on recency of filings."""
        recent = [f for f in filings if f.get('days_ago', 999) < 30]
        score = min(100, len(recent) * 40)  # 1 filing=40, 2=80, 3+=100
        return {
            'score': score,
            'recent_filing_count': len(recent),
            'total_filing_count': len(filings),
            'status': 'CRITICAL' if score > 75 else 'ACTIVE' if score > 40 else 'CLEAR',
            'latest_filing': filings[0] if filings else None,
        }
