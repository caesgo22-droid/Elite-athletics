import React, { useMemo } from 'react';
import { useDataRing } from '../services/CoreArchitecture';
import { DailyLog } from '../types';

interface CheckInHistoryProps {
    athleteId: string;
    onClose: () => void;
}

const Sparkline: React.FC<{ data: number[]; color: string; label: string }> = ({ data, color, label }) => {
    const height = 40;
    const width = 100;
    const max = Math.max(...data, 10);
    const min = Math.min(...data, 0);
    const range = max - min || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col items-center flex-1 min-w-[80px]">
            <p className="text-[8px] text-slate-500 uppercase mb-1">{label}</p>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    points={points}
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
        </div>
    );
};

const CheckInHistory: React.FC<CheckInHistoryProps> = ({ athleteId, onClose }) => {
    const athlete = useDataRing((ring) => ring.getAthlete(athleteId));
    const logs = useMemo(() => {
        if (!athlete || !athlete.dailyLogs) return [];
        // Sort by date ascending for charts
        return [...athlete.dailyLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-14); // Last 14 entries
    }, [athlete]);

    if (!logs || logs.length === 0) {
        return (
            <div className="p-4 bg-black/40 rounded-xl border border-white/10 text-center">
                <p className="text-xs text-slate-500">Sin historial suficiente para tendencias.</p>
                <p className="text-[10px] text-slate-600 mt-1">Registra más check-ins para ver gráficos.</p>
                <button onClick={onClose} className="mt-3 text-xs text-primary underline">Cerrar</button>
            </div>
        );
    }

    const sleepData = logs.map(l => l.metrics.sleepHours);
    const qualityData = logs.map(l => l.metrics.sleepQuality);
    const stressData = logs.map(l => l.metrics.stress || 0);
    const rpeData = logs.map(l => l.metrics.rpe || 0);

    return (
        <div className="glass-card p-4 rounded-xl border border-white/10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tendencias (14 Días)</h3>
                <button onClick={onClose} className="size-6 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10">
                    <span className="material-symbols-outlined text-sm text-slate-400">close</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Sparkline data={sleepData} color="#a5b4fc" label="Horas Sueño" />
                <Sparkline data={qualityData} color="#86efac" label="Calidad" />
                <Sparkline data={stressData} color="#fca5a5" label="Estrés" />
                <Sparkline data={rpeData} color="#fcd34d" label="RPE Promedio" />
            </div>

            <div className="text-[9px] text-slate-600 italic text-center pt-2 border-t border-white/5">
                Datos de los últimos {logs.length} registros
            </div>
        </div>
    );
};

export default CheckInHistory;
