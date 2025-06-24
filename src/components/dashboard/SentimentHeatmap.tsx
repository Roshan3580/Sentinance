import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SentimentHeatmapProps {
  timeRange: string;
}

// Popular tickers to show in heatmap
const POPULAR_TICKERS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC'];

export const SentimentHeatmap = ({ timeRange }: SentimentHeatmapProps) => {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Fetch sentiment data for all popular tickers
    const fetchAllTickers = async () => {
      try {
        const promises = POPULAR_TICKERS.map(ticker => 
          fetch(`http://localhost:8000/sentiment/reddit?ticker=${ticker}&limit=20`)
            .then(res => res.ok ? res.json() : [])
            .catch(() => [])
        );
        
        const results = await Promise.all(promises);
        
        const processedData = POPULAR_TICKERS.map((ticker, index) => {
          const tickerData = results[index];
          if (tickerData.length === 0) {
            return {
              ticker,
              sentiment: 0,
              posts: 0,
              change: 0
            };
          }
          
          const sentiments = tickerData.map((item: any) => item.sentiment);
          const avgSentiment = sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length;
          const positiveCount = sentiments.filter((s: number) => s > 0.1).length;
          const negativeCount = sentiments.filter((s: number) => s < -0.1).length;
          
          return {
            ticker,
            sentiment: avgSentiment * 100,
            posts: sentiments.length,
            change: ((positiveCount - negativeCount) / sentiments.length) * 100
          };
        });
        
        setHeatmapData(processedData);
        setLoading(false);
      } catch (err) {
        setError('Could not load heatmap data.');
        setLoading(false);
      }
    };
    
    fetchAllTickers();
  }, [timeRange]);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 30) return "bg-green-500/20 border-green-500/30";
    if (sentiment > 10) return "bg-green-400/20 border-green-400/30";
    if (sentiment > -10) return "bg-yellow-500/20 border-yellow-500/30";
    if (sentiment > -30) return "bg-red-400/20 border-red-400/30";
    return "bg-red-500/20 border-red-500/30";
  };

  const getSentimentTextColor = (sentiment: number) => {
    if (sentiment > 10) return "text-green-400";
    if (sentiment > -10) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) return <div className="text-slate-300">Loading sentiment heatmap...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <span>Sentiment Heatmap</span>
          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded"></div>
            <span>Negative</span>
            <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/30 rounded"></div>
            <span>Neutral</span>
            <div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded"></div>
            <span>Positive</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {heatmapData.map((item) => (
            <div
              key={item.ticker}
              className={`p-3 rounded-lg border ${getSentimentColor(item.sentiment)} transition-all hover:scale-105 cursor-pointer`}
            >
              <div className="text-center">
                <div className="text-lg font-bold text-white mb-1">
                  {item.ticker}
                </div>
                <div className={`text-sm font-medium ${getSentimentTextColor(item.sentiment)} mb-1`}>
                  {item.sentiment > 0 ? '+' : ''}{item.sentiment.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400 mb-2">
                  {item.posts} posts
                </div>
                <div className="flex items-center justify-center">
                  {item.change > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  <span className={`text-xs ml-1 ${item.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {Math.abs(item.change).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
