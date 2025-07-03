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
sentiment_pipeline = pipeline("sentiment-analysis", model="yiyanghkust/finbert-tone")

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

@app.get("/sentiment/reddit")
def get_reddit_sentiment(ticker: str, limit: int = 10):
    try:
        subreddit = reddit.subreddit("stocks+wallstreetbets")
        query = f"{ticker}"
        posts = subreddit.search(query, sort="new", limit=limit)
        results = []
        for post in posts:
            text = post.title + ("\n" + post.selftext if post.selftext else "")
            sentiment_result = sentiment_pipeline(text[:512])[0]  # Truncate to 512 chars
            label = sentiment_result["label"].lower()
            score = sentiment_result.get("score", 1.0)
            if label == "positive":
                sentiment_score = score if score >= 0.6 else 0.0
            elif label == "negative":
                sentiment_score = -score if score >= 0.6 else 0.0
            else:
                sentiment_score = 0.0
            results.append(SentimentResponse(
                ticker=ticker,
                source="reddit",
                sentiment=sentiment_score,
                timestamp=datetime.fromtimestamp(post.created_utc, tz=timezone.utc).isoformat(),
                text=text
            ))
        # Transform to the expected format
        timestamps = [r.timestamp for r in results]
        scores = [r.sentiment for r in results]
        top_posts = [r.dict() for r in results]
        return {
            "ticker": ticker,
            "timestamps": timestamps,
            "scores": scores,
            "top_posts": top_posts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 