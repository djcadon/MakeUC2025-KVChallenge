import React, { useState, useEffect } from 'react';
import {
    Power,
    Activity,
    Zap,
    Home,
    AlertCircle,
    Plus,
    Trash2,
    RefreshCw,
    TrendingUp,
    Settings
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const API_BASE = 'http://127.0.0.1:8000';

export default function KineticVisionDashboard() {
    // State management
    const [sensors, setSensors] = useState([]);
    const [actuators, setActuators] = useState([]);
    const [sensorSamples, setSensorSamples] = useState({});
    const [actuatorStates, setActuatorStates] = useState({});
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedSensorForChart, setSelectedSensorForChart] = useState(null);
    const [presenceAlerts, setPresenceAlerts] = useState([]);

    // Fetch all sensors
    const fetchAllSensors = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/all/sensors`);
            const data = await response.json();
            setSensors(data.data || []);
            return data.data || [];
        } catch (err) {
            setError('Failed to fetch sensors: ' + err.message);
            return [];
        }
    };

    // Fetch all actuators
    const fetchAllActuators = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/all/actuators`);
            const data = await response.json();
            setActuators(data.data || []);
            return data.data || [];
        } catch (err) {
            setError('Failed to fetch actuators: ' + err.message);
            return [];
        }
    };

    // Fetch sensor samples
    const fetchSensorSamples = async (sensorId) => {
        try {
            const response = await fetch(`${API_BASE}/api/sensors/sample/${sensorId}?limit=100&sort=desc`);
            const data = await response.json();
            return data.data || [];
        } catch (err) {
            console.error(`Failed to fetch samples for sensor ${sensorId}:`, err);
            return [];
        }
    };

    // Fetch actuator state
    const fetchActuatorState = async (actuatorId) => {
        try {
            const response = await fetch(`${API_BASE}/api/actuator/${actuatorId}`);
            const data = await response.json();
            return data;
        } catch (err) {
            console.error(`Failed to fetch actuator ${actuatorId}:`, err);
            return null;
        }
    };

    // Set actuator state
    const setActuatorState = async (actuatorId, value) => {
        try {
            const response = await fetch(`${API_BASE}/api/actuator/${actuatorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(value)
            });
            const data = await response.json();

            // Update local state
            setActuatorStates(prev => ({
                ...prev,
                [actuatorId]: data
            }));

            return data;
        } catch (err) {
            setError(`Failed to set actuator ${actuatorId}: ` + err.message);
            return null;
        }
    };

    // Initialize dashboard
    const initializeDashboard = async () => {
        setLoading(true);
        setError('');

        try {
            // Fetch sensors and actuators
            const [sensorsData, actuatorsData] = await Promise.all([
                fetchAllSensors(),
                fetchAllActuators()
            ]);

            // Fetch samples for all sensors
            const samplesPromises = sensorsData.map(sensor =>
                fetchSensorSamples(sensor.id).then(samples => ({
                    id: sensor.id,
                    samples
                }))
            );

            const samplesResults = await Promise.all(samplesPromises);
            const samplesMap = {};
            samplesResults.forEach(result => {
                samplesMap[result.id] = result.samples;
            });
            setSensorSamples(samplesMap);

            // Fetch states for all actuators
            const statesPromises = actuatorsData.map(actuator =>
                fetchActuatorState(actuator.id).then(state => ({
                    id: actuator.id,
                    state
                }))
            );

            const statesResults = await Promise.all(statesPromises);
            const statesMap = {};
            statesResults.forEach(result => {
                statesMap[result.id] = result.state;
            });
            setActuatorStates(statesMap);

        } catch (err) {
            setError('Failed to initialize dashboard: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Determine if sensor/actuator is boolean or numeric
    const determineType = (samples, state) => {
        if (!samples || samples.length === 0) {
            if (state && typeof state.state === 'boolean') return 'boolean';
            return 'unknown';
        }

        const sampleValue = samples[0].value;
        if (typeof sampleValue === 'boolean') return 'boolean';
        if (typeof sampleValue === 'number') return 'numeric';
        return 'unknown';
    };

    // Process automation rules
    const processAutomations = () => {
        automations.forEach(automation => {
            const sensor = sensors.find(s => s.id === automation.sensorId);
            const actuator = actuators.find(a => a.id === automation.actuatorId);

            if (!sensor || !actuator) return;

            const samples = sensorSamples[sensor.id];
            if (!samples || samples.length === 0) return;

            const latestValue = samples[0].value;

            // Check condition
            let shouldTrigger = false;
            switch (automation.condition) {
                case 'greater':
                    shouldTrigger = latestValue > automation.threshold;
                    break;
                case 'less':
                    shouldTrigger = latestValue < automation.threshold;
                    break;
                case 'equals':
                    shouldTrigger = latestValue === automation.threshold;
                    break;
            }

            if (shouldTrigger) {
                setActuatorState(actuator.id, automation.action);
            }
        });
    };

    // Monitor presence for security
    const monitorPresence = () => {
        sensors.forEach(sensor => {
            if (sensor.name && sensor.name.toLowerCase().includes('presence')) {
                const samples = sensorSamples[sensor.id];
                if (!samples || samples.length === 0) return;

                const latestValue = samples[0].value;
                if (latestValue === true) {
                    // Check if it's during expected times
                    const currentHour = new Date().getHours();
                    const isUnexpectedTime = currentHour < 6 || currentHour > 22;

                    if (isUnexpectedTime) {
                        const alert = {
                            id: Date.now(),
                            message: `Unexpected presence detected in ${sensor.name}`,
                            timestamp: new Date().toLocaleString(),
                            sensorId: sensor.id
                        };

                        setPresenceAlerts(prev => [alert, ...prev.slice(0, 9)]);
                    }
                }
            }
        });
    };

    // Calculate energy usage
    const calculateEnergyUsage = () => {
        let totalUsage = 0;

        sensors.forEach(sensor => {
            if (sensor.name && (sensor.name.toLowerCase().includes('power') ||
                sensor.name.toLowerCase().includes('energy'))) {
                const samples = sensorSamples[sensor.id];
                if (samples && samples.length > 0) {
                    totalUsage += samples[0].value || 0;
                }
            }
        });

        return totalUsage.toFixed(2);
    };

    // Auto-manage unoccupied rooms
    const manageUnoccupiedRooms = async () => {
        for (const sensor of sensors) {
            if (sensor.name && sensor.name.toLowerCase().includes('presence')) {
                const samples = sensorSamples[sensor.id];
                if (!samples || samples.length === 0) continue;

                const isOccupied = samples[0].value === true;

                // Find related actuators (lights, AC, etc.) in the same room
                const roomName = sensor.name.split(' ')[0]; // Extract room name
                const roomActuators = actuators.filter(a =>
                    a.name && a.name.toLowerCase().includes(roomName.toLowerCase())
                );

                // Turn off devices in unoccupied rooms
                if (!isOccupied) {
                    for (const actuator of roomActuators) {
                        await setActuatorState(actuator.id, false);
                    }
                }
            }
        }
    };

    // Create study environment
    const createStudyEnvironment = async () => {
        for (const actuator of actuators) {
            if (!actuator.name) continue;

            const name = actuator.name.toLowerCase();

            // Turn on lights at medium brightness
            if (name.includes('light')) {
                await setActuatorState(actuator.id, true);
            }

            // Set AC to comfortable temperature (assuming 72°F/22°C)
            if (name.includes('temperature') || name.includes('ac')) {
                await setActuatorState(actuator.id, 72);
            }

            // Turn off entertainment devices
            if (name.includes('tv') || name.includes('speaker')) {
                await setActuatorState(actuator.id, false);
            }
        }
    };

    // Format chart data
    const formatChartData = (sensorId) => {
        const samples = sensorSamples[sensorId];
        if (!samples) return [];

        return samples
            .slice(0, 50)
            .reverse()
            .map(sample => ({
                timestamp: new Date(sample.timestamp * 1000).toLocaleTimeString(),
                value: sample.value
            }));
    };

    // Use effects
    useEffect(() => {
        initializeDashboard();

        // Set up polling
        const interval = setInterval(() => {
            initializeDashboard();
            processAutomations();
            monitorPresence();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        processAutomations();
    }, [sensorSamples, automations]);

    // Render components
    const renderOverview = () => (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Sensors</p>
                            <p className="text-2xl font-bold">{sensors.length}</p>
                        </div>
                        <Activity className="text-blue-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Actuators</p>
                            <p className="text-2xl font-bold">{actuators.length}</p>
                        </div>
                        <Power className="text-green-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Energy Usage</p>
                            <p className="text-2xl font-bold">{calculateEnergyUsage()} kW</p>
                        </div>
                        <Zap className="text-yellow-500" size={32} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Active Automations</p>
                            <p className="text-2xl font-bold">{automations.length}</p>
                        </div>
                        <Settings className="text-purple-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={manageUnoccupiedRooms}
                        className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        <Home className="mx-auto mb-2" />
                        Manage Unoccupied Rooms
                    </button>

                    <button
                        onClick={createStudyEnvironment}
                        className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                        <Activity className="mx-auto mb-2" />
                        Study Mode
                    </button>

                    <button
                        onClick={initializeDashboard}
                        className="p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                        <RefreshCw className="mx-auto mb-2" />
                        Refresh All
                    </button>

                    <button
                        onClick={() => setActiveTab('automations')}
                        className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                    >
                        <Plus className="mx-auto mb-2" />
                        New Automation
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {presenceAlerts.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-red-800 flex items-center">
                        <AlertCircle className="mr-2" />
                        Security Alerts
                    </h3>
                    <div className="space-y-2">
                        {presenceAlerts.map(alert => (
                            <div key={alert.id} className="bg-white p-3 rounded border-l-4 border-red-500">
                                <p className="font-medium">{alert.message}</p>
                                <p className="text-sm text-gray-500">{alert.timestamp}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderSensors = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Sensors & Data Visualization</h2>

            {/* Chart Display */}
            {selectedSensorForChart && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">
                        {sensors.find(s => s.id === selectedSensorForChart)?.name || 'Sensor'} - Time Series
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={formatChartData(selectedSensorForChart)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                                strokeWidth={2}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Sensors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sensors.map(sensor => {
                    const samples = sensorSamples[sensor.id] || [];
                    const latestValue = samples[0]?.value;
                    const type = determineType(samples, null);

                    return (
                        <div
                            key={sensor.id}
                            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                            onClick={() => setSelectedSensorForChart(sensor.id)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold">{sensor.name || `Sensor ${sensor.id}`}</h3>
                                    <p className="text-sm text-gray-500">ID: {sensor.id}</p>
                                </div>
                                <TrendingUp className="text-blue-500" />
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500">Current Value:</p>
                                <p className="text-2xl font-bold">
                                    {latestValue !== undefined ?
                                        (typeof latestValue === 'boolean' ?
                                            (latestValue ? 'Active' : 'Inactive') :
                                            latestValue.toFixed(2)
                                        ) :
                                        'N/A'
                                    }
                                </p>
                            </div>

                            <div className="mt-2">
                                <p className="text-xs text-gray-400">
                                    {samples.length} samples available
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderActuators = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Device Controls</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {actuators.map(actuator => {
                    const state = actuatorStates[actuator.id];
                    const type = determineType([], state);
                    const isBoolean = type === 'boolean' || typeof state?.state === 'boolean';
                    const currentValue = state?.state;

                    return (
                        <div key={actuator.id} className="bg-white p-6 rounded-lg shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold">{actuator.name || `Actuator ${actuator.id}`}</h3>
                                    <p className="text-sm text-gray-500">ID: {actuator.id}</p>
                                </div>
                                <Power className={currentValue ? 'text-green-500' : 'text-gray-400'} />
                            </div>

                            {isBoolean ? (
                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-sm font-medium">
                                        Status: {currentValue ? 'ON' : 'OFF'}
                                    </span>
                                    <button
                                        onClick={() => setActuatorState(actuator.id, !currentValue)}
                                        className={`px-6 py-2 rounded-lg font-medium transition ${currentValue
                                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                            }`}
                                    >
                                        {currentValue ? 'Turn OFF' : 'Turn ON'}
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-4">
                                    <label className="text-sm font-medium block mb-2">
                                        Value: {currentValue}
                                    </label>
                                    <input
                                        type="number"
                                        value={currentValue || 0}
                                        onChange={(e) => setActuatorState(actuator.id, parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderAutomations = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Automations</h2>
                <button
                    onClick={() => {
                        const newAutomation = {
                            id: Date.now(),
                            sensorId: sensors[0]?.id,
                            actuatorId: actuators[0]?.id,
                            condition: 'greater',
                            threshold: 50,
                            action: true
                        };
                        setAutomations([...automations, newAutomation]);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                >
                    <Plus className="mr-2" size={20} />
                    Add Automation
                </button>
            </div>

            <div className="space-y-4">
                {automations.map(automation => {
                    const sensor = sensors.find(s => s.id === automation.sensorId);
                    const actuator = actuators.find(a => a.id === automation.actuatorId);

                    return (
                        <div key={automation.id} className="bg-white p-6 rounded-lg shadow">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Sensor</label>
                                    <select
                                        value={automation.sensorId}
                                        onChange={(e) => {
                                            const updated = automations.map(a =>
                                                a.id === automation.id ? { ...a, sensorId: parseInt(e.target.value) } : a
                                            );
                                            setAutomations(updated);
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        {sensors.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name || `Sensor ${s.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Condition</label>
                                    <select
                                        value={automation.condition}
                                        onChange={(e) => {
                                            const updated = automations.map(a =>
                                                a.id === automation.id ? { ...a, condition: e.target.value } : a
                                            );
                                            setAutomations(updated);
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="greater">Greater Than</option>
                                        <option value="less">Less Than</option>
                                        <option value="equals">Equals</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Threshold</label>
                                    <input
                                        type="number"
                                        value={automation.threshold}
                                        onChange={(e) => {
                                            const updated = automations.map(a =>
                                                a.id === automation.id ? { ...a, threshold: parseFloat(e.target.value) } : a
                                            );
                                            setAutomations(updated);
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Actuator</label>
                                    <select
                                        value={automation.actuatorId}
                                        onChange={(e) => {
                                            const updated = automations.map(a =>
                                                a.id === automation.id ? { ...a, actuatorId: parseInt(e.target.value) } : a
                                            );
                                            setAutomations(updated);
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        {actuators.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.name || `Actuator ${a.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setAutomations(automations.filter(a => a.id !== automation.id));
                                        }}
                                        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        <Trash2 className="mx-auto" size={20} />
                                    </button>
                                </div>
                            </div>

                            <p className="mt-4 text-sm text-gray-600">
                                When <strong>{sensor?.name || 'sensor'}</strong> is{' '}
                                <strong>{automation.condition}</strong> than{' '}
                                <strong>{automation.threshold}</strong>, set{' '}
                                <strong>{actuator?.name || 'actuator'}</strong> to{' '}
                                <strong>{String(automation.action)}</strong>
                            </p>
                        </div>
                    );
                })}

                {automations.length === 0 && (
                    <div className="bg-gray-50 p-12 rounded-lg text-center">
                        <Settings className="mx-auto mb-4 text-gray-400" size={48} />
                        <p className="text-gray-500">No automations configured yet.</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Click "Add Automation" to create your first rule.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    // Main render
    return (
        <div className="fle flex-col">
            <div className="flex-grow w-full mx-auto max-w-7xl">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Kinetic Vision IoT Dashboard
                            </h1>
                            <div className="flex items-center space-x-4">
                                {loading && (
                                    <div className="flex items-center text-blue-600">
                                        <RefreshCw className="animate-spin mr-2" size={20} />
                                        Loading...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {['overview', 'sensors', 'actuators', 'automations'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition ${activeTab === tab
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start">
                        <AlertCircle className="text-red-600 mr-3 mt-0.5" size={20} />
                        <div>
                            <p className="text-red-800 font-medium">Error</p>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'sensors' && renderSensors()}
                {activeTab === 'actuators' && renderActuators()}
                {activeTab === 'automations' && renderAutomations()}
            </div>
        </div>
    );
}