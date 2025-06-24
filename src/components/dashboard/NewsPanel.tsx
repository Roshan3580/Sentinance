
import { ExternalLink, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NewsPanelProps {
  ticker: string;
}

export const NewsPanel = ({ ticker }: NewsPanelProps) => {
  const mockNews = [
    {
      id: 1,
      title: `${ticker} Reports Strong Q3 Earnings, Beats Analyst Expectations`,
      source: "Reuters",
      time: "2 hours ago",
      sentiment: 0.85,
      summary: "Revenue increased 18% year-over-year with strong performance across all segments.",
      url: "#"
    },
    {
      id: 2,
      title: `Analyst Upgrades ${ticker} Price Target to $200 Following Innovation Announcement`,
      source: "Bloomberg",
      time: "4 hours ago",
      sentiment: 0.72,
      summary: "New product line expected to drive significant growth in upcoming quarters.",
      url: "#"
    },
    {
      id: 3,
      title: `${ticker} Faces Regulatory Scrutiny Over Data Privacy Practices`,
      source: "Wall Street Journal",
      time: "6 hours ago",
      sentiment: -0.45,
      summary: "Government agencies launch investigation into company's handling of user data.",
      url: "#"
    },
    {
      id: 4,
      title: `${ticker} Announces Strategic Partnership with Major Cloud Provider`,
      source: "TechCrunch",
      time: "8 hours ago",
      sentiment: 0.63,
      summary: "Multi-year deal expected to enhance enterprise capabilities and market reach.",
      url: "#"
    },
    {
      id: 5,
      title: `Supply Chain Disruptions May Impact ${ticker} Q4 Guidance`,
      source: "MarketWatch",
      time: "12 hours ago",
      sentiment: -0.28,
      summary: "Management warns of potential headwinds from ongoing global supply issues.",
      url: "#"
    }
  ];

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

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <span>Latest News - {ticker}</span>
          <TrendingUp className="h-5 w-5 text-cyan-400" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {mockNews.map((article) => (
            <div
              key={article.id}
              className={`rounded-lg p-4 border transition-all hover:shadow-lg ${getSentimentBg(article.sentiment)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1 leading-tight">
                    {article.title}
                  </h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs text-slate-400">{article.source}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span className="text-xs text-slate-400">{article.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <span className={`text-sm font-medium ${getSentimentColor(article.sentiment)}`}>
                    {(article.sentiment * 100).toFixed(0)}%
                  </span>
                  <ExternalLink className="h-4 w-4 text-slate-400 hover:text-slate-300 cursor-pointer" />
                </div>
              </div>
              
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                {article.summary}
              </p>
              
              <div className="flex items-center justify-between">
                <div className={`text-xs px-2 py-1 rounded ${
                  article.sentiment > 0 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {article.sentiment > 0 ? 'Positive' : 'Negative'} Impact
                </div>
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Read full article →
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-600/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              Powered by AI sentiment analysis
            </span>
            <button className="text-blue-400 hover:text-blue-300 transition-colors">
              View all news →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
