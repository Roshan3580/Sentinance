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
  top_posts: any[]; // Adjust type as needed for future use
}

interface SentimentChartProps {
  ticker: string;
  timeRange: string; // Currently unused, but keep for future extensibility
}

interface ChartDataPoint {
  time: string;
  score: number;
}

const fetchSentiment = async (ticker: string): Promise<SentimentApiResponse> => {
  const res = await fetch(
    `http://localhost:8000/sentiment/reddit?ticker=${encodeURIComponent(ticker)}`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch sentiment data");
  }
  return res.json();
};

export const SentimentChart = ({ ticker, timeRange }: SentimentChartProps) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SentimentApiResponse, Error>({
    queryKey: ["sentiment", "reddit", ticker],
    queryFn: () => fetchSentiment(ticker),
    refetchInterval: 60000, // 60 seconds
  });

  // Transform API data for Recharts
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data || !data.timestamps || !data.scores) return [];
    return data.timestamps.map((time, idx) => ({
      time: new Date(time).toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      }),
      score: data.scores[idx],
    }));
  }, [data]);

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm mb-2">{label}</p>
          <p className="text-sm" style={{ color: "#fb923c" }}>
            Sentiment: {(payload[0].value * 100).toFixed(1)}%
          </p>
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

  if (isError) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Sentiment Timeline - {ticker}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-red-400">
              Error loading sentiment data: {error?.message}
            </span>
            <button
              className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => refetch()}
            >
              Retry
            </button>
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
                dataKey="score"
                stroke="#fb923c"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#redditGradient)"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#fb923c"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
