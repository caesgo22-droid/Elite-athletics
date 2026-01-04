import React from 'react';
import { useDataRing } from '../../services/CoreArchitecture';

interface MacrocycleWidgetProps {
    athleteId?: string;
    height?: number;
    showLegend?: boolean;
    currentWeek?: number;
}

export const MacrocycleWidget: React.FC<MacrocycleWidgetProps> = ({
    athleteId = '1',
    height = 180,
    showLegend = true,
    currentWeek = 4
}) => {
    const athlete = useDataRing((ring) => ring.getAthlete(athleteId));

    // Real data from DataRing - ensure we have 8 weeks of data
    const realData = athlete?.loadTrend && athlete.loadTrend.length >= 8
        ? athlete.loadTrend.slice(0, 8)
        : athlete?.loadTrend && athlete.loadTrend.length > 0
            ? [...athlete.loadTrend, ...Array(8 - athlete.loadTrend.length).fill(athlete.loadTrend[athlete.loadTrend.length - 1])]
            : Array(8).fill(0).map((_, i) => Math.min(100, (i + 1) * 12)); // Progressive fallback

    const projectedData = Array(8).fill(0).map((_, i) => Math.min(100, realData[i] * 1.1 + 5)); // 10% higher than real

    // Get injuries, therapies, competitions from athlete data
    const injuries = athlete?.injuryHistory?.filter(i => i.status === 'ACTIVE').map((_, idx) => ({ week: 2 + idx })) || [];
    const therapies = athlete?.recentTherapies?.slice(0, 2).map((_, idx) => ({ week: 3 + idx })) || [];

    // Always use week 8 for competition for consistency
    const competitions = [{ name: athlete?.upcomingCompetitions?.[0]?.name || 'Nacional', week: 8 }];

    const chartWidth = 400;
    const chartHeight = height;
    const padding = { left: 8, right: 8, top: 32, bottom: 24 };
    const plotW = chartWidth - padding.left - padding.right;
    const plotH = chartHeight - padding.top - padding.bottom;

    const getX = (week: number) => padding.left + ((week - 1) / 7) * plotW;
    const getY = (val: number) => {
        // Add 5px margin at top to prevent clipping of high values
        const margin = 5;
        return padding.top + margin + (plotH - margin * 2) * (1 - val / 100);
    };

    // DEBUG: Log rendering data
    console.log(`[MacrocycleWidget height=${height}] realData:`, realData);
    console.log(`[MacrocycleWidget height=${height}] plotH:`, plotH, 'padding:', padding);
    console.log(`[MacrocycleWidget height=${height}] Y positions:`, realData.map((v, i) => `S${i + 1}:${getY(v).toFixed(1)}`));

    const createSmoothPath = (points: number[]) => {
        if (points.length < 2) return '';
        const coords = points.map((v, i) => ({ x: getX(i + 1), y: getY(v) }));
        let d = `M ${coords[0].x} ${coords[0].y}`;
        for (let i = 0; i < coords.length - 1; i++) {
            const cp1x = coords[i].x + (coords[i + 1].x - coords[i].x) / 2;
            d += ` C ${cp1x} ${coords[i].y}, ${cp1x} ${coords[i + 1].y}, ${coords[i + 1].x} ${coords[i + 1].y}`;
        }
        return d;
    };

    const createAreaPath = (points: number[]) => {
        const path = createSmoothPath(points);
        return `${path} L ${getX(points.length)} ${padding.top + plotH} L ${getX(1)} ${padding.top + plotH} Z`;
    };

    return (
        <div className="relative w-full" style={{ height }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                <defs>
                    <linearGradient id="mcPlanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="mcRealGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#334155" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="mcPreseason" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#475569" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Preseason overlay */}
                <rect x={padding.left} y={padding.top} width={plotW * 0.22} height={plotH} fill="url(#mcPreseason)" />

                {/* Current week line */}
                <line x1={getX(currentWeek)} y1={padding.top} x2={getX(currentWeek)} y2={padding.top + plotH} stroke="#475569" strokeWidth="1" strokeDasharray="3,3" />
                <rect x={getX(currentWeek) - 18} y={padding.top - 18} width="36" height="14" rx="3" fill="#334155" />
                <text x={getX(currentWeek)} y={padding.top - 8} textAnchor="middle" className="fill-slate-400 text-[9px]">SEM {currentWeek}</text>

                {/* Plan area + line */}
                <path d={createAreaPath(projectedData)} fill="url(#mcPlanGrad)" />
                <path d={createSmoothPath(projectedData)} fill="none" stroke="#a5b4fc" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />

                {/* Real area + line */}
                <path d={createAreaPath(realData)} fill="url(#mcRealGrad)" />
                <path d={createSmoothPath(realData)} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />

                {/* Injury markers */}
                {injuries.map((inj, i) => (
                    <g key={`inj-${i}`}>
                        <circle cx={getX(inj.week)} cy={getY(realData[inj.week - 1] || 40)} r="10" fill="#1e293b" stroke="#ef4444" strokeWidth="1.5" />
                        <text x={getX(inj.week)} y={getY(realData[inj.week - 1] || 40) + 4} textAnchor="middle" className="fill-red-400 text-[11px]">⚡</text>
                    </g>
                ))}

                {/* Therapy markers */}
                {therapies.map((th, i) => (
                    <g key={`th-${i}`}>
                        <circle cx={getX(th.week)} cy={getY(realData[th.week - 1] || 60)} r="10" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
                        <text x={getX(th.week)} y={getY(realData[th.week - 1] || 60) + 4} textAnchor="middle" className="fill-green-400 text-[11px]">✦</text>
                    </g>
                ))}

                {/* Competition markers */}
                {competitions.map((c, i) => (
                    <g key={`comp-${i}`}>
                        <circle cx={getX(c.week)} cy={getY(projectedData[c.week - 1] || 75)} r="8" fill="#fbbf24" fillOpacity="0.2" stroke="#fbbf24" strokeWidth="1" />
                        <text x={getX(c.week)} y={getY(projectedData[c.week - 1] || 75) + 3} textAnchor="middle" className="text-[7px] font-bold fill-yellow-500">🏆</text>
                    </g>
                ))}

                {/* Week labels */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                    <text key={w} x={getX(w)} y={chartHeight - 6} textAnchor="middle" className={`text-[9px] ${w === currentWeek ? 'fill-cyan-400' : 'fill-slate-600'}`}>
                        S{w}
                    </text>
                ))}
            </svg>

            {/* Legend */}
            {showLegend && (
                <div className="absolute top-1 left-1 flex flex-wrap gap-2 text-[8px] font-black uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        <div className="size-1.5 rounded-full bg-slate-500"></div>
                        <span className="text-slate-500">Plan</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-cyan-500/20">
                        <div className="size-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                        <span className="text-slate-300">Real</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-red-500/10">
                        <div className="size-1.5 rounded-full bg-red-400/50"></div>
                        <span className="text-slate-500">Lesión</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MacrocycleWidget;
