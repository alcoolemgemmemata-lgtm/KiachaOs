# KiachaOS 3D Engine - Testing Guide

## Overview

Comprehensive testing framework for the KiachaOS 3D Engine covering unit tests, integration tests, performance benchmarks, and quality assurance procedures.

## Test Structure

```
tests/
├── unit/
│   ├── test_renderer.cpp
│   ├── test_scene_manager.cpp
│   ├── test_object_loader.cpp
│   ├── test_voice.py
│   ├── test_gesture.py
│   └── test_api.py
├── integration/
│   ├── test_end_to_end.py
│   ├── test_voice_to_render.py
│   └── test_gesture_to_render.py
├── performance/
│   ├── benchmark_render.cpp
│   ├── benchmark_physics.cpp
│   └── profile_memory.py
└── fixtures/
    ├── models/
    │   ├── cube.obj
    │   ├── sphere.obj
    │   └── dragon.obj
    ├── audio/
    │   ├── rotate_45_degrees.wav
    │   └── zoom_in.wav
    └── images/
        ├── reference_output.png
        └── performance_baseline.txt
```

## Running Tests

### Prerequisites

```bash
# Install test dependencies
pip install pytest pytest-cov pytest-xdist

# C++ testing
# Requirements: CMake with BUILD_TESTING enabled
```

### Unit Tests

#### Python Tests

```bash
# All Python tests
pytest tests/unit/ -v

# Specific test file
pytest tests/unit/test_voice.py -v

# With coverage report
pytest tests/unit/ --cov=api --cov=input --cov-report=html

# Parallel execution
pytest tests/unit/ -n auto

# Specific test function
pytest tests/unit/test_voice.py::test_whisper_recognizer -v
```

#### C++ Tests

```bash
# Build with testing enabled
cmake -DBUILD_TESTING=ON -B build
cd build
cmake --build . --target all_tests

# Run CTest
ctest --verbose

# Run individual test
ctest -R test_scene_manager -V
```

### Integration Tests

```bash
# Start API server first
python api/kiacha3d_api.py &
sleep 2

# Run integration tests
pytest tests/integration/ -v

# Test specific workflow
pytest tests/integration/test_end_to_end.py::test_voice_command_full_pipeline -v

# Stop API server
pkill -f "python api/kiacha3d_api.py"
```

## Unit Tests

### Voice Recognition Tests

**File**: `tests/unit/test_voice.py`

```python
def test_whisper_recognizer_initialization():
    """Test Whisper recognizer initialization"""
    recognizer = WhisperRecognizer()
    assert recognizer is not None
    assert recognizer.model_size == "base"

def test_command_parser_rotation():
    """Test command parser for rotation commands"""
    parser = CommandParser()
    result = parser.parse("rotate 45 degrees")
    assert result['action'] == 'rotate'
    assert result['angle'] == 45

def test_vosk_recognizer_fallback():
    """Test Vosk fallback when Whisper unavailable"""
    recognizer = VoskRecognizer()
    assert recognizer is not None
    assert recognizer.is_offline

def test_voice_streaming():
    """Test continuous voice streaming"""
    recognizer = WhisperRecognizer()
    recognizer.start_listening()
    time.sleep(0.5)
    assert recognizer.is_listening
    recognizer.stop_listening()
    assert not recognizer.is_listening

def test_language_detection():
    """Test automatic language detection"""
    parser = CommandParser()
    result = parser.parse("gire 45 grados")  # Spanish
    assert result is not None  # Should still parse
```

### Gesture Recognition Tests

**File**: `tests/unit/test_gesture.py`

```python
def test_gesture_recognizer_initialization():
    """Test gesture recognizer initialization"""
    recognizer = GestureRecognizer()
    assert recognizer is not None
    assert recognizer.fps == 30

def test_pinch_gesture_detection():
    """Test pinch gesture recognition"""
    recognizer = GestureRecognizer()
    # Simulate landmarks for pinch gesture
    landmarks = create_pinch_landmarks()
    gesture = recognizer.recognize(landmarks)
    assert gesture == 'PINCH'

def test_grab_gesture_detection():
    """Test grab gesture recognition"""
    recognizer = GestureRecognizer()
    landmarks = create_grab_landmarks()
    gesture = recognizer.recognize(landmarks)
    assert gesture == 'GRAB'

def test_gesture_confidence_threshold():
    """Test gesture confidence filtering"""
    recognizer = GestureRecognizer(confidence_threshold=0.9)
    weak_gesture = create_weak_gesture_landmarks()
    gesture = recognizer.recognize(weak_gesture)
    assert gesture is None  # Below threshold

def test_all_nine_gestures():
    """Test all 9 supported gestures"""
    recognizer = GestureRecognizer()
    expected_gestures = [
        'PINCH', 'GRAB', 'POINT', 'PEACE', 'THUMBS_UP',
        'OK', 'OPEN_PALM', 'CALL_ME', 'ROCK'
    ]
    for gesture_name in expected_gestures:
        landmarks = create_gesture_landmarks(gesture_name)
        detected = recognizer.recognize(landmarks)
        assert detected == gesture_name
```

### Scene Manager Tests

**File**: `tests/unit/test_scene_manager.cpp`

```cpp
TEST(SceneManager, CreateObject) {
    SceneManager manager;
    ObjectID id = manager.createObject("test_object");
    EXPECT_NE(id, 0);
    
    SceneObject* obj = manager.getObject(id);
    EXPECT_NE(obj, nullptr);
    EXPECT_EQ(obj->name, "test_object");
}

TEST(SceneManager, TransformUpdate) {
    SceneManager manager;
    ObjectID id = manager.createObject("moving_object");
    
    Transform t;
    t.position = glm::vec3(1.0f, 2.0f, 3.0f);
    t.rotation = glm::quat(1.0f, 0.0f, 0.0f, 0.0f);
    t.scale = glm::vec3(2.0f);
    
    manager.updateTransform(id, t);
    
    SceneObject* obj = manager.getObject(id);
    EXPECT_EQ(obj->transform.position, glm::vec3(1.0f, 2.0f, 3.0f));
}

TEST(SceneManager, ObjectDeletion) {
    SceneManager manager;
    ObjectID id = manager.createObject("temp_object");
    EXPECT_NE(manager.getObject(id), nullptr);
    
    manager.deleteObject(id);
    EXPECT_EQ(manager.getObject(id), nullptr);
}

TEST(SceneManager, Raycast) {
    SceneManager manager;
    ObjectID id = manager.createObject("target_object");
    manager.getObject(id)->transform.position = glm::vec3(0, 0, -5);
    
    glm::vec3 origin(0, 0, 0);
    glm::vec3 direction(0, 0, -1);
    
    ObjectID hit = manager.raycast(origin, direction);
    EXPECT_EQ(hit, id);
}
```

### REST API Tests

**File**: `tests/unit/test_api.py`

```python
@pytest.fixture
def client():
    """Flask test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_api_scene_info(client):
    """Test /api/scene endpoint"""
    response = client.get('/api/scene')
    assert response.status_code == 200
    data = response.get_json()
    assert 'object_count' in data['data']
    assert 'triangle_count' in data['data']

def test_api_create_object(client):
    """Test /api/object POST endpoint"""
    response = client.post('/api/object', json={
        'name': 'test_cube',
        'type': 'model',
        'geometry': 'cube'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['data']['id'] is not None

def test_api_error_handling(client):
    """Test error response format"""
    response = client.get('/api/object/invalid_id')
    assert response.status_code == 404
    data = response.get_json()
    assert data['status'] == 'error'
    assert 'error' in data

def test_api_cors_headers(client):
    """Test CORS headers"""
    response = client.get('/api/scene')
    assert 'Access-Control-Allow-Origin' in response.headers
```

## Integration Tests

### End-to-End Voice to Rendering

**File**: `tests/integration/test_voice_to_render.py`

```python
def test_voice_command_rotation_applied():
    """Test voice command → parse → API → render"""
    # 1. Start API
    api_process = subprocess.Popen(['python', 'api/kiacha3d_api.py'])
    time.sleep(1)
    
    try:
        # 2. Get initial state
        response = requests.get('http://localhost:5000/api/camera')
        initial_pos = response.json()['data']['position']
        
        # 3. Simulate voice command
        recognizer = WhisperRecognizer()
        parser = CommandParser()
        command = parser.parse("rotate 45 degrees")
        
        # 4. Execute API call
        response = requests.post(
            'http://localhost:5000/api/camera/rotate',
            json={'angle_x': command['angle'], 'angle_y': 0}
        )
        assert response.status_code == 200
        
        # 5. Verify state changed
        response = requests.get('http://localhost:5000/api/camera')
        final_pos = response.json()['data']['position']
        assert initial_pos != final_pos
        
    finally:
        api_process.terminate()
        api_process.wait()

def test_gesture_command_applied():
    """Test gesture recognition → API → scene update"""
    api_process = subprocess.Popen(['python', 'api/kiacha3d_api.py'])
    time.sleep(1)
    
    try:
        # Simulate pinch gesture
        recognizer = GestureRecognizer()
        landmarks = create_pinch_landmarks()
        gesture = recognizer.recognize(landmarks)
        
        # Execute corresponding API call
        response = requests.post(
            'http://localhost:5000/api/camera/zoom',
            json={'factor': 0.9}
        )
        assert response.status_code == 200
        
    finally:
        api_process.terminate()
        api_process.wait()
```

### Model Loading Pipeline

```python
def test_obj_model_loading_pipeline():
    """Test complete OBJ loading: file → parse → GPU → render"""
    loader = ObjectLoader()
    
    # 1. Load OBJ file
    mesh = loader.loadOBJ('tests/fixtures/models/cube.obj')
    assert len(mesh.vertices) > 0
    assert len(mesh.indices) > 0
    
    # 2. Upload to GPU
    renderer = Renderer()
    obj_id = renderer.addMesh(mesh)
    assert obj_id > 0
    
    # 3. Render and verify
    frame = renderer.renderFrame()
    assert frame is not None
    assert frame.size > 0

def test_gltf_model_loading():
    """Test GLTF model loading with materials"""
    loader = ObjectLoader()
    mesh = loader.loadGLTF('tests/fixtures/models/sample.gltf')
    assert mesh.vertices.size() > 0
    assert hasattr(mesh, 'materials')
```

## Performance Tests

### Rendering Performance

**File**: `tests/performance/benchmark_render.cpp`

```cpp
BENCHMARK(Renderer_RenderFrame) {
    Renderer renderer;
    renderer.initializeVulkan();
    
    for (int i = 0; i < 100; i++) {
        renderer.renderFrame();
    }
    // Target: < 16ms per frame (60 FPS)
}

BENCHMARK(SceneManager_ObjectCreation) {
    SceneManager manager;
    
    for (int i = 0; i < 1000; i++) {
        manager.createObject("obj_" + std::to_string(i));
    }
    // Target: < 10ms for 1000 objects
}

BENCHMARK(ObjectLoader_OBJParsing) {
    ObjectLoader loader;
    
    auto mesh = loader.loadOBJ("tests/fixtures/models/dragon.obj");
    // Target: < 500ms for complex models
}
```

### Memory Profiling

**File**: `tests/performance/profile_memory.py`

```python
def test_memory_usage():
    """Profile memory usage during scene operations"""
    import tracemalloc
    
    tracemalloc.start()
    
    # Create scene with many objects
    renderer = Engine3DUI()
    for i in range(100):
        renderer.createObject(f"object_{i}")
    
    current, peak = tracemalloc.get_traced_memory()
    print(f"Current: {current / 1024 / 1024:.1f} MB")
    print(f"Peak: {peak / 1024 / 1024:.1f} MB")
    
    assert peak < 500 * 1024 * 1024  # < 500 MB

def test_frame_timing():
    """Measure frame rendering time"""
    renderer = Engine3DUI()
    
    frame_times = []
    for _ in range(60):
        start = time.perf_counter()
        renderer.animate()
        elapsed = (time.perf_counter() - start) * 1000
        frame_times.append(elapsed)
    
    avg_frame_time = sum(frame_times) / len(frame_times)
    assert avg_frame_time < 16.67  # 60 FPS target
    
    print(f"Average frame time: {avg_frame_time:.2f}ms")
```

### Load Testing

```python
def test_api_load():
    """Test API under load"""
    api_process = subprocess.Popen(['python', 'api/kiacha3d_api.py'])
    time.sleep(1)
    
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            
            # Submit 100 requests
            for i in range(100):
                future = executor.submit(
                    requests.get,
                    'http://localhost:5000/api/scene'
                )
                futures.append(future)
            
            # Check results
            successful = sum(1 for f in futures if f.result().status_code == 200)
            assert successful == 100
            
    finally:
        api_process.terminate()
```

## Quality Assurance

### Code Coverage

```bash
# C++ coverage
cmake -DCMAKE_CXX_FLAGS="--coverage" -B build
cd build
cmake --build .
ctest
lcov --capture --directory . --output-file coverage.info
genhtml coverage.info --output-directory coverage_report
# View: coverage_report/index.html

# Python coverage
pytest tests/ --cov=api --cov=input --cov-report=html
# View: htmlcov/index.html
```

### Static Analysis

```bash
# C++ linting
clang-tidy engine/*.cpp -- -I. -I/usr/include/vulkan

# Python linting
flake8 api/ input/ tests/
pylint api/ input/
mypy api/ input/

# Security scanning
bandit -r api/ input/
```

### Performance Profiling

```bash
# Linux profiling
perf record ./build/kiacha3d
perf report

# Valgrind memory check
valgrind --leak-check=full ./build/kiacha3d

# Flamegraph
perf record -g ./build/kiacha3d
perf script | stackcollapse-perf.pl | flamegraph.pl > flamegraph.svg
```

## Test Fixtures

### Model Files

Located in `tests/fixtures/models/`:
- `cube.obj` - Simple cube (8 vertices, 12 triangles)
- `sphere.obj` - UV sphere (significant geometry)
- `dragon.obj` - Complex model for stress testing

### Audio Files

Located in `tests/fixtures/audio/`:
- `rotate_45_degrees.wav` - "rotate 45 degrees" utterance
- `zoom_in.wav` - "zoom in" utterance

### Reference Images

Located in `tests/fixtures/images/`:
- `reference_output.png` - Expected rendering output
- `performance_baseline.txt` - Reference performance numbers

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: sudo apt-get install -y vulkan-tools libvulkan-dev libglm-dev
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install Python deps
        run: pip install -r requirements.txt pytest
      - name: Run tests
        run: |
          cd build
          ctest --verbose
          pytest ../tests/unit/ -v
```

## Performance Targets

| Metric | Target | Pass Criteria |
|--------|--------|---------------|
| Frame Time (1080p) | 16.67ms | ≤ 20ms |
| Memory Usage | 250MB | ≤ 400MB |
| Model Load (OBJ) | 500ms | ≤ 1000ms |
| Voice Latency | 300ms | ≤ 500ms |
| Touch Response | 30ms | ≤ 50ms |
| Gesture FPS | 30 FPS | ≥ 25 FPS |
| API Response | 100ms | ≤ 200ms |

## Reporting Issues

When reporting test failures, include:
1. OS and version
2. Hardware specs (GPU model, CPU, RAM)
3. Test output and stack trace
4. Steps to reproduce
5. Performance metrics if applicable

## Contributing Tests

Guidelines for adding tests:
1. Follow existing test structure
2. Use descriptive test names
3. Add docstrings explaining test purpose
4. Ensure tests are deterministic
5. Clean up resources (files, processes)
6. Aim for >80% code coverage

## Test Execution Summary

```bash
#!/bin/bash
# Run all tests with reporting

echo "Running C++ Unit Tests..."
cd build && ctest --verbose && cd ..

echo "Running Python Unit Tests..."
pytest tests/unit/ -v --cov=api --cov=input

echo "Starting API server for integration tests..."
python api/kiacha3d_api.py &
API_PID=$!
sleep 2

echo "Running Integration Tests..."
pytest tests/integration/ -v

kill $API_PID

echo "All tests completed!"
```

## Further Reading

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design
- [BUILD.md](BUILD.md) - Build instructions
- [API_REFERENCE.md](API_REFERENCE.md) - API documentation

---

**Last Updated**: January 2024
