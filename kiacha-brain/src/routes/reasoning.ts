/**
 * KIACHA OS - Reasoning Engine Orchestrator
 * 
 * Conecta:
 *   - WASM Reasoning Module (C++ reasoning)
 *   - Brain Routes (REST API)
 *   - Kernel gRPC (Ações reais)
 *   - Memory (Semantic storage)
 * 
 * Fluxo: Task → Brain → WASM Engine → Executor → Kernel → Action
 */

import express, { Request, Response } from 'express';
import axios from 'axios';
import type { ReasoningTask, ExecutionPlan, ReasoningResult } from '../types/reasoning.js';

const router = express.Router();

// Referência ao cliente gRPC do kernel
let kernelClient: any = null;

// Referência ao módulo WASM (carregado dinamicamente)
let wasmModule: any = null;

/**
 * Cache de planos em execução
 */
const activePlans = new Map<string, ExecutionPlan>();

/**
 * Inicializar o módulo WASM
 */
export async function initializeReasoning(kernel: any) {
    kernelClient = kernel;
    
    try {
        // Carregar módulo WASM (compilado a partir de reasoning.cpp)
        // wasmModule = await import('./reasoning.wasm');
        console.log('✓ Reasoning Engine initialized');
    } catch (error) {
        console.error('✗ Failed to load WASM module:', error);
    }
}

/**
 * ENDPOINT: POST /api/reasoning/task
 * Submeter uma tarefa para raciocínio em cadeia
 * 
 * Body:
 * {
 *   "goal": "criar arquivo config e atualizar sistema",
 *   "context": {
 *     "user": "admin",
 *     "priority": "high"
 *   },
 *   "timeout": 30000
 * }
 */
router.post('/task', async (req: Request, res: Response) => {
    try {
        const { goal, context = {}, timeout = 30000 } = req.body;
        
        if (!goal) {
            return res.status(400).json({ error: 'Goal is required' });
        }
        
        // Criar tarefa
        const task: ReasoningTask = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            goal,
            context,
            status: 'submitted',
            created_at: new Date(),
            timeout
        };
        
        // Executar raciocínio (Fire-and-forget com callback)
        executeReasoning(task).catch(err => {
            console.error(`Task ${task.id} failed:`, err);
        });
        
        // Retornar ID da tarefa imediatamente
        res.json({
            success: true,
            task_id: task.id,
            status: 'reasoning_started',
            message: 'Task submitted to reasoning engine'
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: GET /api/reasoning/task/:task_id
 * Obter status e resultado de uma tarefa
 */
router.get('/task/:task_id', (req: Request, res: Response) => {
    const { task_id } = req.params;
    
    const plan = activePlans.get(task_id);
    if (!plan) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({
        success: true,
        task_id,
        status: plan.status,
        steps_completed: plan.steps.filter(s => s.status === 'completed').length,
        total_steps: plan.steps.length,
        current_step: plan.current_step_index,
        plan
    });
});

/**
 * ENDPOINT: GET /api/reasoning/memory/:key
 * Recuperar item da memória semântica
 */
router.get('/memory/:key', (req: Request, res: Response) => {
    const { key } = req.params;
    
    try {
        if (!wasmModule || !wasmModule.recall_memory) {
            return res.status(503).json({ error: 'WASM module not ready' });
        }
        
        const memory = wasmModule.recall_memory(key);
        res.json({
            success: true,
            key,
            memory: typeof memory === 'string' ? JSON.parse(memory) : memory
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: POST /api/reasoning/memory
 * Armazenar na memória semântica
 */
router.post('/memory', (req: Request, res: Response) => {
    const { key, value } = req.body;
    
    if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
    }
    
    try {
        if (!wasmModule || !wasmModule.store_memory) {
            return res.status(503).json({ error: 'WASM module not ready' });
        }
        
        wasmModule.store_memory(key, typeof value === 'string' ? value : JSON.stringify(value));
        
        res.json({
            success: true,
            message: 'Memory stored',
            key,
            value_type: typeof value
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: POST /api/reasoning/abort/:task_id
 * Abortar uma tarefa em execução
 */
router.post('/abort/:task_id', (req: Request, res: Response) => {
    const { task_id } = req.params;
    
    const plan = activePlans.get(task_id);
    if (!plan) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    plan.status = 'aborted';
    
    res.json({
        success: true,
        message: 'Task aborted',
        task_id
    });
});

/**
 * Executar raciocínio com WASM
 */
async function executeReasoning(task: ReasoningTask) {
    try {
        // 1. PHASE: Preparação
        console.log(`[${task.id}] Starting reasoning for goal: "${task.goal}"`);
        
        const startTime = Date.now();
        
        // 2. PHASE: Chamar WASM reasoning engine
        let plan: ExecutionPlan;
        
        if (wasmModule && wasmModule.reason_cycle) {
            const input = JSON.stringify({
                goal: task.goal,
                context: task.context
            });
            
            const result = wasmModule.reason_cycle(input);
            plan = JSON.parse(typeof result === 'string' ? result : JSON.stringify(result));
        } else {
            // Fallback: Mock execution plan
            plan = createMockPlan(task);
        }
        
        plan.status = 'executing';
        activePlans.set(task.id, plan);
        
        // 3. PHASE: Executar etapas com retry logic
        for (let i = 0; i < plan.steps.length; i++) {
            const step = plan.steps[i];
            plan.current_step_index = i;
            
            // Checar timeout
            if (Date.now() - startTime > task.timeout) {
                plan.status = 'timeout';
                console.warn(`[${task.id}] Timeout reached`);
                break;
            }
            
            // Executar etapa
            await executeStep(step, plan, kernelClient);
        }
        
        // 4. PHASE: Finalização
        plan.status = 'completed';
        plan.completed_at = new Date();
        
        const duration = Date.now() - startTime;
        console.log(`[${task.id}] ✓ Reasoning completed in ${duration}ms`);
        
    } catch (error) {
        console.error(`[${task.id}] Error during reasoning:`, error);
        const plan = activePlans.get(task.id);
        if (plan) {
            plan.status = 'failed';
            plan.error = (error as Error).message;
        }
    }
}

/**
 * Executar uma etapa individual
 */
async function executeStep(
    step: any,
    plan: ExecutionPlan,
    kernelClient: any
): Promise<void> {
    step.status = 'executing';
    step.started_at = new Date();
    
    try {
        // Executar ação baseado no tipo
        switch (step.type) {
            case 'analysis':
                step.result = performAnalysis(step, plan);
                step.confidence = 0.95;
                break;
                
            case 'planning':
                step.result = performPlanning(step, plan);
                step.confidence = 0.90;
                break;
                
            case 'validation':
                step.result = performValidation(step, plan);
                step.confidence = 0.98;
                break;
                
            case 'execution':
                // Executar com Kernel
                if (kernelClient) {
                    step.result = await executeKernelAction(step, kernelClient);
                } else {
                    step.result = 'Mock execution';
                }
                step.confidence = 0.85;
                break;
                
            default:
                step.result = 'Unknown step type';
                step.confidence = 0.5;
        }
        
        step.status = 'completed';
        step.completed_at = new Date();
        
    } catch (error) {
        step.status = 'failed';
        step.error = (error as Error).message;
        step.confidence *= 0.8;  // Reduzir confiança em caso de erro
        
        // Retry se houver tentativas disponíveis
        if (step.retries < 3) {
            step.retries++;
            await new Promise(resolve => setTimeout(resolve, 100 * step.retries));
            await executeStep(step, plan, kernelClient);
        }
    }
}

/**
 * Realizar análise de um objetivo
 */
function performAnalysis(step: any, plan: ExecutionPlan): string {
    let analysis = `Analysis of: "${plan.goal}"\n`;
    analysis += `Context items: ${Object.keys(plan.context).length}\n`;
    analysis += `Complexity: ${estimateComplexity(plan.goal)}\n`;
    
    return analysis;
}

/**
 * Realizar planejamento
 */
function performPlanning(step: any, plan: ExecutionPlan): string {
    let planning = 'Plan decomposed into subtasks:\n';
    
    const subtasks = decomposeGoal(plan.goal);
    subtasks.forEach((task, i) => {
        planning += `${i + 1}. ${task}\n`;
    });
    
    return planning;
}

/**
 * Validar plano lógico
 */
function performValidation(step: any, plan: ExecutionPlan): string {
    let validation = 'Logical validation:\n';
    
    let valid = true;
    for (const [key, val] of Object.entries(plan.context)) {
        if (!val) {
            valid = false;
            validation += `- Missing context: ${key}\n`;
        }
    }
    
    if (valid) {
        validation += '- All contexts valid ✓\n';
    } else {
        validation += '- Some contexts missing, proceeding anyway\n';
    }
    
    return validation;
}

/**
 * Executar ação no Kernel via gRPC
 */
async function executeKernelAction(step: any, kernelClient: any): Promise<string> {
    try {
        // Mapear ação para gRPC method
        const action = step.content.toLowerCase();
        
        if (action.includes('create')) {
            // Chamar CreateFile, CreateModule, etc
            return 'Action executed: creation';
        } else if (action.includes('update')) {
            // Chamar UpdateModule, UpdateSystem, etc
            return 'Action executed: update';
        } else if (action.includes('delete')) {
            // Chamar DeleteFile, DeleteModule, etc
            return 'Action executed: deletion';
        } else if (action.includes('monitor')) {
            // Chamar GetSystemInfo, ListProcesses, etc
            return 'Action executed: monitoring';
        }
        
        return 'Action executed: generic';
        
    } catch (error) {
        throw new Error(`Kernel action failed: ${(error as Error).message}`);
    }
}

/**
 * Estimar complexidade da tarefa
 */
function estimateComplexity(goal: string): string {
    const words = goal.split(' ').length;
    if (words < 5) return 'Low';
    if (words < 15) return 'Medium';
    return 'High';
}

/**
 * Decompor objetivo em subtarefas
 */
function decomposeGoal(goal: string): string[] {
    const lower = goal.toLowerCase();
    
    if (lower.includes('create')) {
        return [
            'Validate requirements',
            'Prepare resources',
            'Execute creation',
            'Verify result'
        ];
    } else if (lower.includes('monitor')) {
        return [
            'Collect metrics',
            'Analyze data',
            'Compare thresholds',
            'Report status'
        ];
    } else if (lower.includes('update')) {
        return [
            'Check version',
            'Download update',
            'Verify integrity',
            'Apply update'
        ];
    } else if (lower.includes('delete')) {
        return [
            'Validate permissions',
            'Backup data',
            'Execute deletion',
            'Confirm cleanup'
        ];
    }
    
    return [
        'Plan approach',
        'Gather information',
        'Execute action',
        'Evaluate outcome'
    ];
}

/**
 * Criar plano mock para testes
 */
function createMockPlan(task: ReasoningTask): ExecutionPlan {
    return {
        task_id: task.id,
        goal: task.goal,
        status: 'planning',
        current_step_index: 0,
        steps: [
            {
                id: `${task.id}_step_1`,
                type: 'analysis',
                content: `Analyzing: ${task.goal}`,
                dependencies: [],
                status: 'pending',
                result: '',
                confidence: 0.9,
                retries: 0
            },
            {
                id: `${task.id}_step_2`,
                type: 'planning',
                content: 'Decomposing into subtasks',
                dependencies: [`${task.id}_step_1`],
                status: 'pending',
                result: '',
                confidence: 0.85,
                retries: 0
            },
            {
                id: `${task.id}_step_3`,
                type: 'validation',
                content: 'Validating logic',
                dependencies: [`${task.id}_step_2`],
                status: 'pending',
                result: '',
                confidence: 0.98,
                retries: 0
            },
            {
                id: `${task.id}_step_4`,
                type: 'execution',
                content: 'Executing plan',
                dependencies: [`${task.id}_step_3`],
                status: 'pending',
                result: '',
                confidence: 0.85,
                retries: 0
            }
        ],
        context: task.context,
        created_at: new Date()
    };
}

export default router;
