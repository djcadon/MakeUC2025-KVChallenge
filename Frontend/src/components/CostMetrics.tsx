import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown } from "lucide-react";
import { Sensor } from "@/lib/kvApi";

interface CostMetricsProps {
  sensors: Sensor[];
  energySaved: number;
}

export function CostMetrics({ sensors, energySaved }: CostMetricsProps) {
  // Cincinnati electricity rate (average $0.126 per kWh)
  const ELECTRICITY_RATE = 0.126;
  
  // Cincinnati average monthly consumption (around 1000 kWh for typical household)
  const CINCINNATI_AVG_KWH = 1000;
  const CINCINNATI_AVG_COST = CINCINNATI_AVG_KWH * ELECTRICITY_RATE;

  // Calculate total power consumption from power sensors
  const totalPowerConsumption = sensors
    .filter(s => s.unit === "W" && s.lastSample?.value)
    .reduce((sum, sensor) => sum + (sensor.lastSample?.value || 0), 0);

  // Convert to monthly kWh (W * 24 hours * 30 days / 1000)
  const monthlyKWh = (totalPowerConsumption * 24 * 30) / 1000;
  const monthlyCost = monthlyKWh * ELECTRICITY_RATE;

  // Calculate savings from energy optimization
  const savedKWh = (energySaved * 24 * 30) / 1000;
  const savedCost = savedKWh * ELECTRICITY_RATE;

  // Cost difference compared to Cincinnati average
  const costVsAverage = monthlyCost - CINCINNATI_AVG_COST;
  const percentageDiff = ((costVsAverage / CINCINNATI_AVG_COST) * 100);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border bg-card backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estimated Monthly Cost</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            ${monthlyCost.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {monthlyKWh.toFixed(0)} kWh @ ${ELECTRICITY_RATE}/kWh
          </p>
          <div className={`text-sm mt-2 font-medium ${costVsAverage > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {costVsAverage > 0 ? '+' : ''}${Math.abs(costVsAverage).toFixed(2)} vs Cincinnati avg
            <span className="text-xs ml-1">
              ({percentageDiff > 0 ? '+' : ''}{percentageDiff.toFixed(1)}%)
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
          <TrendingDown className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${savedCost.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {savedKWh.toFixed(0)} kWh saved through optimization
          </p>
          <div className="text-sm mt-2 font-medium text-green-600">
            ${(savedCost * 12).toFixed(2)}/year potential savings
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
