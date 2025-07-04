import { useState } from "react";
import { TickerSearch } from "@/components/dashboard/TickerSearch";
import { StockDetailsPanel } from "@/components/dashboard/StockDetailsPanel";
import { SentimentChart } from "@/components/dashboard/SentimentChart";
import { StockPriceChart } from "@/components/dashboard/StockPriceChart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NewsPanel } from "@/components/dashboard/NewsPanel";
import { useQuery } from "@tanstack/react-query";
// import { StockPriceChart } from "@/components/dashboard/StockPriceChart"; // To be implemented

function RedditPanel({ ticker }: { ticker: string }) {
  const { data, isLoading, isError } = useQuery<any, Error>({
    queryKey: ["sentiment", ticker, "reddit"],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/sentiment/${ticker}?source=reddit`);
      if (!res.ok) throw new Error("Failed to fetch reddit data");
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
    return <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-white flex items-center justify-center h-64"><span className="text-slate-400 animate-pulse">Loading Reddit posts...</span></div>;
  }
  if (isError || !data?.top_posts?.length) {
    return <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-white flex items-center justify-center h-64"><span className="text-red-400">No Reddit data available for this ticker.</span></div>;
  }
  return (
    <div className="bg-slate-800/50 border-slate-700/50 border rounded-lg mt-6">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <span className="text-white text-lg font-semibold">Latest Reddit Posts - {ticker}</span>
      </div>
      <div className="px-6 pb-6 space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {data.top_posts.map((post: any, idx: number) => (
          <div key={idx} className={`rounded-lg p-4 border transition-all hover:shadow-lg ${getSentimentBg(post.sentiment)}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1 leading-tight">
                  {post.text.split("\n")[0]}
                </h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-slate-400">{new Date(post.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <span className={`text-sm font-medium ${getSentimentColor(post.sentiment)}`}>{(post.sentiment * 100).toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">{post.text.split("\n").slice(1).join(" ")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopMoversPanel({ type, data, isLoading, isError }: { type: 'gainers' | 'losers', data: any[], isLoading: boolean, isError: boolean }) {
  if (isLoading) {
    return <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-center h-32 text-slate-400 animate-pulse">Loading {type}...</div>;
  }
  if (isError) {
    return <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-center h-32 text-red-400">Failed to load {type}.</div>;
  }
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="text-lg font-semibold text-white mb-2">Top {type === 'gainers' ? 'Gainers' : 'Losers'}</div>
      <ul className="space-y-2">
        {data.map((item) => (
          <li key={item.symbol} className="flex items-center justify-between">
            <span className="font-medium text-slate-200">{item.symbol}</span>
            <span className="text-xs text-slate-400 ml-2">{item.name}</span>
            <span className={type === 'gainers' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
              {item.change_percent > 0 ? '+' : ''}{item.change_percent.toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MostActivePanel() {
  const { data, isLoading, isError } = useQuery<any, Error>({
    queryKey: ["most-active"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/stocks/most-active");
      if (!res.ok) throw new Error("Failed to fetch most active stocks");
      return res.json();
    },
    refetchInterval: 60000,
  });
  if (isLoading) {
    return <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-center h-32 text-slate-400 animate-pulse">Loading most active stocks...</div>;
  }
  if (isError) {
    return <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-center h-32 text-red-400">Failed to load most active stocks.</div>;
  }
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-2">
      <div className="text-lg font-semibold text-white mb-2">Most Active Stocks (By Volume)</div>
      <ul className="space-y-2">
        {data?.most_active?.map((item: any) => (
          <li key={item.symbol} className="flex items-center justify-between">
            <span className="font-medium text-slate-200">{item.symbol}</span>
            <span className="text-xs text-slate-400 ml-2">{item.name}</span>
            <span className="text-xs text-blue-400 font-bold">{item.volume.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopMoversFetcher() {
  const { data, isLoading, isError } = useQuery<any, Error>({
    queryKey: ["top-movers"],
    queryFn: async () => {
      const res = await fetch("http://localhost:8000/stocks/top-movers");
      if (!res.ok) throw new Error("Failed to fetch top movers");
      return res.json();
    },
    refetchInterval: 60000,
  });
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1 min-w-0 flex flex-col">
        <TopMoversPanel type="gainers" data={data?.gainers || []} isLoading={isLoading} isError={isError} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <TopMoversPanel type="losers" data={data?.losers || []} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}

const Index = () => {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [tab, setTab] = useState("stocks");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="relative z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
            <div className="flex flex-row items-center w-full">
              <div className="flex-shrink-0 flex items-center" style={{ minWidth: 0 }}>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Sentinance
                </h1>
              </div>
              <div className="flex-1 flex justify-center items-center min-w-0 px-4">
                <div className="w-full max-w-xs"><TickerSearch selectedTicker={selectedTicker} onTickerChange={setSelectedTicker} /></div>
              </div>
              <div className="flex-shrink-0 flex items-center space-x-4">
                <Tabs defaultValue={tab} onValueChange={setTab} className="w-auto">
                  <TabsList className="bg-transparent p-0 space-x-2 shadow-none">
                    <TabsTrigger value="stocks" className="bg-transparent px-3 py-2 text-base font-medium text-slate-300 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none shadow-none focus:outline-none">
                      Stocks
                    </TabsTrigger>
                    <TabsTrigger value="sentiment" className="bg-transparent px-3 py-2 text-base font-medium text-slate-300 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none shadow-none focus:outline-none">
                      Sentiment Analysis
                    </TabsTrigger>
                    <TabsTrigger value="about" className="bg-transparent px-3 py-2 text-base font-medium text-slate-300 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-400 rounded-none shadow-none focus:outline-none">
                      About
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse ml-4"></div>
                <span className="text-sm text-slate-300">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsContent value="stocks">
            <div className="flex flex-col gap-6">
              <div>
                <StockDetailsPanel ticker={selectedTicker} />
              </div>
              <MostActivePanel />
              <TopMoversFetcher />
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 min-w-0 flex flex-col">
                  <StockPriceChart ticker={selectedTicker} />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="sentiment">
            <div className="flex flex-col md:flex-row gap-6 justify-start items-stretch w-full">
              <div className="flex-[3_1_0%] min-w-0 flex flex-col min-h-[28rem]">
                <SentimentChart ticker={selectedTicker} />
              </div>
              <div className="flex-[2_1_0%] min-w-0 flex flex-col min-h-[28rem]">
                <NewsPanel ticker={selectedTicker} />
              </div>
            </div>
            <div className="w-full">
              <RedditPanel ticker={selectedTicker} />
            </div>
          </TabsContent>
          <TabsContent value="about">
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">About Sentinance</h2>
                <p className="text-slate-300">This dashboard provides real-time stock data and sentiment analysis from Reddit and news sources. More info coming soon.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
