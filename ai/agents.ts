import { GoogleGenerativeAI } from "@google/generative-ai";
import { AgentMessage, OmniContext, WeeklyPlan, TrainingSession } from '../types';
import { getSystemInstruction, MASTER_SYSTEM_INSTRUCTION } from './prompts';

console.log("[Brain] 🧠 AI Agents module loading...");

// Helper to get API Key across Vite/Node environments
const getApiKey = () => {
  // @ts-ignore
  const env = (import.meta as any).env;
  // @ts-ignore
  const processEnv = typeof globalThis !== 'undefined' ? (globalThis as any).process?.env : undefined;

  // Try all possible mappings
  const key = env?.VITE_GEMINI_API_KEY || processEnv?.API_KEY || processEnv?.GEMINI_API_KEY;

  if (!key || key.includes("PLACEHOLDER") || key.length < 10) {
    console.warn("⚠️ [Brain] CRITICAL: GEMINI_API_KEY is invalid or missing in .env.local");
    return undefined;
  }

  return key;
};

// Log initial key status (safely obfuscated)
const _initialKey = getApiKey();
if (_initialKey) {
  console.log(`[Brain] ✅ AI Module Initialized - API Key Ready (starts with: ${_initialKey.substring(0, 4)}...)`);
}

// Helper to remove heavy data (Base64 images) from the context window
const sanitizeContext = (context: OmniContext): any => {
  try {
    const clean = JSON.parse(JSON.stringify(context));
    // Remove Base64 strings from video history to save tokens and avoid JSON parse errors
    if (clean.athlete?.videoHistory) {
      clean.athlete.videoHistory = clean.athlete.videoHistory.map((v: any) => ({
        ...v,
        thumbnailUrl: '[IMAGE_DATA_REMOVED_FOR_AI_CONTEXT]'
      }));
    }
    return clean;
  } catch (e) {
    console.warn("Context sanitization failed", e);
    return context;
  }
};

// Helper to clean Markdown JSON
const cleanJsonOutput = (text: string): string => {
  let clean = text.trim();
  // Support potential markdown blocks
  if (clean.includes('```json')) {
    clean = clean.split('```json')[1].split('```')[0];
  } else if (clean.includes('```')) {
    clean = clean.split('```')[1].split('```')[0];
  }
  return clean.trim();
};

/**
 * Real AI Implementation: Uses Gemini 1.5 Flash for the Round Table debate.
 */
export const executeCriticLoop = async (context: OmniContext, topic?: string, scientificContext: string = ""): Promise<AgentMessage[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ [Brain] No API_KEY found. Falling back to simulation.");
    return simulateCriticLoop(context, topic);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use PLANNER mode for the critic loop
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: getSystemInstruction('PLANNER')
    });

    const objective = topic ? `OBJETIVO ESPECÍFICO DEL DEBATE: "${topic}"` : "OBJETIVO: Análisis general del estado del atleta y validación del plan actual.";
    const safeContext = sanitizeContext(context);

    const prompt = `
      CONTEXTO DEL ATLETA (JSON):
      ${JSON.stringify(safeContext, null, 2)}
      
      MACROCICLO ACTUAL (BIG PICTURE - META FINAL):
      ${safeContext.macrocycle ? JSON.stringify(safeContext.macrocycle, null, 2) : "Planificación General (Sin Macro definido)"}

      MEMORIA A LARGO PLAZO (HISTORIAL SEMANAL):
      ${safeContext.userMemory ? JSON.stringify(safeContext.userMemory, null, 2) : "No hay datos históricos disponibles."}

      LITERATURA CIENTÍFICA RECUPERADA (RAG CONTEXT - VERDAD ABSOLUTA):
      ${scientificContext}

      [ANÁLISIS DE PERFIL Y BRECHA - CROSS-REFERENCE]:
      - Nivel Calculado: ${context.athlete.level || 'NO_DEFINIDO'} (Basado en Edad + PBs vs Standards Mundiales)
      - Gap Analysis: ${context.profiling?.gapAnalysis || 'N/A'}
      
      [REPORTE MÉDICO NARRATIVO (ATENCIÓN CRÍTICA PARA TEXTO LIBRE)]:
      ${context.athlete.injuryHistory.filter(i => i.status === 'ACTIVE').map(i => `- ⚠️ LESIÓN ACTIVA: ${i.bodyPart} (Dolor ${i.vasPain}/10). NOTAS CLÍNICAS: "${i.notes}".`).join('\n') || 'Sin lesiones activas con notas.'}
      ${context.athlete.recentTherapies?.slice(0, 3).map(t => `- 💆 Terapia Reciente (${t.date}): ${t.type}. NOTAS: "${t.notes}".`).join('\n') || ''}

      [FEEDBACK DIARIO RECIENTE (BUCLE DE RETROALIMENTACIÓN)]:
      ${context.recentLogs?.map(l => `- ${l.date} (RPE ${l.rpe}): "${l.feedback}"`).join('\n') || "Sin feedback reciente."}
      
      [TENDENCIA TÉCNICA (ANÁLISIS DE PROGRESIÓN DE VIDEO)]:
      - Estado: ${context.technicalTrends?.trend || 'N/A'}
      - Resumen: ${context.technicalTrends?.summary || 'Insuficientes datos.'}

      INSTRUCCIÓN DE PROCESAMIENTO DE LENGUAJE NATURAL:
      - Si las notas mencionan "inflamación", "hinchazón" o "dolor agudo", aumenta la restricción de carga un 15% adicional.
      - Si el Feedback Diario muestra RPE > 8 repetidamente o quejas de fatiga, reduce intensidad.
      - Si la Tendencia Técnica es "REGRESSING", cambia el foco a TÉCNICA (intensidad baja) para recuperar el patrón motor.
      - Experiencia: ${context.athlete.experienceYears || '?'} años
      - Instrucción de Adaptación: Si el nivel es ROOKIE/INTERMEDIATE, simplifica la terminología y reduce el volumen un 20% respecto al plan Elite estándar. Si es WORLD_CLASS, busca ganancias marginales del 0.1%.
      
      INSTRUCCIÓN CRÍTICA: Debes basar tus decisiones y críticas ÚNICAMENTE en la literatura científica proporcionada arriba.

      ${objective}

      TAREA:
      Simula un debate de "Mesa Redonda" entre los agentes expertos.
      
      SECUENCIA:
      1. ESTRATEGA propone.
      2. FISIÓLOGO critica.
      3. AUDITOR valida fuente.
      4. HEAD COACH veredicto.

      OUTPUT: JSON ARRAY de 4 mensajes.
    `;

    console.log("[Brain] 📡 Connecting to Gemini (Round Table)...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text) {
      const cleanedText = cleanJsonOutput(text);
      const messages = JSON.parse(cleanedText) as AgentMessage[];
      return messages.map(m => ({ ...m, source: 'REAL_AI' }));
    }

    throw new Error("Empty response");

  } catch (error) {
    console.error("Critic Loop Error:", error);
    return simulateCriticLoop(context, topic);
  }
};

/**
 * Chat Feature
 */
export const chatWithBrain = async (message: string, context: OmniContext, scientificContext: string = ""): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Simulación: Falta API Key.";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: getSystemInstruction('CHAT_BOT')
    });

    const safeContext = sanitizeContext(context);
    const prompt = `
      CONTEXTO: ${JSON.stringify(safeContext)}
      KNOWLEDGE: ${scientificContext}
      USER: ${message}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Chat Error:", error);
    return "Error de conexión.";
  }
};

/**
 * Biomechanics Analysis
 */
export const analyzeTechnique = async (images: string | string[], contextData: string = ""): Promise<any> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No API Key");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp", // Optimized for v2.0
      systemInstruction: getSystemInstruction('BIO_ANALYST')
    });

    const isMultiImage = Array.isArray(images);
    const imageList = isMultiImage ? images : [images];

    const prompt = `
      Actúa como un Biomecánico Deportivo Nivel 5 y Coach Olímpico. 
      Analiza esta secuencia de imágenes/video considerando los siguientes datos biomecánicos y el contexto del atleta.
      
      [DATOS BIOMECÁNICOS Y CONTEXTO]:
      ${contextData}
      
      INSTRUCCIONES DE ANÁLISIS EXPERTO:
      1. EVALUAR ENERGÍA: Analiza "H-CoM" y "Soporte Foot-Z" para detectar fugas de energía (como el colapso de la cadera en el contacto).
      2. ESTIMAR GCT: Usa la "Oscilación Vertical" y la secuencia de imágenes para determinar si el atleta tiene un contacto "Stiff" (Elite) o "Soft" (Amateur).
      3. COMPARACIÓN TEMPORAL (CRÍTICO): Si hay un "ANÁLISIS PREVIO", sé implacable. ¿Corrigió lo que se le pidió? ¿Hay estancamiento?
      4. CONTEXTO MÉDICO: Si hay lesiones activas, el "Veredicto de Rendimiento" debe ser conservador.
      
      OUTPUT JSON ÚNICAMENTE CON ESTA ESTRUCTURA:
      {
        "exerciseName": "string",
        "score": number,
        "biomechanics": [{ 
          "joint": "string", 
          "angle": "string", 
          "ideal": "string", 
          "recommendation": "string",
          "status": "optimal|warning|critical",
          "expertNote": "Explicación breve de por qué este ángulo es vital para la técnica élite"
        }],
        "expertMetrics": {
          "gctEstimate": "string (ej: 0.09s - Reactivo)",
          "comOscillation": "string (ej: Estable)",
          "asymmetryRisk": "LOW|MODERATE|HIGH",
          "energyLeaks": ["vínculos de debilidad detectados"],
          "performanceVerdict": "Resumen ejecutivo para el Coach (máx 30 palabras)"
        },
        "analysis": { 
          "successes": ["string"], 
          "weaknesses": ["string"] 
        },
        "correctionPlan": [{ 
          "drillName": "string", 
          "prescription": "string", 
          "focus": "string",
          "videoRef": "string (YouTube URL)"
        }]
      }
    `;

    console.log(`[Brain] 👁️ Analyzing Vision (${isMultiImage ? imageList.length : 1} frames)...`);

    const imageParts = imageList.map(img => {
      let mimeType = 'image/jpeg';
      let cleanBase64 = img;
      if (img.startsWith('data:')) {
        const matches = img.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        }
      }
      return { inlineData: { mimeType, data: cleanBase64 } };
    });

    const result = await model.generateContent([
      prompt,
      ...imageParts
    ]);
    const response = await result.response;
    const text = response.text();

    if (text) {
      const cleanedText = cleanJsonOutput(text);
      return JSON.parse(cleanedText);
    }
    throw new Error("No data");

  } catch (error) {
    console.error("Vision Error:", error);
    throw error;
  }
};

/**
 * Generate Elite Training Plan
 */
export const generateEliteTrainingPlan = async (context: OmniContext): Promise<WeeklyPlan | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ [Brain] No API_KEY. Falling back to Elite Simulation.");
    return simulateElitePlan(context);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro", // UPGRADED for v2.0: Deep periodization logic requires 1.5 Pro reasoning depth
      systemInstruction: getSystemInstruction('TRAINING_DESIGNER')
    });

    const safeContext = sanitizeContext(context);
    const prompt = `
      CONTEXTO DEL ATLETA (OMNI-CONTEXT):
      ${JSON.stringify(safeContext, null, 2)}

      [REPORTE MÉDICO NARRATIVO - ÚLTIMA HORA]:
      ${context.athlete.injuryHistory.filter(i => i.status === 'ACTIVE').map(i => `- ⚠️ LESIÓN ACTIVA: ${i.bodyPart} (Dolor ${i.vasPain}/10). NOTAS CLÍNICAS: "${i.notes}".`).join('\n') || 'Sin notas críticas.'}

      SOLICITUD: Genera la planificación del microciclo para la Fase: ${safeContext.currentPlan.trainingPhase}
    `;

    console.log("[Brain] 🧠 Generating Elite Training Plan...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (text) {
      const cleanedText = cleanJsonOutput(text);
      const sessions = JSON.parse(cleanedText) as TrainingSession[];

      // Ensure IDs and dates are correct (AI might not generate UUIDs)
      const enrichedSessions = sessions.map((s, i) => ({
        ...s,
        id: crypto.randomUUID(), // New unique ID
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0], // Next 7 days
        status: 'PLANNED',
        isAiAdjusted: true,
        aiReason: "Generado por Gemini 2.0 Flash (Training Designer) basado en contexto."
      })) as TrainingSession[];

      return {
        athleteId: context.athlete.id,
        trainingPhase: context.currentPlan.trainingPhase,
        sessions: enrichedSessions
      };
    }
    throw new Error("Empty AI Response");

  } catch (error) {
    console.warn("⚠️ [Brain] Plan Generation Failed. Using Simulation Fallback.", error);
    return simulateElitePlan(context);
  }
};

/**
 * Deterministic Simulation of an Elite Microcycle (High/Low)
 */
const simulateElitePlan = (context: OmniContext): WeeklyPlan => {
  const isHighRisk = context.athlete.acwr > 1.3 || context.athlete.status === 'HIGH_RISK';
  const phase = context.currentPlan.trainingPhase;

  const sessions: Omit<TrainingSession, 'id' | 'date' | 'status' | 'isAiAdjusted'>[] = [
    { day: 'LUN', type: 'SPEED', intensityZone: 5, title: 'Acceleration + Power', context: 'Neural Priming Day (High CNS)', psychology: 'Push the ground away.', gymWork: 'Clean Pulls 3x3 @ 85%\nBack Squat 3x4 @ 80%\nBox Jumps 4x5', durationMin: 90 },
    { day: 'MAR', type: 'RECOVERY', intensityZone: 2, title: 'Tempo Run & Mobility', context: 'Flush out metabolites (Low CNS)', psychology: 'Relaxed rhythm.', gymWork: 'Extensive Tempo 10x100m @ 65%\nHurdle Mobility', durationMin: 45 },
    { day: 'MIE', type: 'SPEED', intensityZone: 5, title: 'Max Velocity (Fly 30m)', context: 'Top Speed Development (High CNS)', psychology: 'Float phase mechanics.', gymWork: 'Nordic Hamstring 3x5\nSplit Squat 3x6', durationMin: 90 },
    { day: 'JUE', type: 'RECOVERY', intensityZone: 1, title: 'Pool Recovery / Massage', context: 'Passive Recovery', psychology: 'Mental reset.', gymWork: 'Pool running 20min\nContrast Bath', durationMin: 45 },
    { day: 'VIE', type: 'TECHNIQUE', intensityZone: 4, title: 'Speed Endurance I', context: 'Lactic Capacity (High CNS)', psychology: 'Hold form under fatigue.', gymWork: 'Trap Bar DL 3x5 @ 75% (Velocity focus)\nUpper Body Pump', durationMin: 75 },
    { day: 'SAB', type: 'RECOVERY', intensityZone: 2, title: 'Shakeout Run', context: 'Active Recovery', psychology: 'Prepare for rest.', gymWork: 'Dynamic Warmup\nFoam Rolling', durationMin: 30 },
    { day: 'DOM', type: 'RECOVERY', intensityZone: 1, title: 'REST DAY', context: 'Supercompensation', psychology: 'Do nothing.', gymWork: 'OFF', durationMin: 0 },
  ];

  // Adjust for Risk
  if (isHighRisk) {
    sessions.forEach(s => {
      if (s.intensityZone > 3) {
        s.title += " (Modified)";
        s.gymWork = "REDUCED LOAD due to ACWR Check.\n" + s.gymWork;
        s.intensityZone = 3;
        s.aiReason = "Simulated Safety Protocol Triggered";
      }
    });
  }

  return {
    athleteId: context.athlete.id,
    trainingPhase: phase,
    sessions: sessions.map((s, i) => ({
      ...s,
      id: crypto.randomUUID(),
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      status: 'PLANNED',
      isAiAdjusted: true
    })) as TrainingSession[]
  };
};


/**
 * Fallback Simulation
 */
export const simulateCriticLoop = (context: OmniContext, topic?: string): AgentMessage[] => {
  const messages: AgentMessage[] = [];
  const now = new Date();
  const { athlete } = context;

  const isHighRisk = athlete.status === 'HIGH_RISK' || athlete.acwr > 1.5;
  const hasPain = athlete.injuryHistory.some(i => i.status === 'ACTIVE' && i.vasPain > 3);

  messages.push({
    id: 'msg-1',
    agent: 'STRATEGIST',
    type: 'PROPOSAL',
    timestamp: now.toISOString(),
    content: `Mantenimiento de carga sugerido para ${topic || 'Estado General'}.`,
    metrics: [{ label: 'Estado', value: athlete.status, status: 'ok' }],
    source: 'SIMULATION'
  });

  if (isHighRisk || hasPain) {
    messages.push({
      id: 'msg-2',
      agent: 'PHYSIOLOGIST',
      type: 'CRITIQUE',
      timestamp: now.toISOString(),
      content: `Riesgo detectado (ACWR: ${athlete.acwr}). Sugiero descarga inmediata.`,
      metrics: [{ label: 'ACWR', value: athlete.acwr.toString(), status: 'danger' }],
      source: 'SIMULATION'
    });
  }

  return messages;
};