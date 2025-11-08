# MakeUC2025-KVChallenge
KV IoT challenge




1. API Overview
Core Concepts
The API manages two types of smart devices:

Sensors: Read-only devices that record data over time
Actuators: Write-enabled devices that you can control (which may affect sensor readings)

Contact Information

Name: Scott Fasone
Email: sfasone@kinetic-vision.com
License: MIT


2. Authentication System
How Authentication Works

All /api/v1/* endpoints require Bearer token authentication
Tokens must be included in HTTP Authorization header: Authorization: Bearer <token>
Teams have a limited number of tokens

Authentication Endpoints
A. Generate Token - POST /api/auth/token

Purpose: Create a new authentication token
Query Parameter: team (string, required) - team name for tracking
Response:

token (string) - the authentication token
expiresAt (ISO datetime) - when token expires


Note: Token should last the entire hackathon

B. Revoke Token - POST /api/auth/revoke

Purpose: Free up token slots if you're running out
Header: authorization (string, required) - the token to revoke
Response: Confirmation message


3. General Endpoints
Server Status - GET /

Purpose: Health check to verify server is running
Response: {"status": "OK"}


4. Sensor Endpoints (Read-Only Data)
A. List All Sensors - GET /api/v1/sensors/

Purpose: Get a list of all available sensors
Response Structure:

maxCount: Total number of sensors
offset: Current pagination offset
limit: Page size
data: Array of sensor objects

id (integer): Unique sensor ID
dataType (enum): "INT" or "FLOAT"
name (string): Sensor name with location info





B. Get Sensor Details - GET /api/v1/sensors/{id}

Purpose: Get specific sensor info including its latest reading
Path Parameter: id (integer, required)
Response:

id: Sensor ID
dataType: "INT" or "FLOAT"
name: Sensor name
lastSample: Most recent reading (or null)

timestamp (number): Unix epoch time (fractional)
value (number): The sensor reading





C. Query Sensor Samples - GET /api/v1/sensors/{id}/samples

Purpose: Retrieve historical sensor data with filtering and pagination
Path Parameter: id (integer, required)
Query Parameters:

skip (integer, required, default: 0): Pagination offset
limit (integer, required, default: 60, max: 2000): Results per page
before (number, optional): Filter samples before this Unix timestamp
after (number, optional): Filter samples after this Unix timestamp
sort (enum, required, default: "desc"): "asc" or "desc" by timestamp


Response:

maxCount: Total matching samples
offset: Current offset
limit: Page size
data: Array of samples

timestamp (number): Unix epoch time
value (number): Sensor reading





D. Stream Sensor Samples - WS /api/v1/sensors/{id}/samples/live

Purpose: WebSocket endpoint for real-time sensor data streaming
Path Parameter: id (integer, required)
Note: This is a WebSocket connection, not a regular HTTP endpoint


5. Actuator Endpoints (Controllable Devices)
A. List All Actuators - GET /api/v1/actuators/

Purpose: Get a list of all available actuators
Response Structure:

maxCount: Total number of actuators
offset: Current pagination offset
limit: Page size
data: Array of actuator objects

id (integer): Unique actuator ID
dataType (enum): "INT", "FLOAT", or "BOOLEAN"
name (string): Actuator name





B. Get Actuator Details - GET /api/v1/actuators/{id}

Purpose: Get specific actuator info including current state
Path Parameter: id (integer, required)
Response:

id: Actuator ID
dataType: "INT", "FLOAT", or "BOOLEAN"
name: Actuator name
state: Current actuator value (integer, float, or boolean)



C. Set Actuator State - PUT /api/v1/actuators/{id}/state

Purpose: Control an actuator by setting its state
Path Parameter: id (integer, required)
Request Body: Raw value (integer, float, or boolean) matching the actuator's dataType
Content Types Supported:

application/json
application/x-www-form-urlencoded
multipart/form-data


Response: Returns updated actuator details including new state


6. Key Data Types & Constraints
Timestamps

Format: Fractional Unix epoch time (seconds since 1970-01-01, with decimals)
Example: 1730419200.123

Sensor Data Types

INT: Integer values
FLOAT: Floating-point values

Actuator Data Types

INT: Integer values (range: -9007199254740991 to 9007199254740991)
FLOAT: Floating-point values
BOOLEAN: true/false values

Pagination Limits

Sensor samples: Max 2000 per request
Integer IDs: Max safe integer (9007199254740991)


7. Important Notes

Authentication Required: All /api/v1/* endpoints need a Bearer token
Token Limits: Teams have limited tokens - revoke unused ones
WebSocket Support: Real-time sensor data available via WebSocket
Actuators Can Affect Sensors: Changing actuator states may impact sensor readings
Timestamps: All timestamps use fractional Unix epoch time
Pagination: Use skip/limit for sensor samples, supports up to 2000 records per request


This is a well-structured IoT/sensor data API designed for a hackathon challenge where teams can read sensor data and control actuators in a simulated or real smart device environment.