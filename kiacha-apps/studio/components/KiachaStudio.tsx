/**
 * Kiacha Studio - Editor Visual de IA
 * Criação de fluxos cognitivos, personalidades e comportamentos
 */

import React, { useState } from 'react';

interface CognitiveNode {
  id: string;
  type: 'input' | 'process' | 'decision' | 'output' | 'memory';
  title: string;
  description: string;
  config: Record<string, any>;
  x: number;
  y: number;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  condition?: string;
}

interface CognitiveFlow {
  id: string;
  name: string;
  description: string;
  nodes: CognitiveNode[];
  connections: Connection[];
}

export const KiachaStudio: React.FC = () => {
  const [flows, setFlows] = useState<CognitiveFlow[]>([]);
  const [currentFlow, setCurrentFlow] = useState<CognitiveFlow | null>(null);
  const [selectedNode, setSelectedNode] = useState<CognitiveNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const nodeTypes = [
    { type: 'input', icon: '📥', label: 'Entrada', color: 'bg-blue-100' },
    { type: 'process', icon: '⚙️', label: 'Processamento', color: 'bg-purple-100' },
    { type: 'decision', icon: '🔀', label: 'Decisão', color: 'bg-yellow-100' },
    { type: 'memory', icon: '🧠', label: 'Memória', color: 'bg-pink-100' },
    { type: 'output', icon: '📤', label: 'Saída', color: 'bg-green-100' },
  ];

  const createNewFlow = () => {
    const newFlow: CognitiveFlow = {
      id: `flow-${Date.now()}`,
      name: 'Novo Fluxo Cognitivo',
      description: '',
      nodes: [],
      connections: [],
    };

    setFlows([...flows, newFlow]);
    setCurrentFlow(newFlow);
  };

  const addNode = (type: string, x: number, y: number) => {
    if (!currentFlow) return;

    const newNode: CognitiveNode = {
      id: `node-${Date.now()}`,
      type: type as any,
      title: `${type} ${currentFlow.nodes.length + 1}`,
      description: '',
      config: {},
      x,
      y,
    };

    const updated = {
      ...currentFlow,
      nodes: [...currentFlow.nodes, newNode],
    };

    setCurrentFlow(updated);
    setFlows(flows.map(f => (f.id === updated.id ? updated : f)));
  };

  const connectNodes = (fromId: string, toId: string) => {
    if (!currentFlow) return;

    const connection: Connection = {
      id: `conn-${Date.now()}`,
      from: fromId,
      to: toId,
    };

    const updated = {
      ...currentFlow,
      connections: [...currentFlow.connections, connection],
    };

    setCurrentFlow(updated);
    setFlows(flows.map(f => (f.id === updated.id ? updated : f)));
  };

  const deleteNode = (nodeId: string) => {
    if (!currentFlow) return;

    const updated = {
      ...currentFlow,
      nodes: currentFlow.nodes.filter(n => n.id !== nodeId),
      connections: currentFlow.connections.filter(
        c => c.from !== nodeId && c.to !== nodeId
      ),
    };

    setCurrentFlow(updated);
    setFlows(flows.map(f => (f.id === updated.id ? updated : f)));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedNode(null);
    }
  };

  return (
    <div className="kiacha-studio p-6 bg-gradient-to-br from-indigo-50 to-purple-50 h-screen flex gap-6">
      {/* Painel Esquerdo - Componentes */}
      <div className="w-64 bg-white rounded-lg shadow-lg p-4 overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">🎨 Componentes</h3>

        <div className="space-y-2 mb-6">
          {nodeTypes.map(nt => (
            <button
              key={nt.type}
              onClick={() => addNode(nt.type, 100, 100)}
              className={`w-full p-3 rounded-lg text-left hover:shadow-md transition ${nt.color}`}
            >
              <div className="font-semibold flex items-center gap-2">
                <span>{nt.icon}</span> {nt.label}
              </div>
              <div className="text-sm text-gray-600">Arraste para o canvas</div>
            </button>
          ))}
        </div>

        {/* Templates Pré-Construídos */}
        <h4 className="font-bold mb-3">📚 Templates</h4>
        <div className="space-y-2">
          {[
            { icon: '💬', name: 'Conversa' },
            { icon: '🎓', name: 'Aprendizado' },
            { icon: '🤝', name: 'Empatia' },
            { icon: '🔍', name: 'Análise' },
          ].map((template, i) => (
            <button
              key={i}
              className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white p-2 rounded-lg hover:shadow-md transition text-sm"
            >
              {template.icon} {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Painel Central - Canvas */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 shadow-md flex justify-between items-center">
          <div>
            {currentFlow ? (
              <div>
                <h2 className="text-xl font-bold text-purple-900">{currentFlow.name}</h2>
                <p className="text-gray-600">{currentFlow.description || 'Novo fluxo cognitivo'}</p>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-gray-600">Selecione um fluxo</h2>
            )}
          </div>

          <button
            onClick={createNewFlow}
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 font-bold"
          >
            + Novo Fluxo
          </button>
        </div>

        {/* Canvas */}
        {currentFlow && (
          <div
            onClick={handleCanvasClick}
            className="flex-1 bg-white rounded-lg shadow-md relative overflow-hidden border-2 border-dashed border-purple-300"
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {currentFlow.connections.map(conn => {
                const fromNode = currentFlow.nodes.find(n => n.id === conn.from);
                const toNode = currentFlow.nodes.find(n => n.id === conn.to);

                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={conn.id}
                    x1={fromNode.x + 75}
                    y1={fromNode.y + 40}
                    x2={toNode.x + 75}
                    y2={toNode.y + 40}
                    stroke="#a78bfa"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}

              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#a78bfa" />
                </marker>
              </defs>
            </svg>

            {/* Nodes */}
            <div className="absolute inset-0">
              {currentFlow.nodes.map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  draggable
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                  }}
                  className={`absolute w-32 p-3 rounded-lg cursor-move transition ${
                    selectedNode?.id === node.id
                      ? 'ring-2 ring-purple-500 shadow-lg'
                      : 'shadow-md'
                  } ${
                    node.type === 'input'
                      ? 'bg-blue-100 border-blue-300'
                      : node.type === 'process'
                      ? 'bg-purple-100 border-purple-300'
                      : node.type === 'decision'
                      ? 'bg-yellow-100 border-yellow-300'
                      : node.type === 'memory'
                      ? 'bg-pink-100 border-pink-300'
                      : 'bg-green-100 border-green-300'
                  } border-2`}
                >
                  <div className="font-semibold text-sm">{node.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{node.type}</div>

                  {/* Mini-Ports para conexões */}
                  <div className="flex justify-between mt-2 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full cursor-pointer hover:bg-red-600"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Painel Direito - Propriedades */}
      {selectedNode && (
        <div className="w-80 bg-white rounded-lg shadow-lg p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">⚙️ Propriedades</h3>
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="text-red-500 hover:text-red-700 text-lg"
            >
              🗑️
            </button>
          </div>

          <div className="space-y-4">
            {/* Tipo */}
            <div>
              <label className="block font-semibold text-sm mb-1">Tipo</label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono">
                {selectedNode.type}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block font-semibold text-sm mb-1">Título</label>
              <input
                type="text"
                value={selectedNode.title}
                onChange={e => {
                  const updated = { ...selectedNode, title: e.target.value };
                  setSelectedNode(updated);
                  if (currentFlow) {
                    const newFlow = {
                      ...currentFlow,
                      nodes: currentFlow.nodes.map(n => (n.id === updated.id ? updated : n)),
                    };
                    setCurrentFlow(newFlow);
                    setFlows(flows.map(f => (f.id === newFlow.id ? newFlow : f)));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block font-semibold text-sm mb-1">Descrição</label>
              <textarea
                value={selectedNode.description}
                onChange={e => {
                  const updated = { ...selectedNode, description: e.target.value };
                  setSelectedNode(updated);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>

            {/* Configurações */}
            <div>
              <label className="block font-semibold text-sm mb-1">Configurações</label>
              <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                <pre>{JSON.stringify(selectedNode.config, null, 2)}</pre>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t">
              <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600">
                Conectar
              </button>
              <button className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
                Testar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KiachaStudio;
