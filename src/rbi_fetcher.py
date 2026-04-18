import requests
import re
import logging
from bs4 import BeautifulSoup
from datetime import datetime
import pytz

logger = logging.getLogger(__name__)
IST = pytz.timezone('Asia/Kolkata')

class RBIFetcher:
    """
    Fetches India Macro data: Repo Rate (RBI scraping) and CPI Inflation (Data.gov.in).
    """
    
    def __init__(self):
        self.fallback_repo = 6.50  # Updated to current real-world value
        self.fallback_cpi = 4.85   # Updated to current real-world value

    def fetch_repo_rate(self):
        """Scrapes the most recent Repo Rate from the RBI Press Release page."""
        url = "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx"
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"}
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'lxml')
                # Search for 'monetary policy' or 'repo rate' in recent links
                links = soup.find_all('a', string=re.compile(r'Monetary Policy Statement', re.I))
                if links:
                    pr_url = "https://www.rbi.org.in/Scripts/" + links[0]['href']
                    pr_resp = requests.get(pr_url, headers=headers, timeout=10)
                    if pr_resp.status_code == 200:
                        # Extract rate using regex: r'repo rate.*?(\d+\.\d+).*?per cent'
                        match = re.search(r'repo rate.*?(\d+\.\d+).*?per cent', pr_resp.text, re.I)
                        if match:
                            rate = float(match.group(1))
                            logger.info(f"RBI: Found repo rate {rate}%")
                            return {"value": rate, "is_live": True, "source": "RBI Press Release"}
        except Exception as e:
            logger.warning(f"RBI Repo Rate scrape failed: {e}")
            
        return {"value": self.fallback_repo, "is_live": False, "source": "Hardcoded (Fallback)"}

    def fetch_cpi_inflation(self):
        """Fetches latest CPI headline inflation from data.gov.in open API."""
        # Using the public key from the Build Guide
        api_key = "579b464db66ec23bdd000001cdd3946e44ce4aab825770792309"
        url = f"https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key={api_key}&format=json"
        
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                records = data.get('records', [])
                if records:
                    # Parse latest record
                    latest = records[-1]
                    # Typically CPI is in a field like 'headline_cpi' or similar
                    # Best-effort parse based on common data.gov.in schema
                    cpi = float(latest.get('cpi_combined', latest.get('headline_cpi', self.fallback_cpi)))
                    logger.info(f"Data.gov.in: Found CPI {cpi}%")
                    return {"value": cpi, "is_live": True, "source": "Data.gov.in (CPI)"}
        except Exception as e:
            logger.warning(f"CPI Inflation fetch failed: {e}")

        return {"value": self.fallback_cpi, "is_live": False, "source": "Hardcoded (Fallback)"}

    def get_upcoming_mpc(self):
        """Returns hardcoded upcoming RBI MPC meeting dates."""
        meetings = [
            {"date": "2026-06-03", "event": "RBI MPC Meeting"},
            {"date": "2026-08-05", "event": "RBI MPC Meeting"},
            {"date": "2026-10-07", "event": "RBI MPC Meeting"},
            {"date": "2026-12-08", "event": "RBI MPC Meeting"},
        ]
        return [m for m in meetings if datetime.strptime(m["date"], "%Y-%m-%d").date() >= datetime.now().date()]
