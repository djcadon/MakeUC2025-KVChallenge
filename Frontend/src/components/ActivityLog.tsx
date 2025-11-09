import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Activity, Power, TrendingUp, TrendingDown } from "lucide-react";

export interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: "sensor" | "actuator" | "system";
  message: string;
  severity: "info" | "warning" | "success";
}

interface ActivityLogProps {
  events: ActivityEvent[];
}

export function ActivityLog({ events }: ActivityLogProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "sensor":
        return <TrendingUp className="h-4 w-4" />;
      case "actuator":
        return <Power className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      default:
        return "text-info";
    }
  };

  return (
    <Card className="border-border bg-card backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Activity History</CardTitle>
        </div>
        <div className="text-xs text-muted-foreground">
          Live updates every 10s
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className={`mt-0.5 ${getSeverityColor(event.severity)}`}>
                    {getIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">
                      {event.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
