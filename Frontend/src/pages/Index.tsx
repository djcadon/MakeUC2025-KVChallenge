import { useEffect, useState, useRef } from "react";
import { Calendar, Radio, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import ucLogo from "@/assets/uc-logo.png";
import {
  listSensors,
  listActuators,
  getSensorSamples,
  setActuatorState,
  getActuatorState,
  Sensor,
  Actuator,
  Sample,
  hoursAgoEpoch,
} from "@/lib/kvApi";
import { SensorCard } from "@/components/SensorCard";
import { ActuatorControl } from "@/components/ActuatorControl";
import { EnergyMetrics } from "@/components/EnergyMetrics";
import { ApiStatusBanner } from "@/components/ApiStatusBanner";
import { AISummary } from "@/components/AISummary";
import { ActivityLog, ActivityEvent } from "@/components/ActivityLog";
import { DataExport } from "@/components/DataExport";
import { CostMetrics } from "@/components/CostMetrics";
import { ApiPerformance } from "@/components/ApiPerformance";
import { ApiDebugPanel } from "@/components/ApiDebugPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [actuators, setActuators] = useState<Actuator[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiError, setApiError] = useState<string>();
  const [energySaved, setEnergySaved] = useState(0);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [dataMode, setDataMode] = useState<"live" | "historical" | "demo">("historical");
  const previousActuators = useRef<Actuator[]>([]);
  const previousSensors = useRef<Sensor[]>([]);
  const [apiStats, setApiStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    lastRequestTime: 0,
  });
  const [apiLogs, setApiLogs] = useState<Array<{
    timestamp: Date;
    type: "request" | "response" | "error";
    method: string;
    url: string;
    status?: number;
    duration?: number;
    data?: any;
    error?: string;
  }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Historical date: May 15, 2020 12:00:00 (Unix timestamp)
  const HISTORICAL_TIMESTAMP = 1589544000; // May 15, 2020 12:00:00 UTC

  // Real-time polling with rate limit protection
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode]);

  useEffect(() => {
    // Calculate energy savings
    const activeActuators = actuators.filter(a => a.state === false).length;
    const savedWatts = activeActuators * 100;
    setEnergySaved(savedWatts);
  }, [actuators]);

  // Track changes and add to activity log
  useEffect(() => {
    if (previousActuators.current.length === 0) {
      previousActuators.current = actuators;
      return;
    }

    actuators.forEach((current) => {
      const previous = previousActuators.current.find(a => a.id === current.id);
      if (previous && previous.state !== current.state) {
        addActivityEvent({
          type: "actuator",
          message: `${current.name} turned ${current.state ? 'ON' : 'OFF'}`,
          severity: "info",
        });
      }
    });

    previousActuators.current = actuators;
  }, [actuators]);

  useEffect(() => {
    if (previousSensors.current.length === 0) {
      previousSensors.current = sensors;
      return;
    }

    sensors.forEach((current) => {
      const previous = previousSensors.current.find(s => s.id === current.id);
      if (previous && previous.lastSample && current.lastSample) {
        const change = Math.abs(current.lastSample.value - previous.lastSample.value);
        const threshold = previous.lastSample.value * 0.1; // 10% change threshold
        
        if (change > threshold) {
          const direction = current.lastSample.value > previous.lastSample.value ? "increased" : "decreased";
          addActivityEvent({
            type: "sensor",
            message: `${current.name} ${direction} to ${current.lastSample.value.toFixed(2)} ${current.unit}`,
            severity: direction === "increased" ? "warning" : "success",
          });
        }
      }
    });

    previousSensors.current = sensors;
  }, [sensors]);

  const addActivityEvent = (event: Omit<ActivityEvent, "id" | "timestamp">) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      timestamp: new Date(),
    };
    
    setActivityEvents(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
  };

  const generateDemoData = () => {
    // Generate fake sensors based on common IoT sensor types
    const demoSensors: Sensor[] = [
      { id: "demo-temp-1", name: "Room Temperature", unit: "°F", dataType: "NUMBER", lastSample: { timestamp: Date.now() / 1000, value: 68 + Math.random() * 6 } },
      { id: "demo-temp-2", name: "Outdoor Temperature", unit: "°F", dataType: "NUMBER", lastSample: { timestamp: Date.now() / 1000, value: 55 + Math.random() * 15 } },
      { id: "demo-humidity", name: "Humidity", unit: "%", dataType: "NUMBER", lastSample: { timestamp: Date.now() / 1000, value: 45 + Math.random() * 30 } },
      { id: "demo-power-1", name: "Power Consumption", unit: "W", dataType: "NUMBER", lastSample: { timestamp: Date.now() / 1000, value: 350 + Math.random() * 200 } },
      { id: "demo-power-2", name: "HVAC Power", unit: "W", dataType: "NUMBER", lastSample: { timestamp: Date.now() / 1000, value: 800 + Math.random() * 400 } },
      { id: "demo-co2", name: "CO2 Level", unit: "ppm", dataType: "NUMBER", lastSample: { timestamp: Date.now() / 1000, value: 400 + Math.random() * 200 } },
      { id: "demo-light", name: "Light Level", unit: "lux", dataType: "NUMBER", lastSample: { timestamp: Date.now() / 1000, value: 200 + Math.random() * 500 } },
      { id: "demo-voltage", name: "Grid Voltage", unit: "V", dataType: "NUMBER", lastSample: { timestamp: Date.now() / 1000, value: 118 + Math.random() * 4 } },
    ];

    const demoActuators: Actuator[] = [
      { id: "demo-hvac", name: "HVAC System", unit: "on/off", dataType: "BOOLEAN", state: Math.random() > 0.5 },
      { id: "demo-lights", name: "Office Lights", unit: "on/off", dataType: "BOOLEAN", state: Math.random() > 0.3 },
      { id: "demo-fan", name: "Ventilation Fan", unit: "on/off", dataType: "BOOLEAN", state: Math.random() > 0.6 },
    ];

    setSensors(demoSensors);
    setActuators(demoActuators);
    
    if (!apiConnected) {
      setApiConnected(true);
      setApiError(undefined);
      addActivityEvent({
        type: "system",
        message: "Demo mode activated with simulated data",
        severity: "success",
      });
    }
  };

  const loadData = async () => {
    // Handle demo mode with fake data
    if (dataMode === "demo") {
      generateDemoData();
      return;
    }

    setIsRefreshing(true);
    const startTime = Date.now();
    
    try {
      // Log the API request and update stats
      setApiLogs(prev => [...prev, {
        timestamp: new Date(),
        type: "request",
        method: "GET",
        url: "/sensors and /actuators",
      }]);
      
      setApiStats(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
      }));

      const [sensorsRes, actuatorsRes] = await Promise.all([
        listSensors(),
        listActuators(),
      ]);
      
      const duration = Date.now() - startTime;
      
      // Log the API response and update stats
      setApiLogs(prev => [...prev, {
        timestamp: new Date(),
        type: "response",
        method: "GET",
        url: "/sensors and /actuators",
        status: 200,
        duration,
        data: {
          sensors: sensorsRes.data?.length || 0,
          actuators: actuatorsRes.data?.length || 0,
          sensorsData: sensorsRes,
          actuatorsData: actuatorsRes,
        }
      }]);
      
      setApiStats(prev => ({
        totalRequests: prev.totalRequests,
        successfulRequests: prev.successfulRequests + 1,
        lastRequestTime: duration,
      }));
      
      // Only update sensors if we got valid data - never clear existing data
      if (sensorsRes.data.length > 0) {
        // Enrich sensors while preserving existing lastSample values temporarily
        setSensors(prev => {
          const enrichedSensors = sensorsRes.data.map(sensor => {
            const existing = prev.find(s => s.id === sensor.id);
            return {
              ...sensor,
              unit: getUnitForDataType(sensor.dataType, sensor.name),
              lastSample: existing?.lastSample // Preserve existing sample temporarily
            };
          });
          
          console.log(`[Data Load] Loaded ${enrichedSensors.length} sensors from API`);
          
          // Fetch latest samples for ALL sensors to keep data fresh
          (async () => {
            console.log(`[Data Load] Fetching fresh data for ${enrichedSensors.length} sensors...`);
            
            // Load sensors in larger batches to speed up loading
            const batchSize = 10; // Increased from 5
            for (let batchStart = 0; batchStart < enrichedSensors.length; batchStart += batchSize) {
              const batch = enrichedSensors.slice(batchStart, batchStart + batchSize);
              
              // Use Promise.allSettled to continue even if some requests fail
              const results = await Promise.allSettled(batch.map(async (sensor) => {
                try {
                  const fetchParams = dataMode === "live"
                    ? { id: sensor.id, limit: 1, sort: "desc" as const }
                    : { 
                        id: sensor.id, 
                        before: HISTORICAL_TIMESTAMP + 3600,
                        limit: 1, 
                        sort: "desc" as const 
                      };
                  
                  const samplesRes = await getSensorSamples(fetchParams);
                  
                  if (samplesRes.data.length > 0) {
                    const rawSample = samplesRes.data[0];
                    const convertedValue = convertSensorValue(rawSample.value, sensor);
                    
                    setSensors(prev => prev.map(s => 
                      s.id === sensor.id 
                        ? { ...s, lastSample: { ...rawSample, value: convertedValue } }
                        : s
                    ));
                  }
                  // If no data returned, keep existing data (don't set to 0)
                } catch (err) {
                  // Silently fail for individual sensors to not block others
                  console.log(`[Data Load] Skipped sensor ${sensor.id} (timeout/error)`);
                }
              }));
              
              // Only 0.5 second delay between batches (reduced from 1 second)
              if (batchStart + batchSize < enrichedSensors.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            console.log(`[Data Load] Fetch complete`);
          })();
          
          return enrichedSensors;
        });
      } else if (sensors.length === 0) {
        console.log('[Data Load] No sensors returned from API and no existing data');
      } else {
        console.log('[Data Load] No sensors returned from API, keeping existing data');
      }
      
      // Only update actuators if we got valid data - never clear existing data
      if (actuatorsRes.data.length > 0) {
        // Update actuators with fresh data from API
        setActuators(prev => {
          return actuatorsRes.data.map(actuator => {
            const existing = prev.find(a => a.id === actuator.id);
            // Always use API state if provided, fall back to existing, then default
            const state = actuator.state !== undefined 
              ? actuator.state 
              : (existing?.state ?? (actuator.dataType === "BOOLEAN" ? false : 0));
            
            return {
              ...actuator,
              unit: actuator.dataType === "BOOLEAN" ? "on/off" : "value",
              state
            };
          });
        });
        
        // Fetch individual actuator states to get accurate values
        (async () => {
          console.log(`[Data Load] Fetching states for ${actuatorsRes.data.length} actuators...`);
          
          // Fetch in batches of 3 to avoid overwhelming the API
          const batchSize = 3;
          for (let batchStart = 0; batchStart < actuatorsRes.data.length; batchStart += batchSize) {
            const batch = actuatorsRes.data.slice(batchStart, batchStart + batchSize);
            
            await Promise.all(batch.map(async (actuator) => {
              try {
                const stateRes = await getActuatorState(actuator.id);
                
                if (stateRes && typeof stateRes.state !== 'undefined') {
                  setActuators(prev => prev.map(a => 
                    a.id === actuator.id 
                      ? { ...a, state: stateRes.state }
                      : a
                  ));
                }
              } catch (err) {
                // Silently fail - API might not support individual state queries
                console.log(`[Data Load] Could not fetch state for actuator ${actuator.id}`);
              }
            }));
            
            // 2 second delay between batches to be extra careful with API
            if (batchStart + batchSize < actuatorsRes.data.length) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          console.log('[Data Load] Actuator state fetch complete');
        })();
      } else if (actuators.length === 0) {
        console.log('[Data Load] No actuators returned from API and no existing data');
      } else {
        console.log('[Data Load] No actuators returned from API, keeping existing data');
      }
      
      if (!apiConnected) {
        setApiConnected(true);
        setApiError(undefined);
        addActivityEvent({
          type: "system",
          message: "Connected to KV IoT API successfully",
          severity: "success",
        });
      }
      setIsRefreshing(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      const errorMessage = error instanceof Error ? error.message : "Connection failed";
      
      // Log the error and update stats
      setApiLogs(prev => [...prev, {
        timestamp: new Date(),
        type: "error",
        method: "GET",
        url: "/sensors and /actuators",
        error: errorMessage,
      }]);
      
      // Don't increment successful requests on error, but duration is known
      setApiStats(prev => ({
        ...prev,
        lastRequestTime: Date.now() - startTime,
      }));
      
      // Check for various error types
      if (errorMessage.includes("502") || errorMessage.includes("Bad Gateway")) {
        if (!apiError?.includes("gateway")) {
          setApiError("External API temporarily unavailable. Data will load when service recovers.");
          addActivityEvent({
            type: "system",
            message: "KV API experiencing issues (502 Bad Gateway)",
            severity: "warning",
          });
        }
      } else if (errorMessage.includes("429") || errorMessage.includes("rate-limit")) {
        if (!apiError?.includes("rate-limit")) {
          setApiError("Rate limit reached. Slowing down requests...");
          addActivityEvent({
            type: "system",
            message: "API rate limit reached. Requests are throttled.",
            severity: "warning",
          });
          toast({
            title: "Rate Limit Reached",
            description: "Slowing down data refresh to respect API limits",
            variant: "destructive",
          });
        }
      } else if (apiConnected) {
        setApiConnected(false);
        setApiError(errorMessage);
        addActivityEvent({
          type: "system",
          message: "Lost connection to KV IoT API",
          severity: "warning",
        });
        toast({
          title: "API Connection Lost",
          description: "Attempting to reconnect...",
          variant: "destructive",
        });
      }
      setIsRefreshing(false);
    }
  };

  // Helper to determine unit based on sensor name and type
  const getUnitForDataType = (dataType: string, sensorName?: string): string => {
    const nameLower = sensorName?.toLowerCase() || "";
    
    // Temperature sensors - use Fahrenheit
    if (nameLower.includes("temp") || nameLower.includes("temperature")) {
      return "°F";
    }
    
    // Electrical units
    if (nameLower.includes("power") || nameLower.includes("watt")) {
      return "W";
    }
    if (nameLower.includes("voltage") || nameLower.includes("volt")) {
      return "V";
    }
    if (nameLower.includes("current") || nameLower.includes("amp")) {
      return "A";
    }
    if (nameLower.includes("energy") || nameLower.includes("kwh")) {
      return "kWh";
    }
    
    // Humidity
    if (nameLower.includes("humidity")) {
      return "%";
    }
    
    // Light
    if (nameLower.includes("light") || nameLower.includes("lux")) {
      return "lux";
    }
    
    // CO2
    if (nameLower.includes("co2") || nameLower.includes("carbon")) {
      return "ppm";
    }
    
    if (dataType === "FLOAT" || dataType === "INT") {
      return "units";
    }
    return dataType;
  };

  // Convert Celsius to Fahrenheit
  const celsiusToFahrenheit = (celsius: number): number => {
    return (celsius * 9/5) + 32;
  };

  // Convert sensor value based on unit
  const convertSensorValue = (value: number, sensor: Sensor): number => {
    if (sensor.unit === "°F") {
      return celsiusToFahrenheit(value);
    }
    return value;
  };

  const loadSensorSamples = async (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setLoading(true);
    
    // Clear previous samples when switching sensors
    setSamples([]);
    
    try {
      // Generate fake samples for demo mode
      if (dataMode === "demo") {
        const baseSamples = Array.from({ length: 50 }, (_, i) => {
          const baseValue = sensor.lastSample?.value || 50;
          const variation = baseValue * 0.1; // 10% variation
          return {
            timestamp: Math.floor(Date.now() / 1000) - (50 - i) * 1800, // 30 min intervals
            value: baseValue + (Math.random() - 0.5) * variation * 2,
          };
        });
        setSamples(baseSamples);
        setLoading(false);
        return;
      }

      // For historical mode, fetch 24 hours around May 15, 2020
      // For live mode, fetch last 24 hours from now
      const fetchParams = dataMode === "live"
        ? {
            id: sensor.id,
            after: hoursAgoEpoch(24),
            limit: 200,
            sort: "asc" as const,
          }
        : {
            id: sensor.id,
            after: HISTORICAL_TIMESTAMP - (12 * 3600), // 12 hours before
            before: HISTORICAL_TIMESTAMP + (12 * 3600), // 12 hours after
            limit: 200,
            sort: "asc" as const,
          };
      
      console.log(`[Chart] Fetching samples for ${sensor.name} (${dataMode} mode)...`);
      const res = await getSensorSamples(fetchParams);
      
      // Check if we got data
      if (res.data && res.data.length > 0) {
        console.log(`[Chart] Received ${res.data.length} samples for ${sensor.name}`);
        
        // Convert temperature values if needed
        const convertedSamples = res.data.map(sample => ({
          ...sample,
          value: convertSensorValue(sample.value, sensor)
        }));
        
        setSamples(convertedSamples);
      } else {
        // No data returned - generate synthetic data based on current value for visualization
        console.log(`[Chart] No data from API, generating synthetic samples for ${sensor.name}`);
        
        const baseValue = sensor.lastSample?.value || 50;
        const syntheticSamples = Array.from({ length: 30 }, (_, i) => {
          const variation = baseValue * 0.05; // 5% variation
          const timeBase = dataMode === "live" 
            ? Date.now() / 1000 - (30 - i) * 1800 // Last 15 hours for live
            : HISTORICAL_TIMESTAMP - (15 * 3600) + (i * 1800); // 15 hours around historical timestamp
          
          return {
            timestamp: timeBase,
            value: baseValue + (Math.random() - 0.5) * variation * 2,
          };
        });
        
        setSamples(syntheticSamples);
        
        toast({
          title: "Using Simulated Data",
          description: `API returned no data for ${sensor.name}. Showing simulated trend based on current value.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to load samples:", error);
      
      // Generate fallback data so user can still see something
      const baseValue = sensor.lastSample?.value || 50;
      const fallbackSamples = Array.from({ length: 20 }, (_, i) => {
        const variation = baseValue * 0.05;
        const timeBase = dataMode === "live" 
          ? Date.now() / 1000 - (20 - i) * 1800
          : HISTORICAL_TIMESTAMP - (10 * 3600) + (i * 1800);
        
        return {
          timestamp: timeBase,
          value: baseValue + (Math.random() - 0.5) * variation * 2,
        };
      });
      
      setSamples(fallbackSamples);
      
      toast({
        title: "API Timeout",
        description: `Could not fetch data for ${sensor.name}. Showing simulated trend.`,
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reload data when switching between modes - but don't clear existing data
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode]);

  const handleActuatorToggle = async (actuator: Actuator) => {
    const startTime = Date.now();
    
    // Determine the new value based on data type
    let newValue: boolean | number;
    
    if (actuator.dataType === "BOOLEAN") {
      newValue = !actuator.state;
    } else {
      // For FLOAT/NUMBER, use the value passed in the actuator object
      newValue = typeof actuator.state === 'number' ? actuator.state : 0;
    }
    
    // In demo mode, just update local state AND related sensors
    if (dataMode === "demo") {
      setActuators((prev) =>
        prev.map((a) => (a.id === actuator.id ? { ...a, state: newValue } : a))
      );
      
      // Update related sensors based on actuator changes
      setSensors(prev => prev.map(sensor => {
        if (!sensor.lastSample) return sensor;
        
        const sensorName = sensor.name.toLowerCase();
        const actuatorName = actuator.name.toLowerCase();
        let updatedValue = sensor.lastSample.value;
        
        // Power/Current sensors - affected by any actuator
        if (sensor.unit === "W" || sensor.unit === "A" || sensorName.includes("power") || sensorName.includes("current")) {
          // Add/subtract power based on actuator state
          const powerChange = typeof newValue === 'boolean' 
            ? (newValue ? 100 : -100) // Boolean actuators: +/- 100W
            : (typeof newValue === 'number' ? newValue * 10 : 0); // Numeric actuators: value * 10W
          
          updatedValue = Math.max(0, sensor.lastSample.value + powerChange + (Math.random() - 0.5) * 20);
        }
        
        // Temperature sensors - affected by HVAC/thermostat actuators
        if ((sensor.unit === "°F" || sensor.unit === "°C" || sensorName.includes("temp")) && 
            (actuatorName.includes("hvac") || actuatorName.includes("thermostat") || actuatorName.includes("heat") || actuatorName.includes("cool"))) {
          const tempChange = typeof newValue === 'boolean'
            ? (newValue ? -2 : 2) // Turning on HVAC cools by 2 degrees
            : 0;
          
          updatedValue = sensor.lastSample.value + tempChange + (Math.random() - 0.5) * 0.5;
        }
        
        // Light sensors - affected by light actuators
        if ((sensor.unit === "lux" || sensorName.includes("light")) && actuatorName.includes("light")) {
          const lightChange = typeof newValue === 'boolean'
            ? (newValue ? 300 : -300) // Turning on lights adds 300 lux
            : 0;
          
          updatedValue = Math.max(0, sensor.lastSample.value + lightChange + (Math.random() - 0.5) * 50);
        }
        
        // Motion sensors - slightly affected by actuator activity
        if (sensorName.includes("motion") || sensorName.includes("pressure")) {
          // Small random change to simulate activity
          updatedValue = Math.random() > 0.7 ? 1 : 0;
        }
        
        return {
          ...sensor,
          lastSample: {
            ...sensor.lastSample,
            value: updatedValue,
            timestamp: Date.now() / 1000
          }
        };
      }));
      
      addActivityEvent({
        type: "actuator",
        message: `Manually updated ${actuator.name} to ${
          typeof newValue === 'boolean' ? (newValue ? 'ON' : 'OFF') : newValue.toFixed(1)
        } (demo mode)`,
        severity: "info",
      });
      
      toast({
        title: "Success (Demo Mode)",
        description: `${actuator.name} updated - sensors synced`,
      });
      return;
    }
    
    // For live/historical mode: Optimistically update UI first
    const previousState = actuator.state;
    setActuators((prev) =>
      prev.map((a) => (a.id === actuator.id ? { ...a, state: newValue } : a))
    );
    
    // Log the attempt
    setApiLogs(prev => [...prev, {
      timestamp: new Date(),
      type: "request",
      method: "PUT/POST",
      url: `/actuators/${actuator.id}`,
    }]);
    
    try {
      // Call the real API
      const updated = await setActuatorState(
        actuator.id,
        actuator.dataType,
        newValue
      );
      
      const requestTime = Date.now() - startTime;
      
      // Update API stats
      setApiStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        successfulRequests: prev.successfulRequests + 1,
        lastRequestTime: requestTime,
      }));
      
      // Log success
      setApiLogs(prev => [...prev, {
        timestamp: new Date(),
        type: "response",
        method: "PUT/POST",
        url: `/actuators/${actuator.id}`,
        status: 200,
        duration: requestTime,
        data: updated,
      }]);
      
      // Verify the API response is valid
      if (updated && updated.id && typeof updated.state !== 'undefined') {
        // Update with confirmed API response
        setActuators((prev) =>
          prev.map((a) => (a.id === actuator.id ? updated : a))
        );
      }
      // If response is invalid, keep the optimistic update
      
      addActivityEvent({
        type: "actuator",
        message: `Updated ${actuator.name} to ${
          typeof newValue === 'boolean' ? (newValue ? 'ON' : 'OFF') : newValue.toFixed(1)
        }`,
        severity: "info",
      });
      
      toast({
        title: "Success",
        description: `${actuator.name} updated in ${requestTime}ms`,
      });
    } catch (error) {
      console.error("Failed to toggle actuator:", error);
      
      const requestTime = Date.now() - startTime;
      
      // Update API stats (failed request)
      setApiStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        successfulRequests: prev.successfulRequests,
        lastRequestTime: requestTime,
      }));
      
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      
      // Log error
      setApiLogs(prev => [...prev, {
        timestamp: new Date(),
        type: "error",
        method: "PUT/POST",
        url: `/actuators/${actuator.id}`,
        error: errorMsg,
      }]);
      
      // For historical mode or when API is unreliable, always keep the local update
      // Only revert on critical/unexpected errors
      const shouldKeepUpdate = 
        dataMode === "historical" || // Historical mode: always keep local changes
        errorMsg.includes("404") || 
        errorMsg.includes("endpoint") || 
        errorMsg.includes("timeout") ||
        errorMsg.includes("Request timeout") ||
        errorMsg.includes("Unable to control") ||
        errorMsg.includes("not") ||
        errorMsg.toLowerCase().includes("fetch");
      
      if (shouldKeepUpdate) {
        // Keep the optimistic update
        toast({
          title: dataMode === "historical" ? "Updated Locally" : "API Limitation",
          description: dataMode === "historical" 
            ? `${actuator.name} updated. Historical mode works with local state.`
            : `${actuator.name} updated locally. API is slow or doesn't support control.`,
        });
        
        addActivityEvent({
          type: "actuator",
          message: `${actuator.name} updated locally${dataMode === "historical" ? " (historical mode)" : " - API issue"}`,
          severity: "info",
        });
        
        // Don't revert the state - keep the optimistic update
        return;
      }
      
      // For unexpected errors, revert to previous state
      setActuators((prev) =>
        prev.map((a) => (a.id === actuator.id ? { ...a, state: previousState } : a))
      );
      
      toast({
        title: "Update Failed",
        description: errorMsg.length > 100 ? errorMsg.substring(0, 100) + "..." : errorMsg,
        variant: "destructive",
      });
      
      addActivityEvent({
        type: "actuator",
        message: `Failed to update ${actuator.name}: ${errorMsg}`,
        severity: "warning",
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'var(--gradient-bg)' }}>
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <img 
                src={ucLogo} 
                alt="University of Cincinnati" 
                className="relative h-20 w-auto object-contain drop-shadow-lg"
              />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-foreground">
                IoT-mageddon Dashboard
              </h1>
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 mt-2">
                <Activity className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700 dark:text-yellow-500 font-medium">
                  Note: The API keeps crashing whenever you try to run more than 2-3 requests every 5-10 seconds.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setDataMode("live");
                toast({
                  title: "Live Mode",
                  description: "Showing live data from today",
                });
              }}
              variant={dataMode === "live" ? "default" : "outline"}
              size="sm"
              className="gap-2 shadow-lg"
            >
              <Radio className="h-4 w-4" />
              Live
            </Button>
            <Button
              onClick={() => {
                setDataMode("demo");
                toast({
                  title: "Demo Mode",
                  description: "Showing simulated demo data",
                });
              }}
              variant={dataMode === "demo" ? "default" : "outline"}
              size="sm"
              className="gap-2 shadow-lg"
            >
              <Activity className="h-4 w-4" />
              Demo
            </Button>
            <Button
              onClick={() => {
                setDataMode("historical");
                toast({
                  title: "Historical Mode",
                  description: "Showing data from May 15, 2020",
                });
              }}
              variant={dataMode === "historical" ? "default" : "outline"}
              size="sm"
              className="gap-2 shadow-lg"
            >
              <Calendar className="h-4 w-4" />
              May 2020
            </Button>
            <div className="hidden md:block ml-4">
              <div className="text-right bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg px-4 py-2 border border-primary/20">
                <div className="text-3xl font-bold text-primary drop-shadow-sm">
                  MakeUC
                </div>
                <div className="text-xs text-muted-foreground font-semibold">2025</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mb-6 space-y-4">
        <ApiPerformance 
          lastRequestTime={apiStats.lastRequestTime}
          successRate={apiStats.totalRequests > 0 ? (apiStats.successfulRequests / apiStats.totalRequests) * 100 : 100}
          totalRequests={apiStats.totalRequests}
          onRefresh={() => loadData()}
          isRefreshing={isRefreshing}
        />
        
        <ApiDebugPanel 
          logs={apiLogs}
          onRefresh={() => loadData()}
        />
      </div>

      <div className="space-y-6">
        <AISummary 
          sensors={sensors} 
          actuators={actuators} 
          energySaved={energySaved}
        />
        
        <CostMetrics 
          sensors={sensors}
          energySaved={energySaved}
        />
        
        <ApiStatusBanner isConnected={apiConnected} error={apiError} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <DataExport
              sensors={sensors}
              actuators={actuators}
              samples={samples}
              activityEvents={activityEvents}
            />
            
            <EnergyMetrics actuators={actuators} sensors={sensors} />

            <Tabs defaultValue="sensors" className="space-y-4">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="sensors">Sensors</TabsTrigger>
                <TabsTrigger value="actuators">Actuators</TabsTrigger>
              </TabsList>

              <TabsContent value="sensors" className="space-y-4">
                {sensors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading sensors...
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sensors.map((sensor) => (
                      <SensorCard
                        key={sensor.id}
                        sensor={sensor}
                        onClick={() => {
                          if (selectedSensor?.id === sensor.id) {
                            // If clicking the same sensor, close it
                            setSelectedSensor(null);
                            setSamples([]);
                          } else {
                            // Otherwise, load the new sensor's data
                            loadSensorSamples(sensor);
                          }
                        }}
                        isSelected={selectedSensor?.id === sensor.id}
                        samples={selectedSensor?.id === sensor.id ? samples : []}
                        loading={selectedSensor?.id === sensor.id && loading}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actuators" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {actuators.map((actuator) => (
                    <ActuatorControl
                      key={actuator.id}
                      actuator={actuator}
                      onToggle={handleActuatorToggle}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <ActivityLog events={activityEvents} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
