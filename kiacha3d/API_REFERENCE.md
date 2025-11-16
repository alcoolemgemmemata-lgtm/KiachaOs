# KiachaOS 3D Engine - REST API Reference

## Overview

The KiachaOS 3D Engine exposes a comprehensive REST API on `http://localhost:5000` for controlling all aspects of the 3D scene, rendering, and AI autonomy.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Currently no authentication required. In production, add:
- API key validation
- JWT token support
- CORS origin whitelisting

## Response Format

All responses are JSON with the following structure:

### Success Response

```json
{
  "status": "success",
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:45Z"
}
```

### Error Response

```json
{
  "status": "error",
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:45Z"
}
```

## Endpoints

### Scene Management

#### GET /api/scene
Get overall scene information.

**Response:**
```json
{
  "status": "success",
  "data": {
    "object_count": 42,
    "light_count": 3,
    "triangle_count": 125000,
    "bounds": {
      "min": {"x": -50, "y": -50, "z": -50},
      "max": {"x": 50, "y": 50, "z": 50}
    }
  }
}
```

---

#### GET /api/objects
List all objects in the scene.

**Query Parameters:**
- `limit` (optional, default: 100): Maximum objects to return
- `offset` (optional, default: 0): Pagination offset
- `type` (optional): Filter by object type (model, light, etc.)

**Response:**
```json
{
  "status": "success",
  "data": {
    "objects": [
      {
        "id": "obj_001",
        "name": "cube_1",
        "type": "model",
        "position": {"x": 0, "y": 0, "z": 0},
        "scale": 1.0
      }
    ],
    "total": 42,
    "limit": 100,
    "offset": 0
  }
}
```

---

#### POST /api/object
Create a new object in the scene.

**Request Body:**
```json
{
  "name": "sphere_1",
  "type": "model",
  "geometry": "sphere",
  "position": {"x": 0, "y": 0, "z": 0},
  "scale": 1.0,
  "material": {
    "color": "#00d4ff",
    "roughness": 0.5,
    "metallic": 0.2
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "obj_042",
    "name": "sphere_1",
    "created_at": "2024-01-15T10:30:45Z"
  }
}
```

---

#### GET /api/object/{id}
Get detailed information about a specific object.

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "obj_001",
    "name": "cube_1",
    "type": "model",
    "position": {"x": 0, "y": 0, "z": 0},
    "rotation": {"x": 0, "y": 0, "z": 0},
    "scale": 1.0,
    "material": {
      "color": "#00d4ff",
      "roughness": 0.5,
      "metallic": 0.2
    },
    "mesh": {
      "vertices": 8,
      "triangles": 12,
      "bounds": {
        "min": {"x": -1, "y": -1, "z": -1},
        "max": {"x": 1, "y": 1, "z": 1}
      }
    }
  }
}
```

---

#### PUT /api/object/{id}
Update object properties.

**Request Body:**
```json
{
  "name": "cube_renamed",
  "position": {"x": 5, "y": 0, "z": 0},
  "rotation": {"x": 0, "y": 45, "z": 0},
  "scale": 2.0
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "obj_001",
    "updated_properties": ["position", "rotation", "scale"]
  }
}
```

---

#### DELETE /api/object/{id}
Remove an object from the scene.

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "obj_001",
    "removed": true
  }
}
```

---

### Camera Control

#### GET /api/camera
Get current camera state.

**Response:**
```json
{
  "status": "success",
  "data": {
    "position": {"x": 5, "y": 5, "z": 5},
    "target": {"x": 0, "y": 0, "z": 0},
    "fov": 45,
    "near": 0.1,
    "far": 1000
  }
}
```

---

#### POST /api/camera/pan
Pan the camera.

**Request Body:**
```json
{
  "x": 1.0,
  "y": 0.5
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "new_position": {"x": 6, "y": 5.5, "z": 5}
  }
}
```

---

#### POST /api/camera/zoom
Zoom camera (adjust distance from target).

**Request Body:**
```json
{
  "factor": 1.2
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "zoom_factor": 1.2,
    "new_distance": 6.0
  }
}
```

---

#### POST /api/camera/rotate
Rotate camera around target.

**Request Body:**
```json
{
  "angle_x": 15,
  "angle_y": 30
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "new_position": {"x": 6.2, "y": 4.1, "z": 3.8}
  }
}
```

---

#### POST /api/camera/orbit
Orbit camera around a specific point.

**Request Body:**
```json
{
  "target": {"x": 0, "y": 0, "z": 0},
  "angle_x": 45,
  "angle_y": 30,
  "distance": 10
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "orbiting": true,
    "new_position": {"x": 7.07, "y": 5, "z": 7.07}
  }
}
```

---

### Lighting

#### GET /api/lights
List all lights in the scene.

**Response:**
```json
{
  "status": "success",
  "data": {
    "lights": [
      {
        "id": "light_001",
        "type": "directional",
        "position": {"x": 10, "y": 20, "z": 10},
        "color": "#ffffff",
        "intensity": 1.0,
        "cast_shadow": true
      }
    ]
  }
}
```

---

#### POST /api/light
Create a new light.

**Request Body:**
```json
{
  "type": "point",
  "position": {"x": 5, "y": 10, "z": 5},
  "color": "#ff0000",
  "intensity": 0.8,
  "radius": 50,
  "cast_shadow": true
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "light_002",
    "type": "point",
    "created_at": "2024-01-15T10:30:45Z"
  }
}
```

---

#### PUT /api/light/{id}
Update light properties.

**Request Body:**
```json
{
  "intensity": 1.5,
  "color": "#00ff00"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "light_001",
    "updated": true
  }
}
```

---

#### DELETE /api/light/{id}
Remove a light.

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "light_002",
    "removed": true
  }
}
```

---

### Model Management

#### POST /api/model/load
Load a 3D model from file.

**Request Body:**
```json
{
  "url": "/models/teapot.obj",
  "name": "teapot",
  "position": {"x": 0, "y": 0, "z": 0},
  "scale": 1.0
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "obj_043",
    "name": "teapot",
    "file_format": "obj",
    "vertices": 12000,
    "loading_time_ms": 245
  }
}
```

---

#### PUT /api/model/{id}/rotate
Rotate a model.

**Request Body:**
```json
{
  "x": 15,
  "y": 30,
  "z": 45
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "obj_043",
    "new_rotation": {"x": 15, "y": 30, "z": 45}
  }
}
```

---

#### PUT /api/model/{id}/scale
Scale a model.

**Request Body:**
```json
{
  "factor": 2.0
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "obj_043",
    "new_scale": 2.0
  }
}
```

---

#### PUT /api/model/{id}/position
Change model position.

**Request Body:**
```json
{
  "x": 10,
  "y": 5,
  "z": -5
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "obj_043",
    "new_position": {"x": 10, "y": 5, "z": -5}
  }
}
```

---

### Rendering Control

#### POST /api/render/wireframe
Toggle wireframe mode.

**Request Body:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "wireframe_enabled": true
  }
}
```

---

#### POST /api/render/shadow-quality
Set shadow map quality.

**Request Body:**
```json
{
  "quality": "high"
}
```

**Values**: `off`, `low`, `medium`, `high`

**Response:**
```json
{
  "status": "success",
  "data": {
    "shadow_quality": "high",
    "map_size": 4096
  }
}
```

---

#### POST /api/render/post-process
Enable post-processing effects.

**Request Body:**
```json
{
  "bloom": true,
  "bloom_threshold": 0.8,
  "bloom_strength": 1.5,
  "tone_mapping": "aces"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "post_processing": {
      "bloom": true,
      "tone_mapping": "aces"
    }
  }
}
```

---

### Voice Recognition

#### POST /api/voice/start
Start voice recognition.

**Response:**
```json
{
  "status": "success",
  "data": {
    "listening": true,
    "engine": "whisper"
  }
}
```

---

#### POST /api/voice/stop
Stop voice recognition.

**Response:**
```json
{
  "status": "success",
  "data": {
    "listening": false
  }
}
```

---

#### GET /api/voice/last
Get the last recognized voice command.

**Response:**
```json
{
  "status": "success",
  "data": {
    "text": "rotate 45 degrees",
    "confidence": 0.95,
    "timestamp": "2024-01-15T10:30:45Z",
    "command": {
      "action": "rotate",
      "angle": 45,
      "axis": "Y"
    }
  }
}
```

---

### Gesture Recognition

#### GET /api/gesture/last
Get the last recognized gesture.

**Response:**
```json
{
  "status": "success",
  "data": {
    "gesture": "PINCH",
    "confidence": 0.92,
    "landmarks": {
      "hand_1": [[x1, y1, z1], [x2, y2, z2], ...]
    },
    "timestamp": "2024-01-15T10:30:45Z"
  }
}
```

---

### AI Autonomy

#### POST /api/ai/autonomy
Enable/disable AI autonomous control.

**Request Body:**
```json
{
  "enabled": true,
  "level": 0.7
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "ai_enabled": true,
    "autonomy_level": 0.7
  }
}
```

---

#### GET /api/ai/suggest
Get AI-generated suggestions for scene improvements.

**Response:**
```json
{
  "status": "success",
  "data": {
    "suggestions": [
      {
        "category": "camera",
        "action": "rotate",
        "parameters": {"angle_x": 10, "angle_y": 5},
        "reason": "Better view of central object"
      },
      {
        "category": "lighting",
        "action": "adjust_intensity",
        "parameters": {"light_id": "light_001", "intensity": 1.2},
        "reason": "Increase dramatic effect"
      }
    ]
  }
}
```

---

#### POST /api/ai/command
Execute a natural language command.

**Request Body:**
```json
{
  "command": "Make the scene look dramatic"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "interpreted": "Adjust lighting for dramatic effect",
    "actions_taken": 3,
    "details": [
      "Increased main light intensity to 1.5",
      "Added red accent light",
      "Adjusted camera angle"
    ]
  }
}
```

---

#### GET /api/ai/status
Get current AI autonomy status.

**Response:**
```json
{
  "status": "success",
  "data": {
    "enabled": true,
    "autonomy_level": 0.7,
    "mode": "ambient",
    "last_action": "2024-01-15T10:30:45Z",
    "total_actions": 42
  }
}
```

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| OBJECT_NOT_FOUND | 404 | Specified object ID doesn't exist |
| INVALID_PARAMETERS | 400 | Request parameters are invalid |
| FILE_NOT_FOUND | 404 | Model file not found |
| PARSING_ERROR | 422 | Error parsing model file |
| VULKAN_ERROR | 500 | Vulkan rendering error |
| AI_UNAVAILABLE | 503 | AI service not available |
| INVALID_JSON | 400 | Malformed JSON request |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Rate Limiting

Current implementation: No rate limiting. For production, consider:

```json
{
  "X-RateLimit-Limit": 1000,
  "X-RateLimit-Remaining": 999,
  "X-RateLimit-Reset": "2024-01-15T11:00:00Z"
}
```

---

## Streaming Responses

Voice and gesture endpoints support Server-Sent Events (SSE) for real-time updates:

```bash
curl -N http://localhost:5000/api/gesture/stream
```

Returns:
```
data: {"gesture":"PINCH","confidence":0.92}
data: {"gesture":"GRAB","confidence":0.88}
```

---

## Examples

### Load Model and Rotate

```bash
# Load model
RESPONSE=$(curl -X POST http://localhost:5000/api/model/load \
  -H "Content-Type: application/json" \
  -d '{"url":"/models/cube.obj","name":"my_cube"}')

ID=$(echo $RESPONSE | jq -r '.data.id')

# Rotate it
curl -X PUT http://localhost:5000/api/model/$ID/rotate \
  -H "Content-Type: application/json" \
  -d '{"x":45,"y":0,"z":0}'
```

### Voice-Controlled Camera

```bash
# Start listening
curl -X POST http://localhost:5000/api/voice/start

# Wait for voice command...

# Get result
curl http://localhost:5000/api/voice/last

# System automatically applies: rotate 45 degrees
```

### AI-Assisted Scene Setup

```bash
# Enable AI autonomy
curl -X POST http://localhost:5000/api/ai/autonomy \
  -H "Content-Type: application/json" \
  -d '{"enabled":true,"level":0.8}'

# Get suggestions
curl http://localhost:5000/api/ai/suggest

# AI recommends camera angle, lighting, etc.
```

---

## WebSocket Support (Planned)

Real-time scene updates via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:5000/api/scene/stream');
ws.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

---

## CORS Policy

Current CORS settings:
- **Allowed Origins**: `http://localhost:*`, `http://127.0.0.1:*`
- **Allowed Methods**: GET, POST, PUT, DELETE
- **Allowed Headers**: Content-Type, Authorization
- **Max Age**: 86400 seconds

---

## Authentication (Future)

```bash
# Include API key
curl -H "X-API-Key: your-key-here" http://localhost:5000/api/scene

# Or JWT token
curl -H "Authorization: Bearer token" http://localhost:5000/api/scene
```

---

## Monitoring & Metrics

Performance metrics available at:

```bash
GET /api/metrics
```

Response:
```json
{
  "fps": 85,
  "memory_mb": 245,
  "api_requests_total": 1243,
  "api_latency_ms": 12.5,
  "triangles_rendered": 125000
}
```

---

## Version

**Current Version**: 2.0.0
**API Version**: v1
**Last Updated**: 2024-01-15
