import React from 'react';

interface MacrocycleChartProps {
    dataPoints: number[];
    projectedDataPoints?: number[];
    width?: string | number;
    height?: string | number;
    acwrActual?: number;
    currentWeek?: number; // 1-8
    competitions?: { name: string; week: number }[];
    injuries?: { week: number }[];
    therapies?: { week: number }[];
}

export const MacrocycleChart: React.FC<MacrocycleChartProps> = ({
    dataPoints,
    projectedDataPoints = [60, 55, 75, 45, 65, 35, 70, 75], // Fallback/Demo
    width = "100%",
    height = "100%",
    acwrActual = 1.24,
    currentWeek = 4,
    competitions = [
        { name: 'CLASIFICATORIO', week: 6 },
        { name: 'NACIONAL', week: 8 }
    ],
    injuries = [{ week: 2.5 }],
    therapies = [{ week: 3 }, { week: 4.5 }]
}) => {
    const viewBoxW = 800;
    const viewBoxH = 200;
    const padding = { top: 40, bottom: 40, left: 40, right: 60 };
    const chartW = viewBoxW - padding.left - padding.right;
    const chartH = viewBoxH - padding.top - padding.bottom;

    const maxVal = 100;
    const minVal = 0;

    const getX = (week: number) => padding.left + ((week - 1) / 7) * chartW;
    const getY = (val: number) => padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

    const generateSmoothPath = (data: number[]) => {
        if (data.length < 2) return "";
        const points = data.map((v, i) => ({ x: getX(i + 1), y: getY(v) }));
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) / 2;
            d += ` C ${cp1x} ${p0.y}, ${cp1x} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return d;
    };

    const realPath = generateSmoothPath(dataPoints);
    const projectedPath = generateSmoothPath(projectedDataPoints);

    return (
        <div style={{ width, height }} className="relative bg-black rounded-3xl p-4 md:p-6 border border-white/10 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-xl">show_chart</span>
                        <h2 className="text-white font-black italic uppercase tracking-tighter text-lg md:text-2xl">
                            Macro-Periodización 8 Semanas
                        </h2>
                    </div>
                    <div className="text-slate-500 font-mono text-[9px] uppercase tracking-widest">
                        Carga Proyectada vs Real // Biometría Centrada
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full border border-primary"></div>
                        <span className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">Proyectada</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-volt"></div>
                        <span className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">Real</span>
                    </div>
                </div>
            </div>

            {/* SVG Chart */}
            <svg viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} className="w-full h-full overflow-visible">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D9FF00" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#D9FF00" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[...Array(8)].map((_, i) => (
                    <line
                        key={i}
                        x1={getX(i + 1)} y1={padding.top} x2={getX(i + 1)} y2={padding.top + chartH}
                        stroke="white" strokeOpacity="0.05" strokeWidth="1"
                    />
                ))}
                <line
                    x1={padding.left} y1={padding.top + chartH / 2} x2={padding.left + chartW} y2={padding.top + chartH / 2}
                    stroke="white" strokeOpacity="0.05" strokeDasharray="4 4"
                />

                {/* Pre-season area */}
                <rect x={getX(1.2)} y={padding.top - 10} width={getX(3) - getX(1.2)} height={chartH / 3} fill="#D9FF00" fillOpacity="0.05" rx="4" />
                <text x={getX(2.1)} y={padding.top + 10} className="fill-volt/40 text-[8px] font-black uppercase tracking-widest">Pretemporada</text>

                {/* Projected Line */}
                <path d={projectedPath} fill="none" stroke="#30A9FF" strokeWidth="3" strokeDasharray="8 6" strokeOpacity="0.4" strokeLinecap="round" />

                {/* Real Line Area & Line */}
                <path d={`${realPath} L ${getX(dataPoints.length)} ${padding.top + chartH} L ${getX(1)} ${padding.top + chartH} Z`} fill="url(#realGrad)" />
                <path d={realPath} fill="none" stroke="#D9FF00" strokeWidth="4" filter="url(#glow)" strokeLinecap="round" />

                {/* Week Labels */}
                {[...Array(8)].map((_, i) => (
                    <text
                        key={i} x={getX(i + 1)} y={viewBoxH - 10}
                        textAnchor="middle"
                        className="fill-slate-500 text-[10px] font-mono font-bold"
                    >
                        W{i + 1}
                    </text>
                ))}

                {/* Current Week Marker ("HOY") */}
                <line x1={getX(currentWeek)} y1={padding.top - 20} x2={getX(currentWeek)} y2={padding.top + chartH} stroke="#30A9FF" strokeWidth="1" />
                <rect x={getX(currentWeek) - 15} y={padding.top - 30} width="30" height="15" rx="4" fill="#30A9FF" fillOpacity="0.2" className="backdrop-blur" />
                <text x={getX(currentWeek)} y={padding.top - 20} textAnchor="middle" className="fill-volt text-[8px] font-black uppercase">Hoy</text>

                {/* Competition Markers */}
                {competitions.map((comp, i) => (
                    <g key={i}>
                        <line x1={getX(comp.week)} y1={padding.top - 10} x2={getX(comp.week)} y2={padding.top + chartH} stroke="white" strokeOpacity="0.2" strokeDasharray="2 2" />
                        <rect x={getX(comp.week) - 35} y={padding.top + chartH / 3} width="70" height="24" rx="6" fill="#D9FF00" />
                        <text x={getX(comp.week)} y={padding.top + chartH / 3 + 15} textAnchor="middle" className="fill-black text-[9px] font-black tracking-widest">{comp.name}</text>
                    </g>
                ))}

                {/* Event Dots (Injuries/Therapies) */}
                {injuries.map((inj, i) => (
                    <circle key={i} cx={getX(inj.week)} cy={getY(35)} r="5" fill="#FF3B30" filter="url(#glow)" />
                ))}
                {therapies.map((th, i) => (
                    <circle key={i} cx={getX(th.week)} cy={getY(35)} r="4" fill="#30A9FF" filter="url(#glow)" />
                ))}

                {/* Dots on Real Line */}
                {dataPoints.map((v, i) => (
                    <circle key={i} cx={getX(i + 1)} cy={getY(v)} r="5" fill="#D9FF00" filter="url(#glow)" />
                ))}

                {/* ACWR Text Overlay */}
                <g transform={`translate(${viewBoxW - 100}, ${viewBoxH - 70})`}>
                    <text x="0" y="0" className="fill-slate-500 text-[10px] font-black uppercase tracking-widest italic">ACWR Actual</text>
                    <text x="0" y="35" className="fill-white font-black italic text-5xl tracking-tighter shadow-glow-volt">{acwrActual.toFixed(2)}</text>
                </g>
            </svg>
        </div>
    );
};
