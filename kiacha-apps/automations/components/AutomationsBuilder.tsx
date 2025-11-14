/**
 * AutomationsBuilder - Editor Visual de Automações
 * Tipo Apple Shortcuts com blocos drag-and-drop
 */

import React, { useState } from 'react';

interface Trigger {
  id: string;
  type: 'time' | 'event' | 'condition' | 'user-action';
  name: string;
}

interface Action {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
}

interface Automation {
  id: string;
  name: string;
  triggers: Trigger[];
  actions: Action[];
  enabled: boolean;
}

const AVAILABLE_TRIGGERS: Trigger[] = [
  { id: 'arrival', type: 'user-action', name: '🚪 Chegada no PC' },
  { id: 'departure', type: 'user-action', name: '🚶 Saída do PC' },
  { id: 'focus', type: 'user-action', name: '🎯 Ativar Foco' },
  { id: 'time', type: 'time', name: '⏰ Horário Específico' },
  { id: 'event', type: 'event', name: '📢 Evento do Sistema' },
];

const AVAILABLE_ACTIONS: Action[] = [
  { id: 'open-app', type: 'open-app', name: '📂 Abrir Aplicativo', config: {} },
  { id: 'send-msg', type: 'send-message', name: '💬 Enviar Mensagem', config: {} },
  { id: 'change-theme', type: 'change-theme', name: '🎨 Mudar Tema', config: {} },
  { id: 'focus-mode', type: 'set-focus-mode', name: '🔒 Modo Foco', config: {} },
  { id: 'notify', type: 'notify', name: '🔔 Notificar', config: {} },
  { id: 'screenshot', type: 'take-screenshot', name: '📸 Screenshot', config: {} },
];

export const AutomationsBuilder: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [showNewAutomation, setShowNewAutomation] = useState(false);

  const createNewAutomation = () => {
    const newAuto: Automation = {
      id: `auto-${Date.now()}`,
      name: 'Nova Automação',
      triggers: [],
      actions: [],
      enabled: false,
    };

    setAutomations([...automations, newAuto]);
    setSelectedAutomation(newAuto);
  };

  const addTrigger = (trigger: Trigger) => {
    if (!selectedAutomation) return;

    const updated = {
      ...selectedAutomation,
      triggers: [...selectedAutomation.triggers, trigger],
    };

    setSelectedAutomation(updated);
    setAutomations(
      automations.map(a => (a.id === updated.id ? updated : a))
    );
  };

  const addAction = (action: Action) => {
    if (!selectedAutomation) return;

    const updated = {
      ...selectedAutomation,
      actions: [...selectedAutomation.actions, action],
    };

    setSelectedAutomation(updated);
    setAutomations(
      automations.map(a => (a.id === updated.id ? updated : a))
    );
  };

  const removeFromAutomation = (id: string, type: 'trigger' | 'action') => {
    if (!selectedAutomation) return;

    const updated = {
      ...selectedAutomation,
      [type === 'trigger' ? 'triggers' : 'actions']: (
        selectedAutomation[type === 'trigger' ? 'triggers' : 'actions']
      ).filter((item: any) => item.id !== id),
    };

    setSelectedAutomation(updated);
    setAutomations(
      automations.map(a => (a.id === updated.id ? updated : a))
    );
  };

  const toggleAutomation = () => {
    if (!selectedAutomation) return;

    const updated = {
      ...selectedAutomation,
      enabled: !selectedAutomation.enabled,
    };

    setSelectedAutomation(updated);
    setAutomations(
      automations.map(a => (a.id === updated.id ? updated : a))
    );
  };

  return (
    <div className="automation-builder p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-purple-900 mb-2">⚙️ Automações</h2>
        <p className="text-gray-600">Crie fluxos automáticos tipo Apple Shortcuts</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lista de Automações */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Automações</h3>
              <button
                onClick={createNewAutomation}
                className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
              >
                + Nova
              </button>
            </div>

            <div className="space-y-2">
              {automations.map(auto => (
                <div
                  key={auto.id}
                  onClick={() => setSelectedAutomation(auto)}
                  className={`p-3 rounded cursor-pointer transition ${
                    selectedAutomation?.id === auto.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{auto.name}</div>
                  <div className="text-sm">
                    {auto.triggers.length} triggers → {auto.actions.length} ações
                  </div>
                  <div className={`text-xs mt-1 ${auto.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {auto.enabled ? '✅ Ativa' : '⭕ Inativa'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Visual */}
        {selectedAutomation && (
          <div className="col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-md space-y-6">
              {/* Nome */}
              <div>
                <label className="block font-semibold mb-2">Nome da Automação</label>
                <input
                  type="text"
                  value={selectedAutomation.name}
                  onChange={e => {
                    const updated = { ...selectedAutomation, name: e.target.value };
                    setSelectedAutomation(updated);
                    setAutomations(
                      automations.map(a => (a.id === updated.id ? updated : a))
                    );
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Triggers */}
              <div>
                <h4 className="font-bold mb-3 text-lg">🔔 Quando...</h4>
                <div className="space-y-2 mb-3">
                  {selectedAutomation.triggers.map(trigger => (
                    <div
                      key={trigger.id}
                      className="bg-blue-100 p-3 rounded-lg flex justify-between items-center"
                    >
                      <span className="font-semibold">{trigger.name}</span>
                      <button
                        onClick={() => removeFromAutomation(trigger.id, 'trigger')}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <select
                  onChange={e => {
                    const trigger = AVAILABLE_TRIGGERS.find(t => t.id === e.target.value);
                    if (trigger) addTrigger(trigger);
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">+ Adicionar Trigger</option>
                  {AVAILABLE_TRIGGERS.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div>
                <h4 className="font-bold mb-3 text-lg">→ Então...</h4>
                <div className="space-y-2 mb-3">
                  {selectedAutomation.actions.map((action, idx) => (
                    <div
                      key={action.id}
                      className="bg-green-100 p-3 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold">{idx + 1}. {action.name}</div>
                        <div className="text-sm text-gray-600">
                          {Object.entries(action.config).map(([k, v]) => (
                            <div key={k}>
                              {k}: {JSON.stringify(v)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromAutomation(action.id, 'action')}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <select
                  onChange={e => {
                    const action = AVAILABLE_ACTIONS.find(a => a.id === e.target.value);
                    if (action)
                      addAction({
                        ...action,
                        id: `action-${Date.now()}`,
                      });
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">+ Adicionar Ação</option>
                  {AVAILABLE_ACTIONS.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Controles */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={toggleAutomation}
                  className={`flex-1 py-2 rounded-lg font-bold transition ${
                    selectedAutomation.enabled
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {selectedAutomation.enabled ? '⏹️ Desativar' : '▶️ Ativar'}
                </button>

                <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600">
                  💾 Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exemplos Rápidos */}
      <div className="mt-8 grid grid-cols-4 gap-4">
        {[
          { icon: '🚪', name: 'Chegada' },
          { icon: '🎯', name: 'Foco' },
          { icon: '🌙', name: 'Noite' },
          { icon: '💾', name: 'Backup' },
        ].map((example, i) => (
          <button
            key={i}
            onClick={createNewAutomation}
            className="bg-gradient-to-br from-purple-400 to-blue-400 text-white p-4 rounded-lg hover:shadow-lg transition"
          >
            <div className="text-2xl mb-2">{example.icon}</div>
            <div className="font-semibold">{example.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AutomationsBuilder;
