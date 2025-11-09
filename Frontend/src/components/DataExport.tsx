import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Sensor, Actuator, Sample } from "@/lib/kvApi";
import { ActivityEvent } from "@/components/ActivityLog";
import { useToast } from "@/hooks/use-toast";

interface DataExportProps {
  sensors: Sensor[];
  actuators: Actuator[];
  samples: Sample[];
  activityEvents: ActivityEvent[];
}

export function DataExport({ sensors, actuators, samples, activityEvents }: DataExportProps) {
  const { toast } = useToast();

  const exportToJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      sensors,
      actuators,
      samples,
      activityLog: activityEvents,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `energy-sentinel-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "JSON Export Complete",
      description: "Data exported successfully",
    });
  };

  const exportToCSV = () => {
    // Create CSV for sensors
    const sensorHeaders = ["ID", "Name", "Unit", "Data Type", "Last Value", "Last Updated"];
    const sensorRows = sensors.map(s => [
      s.id,
      s.name,
      s.unit,
      s.dataType,
      s.lastSample?.value?.toString() || "N/A",
      s.lastSample?.timestamp ? new Date(s.lastSample.timestamp * 1000).toISOString() : "N/A"
    ]);

    // Create CSV for actuators
    const actuatorHeaders = ["ID", "Name", "Unit", "Data Type", "State"];
    const actuatorRows = actuators.map(a => [
      a.id,
      a.name,
      a.unit,
      a.dataType,
      a.state.toString()
    ]);

    // Create CSV for activity log
    const activityHeaders = ["Timestamp", "Type", "Severity", "Message"];
    const activityRows = activityEvents.map(e => [
      e.timestamp.toISOString(),
      e.type,
      e.severity,
      e.message
    ]);

    const createCSV = (headers: string[], rows: string[][]) => {
      return [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");
    };

    const combinedCSV = [
      "SENSORS",
      createCSV(sensorHeaders, sensorRows),
      "",
      "ACTUATORS",
      createCSV(actuatorHeaders, actuatorRows),
      "",
      "ACTIVITY LOG",
      createCSV(activityHeaders, activityRows)
    ].join("\n");

    const blob = new Blob([combinedCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `energy-sentinel-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Export Complete",
      description: "Data exported successfully",
    });
  };

  return (
    <Card className="border-border bg-card backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          onClick={exportToCSV}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export CSV
        </Button>
        <Button
          onClick={exportToJSON}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileJson className="h-4 w-4" />
          Export JSON
        </Button>
      </CardContent>
    </Card>
  );
}
