import React, { useState, useRef, useEffect } from 'react';
import { Button, Badge } from '../common/Atomic';

interface VoiceRecorderProps {
    onSave: (audioBlob: Blob) => void;
    onCancel: () => void;
    className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSave, onCancel, className = '' }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [hasRecorded, setHasRecorded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio Element for Preview
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.onended = () => setIsPlaying(false);
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, []);

    // Start Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                if (audioRef.current) audioRef.current.src = url;

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setHasRecorded(true);
            setDuration(0);
            setAudioBlob(null);

            // Timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

            // Visualizer
            visualize();

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("No microphone access.");
        }
    };

    // Stop Recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
    };

    // Toggle Preview Playback
    const togglePlayback = () => {
        if (!audioRef.current || !audioUrl) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const visualize = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const animate = () => {
                if (!ctx) return;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = isRecording ? '#D1F349' : '#94a3b8'; // Volt vs Slate
                const bars = 30;
                const width = canvas.width / bars;
                for (let i = 0; i < bars; i++) {
                    // Random height for demo, usually connects to AnalyserNode
                    const height = isRecording ? Math.random() * canvas.height * 0.8 : 2;
                    ctx.fillRect(i * width, (canvas.height - height) / 2, width - 1, height);
                }
                if (isRecording) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                }
            };
            animate();
        }
    }

    const handleSave = () => {
        if (audioBlob) {
            onSave(audioBlob);
        }
    };

    // Clean up
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current as number);
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none ${className}`}>
            <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl pointer-events-auto w-full max-w-sm mx-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined ${isRecording ? 'text-volt animate-pulse' : 'text-slate-400'}`}>mic</span>
                        <span className="text-white font-black italic uppercase tracking-wider text-sm">Nota de Voz</span>
                    </div>
                    {/* Status Badge */}
                    <Badge variant="neutral" className={`font-mono ${isRecording ? 'text-danger border-danger animate-pulse' : 'text-slate-400'}`}>
                        {isRecording ? 'REC' : (hasRecorded ? 'REVISIÓN' : 'LISTO')}
                    </Badge>
                </div>

                {/* Visualizer / Waveform Area */}
                <div className="h-16 w-full bg-black/50 rounded-xl mb-6 overflow-hidden border border-white/10 relative flex items-center justify-center">
                    <canvas ref={canvasRef} width={300} height={64} className="w-full h-full opacity-80 absolute inset-0" />
                    <span className="text-3xl font-black font-mono text-white tracking-widest drop-shadow-lg z-10 relative">
                        {formatTime(duration)}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* LEFT BUTTON: Cancel / Discard */}
                    <Button
                        variant="ghost"
                        className="h-14 rounded-xl border border-white/20 hover:bg-white/10 text-slate-300 font-bold uppercase"
                        onClick={onCancel}
                    >
                        {hasRecorded ? 'Descartar' : 'Cancelar'}
                    </Button>

                    {/* RIGHT BUTTON: Contextual Action */}
                    {!isRecording && !hasRecorded && (
                        <Button
                            variant="danger"
                            className="h-14 rounded-xl text-black font-black uppercase tracking-widest shadow-glow-danger"
                            onClick={startRecording}
                        >
                            <span className="material-symbols-outlined mr-2">fiber_manual_record</span>
                            Grabar
                        </Button>
                    )}

                    {isRecording && (
                        <Button
                            variant="outline"
                            className="h-14 rounded-xl text-white border-2 border-white/20 font-black uppercase tracking-widest animate-pulse"
                            onClick={stopRecording}
                        >
                            <span className="material-symbols-outlined mr-2">stop_circle</span>
                            Detener
                        </Button>
                    )}

                    {!isRecording && hasRecorded && (
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="secondary"
                                className="flex-1 h-14 rounded-xl"
                                onClick={togglePlayback}
                            >
                                <span className="material-symbols-outlined">{isPlaying ? 'pause' : 'play_arrow'}</span>
                            </Button>
                            <Button
                                variant="volt"
                                className="flex-[2] h-14 rounded-xl text-black font-black uppercase tracking-widest shadow-glow-volt"
                                onClick={handleSave}
                            >
                                Guardar
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceRecorder;
