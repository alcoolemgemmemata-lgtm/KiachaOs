#!/usr/bin/env python3
"""
KIACHA OS - Multimodal Perception Engine (Python)

Modelos:
  - YOLOv8: Visão computacional e detecção de objetos
  - OCR: Reconhecimento óptico de caracteres
  - Whisper: Speech-to-text (ASR)
  - Piper: Text-to-speech (TTS)
  - BGE/GTE: Embeddings semânticos

Conecta-se ao Brain via IPC/REST API
"""

import os
import sys
import json
import asyncio
import numpy as np
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# IMPORTAÇÕES CONDICIONAIS (instaladas via pip)
# ============================================================================

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("YOLOv8 not installed: pip install ultralytics")

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    logger.warning("Whisper not installed: pip install openai-whisper")

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    logger.warning("PIL not installed: pip install pillow")

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not installed: pip install opencv-python")

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("sentence-transformers not installed: pip install sentence-transformers")

# ============================================================================
# ESTRUTURAS DE DADOS
# ============================================================================

@dataclass
class VisionDetection:
    """Resultado de detecção de objeto"""
    class_name: str
    confidence: float
    bbox: Tuple[float, float, float, float]  # x1, y1, x2, y2
    area: float
    
    def to_dict(self) -> Dict:
        return {
            'class_name': self.class_name,
            'confidence': float(self.confidence),
            'bbox': self.bbox,
            'area': float(self.area)
        }

@dataclass
class VisionResult:
    """Resultado completo de análise de visão"""
    timestamp: datetime
    image_shape: Tuple[int, int, int]
    detections: List[VisionDetection]
    confidence_threshold: float
    processing_time_ms: float
    
    def to_dict(self) -> Dict:
        return {
            'timestamp': self.timestamp.isoformat(),
            'image_shape': self.image_shape,
            'detections': [d.to_dict() for d in self.detections],
            'confidence_threshold': self.confidence_threshold,
            'processing_time_ms': self.processing_time_ms,
            'detection_count': len(self.detections)
        }

@dataclass
class AudioTranscription:
    """Resultado de transcrição de áudio"""
    text: str
    language: str
    confidence: float
    duration_seconds: float
    processing_time_ms: float
    
    def to_dict(self) -> Dict:
        return {
            'text': self.text,
            'language': self.language,
            'confidence': self.confidence,
            'duration_seconds': self.duration_seconds,
            'processing_time_ms': self.processing_time_ms
        }

@dataclass
class Embedding:
    """Vetor de embedding semântico"""
    text: str
    vector: List[float]
    model: str
    dimension: int
    
    def to_dict(self) -> Dict:
        return {
            'text': self.text,
            'model': self.model,
            'dimension': self.dimension,
            'vector_norm': float(np.linalg.norm(self.vector))
        }

# ============================================================================
# MOTOR DE VISÃO (YOLO v8)
# ============================================================================

class VisionEngine:
    """Engine de visão computacional usando YOLOv8"""
    
    def __init__(self, model_name: str = 'yolov8n.pt', device: str = 'cpu'):
        self.model_name = model_name
        self.device = device
        self.model = None
        
        if YOLO_AVAILABLE:
            try:
                logger.info(f"Loading YOLOv8 model: {model_name}")
                self.model = YOLO(model_name)
                self.model.to(device)
                logger.info("✓ YOLOv8 model loaded")
            except Exception as e:
                logger.error(f"Failed to load YOLOv8: {e}")
        else:
            logger.warning("YOLOv8 not available")
    
    def detect_objects(
        self,
        image_path: str,
        confidence_threshold: float = 0.5
    ) -> Optional[VisionResult]:
        """
        Detectar objetos em uma imagem
        
        Args:
            image_path: Caminho para a imagem
            confidence_threshold: Confiança mínima (0.0-1.0)
        
        Returns:
            VisionResult com detecções
        """
        if not self.model:
            logger.error("Model not loaded")
            return None
        
        import time
        start_time = time.time()
        
        try:
            # Carregar e processar imagem
            if not PIL_AVAILABLE:
                logger.error("PIL not available")
                return None
            
            image = Image.open(image_path)
            
            # Rodar detecção
            results = self.model(image, conf=confidence_threshold)
            
            # Processar resultados
            detections = []
            if results and len(results) > 0:
                boxes = results[0].boxes
                
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = box.conf[0].item()
                    class_idx = int(box.cls[0].item())
                    class_name = results[0].names[class_idx]
                    
                    area = (x2 - x1) * (y2 - y1)
                    
                    detection = VisionDetection(
                        class_name=class_name,
                        confidence=conf,
                        bbox=(x1, y1, x2, y2),
                        area=area
                    )
                    detections.append(detection)
            
            processing_time = (time.time() - start_time) * 1000
            
            result = VisionResult(
                timestamp=datetime.now(),
                image_shape=image.size + (3,),
                detections=detections,
                confidence_threshold=confidence_threshold,
                processing_time_ms=processing_time
            )
            
            logger.info(f"Vision: Detected {len(detections)} objects in {processing_time:.2f}ms")
            return result
            
        except Exception as e:
            logger.error(f"Vision detection error: {e}")
            return None
    
    def segment_objects(self, image_path: str) -> Optional[Dict]:
        """
        Segmentar objetos em uma imagem
        """
        if not self.model:
            return None
        
        try:
            if not PIL_AVAILABLE:
                return None
            
            image = Image.open(image_path)
            results = self.model(image, task='segment')
            
            segments = []
            if results and len(results) > 0:
                for mask in results[0].masks:
                    segments.append({
                        'mask_shape': mask.xy[0].shape if hasattr(mask, 'xy') else None,
                        'area_pixels': mask.area() if hasattr(mask, 'area') else 0
                    })
            
            return {
                'timestamp': datetime.now().isoformat(),
                'segment_count': len(segments),
                'segments': segments
            }
        except Exception as e:
            logger.error(f"Segmentation error: {e}")
            return None

# ============================================================================
# MOTOR DE ÁUDIO (WHISPER)
# ============================================================================

class AudioEngine:
    """Engine de processamento de áudio com Whisper"""
    
    def __init__(self, model_name: str = 'base', device: str = 'cpu'):
        self.model_name = model_name
        self.device = device
        self.model = None
        
        if WHISPER_AVAILABLE:
            try:
                logger.info(f"Loading Whisper model: {model_name}")
                self.model = whisper.load_model(model_name, device=device)
                logger.info("✓ Whisper model loaded")
            except Exception as e:
                logger.error(f"Failed to load Whisper: {e}")
        else:
            logger.warning("Whisper not available")
    
    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None
    ) -> Optional[AudioTranscription]:
        """
        Transcrever áudio para texto
        
        Args:
            audio_path: Caminho para arquivo de áudio
            language: Código de idioma (ex: 'en', 'pt', None para auto-detect)
        
        Returns:
            AudioTranscription com resultado
        """
        if not self.model:
            logger.error("Model not loaded")
            return None
        
        import time
        start_time = time.time()
        
        try:
            # Transcrever
            options = {}
            if language:
                options['language'] = language
            
            result = self.model.transcribe(audio_path, **options)
            
            processing_time = (time.time() - start_time) * 1000
            
            transcription = AudioTranscription(
                text=result['text'],
                language=result.get('language', 'unknown'),
                confidence=0.85,  # Whisper não fornece confiança por padrão
                duration_seconds=result.get('duration', 0),
                processing_time_ms=processing_time
            )
            
            logger.info(f"Audio: Transcribed {len(result['text'])} chars in {processing_time:.2f}ms")
            return transcription
            
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return None
    
    def detect_language(self, audio_path: str) -> Optional[str]:
        """
        Detectar idioma de um arquivo de áudio
        """
        if not self.model:
            return None
        
        try:
            # Carregar áudio e detectar idioma
            audio = whisper.load_audio(audio_path)
            mel = whisper.log_mel_spectrogram(audio).to(self.model.device)
            
            _, probs = self.model.detect_language(mel)
            language = max(probs, key=probs.get)
            
            logger.info(f"Detected language: {language} ({probs[language]:.2%})")
            return language
            
        except Exception as e:
            logger.error(f"Language detection error: {e}")
            return None

# ============================================================================
# MOTOR DE EMBEDDINGS (BGE/GTE)
# ============================================================================

class EmbeddingEngine:
    """Engine de embeddings semânticos"""
    
    def __init__(self, model_name: str = 'BAAI/bge-small-en-v1.5'):
        self.model_name = model_name
        self.model = None
        
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                logger.info(f"Loading embedding model: {model_name}")
                self.model = SentenceTransformer(model_name)
                logger.info("✓ Embedding model loaded")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
        else:
            logger.warning("sentence-transformers not available")
    
    def embed_text(self, text: str) -> Optional[Embedding]:
        """
        Criar embedding para texto
        """
        if not self.model:
            logger.error("Model not loaded")
            return None
        
        try:
            vector = self.model.encode(text, convert_to_numpy=True)
            
            embedding = Embedding(
                text=text,
                vector=vector.tolist(),
                model=self.model_name,
                dimension=len(vector)
            )
            
            logger.info(f"Embedding: Created {embedding.dimension}D vector for {len(text)} chars")
            return embedding
            
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return None
    
    def embed_batch(self, texts: List[str]) -> Optional[List[Embedding]]:
        """
        Criar embeddings para múltiplos textos
        """
        if not self.model:
            return None
        
        try:
            vectors = self.model.encode(texts, convert_to_numpy=True)
            
            embeddings = []
            for text, vector in zip(texts, vectors):
                embedding = Embedding(
                    text=text,
                    vector=vector.tolist(),
                    model=self.model_name,
                    dimension=len(vector)
                )
                embeddings.append(embedding)
            
            logger.info(f"Embedding: Processed {len(texts)} texts")
            return embeddings
            
        except Exception as e:
            logger.error(f"Batch embedding error: {e}")
            return None
    
    def similarity(self, text1: str, text2: str) -> float:
        """
        Calcular similaridade entre dois textos
        """
        if not self.model:
            return 0.0
        
        try:
            embeddings = self.model.encode([text1, text2])
            
            # Normalizar
            from sklearn.preprocessing import normalize
            embeddings = normalize(embeddings, norm='l2')
            
            # Similaridade coseno
            similarity = np.dot(embeddings[0], embeddings[1])
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Similarity calculation error: {e}")
            return 0.0

# ============================================================================
# ORQUESTRADOR MULTIMODAL
# ============================================================================

class MultimodalPerceptionEngine:
    """Orquestrador principal de percepção multimodal"""
    
    def __init__(self):
        self.vision = VisionEngine() if YOLO_AVAILABLE else None
        self.audio = AudioEngine() if WHISPER_AVAILABLE else None
        self.embedding = EmbeddingEngine() if SENTENCE_TRANSFORMERS_AVAILABLE else None
        
        logger.info("✓ Multimodal Perception Engine initialized")
    
    async def process_image(self, image_path: str) -> Dict[str, Any]:
        """Processar imagem completa"""
        result = {
            'timestamp': datetime.now().isoformat(),
            'image_path': image_path,
            'modalities': {}
        }
        
        # Visão
        if self.vision:
            vision_result = self.vision.detect_objects(image_path)
            if vision_result:
                result['modalities']['vision'] = vision_result.to_dict()
        
        return result
    
    async def process_audio(self, audio_path: str) -> Dict[str, Any]:
        """Processar áudio completo"""
        result = {
            'timestamp': datetime.now().isoformat(),
            'audio_path': audio_path,
            'modalities': {}
        }
        
        # Áudio
        if self.audio:
            transcription = self.audio.transcribe(audio_path)
            if transcription:
                result['modalities']['audio'] = transcription.to_dict()
                
                # Embedding do texto transcrito
                if self.embedding:
                    embedding = self.embedding.embed_text(transcription.text)
                    if embedding:
                        result['modalities']['embedding'] = {
                            'dimension': embedding.dimension,
                            'model': embedding.model
                        }
        
        return result
    
    async def process_multimodal(
        self,
        image_path: Optional[str] = None,
        audio_path: Optional[str] = None,
        text: Optional[str] = None
    ) -> Dict[str, Any]:
        """Processar múltiplas modalidades juntas"""
        result = {
            'timestamp': datetime.now().isoformat(),
            'modalities': {}
        }
        
        tasks = []
        
        if image_path:
            tasks.append(self.process_image(image_path))
        
        if audio_path:
            tasks.append(self.process_audio(audio_path))
        
        if text and self.embedding:
            embedding = self.embedding.embed_text(text)
            if embedding:
                result['modalities']['text_embedding'] = {
                    'dimension': embedding.dimension,
                    'model': embedding.model
                }
        
        if tasks:
            results = await asyncio.gather(*tasks)
            for r in results:
                result['modalities'].update(r.get('modalities', {}))
        
        return result

# ============================================================================
# REST API SERVER
# ============================================================================

async def start_api_server(host: str = '127.0.0.1', port: int = 5555):
    """Iniciar servidor REST para integração com Brain"""
    try:
        from aiohttp import web
        
        engine = MultimodalPerceptionEngine()
        
        async def handle_image(request):
            """POST /vision - Processar imagem"""
            data = await request.json()
            image_path = data.get('image_path')
            
            if not image_path:
                return web.json_response({'error': 'image_path required'}, status=400)
            
            result = await engine.process_image(image_path)
            return web.json_response(result)
        
        async def handle_audio(request):
            """POST /audio - Processar áudio"""
            data = await request.json()
            audio_path = data.get('audio_path')
            
            if not audio_path:
                return web.json_response({'error': 'audio_path required'}, status=400)
            
            result = await engine.process_audio(audio_path)
            return web.json_response(result)
        
        async def handle_multimodal(request):
            """POST /multimodal - Processar múltiplas modalidades"""
            data = await request.json()
            
            result = await engine.process_multimodal(
                image_path=data.get('image_path'),
                audio_path=data.get('audio_path'),
                text=data.get('text')
            )
            return web.json_response(result)
        
        async def handle_health(request):
            """GET /health - Status do servidor"""
            return web.json_response({
                'status': 'healthy',
                'vision_available': engine.vision is not None,
                'audio_available': engine.audio is not None,
                'embedding_available': engine.embedding is not None
            })
        
        app = web.Application()
        app.router.add_post('/vision', handle_image)
        app.router.add_post('/audio', handle_audio)
        app.router.add_post('/multimodal', handle_multimodal)
        app.router.add_get('/health', handle_health)
        
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, host, port)
        await site.start()
        
        logger.info(f"✓ Multimodal API server listening on {host}:{port}")
        
        # Manter servidor rodando
        while True:
            await asyncio.sleep(3600)
            
    except ImportError:
        logger.error("aiohttp not installed: pip install aiohttp")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    logger.info("Starting KIACHA Multimodal Perception Engine...")
    
    # Iniciar servidor REST
    try:
        asyncio.run(start_api_server())
    except KeyboardInterrupt:
        logger.info("Shutting down...")
