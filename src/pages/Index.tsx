import { useState, useEffect } from "react";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { SentimentHeatmap } from "@/components/dashboard/SentimentHeatmap";
import { TickerSearch } from "@/components/dashboard/TickerSearch";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { NewsPanel } from "@/components/dashboard/NewsPanel";
import { SentimentOverview } from "@/components/dashboard/SentimentOverview";
import { TrendingMentions } from "@/components/dashboard/TrendingMentions";

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
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Top Row - Search and Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <TickerSearch 
              selectedTicker={selectedTicker} 
              onTickerChange={setSelectedTicker} 
            />
          </div>
          <div className="lg:col-span-2">
            <SentimentOverview ticker={selectedTicker} />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2">
            <SentimentChart ticker={selectedTicker} timeRange={timeRange} />
          </div>
          <div className="xl:col-span-1">
            <TrendingMentions ticker={selectedTicker} />
          </div>
        </div>

        {/* Heatmap and Analysis Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <SentimentHeatmap timeRange={timeRange} />
          <NewsPanel ticker={selectedTicker} />
        </div>

        {/* Bottom Row - Alerts */}
        <div className="grid grid-cols-1">
          <AlertsPanel />
        </div>
      </main>
    </div>
  );
};

export default Index;
