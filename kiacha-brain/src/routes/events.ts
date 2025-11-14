/**
 * KIACHA OS - Cognitive Event Bus
 * 
 * Event Bus que permite raciocínio em tempo real e reatividade:
 *   - Eventos do kernel
 *   - Notificações
 *   - Voz do usuário
 *   - Apps abrindo/fechando
 *   - Ações do sistema
 *   - Alertas de segurança
 *   - Mudança de rede
 *   - Mudança de bateria
 *   - Erros/Crash de módulos
 */

import express, { Request, Response } from 'express';
import { EventEmitter } from 'events';
import type { 
    CognitiveEvent, 
    EventHandler, 
    EventSubscription,
    EventReaction 
} from '../types/events.js';

const router = express.Router();

// ============================================================================
// COGNITIVE EVENT BUS
// ============================================================================

class CognitiveEventBus extends EventEmitter {
    private subscriptions: Map<string, EventHandler[]> = new Map();
    private eventHistory: CognitiveEvent[] = [];
    private maxHistorySize = 10000;
    private eventReactions: Map<string, EventReaction[]> = new Map();
    private reasoningEngine: any = null;
    private kernelClient: any = null;
    
    constructor() {
        super();
        this.setupDefaultHandlers();
    }
    
    /**
     * Configurar handlers padrão para eventos críticos
     */
    private setupDefaultHandlers() {
        // Erro crítico → Alertar sistema
        this.on('error', (event: CognitiveEvent) => {
            console.error(`[CRITICAL EVENT] ${event.type}:`, event.data);
        });
        
        // Segurança → Log e notificação
        this.on('security_alert', (event: CognitiveEvent) => {
            this.handleSecurityAlert(event);
        });
        
        // Bateria baixa → Economizar recursos
        this.on('battery_low', (event: CognitiveEvent) => {
            this.handleBatteryLow(event);
        });
    }
    
    /**
     * Emitir um evento cognitivo
     */
    publishEvent(event: CognitiveEvent): void {
        const timestamp = new Date();
        event.timestamp = timestamp;
        event.id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Adicionar ao histórico
        this.eventHistory.push(event);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
        
        console.log(`[EVENT] ${event.type} (${event.priority}):`, event.message);
        
        // Emitir evento
        this.emit(event.type, event);
        
        // Executar reações configuradas
        this.executeReactions(event);
        
        // Disparar raciocínio cognitivo se necessário
        if (event.priority === 'high' || event.priority === 'critical') {
            this.triggerCognitiveResponse(event);
        }
    }
    
    /**
     * Subscrever a um tipo de evento
     */
    subscribe(eventType: string, handler: EventHandler): EventSubscription {
        if (!this.subscriptions.has(eventType)) {
            this.subscriptions.set(eventType, []);
        }
        
        this.subscriptions.get(eventType)!.push(handler);
        
        // Registrar como listener também
        this.on(eventType, handler);
        
        // Retornar subscription com método para unsubscribe
        return {
            unsubscribe: () => {
                const handlers = this.subscriptions.get(eventType);
                if (handlers) {
                    const index = handlers.indexOf(handler);
                    if (index > -1) {
                        handlers.splice(index, 1);
                    }
                }
                this.removeListener(eventType, handler);
            }
        };
    }
    
    /**
     * Executar reações a eventos
     */
    private executeReactions(event: CognitiveEvent): void {
        const reactions = this.eventReactions.get(event.type) || [];
        
        for (const reaction of reactions) {
            if (this.evaluateCondition(reaction.condition, event)) {
                reaction.action(event).catch(err => {
                    console.error(`Reaction error for ${event.type}:`, err);
                });
            }
        }
    }
    
    /**
     * Avaliar condição de reação
     */
    private evaluateCondition(condition: any, event: CognitiveEvent): boolean {
        if (!condition) return true;
        
        if (condition.priority && condition.priority !== event.priority) {
            return false;
        }
        
        if (condition.data_contains) {
            return JSON.stringify(event.data).includes(condition.data_contains);
        }
        
        return true;
    }
    
    /**
     * Registrar reação automática a eventos
     */
    registerReaction(eventType: string, reaction: EventReaction): void {
        if (!this.eventReactions.has(eventType)) {
            this.eventReactions.set(eventType, []);
        }
        
        this.eventReactions.get(eventType)!.push(reaction);
    }
    
    /**
     * Disparar raciocínio cognitivo em tempo real
     */
    private triggerCognitiveResponse(event: CognitiveEvent): void {
        if (!this.reasoningEngine) return;
        
        // Encaminhar evento para reasoning engine
        console.log(`[COGNITION] Processing event: ${event.type}`);
        
        // Isso dispararia uma tarefa de raciocínio async
        // this.reasoningEngine.processEvent(event);
    }
    
    /**
     * Manipular alerta de segurança
     */
    private handleSecurityAlert(event: CognitiveEvent): void {
        console.warn(`[SECURITY ALERT] ${event.data.alert_type}: ${event.data.message}`);
        
        // Aqui você poderia:
        // 1. Congelar certas operações
        // 2. Logar para auditoria
        // 3. Notificar usuário
        // 4. Chamar kernel para isolamento
    }
    
    /**
     * Manipular bateria baixa
     */
    private handleBatteryLow(event: CognitiveEvent): void {
        const battery_percent = event.data.battery_percent;
        
        if (battery_percent < 10) {
            console.warn(`[BATTERY CRITICAL] ${battery_percent}% remaining`);
            // Ativar modo de economia extrema
        } else if (battery_percent < 30) {
            console.warn(`[BATTERY LOW] ${battery_percent}% remaining`);
            // Ativar modo de economia
        }
    }
    
    /**
     * Obter histórico de eventos
     */
    getEventHistory(filter?: {
        type?: string;
        priority?: string;
        since?: Date;
        limit?: number;
    }): CognitiveEvent[] {
        let history = this.eventHistory;
        
        if (filter?.type) {
            history = history.filter(e => e.type === filter.type);
        }
        
        if (filter?.priority) {
            history = history.filter(e => e.priority === filter.priority);
        }
        
        if (filter?.since) {
            history = history.filter(e => e.timestamp! >= filter.since!);
        }
        
        if (filter?.limit) {
            history = history.slice(-filter.limit);
        }
        
        return history;
    }
    
    /**
     * Limpar histórico
     */
    clearHistory(): void {
        this.eventHistory = [];
    }
    
    /**
     * Obter estatísticas de eventos
     */
    getStatistics(): {
        total_events: number;
        events_by_type: Record<string, number>;
        events_by_priority: Record<string, number>;
    } {
        const stats = {
            total_events: this.eventHistory.length,
            events_by_type: {} as Record<string, number>,
            events_by_priority: {} as Record<string, number>
        };
        
        for (const event of this.eventHistory) {
            stats.events_by_type[event.type] = (stats.events_by_type[event.type] || 0) + 1;
            stats.events_by_priority[event.priority] = (stats.events_by_priority[event.priority] || 0) + 1;
        }
        
        return stats;
    }
}

// Instância global
const eventBus = new CognitiveEventBus();

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * ENDPOINT: POST /api/events
 * Publicar um evento
 */
router.post('/', (req: Request, res: Response) => {
    try {
        const { type, priority = 'normal', message, data = {} } = req.body;
        
        if (!type || !message) {
            return res.status(400).json({ error: 'type and message required' });
        }
        
        const event: CognitiveEvent = {
            type,
            priority,
            message,
            data,
            source: 'api'
        };
        
        eventBus.publishEvent(event);
        
        res.json({
            success: true,
            event_id: event.id,
            message: 'Event published'
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: GET /api/events
 * Obter histórico de eventos
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const { type, priority, since, limit } = req.query;
        
        const filter: any = {};
        if (type) filter.type = type;
        if (priority) filter.priority = priority;
        if (since) filter.since = new Date(since as string);
        if (limit) filter.limit = parseInt(limit as string);
        
        const history = eventBus.getEventHistory(filter);
        
        res.json({
            success: true,
            events: history,
            total: history.length
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: GET /api/events/stats
 * Obter estatísticas
 */
router.get('/stats', (req: Request, res: Response) => {
    try {
        const stats = eventBus.getStatistics();
        
        res.json({
            success: true,
            statistics: stats
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: DELETE /api/events
 * Limpar histórico
 */
router.delete('/', (req: Request, res: Response) => {
    try {
        eventBus.clearHistory();
        
        res.json({
            success: true,
            message: 'Event history cleared'
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: POST /api/events/subscribe
 * Subscrever a um tipo de evento (WebSocket)
 */
router.post('/subscribe', (req: Request, res: Response) => {
    try {
        const { event_type } = req.body;
        
        if (!event_type) {
            return res.status(400).json({ error: 'event_type required' });
        }
        
        // Subscrição criada
        const subscription = eventBus.subscribe(event_type, (event: CognitiveEvent) => {
            console.log(`Handler called for ${event_type}:`, event.message);
        });
        
        res.json({
            success: true,
            subscribed_to: event_type,
            message: 'Subscription created'
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// PUBLICADORES DE EVENTOS PADRÃO
// ============================================================================

/**
 * Publicar eventos do Kernel
 */
export function publishKernelEvent(
    type: string,
    data: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
) {
    eventBus.publishEvent({
        type: `kernel_${type}`,
        priority,
        message: `Kernel event: ${type}`,
        data,
        source: 'kernel'
    });
}

/**
 * Publicar eventos de segurança
 */
export function publishSecurityEvent(
    alert_type: string,
    message: string,
    data: any
) {
    eventBus.publishEvent({
        type: 'security_alert',
        priority: 'critical',
        message,
        data: { alert_type, ...data },
        source: 'security'
    });
}

/**
 * Publicar eventos de bateria
 */
export function publishBatteryEvent(battery_percent: number) {
    let priority: 'low' | 'normal' | 'high' | 'critical' = 'normal';
    
    if (battery_percent < 10) priority = 'critical';
    else if (battery_percent < 30) priority = 'high';
    
    eventBus.publishEvent({
        type: 'battery_low',
        priority,
        message: `Battery at ${battery_percent}%`,
        data: { battery_percent },
        source: 'system'
    });
}

/**
 * Publicar eventos de rede
 */
export function publishNetworkEvent(
    event_type: string,
    network_name: string,
    data: any
) {
    eventBus.publishEvent({
        type: `network_${event_type}`,
        priority: 'normal',
        message: `Network event: ${event_type} - ${network_name}`,
        data,
        source: 'network'
    });
}

/**
 * Publicar eventos de aplicativos
 */
export function publishAppEvent(
    app_name: string,
    event_type: 'opened' | 'closed' | 'crashed' | 'error',
    data: any
) {
    let priority: 'low' | 'normal' | 'high' | 'critical' = 'normal';
    if (event_type === 'crashed') priority = 'high';
    if (event_type === 'error') priority = 'high';
    
    eventBus.publishEvent({
        type: `app_${event_type}`,
        priority,
        message: `App event: ${app_name} - ${event_type}`,
        data: { app_name, ...data },
        source: 'app'
    });
}

/**
 * Publicar eventos de voz/usuário
 */
export function publishUserEvent(
    event_type: string,
    message: string,
    data: any
) {
    eventBus.publishEvent({
        type: `user_${event_type}`,
        priority: 'normal',
        message,
        data,
        source: 'user'
    });
}

/**
 * Publicar eventos de sistema
 */
export function publishSystemEvent(
    event_type: string,
    message: string,
    data: any,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
) {
    eventBus.publishEvent({
        type: `system_${event_type}`,
        priority,
        message,
        data,
        source: 'system'
    });
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

export async function initializeEventBus(reasoningEngine: any, kernelClient: any) {
    (eventBus as any).reasoningEngine = reasoningEngine;
    (eventBus as any).kernelClient = kernelClient;
    
    // Registrar reações automáticas
    eventBus.registerReaction('security_alert', {
        condition: { priority: 'critical' },
        action: async (event: CognitiveEvent) => {
            console.log('[AUTO-REACTION] Security threat detected, logging and notifying');
            // Chamar reasoning engine para responder
        }
    });
    
    eventBus.registerReaction('battery_low', {
        condition: { data_contains: '10' },
        action: async (event: CognitiveEvent) => {
            console.log('[AUTO-REACTION] Critical battery, entering extreme power saving mode');
        }
    });
    
    console.log('✓ Cognitive Event Bus initialized');
}

export default router;
