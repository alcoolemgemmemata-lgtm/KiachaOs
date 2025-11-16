#!/usr/bin/env python3
"""
gesture.py - Gesture and hand recognition for KiachaOS 3D Engine

Uses:
- OpenCV + MediaPipe for hand tracking
- Gesture recognition (pinch, point, grab, peace, thumbs_up, etc.)
- Real-time processing at 30 FPS
"""

import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, List, Callable
from dataclasses import dataclass
from enum import Enum
import threading
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GestureType(Enum):
    """Recognized gesture types"""
    NONE = "none"
    POINT = "point"
    PINCH = "pinch"
    GRAB = "grab"
    PEACE = "peace"
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    OPEN_PALM = "open_palm"
    FIST = "fist"
    OK = "ok"


@dataclass
class GestureData:
    """Gesture information"""
    gesture: GestureType
    confidence: float
    hand_position: tuple  # (x, y)
    hand_landmarks: Optional[List] = None
    is_left_hand: bool = False


class GestureRecognizer:
    """Recognize hand gestures from webcam"""
    
    def __init__(self, camera_id: int = 0, fps: int = 30):
        self.camera_id = camera_id
        self.fps = fps
        self.is_running = False
        self.callbacks: List[Callable] = []
        
        # Initialize MediaPipe Hands
        try:
            self.mp_hands = mp.solutions.hands
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=2,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.mp_drawing = mp.solutions.drawing_utils
            self.mp_drawing_styles = mp.solutions.drawing_styles
            logger.info("[GestureRecognizer] MediaPipe Hands initialized")
        except ImportError:
            logger.warning("MediaPipe not installed: pip install mediapipe opencv-python")
            self.hands = None
            
    def start(self):
        """Start gesture recognition from webcam"""
        if not self.hands:
            logger.error("MediaPipe not available")
            return
            
        logger.info("[GestureRecognizer] Starting...")
        self.is_running = True
        
        def capture_thread():
            cap = cv2.VideoCapture(self.camera_id)
            cap.set(cv2.CAP_PROP_FPS, self.fps)
            
            while self.is_running:
                ret, frame = cap.read()
                if not ret:
                    break
                    
                # Process frame
                frame = cv2.flip(frame, 1)
                h, w, c = frame.shape
                
                # Detect hands
                results = self.hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                
                if results.multi_hand_landmarks:
                    for hand_landmarks, handedness in zip(results.multi_hand_landmarks, 
                                                         results.multi_handedness):
                        # Recognize gesture
                        gesture = self._recognize_gesture(hand_landmarks)
                        is_left = handedness.classification[0].label == "Left"
                        
                        # Get hand position (wrist)
                        wrist = hand_landmarks.landmark[0]
                        position = (int(wrist.x * w), int(wrist.y * h))
                        
                        gesture_data = GestureData(
                            gesture=gesture,
                            confidence=handedness.classification[0].score,
                            hand_position=position,
                            hand_landmarks=hand_landmarks,
                            is_left_hand=is_left
                        )
                        
                        # Notify callbacks
                        for callback in self.callbacks:
                            try:
                                callback(gesture_data)
                            except Exception as e:
                                logger.error(f"Callback error: {e}")
                        
                        # Draw on frame (optional debug)
                        self.mp_drawing.draw_landmarks(
                            frame,
                            hand_landmarks,
                            self.mp_hands.HAND_CONNECTIONS,
                            self.mp_drawing_styles.get_default_hand_landmarks_style(),
                            self.mp_drawing_styles.get_default_hand_connections_style()
                        )
                
                # Display (optional)
                # cv2.imshow('Gesture Recognition', frame)
                # if cv2.waitKey(1) & 0xFF == ord('q'):
                #     break
                    
            cap.release()
            cv2.destroyAllWindows()
            
        thread = threading.Thread(target=capture_thread, daemon=True)
        thread.start()
        
    def stop(self):
        """Stop gesture recognition"""
        self.is_running = False
        logger.info("[GestureRecognizer] Stopped")
        
    def register_callback(self, callback: Callable[[GestureData], None]):
        """Register callback for gesture events"""
        self.callbacks.append(callback)
        
    def _recognize_gesture(self, landmarks) -> GestureType:
        """Recognize gesture from hand landmarks"""
        # Extract key landmark positions
        landmarks_np = np.array([[lm.x, lm.y, lm.z] for lm in landmarks.landmark])
        
        # Finger landmarks indices:
        # Thumb: 3, 4
        # Index: 6, 7, 8
        # Middle: 10, 11, 12
        # Ring: 14, 15, 16
        # Pinky: 18, 19, 20
        # Palm: 0 (wrist), 5, 9, 13, 17, 21
        
        thumb_tip = landmarks_np[4]
        index_tip = landmarks_np[8]
        middle_tip = landmarks_np[12]
        ring_tip = landmarks_np[16]
        pinky_tip = landmarks_np[20]
        
        # Finger distances from palm
        palm = landmarks_np[0]
        thumb_dist = np.linalg.norm(thumb_tip - palm)
        index_dist = np.linalg.norm(index_tip - palm)
        middle_dist = np.linalg.norm(middle_tip - palm)
        ring_dist = np.linalg.norm(ring_tip - palm)
        pinky_dist = np.linalg.norm(pinky_tip - palm)
        
        # Thumb-index distance (for pinch detection)
        pinch_dist = np.linalg.norm(thumb_tip - index_tip)
        
        # Recognize patterns
        fingers_up = [thumb_dist, index_dist, middle_dist, ring_dist, pinky_dist]
        threshold = 0.08  # Adjust based on calibration
        
        # Count extended fingers
        extended = sum(1 for d in fingers_up if d > threshold)
        
        # Pinch detection
        if pinch_dist < 0.04:
            return GestureType.PINCH
            
        # Open palm
        if extended == 5:
            return GestureType.OPEN_PALM
            
        # Fist
        if extended == 0:
            return GestureType.FIST
            
        # Point (index extended, others closed)
        if extended == 1 and index_dist > threshold:
            return GestureType.POINT
            
        # Peace (index + middle extended)
        if extended == 2 and index_dist > threshold and middle_dist > threshold:
            return GestureType.PEACE
            
        # OK (thumb + index pinched, others extended)
        if pinch_dist < 0.05 and extended >= 3:
            return GestureType.OK
            
        # Thumbs up
        if thumb_dist > threshold and extended <= 1:
            return GestureType.THUMBS_UP
            
        return GestureType.NONE


# Example usage
if __name__ == "__main__":
    logger.info("[Gesture Recognition] Testing...")
    
    recognizer = GestureRecognizer()
    
    def on_gesture(data: GestureData):
        if data.gesture != GestureType.NONE:
            logger.info(f"Gesture detected: {data.gesture.value} (confidence: {data.confidence:.2f})")
            
    recognizer.register_callback(on_gesture)
    
    try:
        recognizer.start()
        import time
        time.sleep(30)  # Run for 30 seconds
        recognizer.stop()
    except KeyboardInterrupt:
        recognizer.stop()
