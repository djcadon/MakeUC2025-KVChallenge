// Frontend will use React as the package and lucide-chart

import React, { useState, useEffect } from 'react';
import { ChartBar } from 'lucide-react';



export default function KineticVisionDashboard() {

    const [sensors, setSensors] = useState([]);
    const [actuators, setActuators] = useState([]);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [selectedActuator, setSelectedActuator] = useState(null);
    const [sensorData, setSensorData] = useState([]);
    const [actuatorData, setActuatorData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');



    const API_BASE = 'http://127.0.0.1:8000';


    //Fetch all sensors
    const get_all_sensors = async () => {

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/api/all/sensors`, {

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
    const get_all_actuators = async () => {
       
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/api/all/actuators`, {
                
            });
            const data = await response.json();
            setActuators(data.data);
        } catch (err) {
            setError('Failed to fetch actuators: ' + err.message);
        } finally {
            setLoading(false);
        }
    };


    //get actuator by id

    const get_actuator_by_id = async (actuator_id) => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch(`${API_BASE}/api/actuator/${actuator_id}`);
            const data = await response.json();

            setActuatorData(data)
        } catch (err) {
            setError('Failed to fetch actuators: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch sensor by sensor_id 
    const get_sensor_by_id = async (sensor_id) => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE}/api/sensors/${sensor_id}`);
            const data = await response.json();

            setSensorData(data);
        } catch (err) {
            setError('Failed to fetch sensor data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };



    // Query sensor sample
    const query_sensor_sample = async (sensor_id) => {
        setLoading(true);
        setError('')

        try {
            const response = await fetch(`${API_BASE}/api/sensors/sample/${sensor_id}`);
            const data = await response.json

            setSensorData(data);
        } catch (err) {
            setError('Failed to fetch sensor data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

   

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Kinetic Vision Dashboard - API Testing</h1>

            {/* Loading and Error Messages */}
            {loading && <div style={{ color: 'blue', marginBottom: '10px' }}>Loading...</div>}
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {/* Function Test Buttons */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={get_all_sensors}
                    style={{ padding: '10px 20px', marginRight: '10px', marginBottom: '10px' }}
                >
                    GET ALL SENSORS
                </button>
                <button
                    onClick={get_all_actuators}
                    style={{ padding: '10px 20px', marginRight: '10px', marginBottom: '10px' }}
                >
                    GET ALL ACTUATORS
                </button>
                <button
                    onClick={() => selectedSensor && get_sensor_by_id(selectedSensor)}
                    disabled={!selectedSensor}
                    style={{ padding: '10px 20px', marginRight: '10px', marginBottom: '10px' }}
                >
                    GET SENSOR BY ID
                </button>

                <button
                    onClick={() => selectedSensor && query_sensor_sample(selectedSensor)}
                    disabled={!selectedSensor}
                    style={{ padding: '10px 20px', marginRight: '10px', marginBottom: '10px' }}
                > GET SENSOR SAMPLE
                </button>
                <button
                    onClick={() => selectedActuator && get_actuator_by_id(selectedActuator)}
                    disabled={!selectedActuator}
                    style={{ padding: '10px 20px', marginRight: '10px', marginBottom: '10px' }}
                > Get actuator by id
                </button>

            </div>

            {/* Sensor Selection */}
            <div style={{ marginBottom: '20px' }}>
                <label>Enter Sensor ID: </label>
                <input
                    type="int"
                    placeholder="e.g., sensor_123"
                    value={selectedSensor || ''}
                    onChange={(e) => setSelectedSensor(e.target.value)}
                    style={{ padding: '8px', marginLeft: '10px', width: '200px' }}
                />

                <input
                    type="int"
                    placeholder="e.g., actuator"
                    value={selectedActuator || ''}
                    onChange={(e) => setSelectedActuator(e.target.value)}
                    style={{ padding: '8px', marginLeft: '10px', width: '200px' }}
                />

                {selectedSensor && (
                    <span style={{ marginLeft: '10px', color: 'green' }}>
                        ✓ Sensor ID: {selectedSensor}
                    </span>
                )}
            </div>
                   

            {/* Sensors Display */}
            {sensors.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h2>✅ Sensors ({sensors.length})</h2>
                    <pre style={{ padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
                        {JSON.stringify(sensors, null, 2)}
                    </pre>
                </div>
            )}

            {/* Actuators Display */}
            {actuators.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h2>✅ Actuators ({actuators.length})</h2>
                    <pre style={{padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
                        {JSON.stringify(actuators, null, 2)}
                    </pre>
                </div>
            )}

            {sensorData && (
                <div style={{ marginBottom: '20px' }}>
                    <h2>✅ Sensor Data for ID: {selectedSensor}</h2>
                    <pre style={{ padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
                        {JSON.stringify(sensorData, null, 2)}
                    </pre>
                </div>
            )}

            {actuatorData && (
                <div style={{ marginBottom: '20px' }}>
                    <h2>✅ Sensor Data for ID: {selectedSensor}</h2>
                    <pre style={{ padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
                        {JSON.stringify(actuatorData, null, 2)}
                    </pre>
                </div>
            )}

            {/* Results Summary */}
            <div style={{ marginTop: '30px', padding: '15px', borderRadius: '5px' }}>
                <h3>Test Results Summary:</h3>
                <ul>
                    <li>Sensors fetched: {sensors.length > 0 ? '✅ Success' : '⏳ Not tested yet'}</li>
                    <li>Actuators fetched: {actuators.length > 0 ? '✅ Success' : '⏳ Not tested yet'}</li>
                            
                </ul>
            </div>
        </div>
    )
        };