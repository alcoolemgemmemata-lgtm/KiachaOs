#!/usr/bin/env python3
"""
voice.py - Voice recognition and command processing for KiachaOS 3D Engine

Supports:
- Whisper (OpenAI) - accurate but heavier
- Vosk - lightweight, offline
- PaddleSpeech - alternative lightweight option

Integrates with LLM for semantic understanding of commands.
"""

import json
import threading
import queue
from typing import Optional, Callable, Dict, Any
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class VoiceCommand:
    """Represents a parsed voice command"""
    action: str  # 'rotate', 'zoom', 'load', 'animate', etc.
    target: Optional[str] = None  # object name or 'camera'
    parameters: Dict[str, Any] = None  # {axis: 'x', degrees: 45, ...}
    confidence: float = 1.0
    raw_text: str = ""
    
    def __post_init__(self):
        if self.parameters is None:
            self.parameters = {}


class VoiceRecognizer:
    """Abstract base class for voice recognition backends"""
    
    def __init__(self, language: str = "en-US"):
        self.language = language
        self.is_listening = False
        self.command_queue: queue.Queue = queue.Queue()
        self.callbacks: list[Callable] = []
        
    def start_listening(self):
        """Start voice recognition in background thread"""
        raise NotImplementedError
        
    def stop_listening(self):
        """Stop voice recognition"""
        raise NotImplementedError
        
    def get_command(self, timeout: Optional[float] = None) -> Optional[VoiceCommand]:
        """Get next recognized command from queue"""
        try:
            return self.command_queue.get(timeout=timeout)
        except queue.Empty:
            return None
            
    def register_callback(self, callback: Callable[[VoiceCommand], None]):
        """Register callback for when commands are recognized"""
        self.callbacks.append(callback)
        
    def notify_callbacks(self, command: VoiceCommand):
        """Notify all registered callbacks"""
        for callback in self.callbacks:
            try:
                callback(command)
            except Exception as e:
                logger.error(f"Callback error: {e}")


class WhisperRecognizer(VoiceRecognizer):
    """OpenAI Whisper backend - accurate but requires installation"""
    
    def __init__(self, language: str = "en-US", model: str = "base"):
        super().__init__(language)
        try:
            import whisper
            self.whisper = whisper
            self.model = whisper.load_model(model)
            logger.info(f"[Whisper] Loaded {model} model")
        except ImportError:
            logger.warning("Whisper not installed: pip install openai-whisper")
            self.model = None
            
    def start_listening(self):
        """Start listening with Whisper"""
        if not self.model:
            logger.error("Whisper model not loaded")
            return
            
        logger.info("[Whisper] Starting microphone listening...")
        self.is_listening = True
        
        def listen_thread():
            import sounddevice as sd
            import soundfile as sf
            
            try:
                # Record 5 second chunks
                duration = 5
                samplerate = 16000
                
                while self.is_listening:
                    logger.info("[Whisper] Recording...")
                    audio = sd.rec(int(duration * samplerate), samplerate=samplerate, channels=1)
                    sd.wait()
                    
                    # Transcribe
                    result = self.model.transcribe(audio, language=self.language[:2])
                    text = result.get('text', '').strip()
                    
                    if text:
                        logger.info(f"[Whisper] Recognized: {text}")
                        command = self._parse_command(text)
                        self.command_queue.put(command)
                        self.notify_callbacks(command)
                        
            except Exception as e:
                logger.error(f"[Whisper] Error: {e}")
                
        thread = threading.Thread(target=listen_thread, daemon=True)
        thread.start()
        
    def stop_listening(self):
        """Stop listening"""
        self.is_listening = False
        logger.info("[Whisper] Stopped listening")
        
    def _parse_command(self, text: str) -> VoiceCommand:
        """Parse natural language command"""
        text_lower = text.lower()
        
        # Simple keyword matching (can be enhanced with LLM)
        if 'rotate' in text_lower or 'turn' in text_lower or 'spin' in text_lower:
            # Extract angle if present
            import re
            angle_match = re.search(r'(\d+)\s*deg', text_lower)
            degrees = int(angle_match.group(1)) if angle_match else 45
            
            return VoiceCommand(
                action='rotate',
                target='camera' if 'camera' in text_lower else 'object',
                parameters={'degrees': degrees},
                raw_text=text
            )
            
        elif 'zoom' in text_lower or 'close' in text_lower or 'far' in text_lower:
            factor = 1.1 if 'in' in text_lower or 'close' in text_lower else 0.9
            return VoiceCommand(
                action='zoom',
                target='camera',
                parameters={'factor': factor},
                raw_text=text
            )
            
        elif 'load' in text_lower or 'open' in text_lower:
            return VoiceCommand(
                action='load_model',
                parameters={'filename': text},
                raw_text=text
            )
            
        elif 'light' in text_lower or 'illuminate' in text_lower:
            return VoiceCommand(
                action='lighting',
                parameters={'mode': 'on' if 'on' in text_lower else 'off'},
                raw_text=text
            )
            
        elif 'wireframe' in text_lower:
            return VoiceCommand(
                action='wireframe',
                parameters={'enabled': 'on' in text_lower},
                raw_text=text
            )
            
        elif 'animate' in text_lower:
            return VoiceCommand(
                action='animate',
                parameters={'duration': 3.0},
                raw_text=text
            )
            
        else:
            return VoiceCommand(
                action='unknown',
                raw_text=text,
                confidence=0.5
            )


class VoskRecognizer(VoiceRecognizer):
    """Vosk backend - lightweight, offline"""
    
    def __init__(self, language: str = "en-US"):
        super().__init__(language)
        try:
            from vosk import Model, KaldiRecognizer
            import pyaudio
            self.Model = Model
            self.KaldiRecognizer = KaldiRecognizer
            self.pyaudio = pyaudio
            logger.info("[Vosk] Initialized")
        except ImportError:
            logger.warning("Vosk not installed: pip install vosk pyaudio")
            
    def start_listening(self):
        """Start listening with Vosk"""
        logger.info("[Vosk] Starting listening...")
        self.is_listening = True
        
        def listen_thread():
            try:
                model = self.Model("model")  # Requires model download
                recognizer = self.KaldiRecognizer(model, 16000)
                
                mic = self.pyaudio.PyAudio()
                stream = mic.open(format=self.pyaudio.paFloat32, channels=1, 
                                 rate=16000, input=True, frames_per_buffer=4096)
                
                while self.is_listening:
                    data = stream.read(4096)
                    
                    if recognizer.AcceptWaveform(data):
                        result = json.loads(recognizer.Result())
                        text = result.get('result', [{}])[0].get('conf', 0)
                        
                        if text:
                            logger.info(f"[Vosk] Recognized: {text}")
                            command = self._parse_command(text)
                            self.command_queue.put(command)
                            self.notify_callbacks(command)
                            
            except Exception as e:
                logger.error(f"[Vosk] Error: {e}")
                
        thread = threading.Thread(target=listen_thread, daemon=True)
        thread.start()
        
    def stop_listening(self):
        self.is_listening = False
        
    def _parse_command(self, text: str) -> VoiceCommand:
        """Parse Vosk command - reuse from Whisper"""
        # Same parsing logic
        return WhisperRecognizer()._parse_command(text)


class CommandParser:
    """Parse and interpret commands using LLM if available"""
    
    @staticmethod
    def parse(text: str, use_llm: bool = False) -> VoiceCommand:
        """Parse text command with optional LLM enhancement"""
        if use_llm:
            try:
                import openai
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[{
                        "role": "system",
                        "content": "You are a command parser for a 3D visualization engine. Parse: " + text,
                    }],
                    temperature=0.2,
                )
                # Parse response and extract command
                logger.info(f"[LLM] Response: {response}")
            except Exception as e:
                logger.warning(f"LLM parsing failed: {e}")
                
        # Fallback to simple parsing
        recognizer = WhisperRecognizer()
        return recognizer._parse_command(text)


# Example usage
if __name__ == "__main__":
    logger.info("[Voice Module] Testing...")
    
    # Test command parsing
    test_commands = [
        "rotate the object 45 degrees",
        "zoom in",
        "load model castle.obj",
        "turn on lighting",
        "animate for 3 seconds",
        "show wireframe"
    ]
    
    recognizer = WhisperRecognizer()
    for cmd in test_commands:
        parsed = recognizer._parse_command(cmd)
        logger.info(f"Command: '{cmd}' -> Action: {parsed.action}, Params: {parsed.parameters}")
