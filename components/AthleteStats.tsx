import React, { useState, useMemo } from 'react';
import { DataRing, useDataRing } from '../services/CoreArchitecture';
import { StatEntry } from '../types';
import { PerformanceChart, ChartSeries } from './viz/PerformanceChart';
import { Badge } from './common/Atomic';

type TimeFilter = '1M' | '3M' | '1Y' | 'ALL';

interface AthleteStatsProps {
    onBack?: () => void;
}

const AthleteStats: React.FC<AthleteStatsProps> = ({ onBack }) => {
    const athlete = useDataRing((ring) => ring.getAthlete('1'));
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
    const [activeEvent, setActiveEvent] = useState<string>('ALL');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState({
        event: '100m Lisos',
        result: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        notes: '',
        type: 'TRAINING' as 'TRAINING' | 'COMPETITION'
    });

    const eventsConfig = [
        { id: '100m', label: '100m', color: '#67e8f9' },
        { id: '200m', label: '200m', color: '#a5b4fc' },
        { id: '400m', label: '400m', color: '#f9a8d4' },
    ];

    // Data processing
    const allStats = athlete?.statsHistory || [];

    const filterDate = (dateStr: string) => {
        if (timeFilter === 'ALL') return true;
        const d = new Date(dateStr);
        const now = new Date();
        const months = timeFilter === '1M' ? 1 : timeFilter === '3M' ? 3 : 12;
        now.setMonth(now.getMonth() - months);
        return d >= now;
    };

    const filteredStats = useMemo(() =>
        allStats
            .filter(s => filterDate(s.date))
            .filter(s => activeEvent === 'ALL' || s.event.includes(activeEvent))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [allStats, timeFilter, activeEvent]
    );

    // Progress insights per event
    const progressInsights = useMemo(() => {
        return eventsConfig.map(ev => {
            const evStats = allStats.filter(s => s.event.includes(ev.id)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            if (evStats.length < 2) return { ...ev, improvement: null, best: evStats[0]?.numericResult };
            const first = evStats[0].numericResult;
            const last = evStats[evStats.length - 1].numericResult;
            const improvement = ((first - last) / first) * 100;
            const best = Math.min(...evStats.map(s => s.numericResult));
            return { ...ev, improvement: improvement.toFixed(1), best };
        });
    }, [allStats]);

    const handleSave = async () => {
        if (!form.result || !form.date) return;
        setIsSaving(true);
        try {
            const numResult = parseFloat(form.result);

            const newStat: StatEntry = {
                id: editingId || Date.now().toString(),
                date: form.date,
                event: form.event,
                result: `${form.result}s`,
                numericResult: numResult,
                type: form.type,
                isPB: false,
                location: form.location,
                notes: form.notes
            };

            await DataRing.ingestData('STATS_MODULE', 'STAT_UPDATE', { athleteId: '1', stat: newStat });
            resetForm();
        } catch (error) {
            console.error("Error saving stat:", error);
            alert("Error al guardar el tiempo");
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setForm({
            event: '100m Lisos',
            result: '',
            date: new Date().toISOString().split('T')[0],
            location: '',
            notes: '',
            type: 'TRAINING'
        });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (stat: StatEntry) => {
        setForm({
            event: stat.event,
            result: stat.numericResult.toString(),
            date: stat.date,
            location: stat.location || '',
            notes: stat.notes || '',
            type: stat.type
        });
        setEditingId(stat.id);
        setShowForm(true);
    };

    const handleDelete = async (stat: StatEntry) => {
        if (window.confirm(`¿Eliminar este registro de ${stat.event} (${stat.result})?`)) {
            try {
                await DataRing.ingestData('STATS_MODULE', 'STAT_UPDATE', {
                    athleteId: '1',
                    stat: stat,
                    action: 'DELETE'
                });
            } catch (error) {
                console.error("Error deleting stat:", error);
                alert("Error al eliminar el tiempo");
            }
        }
    };

    // Chart data
    const chartSeries: ChartSeries[] = useMemo(() => {
        return eventsConfig
            .filter(ev => activeEvent === 'ALL' || activeEvent === ev.id)
            .map(ev => {
                const evStats = filteredStats.filter(s => s.event.includes(ev.id)).reverse();
                if (evStats.length === 0) return null;
                return {
                    id: ev.id,
                    data: evStats.map(s => ({ val: s.numericResult, type: s.type, label: s.date })),
                    color: ev.color
                };
            })
            .filter(Boolean) as ChartSeries[];
    }, [filteredStats, activeEvent]);

    return (
        <div className="h-full bg-background overflow-y-auto custom-scrollbar">
            <div className="max-w-lg mx-auto p-3 pb-24 space-y-3">

                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 z-10 bg-background py-2 -mx-3 px-3">
                    <div className="flex items-center gap-2">
                        {onBack && (
                            <button onClick={onBack} className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                            </button>
                        )}
                        <h1 className="text-sm font-black text-white uppercase">Rendimiento</h1>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`size-8 rounded-lg flex items-center justify-center transition-all ${showForm ? 'bg-danger text-white' : 'bg-primary text-white'}`}
                    >
                        <span className="material-symbols-outlined text-sm">{showForm ? 'close' : 'add'}</span>
                    </button>
                </div>

                {/* Add/Edit Form (Inline) */}
                {showForm && (
                    <div className="glass-card p-3 rounded-xl space-y-2 border-primary/30">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] text-primary uppercase tracking-widest font-bold">
                                {editingId ? 'Editar Registro' : 'Nuevo Registro'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <select
                                className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                                value={form.event}
                                onChange={e => setForm({ ...form, event: e.target.value })}
                            >
                                {eventsConfig.map(ev => <option key={ev.id} value={ev.id === '100m' || ev.id === '200m' || ev.id === '400m' ? `${ev.label} Lisos` : ev.label}>{ev.label}</option>)}
                            </select>
                            <input
                                placeholder="Tiempo"
                                type="number"
                                step="0.01"
                                className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white font-mono"
                                value={form.result}
                                onChange={e => setForm({ ...form, result: e.target.value })}
                            />
                            <input
                                type="date"
                                className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white [color-scheme:dark]"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                placeholder="Ubicación"
                                className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                                value={form.location}
                                onChange={e => setForm({ ...form, location: e.target.value })}
                            />
                            <input
                                placeholder="Notas"
                                className="bg-black/50 border border-white/10 px-2 py-1.5 rounded text-xs text-white"
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setForm({ ...form, type: 'TRAINING' })}
                                className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${form.type === 'TRAINING' ? 'bg-info text-white' : 'bg-white/5 text-slate-500'}`}
                            >
                                Entreno
                            </button>
                            <button
                                onClick={() => setForm({ ...form, type: 'COMPETITION' })}
                                className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${form.type === 'COMPETITION' ? 'bg-warning text-black' : 'bg-white/5 text-slate-500'}`}
                            >
                                Competencia
                            </button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-1.5 bg-primary text-white rounded text-[10px] font-bold disabled:opacity-50">
                                {isSaving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters Row */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <div className="flex bg-white/5 p-0.5 rounded-lg shrink-0">
                        {(['1M', '3M', '1Y', 'ALL'] as TimeFilter[]).map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeFilter(tf)}
                                className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${timeFilter === tf ? 'bg-primary text-white' : 'text-slate-500'}`}
                            >
                                {tf === 'ALL' ? 'Todo' : tf}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-1 overflow-x-auto">
                        <button
                            onClick={() => setActiveEvent('ALL')}
                            className={`px-2 py-1 rounded text-[9px] font-bold shrink-0 ${activeEvent === 'ALL' ? 'bg-white text-black' : 'bg-white/5 text-slate-400'}`}
                        >
                            Todas
                        </button>
                        {eventsConfig.map(ev => (
                            <button
                                key={ev.id}
                                onClick={() => setActiveEvent(ev.id)}
                                className={`px-2 py-1 rounded text-[9px] font-bold shrink-0 ${activeEvent === ev.id ? 'text-black' : 'text-slate-400'}`}
                                style={{ backgroundColor: activeEvent === ev.id ? ev.color : 'rgba(255,255,255,0.05)' }}
                            >
                                {ev.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Progress Insights */}
                <div className="grid grid-cols-3 gap-2">
                    {progressInsights.map(ev => (
                        <div key={ev.id} className="glass-card p-2 rounded-lg text-center">
                            <p className="text-[8px] text-slate-500 uppercase">{ev.label}</p>
                            <p className="text-sm font-mono font-black text-white">{ev.best?.toFixed(2) || '--'}s</p>
                            {ev.improvement !== null && (
                                <p className={`text-[9px] font-bold ${parseFloat(ev.improvement) > 0 ? 'text-success' : 'text-danger'}`}>
                                    {parseFloat(ev.improvement) > 0 ? '↓' : '↑'} {Math.abs(parseFloat(ev.improvement))}%
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="glass-card p-3 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">Tendencia</span>
                        <div className="flex gap-2">
                            {eventsConfig.map(ev => (
                                <div key={ev.id} className="flex items-center gap-1">
                                    <div className="size-2 rounded-full" style={{ backgroundColor: ev.color }}></div>
                                    <span className="text-[8px] text-slate-500">{ev.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-32 w-full">
                        {chartSeries.length > 0 ? (
                            <PerformanceChart series={chartSeries} height={128} width="100%" />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                                Sin datos para mostrar
                            </div>
                        )}
                    </div>
                </div>

                {/* History */}
                <div className="glass-card p-3 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">Historial</span>
                        <span className="text-[9px] text-slate-600">{filteredStats.length} registros</span>
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                        {filteredStats.length === 0 ? (
                            <p className="text-center text-slate-600 text-xs py-4">Sin registros</p>
                        ) : (
                            filteredStats.map(stat => {
                                const ev = eventsConfig.find(e => stat.event.includes(e.id));
                                return (
                                    <div key={stat.id} className="flex items-center justify-between bg-black/30 p-2 rounded-lg group">
                                        <div className="flex items-center gap-2">
                                            <div className="size-6 rounded flex items-center justify-center" style={{ backgroundColor: `${ev?.color}20`, color: ev?.color }}>
                                                <span className="material-symbols-outlined text-xs">timer</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-bold text-white">{stat.result}</span>
                                                    <span className="text-[8px] text-slate-500">{stat.event.replace(' Lisos', '')}</span>
                                                    {stat.type === 'COMPETITION' && <Badge variant="warning" className="text-[6px] py-0 px-1">C</Badge>}
                                                </div>
                                                <div className="flex gap-2 text-[8px] text-slate-600">
                                                    <span>{stat.date}</span>
                                                    {stat.location && <span>📍{stat.location}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(stat)} className="size-6 rounded bg-info/10 text-info flex items-center justify-center hover:bg-info hover:text-white">
                                                <span className="material-symbols-outlined text-xs">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(stat)} className="size-6 rounded bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white">
                                                <span className="material-symbols-outlined text-xs">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AthleteStats;