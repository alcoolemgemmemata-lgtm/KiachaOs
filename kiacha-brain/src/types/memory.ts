/**
 * KIACHA OS - Semantic Memory Type Definitions
 */

export interface MemoryEntry {
    key: string;
    content: string;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
    access_count: number;
}

export interface VectorEntry {
    key: string;
    vector: number[];
    dimension: number;
    indexed_at: Date;
}

export interface SearchResult {
    key: string;
    entry: MemoryEntry;
    similarity: number;
}

export interface SemanticQuery {
    content_pattern?: string;
    metadata?: Record<string, any>;
    created_after?: Date;
    created_before?: Date;
    min_similarity?: number;
}

export interface MemoryStats {
    total_entries: number;
    total_vectors: number;
    indexed_documents: number;
    memory_usage_mb: number;
    most_accessed: Array<{ key: string; access_count: number }>;
    recently_updated: Array<{ key: string; updated_at: Date }>;
}

export interface VectorDatabaseConfig {
    type: 'milvus' | 'qdrant' | 'weaviate' | 'pinecone';
    address?: string;
    host?: string;
    port?: number;
    api_key?: string;
    ssl?: boolean;
}

export interface ActionLearning {
    action: string;
    result: any;
    success: boolean;
    timestamp: Date;
    embedding?: number[];
}

export interface DocumentIndex {
    doc_id: string;
    content: string;
    chunks: string[];
    indexed_at: Date;
    total_chunks: number;
}
