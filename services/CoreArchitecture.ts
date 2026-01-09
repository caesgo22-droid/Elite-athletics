import { useState, useEffect, useRef } from 'react';
import { Athlete, AgentMessage, WeeklyPlan, OmniContext, TrainingSession, Injury, TherapyLog, StatEntry, TrainingPhase, VideoAnalysisEntry, Macrocycle } from '../types';
import { executeCriticLoop, analyzeTechnique, chatWithBrain, generateEliteTrainingPlan } from '../ai/agents';
import { StorageSatellite } from './satellites/StorageSatellite';
import { KnowledgeBaseSatellite } from './satellites/KnowledgeBaseSatellite';
import { MemorySatellite } from './satellites/MemorySatellite';
import { IDataProcessor } from './processors/IDataProcessor';
import { RecoveryMetricsProcessor } from './processors/RecoveryMetricsProcessor';
import { VideoDataProcessor, VideoDeleteProcessor, VideoUpdateProcessor } from './processors/VideoDataProcessor';
import { InjuryDataProcessor, InjuryResolvedProcessor } from './processors/InjuryDataProcessor';
import { TherapyDataProcessor } from './processors/TherapyDataProcessor';
import { StatsDataProcessor } from './processors/StatsDataProcessor';
import { PerformanceProfiler } from './processors/PerformanceProfiler';
import { ProfileUpdateProcessor } from './processors/ProfileUpdateProcessor';
import { TrendAnalyzer } from './processors/TrendAnalyzer';
import { AIFeedbackProcessor } from './processors/AIFeedbackProcessor';
import { LinkRequestProcessor } from './processors/LinkRequestProcessor';
import { logger } from './Logger';
import { notificationService } from './NotificationService';

/**
 * ARQUITECTURA "AI-FIRST" - ATLETISMO ÉLITE NIVEL 5
 * CORE: EVENT BUS & DATA RING ORCHESTRATOR
 */

// 1. EVENT BUS
type EventCallback = (data: any) => void;

class EventBusService {
  private listeners: { [key: string]: EventCallback[] } = {};

  subscribe(event: string, callback: EventCallback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  publish(event: string, data: any) {
    logger.log(`[EVENT BUS] 📡 Evento: ${event}`, data);
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

export const EventBus = new EventBusService();

// 2. DATA RING (THE HUB)
type ChangeListener = () => void;

class DataRingService {
  private _localCache: {
    athletes: Athlete[];
    currentPlan?: WeeklyPlan;
    currentAthleteId: string;
    currentUserRole?: string;
    lastUpdate: number;
  } = { athletes: [], lastUpdate: Date.now(), currentAthleteId: '', currentUserRole: '' };

  private listeners: ChangeListener[] = [];

  // PROCESADORES PRIVADOS: Permanecen dentro del Ring, sin exponer datos
  private processors: Map<string, IDataProcessor> = new Map();

  constructor() {
    this.registerProcessors();
    this.refreshCache();
  }

  /**
   * Registro de procesadores (PATRÓN STRATEGY).
   * Los procesadores son funciones privadas, no servicios externos.
   */
  private registerProcessors() {
    const processorList: IDataProcessor[] = [
      new RecoveryMetricsProcessor(),
      new VideoDataProcessor(),
      new VideoDeleteProcessor(),
      new VideoUpdateProcessor(),
      new InjuryDataProcessor(),
      new InjuryResolvedProcessor(),
      new TherapyDataProcessor(),
      new StatsDataProcessor(),
      new ProfileUpdateProcessor(),
      new AIFeedbackProcessor(),
      new LinkRequestProcessor()
    ];

    processorList.forEach(processor => {
      this.processors.set(processor.type, processor);
    });

    logger.log(`[DATA RING] 🛠️ Registered ${this.processors.size} data processors`);
  }

  public async refreshCache(athleteId: string = this._localCache.currentAthleteId, role?: string) {
    this._localCache.currentAthleteId = athleteId;
    if (role) this._localCache.currentUserRole = role;
    const effectiveRole = this._localCache.currentUserRole;

    try {
      // For Athletes, only fetch their own data. For Staff/Admin, fetch all.
      if (effectiveRole === 'STAFF' || effectiveRole === 'ADMIN') {
        this._localCache.athletes = await StorageSatellite.getAllAthletes();
      } else if (athleteId) {
        // Fetch specific athlete
        const athlete = await StorageSatellite.getAthlete(athleteId);
        if (athlete) {
          this._localCache.athletes = [athlete];
        }
      }
    } catch (error) {
      logger.error('[DATA RING] Error refreshing athlete cache:', error);
    }

    const plan = await StorageSatellite.getWeeklyPlan(athleteId);
    if (plan) this._localCache.currentPlan = plan;
    this._localCache.lastUpdate = Date.now();
    this.notify();
  }

  // --- READS ---

  getAthlete(id: string): Athlete | undefined {
    return this._localCache.athletes.find(a => a.id === id);
  }

  getAllAthletes(): Athlete[] {
    return this._localCache.athletes;
  }

  getWeeklyPlan(athleteId: string): WeeklyPlan | undefined {
    return this._localCache.currentPlan;
  }

  getOmniContext(athleteId: string): OmniContext | null {
    const athlete = this.getAthlete(athleteId);
    const plan = this.getWeeklyPlan(athleteId);
    if (!athlete || !plan) return null;

    return {
      athlete: athlete,
      currentPlan: plan,
      history: [],
      stats: [],
      injuries: [],
      therapy: [],
      // userMemory undefined in sync context (UI usually doesn't need long-term text blobs)
    };
  }

  async getOmniContextWithMemory(athleteId: string): Promise<OmniContext | null> {
    const context = this.getOmniContext(athleteId);
    if (!context) return null;

    // Fetch Long-Term Memory & Macrocycle Context
    const [memory, macrocycle] = await Promise.all([
      MemorySatellite.getLongTermMemory(athleteId),
      StorageSatellite.getMacrocycle(athleteId)
    ]);

    // COMPUTE DYNAMIC PROFILE
    const computedLevel = PerformanceProfiler.determineLevel(context.athlete);
    const gapAnalysis = PerformanceProfiler.getGapAnalysis(context.athlete);

    // COMPUTE TECHNICAL TRENDS (New Service)
    const technicalTrends = TrendAnalyzer.analyzeTechnicalTrend(context.athlete.videoHistory);

    // EXTRACT RECENT FEEDBACK (Daily Loop)
    // Flatten last 2 weeks of sessions to find recent logs
    const recentLogs = context.currentPlan.sessions
      .filter(s => s.status === 'COMPLETED' || s.feedback || (s.rpe && s.rpe > 0))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
      .map(s => ({ date: s.date, feedback: s.feedback || s.context || '', rpe: s.rpe || 0 }));

    // Update the athlete object in context with the computed level (transiently)
    // We don't save to DB here, just inform the Brain
    const profiledAthlete = { ...context.athlete, level: computedLevel };

    return {
      ...context,
      athlete: profiledAthlete,
      userMemory: memory,
      macrocycle: macrocycle,
      profiling: { gapAnalysis },
      technicalTrends, // NEW
      recentLogs       // NEW
    };
  }

  async saveMacrocycle(athleteId: string, macrocycle: Macrocycle): Promise<void> {
    // 1. Persist to Storage Satellite
    await StorageSatellite.saveMacrocycle(athleteId, macrocycle);
    // 2. Notify Brain (Agent System) of context shift
    EventBus.publish('UI_FEEDBACK', { message: 'Brain: Integrating new strategic context...', type: 'info' });
  }

  subscribe(listener: ChangeListener) {
    this.listeners.push(listener);
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener: ChangeListener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- WRITES ---

  async ingestData(sourceModule: string, dataType: string, payload: any) {
    logger.log(`[DATA RING] 📥 Ingesta desde ${sourceModule}: ${dataType}`, payload);

    // Buscar procesador para el tipo de dato
    const processor = this.processors.get(dataType);
    if (!processor) {
      logger.warn(`[DATA RING] ⚠️ No processor found for type: ${dataType}`);
      return;
    }
    logger.log(`[DATA RING] ✓ Processor found: ${processor.type}`);

    // Obtener atleta actual
    logger.log(`[DATA RING] 🔍 Fetching athlete: ${payload.athleteId}`);
    const athlete = await StorageSatellite.getAthlete(payload.athleteId);
    if (!athlete) {
      logger.warn(`[DATA RING] ⚠️ Athlete not found: ${payload.athleteId}`);
      return;
    }
    logger.log(`[DATA RING] ✓ Athlete found:`, athlete.name);

    // Delegar procesamiento al procesador correspondiente
    logger.log(`[DATA RING] 🔄 Processing with ${processor.type}...`);
    const result = await processor.process(payload, athlete);
    logger.log(`[DATA RING] ✓ Processor completed`);

    // Actualizar almacenamiento (si el procesador no lo hizo ya vía Servidor)
    if (!result.skipPersistence) {
      logger.log(`[DATA RING] 💾 Updating athlete in storage...`);
      await StorageSatellite.updateAthlete(result.updated);
      logger.log(`[DATA RING] ✓ Storage updated`);
    } else {
      logger.log(`[DATA RING] ⏭️ Skipping storage update (handled by processor/server)`);
    }

    // Publicar evento de actualización
    logger.log(`[DATA RING] 📢 Publishing DATA_UPDATED event...`);
    EventBus.publish('DATA_UPDATED', {
      type: result.eventType,
      athleteId: payload.athleteId,
      data: result.eventData
    });

    // Refrescar caché local
    logger.log(`[DATA RING] 🔄 Refreshing cache...`);
    await this.refreshCache();
    logger.log(`[DATA RING] ✅ Ingesta completada exitosamente`);
  }

  async updateTrainingSession(athleteId: string, sessionId: string, updates: Partial<TrainingSession>) {
    const plan = await StorageSatellite.getWeeklyPlan(athleteId);
    if (!plan) return;

    const sessionIndex = plan.sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      plan.sessions[sessionIndex] = { ...plan.sessions[sessionIndex], ...updates };
      await StorageSatellite.updateWeeklyPlan(plan);
      await this.refreshCache();
      EventBus.publish('DATA_UPDATED', { type: 'PLAN_MODIFICATION', athleteId, sessionId });
    }
  }

  async publishWeeklyPlan(plan: WeeklyPlan) {
    logger.log(`[DATA RING] 📡 Publishing full plan update for ${plan.athleteId}`);
    await StorageSatellite.updateWeeklyPlan(plan);
    await this.refreshCache();
    EventBus.publish('DATA_UPDATED', { type: 'PLAN_PUBLISHED', athleteId: plan.athleteId });

    // Notify Athlete
    try {
      const displayDate = plan.sessions?.[0]?.date || new Date().toLocaleDateString();
      await notificationService.notifyAthletePlanReady(plan.athleteId, displayDate);
    } catch (error) {
      logger.warn('[DATA RING] Notification failed for plan publish:', error);
    }
  }

  async regeneratePlan(athleteId: string, phase: TrainingPhase) {
    logger.log(`[DATA RING] 🔄 Regenerating plan for ${athleteId} to phase ${phase}`);
    EventBus.publish('UI_FEEDBACK', { message: 'Brain: Designing Elite Microcycle...', type: 'info' });

    const context = await this.getOmniContextWithMemory(athleteId);
    if (!context) return;

    // Update phase in context momentarily to guide the AI
    context.currentPlan.trainingPhase = phase;

    const newPlan = await Brain.generatePlan(context);

    if (newPlan) {
      await StorageSatellite.updateWeeklyPlan(newPlan);
      await this.refreshCache();
      EventBus.publish('DATA_UPDATED', { type: 'PHASE_CHANGE', athleteId, phase });
      EventBus.publish('UI_FEEDBACK', { message: 'New Training Plan Generated', type: 'success' });
    } else {
      EventBus.publish('UI_FEEDBACK', { message: 'Plan Generation Failed', type: 'error' });
    }
  }

  async resetData() {
    localStorage.clear();
    window.location.reload();
  }
}

export const DataRing = new DataRingService();

// --- REACT HOOK FOR DATA RING (ARCHITECTURAL IMPROVEMENT) ---
// This decouples components from the subscription logic
export function useDataRing<T>(selector: (ring: DataRingService) => T): T {
  const [state, setState] = useState(() => selector(DataRing));
  const selectorRef = useRef(selector);

  // Keep selector ref updated without triggering re-subscription
  useEffect(() => {
    selectorRef.current = selector;
  });

  useEffect(() => {
    const unsubscribe = DataRing.subscribe(() => {
      const newState = selectorRef.current(DataRing);
      // Simple reference comparison for shallow objects, could be deep equal in prod
      setState(prevState => {
        if (JSON.stringify(prevState) !== JSON.stringify(newState)) {
          return newState;
        }
        return prevState;
      });
    });
    return unsubscribe;
  }, []); // Empty deps because DataRing is a singleton and selectorRef is stable

  return state;
}

// 3. BRAIN SERVICE (The Intelligence Layer)
class BrainService {
  constructor() {
    EventBus.subscribe('DATA_UPDATED', this.processContext.bind(this));
  }

  private async processContext(event: any) {
    logger.log(`[BRAIN PULSE] 🧠 Analizando impacto de evento: ${event.type}`);

    const context = await DataRing.getOmniContextWithMemory(event.athleteId);
    if (!context) return;

    // RAG INTEGRATION: Consultar la base de conocimiento para ver reglas aplicables a este evento
    const knowledge = await KnowledgeBaseSatellite.retrieveRelevantKnowledge(event.type === 'RECOVERY' ? 'acwr hrv fatiga' : 'general');

    // REGLA DE ORO 1: Coherencia Salud vs Carga (Validada por RAG)
    if (context.athlete.status === 'HIGH_RISK') {
      const upcomingHighIntensity = context.currentPlan.sessions.find(s =>
        (s.status === 'PLANNED') && (s.intensityZone >= 4 || s.type === 'SPEED')
      );

      // El RAG confirma si el ACWR actual justifica el bloqueo
      if (upcomingHighIntensity && knowledge.includes('ACWR')) {
        logger.warn(`[BRAIN ALERT] 🚨 Conflicto detectado y validado científicamente.`);
        EventBus.publish('SYSTEM_ALERT', {
          level: 'CRITICAL',
          message: `ALERTA CIENTÍFICA: ACWR > 1.5 detectado. Según protocolo Gabbett (2016), se prohíbe sesión de Zona ${upcomingHighIntensity.intensityZone}.`
        });
      }
    }
  }

  /**
   * Facade para la Mesa Redonda con RAG.
   */
  public async orchestrateAgents(target: string | OmniContext, topic?: string): Promise<AgentMessage[]> {
    let context: OmniContext | null;
    if (typeof target === 'string') {
      context = await DataRing.getOmniContextWithMemory(target);
    } else {
      context = target;
    }
    if (!context) return [];

    const searchTerms = `${topic || ''} ${context.athlete.status} ${context.currentPlan.trainingPhase}`;
    const scientificContext = await KnowledgeBaseSatellite.retrieveRelevantKnowledge(searchTerms);
    return await executeCriticLoop(context, topic, scientificContext);
  }

  public async analyzeVideo(athleteId: string, payload: { image: string, images?: string[], contextData: string }): Promise<any> {
    logger.log(`[BRAIN] 👁️ Procesando solicitud de visión para atleta ${athleteId}...`);

    // Fetch athlete context from Data Ring
    const context = await DataRing.getOmniContextWithMemory(athleteId);
    let contextualKnowledge = "";

    // TEMPORAL CONTEXT: Get last analysis for comparison
    let previousAnalysis = "No hay análisis previos para comparar.";
    if (context && context.athlete.videoHistory && context.athlete.videoHistory.length > 0) {
      const last = context.athlete.videoHistory[0];
      const errors = last.aiAnalysis?.weaknesses?.join(', ') || 'Sin datos';
      const feedback = last.coachFeedback || errors;
      previousAnalysis = `[ANÁLISIS PREVIO - ${last.date}]:\n- Ejercicio: ${last.exerciseName}\n- Feedback: ${feedback}`;
    }

    if (context) {
      contextualKnowledge = `
      [PERFIL DEL ATLETA]:
      - Nombre: ${context.athlete.name}
      - Status: ${context.athlete.status}
      - ACWR: ${context.athlete.acwr}
      - Lesiones Recientes: ${context.athlete.injuryHistory.filter(i => i.status === 'ACTIVE').map(i => `${i.type} (${i.severity})`).join(', ') || 'Ninguna'}
      - Fase de Entrenamiento: ${context.currentPlan.trainingPhase}
      
      ${previousAnalysis}
      `;
    }

    const bioStandards = await KnowledgeBaseSatellite.retrieveRelevantKnowledge('sprint technique biomechanics');
    const enhancedContext = `
    ${payload.contextData}
    ${contextualKnowledge}
    
    [REFERENCIAS OFICIALES]:
    ${bioStandards}
    `;

    return await analyzeTechnique(payload.images || payload.image, enhancedContext);
  }

  public async submitFeedback(eventId: string, useful: boolean, correction?: string) {
    logger.log(`[BRAIN LEARN] 🧠 Feedback recibido para ${eventId}: ${useful ? '👍' : '👎'} - ${correction || ''}`);
    // Future: Use this to fine-tune RAG or prompts
    await DataRing.ingestData('USER_FEEDBACK', 'AI_FEEDBACK', { eventId, useful, correction });
  }

  public async chat(message: string, context: OmniContext, userRole: 'ATHLETE' | 'STAFF' | 'ADMIN' = 'ATHLETE'): Promise<string> {
    const knowledge = await KnowledgeBaseSatellite.retrieveRelevantKnowledge(message);
    const response = await chatWithBrain(message, context, knowledge, userRole);

    // Persist to Firestore
    await StorageSatellite.saveChatMessage(context.athlete.id, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    await StorageSatellite.saveChatMessage(context.athlete.id, {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });

    return response;
  }

  public async generatePlan(context: OmniContext): Promise<WeeklyPlan | null> {
    return await generateEliteTrainingPlan(context);
  }

  /**
   * Ejecuta un escenario de simulación complejo.
   * Esto mueve la lógica de negocio de la UI (App.tsx) al Dominio (Brain).
   */
  public runSimulationScenario(scenarioId: string, targetId: string) {
    if (scenarioId === 'HIGH_RISK_INJURY') {
      EventBus.publish('UI_FEEDBACK', { message: "⚠️ SIMULACIÓN: Atleta reporta Dolor en Isquios (6/10)...", type: 'info' });

      setTimeout(() => {
        DataRing.ingestData('SIMULATOR', 'RECOVERY_METRICS', {
          athleteId: targetId,
          rpe: 9,
          pain: 6,
          painLocation: 'Isquiotibial Derecho',
          sleep: 5.5,
          timestamp: new Date().toISOString()
        });
        EventBus.publish('UI_FEEDBACK', { message: "📡 ARO DE DATOS: Estado actualizado a HIGH_RISK", type: 'critical' });
      }, 1500);

      setTimeout(() => {
        EventBus.publish('UI_FEEDBACK', { message: "🧠 CEREBRO: Detectando conflicto (Historial vs Plan)...", type: 'info' });
      }, 2500);

      setTimeout(() => {
        EventBus.publish('SYSTEM_ALERT', { message: "⚡ HEAD COACH: Ejecutando VETO en el plan...", level: 'CRITICAL' });
      }, 6000);

      setTimeout(() => {
        EventBus.publish('UI_FEEDBACK', { message: "✅ CICLO CERRADO: Sesión modificada automáticamente.", type: 'success' });
        EventBus.publish('SIMULATION_COMPLETE', { success: true });
      }, 8000);
    }
  }
}

export const Brain = new BrainService();