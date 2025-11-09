import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sensor, Actuator } from "@/lib/kvApi";
import { useToast } from "@/hooks/use-toast";

interface AISummaryProps {
  sensors: Sensor[];
  actuators: Actuator[];
  energySaved: number;
}

export function AISummary({ sensors, actuators, energySaved }: AISummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    if (sensors.length === 0 && actuators.length === 0) {
      return;
    }

    setLoading(true);
    setDialogOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: {
          sensors,
          actuators,
          energySaved,
        },
      });

      if (error) {
        console.error("Summary error:", error);
        setSummary("AI summary is temporarily unavailable. Please ensure your OpenAI API key is configured in the secrets.");
        toast({
          title: "Summary Generation Unavailable",
          description: "Check that OPENAI_API_KEY is configured in secrets",
          variant: "destructive",
        });
        return;
      }

      setSummary(data.summary);
      setLastGenerated(new Date());
      
      toast({
        title: "AI Summary Generated",
        description: "System analysis complete",
      });
    } catch (error) {
      console.error("Failed to generate summary:", error);
      setSummary("AI summary is temporarily unavailable. Please ensure your OpenAI API key is configured in the secrets.");
      toast({
        title: "Summary Generation Failed",
        description: "Check that OPENAI_API_KEY is configured in secrets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't auto-generate on mount anymore

  // Don't show anything if no data
  if (sensors.length === 0 && actuators.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-lg">AI Executive Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={generateSummary} disabled={loading} variant="outline" className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? "Generating..." : "Generate AI Summary"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Executive Summary
            </DialogTitle>
            <DialogDescription>
              Easy-to-understand system overview powered by AI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current System Data */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Current System Status</h3>
              
              {/* Sensors */}
              {sensors.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-medium">Sensors</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {sensors.map((sensor) => (
                      <div key={sensor.id} className="text-sm">
                        <span className="text-muted-foreground">{sensor.name}:</span>{" "}
                        <span className="font-medium">
                          {sensor.lastSample?.value?.toFixed(2) || "N/A"} {sensor.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actuators */}
              {actuators.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-medium">Actuators</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {actuators.map((actuator) => (
                      <div key={actuator.id} className="text-sm">
                        <span className="text-muted-foreground">{actuator.name}:</span>{" "}
                        <span className={`font-medium ${actuator.state ? "text-green-600" : "text-muted-foreground"}`}>
                          {actuator.state ? "ON" : "OFF"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Energy Savings */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Energy Savings:</span>{" "}
                  <span className="font-bold text-green-600">{energySaved}W</span>
                </div>
              </div>
            </div>
            
            {/* AI Analysis */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing system data with GPT-5...
                  </p>
                </div>
              </div>
            )}
            
            {summary && (
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">AI Analysis</h3>
                <p className="text-foreground leading-relaxed bg-primary/5 p-4 rounded-lg">
                  {summary}
                </p>
                {lastGenerated && (
                  <p className="text-xs text-muted-foreground">
                    Generated {lastGenerated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
            
            <Button 
              onClick={generateSummary} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {summary ? "Generate New Summary" : "Generate AI Summary"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
