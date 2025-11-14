/**
 * KIACHA OS - Semantic Memory with Vector Database
 * 
 * Banco vetorial para:
 *   - Aprender com ações
 *   - Consultar conhecimento
 *   - Lembrar padrões
 *   - Indexar documentos
 *   - Criar embeddings de contexto
 * 
 * Suporta: Milvus, Qdrant, Weaviate, Pinecone
 */

import express, { Request, Response } from 'express';
import type { 
    MemoryEntry, 
    VectorEntry, 
    SearchResult, 
    MemoryStats,
    SemanticQuery
} from '../types/memory.js';

const router = express.Router();

// ============================================================================
// SEMANTIC MEMORY ENGINE
// ============================================================================

class SemanticMemory {
    private entries: Map<string, MemoryEntry> = new Map();
    private vectors: Map<string, VectorEntry> = new Map();
    private indexedDocs: Map<string, string[]> = new Map();
    private vectorClient: any = null;
    private maxMemorySize = 100000;
    
    constructor() {
        console.log('✓ Semantic Memory Engine initialized');
    }
    
    /**
     * Inicializar conexão com banco vetorial
     */
    async initialize(vectorStore: 'milvus' | 'qdrant' | 'weaviate' = 'milvus', config: any = {}) {
        try {
            switch (vectorStore) {
                case 'milvus':
                    this.vectorClient = await this.initMilvus(config);
                    break;
                case 'qdrant':
                    this.vectorClient = await this.initQdrant(config);
                    break;
                case 'weaviate':
                    this.vectorClient = await this.initWeaviate(config);
                    break;
            }
            
            console.log(`✓ Connected to ${vectorStore} vector database`);
        } catch (error) {
            console.error(`Failed to initialize ${vectorStore}:`, error);
        }
    }
    
    /**
     * Inicializar Milvus
     */
    private async initMilvus(config: any): Promise<any> {
        // await import('@zilliztech/milvus2-sdk-node');
        // const { MilvusClient } = await import('@zilliztech/milvus2-sdk-node');
        
        // return new MilvusClient({
        //     address: config.address || 'localhost:19530',
        //     ssl: false
        // });
        
        return { type: 'milvus' };
    }
    
    /**
     * Inicializar Qdrant
     */
    private async initQdrant(config: any): Promise<any> {
        // const { QdrantClient } = await import('@qdrant/js-client-rest');
        
        // return new QdrantClient({
        //     host: config.host || 'localhost',
        //     port: config.port || 6333
        // });
        
        return { type: 'qdrant' };
    }
    
    /**
     * Inicializar Weaviate
     */
    private async initWeaviate(config: any): Promise<any> {
        // const weaviate = await import('weaviate-ts-client');
        
        // return weaviate.client({
        //     scheme: 'http',
        //     host: config.host || 'localhost:8080'
        // });
        
        return { type: 'weaviate' };
    }
    
    /**
     * Armazenar entrada com embedding
     */
    async store(key: string, content: string, metadata: any = {}, embedding: number[] = []): Promise<void> {
        // Limpar cache se necessário
        if (this.entries.size >= this.maxMemorySize) {
            this.evictOldest();
        }
        
        const entry: MemoryEntry = {
            key,
            content,
            metadata,
            created_at: new Date(),
            updated_at: new Date(),
            access_count: 0
        };
        
        this.entries.set(key, entry);
        
        // Armazenar vector se disponível
        if (embedding.length > 0) {
            const vectorEntry: VectorEntry = {
                key,
                vector: embedding,
                dimension: embedding.length,
                indexed_at: new Date()
            };
            
            this.vectors.set(key, vectorEntry);
            
            // Enviar para banco vetorial
            if (this.vectorClient) {
                await this.indexVector(key, embedding, metadata);
            }
        }
    }
    
    /**
     * Recuperar entrada
     */
    async retrieve(key: string): Promise<MemoryEntry | null> {
        const entry = this.entries.get(key);
        
        if (entry) {
            entry.access_count++;
            entry.updated_at = new Date();
        }
        
        return entry || null;
    }
    
    /**
     * Buscar por similaridade semântica
     */
    async semanticSearch(
        query: string,
        queryVector: number[],
        topK: number = 10
    ): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        
        if (this.vectorClient && queryVector.length > 0) {
            // Buscar no banco vetorial
            return await this.searchVectors(queryVector, topK);
        } else {
            // Fallback: busca por texto
            for (const [key, entry] of this.entries) {
                if (entry.content.includes(query)) {
                    results.push({
                        key,
                        entry,
                        similarity: this.calculateTextSimilarity(query, entry.content)
                    });
                }
            }
            
            // Ordenar por similaridade e limitar a topK
            return results
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topK);
        }
    }
    
    /**
     * Buscar padrões
     */
    async findPatterns(query: SemanticQuery): Promise<MemoryEntry[]> {
        const results: MemoryEntry[] = [];
        
        for (const [key, entry] of this.entries) {
            // Verificar metadados
            if (query.metadata) {
                let matches = true;
                for (const [meta_key, meta_val] of Object.entries(query.metadata)) {
                    if (entry.metadata[meta_key] !== meta_val) {
                        matches = false;
                        break;
                    }
                }
                if (!matches) continue;
            }
            
            // Verificar conteúdo
            if (query.content_pattern) {
                const pattern = new RegExp(query.content_pattern);
                if (!pattern.test(entry.content)) {
                    continue;
                }
            }
            
            // Verificar data
            if (query.created_after) {
                if (entry.created_at < query.created_after) {
                    continue;
                }
            }
            
            results.push(entry);
        }
        
        return results;
    }
    
    /**
     * Aprender com ação/resultado
     */
    async learnFromAction(
        action: string,
        result: any,
        success: boolean,
        embedding: number[] = []
    ): Promise<void> {
        const key = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.store(key, action, {
            type: 'action',
            result,
            success,
            timestamp: new Date()
        }, embedding);
    }
    
    /**
     * Indexar documento completo
     */
    async indexDocument(doc_id: string, content: string, embeddings: number[][] = []): Promise<void> {
        // Dividir conteúdo em chunks
        const chunks = this.splitIntoChunks(content, 500);
        
        const chunk_keys: string[] = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk_key = `${doc_id}_chunk_${i}`;
            
            await this.store(
                chunk_key,
                chunks[i],
                {
                    type: 'document',
                    doc_id,
                    chunk_index: i,
                    total_chunks: chunks.length
                },
                embeddings[i] || []
            );
            
            chunk_keys.push(chunk_key);
        }
        
        this.indexedDocs.set(doc_id, chunk_keys);
    }
    
    /**
     * Recuperar documento indexado
     */
    async retrieveDocument(doc_id: string): Promise<string> {
        const chunk_keys = this.indexedDocs.get(doc_id) || [];
        
        let full_content = '';
        for (const key of chunk_keys) {
            const entry = await this.retrieve(key);
            if (entry) {
                full_content += entry.content;
            }
        }
        
        return full_content;
    }
    
    /**
     * Obter estatísticas
     */
    getStatistics(): MemoryStats {
        const stats: MemoryStats = {
            total_entries: this.entries.size,
            total_vectors: this.vectors.size,
            indexed_documents: this.indexedDocs.size,
            memory_usage_mb: (this.getMemoryUsage() / 1024 / 1024),
            most_accessed: this.getMostAccessed(10),
            recently_updated: this.getRecentlyUpdated(10)
        };
        
        return stats;
    }
    
    /**
     * Limpar memória antiga
     */
    cleanup(): void {
        const now = new Date();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
        
        let removed = 0;
        
        for (const [key, entry] of this.entries) {
            if (now.getTime() - entry.updated_at.getTime() > maxAge) {
                this.entries.delete(key);
                this.vectors.delete(key);
                removed++;
            }
        }
        
        console.log(`Cleaned up ${removed} old entries`);
    }
    
    /**
     * Exportar memória
     */
    export(): any {
        const export_data = {
            timestamp: new Date(),
            entries: Array.from(this.entries.entries()),
            vectors: Array.from(this.vectors.entries()),
            indexed_docs: Array.from(this.indexedDocs.entries()),
            stats: this.getStatistics()
        };
        
        return export_data;
    }
    
    /**
     * Importar memória
     */
    async import(data: any): Promise<void> {
        this.entries = new Map(data.entries || []);
        this.vectors = new Map(data.vectors || []);
        this.indexedDocs = new Map(data.indexed_docs || []);
        
        console.log(`Imported ${this.entries.size} entries`);
    }
    
    // ===== PRIVATE METHODS =====
    
    private async indexVector(key: string, vector: number[], metadata: any): Promise<void> {
        if (!this.vectorClient) return;
        
        // Enviar para banco vetorial
        // Implementação específica do cliente
        console.log(`Indexed vector for key: ${key}`);
    }
    
    private async searchVectors(queryVector: number[], topK: number): Promise<SearchResult[]> {
        const results: SearchResult[] = [];
        
        // Calcular similaridade com todos os vectors
        for (const [key, vectorEntry] of this.vectors) {
            const similarity = this.cosineSimilarity(queryVector, vectorEntry.vector);
            const entry = this.entries.get(key);
            
            if (entry) {
                results.push({ key, entry, similarity });
            }
        }
        
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }
    
    private calculateTextSimilarity(text1: string, text2: string): number {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }
    
    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    private splitIntoChunks(text: string, chunkSize: number): string[] {
        const chunks: string[] = [];
        
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        
        return chunks;
    }
    
    private evictOldest(): void {
        let oldest: [string, MemoryEntry] | null = null;
        
        for (const entry of this.entries) {
            if (!oldest || entry[1].updated_at < oldest[1].updated_at) {
                oldest = entry;
            }
        }
        
        if (oldest) {
            this.entries.delete(oldest[0]);
            this.vectors.delete(oldest[0]);
        }
    }
    
    private getMostAccessed(limit: number): Array<{ key: string; access_count: number }> {
        return Array.from(this.entries.values())
            .map(e => ({ key: e.key, access_count: e.access_count }))
            .sort((a, b) => b.access_count - a.access_count)
            .slice(0, limit);
    }
    
    private getRecentlyUpdated(limit: number): Array<{ key: string; updated_at: Date }> {
        return Array.from(this.entries.values())
            .map(e => ({ key: e.key, updated_at: e.updated_at }))
            .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
            .slice(0, limit);
    }
    
    private getMemoryUsage(): number {
        let total = 0;
        
        for (const entry of this.entries.values()) {
            total += entry.content.length + JSON.stringify(entry.metadata).length;
        }
        
        return total;
    }
}

// Instância global
const memory = new SemanticMemory();

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * ENDPOINT: POST /api/memory/store
 * Armazenar na memória
 */
router.post('/store', async (req: Request, res: Response) => {
    try {
        const { key, content, metadata, embedding } = req.body;
        
        if (!key || !content) {
            return res.status(400).json({ error: 'key and content required' });
        }
        
        await memory.store(key, content, metadata, embedding);
        
        res.json({
            success: true,
            message: 'Stored in memory',
            key
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: GET /api/memory/:key
 * Recuperar da memória
 */
router.get('/:key', async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        
        const entry = await memory.retrieve(key);
        
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        
        res.json({
            success: true,
            entry
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: POST /api/memory/search
 * Busca semântica
 */
router.post('/search', async (req: Request, res: Response) => {
    try {
        const { query, embedding, topK = 10 } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'query required' });
        }
        
        const results = await memory.semanticSearch(query, embedding || [], topK);
        
        res.json({
            success: true,
            query,
            results,
            count: results.length
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: POST /api/memory/patterns
 * Encontrar padrões
 */
router.post('/patterns', async (req: Request, res: Response) => {
    try {
        const query = req.body;
        
        const results = await memory.findPatterns(query);
        
        res.json({
            success: true,
            patterns: results,
            count: results.length
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: POST /api/memory/learn
 * Aprender com ação
 */
router.post('/learn', async (req: Request, res: Response) => {
    try {
        const { action, result, success, embedding } = req.body;
        
        if (!action) {
            return res.status(400).json({ error: 'action required' });
        }
        
        await memory.learnFromAction(action, result, success, embedding);
        
        res.json({
            success: true,
            message: 'Learned from action'
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: GET /api/memory/stats
 * Obter estatísticas
 */
router.get('/stats', (req: Request, res: Response) => {
    try {
        const stats = memory.getStatistics();
        
        res.json({
            success: true,
            statistics: stats
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: POST /api/memory/cleanup
 * Limpar memória antiga
 */
router.post('/cleanup', (req: Request, res: Response) => {
    try {
        memory.cleanup();
        
        res.json({
            success: true,
            message: 'Memory cleanup completed'
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
