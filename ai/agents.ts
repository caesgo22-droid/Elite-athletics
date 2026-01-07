import { GoogleGenerativeAI } from '@google/generative-ai';
import { OmniContext, AgentMessage, WeeklyPlan, TrainingSession } from '../types';
import { getSystemInstruction } from './prompts';
import { logger } from '../services/Logger';

logger.log("[Brain] 🧠 AI Agents module loading...");

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
  logger.log(`[Brain] ✅ AI Module Initialized - API Key Ready (starts with: ${_initialKey.substring(0, 4)}...)`);
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

// Helper to clean Markdown JSON and remove any non-JSON text
const cleanJsonOutput = (text: string): string => {
  let clean = text.trim();

  // Remove markdown code blocks
  if (clean.includes('```json')) {
    clean = clean.split('```json')[1].split('```')[0];
  } else if (clean.includes('```')) {
    clean = clean.split('```')[1].split('```')[0];
  }

  // Find the first { and last } to extract only the JSON object
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
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

    logger.log("[Brain] 📡 Connecting to Gemini (Round Table)...");
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
 * Chat Feature with Retry Logic
 */
export const chatWithBrain = async (message: string, context: OmniContext, scientificContext: string = ""): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "⚠️ Error: API Key no configurada. Contacta al administrador del sistema.";

  const MAX_RETRIES = 2;
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
        
        IMPORTANTE: Responde SIEMPRE en español (Español).
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();

    } catch (error: any) {
      lastError = error;
      logger.log(`[Brain Chat] Attempt ${attempt + 1} failed:`, error.message);

      if (attempt < MAX_RETRIES) {
        // Exponential backoff: wait 1s, then 2s
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  // Better error messages in Spanish
  const errorMsg = lastError?.message || '';
  if (errorMsg.includes('429') || errorMsg.includes('quota')) {
    return "⚠️ Límite de solicitudes alcanzado. Por favor, intenta de nuevo en 1 minuto.";
  }
  if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
    return "⚠️ Tiempo de espera agotado. Verifica tu conexión a internet e intenta nuevamente.";
  }
  if (errorMsg.includes('API key')) {
    return "⚠️ Error de autenticación. Contacta al administrador del sistema.";
  }
  return `⚠️ Error de conexión: ${errorMsg.substring(0, 100)}. Intenta nuevamente en unos momentos.`;
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
      5. PROFUNDIDAD CIENTÍFICA: Para cada error biomecánico, explica:
         - POR QUÉ es problemático (fugas de energía, riesgo de lesión, impacto en rendimiento)
         - CUÁL es el patrón ideal (con medidas específicas en grados o cm)
         - CÓMO corregirlo (cues específicos + drills)
      6. REFERENCIAS DE VIDEO (OBLIGATORIO): Para CADA ejercicio de corrección, incluye un enlace de YouTube de canales verificados:
         - SpeedEndurance.com, Altis, Tony Holler, Dan Pfaff, Complete Track and Field
         - Formato: "https://youtube.com/watch?v=..."
      
      OUTPUT JSON ÚNICAMENTE CON ESTA ESTRUCTURA (SIN TEXTO EXTRA):
      {
        "exerciseName": "string",
        "score": number,
        "biomechanics": [{ 
          "joint": "string", 
          "angle": "string", 
          "ideal": "string", 
          "recommendation": "string",
          "status": "optimal|warning|critical",
          "expertNote": "Explicación científica detallada (mínimo 20 palabras) de por qué este ángulo es vital para la técnica élite, incluyendo principios biomecánicos"
        }],
        "expertMetrics": {
          "gctEstimate": "string (ej: 0.09s - Reactivo)",
          "comOscillation": "string (ej: Estable)",
          "asymmetryRisk": "LOW|MODERATE|HIGH",
          "energyLeaks": ["vínculos de debilidad detectados con explicación científica"],
          "performanceVerdict": "Resumen ejecutivo para el Coach con justificación científica (máx 40 palabras)"
        },
        "analysis": { 
          "successes": ["string con explicación de por qué es correcto"], 
          "weaknesses": ["string con explicación científica del problema"] 
        },
        "correctionPlan": [{ 
          "drillName": "string", 
          "prescription": "string (sets x reps, intensidad, descanso)", 
          "focus": "string (cue técnico específico)",
          "videoRef": "string (OBLIGATORIO: URL de YouTube de canal verificado - SpeedEndurance, Altis, Tony Holler, Dan Pfaff, Complete Track and Field)"
        }]
      }
    `;

    logger.log(`[Brain] 👁️ Analyzing Vision (${isMultiImage ? imageList.length : 1} frames)...`);

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
      
      ⚠️ REQUISITOS CRÍTICOS DE FORMATO - NO NEGOCIABLES:
      
      1. **FASE A (RAMP)** - DEBE incluir los 4 componentes COMPLETOS:
         - RAISE: Especificar ejercicios exactos (ej: "5min Trote Suave Forward/Backward, 2x20m Desplazamientos Laterales")
         - MOBILIZE: Listar ejercicios específicos con repeticiones (ej: "10 Balanceos de pierna frontal/lateral, 10 Escorpiones")
         - ACTIVATE: Detallar drills técnicos (ej: "2x15m A-Skip, 2x15m B-Skip, 2x10 Puentes de Glúteo")
         - POTENTIATE: Especificar aceleraciones (ej: "2x10m Aceleraciones @ 95%, 2x Salto Vertical Máximo")
      
      2. **FASE B (TRABAJO ESPECÍFICO)** - DEBE incluir:
         - Volumen TOTAL en metros (ej: "Volumen Total: 240m")
         - Estructura de series (ej: "3 series de 4x30m")
         - Intensidad específica (ej: "@ 95% velocidad máxima")
         - Descanso EXACTO (ej: "Descanso: 3min entre reps, 8min entre series")
         - Ejemplo COMPLETO: "3 series de 4x30m Flys @ 95% | Descanso: 3min entre reps, 8min entre series | Volumen Total: 360m"
      
      3. **FASE C (TRANSFERENCIA)** - SI APLICA, debe incluir:
         - Ejercicios específicos (ej: "Box Jumps, Broad Jumps")
         - Series y repeticiones (ej: "3 series x 5 reps")
         - Enfoque técnico (ej: "Contacto mínimo con el suelo, énfasis en stiffness")
      
      4. **FASE D (GIMNASIO)** - DEBE incluir:
         - Nombre COMPLETO del ejercicio
         - Tempo (ej: "3-0-1" para strength, "X-X-X" para power)
         - Series x Repeticiones (ej: "4x5")
         - Carga (ej: "@ 80% 1RM")
         - Descanso (ej: "Rest: 3-4min")
         - Ejemplo COMPLETO: "Back Squat (Tempo 3-0-1) | 4 sets x 5 reps @ 80% 1RM | Rest: 3min\nClean Pull (Explosivo) | 3 sets x 3 reps @ 85% 1RM | Rest: 4min"
      
      ❌ PROHIBIDO:
      - Texto genérico como "Intervalos Lactato 400m" SIN detalles
      - "Calentamiento General" SIN especificar ejercicios
      - "Descanso / Sin Gym" SIN alternativas
      - Frases vagas como "Trabajo de velocidad" sin cuantificar
      
      ✅ OBLIGATORIO:
      - CADA ejercicio debe tener: nombre + series + reps/distancia + intensidad + descanso
      - CADA fase debe estar COMPLETA con todos sus componentes
      - Usar el formato de "structure" con ramp, track, transfer, gym DETALLADOS
    `;

    logger.log("[Brain] 🧠 Generating Elite Training Plan...");
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
    {
      day: 'LUN',
      type: 'SPEED',
      intensityZone: 5,
      title: 'Aceleración + Potencia',
      context: 'Día de activación neural (Alto CNS)',
      psychology: 'Empuja el suelo lejos de ti.',
      durationMin: 90,
      structure: {
        ramp: "RAISE: 5min Trote Suave (Forward/Backward), 2x20m Desplazamientos Laterales\nMOBILIZE: 10 Balanceos de pierna frontal/lateral, 10 Escorpiones, 10 Gusanos a Cobra\nACTIVATE: 2x15m A-Skip, 2x15m B-Skip, 2x10 Puentes de Glúteo\nPOTENTIATE: 2x10m Aceleraciones @ 95%, 2x Salto Vertical Máximo",
        track: "3 series de 3x30m Aceleraciones @ 95%\nDescanso: 3min entre reps, 8min entre series\nVolumen Total: 270m\nEnfoque: Máxima potencia en cada repetición",
        transfer: "Box Jumps: 4 series x 5 reps\nBroad Jumps: 3 series x 4 reps\nEnfoque: Contacto mínimo, explosividad máxima",
        gym: "Clean Pull (Tempo X-X-X Explosivo) | 3 sets x 3 reps @ 85% 1RM | Rest: 4min\nBack Squat (Tempo 3-0-1) | 3 sets x 4 reps @ 80% 1RM | Rest: 3min\nNordic Hamstring | 3 sets x 5 reps | Rest: 2min"
      }
    },
    {
      day: 'MAR',
      type: 'RECOVERY',
      intensityZone: 2,
      title: 'Tempo Run & Movilidad',
      context: 'Eliminación de metabolitos (Bajo CNS)',
      psychology: 'Ritmo relajado y controlado.',
      durationMin: 45,
      structure: {
        ramp: "RAISE: 5min Trote Suave\nMOBILIZE: 10 Balanceos de pierna, 10 Rotaciones de cadera\nACTIVATE: 2x10 Puentes de Glúteo\nPOTENTIATE: 2x20m Aceleraciones progresivas @ 70%",
        track: "Tempo Extensivo: 10x100m @ 65% velocidad máxima\nDescanso: 1min entre reps\nVolumen Total: 1000m\nEnfoque: Técnica relajada, respiración controlada",
        transfer: "N/A - Día de recuperación activa",
        gym: "Hurdle Mobility Circuit: 3 series\nFoam Rolling: 15min\nEstiramientos estáticos: 10min"
      }
    },
    {
      day: 'MIE',
      type: 'SPEED',
      intensityZone: 5,
      title: 'Velocidad Máxima (Fly 30m)',
      context: 'Desarrollo de velocidad máxima (Alto CNS)',
      psychology: 'Mecánica de fase flotante.',
      durationMin: 90,
      structure: {
        ramp: "RAISE: 5min Trote Suave variado\nMOBILIZE: 10 Balanceos, 10 Escorpiones, 10 World's Greatest Stretch\nACTIVATE: 2x15m A-Skip rápido, 2x15m B-Skip, 2x15m Talones al glúteo\nPOTENTIATE: 3x10m Aceleraciones @ 98%, 3x Salto Vertical",
        track: "4 series de 2x30m Flys (20m build-up + 30m fly)\nDescanso: 4min entre reps, 10min entre series\nVolumen Total: 240m\nEnfoque: Velocidad máxima, relajación en fase aérea",
        transfer: "Boundings: 3 series x 30m\nEnfoque: Stiffness reactivo, contacto mínimo",
        gym: "Split Squat (Tempo 3-0-1) | 3 sets x 6 reps cada pierna @ 75% 1RM | Rest: 2min\nRDL (Tempo 3-1-1) | 3 sets x 5 reps @ 70% 1RM | Rest: 2min\nPallof Press | 3 sets x 10 reps | Rest: 90s"
      }
    },
    {
      day: 'JUE',
      type: 'RECOVERY',
      intensityZone: 1,
      title: 'Recuperación en Piscina / Masaje',
      context: 'Recuperación pasiva',
      psychology: 'Reset mental completo.',
      durationMin: 45,
      structure: {
        ramp: "Movilidad suave: 10min\nEstiramientos dinámicos ligeros",
        track: "Pool Running: 20min @ intensidad muy baja\nEnfoque: Descarga articular, movimiento sin impacto",
        transfer: "N/A",
        gym: "Contrast Bath: 3 ciclos (3min caliente, 1min frío)\nFoam Rolling: 15min\nMasaje deportivo (si disponible)"
      }
    },
    {
      day: 'VIE',
      type: 'TECHNIQUE',
      intensityZone: 4,
      title: 'Resistencia de Velocidad I',
      context: 'Capacidad láctica (Alto CNS)',
      psychology: 'Mantener forma bajo fatiga.',
      durationMin: 75,
      structure: {
        ramp: "RAISE: 5min Trote Suave\nMOBILIZE: 10 Balanceos, 10 Rotaciones\nACTIVATE: 2x15m A-Skip, 2x15m B-Skip\nPOTENTIATE: 2x20m Aceleraciones @ 90%",
        track: "3 series de 2x150m @ 90% velocidad máxima\nDescanso: 5min entre reps, 12min entre series\nVolumen Total: 900m\nEnfoque: Mantener técnica cuando aparece lactato",
        transfer: "Saltos de cajón bajos: 3 series x 6 reps\nEnfoque: Velocidad de despegue",
        gym: "Trap Bar Deadlift (Tempo X-X-X Velocidad) | 3 sets x 5 reps @ 75% 1RM | Rest: 3min\nBench Press | 3 sets x 8 reps @ 70% 1RM | Rest: 2min\nPull-ups | 3 sets x max reps | Rest: 2min"
      }
    },
    {
      day: 'SAB',
      type: 'RECOVERY',
      intensityZone: 2,
      title: 'Activación Pre-Comp',
      context: 'Desarrollo de capacidades específicas',
      psychology: 'Preparación para descanso.',
      durationMin: 45,
      structure: {
        ramp: "RAISE: 5min Trote muy suave\nMOBILIZE: 10 Balanceos suaves\nACTIVATE: 2x10m A-Skip ligero\nPOTENTIATE: 2x20m Aceleraciones @ 80%",
        track: "4x60m @ 85% velocidad máxima\nDescanso: 4min entre reps\nVolumen Total: 240m\nEnfoque: Activación neuromuscular sin fatiga",
        transfer: "N/A - Mantener frescura",
        gym: "Dynamic Warmup completo: 15min\nFoam Rolling: 10min\nEstiramientos dinámicos: 10min"
      }
    },
    {
      day: 'DOM',
      type: 'RECOVERY',
      intensityZone: 1,
      title: 'DÍA DE DESCANSO',
      context: 'Supercompensación',
      psychology: 'No hacer nada.',
      durationMin: 0,
      structure: {
        ramp: "OFF",
        track: "OFF",
        transfer: "OFF",
        gym: "OFF - Descanso completo\nOpcional: Caminata ligera 20min, estiramientos suaves"
      }
    },
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