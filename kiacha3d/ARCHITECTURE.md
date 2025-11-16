# KiachaOS 3D Engine - Architecture Document

## Overview

The KiachaOS 3D Engine is a professional-grade 3D visualization system with integrated voice, gesture, and touch control. It combines a Vulkan-based C++ renderer with Python-based AI autonomy and input recognition, exposed through a modern REST API and web UI.

```
┌─────────────────────────────────────────────────────────────┐
│                    Web UI (Three.js)                         │
│               (index.html + panel.js)                        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                    REST API (Flask)
                    :5000/api/*
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
    ┌────────────┐      ┌─────────────┐     ┌────────────┐
    │  C++ Core  │      │ Input Layer │     │     AI     │
    │            │      │             │     │  Autonomy  │
    │ - Vulkan   │      │ - Voice     │     │            │
    │ - Renderer │      │ - Gesture   │     │ - LLM      │
    │ - Scene    │      │ - Touch     │     │ - Planning │
    │ - Lighting │      │ - Raycast   │     │ - Control  │
    └────────────┘      └─────────────┘     └────────────┘
```

## Core Components

### 1. Renderer (C++ / Vulkan)

**Location**: `engine/renderer.hpp`, `engine/renderer.cpp`

**Responsibility**: High-performance 3D rendering with support for multiple lighting models, materials, and post-processing effects.

**Key Classes**:

```cpp
struct Camera {
    glm::vec3 position;
    glm::vec3 direction;
    float fov;           // Field of view in degrees
    float near, far;     // Clipping planes
};

struct Light {
    glm::vec3 position;
    glm::vec3 color;
    float intensity;
    float radius;        // For point lights
};

class Renderer {
    void initializeVulkan();
    void pan(float x, float y);
    void zoom(float factor);
    void rotate(float angleX, float angleY);
    void addLight(const Light& light);
    void updateMaterial(ObjectID id, const Material& mat);
    void setWireframe(bool enabled);
    void renderFrame();
};
```

**Rendering Pipeline**:
1. Scene traversal and frustum culling
2. Depth pass (shadow map generation)
3. Geometry pass (deferred rendering)
4. Lighting pass (Phong, PBR support)
5. Post-processing (bloom, tone mapping)
6. UI overlay rendering

### 2. Vulkan Backend

**Location**: `engine/vulkan_backend.hpp`, `engine/vulkan_backend.cpp`

**Responsibility**: Low-level Vulkan API management, device initialization, command recording, and resource management.

**Key Methods**:

```cpp
class VulkanBackend {
    void initializeDevice();
    VkBuffer createBuffer(size_t size, VkBufferUsageFlags usage);
    VkImage createImage(uint32_t width, uint32_t height, VkFormat format);
    void recordCommandBuffer(uint32_t index);
    void submitCommandBuffer(VkCommandBuffer buffer);
};
```

**Resource Management**:
- Command pools and buffers for command recording
- Synchronization primitives (semaphores, fences)
- Swapchain for presentation
- Descriptor pools for uniform bindings

### 3. Scene Manager

**Location**: `core/scene_manager.hpp`, `core/scene_manager.cpp`

**Responsibility**: Scene graph management, object lifecycle, transformations, and animation.

**Key Classes**:

```cpp
struct Transform {
    glm::vec3 position;
    glm::quat rotation;
    glm::vec3 scale;
    
    glm::mat4 getMatrix() const;
};

class SceneObject {
    ObjectID id;
    std::string name;
    Transform transform;
    Mesh mesh;
    Material material;
    
    void setPosition(const glm::vec3& pos);
    void rotate(const glm::quat& rot);
    void scale(float factor);
};

class SceneManager {
    ObjectID createObject(const std::string& name);
    void deleteObject(ObjectID id);
    SceneObject* getObject(ObjectID id);
    void updateTransform(ObjectID id, const Transform& t);
    
    // Picking
    ObjectID raycast(const glm::vec3& origin, const glm::vec3& direction);
    
    // Animation
    void queueAnimation(ObjectID id, const Animation& anim);
    void updateAnimations(float deltaTime);
};
```

**Scene Hierarchy**:
```
Root
├── Environment
│   ├── Lights
│   └── Sky
├── Models
│   ├── Model 1
│   ├── Model 2
│   └── Model N
└── UI Elements
    └── Overlays
```

### 4. Object Loader

**Location**: `core/object_loader.hpp`, `core/object_loader.cpp`

**Responsibility**: Loading and parsing 3D model files in various formats.

**Supported Formats**:
- **OBJ**: Complete parser with vertex, normal, and UV support
- **GLTF 2.0**: Extensible format with materials and animations
- **GLB**: Binary GLTF (planned expansion)

**Implementation**:

```cpp
class ObjectLoader {
    Mesh loadOBJ(const std::string& path);
    Mesh loadGLTF(const std::string& path);
    
private:
    void parseOBJ(std::ifstream& file, Mesh& mesh);
    void processFaces(const std::string& line, Mesh& mesh);
};
```

**Mesh Structure**:
```cpp
struct Mesh {
    std::vector<glm::vec3> vertices;
    std::vector<glm::vec3> normals;
    std::vector<glm::vec2> texCoords;
    std::vector<uint32_t> indices;
    
    BoundingBox calculateBounds();
};
```

### 5. Input System

**Location**: `input/voice.py`, `input/gesture.py`, `input/touch_handler.ts`

#### Voice Recognition

```python
class VoiceRecognizer(ABC):
    @abstractmethod
    def start_listening(self):
        pass
    
    @abstractmethod
    def stop_listening(self):
        pass

class WhisperRecognizer(VoiceRecognizer):
    # Uses OpenAI Whisper for high-accuracy speech-to-text
    
class VoskRecognizer(VoiceRecognizer):
    # Uses Vosk for lightweight offline recognition

class CommandParser:
    def parse(self, text: str) -> Dict[str, Any]:
        # "rotate 45 degrees around Y axis" 
        # → {"action": "rotate", "angle": 45, "axis": "Y"}
        pass
```

**Voice Patterns** (from `kiacha3d_commands.json`):
```json
{
  "voice_patterns": {
    "rotate": "rotate\\s+(\\d+)\\s*degrees?\\s*(?:around\\s+)?([xyz])?",
    "zoom": "zoom\\s+(in|out|\\d+)",
    "pan": "pan\\s+(left|right|up|down)",
    "light": "add\\s+light\\s+(?:at\\s+)?([\\d,\\s]+)"
  }
}
```

#### Gesture Recognition

```python
class GestureRecognizer:
    # Uses MediaPipe for hand landmark detection
    # Processes 21 landmarks per hand at 30 FPS
    
    GESTURES = {
        'PINCH': 'Thumb + index finger together',
        'GRAB': 'Closed fist',
        'POINT': 'Index finger extended',
        'PEACE': 'V sign',
        'THUMBS_UP': 'Thumb upward',
        'OK': 'O sign with thumb + index',
        'OPEN_PALM': 'All fingers extended',
        'CALL_ME': 'Thumb + pinky extended'
    }
```

#### Touch Handling

```typescript
class TouchHandler {
    // Multi-touch gesture recognition
    // Supports pinch, rotate, swipe, long-press
    
    events = {
        'tap': () => {},
        'long_press': () => {},
        'swipe': (direction) => {},
        'pinch': (scale) => {},
        'rotate': (angle) => {}
    };
}
```

### 6. REST API

**Location**: `api/kiacha3d_api.py`

**Base URL**: `http://localhost:5000`

**Endpoints**:

#### Scene Management
- `GET /api/scene` - Get scene info
- `GET /api/objects` - List all objects
- `POST /api/object` - Create object
- `GET /api/object/{id}` - Get object details
- `PUT /api/object/{id}` - Update object
- `DELETE /api/object/{id}` - Delete object

#### Camera Control
- `POST /api/camera/pan` - Pan camera
- `POST /api/camera/zoom` - Zoom camera
- `POST /api/camera/rotate` - Rotate camera
- `POST /api/camera/orbit` - Orbit around target
- `GET /api/camera` - Get camera state

#### Lighting
- `GET /api/lights` - List all lights
- `POST /api/light` - Create light
- `PUT /api/light/{id}` - Update light
- `DELETE /api/light/{id}` - Delete light

#### Model Management
- `POST /api/model/load` - Load model from file
- `PUT /api/model/{id}/rotate` - Rotate model
- `PUT /api/model/{id}/scale` - Scale model
- `PUT /api/model/{id}/position` - Position model

#### Rendering
- `POST /api/render/wireframe` - Toggle wireframe
- `POST /api/render/shadow-quality` - Set shadow quality
- `POST /api/render/post-process` - Toggle post-processing

#### AI Autonomy
- `POST /api/ai/autonomy` - Enable/disable AI control
- `GET /api/ai/suggest` - Get AI suggestions
- `POST /api/ai/command` - Execute AI command
- `GET /api/ai/status` - Get AI status

#### Voice & Gesture
- `POST /api/voice/start` - Start voice recognition
- `POST /api/voice/stop` - Stop voice recognition
- `GET /api/voice/last` - Get last recognized command
- `GET /api/gesture/last` - Get last recognized gesture

### 7. AI Autonomy System

**Location**: `api/kiacha3d_api.py` (AI module)

**Capabilities**:

```python
class AIAutonomy:
    def suggest_adjustments(self) -> List[Dict]:
        # Analyzes scene and suggests:
        # - Optimal camera angle for current content
        # - Lighting improvements
        # - Model orientations
        
    def execute_command(self, command: str) -> bool:
        # Parses natural language commands:
        # "Make it look dramatic" → Adjust lighting + camera
        # "Focus on details" → Zoom + increase ambient light
        
    def adapt_to_user(self, user_behavior: Dict) -> None:
        # Learns user preferences over time
```

**LLM Integration**:
- Optional integration with OpenAI GPT or local LLM (LLaMA)
- Uses embeddings for semantic understanding
- Maintains conversation context

## Data Flow

### User Interaction → Rendering

```
Touch/Voice/Gesture Input
        ↓
Input Processor (Python)
        ↓
Command Parser
        ↓
REST API Call to Engine
        ↓
Scene Update (C++)
        ↓
Vulkan Rendering
        ↓
Display Frame
```

### Example: "Rotate 45 degrees"

1. **Voice Recognition** (Python): "rotate 45 degrees" → text
2. **Command Parser**: Pattern match → `{action: 'rotate', angle: 45, axis: 'Y'}`
3. **REST API**: `POST /api/camera/rotate {angle: 45, axis: 'Y'}`
4. **Renderer**: Update camera matrix
5. **Vulkan Backend**: Re-record command buffer
6. **Display**: Next frame shows rotated view

## Threading Model

```
Main Thread (Vulkan Rendering)
├── Render loop (vsync)
├── Scene updates
└── UI rendering

Input Thread (Voice/Gesture)
├── Microphone polling
├── Hand tracking
├── Gesture recognition
└── API calls

AI Thread (Optional)
├── Autonomy suggestions
├── Command parsing
└── Learning updates
```

## Performance Characteristics

| Metric | Target | Typical |
|--------|--------|---------|
| FPS (1080p) | 60 | 85-120 |
| Memory | <500MB | 250MB |
| Load Model | <1s | 0.5-0.8s |
| Voice Latency | <500ms | 200-300ms |
| Gesture FPS | 30 | 30 |
| Touch Latency | <50ms | 16-33ms |

## Security Considerations

1. **Vulkan Backend**:
   - Validates all API calls
   - Proper memory synchronization
   - No buffer overflows

2. **Input Validation**:
   - Command injection prevention
   - Audio stream validation
   - Gesture data range checks

3. **API Security**:
   - CORS for web UI
   - Rate limiting on endpoints
   - Input sanitization

## Extension Points

### Adding New Gesture

```python
# In gesture.py
gestures = {
    'NEW_GESTURE': {
        'landmarks': [/* indices */],
        'threshold': 0.08,
        'callback': handle_new_gesture
    }
}
```

### Adding New Rendering Effect

```cpp
// In renderer.cpp
void Renderer::applyCustomEffect() {
    // Implement custom shader
    // Register in renderFrame()
}
```

### Adding New Input Source

```python
class CustomInputRecognizer:
    def recognize(self) -> Command:
        # Implement recognition logic
        return command
```

## Dependencies

### C++
- Vulkan SDK 1.2+
- GLM (header-only math library)
- CMake 3.16+

### Python
- Flask 2.3+
- Whisper (OpenAI speech recognition)
- Vosk (lightweight recognition)
- OpenCV (gesture support)
- MediaPipe (hand tracking)

### Web
- Three.js r128+
- TypeScript 5.0+
- HTML5/CSS3

## Build System

Uses CMake for C++ and pip for Python dependencies. See `setup.sh` for automated setup.

```bash
./setup.sh                    # Full setup
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release
source venv/bin/activate
python api/kiacha3d_api.py
```

## File Structure

```
kiacha3d/
├── CMakeLists.txt             # C++ build config
├── requirements.txt           # Python dependencies
├── setup.sh                   # Build script
├── engine/
│   ├── renderer.hpp
│   ├── renderer.cpp
│   ├── vulkan_backend.hpp
│   └── vulkan_backend.cpp
├── core/
│   ├── scene_manager.hpp
│   ├── scene_manager.cpp
│   ├── object_loader.hpp
│   └── object_loader.cpp
├── input/
│   ├── voice.py
│   ├── gesture.py
│   └── touch_handler.ts
├── api/
│   ├── kiacha3d_api.py
│   └── kiacha3d_commands.json
├── ui/
│   ├── index.html
│   ├── panel.js
│   └── three_ui.ts
├── tests/
│   ├── test_scene_manager.cpp
│   └── test_object_loader.cpp
└── README.md
```

## Version History

- **v2.0** (Current): Complete 3D engine with voice/gesture/touch
- **v1.0**: Basic renderer and scene management

## Contact & Support

For issues and feature requests, refer to the main KiachaOS project documentation.
