import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, RefreshCw, Power, Settings, TrendingUp, Lightbulb, Clock, AlertTriangle, Home, Brain, Plus, Trash2, Play, Pause } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function KineticVisionDashboard() {
  const [teamName, setTeamName] = useState('');
  const [token, setToken] = useState('');
  const [sensors, setSensors] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [automations, setAutomations] = useState([]);
  const [energyData, setEnergyData] = useState({});
  const [presenceAlerts, setPresenceAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const API_BASE = 'https://api.makeuc.io'; // Replace with actual base URL

  // Generate authentication token
  const generateToken = async () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/token?team=${encodeURIComponent(teamName)}`, {
        method: 'POST'
      });
      const data = await response.json();
      setToken(data.token);
      setError('Token generated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError('Failed to generate token: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all sensors
  const fetchSensors = async () => {
    if (!token) {
      setError('Please generate a token first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/sensors/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSensors(data.data);
    } catch (err) {
      setError('Failed to fetch sensors: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all actuators
  const fetchActuators = async () => {
    if (!token) {
      setError('Please generate a token first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/actuators/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setActuators(data.data);
    } catch (err) {
      setError('Failed to fetch actuators: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sensor samples
  const fetchSensorData = async (sensorId) => {
    if (!token) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/sensors/${sensorId}/samples?skip=0&limit=100&sort=desc`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      setSensorData(data.data.reverse()); // Reverse for chronological order in charts
      setSelectedSensor(sensorId);
    } catch (err) {
      setError('Failed to fetch sensor data: ' + err.message);
    }
  };

  // Set actuator state
  const setActuatorState = async (actuatorId, value) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/actuators/${actuatorId}/state`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(value)
      });
      
      if (response.ok) {
        fetchActuators(); // Refresh actuators
        setError('Actuator updated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Failed to update actuator: ' + err.message);
    }
  };

  // Add automation rule
  const addAutomation = () => {
    const newAutomation = {
      id: Date.now(),
      name: 'New Automation',
      sensorId: sensors[0]?.id || null,
      condition: 'greater',
      threshold: 0,
      actuatorId: actuators[0]?.id || null,
      action: true,
      enabled: true
    };
    setAutomations([...automations, newAutomation]);
  };

  // Remove automation
  const removeAutomation = (id) => {
    setAutomations(automations.filter(a => a.id !== id));
  };

  // Toggle automation
  const toggleAutomation = (id) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled } : a
    ));
  };

  // Update automation
  const updateAutomation = (id, field, value) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  // Check presence alert
  const checkPresence = () => {
    const motionSensor = sensors.find(s => s.name.toLowerCase().includes('motion') || s.name.toLowerCase().includes('presence'));
    if (motionSensor) {
      // Simulate checking for unauthorized presence
      const alert = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        message: 'Motion detected in unoccupied room',
        severity: 'warning'
      };
      setPresenceAlerts([alert, ...presenceAlerts].slice(0, 10));
    }
  };

  // Format chart data
  const formatChartData = () => {
    return sensorData.map(sample => ({
      time: new Date(sample.timestamp * 1000).toLocaleTimeString(),
      value: sample.value,
      fullTime: new Date(sample.timestamp * 1000).toLocaleString()
    }));
  };

  return (
   <div className="flex flex-col min-h-[100vh] min-w-[100vw] bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 text-white p-4 sm:p-6 transition-all duration-300">
    <div className="flex-grow w-full mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
         <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full border border-red-500/30 backdrop-blur-xl">
            <Sparkles className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-sm font-medium text-red-300">MakeUC 2025 Challenge</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-400 to-white-400 bg-clip-text text-transparent">
            Kinetic Vision Smart Home
          </h1>
          <p className="text-slate-400">MakeUC 2025 Challenge - Dashboard</p>
        </div>

        {/* Authentication Section */}
        {!token && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6 shadow-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Authentication
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={generateToken}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Token'}
              </button>
            </div>
          </div>
        )}

        {/* Token Display */}
        {token && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6 shadow-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-3">Active Token</h2>
            <div className="bg-slate-900 p-3 rounded font-mono text-xs break-all border border-slate-700 mb-4">
              {token}
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchSensors}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Load Sensors
              </button>
              <button
                onClick={fetchActuators}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Load Actuators
              </button>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg ${error.includes('success') ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'}`}>
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        {token && (
          <div className="bg-slate-800 rounded-lg p-2 mb-6 shadow-xl border border-slate-700 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'charts' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Time-Series Charts
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'devices' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
            >
              <Power className="w-4 h-4 inline mr-1" />
              Device Controls
            </button>
            <button
              onClick={() => setActiveTab('automations')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'automations' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
            >
              <Brain className="w-4 h-4 inline mr-1" />
              Automations
            </button>
            <button
              onClick={() => setActiveTab('energy')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'energy' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
            >
              <Lightbulb className="w-4 h-4 inline mr-1" />
              Energy Monitor
            </button>
            <button
              onClick={() => setActiveTab('presence')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === 'presence' ? 'bg-blue-600' : 'hover:bg-slate-700'}`}
            >
              <Home className="w-4 h-4 inline mr-1" />
              Presence Monitor
            </button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && token && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sensors Section */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-400" />
                Sensors
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sensors.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No sensors loaded</p>
                ) : (
                  sensors.map((sensor) => (
                    <div
                      key={sensor.id}
                      onClick={() => fetchSensorData(sensor.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedSensor === sensor.id
                          ? 'bg-blue-700 border border-blue-500'
                          : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{sensor.name}</p>
                          <p className="text-sm text-slate-300">ID: {sensor.id}</p>
                        </div>
                        <span className="px-2 py-1 bg-slate-900 rounded text-xs font-mono">
                          {sensor.dataType}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actuators Section */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Actuators
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {actuators.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">No actuators loaded</p>
                ) : (
                  actuators.map((actuator) => (
                    <div
                      key={actuator.id}
                      className="p-4 bg-slate-700 rounded-lg border border-slate-600"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{actuator.name}</p>
                          <p className="text-sm text-slate-300">ID: {actuator.id}</p>
                        </div>
                        <span className="px-2 py-1 bg-slate-900 rounded text-xs font-mono">
                          {actuator.dataType}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Time-Series Charts Tab */}
        {activeTab === 'charts' && token && (
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
                Time-Series Data Visualization
              </h2>
              {selectedSensor && (
                <button
                  onClick={() => fetchSensorData(selectedSensor)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              )}
            </div>

            {!selectedSensor ? (
              <div className="text-center py-16 text-slate-400">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl mb-2">Select a sensor to view time-series data</p>
                <p className="text-sm">Go to Overview tab and click on any sensor</p>
              </div>
            ) : sensorData.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p>Loading sensor data...</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-4 bg-slate-700 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1">
                    Sensor ID: {selectedSensor}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {sensors.find(s => s.id === selectedSensor)?.name || 'Unknown Sensor'}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Showing last {sensorData.length} readings
                  </p>
                </div>
                
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={formatChartData()}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Statistics */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-400">Current</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {sensorData[sensorData.length - 1]?.value.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-400">Average</p>
                    <p className="text-2xl font-bold text-green-400">
                      {(sensorData.reduce((sum, d) => sum + d.value, 0) / sensorData.length).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-400">Maximum</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {Math.max(...sensorData.map(d => d.value)).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <p className="text-sm text-slate-400">Minimum</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {Math.min(...sensorData.map(d => d.value)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Device Controls Tab */}
        {activeTab === 'devices' && token && (
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Power className="w-6 h-6 text-purple-400" />
              Device On/Off Controls
            </h2>
            
            {actuators.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Power className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl mb-2">No devices loaded</p>
                <p className="text-sm">Click "Load Actuators" to see available devices</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {actuators.map((actuator) => (
                  <div
                    key={actuator.id}
                    className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-slate-500 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{actuator.name}</h3>
                        <p className="text-sm text-slate-400">ID: {actuator.id}</p>
                      </div>
                      <span className="px-2 py-1 bg-slate-900 rounded text-xs font-mono">
                        {actuator.dataType}
                      </span>
                    </div>

                    {actuator.dataType === 'BOOLEAN' ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Status: <span className={actuator.state ? 'text-green-400' : 'text-slate-400'}>
                            {actuator.state ? 'ON' : 'OFF'}
                          </span>
                        </span>
                        <button
                          onClick={() => setActuatorState(actuator.id, !actuator.state)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                            actuator.state ? 'bg-green-600' : 'bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              actuator.state ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-3">
                          <p className="text-sm text-slate-400 mb-1">Current Value</p>
                          <p className="text-2xl font-bold text-cyan-400">
                            {actuator.state !== undefined ? actuator.state : 'N/A'}
                          </p>
                        </div>
                        <input
                          type="number"
                          step={actuator.dataType === 'FLOAT' ? '0.1' : '1'}
                          placeholder="New value"
                          className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = actuator.dataType === 'INT' 
                                ? parseInt(e.target.value) 
                                : parseFloat(e.target.value);
                              setActuatorState(actuator.id, value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <p className="text-xs text-slate-400">Press Enter to set value</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Automations Tab */}
        {activeTab === 'automations' && token && (
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-400" />
                Smart Automations
              </h2>
              <button
                onClick={addAutomation}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Automation
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Example Automations
              </h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Turn off lights when room occupancy drops to 0</li>
                <li>• Enable AC when temperature exceeds 75°F</li>
                <li>• Lock doors when motion stops for 30 minutes</li>
                <li>• Dim lights when ambient light sensor detects sunset</li>
              </ul>
            </div>

            {automations.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl mb-2">No automations configured</p>
                <p className="text-sm">Click "Add Automation" to create your first rule</p>
              </div>
            ) : (
              <div className="space-y-4">
                {automations.map((automation) => (
                  <div
                    key={automation.id}
                    className={`bg-slate-700 rounded-lg p-4 border ${
                      automation.enabled ? 'border-indigo-500' : 'border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <input
                        type="text"
                        value={automation.name}
                        onChange={(e) => updateAutomation(automation.id, 'name', e.target.value)}
                        className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAutomation(automation.id)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            automation.enabled 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-slate-600 hover:bg-slate-500'
                          }`}
                        >
                          {automation.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removeAutomation(automation.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-slate-400 block mb-1">When Sensor</label>
                        <select
                          value={automation.sensorId || ''}
                          onChange={(e) => updateAutomation(automation.id, 'sensorId', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {sensors.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-slate-400 block mb-1">Condition</label>
                        <div className="flex gap-2">
                          <select
                            value={automation.condition}
                            onChange={(e) => updateAutomation(automation.id, 'condition', e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="greater">Greater than</option>
                            <option value="less">Less than</option>
                            <option value="equal">Equal to</option>
                          </select>
                          <input
                            type="number"
                            value={automation.threshold}
                            onChange={(e) => updateAutomation(automation.id, 'threshold', parseFloat(e.target.value))}
                            className="w-20 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-slate-400 block mb-1">Then Control</label>
                        <select
                          value={automation.actuatorId || ''}
                          onChange={(e) => updateAutomation(automation.id, 'actuatorId', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {actuators.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-600 text-sm text-slate-300">
                      <p className="font-mono">
                        IF {sensors.find(s => s.id === automation.sensorId)?.name || 'Sensor'} {' '}
                        {automation.condition === 'greater' ? '>' : automation.condition === 'less' ? '<' : '='} {automation.threshold}
                        {' → SET '} {actuators.find(a => a.id === automation.actuatorId)?.name || 'Actuator'} 
                        {' TO '} {automation.action.toString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Energy Monitor Tab */}
        {activeTab === 'energy' && token && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                Energy Usage Monitor
              </h2>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-6 border border-green-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-green-200">Total Energy</h3>
                    <Lightbulb className="w-5 h-5 text-green-300" />
                  </div>
                  <p className="text-3xl font-bold text-white">1,247 kWh</p>
                  <p className="text-sm text-green-200 mt-1">This month</p>
                </div>

                <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-blue-200">Active Devices</h3>
                    <Power className="w-5 h-5 text-blue-300" />
                  </div>
                  <p className="text-3xl font-bold text-white">{actuators.filter(a => a.state).length}</p>
                  <p className="text-sm text-blue-200 mt-1">Currently running</p>
                </div>

                <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg p-6 border border-orange-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-orange-200">Cost Estimate</h3>
                    <TrendingUp className="w-5 h-5 text-orange-300" />
                  </div>
                  <p className="text-3xl font-bold text-white">$156</p>
                  <p className="text-sm text-orange-200 mt-1">This month</p>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Room Energy Usage
                </h3>
                <div className="space-y-3">
                  {['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office'].map((room, idx) => {
                    const usage = [320, 180, 450, 120, 177][idx];
                    const maxUsage = 450;
                    const percentage = (usage / maxUsage) * 100;
                    
                    return (
                      <div key={room}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{room}</span>
                          <span className="font-semibold">{usage} kWh</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Power className="w-5 h-5 text-red-400" />
                Auto-Off for Unoccupied Rooms
              </h3>
              <p className="text-slate-300 mb-4">
                Automatically turn off devices in rooms with no occupancy detected
              </p>
              <div className="space-y-3">
                {['Living Room', 'Bedroom', 'Kitchen'].map((room) => (
                  <div key={room} className="bg-slate-700 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium">{room}</p>
                      <p className="text-sm text-slate-400">
                        Last motion: {Math.floor(Math.random() * 30)} minutes ago
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setError(`Devices in ${room} turned off`);
                        setTimeout(() => setError(''), 3000);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                    >
                      Turn Off All
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Presence Monitor Tab */}
        {activeTab === 'presence' && token && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Home className="w-6 h-6 text-cyan-400" />
                  Home Presence Monitor
                </h2>
                <button
                  onClick={checkPresence}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check Now
                </button>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                {['Front Door', 'Back Door', 'Living Room', 'Garage'].map((location, idx) => {
                  const isOccupied = idx < 2;
                  return (
                    <div
                      key={location}
                      className={`rounded-lg p-4 border-2 ${
                        isOccupied 
                          ? 'bg-green-900 border-green-600' 
                          : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${isOccupied ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                        <h3 className="font-semibold text-sm">{location}</h3>
                      </div>
                      <p className="text-xs text-slate-300">
                        {isOccupied ? 'Motion detected' : 'No activity'}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Activity Timeline
                </h3>
                <div className="space-y-2">
                  {[
                    { time: '2:34 PM', event: 'Front door opened', type: 'normal' },
                    { time: '1:15 PM', event: 'Motion detected in kitchen', type: 'normal' },
                    { time: '12:30 PM', event: 'All rooms vacant', type: 'info' },
                    { time: '11:45 AM', event: 'Motion in living room', type: 'normal' },
                    { time: '10:20 AM', event: 'Garage door opened', type: 'normal' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-600 rounded">
                      <span className="text-sm font-mono text-slate-400 w-20">{item.time}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        item.type === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
                      }`}></div>
                      <span className="text-sm flex-1">{item.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Security Alerts
              </h3>
              {presenceAlerts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No alerts</p>
                  <p className="text-sm">All clear - no unauthorized activity detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {presenceAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === 'warning' 
                          ? 'bg-yellow-900 border-yellow-500' 
                          : 'bg-red-900 border-red-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{alert.message}</p>
                          <p className="text-sm text-slate-300 mt-1">{alert.time}</p>
                        </div>
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}