import { ExternalLink, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface NewsPanelProps {
  ticker: string;
}

interface SentimentMention {
  source: string;
  sentiment: number;
  timestamp: string;
  text: string;
}

interface SentimentApiResponse {
  ticker: string;
  timestamps: string[];
  scores: number[];
  top_posts: SentimentMention[];
}

export const NewsPanel = ({ ticker }: NewsPanelProps) => {
  const { data, isLoading, isError, error } = useQuery<SentimentApiResponse, Error>({
    queryKey: ["sentiment", ticker, "news"],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/sentiment/${ticker}?source=news`);
      if (!res.ok) throw new Error("Failed to fetch news data");
      return res.json();
    },
    enabled: !!ticker,
    refetchInterval: 60000,
  });

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return "text-green-400";
    if (sentiment > 0) return "text-green-300";
    if (sentiment > -0.3) return "text-yellow-400";
    return "text-red-400";
  };

  const getSentimentBg = (sentiment: number) => {
    if (sentiment > 0.5) return "bg-green-500/10 border-green-500/20";
    if (sentiment > 0) return "bg-green-500/5 border-green-500/10";
    if (sentiment > -0.3) return "bg-yellow-500/5 border-yellow-500/10";
    return "bg-red-500/10 border-red-500/20";
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-white flex items-center justify-center h-64">
        <span className="text-slate-400 animate-pulse">Loading news...</span>
      </div>
    );
  }

  if (isError || !data?.top_posts?.length) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-white flex items-center justify-center h-64">
        <span className="text-red-400">No news data available for this ticker.</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border-slate-700/50 border rounded-lg">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <span className="text-white text-lg font-semibold">Latest News - {ticker}</span>
        <TrendingUp className="h-5 w-5 text-cyan-400" />
      </div>
      <div className="px-6 pb-6 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {data.top_posts.map((article, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-4 border transition-all hover:shadow-lg ${getSentimentBg(article.sentiment)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1 leading-tight">
                  {article.text.split("\n")[0]}
                </h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-slate-400">{new Date(article.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <span className={`text-sm font-medium ${getSentimentColor(article.sentiment)}`}>
                  {(article.sentiment * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              {article.text.split("\n").slice(1).join(" ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
