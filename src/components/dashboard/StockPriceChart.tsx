import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StockPriceChartProps {
  ticker: string;
}

interface StockPricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const StockPriceChart = ({ ticker }: StockPriceChartProps) => {
  const { data, isLoading, isError, error } = useQuery<StockPricePoint[], Error>({
    queryKey: ["stock", ticker, "history"],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/stocks/${ticker}/history`);
      if (!res.ok) throw new Error("Failed to fetch price history");
      return res.json();
    },
    enabled: !!ticker,
    staleTime: 60 * 1000,
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <span>Stock Price Chart</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-slate-300">Loading price chart...</div>
        ) : isError ? (
          <div className="text-red-400">{error?.message}</div>
        ) : data && data.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} minTickGap={10} />
                <YAxis stroke="#9ca3af" fontSize={12} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                  labelStyle={{ color: "#f1f5f9" }}
                  formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                />
                <Line type="monotone" dataKey="close" stroke="#06b6d4" strokeWidth={2} dot={false} name="Close Price" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-slate-400">No price data available.</div>
        )}
      </CardContent>
    </Card>
  );
}; 