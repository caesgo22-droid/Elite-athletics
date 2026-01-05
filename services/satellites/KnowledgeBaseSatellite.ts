
/**
 * KNOWLEDGE BASE SATELLITE (RAG LAYER)
 * 
 * Responsabilidad: Actuar como la "Biblioteca de Alejandría" de la app.
 * Contiene la "Verdad Absoluta" extraída de papers científicos y manuales oficiales.
 * 
 * En producción, esto se conectaría a una Vector Database (Pinecone/Weaviate)
 * con miles de PDFs indexados. Aquí simulamos los fragmentos más críticos.
 */

import { ISatellite } from './ISatellite';
import { logger } from '../Logger';

export interface KnowledgeChunk {
    id: string;
    source: string; // Ej: "World Athletics Coaching Manual 2024"
    category: 'PHYSIOLOGY' | 'BIOMECHANICS' | 'STRATEGY' | 'MEDICAL' | 'PSYCHOLOGY' | 'NUTRITION';
    content: string;
    tags: string[];
    dateIndexed: string;
}

class KnowledgeBaseService implements ISatellite {
    readonly name = "Knowledge Base Satellite";
    // Esta es la "Memoria Cristalizada" de la app. Los expertos humanos validan ESTA lista.
    private library: KnowledgeChunk[] = [
        // --- PHYSIOLOGY (Fisiología & Carga) ---
        {
            id: 'PHY_01',
            source: 'Gabbett, T. (2016) - The Training-Injury Prevention Paradox',
            category: 'PHYSIOLOGY',
            content: "El 'Sweet Spot' del Ratio de Carga Aguda:Crónica (ACWR) se encuentra entre 0.8 y 1.3. Valores superiores a 1.5 representan la 'Zona de Peligro', aumentando el riesgo de lesión de tejido blando en un 40-50% en los 7 días subsiguientes. Si ACWR > 1.5, la carga debe reducirse, no aumentarse.",
            tags: ['acwr', 'carga', 'lesion', 'volumen'],
            dateIndexed: '2024-01-15'
        },
        {
            id: 'PHY_02',
            source: 'Charlie Francis - The Charlie Francis Training System',
            category: 'PHYSIOLOGY',
            content: "El Sistema Nervioso Central (SNC) requiere 48 a 72 horas para regenerarse completamente tras un estímulo de Alta Intensidad (>95%). Entrenar velocidad máxima con fatiga neural residual 'reprograma' el patrón motor hacia la lentitud.",
            tags: ['snc', 'recuperacion', 'velocidad', 'charlie francis'],
            dateIndexed: '2024-04-01'
        },
        {
            id: 'PHY_03',
            source: 'Frans Bosch - Strength Training and Coordination',
            category: 'PHYSIOLOGY',
            content: "La transferencia de fuerza al sprint no depende de la fuerza máxima absoluta, sino de la Coordinación Intramuscular y la capacidad de aplicar fuerza en tiempos de contacto < 0.10s (Rate of Force Development).",
            tags: ['fuerza', 'transferencia', 'rfd', 'bosch'],
            dateIndexed: '2024-04-01'
        },

        // --- MEDICAL & REHAB (Médico & Rehabilitación) ---
        {
            id: 'MED_01',
            source: 'Consenso de Estocolmo sobre Conmociones y Fatiga SNC',
            category: 'MEDICAL',
            content: "La fatiga del Sistema Nervioso Central (SNC) se manifiesta primero en la reducción de la Variabilidad de la Frecuencia Cardíaca (HRV). Una caída >10% en el rMSSD respecto a la media móvil de 7 días contraindica sesiones de velocidad máxima (>95%) o pliometría de alto impacto.",
            tags: ['hrv', 'snc', 'fatiga', 'neuromuscular'],
            dateIndexed: '2024-02-10'
        },
        {
            id: 'MED_02',
            source: 'Askling, C. et al. - Hamstring Injury Rehab Protocols',
            category: 'MEDICAL',
            content: "Para lesiones de isquiotibiales (L-Protocol), los ejercicios de alargamiento excéntrico ('Extender', 'Diver', 'Glider') muestran tasas de reinjuría significativamente menores que los protocolos concéntricos tradicionales. El dolor permitido durante rehab no debe exceder 3/10.",
            tags: ['isquios', 'rehab', 'excentrico', 'protocolo l'],
            dateIndexed: '2024-04-02'
        },
        {
            id: 'MED_03',
            source: 'Sleep Foundation - Athletic Performance',
            category: 'MEDICAL',
            content: "Dormir menos de 7 horas aumenta el riesgo de lesiones musculoesqueléticas en un 1.7x. La privación de sueño reduce los niveles de glucógeno y aumenta el cortisol, impidiendo la supercompensación.",
            tags: ['sueño', 'recuperacion', 'cortisol'],
            dateIndexed: '2024-04-02'
        },

        // --- BIOMECHANICS (Biomecánica) ---
        {
            id: 'BIO_01',
            source: 'Ralph Mann - The Mechanics of Sprinting',
            category: 'BIOMECHANICS',
            content: "En la fase de máxima velocidad, el tiempo de contacto (GCT) ideal para atletas de élite es < 0.090s. Un 'heel strike' (contacto de talón) o contacto excesivamente adelantado al centro de masa (overstriding) actúa como fuerza de frenado. El ángulo de la tibia al aterrizaje debe ser perpendicular al suelo.",
            tags: ['sprint', 'tecnica', 'video', 'gct'],
            dateIndexed: '2024-03-05'
        },
        {
            id: 'BIO_02',
            source: 'Altis Kinograms - Acceleration Mechanics',
            category: 'BIOMECHANICS',
            content: "La 'Triple Extensión' completa en los primeros pasos es un mito. Los velocistas de élite muestran una extensión incompleta de la rodilla y cadera para reducir el tiempo en el aire ('Low Heel Recovery') y aumentar la frecuencia de pasos durante la aceleración inicial.",
            tags: ['aceleracion', 'triple extension', 'altis', 'tecnica'],
            dateIndexed: '2024-04-03'
        },
        {
            id: 'BIO_03',
            source: 'Dr. Ken Clark - The Science of Speed',
            category: 'BIOMECHANICS',
            content: "La magnitud de la fuerza vertical contra el suelo en los primeros 2/3 del tiempo de contacto es el determinante #1 de la velocidad máxima ('Punch the ground').",
            tags: ['fuerza vertical', 'vmax', 'ken clark'],
            dateIndexed: '2024-04-03'
        },

        // --- STRATEGY & PERIODIZATION (Estrategia) ---
        {
            id: 'STR_01',
            source: 'Bompa & Haff - Periodization: Theory and Methodology',
            category: 'STRATEGY',
            content: "Durante la fase de Tapering (Puesta a Punto), el volumen de entrenamiento debe reducirse exponencialmente (40-60%) mientras que la INTENSIDAD debe mantenerse alta para conservar las adaptaciones neuromusculares. Reducir la intensidad durante el tapering provoca desentrenamiento.",
            tags: ['tapering', 'planificacion', 'competencia'],
            dateIndexed: '2024-03-20'
        },
        {
            id: 'STR_02',
            source: 'Dan Pfaff - Scheme Design',
            category: 'STRATEGY',
            content: "Regla de las 36 horas: Sesiones complementarias (Pesas, Pliometría) deben agruparse con el entrenamiento de pista en el mismo día (High/High) para permitir días completos de descarga (Low/Low) y regeneración del SNC.",
            tags: ['microciclo', 'pfaff', 'high low', 'organizacion'],
            dateIndexed: '2024-04-04'
        },
        {
            id: 'STR_03',
            source: 'Bondarchuk - Transfer of Training',
            category: 'STRATEGY',
            content: "La clasificación de ejercicios (General, Especial Preparatorio, Especial de Desarrollo, Competitivo) es vital. A medida que se acerca la competencia, el volumen de ejercicios Generales debe tender a cero, mientras los Competitivos alcanzan su pico.",
            tags: ['bondarchuk', 'seleccion ejercicios', 'fases'],
            dateIndexed: '2024-04-04'
        },

        // --- PSYCHOLOGY & MINDSET (Psicología) ---
        {
            id: 'PSY_01',
            source: 'Dr. Michael Gervais - Finding Mastery',
            category: 'PSYCHOLOGY',
            content: "El rendimiento bajo presión depende de la capacidad de redirigir el foco de 'resultado' (futuro, ansiedad) a 'tarea' (presente, ejecución). El diálogo interno debe ser instructivo ('rodillas arriba') en lugar de evaluativo ('voy lento').",
            tags: ['psicologia', 'presion', 'foco', 'mindset'],
            dateIndexed: '2024-04-05'
        },
        {
            id: 'PSY_02',
            source: 'Carol Dweck - Growth Mindset in Sports',
            category: 'PSYCHOLOGY',
            content: "El feedback debe premiar el esfuerzo y la estrategia, no el talento innato. Un atleta con 'Fixed Mindset' evitará desafíos para no exponerse al fracaso, limitando su desarrollo a largo plazo.",
            tags: ['mindset', 'feedback', 'desarrollo'],
            dateIndexed: '2024-04-05'
        },

        // --- NUTRITION (Nutrición) ---
        {
            id: 'NUT_01',
            source: 'ISSN Position Stand - Caffeine and Performance',
            category: 'NUTRITION',
            content: "La cafeína (3-6 mg/kg) consumida 60 min antes del evento mejora el rendimiento en sprint y potencia en un 3-5% al reducir la percepción de esfuerzo y aumentar el reclutamiento de unidades motoras.",
            tags: ['nutricion', 'cafeina', 'suplementos', 'rendimiento'],
            dateIndexed: '2024-04-06'
        },
        {
            id: 'NUT_02',
            source: 'Louise Burke - Nutrition for Sprinters',
            category: 'NUTRITION',
            content: "La disponibilidad de Creatina Fosfato es el limitante en esfuerzos repetidos de <10s. La suplementación con Creatina Monohidrato (5g/día) es crítica para mantener la calidad del entrenamiento en bloques de potencia.",
            tags: ['nutricion', 'creatina', 'energia', 'atp'],
            dateIndexed: '2024-04-06'
        }
    ];

    async initialize() {
        logger.log(`[${this.name}] 🟢 Indexed ${this.library.length} documents.`);
    }

    async healthCheck(): Promise<boolean> {
        return this.library.length > 0;
    }

    /**
     * Búsqueda Semántica Simulada.
     * Encuentra los fragmentos que mejor coinciden con el contexto actual.
     */
    public async retrieveRelevantKnowledge(queryContext: string): Promise<string> {
        // En un sistema real, esto usaría embeddings y distancia coseno.
        // Aquí hacemos un keyword matching inteligente.

        const contextLower = queryContext.toLowerCase();

        const hits = this.library.filter(chunk => {
            return chunk.tags.some(tag => contextLower.includes(tag));
        });

        if (hits.length === 0) {
            // Fallback: Devolver principios generales si no hay match específico
            return "PRINCIPIO GENERAL: Ante la duda, priorizar la salud del atleta sobre el rendimiento inmediato (Principio de 'Do No Harm').";
        }

        // Formatear para que el LLM lo entienda como citas
        return hits.map(chunk => `[FUENTE: ${chunk.source}]\n"${chunk.content}"`).join('\n\n');
    }

    /**
     * Devuelve todas las fuentes únicas indexadas.
     * Útil para mostrar en el Dashboard de Sistema.
     */
    public getAllSources(): string[] {
        return Array.from(new Set(this.library.map(chunk => chunk.source)));
    }

    /**
     * Simula la ingestión de un nuevo documento PDF/Paper.
     * En producción, esto parsearía el PDF y generaría vectores.
     */
    public ingestNewDocument(title: string, contentSnippet: string, category: 'PHYSIOLOGY' | 'BIOMECHANICS' | 'STRATEGY' | 'MEDICAL' | 'PSYCHOLOGY' | 'NUTRITION') {
        this.library.unshift({
            id: `DOC_${Date.now()}`,
            source: title,
            category: category,
            content: contentSnippet,
            tags: ['new', 'update', category.toLowerCase()],
            dateIndexed: new Date().toISOString().split('T')[0]
        });
        console.log(`[RAG] 📚 Nuevo conocimiento ingerido: ${title}`);
    }
}

export const KnowledgeBaseSatellite = new KnowledgeBaseService();
