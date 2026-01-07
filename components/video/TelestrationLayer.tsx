import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../common/Atomic';

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    color: string;
    width: number;
}

interface TelestrationLayerProps {
    isActive: boolean;
    onClose: () => void;
    onSave?: (data: string) => void;
    initialData?: string;
    color?: string;
    className?: string;
}

const TelestrationLayer: React.FC<TelestrationLayerProps> = ({
    isActive,
    onClose,
    onSave,
    initialData,
    color = '#D1F349', // Volt
    className = ''
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [selectedColor, setSelectedColor] = useState(color);
    const [selectedWidth, setSelectedWidth] = useState(4);

    const COLORS = [
        { name: 'Volt', value: '#D1F349' },
        { name: 'Red', value: '#FF4136' },
        { name: 'Blue', value: '#0074D9' },
        { name: 'White', value: '#FFFFFF' }
    ];

    const WIDTHS = [2, 4, 8, 12];

    // Hydrate from initialData
    useEffect(() => {
        if (initialData) {
            try {
                const parsed = JSON.parse(initialData);
                if (Array.isArray(parsed)) setStrokes(parsed);
            } catch (e) {
                console.error("Failed to parse telestration data", e);
            }
        }
    }, [initialData]);

    // Handle Resize
    useEffect(() => {
        const resizeCanvas = () => {
            if (containerRef.current && canvasRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                // Set actual canvas size to match display size for sharp rendering
                canvasRef.current.width = width;
                canvasRef.current.height = height;
                redraw();
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [containerRef.current]);

    // Redraw all strokes
    const redraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        strokes.forEach(stroke => {
            if (stroke.points.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        });
    };

    // Redraw when strokes change
    useEffect(() => {
        redraw();
    }, [strokes]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isActive) return;
        e.preventDefault(); // Prevent scrolling on touch
        const point = getCoords(e);
        if (point) {
            setIsDrawing(true);
            setCurrentStroke([point]);

            // Draw dot immediately
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.fillStyle = selectedColor;
                ctx.beginPath();
                ctx.arc(point.x, point.y, selectedWidth / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !isActive) return;
        e.preventDefault();
        const point = getCoords(e);
        if (point) {
            setCurrentStroke(prev => [...prev, point]);

            // Draw live segment
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                const lastPoint = currentStroke[currentStroke.length - 1];
                if (lastPoint) {
                    ctx.beginPath();
                    ctx.strokeStyle = selectedColor;
                    ctx.lineWidth = selectedWidth;
                    ctx.lineCap = 'round';
                    ctx.moveTo(lastPoint.x, lastPoint.y);
                    ctx.lineTo(point.x, point.y);
                    ctx.stroke();
                }
            }
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (currentStroke.length > 0) {
                setStrokes(prev => [...prev, { points: currentStroke, color: selectedColor, width: selectedWidth }]);
            }
            setCurrentStroke([]);
        }
    };

    const clearCanvas = () => {
        setStrokes([]);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const undoLast = () => {
        setStrokes(prev => prev.slice(0, -1));
    };

    // Allow rendering even if not active (read-only mode)

    return (
        <div ref={containerRef} className={`absolute inset-0 z-40 touch-none ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />

            {/* FLOATING TOOLS */}
            {isActive && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                    {/* Color Palette */}
                    <div className="flex items-center gap-3 p-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
                        {COLORS.map(c => (
                            <button
                                key={c.value}
                                onClick={() => setSelectedColor(c.value)}
                                className={`size-6 rounded-full border-2 transition-all ${selectedColor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c.value }}
                            />
                        ))}
                        <div className="w-px h-4 bg-white/20 mx-1"></div>
                        {/* Width selection */}
                        <div className="flex items-center gap-2 px-1">
                            {WIDTHS.map(w => (
                                <button
                                    key={w}
                                    onClick={() => setSelectedWidth(w)}
                                    className={`size-6 rounded flex items-center justify-center transition-all ${selectedWidth === w ? 'bg-white/20' : 'hover:bg-white/5'}`}
                                >
                                    <div className="bg-white rounded-full" style={{ width: w / 2 + 1, height: w / 2 + 1 }} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isActive && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 animate-in slide-in-from-bottom-4">
                    <button
                        onClick={undoLast}
                        className="size-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all disabled:opacity-50"
                        disabled={strokes.length === 0}
                        title="Undo"
                    >
                        <span className="material-symbols-outlined text-sm">undo</span>
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="size-8 rounded-lg bg-white/10 hover:bg-danger/20 hover:text-danger flex items-center justify-center text-white transition-all disabled:opacity-50"
                        disabled={strokes.length === 0}
                        title="Clear All"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-1"></div>
                    <button
                        onClick={() => {
                            if (onSave) onSave(JSON.stringify(strokes));
                            onClose();
                        }}
                        className="px-6 py-2 rounded-lg bg-volt text-black font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-volt/20"
                    >
                        Listo
                    </button>
                </div>
            )}
        </div>
    );
};

export default TelestrationLayer;
