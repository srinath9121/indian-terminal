from datetime import datetime
import pytz

IST = pytz.timezone('Asia/Kolkata')

def get_upcoming_events(days=30):
    """
    Returns a list of hardcoded upcoming macro events relevance to India.
    Static data as per Build Guide Phase 5.
    """
    all_events = [
        {"type": "MPC_MEETING", "date": "2026-06-03", "label": "RBI MPC Policy Decision", "impact": "HIGH", "india_relevance": "Drives interest rates and banking sector liquidity."},
        {"type": "INFLATION_RELEASE", "date": "2026-05-12", "label": "CPI Inflation Data", "impact": "HIGH", "india_relevance": "Key metric for RBI rate decision targets."},
        {"type": "GDP_RELEASE", "date": "2026-05-31", "label": "Quarterly GDP (Q4FY26)", "impact": "HIGH", "india_relevance": "Measures overall economic health and sectoral growth."},
        {"type": "NIFTY_EXPIRY", "date": "2026-04-30", "label": "April Nifty Expiry", "impact": "MEDIUM", "india_relevance": "High volatility day for derivatives settlement."},
        {"type": "NIFTY_EXPIRY", "date": "2026-05-28", "label": "May Nifty Expiry", "impact": "MEDIUM", "india_relevance": "High volatility day for derivatives settlement."},
        {"type": "US_FED_MEETING", "date": "2026-05-06", "label": "US FOMC Rate Decision", "impact": "HIGH", "india_relevance": "Affects FII flows and USD/INR exchange rates."},
    ]
    
    now = datetime.now(IST).date()
    upcoming = []
    for evt in all_events:
        evt_date = datetime.strptime(evt["date"], "%Y-%m-%d").date()
        if now <= evt_date:
            upcoming.append(evt)
            
    upcoming.sort(key=lambda x: x["date"])
    return upcoming[:5]
