
import { useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TickerSearchProps {
  selectedTicker: string;
  onTickerChange: (ticker: string) => void;
}

const POPULAR_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX", 
  "AMD", "INTC", "CRM", "ORCL", "IBM", "ADBE", "UBER", "LYFT"
];

export const TickerSearch = ({ selectedTicker, onTickerChange }: TickerSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredTickers = POPULAR_TICKERS.filter(ticker =>
    ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTickerSelect = (ticker: string) => {
    onTickerChange(ticker);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search tickers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {isOpen && (searchQuery || true) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {(searchQuery ? filteredTickers : POPULAR_TICKERS.slice(0, 8)).map((ticker) => (
                  <div
                    key={ticker}
                    onClick={() => handleTickerSelect(ticker)}
                    className="px-4 py-3 hover:bg-slate-600 cursor-pointer text-white flex items-center justify-between"
                  >
                    <span className="font-medium">{ticker}</span>
                    {ticker === selectedTicker && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300">Current Selection</h3>
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">{selectedTicker}</span>
                <div className="text-right">
                  <div className="text-sm text-slate-300">Live Sentiment</div>
                  <div className="text-lg font-semibold text-green-400">+12.3%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300">Quick Select</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TICKERS.slice(0, 6).map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => handleTickerSelect(ticker)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    ticker === selectedTicker
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {ticker}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
