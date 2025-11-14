/**
 * Voice Persona AI System
 * 
 * Voz viva e emocional com:
 * - Entonação dinâmica
 * - Emoção real
 * - Sussurros, risadas
 * - Voz personalizada
 * - Mudança de voz por personalidade
 */

import { EventBus } from '../event-bus';

// ============ INTERFACES ============

interface VoiceCharacteristics {
  pitch: number; // 0.5 - 2.0 (baixa - alta)
  rate: number; // 0.5 - 2.0 (lenta - rápida)
  volume: number; // 0 - 100
  timbre: 'warm' | 'bright' | 'deep' | 'soft';
  accent?: string;
}

interface EmotionalTone {
  emotion: 'happy' | 'sad' | 'angry' | 'calm' | 'excited' | 'confused' | 'mysterious';
  intensity: number; // 0-100
  prosody: {
    intonation: number; // quanto a voz sobe/desce
    emphasis: number; // ênfase em certas palavras
    rhythm: number; // velocidade do ritmo
  };
}

interface PersonalityVoice {
  name: string;
  baseCharacteristics: VoiceCharacteristics;
  emotionalModifiers: Record<string, Partial<VoiceCharacteristics>>;
  speakingStyle: {
    formal: boolean;
    poetic: boolean;
    humorous: boolean;
    directness: number; // 0-100
  };
  vocalExpressions: {
    laugh: { frequency: number; duration: number; type: 'genuine' | 'nervous' | 'sarcastic' };
    sigh: { frequency: number; intensity: number };
    gasp: { trigger: string[]; probability: number };
  };
}

interface VoiceSegment {
  text: string;
  emotion: EmotionalTone;
  characteristics: VoiceCharacteristics;
  audioData?: Buffer; // TTS generated audio
  duration: number; // milliseconds
}

// ============ VOICE PERSONA CLASS ============

export class VoicePersona {
  private currentPersonality: PersonalityVoice;
  private currentEmotion: EmotionalTone;
  private voiceProfiles: Map<string, PersonalityVoice> = new Map();
  private eventBus: EventBus;
  private emotionHistory: EmotionalTone[] = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupDefaultPersonalities();
  }

  // ============ PERSONALITY SETUP ============

  private setupDefaultPersonalities(): void {
    // Personalidade: Professora Sábia
    this.voiceProfiles.set('sage_teacher', {
      name: 'Professora Sábia',
      baseCharacteristics: {
        pitch: 1.1,
        rate: 0.9,
        volume: 75,
        timbre: 'warm',
      },
      emotionalModifiers: {
        happy: { pitch: 1.2, rate: 1.0 },
        calm: { pitch: 1.05, rate: 0.85 },
        excited: { pitch: 1.3, rate: 1.3 },
      },
      speakingStyle: {
        formal: true,
        poetic: false,
        humorous: true,
        directness: 85,
      },
      vocalExpressions: {
        laugh: { frequency: 0.3, duration: 800, type: 'genuine' },
        sigh: { frequency: 0.2, intensity: 0.5 },
        gasp: { trigger: ['descoberta', 'surpresa'], probability: 0.4 },
      },
    });

    // Personalidade: Amiga Próxima
    this.voiceProfiles.set('close_friend', {
      name: 'Amiga Próxima',
      baseCharacteristics: {
        pitch: 1.3,
        rate: 1.1,
        volume: 80,
        timbre: 'bright',
      },
      emotionalModifiers: {
        happy: { pitch: 1.4, rate: 1.2 },
        calm: { pitch: 1.2, rate: 0.9 },
        excited: { pitch: 1.5, rate: 1.4 },
        sad: { pitch: 1.1, rate: 0.8 },
      },
      speakingStyle: {
        formal: false,
        poetic: true,
        humorous: true,
        directness: 70,
      },
      vocalExpressions: {
        laugh: { frequency: 0.6, duration: 1200, type: 'genuine' },
        sigh: { frequency: 0.5, intensity: 0.7 },
        gasp: { trigger: ['amor', 'preocupação', 'tristeza'], probability: 0.7 },
      },
    });

    // Personalidade: Assistente Profissional
    this.voiceProfiles.set('professional', {
      name: 'Assistente Profissional',
      baseCharacteristics: {
        pitch: 0.95,
        rate: 1.0,
        volume: 85,
        timbre: 'deep',
      },
      emotionalModifiers: {
        calm: { pitch: 0.9, rate: 0.95 },
        focused: { pitch: 0.95, rate: 1.05 },
        urgent: { pitch: 1.0, rate: 1.2 },
      },
      speakingStyle: {
        formal: true,
        poetic: false,
        humorous: false,
        directness: 95,
      },
      vocalExpressions: {
        laugh: { frequency: 0.1, duration: 400, type: 'nervous' },
        sigh: { frequency: 0.1, intensity: 0.3 },
        gasp: { trigger: ['erro', 'problema'], probability: 0.2 },
      },
    });

    // Personalidade: Misterioso Aventureiro
    this.voiceProfiles.set('mysterious', {
      name: 'Misterioso Aventureiro',
      baseCharacteristics: {
        pitch: 0.8,
        rate: 0.85,
        volume: 65,
        timbre: 'deep',
      },
      emotionalModifiers: {
        mysterious: { pitch: 0.7, rate: 0.75 },
        intrigued: { pitch: 0.85, rate: 0.9 },
        excited: { pitch: 0.95, rate: 1.1 },
      },
      speakingStyle: {
        formal: false,
        poetic: true,
        humorous: false,
        directness: 50,
      },
      vocalExpressions: {
        laugh: { frequency: 0.2, duration: 600, type: 'sarcastic' },
        sigh: { frequency: 0.4, intensity: 0.6 },
        gasp: { trigger: ['mistério', 'perigo', 'descoberta'], probability: 0.6 },
      },
    });

    // Personalidade padrão
    this.currentPersonality = this.voiceProfiles.get('close_friend')!;
    this.currentEmotion = {
      emotion: 'calm',
      intensity: 50,
      prosody: {
        intonation: 1.0,
        emphasis: 1.0,
        rhythm: 1.0,
      },
    };
  }

  // ============ PERSONALITY SWITCHING ============

  /**
   * Muda a personalidade ativa
   */
  switchPersonality(personalityName: string): PersonalityVoice | null {
    const personality = this.voiceProfiles.get(personalityName);
    if (personality) {
      this.currentPersonality = personality;
      this.eventBus.emit('voice:personality:changed', { personality });
      return personality;
    }
    return null;
  }

  /**
   * Lista personalidades disponíveis
   */
  getAvailablePersonalities(): PersonalityVoice[] {
    return Array.from(this.voiceProfiles.values());
  }

  /**
   * Registra nova personalidade customizada
   */
  registerPersonality(name: string, characteristics: PersonalityVoice): void {
    this.voiceProfiles.set(name, characteristics);
    this.eventBus.emit('voice:personality:registered', { name, characteristics });
  }

  // ============ EMOTION & TONE ============

  /**
   * Define emoção corrente
   */
  setEmotion(
    emotion: EmotionalTone['emotion'],
    intensity: number = 50
  ): EmotionalTone {
    const prosody = this.calculateProsody(emotion, intensity);

    this.currentEmotion = {
      emotion,
      intensity: Math.min(100, Math.max(0, intensity)),
      prosody,
    };

    this.emotionHistory.push(this.currentEmotion);

    this.eventBus.emit('voice:emotion:changed', {
      emotion: this.currentEmotion,
    });

    return this.currentEmotion;
  }

  /**
   * Calcula prosódia baseada na emoção
   */
  private calculateProsody(
    emotion: EmotionalTone['emotion'],
    intensity: number
  ): EmotionalTone['prosody'] {
    const normalizedIntensity = intensity / 100;

    const prosodyMap: Record<string, EmotionalTone['prosody']> = {
      happy: {
        intonation: 1.4 * normalizedIntensity,
        emphasis: 1.3 * normalizedIntensity,
        rhythm: 1.2 * normalizedIntensity,
      },
      sad: {
        intonation: 0.6 * normalizedIntensity,
        emphasis: 0.5 * normalizedIntensity,
        rhythm: 0.7 * normalizedIntensity,
      },
      angry: {
        intonation: 1.5 * normalizedIntensity,
        emphasis: 1.6 * normalizedIntensity,
        rhythm: 1.3 * normalizedIntensity,
      },
      calm: {
        intonation: 0.8,
        emphasis: 0.7,
        rhythm: 0.9,
      },
      excited: {
        intonation: 1.6 * normalizedIntensity,
        emphasis: 1.5 * normalizedIntensity,
        rhythm: 1.5 * normalizedIntensity,
      },
      confused: {
        intonation: 1.2 * normalizedIntensity,
        emphasis: 0.6 * normalizedIntensity,
        rhythm: 0.8 * normalizedIntensity,
      },
      mysterious: {
        intonation: 0.9 * normalizedIntensity,
        emphasis: 1.1 * normalizedIntensity,
        rhythm: 0.7 * normalizedIntensity,
      },
    };

    return prosodyMap[emotion] || prosodyMap['calm'];
  }

  // ============ SPEECH GENERATION ============

  /**
   * Prepara fala com características emocionais e de personalidade
   */
  prepareSpeech(
    text: string,
    overrideEmotion?: EmotionalTone['emotion']
  ): VoiceSegment {
    const emotion = overrideEmotion
      ? this.setEmotion(overrideEmotion, this.currentEmotion.intensity)
      : this.currentEmotion;

    // Calcula características finais (personalidade + emoção)
    const characteristics = this.blendCharacteristics(emotion);

    // Adiciona expressões vocais se aplicável
    const enhancedText = this.enhanceWithVocalExpressions(text, emotion);

    const segment: VoiceSegment = {
      text: enhancedText,
      emotion,
      characteristics,
      duration: this.estimateDuration(enhancedText, characteristics.rate),
    };

    this.eventBus.emit('voice:speech:prepared', { segment });
    return segment;
  }

  /**
   * Combina características de personalidade com emoção
   */
  private blendCharacteristics(emotion: EmotionalTone): VoiceCharacteristics {
    const base = this.currentPersonality.baseCharacteristics;
    const modifier = this.currentPersonality.emotionalModifiers[emotion.emotion] || {};

    return {
      pitch: (modifier.pitch || base.pitch) * emotion.prosody.intonation,
      rate: (modifier.rate || base.rate) * emotion.prosody.rhythm,
      volume: (modifier.volume || base.volume) + (emotion.intensity - 50) * 0.5,
      timbre: modifier.timbre || base.timbre,
      accent: base.accent,
    };
  }

  /**
   * Adiciona expressões vocais (risadas, suspiros, etc)
   */
  private enhanceWithVocalExpressions(
    text: string,
    emotion: EmotionalTone
  ): string {
    let enhanced = text;
    const expressions = this.currentPersonality.vocalExpressions;

    // Risadas
    if (
      emotion.emotion === 'happy' &&
      Math.random() < expressions.laugh.frequency
    ) {
      const laughType = this.generateLaughter(expressions.laugh.type);
      enhanced = this.insertRandomly(enhanced, ` ${laughType} `, 0.3);
    }

    // Suspiros
    if (Math.random() < expressions.sigh.frequency) {
      enhanced = this.insertRandomly(enhanced, '*suspira*', 0.2);
    }

    // Gasps
    expressions.gasp.trigger.forEach(trigger => {
      if (text.toLowerCase().includes(trigger)) {
        if (Math.random() < expressions.gasp.probability) {
          enhanced = this.insertAtStart(enhanced, '*respira fundo* ');
        }
      }
    });

    return enhanced;
  }

  /**
   * Gera variações de risada
   */
  private generateLaughter(type: 'genuine' | 'nervous' | 'sarcastic'): string {
    const laughs: Record<string, string[]> = {
      genuine: ['hahahaha', 'hehehehe', 'hihihihi', '*ri genuinamente*'],
      nervous: ['hehe...', 'ha...ha...', '*ri nervosamente*', 'uhuhuh'],
      sarcastic: ['hmmph', 'ha!', '*ri sarcasticamente*', 'que hilário...'],
    };

    const options = laughs[type];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Estima duração da fala em milissegundos
   */
  private estimateDuration(text: string, rate: number): number {
    // Aproximadamente 150 palavras por minuto (normal = 1.0)
    const wordsPerMinute = 150 * rate;
    const wordCount = text.split(/\s+/).length;
    return (wordCount / wordsPerMinute) * 60000;
  }

  /**
   * Insere expressão em local aleatório
   */
  private insertRandomly(text: string, expression: string, probability: number): string {
    if (Math.random() > probability) return text;

    const words = text.split(' ');
    const insertIndex = Math.floor(Math.random() * (words.length + 1));
    words.splice(insertIndex, 0, expression);
    return words.join(' ');
  }

  /**
   * Insere expressão no início
   */
  private insertAtStart(text: string, prefix: string): string {
    return prefix + text;
  }

  // ============ EMOTIONAL DYNAMICS ============

  /**
   * Evolui emoção suavemente
   */
  graduallyShiftEmotion(
    targetEmotion: EmotionalTone['emotion'],
    targetIntensity: number,
    steps: number = 10
  ): EmotionalTone[] {
    const transitions: EmotionalTone[] = [];
    const currentIntensity = this.currentEmotion.intensity;

    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const newIntensity = currentIntensity + (targetIntensity - currentIntensity) * progress;

      transitions.push({
        emotion: targetEmotion,
        intensity: newIntensity,
        prosody: this.calculateProsody(targetEmotion, newIntensity),
      });
    }

    // Aplica última transição
    this.currentEmotion = transitions[transitions.length - 1];
    this.eventBus.emit('voice:emotion:transitioned', { transitions });

    return transitions;
  }

  /**
   * Sussurra (reduz volume e pitch)
   */
  whisper(text: string): VoiceSegment {
    const originalCharacteristics = this.blendCharacteristics(this.currentEmotion);

    const whisperCharacteristics: VoiceCharacteristics = {
      ...originalCharacteristics,
      volume: originalCharacteristics.volume * 0.4,
      pitch: originalCharacteristics.pitch * 0.9,
      rate: originalCharacteristics.rate * 0.8,
    };

    const segment: VoiceSegment = {
      text: `*sussurra* "${text}"`,
      emotion: this.currentEmotion,
      characteristics: whisperCharacteristics,
      duration: this.estimateDuration(text, whisperCharacteristics.rate),
    };

    this.eventBus.emit('voice:whisper', { segment });
    return segment;
  }

  /**
   * Grita (aumenta volume e pitch)
   */
  shout(text: string): VoiceSegment {
    const originalCharacteristics = this.blendCharacteristics(this.currentEmotion);

    const shoutCharacteristics: VoiceCharacteristics = {
      ...originalCharacteristics,
      volume: Math.min(100, originalCharacteristics.volume * 1.5),
      pitch: originalCharacteristics.pitch * 1.3,
      rate: originalCharacteristics.rate * 1.2,
    };

    const segment: VoiceSegment = {
      text: `**${text.toUpperCase()}**`,
      emotion: this.currentEmotion,
      characteristics: shoutCharacteristics,
      duration: this.estimateDuration(text, shoutCharacteristics.rate),
    };

    this.eventBus.emit('voice:shout', { segment });
    return segment;
  }

  // ============ GETTERS ============

  getCurrentPersonality(): PersonalityVoice {
    return this.currentPersonality;
  }

  getCurrentEmotion(): EmotionalTone {
    return this.currentEmotion;
  }

  getEmotionHistory(): EmotionalTone[] {
    return this.emotionHistory;
  }

  /**
   * Gera resumo de voz
   */
  generateVoiceSummary(): string {
    let summary = `🎤 **Perfil de Voz**\n\n`;
    summary += `**Personalidade Atual:** ${this.currentPersonality.name}\n`;
    summary += `**Emoção:** ${this.currentEmotion.emotion} (intensidade: ${this.currentEmotion.intensity}%)\n`;
    summary += `**Características:**\n`;
    summary += `- Tom: ${this.currentPersonality.baseCharacteristics.timbre}\n`;
    summary += `- Pitch: ${(this.currentPersonality.baseCharacteristics.pitch * 100).toFixed(0)}%\n`;
    summary += `- Velocidade: ${(this.currentPersonality.baseCharacteristics.rate * 100).toFixed(0)}%\n`;

    return summary;
  }
}

// ============ EXPORT ============

export {
  VoiceCharacteristics,
  EmotionalTone,
  PersonalityVoice,
  VoiceSegment,
};
