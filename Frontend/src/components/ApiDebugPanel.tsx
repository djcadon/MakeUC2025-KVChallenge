import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ApiLog {
  timestamp: Date;
  type: "request" | "response" | "error";
  method: string;
  url: string;
  status?: number;
  duration?: number;
  data?: any;
  error?: string;
}

interface ApiDebugPanelProps {
  logs: ApiLog[];
  onRefresh: () => void;
}

export function ApiDebugPanel({ logs, onRefresh }: ApiDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status?: number) => {
    if (!status) return "bg-gray-500";
    if (status >= 200 && status < 300) return "bg-green-600";
    if (status >= 400 && status < 500) return "bg-yellow-600";
    return "bg-red-600";
  };

  const recentLogs = logs.slice(-10).reverse();

  return (
    <Card className="border-border bg-card/80 backdrop-blur-sm">
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between py-3 px-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          API Debug Log
          <Badge variant="outline" className="text-xs">
            {logs.length} requests
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 px-4 pb-4">
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No API requests yet</p>
              ) : (
                recentLogs.map((log, idx) => (
                  <div 
                    key={idx}
                    className="border border-border rounded-lg p-3 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(log.status)} text-white`}>
                          {log.status || "PENDING"}
                        </Badge>
                        <span className="font-semibold">{log.method}</span>
                        <span className="text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {log.duration && (
                        <span className="text-muted-foreground">{log.duration}ms</span>
                      )}
                    </div>
                    
                    <div className="text-muted-foreground break-all">
                      {log.url}
                    </div>
                    
                    {log.error && (
                      <div className="text-red-600 mt-1">
                        Error: {log.error}
                      </div>
                    )}
                    
                    {log.data && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-primary">
                          Response Data ({Array.isArray(log.data?.data) ? log.data.data.length : 0} items)
                        </summary>
                        <pre className="mt-1 text-xs overflow-auto max-h-32 bg-muted p-2 rounded">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
