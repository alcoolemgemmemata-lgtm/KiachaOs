/**
 * KIACHA OS - Reasoning System Type Definitions
 */

export interface ReasoningTask {
    id: string;
    goal: string;
    context: Record<string, any>;
    status: 'submitted' | 'reasoning' | 'executing' | 'completed' | 'failed' | 'timeout';
    created_at: Date;
    timeout: number; // milliseconds
}

export interface ReasoningStep {
    id: string;
    type: 'analysis' | 'planning' | 'validation' | 'execution';
    content: string;
    dependencies: string[];
    status: 'pending' | 'executing' | 'completed' | 'failed';
    result: string;
    confidence: number; // 0.0 - 1.0
    retries: number;
    error?: string;
    started_at?: Date;
    completed_at?: Date;
}

export interface ExecutionPlan {
    task_id: string;
    goal: string;
    status: 'planning' | 'executing' | 'completed' | 'failed' | 'timeout' | 'aborted';
    current_step_index: number;
    steps: ReasoningStep[];
    context: Record<string, any>;
    created_at?: Date;
    completed_at?: Date;
    error?: string;
}

export interface ReasoningResult {
    success: boolean;
    task_id: string;
    status: string;
    plan: ExecutionPlan;
    duration_ms: number;
}

export interface MemoryEntry {
    key: string;
    value: any;
    created_at: Date;
    updated_at: Date;
    access_count: number;
}

export interface SemanticMemory {
    memories: Map<string, MemoryEntry[]>;
    recall(query: string): MemoryEntry[];
    store(key: string, value: any): void;
    update(key: string, value: any): void;
    clear(key?: string): void;
}
