import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingDown, Clock } from "lucide-react";
import { Actuator, Sensor } from "@/lib/kvApi";
import { useEffect, useState } from "react";

interface EnergyMetricsProps {
  actuators: Actuator[];
  sensors: Sensor[];
}

export function EnergyMetrics({ actuators, sensors }: EnergyMetricsProps) {
  const [energySaved, setEnergySaved] = useState(0);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    // Calculate total power consumption based on actuator states and sensor data
    const enabledActuators = actuators.filter(a => {
      if (a.dataType === "BOOLEAN") {
        return a.state === true; // Boolean actuators that are ON
      } else {
        return typeof a.state === 'number' && a.state > 0; // Numeric actuators with value > 0
      }
    }).length;
    
    // Look for power sensors to get actual consumption data
    const powerSensors = sensors.filter(s => 
      s.unit === "W" || 
      s.name.toLowerCase().includes("power") || 
      s.name.toLowerCase().includes("current")
    );
    
    let totalPowerConsumption = 0;
    powerSensors.forEach(sensor => {
      if (sensor.lastSample?.value) {
        // If it's a current sensor, estimate power (assuming ~120V)
        const power = sensor.unit === "A" || sensor.name.toLowerCase().includes("current")
          ? sensor.lastSample.value * 120
          : sensor.lastSample.value;
        totalPowerConsumption += Math.abs(power); // Use absolute value
      }
    });
    
    // Use actual power consumption if available, otherwise estimate based on enabled actuators
    const powerValue = powerSensors.length > 0 && totalPowerConsumption > 0
      ? Math.round(totalPowerConsumption)
      : enabledActuators * 100; // Estimate: 100W per enabled actuator
    
    setEnergySaved(powerValue);

    // Update uptime counter
    const interval = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [actuators, sensors]);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-border bg-card backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Power Consumption</CardTitle>
          <TrendingDown className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{energySaved}W</div>
          <p className="text-xs text-muted-foreground">Current total power usage</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Sensors</CardTitle>
          <Zap className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{sensors.length}</div>
          <p className="text-xs text-muted-foreground">Total monitored sensors</p>
        </CardContent>
      </Card>

      <Card className="border-border bg-card backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
          <Clock className="h-4 w-4 text-info" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatUptime(uptime)}</div>
          <p className="text-xs text-muted-foreground">Hours:Minutes:Seconds</p>
        </CardContent>
      </Card>
    </div>
  );
}
