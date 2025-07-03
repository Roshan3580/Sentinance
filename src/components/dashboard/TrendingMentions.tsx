import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendingMentionsProps {
  ticker: string;
}

interface SentimentMention {
  id: number;
  source: string;
  author: string;
  content: string;
  score: number;
  sentiment: number;
  time: string;
}

interface SentimentApiMention {
  sentiment: number;
  timestamp: string;
  text: string;
  // Optionally add author if backend provides it
}

interface TrendingMentionsApiResponse {
  ticker: string;
  timestamps: string[];
  scores: number[];
  top_posts: SentimentApiMention[];
}

const fetchMentions = async (ticker: string): Promise<TrendingMentionsApiResponse> => {
  const res = await fetch(
    `http://localhost:8000/sentiment/reddit?ticker=${encodeURIComponent(ticker)}&limit=10`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch trending mentions");
  }
  return res.json();
};

export const TrendingMentions = ({ ticker }: TrendingMentionsProps) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TrendingMentionsApiResponse, Error>({
    queryKey: ["trendingMentions", ticker],
    queryFn: () => fetchMentions(ticker),
    refetchInterval: 60000,
  });

  const mentions: SentimentMention[] = useMemo(() => {
    if (!data || !Array.isArray(data.top_posts)) return [];
    return data.top_posts.map((item, index) => ({
      id: index + 1,
      source: "Reddit",
      author: "Reddit User", // Update if backend provides author
      content: item.text.length > 200 ? item.text.substring(0, 200) + "..." : item.text,
      score: Math.abs(item.sentiment * 1000),
      sentiment: item.sentiment,
      time: new Date(item.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    }));
  }, [data]);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return "text-green-400";
    if (sentiment > 0) return "text-green-300";
    if (sentiment > -0.3) return "text-yellow-400";
    return "text-red-400";
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return "🟢";
    if (sentiment > 0) return "🟡";
    return "🔴";
  };

  if (isLoading) return <div className="text-slate-300">Loading trending mentions...</div>;
  if (isError) return <div className="text-red-400">{error?.message}</div>;
  if (!mentions.length) return <div className="text-slate-400">No mentions available for {ticker}.</div>;

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Trending Mentions - {ticker}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {mentions.map((mention) => (
            <div
              key={mention.id}
              className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30 hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-slate-600 text-slate-200 px-2 py-1 rounded">
                    {mention.source}
                  </span>
                  <span className="text-sm text-slate-400">@{mention.author}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs">{getSentimentIcon(mention.sentiment)}</span>
                  <span className={`text-sm font-medium ${getSentimentColor(mention.sentiment)}`}>
                    {(mention.sentiment * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-slate-200 mb-3 leading-relaxed">
                {mention.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{mention.score}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{mention.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-600/30">
          <div className="text-center">
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors" onClick={() => refetch()}>
              Load more mentions →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
