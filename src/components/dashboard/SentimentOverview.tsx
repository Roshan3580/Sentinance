import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Activity, MessageSquare, Twitter, Newspaper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SentimentOverviewProps {
  ticker: string;
}

export const SentimentOverview = ({ ticker }: SentimentOverviewProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:8000/sentiment/reddit?ticker=${ticker}&limit=100`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(json => {
        if (json.length === 0) {
          setData({
            overall: 0,
            change: 0,
            reddit: { score: 0, posts: 0, change: 0 },
            twitter: { score: 0, tweets: 0, change: 0 },
            news: { score: 0, articles: 0, change: 0 }
          });
        } else {
          // Calculate sentiment statistics
          const sentiments = json.map((item: any) => item.sentiment);
          const avgSentiment = sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length;
          const positiveCount = sentiments.filter((s: number) => s > 0.1).length;
          const negativeCount = sentiments.filter((s: number) => s < -0.1).length;
          
          setData({
            overall: avgSentiment * 100,
            change: ((positiveCount - negativeCount) / sentiments.length) * 100,
            reddit: { 
              score: avgSentiment * 100, 
              posts: sentiments.length, 
              change: ((positiveCount - negativeCount) / sentiments.length) * 100 
            },
            twitter: { score: 0, tweets: 0, change: 0 }, // Placeholder for future
            news: { score: 0, articles: 0, change: 0 }   // Placeholder for future
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Could not load sentiment overview.');
        setLoading(false);
      });
  }, [ticker]);

  const StatCard = ({ title, value, change, icon: Icon, count, unit }: any) => (
    <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">{title}</span>
        </div>
        {change > 0 ? (
          <TrendingUp className="h-4 w-4 text-green-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-400" />
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-white">
            {value > 0 ? '+' : ''}{value.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">
            {count.toLocaleString()} {unit}
          </div>
        </div>
        <div className={`text-sm font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="text-slate-300">Loading sentiment overview...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!data) return <div className="text-slate-400">No sentiment data available.</div>;

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <span>Sentiment Overview - {ticker}</span>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-lg font-bold text-cyan-400">
              {data.overall > 0 ? '+' : ''}{data.overall.toFixed(1)}%
            </span>
            <span className={`text-sm ${data.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Reddit"
            value={data.reddit.score}
            change={data.reddit.change}
            icon={MessageSquare}
            count={data.reddit.posts}
            unit="posts"
          />
          <StatCard
            title="Twitter"
            value={data.twitter.score}
            change={data.twitter.change}
            icon={Twitter}
            count={data.twitter.tweets}
            unit="tweets"
          />
          <StatCard
            title="News"
            value={data.news.score}
            change={data.news.change}
            icon={Newspaper}
            count={data.news.articles}
            unit="articles"
          />
        </div>
      </CardContent>
    </Card>
  );
};
