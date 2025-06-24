# Sentinance Backend (FastAPI)

This directory contains the Python FastAPI backend for Sentinance.

## Features
- Data ingestion from Reddit (and later Twitter, News)
- Sentiment analysis using financial NLP models
- API endpoints for the frontend dashboard

## Setup
1. Create a virtual environment:
   ```sh
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```sh
   uvicorn main:app --reload
   ```

## Next Steps
- Implement Reddit ingestion and sentiment analysis
- Add endpoints for the frontend to fetch sentiment data 