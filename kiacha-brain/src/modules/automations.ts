/**
 * Kiacha Automations System
 * 
 * Editor visual tipo Apple Shortcuts para criar automações:
 * "Quando X → fazer Y → fazer Z"
 */

import { EventBus } from '../event-bus';

// ============ INTERFACES ============

interface Trigger {
  id: string;
  type: 'time' | 'event' | 'condition' | 'user-action' | 'system-event';
  name: string;
  config: Record<string, any>;
  // Exemplos:
  // type: 'time' → { hour: 9, minute: 0 }
  // type: 'event' → { eventName: 'user:message' }
  // type: 'condition' → { systemLoad: 'low', temperature: '< 70' }
  // type: 'user-action' → { action: 'hotkey', keys: 'ctrl+shift+a' }
  // type: 'system-event' → { event: 'screen-locked', os: 'windows' }
}

interface Action {
  id: string;
  type:
    | 'open-app'
    | 'send-message'
    | 'change-theme'
    | 'set-focus-mode'
    | 'take-screenshot'
    | 'execute-script'
    | 'play-sound'
    | 'notify'
    | 'set-variable'
    | 'delay';
  name: string;
  config: Record<string, any>;
  // Exemplos:
  // type: 'open-app' → { appName: 'VSCode', args: ['file.txt'] }
  // type: 'send-message' → { to: 'user', message: 'Hello' }
  // type: 'change-theme' → { theme: 'dark' }
  // type: 'set-focus-mode' → { mode: 'focus', duration: 60 }
  // type: 'execute-script' → { script: 'console.log("test")' }
  // type: 'delay' → { milliseconds: 5000 }
}

interface Condition {
  id: string;
  operator: 'AND' | 'OR' | 'NOT';
  operands: (Condition | string)[]; // string = conditionId
}

interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: Trigger[];
  conditions?: Condition[];
  actions: Action[];
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  tags: string[];
}

interface AutomationBlueprint {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'daily' | 'entertainment' | 'system' | 'custom';
  templates: {
    triggers: Partial<Trigger>[];
    actions: Partial<Action>[];
  };
}

// ============ AUTOMATIONS ENGINE ============

export class AutomationsEngine {
  private automations: Map<string, Automation> = new Map();
  private blueprints: Map<string, AutomationBlueprint> = new Map();
  private executionLog: Array<{
    automationId: string;
    timestamp: Date;
    success: boolean;
    error?: string;
  }> = [];
  private eventBus: EventBus;
  private activeAutomations: Set<string> = new Set();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupDefaultBlueprints();
    this.setupTriggerListeners();
  }

  // ============ BLUEPRINT MANAGEMENT ============

  private setupDefaultBlueprints(): void {
    // Blueprint: Entrada no PC
    this.blueprints.set('arrival', {
      id: 'arrival',
      name: 'Chegada no PC',
      description: 'Ao desbloqueá-lo, abre apps e configura ambiente',
      category: 'daily',
      templates: {
        triggers: [
          { type: 'system-event', name: 'Screen unlocked', config: {} },
        ],
        actions: [
          { type: 'open-app', name: 'Abrir navegador', config: { appName: 'Chrome' } },
          { type: 'send-message', name: 'Mensagem de bom-dia', config: { message: 'Bom dia!' } },
          { type: 'change-theme', name: 'Tema claro', config: { theme: 'light' } },
        ],
      },
    });

    // Blueprint: Modo Foco
    this.blueprints.set('focus_mode', {
      id: 'focus_mode',
      name: 'Modo Foco',
      description: 'Ativa foco, desativa notificações, escurece tela',
      category: 'productivity',
      templates: {
        triggers: [
          { type: 'user-action', name: 'Hotkey F1', config: { hotkey: 'f1' } },
        ],
        actions: [
          { type: 'set-focus-mode', name: 'Ativa foco', config: { mode: 'focus', duration: 60 } },
          { type: 'change-theme', name: 'Tema escuro', config: { theme: 'dark' } },
          { type: 'notify', name: 'Notifica início', config: { message: 'Foco iniciado' } },
        ],
      },
    });

    // Blueprint: Saída do PC
    this.blueprints.set('departure', {
      id: 'departure',
      name: 'Saída do PC',
      description: 'Fecha apps, salva tudo, bloqueia',
      category: 'daily',
      templates: {
        triggers: [
          { type: 'system-event', name: 'Screen lock triggered', config: {} },
        ],
        actions: [
          { type: 'delay', name: 'Aguarda 2s', config: { milliseconds: 2000 } },
          { type: 'send-message', name: 'Mensagem de despedida', config: { message: 'Até logo!' } },
        ],
      },
    });

    // Blueprint: Backup Automático
    this.blueprints.set('auto_backup', {
      id: 'auto_backup',
      name: 'Backup Automático',
      description: 'Diariamente faz backup dos arquivos',
      category: 'system',
      templates: {
        triggers: [
          { type: 'time', name: 'Todos os dias 23:00', config: { hour: 23, minute: 0 } },
        ],
        actions: [
          { type: 'execute-script', name: 'Script backup', config: { script: 'backup_files()' } },
          { type: 'notify', name: 'Backup concluído', config: { message: 'Backup completo!' } },
        ],
      },
    });
  }

  /**
   * Cria automação a partir de blueprint
   */
  createFromBlueprint(blueprintId: string, customName?: string): Automation | null {
    const blueprint = this.blueprints.get(blueprintId);
    if (!blueprint) return null;

    const automation: Automation = {
      id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: customName || blueprint.name,
      description: blueprint.description,
      enabled: false,
      triggers: blueprint.templates.triggers.map(t => ({
        id: `trigger-${Math.random().toString(36).substr(2, 9)}`,
        type: t.type as Trigger['type'],
        name: t.name || 'Trigger',
        config: t.config || {},
      })),
      actions: blueprint.templates.actions.map(a => ({
        id: `action-${Math.random().toString(36).substr(2, 9)}`,
        type: a.type as Action['type'],
        name: a.name || 'Action',
        config: a.config || {},
      })),
      createdAt: new Date(),
      executionCount: 0,
      tags: [blueprint.category],
    };

    this.automations.set(automation.id, automation);
    this.eventBus.emit('automation:created', { automation });

    return automation;
  }

  /**
   * Cria automação vazia
   */
  createEmptyAutomation(name: string): Automation {
    const automation: Automation = {
      id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: '',
      enabled: false,
      triggers: [],
      actions: [],
      createdAt: new Date(),
      executionCount: 0,
      tags: ['custom'],
    };

    this.automations.set(automation.id, automation);
    this.eventBus.emit('automation:created', { automation });

    return automation;
  }

  /**
   * Lista blueprints disponíveis
   */
  getAvailableBlueprints(): AutomationBlueprint[] {
    return Array.from(this.blueprints.values());
  }

  // ============ TRIGGER MANAGEMENT ============

  /**
   * Adiciona trigger à automação
   */
  addTrigger(automationId: string, trigger: Omit<Trigger, 'id'>): Trigger | null {
    const automation = this.automations.get(automationId);
    if (!automation) return null;

    const newTrigger: Trigger = {
      id: `trigger-${Math.random().toString(36).substr(2, 9)}`,
      ...trigger,
    };

    automation.triggers.push(newTrigger);
    this.eventBus.emit('automation:trigger:added', { automationId, trigger: newTrigger });

    return newTrigger;
  }

  /**
   * Remove trigger
   */
  removeTrigger(automationId: string, triggerId: string): boolean {
    const automation = this.automations.get(automationId);
    if (!automation) return false;

    const index = automation.triggers.findIndex(t => t.id === triggerId);
    if (index === -1) return false;

    automation.triggers.splice(index, 1);
    this.eventBus.emit('automation:trigger:removed', { automationId, triggerId });

    return true;
  }

  /**
   * Atualiza trigger
   */
  updateTrigger(automationId: string, triggerId: string, updates: Partial<Trigger>): boolean {
    const automation = this.automations.get(automationId);
    if (!automation) return false;

    const trigger = automation.triggers.find(t => t.id === triggerId);
    if (!trigger) return false;

    Object.assign(trigger, updates);
    this.eventBus.emit('automation:trigger:updated', { automationId, trigger });

    return true;
  }

  // ============ ACTION MANAGEMENT ============

  /**
   * Adiciona ação à automação
   */
  addAction(automationId: string, action: Omit<Action, 'id'>): Action | null {
    const automation = this.automations.get(automationId);
    if (!automation) return null;

    const newAction: Action = {
      id: `action-${Math.random().toString(36).substr(2, 9)}`,
      ...action,
    };

    automation.actions.push(newAction);
    this.eventBus.emit('automation:action:added', { automationId, action: newAction });

    return newAction;
  }

  /**
   * Remove ação
   */
  removeAction(automationId: string, actionId: string): boolean {
    const automation = this.automations.get(automationId);
    if (!automation) return false;

    const index = automation.actions.findIndex(a => a.id === actionId);
    if (index === -1) return false;

    automation.actions.splice(index, 1);
    this.eventBus.emit('automation:action:removed', { automationId, actionId });

    return true;
  }

  /**
   * Reordena ações
   */
  reorderActions(automationId: string, actionIds: string[]): boolean {
    const automation = this.automations.get(automationId);
    if (!automation) return false;

    const reordered = actionIds
      .map(id => automation.actions.find(a => a.id === id))
      .filter((a): a is Action => a !== undefined);

    if (reordered.length !== automation.actions.length) return false;

    automation.actions = reordered;
    this.eventBus.emit('automation:actions:reordered', { automationId });

    return true;
  }

  // ============ AUTOMATION LIFECYCLE ============

  /**
   * Habilita automação
   */
  enableAutomation(automationId: string): boolean {
    const automation = this.automations.get(automationId);
    if (!automation) return false;

    if (automation.triggers.length === 0 || automation.actions.length === 0) {
      return false; // Não pode ativar sem triggers/actions
    }

    automation.enabled = true;
    this.activeAutomations.add(automationId);
    this.eventBus.emit('automation:enabled', { automation });

    return true;
  }

  /**
   * Desabilita automação
   */
  disableAutomation(automationId: string): boolean {
    const automation = this.automations.get(automationId);
    if (!automation) return false;

    automation.enabled = false;
    this.activeAutomations.delete(automationId);
    this.eventBus.emit('automation:disabled', { automation });

    return true;
  }

  /**
   * Executa automação
   */
  async executeAutomation(automationId: string): Promise<boolean> {
    const automation = this.automations.get(automationId);
    if (!automation || !automation.enabled) {
      return false;
    }

    try {
      for (const action of automation.actions) {
        await this.executeAction(action);
      }

      automation.executionCount++;
      automation.lastExecuted = new Date();

      this.executionLog.push({
        automationId,
        timestamp: new Date(),
        success: true,
      });

      this.eventBus.emit('automation:executed', { automation });
      return true;
    } catch (error) {
      this.executionLog.push({
        automationId,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.eventBus.emit('automation:execution:failed', { automationId, error });
      return false;
    }
  }

  /**
   * Executa uma ação específica
   */
  private async executeAction(action: Action): Promise<void> {
    switch (action.type) {
      case 'open-app':
        this.eventBus.emit('system:open-app', action.config);
        break;

      case 'send-message':
        this.eventBus.emit('user:message', {
          to: action.config.to || 'user',
          message: action.config.message,
          automation: true,
        });
        break;

      case 'change-theme':
        this.eventBus.emit('system:theme-changed', { theme: action.config.theme });
        break;

      case 'set-focus-mode':
        this.eventBus.emit('system:focus-mode', action.config);
        break;

      case 'notify':
        this.eventBus.emit('system:notify', {
          message: action.config.message,
          type: action.config.type || 'info',
        });
        break;

      case 'delay':
        await new Promise(resolve => setTimeout(resolve, action.config.milliseconds));
        break;

      case 'execute-script':
        // Em produção, executaria script com sandbox/isolamento
        this.eventBus.emit('system:script-execution', { script: action.config.script });
        break;

      case 'play-sound':
        this.eventBus.emit('system:play-sound', { sound: action.config.sound });
        break;

      case 'take-screenshot':
        this.eventBus.emit('system:screenshot', {});
        break;

      case 'set-variable':
        this.eventBus.emit('automation:set-variable', {
          variable: action.config.variable,
          value: action.config.value,
        });
        break;
    }
  }

  // ============ SETUP LISTENERS ============

  private setupTriggerListeners(): void {
    // Time triggers
    setInterval(() => {
      this.checkTimeTriggers();
    }, 60000); // Verifica a cada minuto

    // Event triggers
    this.eventBus.on('*', (eventName: string, data: any) => {
      this.checkEventTriggers(eventName, data);
    });

    // System event triggers
    this.eventBus.on('system:screen-locked', () => {
      this.checkSystemEventTriggers('screen-locked');
    });

    this.eventBus.on('system:screen-unlocked', () => {
      this.checkSystemEventTriggers('screen-unlocked');
    });
  }

  private checkTimeTriggers(): void {
    const now = new Date();

    Array.from(this.automations.values())
      .filter(a => a.enabled)
      .forEach(automation => {
        automation.triggers.forEach(trigger => {
          if (trigger.type === 'time') {
            if (
              trigger.config.hour === now.getHours() &&
              trigger.config.minute === now.getMinutes()
            ) {
              this.executeAutomation(automation.id);
            }
          }
        });
      });
  }

  private checkEventTriggers(eventName: string, data: any): void {
    Array.from(this.automations.values())
      .filter(a => a.enabled)
      .forEach(automation => {
        automation.triggers.forEach(trigger => {
          if (trigger.type === 'event' && trigger.config.eventName === eventName) {
            this.executeAutomation(automation.id);
          }
        });
      });
  }

  private checkSystemEventTriggers(eventName: string): void {
    Array.from(this.automations.values())
      .filter(a => a.enabled)
      .forEach(automation => {
        automation.triggers.forEach(trigger => {
          if (trigger.type === 'system-event' && trigger.config.event === eventName) {
            this.executeAutomation(automation.id);
          }
        });
      });
  }

  // ============ GETTERS ============

  getAutomation(id: string): Automation | null {
    return this.automations.get(id) || null;
  }

  getAllAutomations(): Automation[] {
    return Array.from(this.automations.values());
  }

  getActiveAutomations(): Automation[] {
    return Array.from(this.automations.values()).filter(a => a.enabled);
  }

  getExecutionLog(limit: number = 50) {
    return this.executionLog.slice(-limit);
  }

  /**
   * Gera resumo de automações
   */
  generateAutomationsSummary(): string {
    const total = this.automations.size;
    const active = Array.from(this.automations.values()).filter(a => a.enabled).length;
    const lastExecution = this.executionLog[this.executionLog.length - 1];

    let summary = `⚙️ **Automações**\n\n`;
    summary += `- **Total:** ${total}\n`;
    summary += `- **Ativas:** ${active}\n`;
    summary += `- **Última execução:** ${lastExecution?.timestamp.toLocaleString() || 'Nunca'}\n`;

    return summary;
  }

  deleteAutomation(automationId: string): boolean {
    const automation = this.automations.get(automationId);
    if (!automation) return false;

    this.disableAutomation(automationId);
    this.automations.delete(automationId);
    this.eventBus.emit('automation:deleted', { automationId });

    return true;
  }
}

// ============ EXPORT ============

export { Automation, Trigger, Action, Condition, AutomationBlueprint };
