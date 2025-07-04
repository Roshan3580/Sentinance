import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SentimentApiResponse {
  ticker: string;
  timestamps: string[];
  scores: number[];
  top_posts: any[];
}

interface SentimentChartProps {
  ticker: string;
  timeRange: string;
}

interface ChartDataPoint {
  time: string;
  reddit?: number;
  news?: number;
}

const fetchSentiment = async (ticker: string, source: string): Promise<SentimentApiResponse> => {
  const res = await fetch(`http://localhost:8000/sentiment/${ticker}?source=${source}`);
  if (!res.ok) throw new Error("No data available");
  return res.json();
};

export const SentimentChart = ({ ticker, timeRange }: SentimentChartProps) => {
  const redditQuery = useQuery<SentimentApiResponse, Error>({
    queryKey: ["sentiment", ticker, "reddit"],
    queryFn: () => fetchSentiment(ticker, "reddit"),
    refetchInterval: 60000,
    enabled: !!ticker,
  });
  const newsQuery = useQuery<SentimentApiResponse, Error>({
    queryKey: ["sentiment", ticker, "news"],
    queryFn: () => fetchSentiment(ticker, "news"),
    refetchInterval: 60000,
    enabled: !!ticker,
  });

  // Merge data by timestamp
  const chartData: ChartDataPoint[] = useMemo(() => {
    const allTimestamps = new Set<string>();
    redditQuery.data?.timestamps.forEach((t) => allTimestamps.add(t));
    newsQuery.data?.timestamps.forEach((t) => allTimestamps.add(t));
    const sortedTimestamps = Array.from(allTimestamps).sort();
    return sortedTimestamps.map((timestamp) => {
      const time = new Date(timestamp).toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      });
      const redditIdx = redditQuery.data?.timestamps.indexOf(timestamp) ?? -1;
      const newsIdx = newsQuery.data?.timestamps.indexOf(timestamp) ?? -1;
      return {
        time,
        reddit: redditIdx !== -1 ? redditQuery.data?.scores[redditIdx] : undefined,
        news: newsIdx !== -1 ? newsQuery.data?.scores[newsIdx] : undefined,
      };
    });
  }, [redditQuery.data, newsQuery.data]);

  const isLoading = redditQuery.isLoading || newsQuery.isLoading;
  const isError = redditQuery.isError && newsQuery.isError;
  const error = redditQuery.error || newsQuery.error;
  const hasNoData =
    (!redditQuery.data?.scores?.length || redditQuery.isError) &&
    (!newsQuery.data?.scores?.length || newsQuery.isError);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {(entry.value * 100).toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Sentiment Timeline - {ticker}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-slate-400 animate-pulse">Loading sentiment data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || hasNoData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Sentiment Timeline - {ticker}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-red-400">
              No sentiment data available for this ticker.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <span>Sentiment Timeline - {ticker}</span>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span className="text-slate-300">Reddit</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-slate-300">News</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="redditGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="newsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                fontSize={12}
                minTickGap={10}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                domain={[-1, 1]}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="reddit"
                stroke="#fb923c"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#redditGradient)"
                name="Reddit"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="news"
                stroke="#a78bfa"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#newsGradient)"
                name="News"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
