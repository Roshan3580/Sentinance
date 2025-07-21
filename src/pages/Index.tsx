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

function TickerHeaderDetails({ selectedTicker }: { selectedTicker: string }) {
  const { data, isLoading } = useQuery<any, Error>({
    queryKey: ["stock", selectedTicker],
    queryFn: async () => {
      const res = await fetch(`http://localhost:8000/stocks/${selectedTicker}`);
      if (!res.ok) throw new Error("Failed to fetch stock details");
      return res.json();
    },
    enabled: !!selectedTicker,
    staleTime: 60 * 1000,
  });
  return (
    <div className="bg-slate-700 rounded p-2 flex items-center gap-2 min-w-[120px]">
      <span className="text-base font-bold text-white">{selectedTicker}</span>
      {isLoading ? (
        <span className="text-xs text-slate-400 ml-2 animate-pulse">Loading...</span>
      ) : data ? (
        <>
          <span className="text-xs text-slate-300 ml-2">{data.name}</span>
          <span className="text-green-400 font-semibold ml-2">${data.price?.toFixed(2)}</span>
        </>
      ) : null}
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
            <div className="flex flex-row items-center w-full gap-4">
              <div className="flex-shrink-0 flex items-center" style={{ minWidth: 0 }}>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Sentinance
                </h1>
              </div>
              <div className="flex-1 flex items-center min-w-0">
                <div className="w-full max-w-lg"><TickerSearch selectedTicker={selectedTicker} onTickerChange={setSelectedTicker} hideDetails /></div>
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
              </div>
              {/* Ticker details moved here, right of tabs */}
              <div className="hidden md:flex flex-col items-start ml-6 min-w-[200px]">
                <TickerHeaderDetails selectedTicker={selectedTicker} />
              </div>
            </div>
            {/* On mobile, show ticker details below */}
            <div className="flex md:hidden mt-2"><TickerHeaderDetails selectedTicker={selectedTicker} /></div>
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
                <p className="text-slate-300">Sentinance is a smart, all-in-one stock market dashboard designed to give traders, investors, and enthusiasts a deeper edge. By combining real-time stock data with AI-powered sentiment analysis from both financial news and Reddit, Sentinance helps you go beyond just numbers — and understand the why behind market moves.
Whether you're tracking your favorite tickers or staying ahead of the latest trends, Sentinance brings together price action, volume insights, top gainers/losers, and emotional market signals — all in one clean, intuitive interface. Built with a modern full-stack architecture, Sentinance is fast, reliable, and extensible — made for anyone who wants to trade smarter.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

