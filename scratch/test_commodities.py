import asyncio
import yfinance as yf
from server import COMMODITIES_CONFIG

async def test():
    tickers = [c['ticker'] for c in COMMODITIES_CONFIG] + ['USDINR=X']
    print(f"Fetching: {tickers}")
    df = yf.download(tickers, period='2d', group_by='ticker', progress=False)
    print("Columns:", df.columns.levels[0].tolist())
    for c in COMMODITIES_CONFIG:
        if c['ticker'] in df.columns.levels[0]:
            data = df[c['ticker']]['Close'].dropna()
            print(f"{c['id']} ({c['ticker']}): {len(data)} points")
        else:
            print(f"{c['id']} ({c['ticker']}): MISSING")

asyncio.run(test())
