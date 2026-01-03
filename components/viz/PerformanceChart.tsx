import React from 'react';

export interface PerformanceDataPoint {
    val: number;
    type?: string;
    label?: string;
    isPB?: boolean;
}

export interface ChartSeries {
    id: string;
    data: PerformanceDataPoint[];
    color: string;
}

interface PerformanceChartProps {
    data?: PerformanceDataPoint[]; // Simple mode
    series?: ChartSeries[];        // Multi-series mode
    width?: string | number;
    height?: string | number;
    color?: string;
    textColor?: string;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
    data,
    series,
    width = "100%",
    height = "100%",
    color = "#D1F349",
    textColor = "#D1F349"
}) => {
    // Normalize to series
    const finalSeries: ChartSeries[] = series || (data ? [{ id: 'default', data, color }] : []);

    if (finalSeries.length === 0) return null;

    const viewBoxW = 300;
    const viewBoxH = 100;
    const paddingY = 10;

    // Calculate global range
    const allVals = finalSeries.flatMap(s => s.data.map(d => d.val));
    const min = Math.min(...allVals) * 0.98;
    const max = Math.max(...allVals) * 1.02;
    const range = max - min || 1;

    // Helper to generate path for a series (STRAIGHT LINES)
    const generatePath = (pts: { x: number, y: number }[]) => {
        if (pts.length === 0) return "";
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            d += ` L ${pts[i].x} ${pts[i].y}`;
        }
        return d;
    };

    return (
        <div style={{ width, height }} className="relative">
            <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
            >
                {finalSeries.map((s, sIdx) => {
                    const points = s.data.map((d, i) => ({
                        x: (i / (Math.max(s.data.length - 1, 1))) * viewBoxW,
                        y: viewBoxH - paddingY - ((d.val - min) / range) * (viewBoxH - 2 * paddingY),
                        ...d
                    }));
                    if (s.data.length === 1) points[0].x = viewBoxW / 2;

                    return (
                        <g key={s.id}>
                            <defs>
                                <filter id={`shadow-${s.id}`}>
                                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={s.color} floodOpacity="0.4" />
                                </filter>
                            </defs>

                            <path
                                d={generatePath(points)}
                                fill="none"
                                stroke={s.color}
                                strokeWidth="2"
                                strokeLinecap="round"
                                filter={`url(#shadow-${s.id})`}
                            />

                            {points.map((p, i) => (
                                <g key={i} className="group cursor-pointer">
                                    <circle cx={p.x} cy={p.y} r="2" fill={s.color} />
                                    <text
                                        x={p.x}
                                        y={p.y - 6}
                                        textAnchor="middle"
                                        fill={s.id === 'default' ? textColor : s.color}
                                        fontSize="6"
                                        fontFamily="Space Mono"
                                        fontWeight="900"
                                        className="opacity-60 md:opacity-100"
                                    >
                                        {p.val}s
                                    </text>
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <text
                                            x={p.x}
                                            y={p.y - 14}
                                            textAnchor="middle"
                                            fill="white"
                                            fontSize="6"
                                            fontWeight="bold"
                                        >
                                            {p.type || "RESULT"}
                                        </text>
                                    </g>
                                </g>
                            ))}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
