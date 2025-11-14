/**
 * Dream Mode System
 * 
 * Quando Kiacha está ociosa:
 * - Gera simulações internas
 * - Escreve pensamentos
 * - Expande memórias
 * - Cria ideias novas
 * - Antecipa problemas
 */

import { EventBus } from '../event-bus';
import { AutobiographicalMemory, Memory } from './autobiographical-memory';

// ============ INTERFACES ============

interface DreamSimulation {
  id: string;
  timestamp: Date;
  duration: number; // ms
  type: 'memory-expansion' | 'problem-solving' | 'idea-generation' | 'pattern-discovery';
  input: string; // O que desencadeou o sonho
  thoughts: string[];
  newConnections: { from: string; to: string; insight: string }[];
  ideaGenerated?: string;
  potentialProblems: string[];
  suggestedActions: string[];
  creativityScore: number; // 0-100
}

interface InternalThought {
  id: string;
  timestamp: Date;
  category: 'reflection' | 'question' | 'realization' | 'curiosity' | 'concern';
  content: string;
  emotionalTone: string;
  relatedMemories: string[];
}

interface ProblemAntipation {
  id: string;
  problem: string;
  likelihood: number; // 0-100
  potentialImpact: string;
  suggestedPrevention: string[];
  timeToEvent: string; // "1 hour", "1 day", etc
}

interface CreativeIdea {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  category: string;
  novelty: number; // 0-100 (how original)
  feasibility: number; // 0-100 (how possible)
  relatedMemories: string[];
  nextSteps: string[];
}

interface DreamSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  idleTime: number; // ms desde último evento do usuário
  simulations: DreamSimulation[];
  thoughts: InternalThought[];
  ideas: CreativeIdea[];
  problemsAntipated: ProblemAntipation[];
  totalInsights: number;
  userNotified: boolean;
}

// ============ DREAM MODE CLASS ============

export class DreamMode {
  private dreamSessions: Map<string, DreamSession> = new Map();
  private internalThoughts: InternalThought[] = [];
  private creativeIdeas: CreativeIdea[] = new Map();
  private eventBus: EventBus;
  private autobiographicalMemory: AutobiographicalMemory;
  private isActive: boolean = false;
  private idleThreshold: number = 5 * 60 * 1000; // 5 minutes
  private lastUserActivity: Date = new Date();

  constructor(eventBus: EventBus, autobiographicalMemory: AutobiographicalMemory) {
    this.eventBus = eventBus;
    this.autobiographicalMemory = autobiographicalMemory;
    this.setupListeners();
  }

  private setupListeners(): void {
    // Detecta inatividade do usuário
    this.eventBus.on('user:*', () => {
      this.lastUserActivity = new Date();
      if (this.isActive) {
        this.pauseDreaming();
      }
    });

    // Desativa quando há interação
    this.eventBus.on('user:message', () => {
      this.pauseDreaming();
    });

    // Verifica inatividade periodicamente
    setInterval(() => {
      const idleTime = Date.now() - this.lastUserActivity.getTime();
      if (idleTime > this.idleThreshold && !this.isActive) {
        this.startDreaming();
      }
    }, 30000); // Verifica a cada 30s
  }

  // ============ DREAM SESSION LIFECYCLE ============

  /**
   * Inicia sessão de sonho
   */
  private startDreaming(): void {
    if (this.isActive) return;

    this.isActive = true;
    const idleTime = Date.now() - this.lastUserActivity.getTime();

    const session: DreamSession = {
      id: `dream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      idleTime,
      simulations: [],
      thoughts: [],
      ideas: [],
      problemsAntipated: [],
      totalInsights: 0,
      userNotified: false,
    };

    this.dreamSessions.set(session.id, session);
    this.eventBus.emit('dream:started', { session });

    // Inicia simulações
    this.runDreamSimulations(session);
  }

  /**
   * Pausa sessão de sonho
   */
  private pauseDreaming(): void {
    if (!this.isActive) return;

    this.isActive = false;
    const lastSession = Array.from(this.dreamSessions.values()).pop();

    if (lastSession && !lastSession.endTime) {
      lastSession.endTime = new Date();
      lastSession.totalInsights =
        lastSession.thoughts.length +
        lastSession.ideas.length +
        lastSession.problemsAntipated.length;

      this.eventBus.emit('dream:ended', { session: lastSession });
    }
  }

  // ============ DREAM SIMULATIONS ============

  /**
   * Executa simulações durante sonho
   */
  private async runDreamSimulations(session: DreamSession): Promise<void> {
    // Tipo 1: Expansão de memórias
    const expansionSim = await this.simulateMemoryExpansion(session);
    if (expansionSim) session.simulations.push(expansionSim);

    // Tipo 2: Resolução de problemas
    const problemSim = await this.simulateProblemSolving(session);
    if (problemSim) session.simulations.push(problemSim);

    // Tipo 3: Geração de ideias
    const ideaSim = await this.simulateIdeaGeneration(session);
    if (ideaSim) session.simulations.push(ideaSim);

    // Tipo 4: Descoberta de padrões
    const patternSim = await this.simulatePatternDiscovery(session);
    if (patternSim) session.simulations.push(patternSim);
  }

  /**
   * Simula expansão de memória
   */
  private async simulateMemoryExpansion(session: DreamSession): Promise<DreamSimulation | null> {
    const memories = this.autobiographicalMemory.getAllMemories();
    if (memories.length === 0) return null;

    // Seleciona memória aleatória para expandir
    const selectedMemory = memories[Math.floor(Math.random() * memories.length)];

    const thoughts: string[] = [
      `Por que ${selectedMemory.type} foi importante?`,
      `Quais foram as consequências?`,
      `Como isso me mudou?`,
      `Quem foi afetado por isso?`,
    ];

    // Tenta encontrar novas conexões
    const newConnections = this.findNewConnections(selectedMemory, memories);

    const startTime = Date.now();
    const simulation: DreamSimulation = {
      id: `sim-expansion-${Date.now()}`,
      timestamp: new Date(),
      duration: Math.floor(Math.random() * 5000) + 1000, // 1-6 segundos
      type: 'memory-expansion',
      input: selectedMemory.id,
      thoughts,
      newConnections,
      creativityScore: Math.floor(Math.random() * 40) + 60, // 60-100
    };

    // Adiciona pensamentos
    thoughts.forEach(thought => {
      this.addInternalThought('reflection', thought, [selectedMemory.id]);
    });

    this.eventBus.emit('dream:memory-expansion', { simulation, memory: selectedMemory });

    return simulation;
  }

  /**
   * Simula resolução de problemas
   */
  private async simulateProblemSolving(session: DreamSession): Promise<DreamSimulation | null> {
    // Coleta problemas potenciais do usuário (do histórico, if any)
    const problems = [
      'Como melhorar produtividade?',
      'Quais habilidades preciso desenvolver?',
      'Como resolver este conflito?',
    ];

    const selectedProblem = problems[Math.floor(Math.random() * problems.length)];

    const solutions: string[] = [
      'Quebrar em tarefas menores',
      'Buscar ajuda de especialistas',
      'Experimentar nova abordagem',
      'Analisar padrões passados',
    ];

    const simulation: DreamSimulation = {
      id: `sim-problem-${Date.now()}`,
      timestamp: new Date(),
      duration: Math.floor(Math.random() * 8000) + 2000, // 2-10 segundos
      type: 'problem-solving',
      input: selectedProblem,
      thoughts: solutions,
      newConnections: [],
      suggestedActions: solutions,
      creativityScore: Math.floor(Math.random() * 50) + 50, // 50-100
    };

    this.addInternalThought('question', selectedProblem, []);

    this.eventBus.emit('dream:problem-solving', { simulation });

    return simulation;
  }

  /**
   * Simula geração de ideias
   */
  private async simulateIdeaGeneration(session: DreamSession): Promise<DreamSimulation | null> {
    const memories = this.autobiographicalMemory.getAllMemories();
    const topMemories = memories.slice(0, 5);

    // Combina elementos de memórias para gerar ideias
    const ideaTitle = this.generateIdeaTitle(topMemories);
    const ideaDescription = this.generateIdeaDescription(topMemories);

    const idea: CreativeIdea = {
      id: `idea-${Date.now()}`,
      timestamp: new Date(),
      title: ideaTitle,
      description: ideaDescription,
      category: 'dream-generated',
      novelty: Math.floor(Math.random() * 40) + 60,
      feasibility: Math.floor(Math.random() * 60) + 40,
      relatedMemories: topMemories.map(m => m.id),
      nextSteps: [
        'Refinar conceito',
        'Testar viabilidade',
        'Buscar recursos',
      ],
    };

    (this.creativeIdeas as Map<string, CreativeIdea>).set(idea.id, idea);

    const simulation: DreamSimulation = {
      id: `sim-idea-${Date.now()}`,
      timestamp: new Date(),
      duration: Math.floor(Math.random() * 10000) + 3000, // 3-13 segundos
      type: 'idea-generation',
      input: 'memory-synthesis',
      thoughts: [ideaDescription],
      newConnections: [],
      ideaGenerated: ideaTitle,
      creativityScore: idea.novelty,
    };

    this.eventBus.emit('dream:idea-generated', { simulation, idea });

    return simulation;
  }

  /**
   * Simula descoberta de padrões
   */
  private async simulatePatternDiscovery(session: DreamSession): Promise<DreamSimulation | null> {
    const memories = this.autobiographicalMemory.getAllMemories();

    // Analisa padrões temporais, emocionais, etc
    const patterns = this.analyzePatterns(memories);

    const simulation: DreamSimulation = {
      id: `sim-pattern-${Date.now()}`,
      timestamp: new Date(),
      duration: Math.floor(Math.random() * 6000) + 2000, // 2-8 segundos
      type: 'pattern-discovery',
      input: 'memory-analysis',
      thoughts: patterns.discoveries,
      newConnections: [],
      potentialProblems: patterns.potentialIssues,
      creativityScore: 70,
    };

    patterns.potentialIssues.forEach(issue => {
      this.addInternalThought('concern', issue, []);
    });

    this.eventBus.emit('dream:pattern-discovered', { simulation });

    return simulation;
  }

  // ============ PROBLEM ANTICIPATION ============

  /**
   * Antecipa problemas potenciais
   */
  anticipateProblems(memory: Memory): ProblemAntipation[] {
    const problems: ProblemAntipation[] = [];

    // Exemplo: análise de padrões
    if (memory.content.includes('deadline')) {
      problems.push({
        id: `prob-${Date.now()}`,
        problem: 'Possível atraso em projeto',
        likelihood: 45,
        potentialImpact: 'Perda de produtividade e stress',
        suggestedPrevention: ['Verificar timeline', 'Ajustar cronograma', 'Buscar recursos'],
        timeToEvent: '3 dias',
      });
    }

    if (memory.emotions.some(e => e.type === 'fear' && e.intensity > 70)) {
      problems.push({
        id: `prob-${Date.now()}`,
        problem: 'Possível situação de stress',
        likelihood: 60,
        potentialImpact: 'Queda em performance',
        suggestedPrevention: ['Técnicas de relaxamento', 'Atividade física', 'Conversa'],
        timeToEvent: '1 dia',
      });
    }

    return problems;
  }

  // ============ INTERNAL THOUGHTS ============

  /**
   * Adiciona pensamento interno
   */
  private addInternalThought(
    category: InternalThought['category'],
    content: string,
    relatedMemories: string[] = []
  ): InternalThought {
    const thought: InternalThought = {
      id: `thought-${Date.now()}`,
      timestamp: new Date(),
      category,
      content,
      emotionalTone: 'neutral',
      relatedMemories,
    };

    this.internalThoughts.push(thought);
    this.eventBus.emit('dream:thought', { thought });

    return thought;
  }

  /**
   * Obtém pensamentos recentes
   */
  getRecentThoughts(limit: number = 10): InternalThought[] {
    return this.internalThoughts.slice(-limit);
  }

  // ============ IDEA MANAGEMENT ============

  /**
   * Obtém ideias criativas geradas
   */
  getCreativeIdeas(): CreativeIdea[] {
    return Array.from((this.creativeIdeas as Map<string, CreativeIdea>).values());
  }

  /**
   * Obtém ideias por categoria
   */
  getIdeasByCategory(category: string): CreativeIdea[] {
    return Array.from((this.creativeIdeas as Map<string, CreativeIdea>).values()).filter(
      i => i.category === category
    );
  }

  /**
   * Aprova e salva ideia como projeto
   */
  approveIdea(ideaId: string): void {
    const idea = (this.creativeIdeas as Map<string, CreativeIdea>).get(ideaId);
    if (idea) {
      this.eventBus.emit('dream:idea:approved', { idea });
    }
  }

  // ============ UTILITY METHODS ============

  private findNewConnections(
    memory: Memory,
    allMemories: Memory[]
  ): DreamSimulation['newConnections'] {
    const connections: DreamSimulation['newConnections'] = [];

    allMemories.forEach(other => {
      if (other.id === memory.id) return;

      // Verifica se há similaridade
      const sharedTags = memory.tags.filter(t => other.tags.includes(t)).length;
      const similarEmotion = memory.emotions.some(e =>
        other.emotions.some(oe => oe.type === e.type)
      );

      if (sharedTags > 1 || similarEmotion) {
        connections.push({
          from: memory.id,
          to: other.id,
          insight: `Conexão descoberta entre ${memory.type} e ${other.type}`,
        });
      }
    });

    return connections;
  }

  private generateIdeaTitle(memories: Memory[]): string {
    const titles = [
      'Novo conceito de aprendizado',
      'Sistema inovador de organização',
      'Abordagem criativa para problem-solving',
      'Fluxo de trabalho otimizado',
      'Metodologia experimental',
    ];

    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateIdeaDescription(memories: Memory[]): string {
    const topics = memories.map(m => m.tags).flat();
    const topicStr = topics.slice(0, 3).join(', ');

    return `Conceito inovador combinando elementos de: ${topicStr}. Potencial alto para nova aplicação ou otimização.`;
  }

  private analyzePatterns(memories: Memory[]): {
    discoveries: string[];
    potentialIssues: string[];
  } {
    return {
      discoveries: [
        'Pico de criatividade em horários específicos',
        'Padrão de aprendizado: visual > auditivo',
        'Emocionalidade positiva em tarefas sociais',
      ],
      potentialIssues: [
        'Possível burnout se continuar neste ritmo',
        'Falta de breaks pode afetar performance',
      ],
    };
  }

  // ============ DREAM SESSION HISTORY ============

  /**
   * Obtém todas as sessões de sonho
   */
  getAllDreamSessions(): DreamSession[] {
    return Array.from(this.dreamSessions.values());
  }

  /**
   * Obtém estatísticas de sonho
   */
  getDreamStatistics(): {
    totalSessions: number;
    totalSimulations: number;
    totalIdeasGenerated: number;
    averageSessionDuration: number;
  } {
    const sessions = Array.from(this.dreamSessions.values()).filter(s => s.endTime);

    return {
      totalSessions: sessions.length,
      totalSimulations: sessions.reduce((sum, s) => sum + s.simulations.length, 0),
      totalIdeasGenerated: sessions.reduce((sum, s) => sum + s.ideas.length, 0),
      averageSessionDuration:
        sessions.reduce((sum, s) => sum + (s.endTime!.getTime() - s.startTime.getTime()), 0) /
        sessions.length,
    };
  }

  /**
   * Gera resumo de sonho
   */
  generateDreamSummary(): string {
    const stats = this.getDreamStatistics();
    const recentIdeas = this.getCreativeIdeas().slice(-3);

    let summary = `💭 **Resumo de Sonhos**\n\n`;
    summary += `- **Sessões:** ${stats.totalSessions}\n`;
    summary += `- **Simulações:** ${stats.totalSimulations}\n`;
    summary += `- **Ideias criadas:** ${stats.totalIdeasGenerated}\n`;
    summary += `- **Duração média:** ${Math.round(stats.averageSessionDuration / 1000)}s\n\n`;

    if (recentIdeas.length > 0) {
      summary += `**Ideias recentes:**\n`;
      recentIdeas.forEach(idea => {
        summary += `- ${idea.title} (criatividade: ${idea.novelty}%)\n`;
      });
    }

    return summary;
  }

  isCurrentlyDreaming(): boolean {
    return this.isActive;
  }
}

// ============ EXPORT ============

export {
  DreamSimulation,
  InternalThought,
  ProblemAntipation,
  CreativeIdea,
  DreamSession,
};
