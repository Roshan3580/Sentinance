import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import praw
from transformers import pipeline
from datetime import datetime, timezone
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sentinance Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class SentimentResponse(BaseModel):
    ticker: str
    source: str
    sentiment: float
    timestamp: str
    text: str

# Load sentiment analysis pipeline (FinBERT or similar)
sentiment_pipeline = pipeline("sentiment-analysis", model="ProsusAI/finbert")

# Reddit API credentials from environment variables
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")
REDDIT_USER_AGENT = os.getenv("REDDIT_USER_AGENT", "sentinance-app")

if not (REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET):
    raise RuntimeError("Reddit API credentials not set in environment variables.")

reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_CLIENT_SECRET,
    user_agent=REDDIT_USER_AGENT
)

@app.get("/")
def root():
    return {"message": "Sentinance Backend is running."}

@app.get("/sentiment/reddit", response_model=List[SentimentResponse])
def get_reddit_sentiment(ticker: str, limit: int = 10):
    try:
        subreddit = reddit.subreddit("stocks+wallstreetbets")
        query = f"{ticker}"
        posts = subreddit.search(query, sort="new", limit=limit)
        results = []
        for post in posts:
            text = post.title + ("\n" + post.selftext if post.selftext else "")
            # Run sentiment analysis
            sentiment_result = sentiment_pipeline(text[:512])[0]  # Truncate to 512 chars
            sentiment_score = (
                1.0 if sentiment_result["label"] == "positive" else
                -1.0 if sentiment_result["label"] == "negative" else
                0.0
            )
            results.append(SentimentResponse(
                ticker=ticker,
                source="reddit",
                sentiment=sentiment_score,
                timestamp=datetime.fromtimestamp(post.created_utc, tz=timezone.utc).isoformat(),
                text=text
            ))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 