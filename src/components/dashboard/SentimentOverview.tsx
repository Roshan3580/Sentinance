import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Activity, MessageSquare, Twitter, Newspaper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SentimentOverviewProps {
  ticker: string;
}

interface SentimentApiMention {
  sentiment: number;
  timestamp: string;
  text: string;
}

interface SentimentOverviewApiResponse {
  ticker: string;
  timestamps: string[];
  scores: number[];
  top_posts: SentimentApiMention[];
}

interface OverviewData {
  overall: number;
  change: number;
  reddit: { score: number; posts: number; change: number };
  twitter: { score: number; tweets: number; change: number };
  news: { score: number; articles: number; change: number };
}

const fetchMentions = async (ticker: string): Promise<SentimentOverviewApiResponse> => {
  const res = await fetch(
    `http://localhost:8000/sentiment/reddit?ticker=${encodeURIComponent(ticker)}&limit=100`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch sentiment overview");
  }
  return res.json();
};

export const SentimentOverview = ({ ticker }: SentimentOverviewProps) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SentimentOverviewApiResponse, Error>({
    queryKey: ["sentimentOverview", ticker],
    queryFn: () => fetchMentions(ticker),
    refetchInterval: 60000,
  });

  const overviewData: OverviewData | null = useMemo(() => {
    if (!data || !Array.isArray(data.top_posts)) return null;
    if (data.top_posts.length === 0) {
      return {
        overall: 0,
        change: 0,
        reddit: { score: 0, posts: 0, change: 0 },
        twitter: { score: 0, tweets: 0, change: 0 },
        news: { score: 0, articles: 0, change: 0 },
      };
    }
    const sentiments = data.top_posts.map((item) => item.sentiment);
    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    const positiveCount = sentiments.filter((s) => s > 0.1).length;
    const negativeCount = sentiments.filter((s) => s < -0.1).length;
    return {
      overall: avgSentiment * 100,
      change: ((positiveCount - negativeCount) / sentiments.length) * 100,
      reddit: {
        score: avgSentiment * 100,
        posts: sentiments.length,
        change: ((positiveCount - negativeCount) / sentiments.length) * 100,
      },
      twitter: { score: 0, tweets: 0, change: 0 },
      news: { score: 0, articles: 0, change: 0 },
    };
  }, [data]);

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

  if (isLoading) return <div className="text-slate-300">Loading sentiment overview...</div>;
  if (isError) return <div className="text-red-400">{error?.message}</div>;
  if (!overviewData) return <div className="text-slate-400">No sentiment data available.</div>;

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <span>Sentiment Overview - {ticker}</span>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-lg font-bold text-cyan-400">
              {overviewData.overall > 0 ? '+' : ''}{overviewData.overall.toFixed(1)}%
            </span>
            <span className={`text-sm ${overviewData.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              ({overviewData.change > 0 ? '+' : ''}{overviewData.change.toFixed(1)}%)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Reddit"
            value={overviewData.reddit.score}
            change={overviewData.reddit.change}
            icon={MessageSquare}
            count={overviewData.reddit.posts}
            unit="posts"
          />
          <StatCard
            title="Twitter"
            value={overviewData.twitter.score}
            change={overviewData.twitter.change}
            icon={Twitter}
            count={overviewData.twitter.tweets}
            unit="tweets"
          />
          <StatCard
            title="News"
            value={overviewData.news.score}
            change={overviewData.news.change}
            icon={Newspaper}
            count={overviewData.news.articles}
            unit="articles"
          />
        </div>
      </CardContent>
    </Card>
  );
};
