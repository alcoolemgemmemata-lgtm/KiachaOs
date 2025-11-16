// KiachaOS 3D Engine - UI Panel Controller
// Manages Three.js scene, API communication, and user input

const API_BASE = 'http://localhost:5000';

class Engine3DUI {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas'),
            antialias: true,
            alpha: true 
        });
        
        this.setupRenderer();
        this.setupScene();
        this.setupControls();
        this.setupPerformanceMonitoring();
        this.setupVoiceControl();
        this.setupGestureControl();
        
        // Animation loop
        this.animate();
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        this.renderer.setClearColor(0x0f3460, 1);
        
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupScene() {
        // Default lighting
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);
        
        this.mainLight = new THREE.DirectionalLight(0xffffff, 1);
        this.mainLight.position.set(10, 20, 10);
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.width = 2048;
        this.mainLight.shadow.mapSize.height = 2048;
        this.scene.add(this.mainLight);
        
        // Grid helper
        const gridHelper = new THREE.GridHelper(50, 50, 0x00d4ff, 0x0099ff);
        this.scene.add(gridHelper);
        
        // Default cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ color: 0x00d4ff });
        this.defaultCube = new THREE.Mesh(geometry, material);
        this.defaultCube.castShadow = true;
        this.defaultCube.receiveShadow = true;
        this.scene.add(this.defaultCube);
        
        // Camera position
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        
        // Store scene state
        this.sceneObjects = new Map();
        this.sceneObjects.set('default-cube', this.defaultCube);
    }
    
    setupControls() {
        // Camera zoom control
        document.getElementById('camera-zoom').addEventListener('input', (e) => {
            const zoom = parseFloat(e.target.value);
            const currentDir = this.camera.position.clone().normalize();
            this.camera.position.copy(currentDir.multiplyScalar(5 * (1 / zoom)));
        });
        
        // FOV control
        document.getElementById('camera-fov').addEventListener('input', (e) => {
            this.camera.fov = parseFloat(e.target.value);
            this.camera.updateProjectionMatrix();
        });
        
        // Ambient light control
        document.getElementById('ambient-intensity').addEventListener('input', (e) => {
            this.ambientLight.intensity = parseFloat(e.target.value);
        });
        
        // Light color control
        document.getElementById('light-color').addEventListener('input', (e) => {
            this.mainLight.color.setHex(parseInt(e.target.value.substring(1), 16));
        });
        
        // Wireframe toggle
        document.getElementById('wireframe-mode').addEventListener('change', (e) => {
            this.sceneObjects.forEach(obj => {
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(mat => mat.wireframe = e.target.checked);
                    } else {
                        obj.material.wireframe = e.target.checked;
                    }
                }
            });
        });
        
        // Shadow quality
        document.getElementById('shadow-quality').addEventListener('change', (e) => {
            const quality = parseInt(e.target.value);
            this.updateShadowQuality(quality);
        });
        
        // AI autonomy
        document.getElementById('ai-level').addEventListener('input', (e) => {
            window.currentAILevel = parseFloat(e.target.value);
        });
        
        // AI enabled toggle
        document.getElementById('ai-enabled').addEventListener('change', (e) => {
            window.aiEnabled = e.target.checked;
            if (e.target.checked) {
                this.startAIControl();
            }
        });
        
        // Touch input for camera control
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.renderer.domElement.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            
            this.rotateCamera(deltaX * 0.01, deltaY * 0.01);
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        // Pinch zoom
        let lastDistance = 0;
        this.renderer.domElement.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 2) return;
            
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (lastDistance) {
                const scale = distance / lastDistance;
                this.zoomCamera(1 / scale);
            }
            
            lastDistance = distance;
        });
        
        this.renderer.domElement.addEventListener('touchend', () => {
            lastDistance = 0;
        });
    }
    
    setupVoiceControl() {
        const voiceIndicator = document.getElementById('voice-indicator');
        let isListening = false;
        
        voiceIndicator.addEventListener('click', async () => {
            isListening = !isListening;
            voiceIndicator.classList.toggle('listening', isListening);
            
            if (isListening) {
                try {
                    const response = await fetch(`${API_BASE}/voice/start`);
                    if (!response.ok) console.error('Voice start failed');
                } catch (e) {
                    console.error('Voice API error:', e);
                }
            } else {
                try {
                    const response = await fetch(`${API_BASE}/voice/stop`);
                    if (!response.ok) console.error('Voice stop failed');
                } catch (e) {
                    console.error('Voice API error:', e);
                }
            }
        });
    }
    
    setupGestureControl() {
        const gestureIndicator = document.getElementById('gesture-indicator');
        
        // Polling gesture recognition from API
        setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE}/gesture/last`);
                const data = await response.json();
                
                if (data.gesture) {
                    gestureIndicator.textContent = `🎮 ${data.gesture}`;
                    gestureIndicator.classList.add('active');
                    
                    setTimeout(() => {
                        gestureIndicator.classList.remove('active');
                        gestureIndicator.textContent = '🎮 No gesture';
                    }, 500);
                    
                    this.handleGestureCommand(data.gesture);
                }
            } catch (e) {
                // API not available yet
            }
        }, 500);
    }
    
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = Date.now();
        
        setInterval(() => {
            const now = Date.now();
            const fps = Math.round((frameCount * 1000) / (now - lastTime));
            document.getElementById('fps').textContent = fps;
            document.getElementById('object-count').textContent = this.scene.children.length;
            
            let triangles = 0;
            this.scene.traverse(obj => {
                if (obj.geometry) {
                    triangles += obj.geometry.attributes.position.count / 3;
                }
            });
            document.getElementById('triangle-count').textContent = Math.round(triangles);
            
            // Memory usage (if available)
            if (performance.memory) {
                const mb = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
                document.getElementById('memory').textContent = mb + ' MB';
            }
            
            frameCount = 0;
            lastTime = now;
        }, 1000);
    }
    
    rotateCamera(angleX, angleY) {
        const current = this.camera.position;
        const radius = current.length();
        const theta = Math.atan2(current.z, current.x);
        const phi = Math.acos(current.y / radius);
        
        const newTheta = theta + angleX;
        const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + angleY));
        
        this.camera.position.x = radius * Math.sin(newPhi) * Math.cos(newTheta);
        this.camera.position.y = radius * Math.cos(newPhi);
        this.camera.position.z = radius * Math.sin(newPhi) * Math.sin(newTheta);
        this.camera.lookAt(0, 0, 0);
    }
    
    zoomCamera(factor) {
        const current = this.camera.position;
        this.camera.position.multiplyScalar(factor);
    }
    
    handleGestureCommand(gesture) {
        switch(gesture) {
            case 'PINCH':
                this.zoomCamera(0.9);
                break;
            case 'GRAB':
                this.zoomCamera(1.1);
                break;
            case 'POINT':
                this.defaultCube.rotation.z += 0.1;
                break;
            case 'PEACE':
                this.defaultCube.rotation.x += 0.1;
                break;
            case 'THUMBS_UP':
                this.defaultCube.scale.multiplyScalar(1.1);
                break;
        }
    }
    
    updateShadowQuality(quality) {
        const sizes = [512, 1024, 2048, 4096];
        const size = sizes[quality] || 2048;
        
        this.mainLight.shadow.mapSize.width = size;
        this.mainLight.shadow.mapSize.height = size;
    }
    
    async loadModel(url) {
        try {
            const response = await fetch(`${API_BASE}/model/load`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Model loaded:', data);
                // TODO: Parse and add to Three.js scene
            }
        } catch (e) {
            console.error('Model loading failed:', e);
        }
    }
    
    async startAIControl() {
        try {
            const response = await fetch(`${API_BASE}/ai/autonomy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: true,
                    level: window.currentAILevel || 0.5
                })
            });
            
            if (response.ok) {
                console.log('AI autonomy started');
                this.aiControlLoop();
            }
        } catch (e) {
            console.error('AI autonomy start failed:', e);
        }
    }
    
    async aiControlLoop() {
        if (!window.aiEnabled) return;
        
        try {
            const response = await fetch(`${API_BASE}/ai/suggest`);
            const data = await response.json();
            
            if (data.suggestions) {
                data.suggestions.forEach(suggestion => {
                    this.executeCommand(suggestion);
                });
            }
        } catch (e) {
            console.error('AI suggestions failed:', e);
        }
        
        setTimeout(() => this.aiControlLoop(), 1000);
    }
    
    executeCommand(command) {
        // Execute command from API
        if (command.type === 'camera') {
            if (command.action === 'rotate') {
                this.rotateCamera(command.x || 0, command.y || 0);
            } else if (command.action === 'zoom') {
                this.zoomCamera(command.factor || 1);
            }
        } else if (command.type === 'model') {
            if (command.action === 'rotate') {
                this.defaultCube.rotation.x += command.x || 0;
                this.defaultCube.rotation.y += command.y || 0;
                this.defaultCube.rotation.z += command.z || 0;
            }
        }
    }
    
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate default cube slowly
        if (this.defaultCube) {
            this.defaultCube.rotation.x += 0.001;
            this.defaultCube.rotation.y += 0.002;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Global functions for HTML onclick handlers
function loadModelDialog() {
    const url = prompt('Enter model URL (OBJ, GLTF, GLB):');
    if (url) window.engine3d.loadModel(url);
}

function resetScene() {
    window.location.reload();
}

function aiSuggest() {
    fetch(`${API_BASE}/ai/suggest`)
        .then(r => r.json())
        .then(data => {
            alert('AI Suggestions:\n' + JSON.stringify(data.suggestions, null, 2));
        })
        .catch(e => alert('Error: ' + e.message));
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    window.engine3d = new Engine3DUI();
    window.currentAILevel = 0.5;
    window.aiEnabled = false;
});
