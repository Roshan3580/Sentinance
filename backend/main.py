import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import praw
from transformers import pipeline
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
import httpx
import subprocess
import json
from fastapi.responses import JSONResponse

app = FastAPI(title="Sentinance Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT")

# --- Models ---
class StockListItem(BaseModel):
    symbol: str
    name: str
    type: str = "Equity"
    region: str = "United States"

class StockDetails(BaseModel):
    symbol: str
    name: str
    price: float
    market_cap: float = 0.0
    currency: str = "USD"
    last_refreshed: str

class SentimentMention(BaseModel):
    source: str
    sentiment: float
    timestamp: str
    text: str

class SentimentResponse(BaseModel):
    ticker: str
    timestamps: List[str]
    scores: List[float]
    top_posts: List[SentimentMention]

class StockPricePoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

# --- Endpoints ---
@app.get("/stocks/list", response_model=List[StockListItem])
async def get_stocks_list():
    # For demo: Use a static list or fetch from Alpha Vantage symbol search
    # Here, we use a static list for simplicity
    return [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation"},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "NVDA", "name": "NVIDIA Corporation"},
    ]

@app.get("/stocks/{ticker}", response_model=StockDetails)
async def get_stock_details(ticker: str):
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}"
    async with httpx.AsyncClient() as client:
        r = await client.get(url)
        data = r.json()
    if "Global Quote" not in data or not data["Global Quote"]:
        raise HTTPException(status_code=404, detail="Stock not found")
    quote = data["Global Quote"]
    return StockDetails(
        symbol=quote["01. symbol"],
        name=ticker,  # Alpha Vantage free API does not return company name here
        price=float(quote["05. price"]),
        last_refreshed=datetime.now().isoformat()
    )

@app.get("/sentiment/{ticker}", response_model=SentimentResponse)
async def get_sentiment(
    ticker: str,
    source: str = Query("reddit", regex="^(reddit|news)$"),
    limit: int = Query(20, ge=1, le=100)
):
    if source == "reddit":
        # Fetch Reddit posts/comments using PRAW
        reddit = praw.Reddit(
            client_id=REDDIT_CLIENT_ID,
            client_secret=REDDIT_CLIENT_SECRET,
            user_agent=REDDIT_USER_AGENT
        )
        sentiment_pipeline = pipeline("sentiment-analysis", model="yiyanghkust/finbert-tone")
        subreddit = reddit.subreddit("stocks+wallstreetbets")
        query = f"{ticker}"
        posts = subreddit.search(query, sort="new", limit=limit)
        results = []
        for post in posts:
            text = post.title + ("\n" + post.selftext if post.selftext else "")
            sentiment_result = sentiment_pipeline(text[:512])[0]
            label = sentiment_result["label"].lower()
            score = sentiment_result.get("score", 1.0)
            if label == "positive":
                sentiment_score = score if score >= 0.6 else 0.0
            elif label == "negative":
                sentiment_score = -score if score >= 0.6 else 0.0
            else:
                sentiment_score = 0.0
            results.append(SentimentMention(
                source="reddit",
                sentiment=sentiment_score,
                timestamp=datetime.fromtimestamp(post.created_utc, tz=timezone.utc).isoformat(),
                text=text
            ))
        if not results:
            raise HTTPException(status_code=404, detail="No Reddit data found for this ticker.")
        return SentimentResponse(
            ticker=ticker,
            timestamps=[r.timestamp for r in results],
            scores=[r.sentiment for r in results],
            top_posts=results
        )
    elif source == "news":
        # Fetch news headlines using NewsAPI
        url = f"https://newsapi.org/v2/everything?q={ticker}&sortBy=publishedAt&apiKey={NEWSAPI_KEY}&pageSize={limit}"
        async with httpx.AsyncClient() as client:
            r = await client.get(url)
            data = r.json()
        if "articles" not in data or not data["articles"]:
            raise HTTPException(status_code=404, detail="No news data found for this ticker.")
        sentiment_pipeline = pipeline("sentiment-analysis", model="yiyanghkust/finbert-tone")
        results = []
        for article in data["articles"]:
            text = article.get("title", "") + ("\n" + article.get("description", "") if article.get("description") else "")
            if not text:
                continue
            sentiment_result = sentiment_pipeline(text[:512])[0]
            label = sentiment_result["label"].lower()
            score = sentiment_result.get("score", 1.0)
            if label == "positive":
                sentiment_score = score if score >= 0.6 else 0.0
            elif label == "negative":
                sentiment_score = -score if score >= 0.6 else 0.0
            else:
                sentiment_score = 0.0
            results.append(SentimentMention(
                source="news",
                sentiment=sentiment_score,
                timestamp=article.get("publishedAt", ""),
                text=text
            ))
        if not results:
            raise HTTPException(status_code=404, detail="No news data found for this ticker.")
        return SentimentResponse(
            ticker=ticker,
            timestamps=[r.timestamp for r in results],
            scores=[r.sentiment for r in results],
            top_posts=results
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid source. Choose from reddit, news.")

@app.get("/stocks/{ticker}/history", response_model=List[StockPricePoint])
async def get_stock_history(ticker: str, days: int = Query(30, ge=1, le=100)):
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}"
    async with httpx.AsyncClient() as client:
        r = await client.get(url)
        data = r.json()
    if "Time Series (Daily)" not in data:
        raise HTTPException(status_code=404, detail="No price history found")
    series = data["Time Series (Daily)"]
    points = []
    for date_str in sorted(series.keys(), reverse=True)[:days]:
        day = series[date_str]
        points.append(StockPricePoint(
            date=date_str,
            open=float(day["1. open"]),
            high=float(day["2. high"]),
            low=float(day["3. low"]),
            close=float(day["4. close"]),
            volume=int(day["5. volume"])
        ))
    return list(reversed(points))  # Oldest first

@app.get("/stocks/top-movers")
async def get_top_movers():
    tickers = [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation"},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "NVDA", "name": "NVIDIA Corporation"},
    ]
    results = []
    async with httpx.AsyncClient() as client:
        for t in tickers:
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={t['symbol']}&apikey={ALPHA_VANTAGE_API_KEY}"
            r = await client.get(url)
            data = r.json()
            quote = data.get("Global Quote", {})
            try:
                price = float(quote["05. price"])
                prev_close = float(quote["08. previous close"])
                change_percent = ((price - prev_close) / prev_close) * 100 if prev_close else 0.0
            except Exception:
                price = 0.0
                change_percent = 0.0
            results.append({
                "symbol": t["symbol"],
                "name": t["name"],
                "price": price,
                "change_percent": change_percent,
            })
    sorted_results = sorted(results, key=lambda x: x["change_percent"], reverse=True)
    gainers = sorted_results[:3]
    losers = sorted(results, key=lambda x: x["change_percent"])[:3]
    return JSONResponse({"gainers": gainers, "losers": losers})

@app.get("/stocks/most-active")
async def get_most_active():
    tickers = [
        {"symbol": "AAPL", "name": "Apple Inc."},
        {"symbol": "MSFT", "name": "Microsoft Corporation"},
        {"symbol": "GOOGL", "name": "Alphabet Inc."},
        {"symbol": "TSLA", "name": "Tesla Inc."},
        {"symbol": "AMZN", "name": "Amazon.com Inc."},
        {"symbol": "NVDA", "name": "NVIDIA Corporation"},
    ]
    results = []
    async with httpx.AsyncClient() as client:
        for t in tickers:
            url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={t['symbol']}&apikey={ALPHA_VANTAGE_API_KEY}"
            r = await client.get(url)
            data = r.json()
            quote = data.get("Global Quote", {})
            try:
                volume = int(quote["06. volume"])
            except Exception:
                volume = 0
            results.append({
                "symbol": t["symbol"],
                "name": t["name"],
                "volume": volume,
            })
    sorted_results = sorted(results, key=lambda x: x["volume"], reverse=True)
    return JSONResponse({"most_active": sorted_results[:5]}) 