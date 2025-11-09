import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiStatusBannerProps {
  isConnected: boolean;
  error?: string;
}

export function ApiStatusBanner({ isConnected, error }: ApiStatusBannerProps) {
  if (isConnected) {
    return (
      <Alert className="border-success bg-success/10">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertTitle className="text-success">Connected to KV IoT API</AlertTitle>
        <AlertDescription className="text-success/80">
          Successfully connected to MakeUC 2025 IoT system
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>API Connection Issue</AlertTitle>
      <AlertDescription>
        {error || "Unable to connect to KV IoT API. Check your token and network connection."}
        <br />
        <span className="text-xs mt-1 block">
          Using mock data for demonstration. Update your KV_TOKEN secret to connect to real devices.
        </span>
      </AlertDescription>
    </Alert>
  );
}
