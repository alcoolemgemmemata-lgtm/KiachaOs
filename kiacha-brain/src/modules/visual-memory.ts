/**
 * Visual Memory System
 * 
 * Sistema que salva e lembra:
 * - Cenas importantes
 * - Screenshots
 * - Fotos
 * - Objetos reconhecidos
 * - Contexto visual
 */

import { EventBus } from '../event-bus';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============ INTERFACES ============

interface VisualObject {
  id: string;
  name: string;
  confidence: number; // 0-100
  boundingBox?: { x: number; y: number; width: number; height: number };
  color?: string;
  texture?: string;
}

interface VisualScene {
  id: string;
  timestamp: Date;
  imagePath: string;
  imageHash: string; // para detectar duplicatas
  thumbnailPath: string;
  width: number;
  height: number;
  brightness: number;
  colorPalette: string[];
  detectedObjects: VisualObject[];
  textContent: string; // OCR results
  emotionalContext: string; // "happy", "sad", "focused", etc
  userAnnotation?: string;
  importance: number; // 0-100
  tags: string[];
}

interface VisualMemory {
  sceneId: string;
  firstSeen: Date;
  lastSeen: Date;
  frequency: number; // quantas vezes vista
  recognitionAccuracy: number;
  relatedScenes: string[]; // IDs de cenas relacionadas
  userReactions: string[]; // "liked", "saved", "shared"
}

interface VisualCluster {
  id: string;
  name: string;
  scenesIds: string[];
  averageConfidence: number;
  visualSimilarity: number; // 0-100
}

// ============ VISUAL MEMORY CLASS ============

export class VisualMemory {
  private scenes: Map<string, VisualScene> = new Map();
  private memories: Map<string, VisualMemory> = new Map();
  private clusters: Map<string, VisualCluster> = new Map();
  private storagePath: string;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, storagePath: string = './visual-memory') {
    this.eventBus = eventBus;
    this.storagePath = storagePath;
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(path.join(this.storagePath, 'images'), { recursive: true });
      await fs.mkdir(path.join(this.storagePath, 'thumbnails'), { recursive: true });
      await fs.mkdir(path.join(this.storagePath, 'clusters'), { recursive: true });
    } catch (error) {
      console.error('Erro ao inicializar armazenamento visual:', error);
    }
  }

  // ============ SAVE VISUAL SCENE ============

  /**
   * Salva uma cena visual (screenshot, foto, etc)
   */
  async saveScene(
    imageBuffer: Buffer,
    detectedObjects: VisualObject[],
    textContent: string = '',
    emotionalContext: string = 'neutral',
    userAnnotation?: string,
    tags: string[] = []
  ): Promise<VisualScene> {
    const sceneId = `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const imageHash = this.hashBuffer(imageBuffer);

    // Verifica duplicatas
    const existingScene = Array.from(this.scenes.values())
      .find(s => s.imageHash === imageHash);
    
    if (existingScene) {
      existingScene.lastSeen = new Date();
      this.eventBus.emit('visual:scene:duplicate', { scene: existingScene });
      return existingScene;
    }

    // Análise da imagem
    const imageMetadata = this.analyzeImageMetadata(imageBuffer);

    // Salva imagem
    const imagePath = path.join(this.storagePath, 'images', `${sceneId}.png`);
    const thumbnailPath = path.join(this.storagePath, 'thumbnails', `${sceneId}-thumb.png`);

    await fs.writeFile(imagePath, imageBuffer);
    // Em produção, geraria thumbnail com sharp ou similar
    await fs.writeFile(thumbnailPath, imageBuffer);

    // Agrupa objetos visualmente similares
    const clusteredObjects = this.clusterVisualObjects(detectedObjects);

    const scene: VisualScene = {
      id: sceneId,
      timestamp: new Date(),
      imagePath,
      imageHash,
      thumbnailPath,
      width: imageMetadata.width || 1920,
      height: imageMetadata.height || 1080,
      brightness: imageMetadata.brightness,
      colorPalette: imageMetadata.colorPalette,
      detectedObjects: clusteredObjects,
      textContent,
      emotionalContext,
      userAnnotation,
      importance: this.calculateSceneImportance(detectedObjects, textContent),
      tags,
    };

    this.scenes.set(sceneId, scene);

    // Encontra conexões com cenas anteriores
    this.findVisualConnections(scene);

    this.eventBus.emit('visual:scene:saved', { scene });
    return scene;
  }

  /**
   * Reconhece objetos em uma cena
   */
  recognizeObjects(scene: VisualScene): VisualObject[] {
    // Em produção, usaria YOLO, TensorFlow ou modelo ONNX
    // Por enquanto, retorna os objetos já detectados
    return scene.detectedObjects.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calcula importância de uma cena
   */
  private calculateSceneImportance(objects: VisualObject[], text: string): number {
    let importance = 50;

    // Objetos conhecidos aumentam importância
    if (objects.length > 3) importance += 15;
    if (objects.some(o => o.confidence > 90)) importance += 10;

    // Texto presente
    if (text.length > 20) importance += 10;

    // Penalidade por confiança baixa
    const avgConfidence = objects.reduce((sum, o) => sum + o.confidence, 0) / objects.length;
    if (avgConfidence < 50) importance -= 20;

    return Math.min(100, Math.max(0, importance));
  }

  // ============ VISUAL SEARCH & RECALL ============

  /**
   * Busca por cenas visuais similares
   */
  findSimilarScenes(queryImage: Buffer, similarity: number = 70): VisualScene[] {
    const results: Array<{ scene: VisualScene; score: number }> = [];

    Array.from(this.scenes.values()).forEach(scene => {
      const score = this.compareImages(queryImage, scene.imagePath);
      if (score >= similarity) {
        results.push({ scene, score });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .map(r => r.scene);
  }

  /**
   * Encontra cenas por objeto visualmente similar
   */
  findScenesByObject(objectName: string, confidence: number = 60): VisualScene[] {
    return Array.from(this.scenes.values())
      .filter(scene =>
        scene.detectedObjects.some(
          obj => obj.name.toLowerCase().includes(objectName.toLowerCase()) &&
                  obj.confidence >= confidence
        )
      )
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * Busca por cor dominante
   */
  findScenesByColor(color: string): VisualScene[] {
    return Array.from(this.scenes.values())
      .filter(scene =>
        scene.colorPalette.some(c => this.isSimilarColor(c, color))
      )
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * Busca por texto (OCR)
   */
  findScenesByText(query: string): VisualScene[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.scenes.values())
      .filter(scene => scene.textContent.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * Timeline visual (cenas ordenadas por tempo)
   */
  getVisualTimeline(startDate: Date, endDate: Date): VisualScene[] {
    return Array.from(this.scenes.values())
      .filter(s => s.timestamp >= startDate && s.timestamp <= endDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Cenas mais importantes (para resumo)
   */
  getMostImportantScenes(limit: number = 10): VisualScene[] {
    return Array.from(this.scenes.values())
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  // ============ VISUAL CLUSTERING ============

  /**
   * Agrupa objetos visuais similares
   */
  private clusterVisualObjects(objects: VisualObject[]): VisualObject[] {
    // Agrupa por nome de objeto
    const grouped = new Map<string, VisualObject[]>();

    objects.forEach(obj => {
      const key = obj.name.toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(obj);
    });

    // Retorna os mais confiantes de cada grupo
    return Array.from(grouped.values()).map(group =>
      group.sort((a, b) => b.confidence - a.confidence)[0]
    );
  }

  /**
   * Cria cluster de cenas similares
   */
  createVisualCluster(name: string, sceneIds: string[]): VisualCluster {
    const clusterId = `cluster-${Date.now()}`;

    const cluster: VisualCluster = {
      id: clusterId,
      name,
      scenesIds: sceneIds,
      averageConfidence: this.calculateAverageConfidence(sceneIds),
      visualSimilarity: this.calculateVisualSimilarity(sceneIds),
    };

    this.clusters.set(clusterId, cluster);
    this.eventBus.emit('visual:cluster:created', { cluster });

    return cluster;
  }

  /**
   * Auto-cluster cenas por objeto/cor/tempo
   */
  autoClusterScenes(): void {
    // Agrupa por objeto detectado
    const objectMap = new Map<string, string[]>();

    Array.from(this.scenes.values()).forEach(scene => {
      scene.detectedObjects.forEach(obj => {
        const key = obj.name.toLowerCase();
        if (!objectMap.has(key)) {
          objectMap.set(key, []);
        }
        objectMap.get(key)!.push(scene.id);
      });
    });

    // Cria clusters
    objectMap.forEach((sceneIds, objectName) => {
      if (sceneIds.length > 2) {
        this.createVisualCluster(`Cenas com ${objectName}`, sceneIds);
      }
    });
  }

  // ============ CONNECTION ANALYSIS ============

  /**
   * Encontra conexões entre cenas
   */
  private findVisualConnections(newScene: VisualScene): void {
    Array.from(this.scenes.values()).forEach(existingScene => {
      if (newScene.id === existingScene.id) return;

      // Objetos similares
      const sharedObjects = newScene.detectedObjects.filter(no =>
        existingScene.detectedObjects.some(eo =>
          eo.name.toLowerCase() === no.name.toLowerCase()
        )
      );

      // Cores similares
      const sharedColors = newScene.colorPalette.filter(nc =>
        existingScene.colorPalette.some(ec =>
          this.isSimilarColor(nc, ec)
        )
      );

      // Temporal proximity (próximas no tempo)
      const timeDiff = Math.abs(
        newScene.timestamp.getTime() - existingScene.timestamp.getTime()
      );
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      if (sharedObjects.length > 0 || sharedColors.length > 0 || daysDiff < 7) {
        if (!existingScene.detectedObjects.some(o =>
          newScene.detectedObjects.find(no => no.id === o.id)
        )) {
          existingScene.detectedObjects.forEach(obj => {
            if (!newScene.detectedObjects.some(no => no.name === obj.name)) {
              newScene.detectedObjects.push(obj);
            }
          });
        }
      }
    });
  }

  // ============ UTILITY METHODS ============

  private hashBuffer(buffer: Buffer): string {
    let hash = 0;
    for (let i = 0; i < buffer.length; i++) {
      hash = ((hash << 5) - hash) + buffer[i];
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private analyzeImageMetadata(buffer: Buffer): {
    width?: number;
    height?: number;
    brightness: number;
    colorPalette: string[];
  } {
    // Em produção, usaria sharp ou similar
    return {
      width: 1920,
      height: 1080,
      brightness: 128,
      colorPalette: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
    };
  }

  private compareImages(img1: Buffer, img2Path: string): number {
    // Em produção, usaria SSIM ou perceptual hash
    return 75;
  }

  private isSimilarColor(color1: string, color2: string): boolean {
    // Simples comparação de cores
    return color1.substring(0, 4) === color2.substring(0, 4);
  }

  private calculateAverageConfidence(sceneIds: string[]): number {
    const scenes = sceneIds
      .map(id => this.scenes.get(id))
      .filter((s): s is VisualScene => s !== undefined);

    const avgConfidence = scenes.reduce((sum, scene) => {
      const objAvg = scene.detectedObjects.length > 0
        ? scene.detectedObjects.reduce((s, o) => s + o.confidence, 0) / scene.detectedObjects.length
        : 0;
      return sum + objAvg;
    }, 0) / scenes.length;

    return Math.round(avgConfidence);
  }

  private calculateVisualSimilarity(sceneIds: string[]): number {
    if (sceneIds.length < 2) return 100;

    // Calcula similaridade média entre cenas do cluster
    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < sceneIds.length; i++) {
      for (let j = i + 1; j < sceneIds.length; j++) {
        const scene1 = this.scenes.get(sceneIds[i]);
        const scene2 = this.scenes.get(sceneIds[j]);

        if (scene1 && scene2) {
          const sharedObjects = scene1.detectedObjects.filter(o1 =>
            scene2.detectedObjects.some(o2 => o2.name === o1.name)
          ).length;

          const similarity = (sharedObjects / Math.max(
            scene1.detectedObjects.length,
            scene2.detectedObjects.length
          )) * 100;

          totalSimilarity += similarity;
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 0;
  }

  /**
   * Obtém cena por ID
   */
  getScene(id: string): VisualScene | null {
    return this.scenes.get(id) || null;
  }

  /**
   * Lista todas as cenas
   */
  getAllScenes(): VisualScene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Gera resumo visual
   */
  generateVisualSummary(): string {
    const totalScenes = this.scenes.size;
    const topObjects = this.getTopDetectedObjects();
    const topColors = this.getTopColors();

    let summary = `👁️ **Resumo Visual**\n\n`;
    summary += `- **Total de cenas salvas:** ${totalScenes}\n`;
    summary += `- **Objetos principais:** ${topObjects.join(', ')}\n`;
    summary += `- **Cores predominantes:** ${topColors.join(', ')}\n`;

    return summary;
  }

  private getTopDetectedObjects(): string[] {
    const objectMap = new Map<string, number>();

    Array.from(this.scenes.values()).forEach(scene => {
      scene.detectedObjects.forEach(obj => {
        objectMap.set(
          obj.name,
          (objectMap.get(obj.name) || 0) + 1
        );
      });
    });

    return Array.from(objectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }

  private getTopColors(): string[] {
    const colorMap = new Map<string, number>();

    Array.from(this.scenes.values()).forEach(scene => {
      scene.colorPalette.forEach(color => {
        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      });
    });

    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([color]) => color);
  }
}

// ============ EXPORT ============

export { VisualScene, VisualObject, VisualMemory as VisualMemoryType, VisualCluster };
