import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

interface TickerSearchProps {
  selectedTicker: string;
  onTickerChange: (ticker: string) => void;
  hideDetails?: boolean;
}

interface StockListItem {
  symbol: string;
  name: string;
}

interface StockDetails {
  symbol: string;
  name: string;
  price: number;
  market_cap?: number;
  currency?: string;
  last_refreshed: string;
}

export const TickerSearch = ({ selectedTicker, onTickerChange, hideDetails = false }: TickerSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { data: stocks, isLoading } = useQuery<StockListItem[]>({
    queryKey: ["stocks", "list"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/stocks/list");
      if (!res.ok) throw new Error("Failed to fetch stock list");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredTickers =
    searchQuery.trim() && stocks
      ? stocks.filter(
          (stock) =>
            stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];

  const showDropdown = isFocused && (searchQuery.trim() ? true : false);

  const handleTickerSelect = (ticker: string) => {
    onTickerChange(ticker);
    setSearchQuery("");
    setIsFocused(false);
    setIsOpen(false);
  };

  // Fetch selected ticker details for name and price
  const { data: selectedDetails, isLoading: isDetailsLoading } = useQuery<StockDetails, Error>({
    queryKey: ["stock", selectedTicker],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/stocks/${selectedTicker}`);
      if (!res.ok) throw new Error("Failed to fetch stock details");
      return res.json();
    },
    enabled: !!selectedTicker,
    staleTime: 60 * 1000,
  });

  const POPULAR_TICKERS = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
  ];

  return (
    <div className="relative w-full flex items-center gap-2">
      <div className="flex-1 min-w-0 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tickers..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => setTimeout(() => { setIsFocused(false); setIsOpen(false); }, 150)}
          className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {(isFocused || isOpen) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-[100] max-h-72 overflow-y-auto min-w-[250px]">
            <div className="p-2">
              {isLoading ? (
                <div className="px-4 py-3 text-slate-400">Loading...</div>
              ) : searchQuery.trim() ? (
                filteredTickers.length > 0 ? (
                  filteredTickers.map((stock) => (
                    <div
                      key={stock.symbol}
                      onClick={() => handleTickerSelect(stock.symbol)}
                      className="px-4 py-2 hover:bg-slate-600 cursor-pointer text-white flex items-center justify-between rounded"
                    >
                      <span className="font-medium">{stock.symbol}</span>
                      <span className="text-xs text-slate-400 ml-2">{stock.name}</span>
                      {stock.symbol === selectedTicker && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-slate-400">No results found.</div>
                )
              ) : null}
            </div>
            <div className="border-t border-slate-700 p-2">
              <h3 className="text-xs font-medium text-slate-400 mb-1">Quick Select</h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TICKERS.map((ticker) => (
                  <button
                    key={ticker.symbol}
                    onClick={() => handleTickerSelect(ticker.symbol)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                      ticker.symbol === selectedTicker
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    {ticker.symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {!hideDetails && (
        <div className="bg-slate-700 rounded p-2 flex items-center gap-2 min-w-[120px]">
          <span className="text-base font-bold text-white">{selectedTicker}</span>
          {isDetailsLoading ? (
            <span className="text-xs text-slate-400 ml-2 animate-pulse">Loading...</span>
          ) : selectedDetails ? (
            <>
              <span className="text-xs text-slate-300 ml-2">{selectedDetails.name}</span>
              <span className="text-green-400 font-semibold ml-2">${selectedDetails.price?.toFixed(2)}</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
