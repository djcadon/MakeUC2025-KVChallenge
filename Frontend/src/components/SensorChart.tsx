import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sample, Sensor } from "@/lib/kvApi";
import { Loader2 } from "lucide-react";

interface SensorChartProps {
  sensor: Sensor | null;
  samples: Sample[];
  loading: boolean;
}

export function SensorChart({ sensor, samples, loading }: SensorChartProps) {
  const chartData = samples.map((sample) => ({
    time: new Date(sample.timestamp * 1000).toLocaleTimeString(),
    value: sample.value,
  }));

  return (
    <div className="border-t border-border pt-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium">Historical Data</h3>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        {!loading && samples.length > 0 && (
          <span className="text-xs text-muted-foreground">(showing {samples.length} data points)</span>
        )}
      </div>
      
      {samples.length === 0 && !loading && (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          No historical data loaded yet. Click a sensor to load its data.
        </div>
      )}
      
      {samples.length > 0 && (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                color: 'hsl(var(--popover-foreground))',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
