/**
 * KIACHA OS - Tool Use Engine Type Definitions
 */

export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ToolParameter {
    type: string;
    description: string;
    optional?: boolean;
}

export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, ToolParameter>;
    required_permission: string;
    security_level: SecurityLevel;
}

export interface ToolCall {
    tool_name: string;
    tool_input: Record<string, any>;
    reasoning_task_id?: string;
}

export interface ToolResult {
    tool_name: string;
    success: boolean;
    output?: any;
    error?: string;
    execution_time: number;
}

export interface ToolPermission {
    user_id: string;
    tool_permissions: string[];
    granted_at: Date;
    granted_by: string;
}

export interface AuditLog {
    timestamp: Date;
    user_id: string;
    tool_name: string;
    tool_input: Record<string, any>;
    result_success: boolean;
    duration_ms: number;
    error?: string;
}
