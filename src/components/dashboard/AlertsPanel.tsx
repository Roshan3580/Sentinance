
import { Bell, Settings, Plus, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AlertsPanel = () => {
  const mockAlerts = [
    {
      id: 1,
      ticker: "TSLA",
      type: "sentiment_spike",
      message: "Sentiment increased by 25% in the last hour",
      severity: "high",
      time: "2 minutes ago",
      triggered: true
    },
    {
      id: 2,
      ticker: "AAPL",
      type: "volume_alert",
      message: "Reddit mentions exceeded 1000 posts threshold",
      severity: "medium",
      time: "15 minutes ago",
      triggered: true
    },
    {
      id: 3,
      ticker: "NVDA",
      type: "news_alert",
      message: "Negative news sentiment detected - regulatory concerns",
      severity: "high",
      time: "32 minutes ago",
      triggered: true
    }
  ];

  const activeWatchlist = [
    { ticker: "AAPL", condition: "Sentiment > +20%", status: "active" },
    { ticker: "TSLA", condition: "Volume > 500 posts/hr", status: "triggered" },
    { ticker: "NVDA", condition: "News sentiment < -15%", status: "active" },
    { ticker: "META", condition: "Twitter mentions > 1000", status: "paused" }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-400 bg-red-500/20 border-red-500/30";
      case "medium": return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "low": return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      default: return "text-gray-400 bg-gray-500/20 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "triggered": return "text-red-400";
      case "active": return "text-green-400";
      case "paused": return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "sentiment_spike": return <TrendingUp className="h-4 w-4" />;
      case "volume_alert": return <Bell className="h-4 w-4" />;
      case "news_alert": return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Smart Alerts</span>
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {mockAlerts.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <Plus className="h-4 w-4 text-white" />
            </button>
            <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
              <Settings className="h-4 w-4 text-slate-300" />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Alerts</h3>
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg p-4 border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getAlertIcon(alert.type)}
                    <span className="font-medium text-white">{alert.ticker}</span>
                  </div>
                  <span className="text-xs text-slate-400">{alert.time}</span>
                </div>
                <p className="text-sm text-slate-200 mb-2">{alert.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 capitalize">
                    {alert.type.replace('_', ' ')}
                  </span>
                  <span className={`text-xs font-medium capitalize ${alert.severity === 'high' ? 'text-red-400' : alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'}`}>
                    {alert.severity} Priority
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Watchlist */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Active Watchlist</h3>
            {activeWatchlist.map((item, index) => (
              <div
                key={index}
                className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{item.ticker}</span>
                  <span className={`text-xs font-medium capitalize ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{item.condition}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'triggered' ? 'bg-red-400' : 
                      item.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                    }`}></div>
                    <span className="text-xs text-slate-400">
                      {item.status === 'triggered' ? 'Alert triggered' : 
                       item.status === 'active' ? 'Monitoring' : 'Paused'}
                    </span>
                  </div>
                  <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Configure
                  </button>
                </div>
              </div>
            ))}
            
            <button className="w-full p-3 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:text-slate-300 hover:border-slate-500 transition-colors text-sm">
              + Add new alert condition
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
