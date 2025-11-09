import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Code, BarChart3 } from "lucide-react";
import { Sensor, Actuator } from "@/lib/kvApi";

interface DataDetailsViewProps {
  data: Sensor | Actuator;
  type: "sensor" | "actuator";
}

export function DataDetailsView({ data, type }: DataDetailsViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderSensorDetails = (sensor: Sensor) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-primary">Sensor Information</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono text-foreground">{sensor.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-mono text-foreground">{sensor.dataType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit:</span>
              <span className="font-mono text-foreground">{sensor.unit}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-primary">Current Reading</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Value:</span>
              <span className="font-mono text-foreground font-bold">
                {sensor.lastSample?.value?.toFixed(4) || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timestamp:</span>
              <span className="font-mono text-xs text-foreground">
                {sensor.lastSample?.timestamp 
                  ? new Date(sensor.lastSample.timestamp * 1000).toLocaleString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
          <Code className="h-4 w-4" />
          Raw JSON Data
        </h4>
        <pre className="bg-secondary/50 p-3 rounded-lg overflow-x-auto text-xs">
          <code className="text-foreground">{JSON.stringify(sensor, null, 2)}</code>
        </pre>
      </div>
    </div>
  );

  const renderActuatorDetails = (actuator: Actuator) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-primary">Actuator Information</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono text-foreground">{actuator.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-mono text-foreground">{actuator.dataType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unit:</span>
              <span className="font-mono text-foreground">{actuator.unit}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-primary">Current State</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-mono font-bold ${
                actuator.state ? "text-accent" : "text-success"
              }`}>
                {actuator.state ? "ON" : "OFF"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Value:</span>
              <span className="font-mono text-foreground">
                {actuator.state !== undefined && actuator.state !== null 
                  ? String(actuator.state) 
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
          <Code className="h-4 w-4" />
          Raw JSON Data
        </h4>
        <pre className="bg-secondary/50 p-3 rounded-lg overflow-x-auto text-xs">
          <code className="text-foreground">{JSON.stringify(actuator, null, 2)}</code>
        </pre>
      </div>
    </div>
  );

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-secondary/50"
      >
        <span className="flex items-center gap-2 text-xs">
          <BarChart3 className="h-3 w-3" />
          View Detailed Data & JSON
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      
      {isExpanded && (
        <Card className="mt-2 border-primary/20">
          <CardContent className="p-4">
            {type === "sensor" 
              ? renderSensorDetails(data as Sensor)
              : renderActuatorDetails(data as Actuator)
            }
          </CardContent>
        </Card>
      )}
    </div>
  );
}
