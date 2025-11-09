import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Power, Zap, Droplets, Thermometer, Wind, Home, Settings, Plus, Trash2, X } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export default function IoTDashboard() {
    const [sensors, setSensors] = useState([]);
    const [actuators, setActuators] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [sensorData, setSensorData] = useState([]);
    const [automations, setAutomations] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [sliderValues, setSliderValues] = useState({});
    const [roomFilter, setRoomFilter] = useState('all');
    const [dataTypeFilter, setDataTypeFilter] = useState('all');
    const [timeRange, setTimeRange] = useState('1h');
    const [sensorHistories, setSensorHistories] = useState({});

    // Fetch sensors and actuators
    useEffect(() => {
        fetchDevices();
        const interval = setInterval(fetchDevices, 10000); // Reduced frequency to 10 seconds
        return () => clearInterval(interval);
    }, []);

    // Fetch histories for overview when tab changes or time range changes
    useEffect(() => {
        if (activeTab === 'overview' && sensors.length > 0) {
            fetchAllSensorHistories();
        }
    }, [activeTab, sensors, timeRange]);

    // Check automations
    useEffect(() => {
        if (automations.length === 0) return; // Don't check if no automations
        const interval = setInterval(checkAutomations, 5000); // Reduced frequency
        return () => clearInterval(interval);
    }, [automations, sensors]);

    const fetchDevices = async () => {
        try {
            const [sensorsRes, actuatorsRes] = await Promise.all([
                fetch(`${API_BASE}/api/all/sensors/`),
                fetch(`${API_BASE}/api/all/actuators/`)
            ]);

            if (sensorsRes.ok && actuatorsRes.ok) {
                const sensorsData = await sensorsRes.json();
                const actuatorsData = await actuatorsRes.json();

                // Fetch details for each sensor to get last reading
                const sensorsWithDetails = await Promise.all(
                    sensorsData.data.map(async (sensor) => {
                        try {
                            const detailRes = await fetch(`${API_BASE}/api/sensors/${sensor.id}`);
                            if (detailRes.ok) {
                                return await detailRes.json();
                            }
                        } catch (e) {
                            console.error(`Error fetching sensor ${sensor.id}:`, e);
                        }
                        return sensor;
                    })
                );

                // Fetch details for each actuator to get current state
                const actuatorsWithDetails = await Promise.all(
                    actuatorsData.data.map(async (actuator) => {
                        try {
                            const detailRes = await fetch(`${API_BASE}/api/actuators/${actuator.id}`);
                            if (detailRes.ok) {
                                return await detailRes.json();
                            }
                        } catch (e) {
                            console.error(`Error fetching actuator ${actuator.id}:`, e);
                        }
                        return actuator;
                    })
                );

                setSensors(sensorsWithDetails);
                setActuators(actuatorsWithDetails);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching devices:', error);
            setLoading(false);
        }
    };

    const fetchSensorHistory = async (sensorId, limit = 100, customTimeRange = null) => {
        try {
            const range = customTimeRange || timeRange;
            const now = 1588697130.703
            //const now = Date.now() / 1000;
            let after;

            // Calculate time range
            switch (range) {
                case '15m':
                    after = now - (15 * 60);
                    break;
                case '1h':
                    after = now - (60 * 60);
                    break;
                case '6h':
                    after = now - (6 * 60 * 60);
                    break;
                case '24h':
                    after = now - (24 * 60 * 60);
                    break;
                case '7d':
                    after = now - (7 * 24 * 60 * 60);
                    break;
                default:
                    after = now - (60 * 60);
            }

            const res = await fetch(
                `${API_BASE}/api/sensors/sample/${sensorId}?skip=0&limit=${limit}&sort=asc&after=${after}`
            );

            if (res.ok) {
                const data = await res.json();
                const formatted = data.data.map(sample => ({
                    time: new Date(sample.timestamp * 1000).toLocaleTimeString(),
                    value: sample.value,
                    timestamp: sample.timestamp
                }));
                return formatted;
            }
        } catch (error) {
            console.error('Error fetching sensor history:', error);
        }
        return [];
    };

    const fetchAllSensorHistories = async () => {
        const filtered = getFilteredSensors();
        const histories = {};

        // Fetch histories in parallel but limit concurrent requests
        const batchSize = 5;
        for (let i = 0; i < filtered.length; i += batchSize) {
            const batch = filtered.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async (sensor) => {
                    const history = await fetchSensorHistory(sensor.id, 50);
                    return { id: sensor.id, history };
                })
            );

            results.forEach(({ id, history }) => {
                histories[id] = history;
            });
        }

        setSensorHistories(histories);
    };

    const toggleActuator = async (actuatorId, currentState) => {
        try {
            const newState = !currentState;
            console.log(`Toggling actuator ${actuatorId} from ${currentState} to ${newState}`);

            // Update local state immediately for better UX
            setActuators(prev => prev.map(a =>
                a.id === actuatorId ? { ...a, state: newState } : a
            ));

            const res = await fetch(`${API_BASE}/api/actuators/${actuatorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newState)
            });

            if (res.ok) {
                const result = await res.json();
                console.log('Toggle result:', result);
            } else {
                console.error('Toggle failed:', res.status, await res.text());
                // Revert on failure
                setActuators(prev => prev.map(a =>
                    a.id === actuatorId ? { ...a, state: currentState } : a
                ));
            }
        } catch (error) {
            console.error('Error toggling actuator:', error);
            // Revert on error
            setActuators(prev => prev.map(a =>
                a.id === actuatorId ? { ...a, state: currentState } : a
            ));
        }
    };

    const setActuatorValue = async (actuatorId, value) => {
        try {
            console.log(`Setting actuator ${actuatorId} to ${value}`);

            // Update local state immediately
            setActuators(prev => prev.map(a =>
                a.id === actuatorId ? { ...a, state: value } : a
            ));

            const res = await fetch(`${API_BASE}/api/actuators/${actuatorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(value)
            });

            if (res.ok) {
                const result = await res.json();
                console.log('Set result:', result);
            } else {
                console.error('Set failed:', res.status, await res.text());
            }
        } catch (error) {
            console.error('Error setting actuator:', error);
        }
    };

    const handleSliderChange = (actuatorId, value, dataType) => {
        const newValue = dataType === 'INT' ? parseInt(value) : parseFloat(value);
        // Update local slider state immediately
        setSliderValues(prev => ({ ...prev, [actuatorId]: newValue }));
        setActuators(prev => prev.map(a =>
            a.id === actuatorId ? { ...a, state: newValue } : a
        ));
    };

    const handleSliderRelease = (actuatorId, value, dataType) => {
        const newValue = dataType === 'INT' ? parseInt(value) : parseFloat(value);
        // Send to server when user releases the slider
        setActuatorValue(actuatorId, newValue);
    };

    // Parse sensor name into components
    const parseSensorName = (name) => {
        const parts = name.split('/');
        if (parts.length === 3) {
            return {
                room: parts[0],
                device: parts[1],
                metric: parts[2],
                fullName: name
            };
        }
        return {
            room: 'Unknown',
            device: name,
            metric: 'data',
            fullName: name
        };
    };

    // Get unique rooms and data types for filters
    const getUniqueRooms = () => {
        const rooms = new Set(sensors.map(s => parseSensorName(s.name).room));
        return Array.from(rooms).sort();
    };

    const getUniqueDataTypes = () => {
        const types = new Set(sensors.map(s => parseSensorName(s.name).metric));
        return Array.from(types).sort();
    };

    // Filter sensors based on selected filters
    const getFilteredSensors = () => {
        return sensors.filter(sensor => {
            const parsed = parseSensorName(sensor.name);
            const roomMatch = roomFilter === 'all' || parsed.room === roomFilter;
            const typeMatch = dataTypeFilter === 'all' || parsed.metric === dataTypeFilter;
            return roomMatch && typeMatch;
        });
    };

    const addAutomation = (sensorId, condition, threshold, actuatorId, action) => {
        setAutomations([...automations, {
            id: Date.now(),
            sensorId,
            condition,
            threshold,
            actuatorId,
            action,
            lastTriggered: null
        }]);
    };

    const removeAutomation = (id) => {
        setAutomations(automations.filter(a => a.id !== id));
    };

    const checkAutomations = async () => {
        for (const auto of automations) {
            const sensor = sensors.find(s => s.id === auto.sensorId);
            if (!sensor?.lastSample) continue;

            const value = sensor.lastSample.value;
            let shouldTrigger = false;

            if (auto.condition === 'greater' && value > auto.threshold) shouldTrigger = true;
            if (auto.condition === 'less' && value < auto.threshold) shouldTrigger = true;

            if (shouldTrigger) {
                const timeSinceLastTrigger = auto.lastTriggered ? Date.now() - auto.lastTriggered : Infinity;
                if (timeSinceLastTrigger > 10000) { // Cooldown of 10 seconds
                    await setActuatorValue(auto.actuatorId, auto.action);
                    auto.lastTriggered = Date.now();
                }
            }
        }
    };

    const getSensorIcon = (metric) => {
        const lower = metric.toLowerCase();
        if (lower.includes('temp')) return <Thermometer className="w-5 h-5" />;
        if (lower.includes('humid')) return <Droplets className="w-5 h-5" />;
        if (lower.includes('power') || lower.includes('energy')) return <Zap className="w-5 h-5" />;
        if (lower.includes('air') || lower.includes('wind')) return <Wind className="w-5 h-5" />;
        if (lower.includes('pressure')) return <Activity className="w-5 h-5" />;
        return <Activity className="w-5 h-5" />;
    };

    const formatValue = (value, metric) => {
        const lower = metric.toLowerCase();
        if (lower.includes('temp')) return `${value.toFixed(1)}°C`;
        if (lower.includes('humid')) return `${value.toFixed(0)}%`;
        if (lower.includes('power')) return `${value.toFixed(1)}W`;
        if (lower.includes('pressure')) return `${value.toFixed(1)} Pa`;
        return value.toFixed(2);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading devices...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white p-6">
            <div className="w-full h-full">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Home className="w-8 h-8 text-red-400" />
                        <h1 className="text-4xl font-bold">Smart Home Dashboard</h1>
                    </div>
                    <p className="text-red-200">Monitor and control your IoT devices</p>
                </div>

                {/* Layout: left column for tabs, right column for content */}
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: vertical tabs (on small screens they remain horizontal full-width) */}
                    <div className="md:w-64 w-full">
                        <div className="flex md:flex-col gap-4 mb-6 md:mb-0 border-b md:border-b-0 md:border-r border-blue-400/30 pb-2 md:pb-0 pr-0 md:pr-4">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'overview'
                                        ? 'bg-red-500 text-white'
                                        : 'text-white-200 hover:bg-red-500/20'
                                    }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('sensors')}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'sensors'
                                        ? 'bg-red-500 text-white'
                                        : 'text-white-200 hover:bg-red-500/20'
                                    }`}
                            >
                                Sensors
                            </button>
                            <button
                                onClick={() => setActiveTab('actuators')}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'actuators'
                                        ? 'bg-red-500 text-white'
                                        : 'text-white-200 hover:bg-red-500/20'
                                    }`}
                            >
                                Controls
                            </button>
                            <button
                                onClick={() => setActiveTab('automations')}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === 'automations'
                                        ? 'bg-red-500 text-white'
                                        : 'text-white-200 hover:bg-red-500/20'
                                    }`}
                            >
                                Automations
                            </button>
                        </div>
                    </div>

                    {/* Right: main content area */}
                    <div className="flex-1">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div>
                                {/* Filters and Time Range */}
                                <div className="flex flex-wrap gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm mb-2">Filter by Room</label>
                                        <select
                                            value={roomFilter}
                                            onChange={(e) => setRoomFilter(e.target.value)}
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                                        >
                                            <option value="all">All Rooms</option>
                                            {getUniqueRooms().map(room => (
                                                <option key={room} value={room}>{room}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-2">Filter by Data Type</label>
                                        <select
                                            value={dataTypeFilter}
                                            onChange={(e) => setDataTypeFilter(e.target.value)}
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                                        >
                                            <option value="all">All Types</option>
                                            {getUniqueDataTypes().map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-2">Time Range</label>
                                        <select
                                            value={timeRange}
                                            onChange={(e) => setTimeRange(e.target.value)}
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                                        >
                                            <option value="15m">Last 15 minutes</option>
                                            <option value="1h">Last hour</option>
                                            <option value="6h">Last 6 hours</option>
                                            <option value="24h">Last 24 hours</option>
                                            <option value="7d">Last 7 days</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Sensor Graphs */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    {getFilteredSensors().map(sensor => {
                                        const parsed = parseSensorName(sensor.name);
                                        const history = sensorHistories[sensor.id] || [];

                                        return (
                                            <div
                                                key={sensor.id}
                                                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        {getSensorIcon(parsed.metric)}
                                                        <div>
                                                            <h3 className="font-semibold capitalize">{parsed.device}</h3>
                                                            <span className="text-xs text-blue-200">{parsed.room} • {parsed.metric}</span>
                                                        </div>
                                                    </div>
                                                    {sensor.lastSample && (
                                                        <div className="text-2xl font-bold text-gray-390">
                                                            {formatValue(sensor.lastSample.value, parsed.metric)}
                                                        </div>
                                                    )}
                                                </div>

                                                {history.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <LineChart data={history}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                                            <XAxis
                                                                dataKey="time"
                                                                stroke="#93c5fd"
                                                                tick={{ fontSize: 10 }}
                                                                interval="preserveStartEnd"
                                                            />
                                                            <YAxis stroke="#93c5fd" tick={{ fontSize: 10 }} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }}
                                                                labelStyle={{ color: '#93c5fd' }}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="value"
                                                                stroke="#3b82f6"
                                                                strokeWidth={2}
                                                                dot={false}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-[200px] flex items-center justify-center text-white-200">
                                                        Loading data...
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Actuators Section */}
                                <h2 className="text-2xl font-bold mb-4">Controls</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {actuators.map(actuator => (
                                        <div
                                            key={actuator.id}
                                            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Power className="w-5 h-5" />
                                                    <div>
                                                        <h3 className="font-semibold">{actuator.name}</h3>
                                                        <span className="text-xs text-white-200">Actuator #{actuator.id}</span>
                                                    </div>
                                                </div>
                                                {actuator.dataType === 'BOOLEAN' && (
                                                    <button
                                                        onClick={() => toggleActuator(actuator.id, actuator.state)}
                                                        className={`w-12 h-6 rounded-full transition-all ${actuator.state ? 'bg-green-500' : 'bg-gray-600'
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${actuator.state ? 'translate-x-6' : 'translate-x-1'
                                                            }`} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-2xl font-bold text-blue-300">
                                                {actuator.dataType === 'BOOLEAN'
                                                    ? (actuator.state ? 'ON' : 'OFF')
                                                    : actuator.state}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sensors Tab */}
                        {activeTab === 'sensors' && (
                            <div className="space-y-6">
                                {/* Filters */}
                                <div className="flex gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm mb-2">Filter by Room</label>
                                        <select
                                            value={roomFilter}
                                            onChange={(e) => setRoomFilter(e.target.value)}
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                                        >
                                            <option value="all">All Rooms</option>
                                            {getUniqueRooms().map(room => (
                                                <option key={room} value={room}>{room}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-2">Filter by Data Type</label>
                                        <select
                                            value={dataTypeFilter}
                                            onChange={(e) => setDataTypeFilter(e.target.value)}
                                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                                        >
                                            <option value="all">All Types</option>
                                            {getUniqueDataTypes().map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {getFilteredSensors().map(sensor => {
                                        const parsed = parseSensorName(sensor.name);
                                        return (
                                            <button
                                                key={sensor.id}
                                                onClick={() => {
                                                    setSelectedSensor(sensor);
                                                    fetchSensorHistory(sensor.id, 200).then(data => setSensorData(data));
                                                }}
                                                className={`bg-white/10 backdrop-blur-lg rounded-xl p-4 border transition-all text-left ${selectedSensor?.id === sensor.id
                                                        ? 'border-blue-400 bg-white/20'
                                                        : 'border-white/20 hover:bg-white/15'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    {getSensorIcon(parsed.metric)}
                                                    <div>
                                                        <span className="font-semibold capitalize block">{parsed.device}</span>
                                                        <span className="text-xs text-white-200">{parsed.room} • {parsed.metric}</span>
                                                    </div>
                                                </div>
                                                {sensor.lastSample && (
                                                    <div className="text-2xl font-bold text-white-300">
                                                        {formatValue(sensor.lastSample.value, parsed.metric)}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedSensor && sensorData.length > 0 && (() => {
                                    const parsed = parseSensorName(selectedSensor.name);
                                    return (
                                        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                                            <div className="mb-4 flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-xl font-bold capitalize">{parsed.device}</h3>
                                                    <p className="text-blue-200">{parsed.room} • {parsed.metric}</p>
                                                </div>
                                                <select
                                                    value={timeRange}
                                                    onChange={(e) => {
                                                        setTimeRange(e.target.value);
                                                        fetchSensorHistory(selectedSensor.id, 200).then(data => setSensorData(data));
                                                    }}
                                                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                                                >
                                                    <option value="15m">Last 15 minutes</option>
                                                    <option value="1h">Last hour</option>
                                                    <option value="6h">Last 6 hours</option>
                                                    <option value="24h">Last 24 hours</option>
                                                    <option value="7d">Last 7 days</option>
                                                </select>
                                            </div>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={sensorData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                                    <XAxis dataKey="time" stroke="#93c5fd" />
                                                    <YAxis stroke="#93c5fd" />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6' }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2}
                                                        dot={false}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Actuators Tab */}
                        {activeTab === 'actuators' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {actuators.map(actuator => (
                                    <div
                                        key={actuator.id}
                                        className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
                                    >
                                        <div className="flex items-center gap-3 mb-6">
                                            <Settings className="w-6 h-6 text-blue-400" />
                                            <div>
                                                <h3 className="text-xl font-bold">{actuator.name}</h3>
                                                <span className="text-sm text-blue-200">Type: {actuator.dataType}</span>
                                            </div>
                                        </div>

                                        {actuator.dataType === 'BOOLEAN' && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-lg">Power</span>
                                                <button
                                                    onClick={() => toggleActuator(actuator.id, actuator.state)}
                                                    className={`w-16 h-8 rounded-full transition-all ${actuator.state ? 'bg-green-500' : 'bg-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-7 h-7 bg-white rounded-full transition-transform ${actuator.state ? 'translate-x-8' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>
                                        )}

                                        {(actuator.dataType === 'INT' || actuator.dataType === 'FLOAT') && (
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <span>Value:</span>
                                                    <span className="font-bold text-blue-300">{actuator.state}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={actuator.state}
                                                    onChange={(e) => handleSliderChange(actuator.id, e.target.value, actuator.dataType)}
                                                    onMouseUp={(e) => handleSliderRelease(actuator.id, e.target.value, actuator.dataType)}
                                                    onTouchEnd={(e) => handleSliderRelease(actuator.id, e.target.value, actuator.dataType)}
                                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Automations Tab */}
                        {activeTab === 'automations' && (
                            <div className="space-y-6">
                                <AutomationBuilder
                                    sensors={sensors}
                                    actuators={actuators}
                                    onAdd={addAutomation}
                                />

                                <div className="space-y-3">
                                    <h3 className="text-xl font-bold mb-4">Active Automations</h3>
                                    {automations.map(auto => {
                                        const sensor = sensors.find(s => s.id === auto.sensorId);
                                        const actuator = actuators.find(a => a.id === auto.actuatorId);
                                        const parsed = sensor ? parseSensorName(sensor.name) : null;
                                        return (
                                            <div
                                                key={auto.id}
                                                className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="font-semibold">
                                                        When {parsed ? `${parsed.device} (${parsed.room})` : sensor?.name} {auto.condition === 'greater' ? '>' : '<'} {auto.threshold}
                                                    </p>
                                                    <p className="text-sm text-blue-200">
                                                        Set {actuator?.name} to {auto.action.toString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeAutomation(auto.id)}
                                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5 text-red-400" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {automations.length === 0 && (
                                        <p className="text-center text-blue-200 py-8">No automations yet. Create one above!</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AutomationBuilder({ sensors, actuators, onAdd }) {
    const [sensorId, setSensorId] = useState('');
    const [condition, setCondition] = useState('greater');
    const [threshold, setThreshold] = useState('');
    const [actuatorId, setActuatorId] = useState('');
    const [action, setAction] = useState('');

    const handleSubmit = () => {
        if (sensorId && threshold && actuatorId && action) {
            const actuator = actuators.find(a => a.id === parseInt(actuatorId));
            let parsedAction = action;
            if (actuator.dataType === 'BOOLEAN') {
                parsedAction = action === 'true';
            } else if (actuator.dataType === 'INT') {
                parsedAction = parseInt(action);
            } else if (actuator.dataType === 'FLOAT') {
                parsedAction = parseFloat(action);
            }

            onAdd(parseInt(sensorId), condition, parseFloat(threshold), parseInt(actuatorId), parsedAction);

            setSensorId('');
            setThreshold('');
            setActuatorId('');
            setAction('');
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Automation
            </h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm mb-2">When this sensor</label>
                        <select
                            value={sensorId}
                            onChange={(e) => setSensorId(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
                        >
                            <option value="">Select sensor</option>
                            {sensors.map(s => {
                                const parsed = parseSensorName(s.name);
                                return (
                                    <option key={s.id} value={s.id}>
                                        {parsed.device} ({parsed.room}) - {parsed.metric}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Is</label>
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
                        >
                            <option value="greater">Greater than</option>
                            <option value="less">Less than</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-2">This value</label>
                        <input
                            type="number"
                            step="any"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
                            placeholder="e.g., 25"
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-2">Then set this actuator</label>
                        <select
                            value={actuatorId}
                            onChange={(e) => setActuatorId(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
                        >
                            <option value="">Select actuator</option>
                            {actuators.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm mb-2">To this value</label>
                        {actuatorId && actuators.find(a => a.id === parseInt(actuatorId))?.dataType === 'BOOLEAN' ? (
                            <select
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
                            >
                                <option value="">Select state</option>
                                <option value="true">ON</option>
                                <option value="false">OFF</option>
                            </select>
                        ) : (
                            <input
                                type="number"
                                step="any"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2"
                                placeholder="e.g., 50"
                            />
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                    Create Automation
                </button>
            </div>
        </div>
    );
}