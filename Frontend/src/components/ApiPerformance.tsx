import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Zap, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface ApiPerformanceProps {
  lastRequestTime?: number;
  successRate: number;
  totalRequests: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ApiPerformance({ lastRequestTime, successRate, totalRequests, onRefresh, isRefreshing }: ApiPerformanceProps) {
  const [avgResponseTime, setAvgResponseTime] = useState(0);

  useEffect(() => {
    if (lastRequestTime) {
      // Simple moving average
      setAvgResponseTime(prev => prev === 0 ? lastRequestTime : (prev * 0.7 + lastRequestTime * 0.3));
    }
  }, [lastRequestTime]);

  const getStatusColor = () => {
    if (successRate >= 90) return "text-green-600";
    if (successRate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getLatencyColor = () => {
    if (avgResponseTime < 500) return "text-green-600";
    if (avgResponseTime < 2000) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardContent className="flex items-center justify-between gap-6 py-3 px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">API Status:</span>
            <span className={`text-sm font-semibold ${getStatusColor()}`}>
              {successRate.toFixed(0)}% Success
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Latency:</span>
            <span className={`text-sm font-semibold ${getLatencyColor()}`}>
              {avgResponseTime > 0 ? `${avgResponseTime.toFixed(0)}ms` : "—"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Requests:</span>
            <span className="text-sm font-semibold text-foreground">
              {totalRequests}
            </span>
          </div>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
