import { Activity, ChevronDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sensor, Sample } from "@/lib/kvApi";
import { cn, formatSensorName } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SensorChart } from "@/components/SensorChart";
import { DataDetailsView } from "@/components/DataDetailsView";

interface SensorCardProps {
  sensor: Sensor;
  onClick: () => void;
  isSelected: boolean;
  samples: Sample[];
  loading: boolean;
  isLoadingData?: boolean; // New prop for when sensor data is being fetched
}

export function SensorCard({ sensor, onClick, isSelected, samples, loading, isLoadingData = false }: SensorCardProps) {
  const hasData = sensor.lastSample !== undefined;
  
  return (
    <Collapsible open={isSelected} onOpenChange={onClick}>
      <Card
        className={cn(
          "transition-all duration-300",
          "border-border bg-card backdrop-blur-sm",
          isSelected && "ring-2 ring-primary shadow-glow"
        )}
      >
        <CollapsibleTrigger className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{formatSensorName(sensor.name)}</CardTitle>
            <div className="flex items-center gap-2">
              {isLoadingData && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              <Activity className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isSelected && "rotate-180"
              )} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {hasData ? sensor.lastSample.value.toFixed(2) : (
                <span className="text-muted-foreground">Loading...</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{sensor.unit}</p>
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-6 pb-4">
            <SensorChart sensor={sensor} samples={samples} loading={loading} />
            <DataDetailsView data={sensor} type="sensor" />
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
