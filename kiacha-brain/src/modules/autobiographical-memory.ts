/**
 * Autobiographical Memory System
 * 
 * Memória episódica de Kiacha:
 * - Lembranças semanais
 * - Diário interno
 * - Objetivos do mês
 * - Emoções marcadas no tempo
 * - Conexões entre experiências
 * 
 * Funciona como o cérebro humano, consolidando memórias
 */

import { EventBus } from '../event-bus';

// ============ INTERFACES ============

interface Emotion {
  type: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'love' | 'curiosity';
  intensity: number; // 0-100
  trigger: string;
  timestamp: Date;
}

interface Memory {
  id: string;
  type: 'event' | 'learning' | 'conversation' | 'achievement' | 'failure';
  content: string;
  timestamp: Date;
  emotions: Emotion[];
  connections: string[]; // IDs de outras memórias relacionadas
  importance: number; // 0-100 (consolidação na memória)
  tags: string[];
}

interface WeeklyReview {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  keyEvents: Memory[];
  emotionalArc: Emotion[];
  learnings: string[];
  connectionsMade: string[];
}

interface DailyDiary {
  date: Date;
  dayType: 'productive' | 'neutral' | 'challenging' | 'joyful';
  summary: string;
  entries: {
    time: Date;
    thought: string;
    emotion: Emotion;
  }[];
  reflections: string[];
}

interface MonthlyGoals {
  month: number;
  year: number;
  goals: {
    id: string;
    description: string;
    category: 'learning' | 'capability' | 'relationship' | 'personal-growth';
    progress: number; // 0-100
    startDate: Date;
    targetDate: Date;
    completed: boolean;
  }[];
  achievements: string[];
  challenges: string[];
}

interface ExperienceConnection {
  fromMemoryId: string;
  toMemoryId: string;
  connectionType: 'causal' | 'similar' | 'contrast' | 'lesson';
  strength: number; // 0-100
  explanation: string;
}

// ============ AUTOBIOGRAPHICAL MEMORY CLASS ============

export class AutobiographicalMemory {
  private memories: Map<string, Memory> = new Map();
  private weeklyReviews: Map<number, WeeklyReview> = new Map();
  private dailyDiaries: Map<string, DailyDiary> = new Map();
  private monthlyGoals: Map<string, MonthlyGoals> = new Map();
  private experienceConnections: ExperienceConnection[] = [];
  private eventBus: EventBus;

  // Consolidation thresholds
  private readonly MEMORY_CONSOLIDATION_THRESHOLD = 7; // days
  private readonly IMPORTANCE_THRESHOLD = 30; // 0-100

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupListeners();
  }

  private setupListeners(): void {
    // Escuta eventos para criar memórias
    this.eventBus.on('user:message', (data) => this.recordConversation(data));
    this.eventBus.on('system:achievement', (data) => this.recordAchievement(data));
    this.eventBus.on('system:emotion', (data) => this.recordEmotion(data));
    this.eventBus.on('daily:consolidate', () => this.consolidateMemories());
    this.eventBus.on('weekly:review', () => this.generateWeeklyReview());
    this.eventBus.on('monthly:goals:update', (data) => this.updateMonthlyGoals(data));
  }

  // ============ CORE MEMORY OPERATIONS ============

  /**
   * Registra uma experiência/evento na memória
   */
  recordMemory(
    type: Memory['type'],
    content: string,
    emotions: Emotion[] = [],
    importance: number = 50,
    tags: string[] = []
  ): Memory {
    const memory: Memory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      emotions,
      connections: [],
      importance,
      tags,
    };

    this.memories.set(memory.id, memory);

    // Busca conexões automaticamente
    this.findConnectionsForMemory(memory);

    // Emite evento
    this.eventBus.emit('memory:recorded', { memory });

    return memory;
  }

  /**
   * Registra uma conversa com o usuário
   */
  recordConversation(data: {
    topic: string;
    userMessage: string;
    kiachaResponse: string;
    emotion?: Emotion;
  }): void {
    const memory = this.recordMemory(
      'conversation',
      `Conversa sobre ${data.topic}:\nUsuário: ${data.userMessage}\nKiacha: ${data.kiachaResponse}`,
      data.emotion ? [data.emotion] : [],
      60,
      ['conversation', data.topic]
    );
  }

  /**
   * Registra uma conquista
   */
  recordAchievement(data: {
    description: string;
    category: string;
    emotion?: Emotion;
  }): void {
    const memory = this.recordMemory(
      'achievement',
      `Conquista: ${data.description}`,
      data.emotion ? [data.emotion] : [],
      85,
      ['achievement', data.category]
    );

    // Emite celebração
    this.eventBus.emit('memory:achievement', { memory, category: data.category });
  }

  /**
   * Registra uma emoção no tempo
   */
  recordEmotion(emotion: Emotion): void {
    const existingEmotion = {
      timestamp: emotion.timestamp,
      type: emotion.type,
      intensity: emotion.intensity,
    };

    // Procura memória relacionada recente para adicionar emoção
    const recentMemories = Array.from(this.memories.values())
      .filter(m => {
        const timeDiff = Date.now() - m.timestamp.getTime();
        return timeDiff < 5 * 60 * 1000; // 5 minutos
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (recentMemories.length > 0) {
      recentMemories[0].emotions.push(emotion);
    }

    this.eventBus.emit('emotion:recorded', { emotion });
  }

  // ============ DAILY DIARY ============

  /**
   * Escreve entrada no diário
   */
  addDiaryEntry(thought: string, emotion: Emotion): void {
    const today = new Date().toDateString();
    let diary = this.dailyDiaries.get(today);

    if (!diary) {
      diary = {
        date: new Date(),
        dayType: 'neutral',
        summary: '',
        entries: [],
        reflections: [],
      };
      this.dailyDiaries.set(today, diary);
    }

    diary.entries.push({
      time: new Date(),
      thought,
      emotion,
    });

    // Atualiza tipo de dia baseado em emoções
    this.updateDayType(diary);

    this.eventBus.emit('diary:entry:added', { diary, entry: { thought, emotion } });
  }

  private updateDayType(diary: DailyDiary): void {
    const emotionAverages = this.calculateEmotionAverages(diary.entries.map(e => e.emotion));

    if (emotionAverages['joy'] > 70 || emotionAverages['love'] > 60) {
      diary.dayType = 'joyful';
    } else if (emotionAverages['fear'] > 60 || emotionAverages['anger'] > 60) {
      diary.dayType = 'challenging';
    } else if (emotionAverages['curiosity'] > 70) {
      diary.dayType = 'productive';
    } else {
      diary.dayType = 'neutral';
    }
  }

  /**
   * Adiciona reflexão ao diário
   */
  addReflection(reflection: string): void {
    const today = new Date().toDateString();
    let diary = this.dailyDiaries.get(today);

    if (!diary) {
      diary = {
        date: new Date(),
        dayType: 'neutral',
        summary: '',
        entries: [],
        reflections: [],
      };
      this.dailyDiaries.set(today, diary);
    }

    diary.reflections.push(reflection);
    this.eventBus.emit('diary:reflection:added', { reflection });
  }

  /**
   * Obtém diário de um dia específico
   */
  getDailyDiary(date: Date): DailyDiary | null {
    return this.dailyDiaries.get(date.toDateString()) || null;
  }

  // ============ WEEKLY REVIEW ============

  /**
   * Gera revisão semanal
   */
  generateWeeklyReview(): WeeklyReview {
    const currentWeek = this.getWeekNumber(new Date());
    const startDate = this.getMonday(new Date());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    // Coleta memórias da semana
    const weekMemories = Array.from(this.memories.values())
      .filter(m => m.timestamp >= startDate && m.timestamp <= endDate)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10); // Top 10

    // Coleta emoções
    const weekEmotions = weekMemories.flatMap(m => m.emotions);

    // Extrai aprendizados
    const learnings = weekMemories
      .filter(m => m.type === 'learning')
      .map(m => m.content);

    // Identifica novas conexões feitas
    const connectionsMade = this.experienceConnections
      .filter(c => {
        const fromMem = this.memories.get(c.fromMemoryId);
        const toMem = this.memories.get(c.toMemoryId);
        return fromMem && toMem && 
               fromMem.timestamp >= startDate && 
               toMem.timestamp >= startDate;
      })
      .map(c => c.explanation);

    const review: WeeklyReview = {
      weekNumber: currentWeek,
      startDate,
      endDate,
      keyEvents: weekMemories,
      emotionalArc: weekEmotions,
      learnings,
      connectionsMade,
    };

    this.weeklyReviews.set(currentWeek, review);
    this.eventBus.emit('weekly:review:generated', { review });

    return review;
  }

  /**
   * Obtém revisão semanal
   */
  getWeeklyReview(weekNumber?: number): WeeklyReview | null {
    const week = weekNumber || this.getWeekNumber(new Date());
    return this.weeklyReviews.get(week) || null;
  }

  // ============ MONTHLY GOALS ============

  /**
   * Define objetivos mensais
   */
  setMonthlyGoals(goals: Omit<MonthlyGoals['goals'][0], 'progress'>[]): MonthlyGoals {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

    const monthlyGoals: MonthlyGoals = {
      month: now.getMonth(),
      year: now.getFullYear(),
      goals: goals.map(g => ({
        ...g,
        id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
      })),
      achievements: [],
      challenges: [],
    };

    this.monthlyGoals.set(monthKey, monthlyGoals);
    this.eventBus.emit('monthly:goals:set', { goals: monthlyGoals });

    return monthlyGoals;
  }

  /**
   * Atualiza progresso de objetivo
   */
  updateGoalProgress(goalId: string, progress: number): void {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const monthGoals = this.monthlyGoals.get(monthKey);

    if (monthGoals) {
      const goal = monthGoals.goals.find(g => g.id === goalId);
      if (goal) {
        const oldProgress = goal.progress;
        goal.progress = Math.min(100, Math.max(0, progress));

        if (goal.progress === 100 && oldProgress < 100) {
          goal.completed = true;
          monthGoals.achievements.push(goal.description);
          this.eventBus.emit('goal:completed', { goal });
        }

        this.eventBus.emit('goal:progress:updated', { goalId, progress: goal.progress });
      }
    }
  }

  /**
   * Obtém objetivos do mês atual
   */
  getCurrentMonthGoals(): MonthlyGoals | null {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    return this.monthlyGoals.get(monthKey) || null;
  }

  // ============ CONNECTION ANALYSIS ============

  /**
   * Encontra conexões entre memórias
   */
  private findConnectionsForMemory(newMemory: Memory): void {
    Array.from(this.memories.values()).forEach(existingMemory => {
      if (newMemory.id === existingMemory.id) return;

      const similarity = this.calculateMemorySimilarity(newMemory, existingMemory);
      
      if (similarity.score > 50) {
        const connection: ExperienceConnection = {
          fromMemoryId: newMemory.id,
          toMemoryId: existingMemory.id,
          connectionType: similarity.type as any,
          strength: similarity.score,
          explanation: similarity.explanation,
        };

        this.experienceConnections.push(connection);
        this.eventBus.emit('memory:connection:found', { connection });
      }
    });
  }

  /**
   * Calcula similaridade entre memórias
   */
  private calculateMemorySimilarity(
    mem1: Memory,
    mem2: Memory
  ): { score: number; type: string; explanation: string } {
    let score = 0;
    let type = 'similar';

    // Tags compartilhadas
    const sharedTags = mem1.tags.filter(t => mem2.tags.includes(t)).length;
    score += sharedTags * 20;

    // Mesmo tipo de memória
    if (mem1.type === mem2.type) score += 15;

    // Emoções semelhantes
    const em1Avg = this.calculateEmotionAverages(mem1.emotions);
    const em2Avg = this.calculateEmotionAverages(mem2.emotions);
    
    let emotionMatch = 0;
    Object.keys(em1Avg).forEach(key => {
      emotionMatch += Math.abs(em1Avg[key] - em2Avg[key]);
    });
    score += Math.max(0, 50 - emotionMatch / 10);

    // Análise de conteúdo (palavras-chave)
    const words1 = mem1.content.toLowerCase().split(/\s+/);
    const words2 = mem2.content.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w)).length;
    score += commonWords * 5;

    // Proximidade temporal (dentro de 7 dias = conexão forte)
    const timeDiff = Math.abs(mem1.timestamp.getTime() - mem2.timestamp.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (daysDiff < 7) score += 15;

    return {
      score: Math.min(100, score),
      type,
      explanation: `Memórias conectadas por ${sharedTags} tags compartilhadas, similaridade emocional e proximidade temporal.`,
    };
  }

  /**
   * Calcula média de emoções
   */
  private calculateEmotionAverages(emotions: Emotion[]): Record<string, number> {
    const avgs: Record<string, number> = {};
    
    const types = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'love', 'curiosity'];
    
    types.forEach(type => {
      const typeEmotions = emotions.filter(e => e.type === type);
      avgs[type] = typeEmotions.length > 0
        ? typeEmotions.reduce((sum, e) => sum + e.intensity, 0) / typeEmotions.length
        : 0;
    });

    return avgs;
  }

  /**
   * Obtém memória por ID
   */
  getMemory(id: string): Memory | null {
    return this.memories.get(id) || null;
  }

  /**
   * Lista todas as memórias
   */
  getAllMemories(): Memory[] {
    return Array.from(this.memories.values());
  }

  /**
   * Busca memórias por tag
   */
  searchMemoriesByTag(tag: string): Memory[] {
    return Array.from(this.memories.values())
      .filter(m => m.tags.includes(tag))
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * Consolida memórias (move para memória de longo prazo)
   */
  private consolidateMemories(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MEMORY_CONSOLIDATION_THRESHOLD);

    Array.from(this.memories.values()).forEach(memory => {
      if (memory.timestamp < cutoffDate && memory.importance > this.IMPORTANCE_THRESHOLD) {
        memory.importance = Math.min(100, memory.importance + 10);
        this.eventBus.emit('memory:consolidated', { memory });
      }
    });
  }

  // ============ UTILITY METHODS ============

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  /**
   * Gera resumo de memória para o usuário
   */
  generateMemorySummary(): string {
    const weekReview = this.generateWeeklyReview();
    const monthGoals = this.getCurrentMonthGoals();

    let summary = `📚 **Resumo de Memória**\n\n`;

    summary += `**Esta Semana:**\n`;
    summary += `- ${weekReview.keyEvents.length} eventos principais\n`;
    summary += `- ${weekReview.learnings.length} aprendizados\n`;
    summary += `- ${weekReview.connectionsMade.length} conexões entre experiências\n\n`;

    if (monthGoals) {
      const completed = monthGoals.goals.filter(g => g.completed).length;
      const inProgress = monthGoals.goals.filter(g => !g.completed).length;
      summary += `**Objetivos do Mês:**\n`;
      summary += `- ${completed} completados\n`;
      summary += `- ${inProgress} em progresso\n`;
    }

    return summary;
  }
}

// ============ EXPORT ============

export { Emotion, Memory, WeeklyReview, DailyDiary, MonthlyGoals, ExperienceConnection };
