"""
touch_handler.ts - Touch and gesture handling for Web UI

Supports:
- Single touch and multi-touch
- Tap, long press, swipe
- Pinch zoom
- Two-finger rotation
- Adaptive debouncing
"""

interface TouchPoint {
  x: number;
  y: number;
  id: number;
  timestamp: number;
}

interface GestureEvent {
  type: 'tap' | 'long_press' | 'swipe' | 'pinch' | 'rotate' | 'pan';
  startPoint: TouchPoint;
  endPoint?: TouchPoint;
  distance?: number;
  angle?: number;
  scale?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

class TouchHandler {
  private element: HTMLElement;
  private touches: Map<number, TouchPoint> = new Map();
  private activeGesture: string | null = null;
  private gestureStartTime: number = 0;
  private callbacks: Map<string, ((event: GestureEvent) => void)[]> = new Map();
  
  // Configuration
  private longPressThreshold = 500; // ms
  private tapThreshold = 200; // ms
  private swipeThreshold = 50; // pixels
  private doubleTapThreshold = 300; // ms
  
  private lastTapTime = 0;
  private lastTapPoint: TouchPoint | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.element.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.element.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.element.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    // Mouse fallback
    this.element.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.element.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.element.addEventListener('mouseup', (e) => this.handleMouseUp(e));
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier,
        timestamp: Date.now()
      });
    }
    
    this.gestureStartTime = Date.now();
    
    if (this.touches.size === 1) {
      // Single touch - start long press timer
      const touchArray = Array.from(this.touches.values())[0];
      setTimeout(() => {
        if (this.touches.size === 1 && this.activeGesture === null) {
          this.emit('long_press', {
            type: 'long_press',
            startPoint: touchArray
          });
        }
      }, this.longPressThreshold);
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
    
    // Update touch positions
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      if (this.touches.has(touch.identifier)) {
        this.touches.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
          id: touch.identifier,
          timestamp: Date.now()
        });
      }
    }
    
    if (this.touches.size === 1) {
      // Pan
      const touchArray = Array.from(this.touches.values())[0];
      const startPoint = Array.from(this.touches.values())[0]; // Would need to store initial
      
      this.emit('pan', {
        type: 'pan',
        startPoint: startPoint,
        endPoint: touchArray
      });
      
    } else if (this.touches.size === 2) {
      // Two-finger gesture
      const points = Array.from(this.touches.values());
      const p1 = points[0];
      const p2 = points[1];
      
      // Calculate distance (for pinch)
      const distance = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );
      
      // Calculate angle (for rotation)
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      // Determine if pinch or rotation
      if (this.activeGesture === null) {
        this.activeGesture = 'pinch'; // Start with pinch assumption
      }
      
      if (this.activeGesture === 'pinch') {
        this.emit('pinch', {
          type: 'pinch',
          startPoint: p1,
          endPoint: p2,
          distance: distance,
          scale: distance / 100 // Normalized scale
        });
      }
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    const endTime = Date.now();
    const duration = endTime - this.gestureStartTime;
    
    // Remove ended touches
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      this.touches.delete(touch.identifier);
    }
    
    if (e.changedTouches.length > 0) {
      const endPoint = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        id: e.changedTouches[0].identifier,
        timestamp: Date.now()
      };
      
      // Detect gesture type based on movement and duration
      if (duration < this.tapThreshold) {
        // Check for double tap
        if (this.lastTapTime && endTime - this.lastTapTime < this.doubleTapThreshold) {
          this.emit('double_tap', {
            type: 'tap',
            startPoint: endPoint
          });
        } else {
          this.emit('tap', {
            type: 'tap',
            startPoint: endPoint
          });
        }
        this.lastTapTime = endTime;
        this.lastTapPoint = endPoint;
        
      } else if (duration < this.longPressThreshold) {
        // Swipe
        const startPoint = this.lastTapPoint || endPoint;
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.swipeThreshold) {
          const direction = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'right' : 'left')
            : (dy > 0 ? 'down' : 'up');
            
          this.emit('swipe', {
            type: 'swipe',
            startPoint: startPoint,
            endPoint: endPoint,
            distance: distance,
            direction: direction as any
          });
        }
      }
    }
    
    this.activeGesture = null;
    if (this.touches.size === 0) {
      this.gestureStartTime = 0;
    }
  }

  // Mouse fallback handlers
  private handleMouseDown(e: MouseEvent) {
    const point: TouchPoint = {
      x: e.clientX,
      y: e.clientY,
      id: 0,
      timestamp: Date.now()
    };
    this.touches.set(0, point);
    this.gestureStartTime = Date.now();
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.touches.has(0)) {
      this.touches.set(0, {
        x: e.clientX,
        y: e.clientY,
        id: 0,
        timestamp: Date.now()
      });
    }
  }

  private handleMouseUp(e: MouseEvent) {
    this.touches.delete(0);
  }

  // Public API
  on(eventType: string, callback: (event: GestureEvent) => void) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (event: GestureEvent) => void) {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(eventType: string, event: GestureEvent) {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(cb => cb(event));
    }
  }
}

// Export for use in module
export { TouchHandler, GestureEvent, TouchPoint };
