import os
import httpx
import json
import csv
from io import StringIO

# URL for S&P 500 companies list
SP500_URL = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv"

DATA_PATH = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_PATH, exist_ok=True)
TICKERS_FILE = os.path.join(DATA_PATH, "tickers.json")

print("Fetching S&P 500 tickers...")

try:
    response = httpx.get(SP500_URL)
    response.raise_for_status()
except httpx.HTTPStatusError as e:
    print(f"HTTP error occurred: {e}")
    exit(1)
except httpx.RequestError as e:
    print(f"An error occurred while requesting {e.request.url!r}: {e}")
    exit(1)

# Parse CSV data from response
csv_file = StringIO(response.text)
reader = csv.DictReader(csv_file)

sp500_tickers = []
for row in reader:
    sp500_tickers.append({
        "symbol": row["Symbol"],
        "name": row["Security"]
    })

# Save to tickers.json
with open(TICKERS_FILE, "w") as f:
    json.dump(sp500_tickers, f, indent=2)

print(f"Successfully saved {len(sp500_tickers)} S&P 500 tickers to {TICKERS_FILE}") 