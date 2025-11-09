import { Power, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Actuator } from "@/lib/kvApi";
import { useState, useEffect } from "react";
import { DataDetailsView } from "@/components/DataDetailsView";
import { formatSensorName } from "@/lib/utils";

interface ActuatorControlProps {
  actuator: Actuator;
  onToggle: (actuator: Actuator) => Promise<void>;
}

export function ActuatorControl({ actuator, onToggle }: ActuatorControlProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localValue, setLocalValue] = useState<number>(
    typeof actuator.state === 'number' ? actuator.state : 0
  );

  // Sync localValue with actuator.state when it changes
  useEffect(() => {
    if (typeof actuator.state === 'number') {
      setLocalValue(actuator.state);
    }
  }, [actuator.state]);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggle(actuator);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSliderChange = async (values: number[]) => {
    const newValue = values[0];
    setLocalValue(newValue);
  };

  const handleSliderCommit = async (values: number[]) => {
    const newValue = values[0];
    setIsUpdating(true);
    try {
      // Create a modified actuator with the new value
      await onToggle({ ...actuator, state: newValue });
      setLocalValue(newValue);
    } finally {
      setIsUpdating(false);
    }
  };

  const isOn = Boolean(actuator.state);
  const displayValue = actuator.dataType === "FLOAT" || actuator.dataType === "NUMBER" 
    ? localValue.toFixed(1)
    : (isOn ? "ON" : "OFF");

  return (
    <div>
      <Card className="border-border bg-card backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{formatSensorName(actuator.name)}</CardTitle>
          <Power className={`h-4 w-4 ${
            actuator.dataType === "BOOLEAN" 
              ? (isOn ? "text-accent" : "text-muted-foreground")
              : "text-primary"
          }`} />
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {displayValue}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{actuator.dataType}</p>
          </div>
          
          {actuator.dataType === "BOOLEAN" && (
            <div className="flex items-center gap-2">
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              <Switch
                checked={isOn}
                onCheckedChange={handleToggle}
                disabled={isUpdating}
                className="data-[state=checked]:bg-accent"
              />
            </div>
          )}

          {(actuator.dataType === "FLOAT" || actuator.dataType === "NUMBER") && (
            <div className="flex flex-col gap-2 w-48">
              <div className="flex items-center gap-2">
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>
              <Slider
                value={[localValue]}
                onValueChange={handleSliderChange}
                onValueCommit={handleSliderCommit}
                min={0}
                max={100}
                step={0.1}
                disabled={isUpdating}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <DataDetailsView data={actuator} type="actuator" />
    </div>
  );
}
