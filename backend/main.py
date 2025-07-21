import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import praw
from transformers import pipeline
from datetime import datetime, timezone, timedelta
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

POLYGON_API_KEY = os.getenv("POLYGON_API_KEY")
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
    with open(os.path.join(os.path.dirname(__file__), "data/tickers.json"), "r") as f:
        tickers = json.load(f)
    return [
        StockListItem(
            symbol=item["symbol"],
            name=item["name"],
            type="Equity",
            region="United States"
        )
        for item in tickers
    ]

@app.get("/stocks/{ticker}", response_model=StockDetails)
async def get_stock_details(ticker: str):
    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/prev?adjusted=true&apiKey={POLYGON_API_KEY}"
    details_url = f"https://api.polygon.io/v3/reference/tickers/{ticker}?apiKey={POLYGON_API_KEY}"

    async with httpx.AsyncClient() as client:
        # Get previous day's close
        r = await client.get(url)
        data = r.json()
        if "results" not in data or not data["results"]:
            raise HTTPException(status_code=404, detail="Stock not found")
        
        # Get ticker details
        details_r = await client.get(details_url)
        details_data = details_r.json()
        
        name = details_data.get("results", {}).get("name", ticker)
        market_cap = details_data.get("results", {}).get("market_cap", 0)

    quote = data["results"][0]
    return StockDetails(
        symbol=data["ticker"],
        name=name,
        price=float(quote["c"]),
        market_cap=market_cap,
        last_refreshed=datetime.fromtimestamp(quote["t"] / 1000).isoformat()
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
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}?adjusted=true&sort=asc&apiKey={POLYGON_API_KEY}"
    
    async with httpx.AsyncClient() as client:
        r = await client.get(url)
        data = r.json()
    
    if "results" not in data:
        raise HTTPException(status_code=404, detail="No price history found")
    
    points = [
        StockPricePoint(
            date=datetime.fromtimestamp(p["t"] / 1000).strftime('%Y-%m-%d'),
            open=float(p["o"]),
            high=float(p["h"]),
            low=float(p["l"]),
            close=float(p["c"]),
            volume=int(p["v"])
        ) for p in data["results"]
    ]
    
    return points 