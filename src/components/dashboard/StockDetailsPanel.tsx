import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StockDetailsPanelProps {
  ticker: string;
}

interface StockDetails {
  symbol: string;
  name: string;
  price: number;
  market_cap?: number;
  currency?: string;
  last_refreshed: string;
}

export const StockDetailsPanel = ({ ticker }: StockDetailsPanelProps) => {
  const { data, isLoading, isError, error } = useQuery<StockDetails, Error>({
    queryKey: ["stock", ticker],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/stocks/${ticker}`);
      if (!res.ok) throw new Error("Failed to fetch stock details");
      return res.json();
    },
    enabled: !!ticker,
    staleTime: 60 * 1000,
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <span>Stock Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-slate-300">Loading stock details...</div>
        ) : isError ? (
          <div className="text-red-400">{error?.message}</div>
        ) : data ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-white">{data.symbol}</span>
              <span className="text-lg text-slate-400">{data.name}</span>
            </div>
            <div className="text-3xl font-bold text-green-400">${data.price.toFixed(2)}</div>
            <div className="text-xs text-slate-400">
              Last refreshed: {new Date(data.last_refreshed).toLocaleString()}
            </div>
            {data.market_cap && (
              <div className="text-xs text-slate-400">Market Cap: ${data.market_cap.toLocaleString()}</div>
            )}
            {data.currency && (
              <div className="text-xs text-slate-400">Currency: {data.currency}</div>
            )}
          </div>
        ) : (
          <div className="text-slate-400">No data available.</div>
        )}
      </CardContent>
    </Card>
  );
}; 