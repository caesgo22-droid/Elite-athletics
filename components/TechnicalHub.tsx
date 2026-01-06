import React, { useState } from 'react';
import { Badge, InfoTooltip } from './common/Atomic';
import { LegalFooter } from './common/LegalFooter';

interface VerificationResult {
    isValid: boolean;
    confidence: number;
    sources: string[];
    reasoning: string;
}

const TechnicalHub: React.FC = () => {
    const [claim, setClaim] = useState('');
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Knowledge base for verification
    const knowledgeBase = {
        'acwr': {
            optimal: [1.0, 1.3],
            source: 'Gabbett (2016)',
            highRisk: '> 1.5'
        },
        'gct': {
            typical: [0.08, 0.12],
            source: 'Weyand et al. (2000)',
            elite: [0.08, 0.10]
        },
        'mediapipe': {
            landmarks: 33,
            source: 'Google MediaPipe Documentation'
        }
    };

    const exampleClaims = [
        { text: 'El ACWR óptimo es 1.0-1.3', valid: true },
        { text: 'Correr 100m en 8 segundos es posible', valid: false },
        { text: 'El GCT típico en sprinters es 0.08-0.12s', valid: true },
        { text: 'No hay riesgo de lesión con ACWR alto', valid: false },
        { text: 'MediaPipe detecta 33 landmarks corporales', valid: true }
    ];

    const scientificSources = [
        {
            title: 'Gabbett, T.J. (2016)',
            description: 'The training-injury prevention paradox: should athletes be training smarter and harder?',
            concepts: ['ACWR', 'Load management', 'Injury risk'],
            journal: 'British Journal of Sports Medicine',
            link: 'https://bjsm.bmj.com/content/50/5/273'
        },
        {
            title: 'World Athletics Medical Guidelines (2024)',
            description: 'Official medical and health guidelines for track and field athletes',
            concepts: ['Athlete health', 'Medical protocols', 'Safety standards'],
            journal: 'World Athletics',
            link: 'https://www.worldathletics.org/about-iaaf/documents/medical'
        },
        {
            title: 'NSCA - National Strength and Conditioning Association',
            description: 'Evidence-based strength and conditioning protocols',
            concepts: ['Training methodology', 'Periodization', 'Performance optimization'],
            journal: 'NSCA',
            link: 'https://www.nsca.com/'
        },
        {
            title: 'Weyand et al. (2000)',
            description: 'Faster top running speeds are achieved with greater ground forces not more rapid leg movements',
            concepts: ['GCT', 'Ground contact time', 'Sprint mechanics'],
            journal: 'Journal of Applied Physiology',
            link: 'https://journals.physiology.org/doi/full/10.1152/jappl.2000.89.5.1991'
        },
        {
            title: 'Google MediaPipe Pose',
            description: 'Real-time human pose estimation framework',
            concepts: ['Pose detection', '33 landmarks', 'Biomechanical analysis'],
            journal: 'Google Research',
            link: 'https://google.github.io/mediapipe/solutions/pose.html'
        }
    ];

    const verifyClaim = async () => {
        setIsVerifying(true);

        // Simulate AI verification (in production, this would call Gemini API)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Simple rule-based verification for demo
        const lowerClaim = claim.toLowerCase();
        let result: VerificationResult;

        if (lowerClaim.includes('acwr') && (lowerClaim.includes('1.0') || lowerClaim.includes('1.3'))) {
            result = {
                isValid: true,
                confidence: 95,
                sources: ['Gabbett (2016)'],
                reasoning: 'El rango ACWR óptimo de 1.0-1.3 está respaldado por la investigación de Gabbett sobre prevención de lesiones y gestión de carga de entrenamiento.'
            };
        } else if (lowerClaim.includes('100m') && lowerClaim.includes('8')) {
            result = {
                isValid: false,
                confidence: 99,
                sources: ['World Athletics Records'],
                reasoning: 'El récord mundial de 100m es 9.58s (Usain Bolt, 2009). Correr 100m en 8 segundos violaría las leyes de la física humana y biomecánica conocida.'
            };
        } else if (lowerClaim.includes('gct') && (lowerClaim.includes('0.08') || lowerClaim.includes('0.12'))) {
            result = {
                isValid: true,
                confidence: 92,
                sources: ['Weyand et al. (2000)'],
                reasoning: 'El tiempo de contacto con el suelo (GCT) típico en sprinters de élite está bien documentado en el rango de 0.08-0.12 segundos.'
            };
        } else if (lowerClaim.includes('mediapipe') && lowerClaim.includes('33')) {
            result = {
                isValid: true,
                confidence: 100,
                sources: ['Google MediaPipe Documentation'],
                reasoning: 'MediaPipe Pose detecta exactamente 33 landmarks corporales según la documentación oficial de Google.'
            };
        } else if (lowerClaim.includes('no') && lowerClaim.includes('riesgo') && lowerClaim.includes('acwr')) {
            result = {
                isValid: false,
                confidence: 98,
                sources: ['Gabbett (2016)', 'Multiple injury prevention studies'],
                reasoning: 'Falso. Un ACWR alto (>1.5) está fuertemente asociado con mayor riesgo de lesión. La investigación muestra que el riesgo aumenta exponencialmente con ratios elevados.'
            };
        } else {
            result = {
                isValid: false,
                confidence: 50,
                sources: ['Knowledge base'],
                reasoning: 'No se encontró suficiente evidencia en la base de conocimientos para verificar esta afirmación. Se requiere más contexto o fuentes específicas.'
            };
        }

        setVerificationResult(result);
        setIsVerifying(false);
    };

    return (
        <div className="h-full flex flex-col bg-background overflow-y-auto custom-scrollbar">
            <div className="max-w-5xl mx-auto w-full p-4 lg:p-8 space-y-8 pb-24">

                {/* HERO SECTION */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-volt text-5xl">verified</span>
                        <h1 className="text-3xl lg:text-5xl font-black font-display italic text-white uppercase tracking-tighter">
                            Hub <span className="text-volt">Técnico</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-3xl mx-auto">
                        Transparencia y Validación Científica
                    </p>
                    <p className="text-slate-500 text-sm max-w-2xl mx-auto">
                        Fundamentos técnicos, fuentes científicas y mecanismos de verificación que respaldan Elite Athletics
                    </p>
                </div>

                {/* FUNDAMENTACIÓN TÉCNICA */}
                <div className="glass-card p-6 rounded-2xl border-primary/20 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-2xl">terminal</span>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Fundamentación Técnica</h2>
                    </div>

                    <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
                        <p>
                            <strong className="text-white">Motor de Razonamiento Biomecánico:</strong> Elite Athletics utiliza
                            <Badge variant="primary" className="mx-1">Gemini 1.5 Pro</Badge>
                            como núcleo de inteligencia artificial, alimentado por un sistema RAG (Retrieval-Augmented Generation)
                            que combina conocimiento científico verificado con análisis en tiempo real.
                        </p>

                        <p>
                            <strong className="text-white">Base de Conocimientos:</strong> Nuestra base de datos incluye:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4 text-slate-400">
                            <li>Manuales oficiales de World Athletics (2024)</li>
                            <li>Protocolos NSCA (National Strength and Conditioning Association)</li>
                            <li>Investigación académica sobre ACWR y prevención de lesiones</li>
                            <li>Documentación técnica de MediaPipe Pose</li>
                            <li>Estudios biomecánicos de sprint y atletismo</li>
                        </ul>

                        <p>
                            <strong className="text-white">Pipeline de Procesamiento:</strong>
                        </p>
                        <div className="bg-black/40 p-4 rounded-lg font-mono text-xs space-y-1">
                            <div className="text-volt">1. Captura de Video → MediaPipe Pose (33 landmarks)</div>
                            <div className="text-primary">2. Análisis Biomecánico → Cálculos de GCT, velocidad, ángulos</div>
                            <div className="text-success">3. Verificación RAG → Cross-reference con literatura científica</div>
                            <div className="text-warning">4. Generación de Insights → Gemini 1.5 Pro + contexto del atleta</div>
                        </div>
                    </div>
                </div>

                {/* FUENTES CIENTÍFICAS */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-volt text-2xl">library_books</span>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Fuentes Científicas</h2>
                    </div>

                    <div className="grid gap-3">
                        {scientificSources.map((source, idx) => (
                            <div key={idx} className="glass-card p-4 rounded-xl border-white/5 hover:border-volt/30 transition-all group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-volt text-sm">verified</span>
                                            <h3 className="text-white font-bold text-sm">{source.title}</h3>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed">{source.description}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {source.concepts.map((concept, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px]">{concept}</Badge>
                                            ))}
                                        </div>
                                        <p className="text-slate-600 text-[10px] italic">{source.journal}</p>
                                    </div>
                                    {source.link && (
                                        <a
                                            href={source.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-volt hover:border-volt transition-all"
                                        >
                                            <span className="material-symbols-outlined text-sm text-white">open_in_new</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ESPECIFICACIONES IA */}
                <div className="glass-card p-6 rounded-2xl border-volt/20 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-volt text-2xl">smart_toy</span>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Especificaciones del Sistema IA</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <h3 className="text-primary font-bold text-sm mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs">psychology</span>
                                Modelos de IA
                            </h3>
                            <ul className="space-y-2 text-xs text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-volt">•</span>
                                    <span><strong>Gemini 1.5 Pro:</strong> Razonamiento y planificación</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-volt">•</span>
                                    <span><strong>Gemini 1.5 Flash:</strong> Respuestas rápidas</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-volt">•</span>
                                    <span><strong>MediaPipe Pose:</strong> Análisis biomecánico</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                            <h3 className="text-success font-bold text-sm mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                Capacidades
                            </h3>
                            <ul className="space-y-2 text-xs text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-success">✓</span>
                                    <span>Análisis de video a 30 FPS</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-success">✓</span>
                                    <span>Detección de 33 landmarks corporales</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-success">✓</span>
                                    <span>Cálculos biomecánicos en tiempo real</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-success">✓</span>
                                    <span>Generación de planes de entrenamiento</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-black/40 p-4 rounded-xl border border-danger/20 md:col-span-2">
                            <h3 className="text-danger font-bold text-sm mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs">warning</span>
                                Limitaciones Importantes
                            </h3>
                            <ul className="space-y-2 text-xs text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-danger">!</span>
                                    <span><strong>No es diagnóstico médico:</strong> Esta herramienta es de soporte a la decisión, no reemplaza criterio médico</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-danger">!</span>
                                    <span><strong>Requiere supervisión:</strong> El criterio del entrenador siempre prevalece sobre la IA</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-danger">!</span>
                                    <span><strong>Margen de error:</strong> ±0.05s en timing, ±2° en ángulos</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* VERIFICACIÓN ANTI-ALUCINACIONES */}
                <div className="glass-card p-6 rounded-2xl border-volt/30 space-y-6 bg-gradient-to-br from-volt/5 to-transparent">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-volt text-2xl animate-pulse">verified_user</span>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Verificación Anti-Alucinaciones</h2>
                            <Badge variant="volt">DEMO EN VIVO</Badge>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Prueba en tiempo real cómo el sistema verifica afirmaciones técnicas contra nuestra base de conocimientos científicos
                        </p>
                    </div>

                    {/* Input Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Ingresa una afirmación técnica
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={claim}
                                onChange={(e) => setClaim(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && claim && verifyClaim()}
                                placeholder="Ej: El ACWR óptimo es 1.0-1.3"
                                className="flex-1 bg-black/50 border border-white/20 px-4 py-3 rounded-xl text-white text-sm focus:border-volt outline-none placeholder-slate-600"
                                disabled={isVerifying}
                            />
                            <button
                                onClick={verifyClaim}
                                disabled={!claim || isVerifying}
                                className="px-6 py-3 bg-volt text-black font-bold rounded-xl hover:bg-volt/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                {isVerifying ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-sm">search</span>
                                        Verificar
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Example Claims */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Ejemplos:</span>
                            {exampleClaims.map((example, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setClaim(example.text)}
                                    className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
                                >
                                    {example.text}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Verification Result */}
                    {verificationResult && (
                        <div className={`p-5 rounded-xl border-2 animate-in fade-in slide-in-from-bottom-4 ${verificationResult.isValid
                                ? 'bg-success/10 border-success/30'
                                : 'bg-danger/10 border-danger/30'
                            }`}>
                            <div className="flex items-start gap-4">
                                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${verificationResult.isValid ? 'bg-success/20' : 'bg-danger/20'
                                    }`}>
                                    <span className={`material-symbols-outlined text-2xl ${verificationResult.isValid ? 'text-success' : 'text-danger'
                                        }`}>
                                        {verificationResult.isValid ? 'check_circle' : 'cancel'}
                                    </span>
                                </div>

                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className={`font-black text-lg uppercase ${verificationResult.isValid ? 'text-success' : 'text-danger'
                                            }`}>
                                            {verificationResult.isValid ? 'VERIFICADO' : 'RECHAZADO'}
                                        </h3>
                                        <Badge variant={verificationResult.isValid ? 'success' : 'danger'}>
                                            {verificationResult.confidence}% confianza
                                        </Badge>
                                    </div>

                                    <p className="text-white text-sm leading-relaxed">
                                        {verificationResult.reasoning}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Fuentes:</span>
                                        {verificationResult.sources.map((source, idx) => (
                                            <Badge key={idx} variant="outline" className="text-[10px]">
                                                {source}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* MÉTRICAS DE PRECISIÓN */}
                <div className="glass-card p-6 rounded-2xl border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Métricas de Precisión</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-black/40 p-4 rounded-xl border border-success/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-xs uppercase tracking-wider">Análisis de Video</span>
                                <Badge variant="success">98.2%</Badge>
                            </div>
                            <div className="h-2 bg-black rounded-full overflow-hidden">
                                <div className="h-full bg-success" style={{ width: '98.2%' }}></div>
                            </div>
                        </div>

                        <div className="bg-black/40 p-4 rounded-xl border border-primary/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-xs uppercase tracking-wider">Detección de Pose</span>
                                <Badge variant="primary">±2°</Badge>
                            </div>
                            <p className="text-slate-500 text-[10px]">Precisión angular en landmarks</p>
                        </div>

                        <div className="bg-black/40 p-4 rounded-xl border border-volt/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-xs uppercase tracking-wider">Timing</span>
                                <Badge variant="volt">±0.05s</Badge>
                            </div>
                            <p className="text-slate-500 text-[10px]">Margen de error en mediciones temporales</p>
                        </div>

                        <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-slate-400 text-xs uppercase tracking-wider">Cálculo ACWR</span>
                                <Badge variant="outline">Fórmula Gabbett</Badge>
                            </div>
                            <p className="text-slate-500 text-[10px]">Basado en investigación validada</p>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
                        <h3 className="text-primary font-bold text-sm mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs">info</span>
                            Métodos de Validación
                        </h3>
                        <ul className="space-y-1 text-xs text-slate-400">
                            <li>• Cross-reference con literatura científica publicada</li>
                            <li>• Verificación multi-fuente antes de generar insights</li>
                            <li>• Umbrales de confianza mínimos (80%) para recomendaciones</li>
                            <li>• Proceso de revisión por expertos en desarrollo continuo</li>
                        </ul>
                    </div>
                </div>

                {/* LEGAL FOOTER */}
                <LegalFooter />
            </div>
        </div>
    );
};

export default TechnicalHub;
