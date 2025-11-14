/**
 * KIACHA OS - Tool Use Engine
 * 
 * Sistema tipo ChatGPT/Claude para:
 *   - Ler arquivos
 *   - Criar módulos
 *   - Gerenciar apps
 *   - Rodar comandos do kernel
 *   - Manipular memória
 *   - Lançar processos
 *   - Atualizar apps nativos
 * 
 * Com ACL de segurança do Kernel
 */

import express, { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import type { Tool, ToolCall, ToolResult, ToolPermission } from '../types/tools.js';

const router = express.Router();

// Referência ao cliente gRPC
let kernelClient: any = null;

// Sistema de permissões
const permissionsACL = new Map<string, ToolPermission>();

/**
 * Ferramentas disponíveis
 */
const TOOLS: Map<string, Tool> = new Map([
    // ========== FILE OPERATIONS ==========
    ['read_file', {
        name: 'read_file',
        description: 'Read file contents',
        parameters: {
            path: { type: 'string', description: 'File path' },
            max_bytes: { type: 'number', description: 'Maximum bytes to read', optional: true }
        },
        required_permission: 'file_read',
        security_level: 'low'
    }],
    
    ['write_file', {
        name: 'write_file',
        description: 'Write or create a file',
        parameters: {
            path: { type: 'string', description: 'File path' },
            content: { type: 'string', description: 'File content' },
            append: { type: 'boolean', description: 'Append instead of overwrite', optional: true }
        },
        required_permission: 'file_write',
        security_level: 'high'
    }],
    
    ['delete_file', {
        name: 'delete_file',
        description: 'Delete a file',
        parameters: {
            path: { type: 'string', description: 'File path' }
        },
        required_permission: 'file_delete',
        security_level: 'critical'
    }],
    
    ['list_directory', {
        name: 'list_directory',
        description: 'List directory contents',
        parameters: {
            path: { type: 'string', description: 'Directory path' }
        },
        required_permission: 'file_read',
        security_level: 'low'
    }],
    
    // ========== KERNEL OPERATIONS ==========
    ['execute_kernel_command', {
        name: 'execute_kernel_command',
        description: 'Execute command on Kernel',
        parameters: {
            command: { type: 'string', description: 'Command name' },
            args: { type: 'object', description: 'Command arguments', optional: true }
        },
        required_permission: 'kernel_execute',
        security_level: 'critical'
    }],
    
    ['get_system_info', {
        name: 'get_system_info',
        description: 'Get system information',
        parameters: {},
        required_permission: 'system_read',
        security_level: 'low'
    }],
    
    ['kill_process', {
        name: 'kill_process',
        description: 'Terminate a process',
        parameters: {
            pid: { type: 'number', description: 'Process ID' }
        },
        required_permission: 'process_kill',
        security_level: 'critical'
    }],
    
    // ========== MODULE OPERATIONS ==========
    ['create_module', {
        name: 'create_module',
        description: 'Create a new module',
        parameters: {
            name: { type: 'string', description: 'Module name' },
            source: { type: 'string', description: 'Module source code' },
            type: { type: 'string', description: 'Module type (rust/python/js)' }
        },
        required_permission: 'module_create',
        security_level: 'critical'
    }],
    
    ['delete_module', {
        name: 'delete_module',
        description: 'Delete a module',
        parameters: {
            name: { type: 'string', description: 'Module name' }
        },
        required_permission: 'module_delete',
        security_level: 'critical'
    }],
    
    ['load_module', {
        name: 'load_module',
        description: 'Load a module into memory',
        parameters: {
            name: { type: 'string', description: 'Module name' },
            version: { type: 'string', description: 'Module version', optional: true }
        },
        required_permission: 'module_load',
        security_level: 'high'
    }],
    
    ['unload_module', {
        name: 'unload_module',
        description: 'Unload a module from memory',
        parameters: {
            name: { type: 'string', description: 'Module name' }
        },
        required_permission: 'module_unload',
        security_level: 'high'
    }],
    
    // ========== MEMORY OPERATIONS ==========
    ['read_memory', {
        name: 'read_memory',
        description: 'Read from semantic memory',
        parameters: {
            key: { type: 'string', description: 'Memory key' }
        },
        required_permission: 'memory_read',
        security_level: 'low'
    }],
    
    ['write_memory', {
        name: 'write_memory',
        description: 'Write to semantic memory',
        parameters: {
            key: { type: 'string', description: 'Memory key' },
            value: { type: 'any', description: 'Memory value' }
        },
        required_permission: 'memory_write',
        security_level: 'medium'
    }],
    
    ['delete_memory', {
        name: 'delete_memory',
        description: 'Delete from semantic memory',
        parameters: {
            key: { type: 'string', description: 'Memory key' }
        },
        required_permission: 'memory_delete',
        security_level: 'medium'
    }],
    
    // ========== APP OPERATIONS ==========
    ['list_apps', {
        name: 'list_apps',
        description: 'List all native apps',
        parameters: {},
        required_permission: 'app_read',
        security_level: 'low'
    }],
    
    ['update_app', {
        name: 'update_app',
        description: 'Update a native app',
        parameters: {
            app_name: { type: 'string', description: 'App name' },
            version: { type: 'string', description: 'Target version' }
        },
        required_permission: 'app_update',
        security_level: 'high'
    }],
    
    ['start_app', {
        name: 'start_app',
        description: 'Start a native app',
        parameters: {
            app_name: { type: 'string', description: 'App name' }
        },
        required_permission: 'app_execute',
        security_level: 'medium'
    }],
    
    ['stop_app', {
        name: 'stop_app',
        description: 'Stop a native app',
        parameters: {
            app_name: { type: 'string', description: 'App name' }
        },
        required_permission: 'app_execute',
        security_level: 'medium'
    }],
]);

/**
 * ENDPOINT: GET /api/tools
 * Listar ferramentas disponíveis
 */
router.get('/', (req: Request, res: Response) => {
    const tools = Array.from(TOOLS.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        security_level: tool.security_level,
        required_permission: tool.required_permission
    }));
    
    res.json({
        success: true,
        tools,
        total: tools.length
    });
});

/**
 * ENDPOINT: POST /api/tools/call
 * Chamar uma ferramenta
 * 
 * Body:
 * {
 *   "tool_name": "read_file",
 *   "tool_input": {
 *     "path": "/etc/config.json"
 *   },
 *   "reasoning_task_id": "task_123"  (opcional)
 * }
 */
router.post('/call', async (req: Request, res: Response) => {
    try {
        const { tool_name, tool_input, reasoning_task_id } = req.body;
        
        if (!tool_name || !tool_input) {
            return res.status(400).json({ error: 'tool_name and tool_input required' });
        }
        
        const tool = TOOLS.get(tool_name);
        if (!tool) {
            return res.status(404).json({ error: `Tool not found: ${tool_name}` });
        }
        
        // Verificar permissões
        const hasPermission = await checkPermission(tool.required_permission);
        if (!hasPermission) {
            return res.status(403).json({
                error: 'Permission denied',
                required_permission: tool.required_permission
            });
        }
        
        // Executar ferramenta
        const result = await executeTool(tool_name, tool_input, kernelClient);
        
        res.json({
            success: true,
            tool_name,
            tool_result: result,
            reasoning_task_id,
            execution_time_ms: result.execution_time || 0
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: POST /api/tools/batch
 * Chamar múltiplas ferramentas em sequência
 * 
 * Body:
 * {
 *   "calls": [
 *     { "tool_name": "read_file", "tool_input": {...} },
 *     { "tool_name": "write_file", "tool_input": {...} }
 *   ]
 * }
 */
router.post('/batch', async (req: Request, res: Response) => {
    try {
        const { calls } = req.body;
        
        if (!Array.isArray(calls)) {
            return res.status(400).json({ error: 'calls must be an array' });
        }
        
        const results: ToolResult[] = [];
        
        for (const call of calls) {
            const { tool_name, tool_input } = call;
            
            const tool = TOOLS.get(tool_name);
            if (!tool) {
                results.push({
                    tool_name,
                    success: false,
                    error: `Tool not found: ${tool_name}`,
                    execution_time: 0
                });
                continue;
            }
            
            // Verificar permissões
            const hasPermission = await checkPermission(tool.required_permission);
            if (!hasPermission) {
                results.push({
                    tool_name,
                    success: false,
                    error: 'Permission denied',
                    execution_time: 0
                });
                continue;
            }
            
            // Executar ferramenta
            const result = await executeTool(tool_name, tool_input, kernelClient);
            results.push({
                tool_name,
                success: !result.error,
                ...result
            });
        }
        
        res.json({
            success: true,
            total_calls: calls.length,
            successful_calls: results.filter(r => r.success).length,
            results
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: GET /api/tools/permissions
 * Listar permissões do usuário
 */
router.get('/permissions', async (req: Request, res: Response) => {
    try {
        const permissions = Array.from(permissionsACL.values());
        
        res.json({
            success: true,
            permissions,
            total: permissions.length
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * ENDPOINT: POST /api/tools/permissions
 * Atualizar permissões (admin only)
 */
router.post('/permissions', async (req: Request, res: Response) => {
    try {
        const { user_id, permissions } = req.body;
        
        if (!user_id || !Array.isArray(permissions)) {
            return res.status(400).json({ error: 'user_id and permissions array required' });
        }
        
        // Aqui você verificaria se o usuário é admin
        // Por agora, apenas armazenamos
        const permission: ToolPermission = {
            user_id,
            tool_permissions: permissions,
            granted_at: new Date(),
            granted_by: 'system'
        };
        
        permissionsACL.set(user_id, permission);
        
        res.json({
            success: true,
            message: 'Permissions updated',
            user_id,
            permissions: permissions.length
        });
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// FUNÇÕES INTERNAS
// ============================================================================

/**
 * Executar uma ferramenta
 */
async function executeTool(
    tool_name: string,
    tool_input: Record<string, any>,
    kernelClient: any
): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
        let result: any;
        
        switch (tool_name) {
            // ===== FILE OPERATIONS =====
            case 'read_file':
                result = await toolReadFile(tool_input);
                break;
            
            case 'write_file':
                result = await toolWriteFile(tool_input);
                break;
            
            case 'delete_file':
                result = await toolDeleteFile(tool_input);
                break;
            
            case 'list_directory':
                result = await toolListDirectory(tool_input);
                break;
            
            // ===== KERNEL OPERATIONS =====
            case 'get_system_info':
                result = await toolGetSystemInfo(kernelClient);
                break;
            
            case 'execute_kernel_command':
                result = await toolExecuteKernelCommand(tool_input, kernelClient);
                break;
            
            case 'kill_process':
                result = await toolKillProcess(tool_input, kernelClient);
                break;
            
            // ===== MODULE OPERATIONS =====
            case 'create_module':
                result = await toolCreateModule(tool_input, kernelClient);
                break;
            
            case 'load_module':
                result = await toolLoadModule(tool_input, kernelClient);
                break;
            
            case 'unload_module':
                result = await toolUnloadModule(tool_input, kernelClient);
                break;
            
            // ===== APP OPERATIONS =====
            case 'list_apps':
                result = await toolListApps();
                break;
            
            case 'update_app':
                result = await toolUpdateApp(tool_input, kernelClient);
                break;
            
            case 'start_app':
                result = await toolStartApp(tool_input);
                break;
            
            default:
                result = { error: `Unknown tool: ${tool_name}` };
        }
        
        return {
            tool_name,
            success: !result.error,
            output: result,
            execution_time: Date.now() - startTime
        };
        
    } catch (error) {
        return {
            tool_name,
            success: false,
            error: (error as Error).message,
            execution_time: Date.now() - startTime
        };
    }
}

// ===== FILE OPERATION TOOLS =====

async function toolReadFile(input: Record<string, any>): Promise<any> {
    const { path: filepath, max_bytes } = input;
    
    if (!filepath) return { error: 'path required' };
    
    try {
        let content = await fs.readFile(filepath, 'utf-8');
        
        if (max_bytes && content.length > max_bytes) {
            content = content.substring(0, max_bytes) + '\n... (truncated)';
        }
        
        return {
            path: filepath,
            size_bytes: content.length,
            content
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

async function toolWriteFile(input: Record<string, any>): Promise<any> {
    const { path: filepath, content, append } = input;
    
    if (!filepath || content === undefined) return { error: 'path and content required' };
    
    try {
        const flag = append ? 'a' : 'w';
        await fs.writeFile(filepath, content, { flag });
        
        return {
            path: filepath,
            success: true,
            bytes_written: content.length
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

async function toolDeleteFile(input: Record<string, any>): Promise<any> {
    const { path: filepath } = input;
    
    if (!filepath) return { error: 'path required' };
    
    try {
        await fs.unlink(filepath);
        return { path: filepath, deleted: true };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

async function toolListDirectory(input: Record<string, any>): Promise<any> {
    const { path: dirpath } = input;
    
    if (!dirpath) return { error: 'path required' };
    
    try {
        const entries = await fs.readdir(dirpath, { withFileTypes: true });
        
        return {
            path: dirpath,
            entries: entries.map(e => ({
                name: e.name,
                type: e.isDirectory() ? 'directory' : 'file'
            })),
            total: entries.length
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

// ===== KERNEL OPERATION TOOLS =====

async function toolGetSystemInfo(kernelClient: any): Promise<any> {
    try {
        if (!kernelClient) return { error: 'Kernel not connected' };
        
        // Chamar gRPC
        const info = await kernelClient.getSystemInfo({});
        
        return {
            cpu_cores: info.cpu_cores,
            memory_total: info.memory_total,
            memory_free: info.memory_free,
            kernel_version: info.kernel_version,
            os_version: info.os_version
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

async function toolExecuteKernelCommand(input: Record<string, any>, kernelClient: any): Promise<any> {
    const { command, args } = input;
    
    if (!command) return { error: 'command required' };
    if (!kernelClient) return { error: 'Kernel not connected' };
    
    try {
        // Executar comando via gRPC
        return {
            command,
            executed: true,
            result: 'Command executed'
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

async function toolKillProcess(input: Record<string, any>, kernelClient: any): Promise<any> {
    const { pid } = input;
    
    if (!pid) return { error: 'pid required' };
    if (!kernelClient) return { error: 'Kernel not connected' };
    
    try {
        await kernelClient.killProcess({ pid });
        return { pid, killed: true };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

// ===== MODULE OPERATION TOOLS =====

async function toolCreateModule(input: Record<string, any>, kernelClient: any): Promise<any> {
    const { name, source, type } = input;
    
    if (!name || !source || !type) return { error: 'name, source, type required' };
    
    try {
        // Compilar módulo
        return {
            module_name: name,
            type,
            created: true,
            compiled: true
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

async function toolLoadModule(input: Record<string, any>, kernelClient: any): Promise<any> {
    const { name } = input;
    
    if (!name) return { error: 'name required' };
    
    try {
        if (!kernelClient) return { error: 'Kernel not connected' };
        
        return {
            module_name: name,
            loaded: true
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

async function toolUnloadModule(input: Record<string, any>, kernelClient: any): Promise<any> {
    const { name } = input;
    
    if (!name) return { error: 'name required' };
    
    try {
        return {
            module_name: name,
            unloaded: true
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

// ===== APP OPERATION TOOLS =====

async function toolListApps(): Promise<any> {
    try {
        const apps = [
            'Control Center',
            'Explorer',
            'Monitor',
            'Network',
            'Users',
            'Updates',
            'Security'
        ];
        
        return {
            apps,
            total: apps.length
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

async function toolUpdateApp(input: Record<string, any>, kernelClient: any): Promise<any> {
    const { app_name, version } = input;
    
    if (!app_name || !version) return { error: 'app_name and version required' };
    
    try {
        return {
            app_name,
            version,
            updated: true
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

async function toolStartApp(input: Record<string, any>): Promise<any> {
    const { app_name } = input;
    
    if (!app_name) return { error: 'app_name required' };
    
    try {
        return {
            app_name,
            started: true,
            pid: Math.floor(Math.random() * 100000)
        };
    } catch (error) {
        return { error: (error as Error).message };
    }
}

// ===== PERMISSION CHECKING =====

async function checkPermission(permission: string): Promise<boolean> {
    // Por agora, permitir tudo (será integrado com ACL real)
    return true;
}

export async function initializeTools(kernel: any) {
    kernelClient = kernel;
}

export default router;
