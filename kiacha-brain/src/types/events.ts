/**
 * KIACHA OS - Cognitive Event Bus Type Definitions
 */

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';
export type EventSource = 'kernel' | 'app' | 'user' | 'system' | 'security' | 'network' | 'api';

export interface CognitiveEvent {
    id?: string;
    type: string;
    priority: EventPriority;
    message: string;
    data: Record<string, any>;
    source: EventSource;
    timestamp?: Date;
}

export type EventHandler = (event: CognitiveEvent) => void | Promise<void>;

export interface EventSubscription {
    unsubscribe(): void;
}

export interface EventReaction {
    condition?: {
        priority?: EventPriority;
        data_contains?: string;
        [key: string]: any;
    };
    action: (event: CognitiveEvent) => Promise<void>;
}

export interface EventBusConfig {
    maxHistorySize?: number;
    autoReactions?: boolean;
    reasoningIntegration?: boolean;
}

export interface EventStatistics {
    total_events: number;
    events_by_type: Record<string, number>;
    events_by_priority: Record<string, number>;
}

// ===== SPECIFIC EVENT TYPES =====

export interface KernelEvent extends CognitiveEvent {
    source: 'kernel';
    type: `kernel_${string}`;
}

export interface SecurityEvent extends CognitiveEvent {
    source: 'security';
    type: 'security_alert';
    data: {
        alert_type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        timestamp: Date;
    };
}

export interface NetworkEvent extends CognitiveEvent {
    source: 'network';
    type: `network_${string}`;
    data: {
        network_name: string;
        signal_strength?: number;
        ip_address?: string;
    };
}

export interface BatteryEvent extends CognitiveEvent {
    source: 'system';
    type: 'battery_low';
    data: {
        battery_percent: number;
        estimated_time_remaining?: number;
        charging?: boolean;
    };
}

export interface AppEvent extends CognitiveEvent {
    source: 'app';
    type: `app_${'opened' | 'closed' | 'crashed' | 'error'}`;
    data: {
        app_name: string;
        app_id?: string;
        pid?: number;
        error_message?: string;
    };
}

export interface UserEvent extends CognitiveEvent {
    source: 'user';
    type: `user_${string}`;
    data: {
        user_input?: string;
        gesture?: string;
        voice_command?: string;
    };
}
