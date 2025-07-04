import { useState } from "react";
import { TickerSearch } from "@/components/dashboard/TickerSearch";
import { StockDetailsPanel } from "@/components/dashboard/StockDetailsPanel";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { StockPriceChart } from "@/components/dashboard/StockPriceChart";
// import { StockPriceChart } from "@/components/dashboard/StockPriceChart"; // To be implemented

const Index = () => {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [timeRange, setTimeRange] = useState("24h");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Sentinance
              </h1>
              <span className="text-sm text-slate-400 bg-slate-800 px-2 py-1 rounded">
                AI-Powered Sentiment Tracker
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-slate-800 border border-slate-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">Live</span>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <TickerSearch selectedTicker={selectedTicker} onTickerChange={setSelectedTicker} />
        </aside>
        {/* Main Dashboard */}
        <section className="md:col-span-3 space-y-6">
          <StockDetailsPanel ticker={selectedTicker} />
          <StockPriceChart ticker={selectedTicker} />
          <SentimentChart ticker={selectedTicker} timeRange={timeRange} />
        </section>
      </main>
    </div>
  );
};

export default Index;
