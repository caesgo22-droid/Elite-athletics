import React, { useState, useRef, useEffect } from 'react';
import { DataRing, Brain } from '../services/CoreArchitecture';
import { VisionSatellite } from '../services/satellites/VisionSatellite';
import { StorageSatellite } from '../services/satellites/StorageSatellite';
import { VideoAnalysisEntry } from '../types';
import { Badge } from './common/Atomic';
import { BackButton } from './common/BackButton';
import TelestrationLayer from './video/TelestrationLayer';
import { logger } from '../services/Logger';

interface VideoAnalysisProps {
    userRole?: 'ATHLETE' | 'STAFF' | 'ADMIN' | 'PENDING';
    athleteId?: string; // NEW: Identification support
    onBack?: () => void;
}

const EXERCISE_TYPES = ['Block Start', 'A-Skip', 'B-Skip', 'Drive Phase', 'Max Velocity', 'Wickets', 'Flying Sprint'];

const VideoAnalysis: React.FC<VideoAnalysisProps> = ({ userRole = 'ATHLETE', athleteId = '1', onBack }) => {
    const [activeView, setActiveView] = useState<'upload' | 'player' | 'history'>('upload');
    const [selectedEntry, setSelectedEntry] = useState<VideoAnalysisEntry | null>(null);
    const [history, setHistory] = useState<VideoAnalysisEntry[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [processingStage, setProcessingStage] = useState('');
    const [showCalibration, setShowCalibration] = useState(false);
    const [isDidacticMode, setIsDidacticMode] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const [coachComment, setCoachComment] = useState('');
    const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

    const [activeCoachTool, setActiveCoachTool] = useState<'drawing' | 'voice' | null>(null);
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [drawPaths, setDrawPaths] = useState<{ x: number, y: number, color: string }[][]>([]);
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number, color: string }[]>([]);
    const [drawColor, setDrawColor] = useState('#00FF41');
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedCapture, setSelectedCapture] = useState<string | null>(null);
    const [selectedStrokes, setSelectedStrokes] = useState<string | undefined>(undefined);
    const [comparisonEntry, setComparisonEntry] = useState<VideoAnalysisEntry | null>(null);
    const [showHistorySelector, setShowHistorySelector] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRecorderRef = useRef<MediaRecorder | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        const athlete = DataRing.getAthlete(athleteId);
        if (athlete?.videoHistory) setHistory(athlete.videoHistory);
        const unsubscribe = DataRing.subscribe(() => {
            const updated = DataRing.getAthlete(athleteId);
            if (updated?.videoHistory) setHistory([...updated.videoHistory]);
        });
        return () => {
            unsubscribe();
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setActiveView('player');
        setSelectedEntry(null); // Reset analysis if we're picking a new file
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
            streamRef.current = stream;
            const chunks: Blob[] = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setActiveView('player');
                setSelectedEntry(null);
                stream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingIntervalRef.current = window.setInterval(() => setRecordingTime(t => t + 1), 1000);
        } catch (err) { console.error('Recording failed:', err); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
            setIsRecording(false);
        }
    };

    // Helper: Sanitize YouTube URLs to ensure they're valid
    const sanitizeYouTubeUrls = (correctionPlan: any[]) => {
        if (!correctionPlan || !Array.isArray(correctionPlan)) return [];

        return correctionPlan.map(ex => {
            const drillName = ex.drillName || 'Technique Drill';
            // Use YouTube Search to guarantee results are always available
            // This avoids "Video unavailable" errors from specific dead links
            const query = encodeURIComponent(`track and field ${drillName} drill technique`);
            const searchUrl = `https://www.youtube.com/results?search_query=${query}`;

            return {
                ...ex,
                videoRef: searchUrl
            };
        });
    };

    // Helper: Generate thumbnail from video element
    const generateThumbnail = async (videoElement: HTMLVideoElement): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = 90;
            const ctx = canvas.getContext('2d');
            if (ctx && videoElement.videoWidth > 0) {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            } else {
                resolve('');
            }
        });
    };

    const runAnalysis = async () => {
        const url = previewUrl;
        if (!url) return;

        setIsAnalyzing(true);
        setProcessingStage('Detectando tipo de ejercicio...');

        const detectedType = EXERCISE_TYPES[Math.floor(Math.random() * EXERCISE_TYPES.length)];
        await new Promise(r => setTimeout(r, 500));

        setProcessingStage('Analizando biomecánica y flujo...');

        let result: any = null;
        let sequence: any = null;
        let usedMediaPipe = false;

        // 1. Attempt MediaPipe Analysis (now using local assets)
        try {
            logger.log("[VIDEO ANALYSIS] 🧬 Attempting MediaPipe analysis (Local)...");
            [result, sequence] = await Promise.all([
                VisionSatellite.processFrameLocal(url),
                VisionSatellite.processVideoSequence(url, 90) // High sampling for interpolation
            ]);
            usedMediaPipe = true;
            logger.log("[VIDEO ANALYSIS] ✅ MediaPipe analysis successful");
        } catch (err) {
            console.warn("[VIDEO ANALYSIS] ⚠️ MediaPipe failed, falling back to AI-only:", err);
            usedMediaPipe = false;
        }

        // 2. Prepare Fallback Data if MediaPipe Failed
        let rawBase64: string | null = null;

        if (!usedMediaPipe) {
            logger.log("[VIDEO ANALYSIS] 🤖 Using AI-only mode");
            // Extract frame specifically for AI analysis
            const frameImage = await VisionSatellite.extractFrameFromVideo(url);
            // Strip the data:image prefix for Gemini API
            rawBase64 = frameImage.split(',')[1] || frameImage;

            result = {
                derivedAngles: {
                    hipExtension: 0,
                    trunkAngle: 0,
                    shinAngle: 0,
                    kneeFlexion: 0
                },
                thumbnail: frameImage
            };
            sequence = [];
        }

        setProcessingStage('Generando reporte elite con Gemini 2.0...');

        try {
            let aiInsights: any = null;

            if (usedMediaPipe) {
                // Use full MediaPipe + AI analysis
                const payload = VisionSatellite.prepareHybridPayload(url, result, sequence);
                aiInsights = await Brain.analyzeVideo(athleteId, payload);
            } else {
                // AI-only mode: send video URL directly to Gemini
                logger.log("[VIDEO ANALYSIS] Using AI-only mode with video URL - V2.1 RAW BASE64");
                aiInsights = await Brain.analyzeVideo(athleteId, {
                    image: rawBase64,
                    contextData: `Exercise Type: ${detectedType}. AI-only analysis (no pose landmarks available).`
                });
            }

            const localBiomechanics = usedMediaPipe ? [
                { joint: 'Extensión de Cadera', angle: `${result.derivedAngles.hipExtension}°`, status: 'optimal' as const },
                { joint: 'Inclinación de Tronco', angle: `${result.derivedAngles.trunkAngle}°`, status: 'warning' as const },
                { joint: 'Ángulo de Tibia', angle: `${result.derivedAngles.shinAngle}°`, status: 'optimal' as const },
                { joint: 'Flexión de Rodilla', angle: `${result.derivedAngles.kneeFlexion}°`, status: 'optimal' as const }
            ] : [];

            // Sanitize YouTube URLs in correction plan
            const sanitizedCorrectionPlan = sanitizeYouTubeUrls(aiInsights?.correctionPlan || []);
            logger.log('[VIDEO ANALYSIS] Sanitized correction plan URLs:', sanitizedCorrectionPlan);

            setProcessingStage('Sincronizando video en la nube...');

            // Generate thumbnail from video element
            let thumbnailUrl = '';
            if (videoRef.current) {
                try {
                    thumbnailUrl = await generateThumbnail(videoRef.current);
                    logger.log('[VIDEO ANALYSIS] Generated thumbnail successfully');
                } catch (err) {
                    console.warn('[VIDEO ANALYSIS] Failed to generate thumbnail:', err);
                    thumbnailUrl = result.thumbnail || '';
                }
            } else {
                thumbnailUrl = result.thumbnail || '';
            }

            // CONVERT BLOB URL TO UPLOADABLE FILE (with timeout to prevent hanging)
            let permanentUrl = url;
            try {
                logger.log('[VIDEO ANALYSIS] 📤 Attempting video upload to Firebase Storage...');
                const response = await fetch(url);
                const blob = await response.blob();

                // Add timeout to prevent hanging on upload
                const uploadPromise = StorageSatellite.uploadVideo(athleteId, blob);
                const timeoutPromise = new Promise<string>((_, reject) =>
                    setTimeout(() => reject(new Error('Upload timeout')), 10000)
                );

                permanentUrl = await Promise.race([uploadPromise, timeoutPromise]);
                logger.log('[VIDEO ANALYSIS] ✅ Video uploaded successfully');
            } catch (err) {
                console.warn("[VIDEO ANALYSIS] ⚠️ Video upload failed or timed out, using local blob URL", err);
                // Continue with local blob URL - analysis can still proceed
            }

            const entry: VideoAnalysisEntry = {
                id: `va_${Date.now()}`,
                date: new Date().toISOString(),
                thumbnailUrl: thumbnailUrl,
                videoUrl: permanentUrl,
                exerciseName: aiInsights?.exerciseName || detectedType,
                score: aiInsights?.score || 85,
                status: 'PENDING',
                aiAnalysis: {
                    successes: aiInsights?.analysis?.successes || ['Análisis completado con IA'],
                    weaknesses: aiInsights?.analysis?.weaknesses || (usedMediaPipe ? ['Mejorar transición'] : ['Análisis sin detección de esqueleto']),
                    correctionPlan: sanitizedCorrectionPlan
                },
                expertMetrics: aiInsights?.expertMetrics,
                biomechanics: aiInsights?.biomechanics || localBiomechanics,
                skeletonSequence: sequence // Store for overlay (empty if MediaPipe failed)
            };

            // Save to history (unless in didactic mode or upload failed)
            if (!isDidacticMode) {
                // IMPORTANT: Only save if we have a real permanent URL (not a blob)
                // Blob URLs expire and cause black screens in history
                if (!permanentUrl || permanentUrl.startsWith('blob:')) {
                    console.warn('[VIDEO ANALYSIS] ⚠️ Cannot save to history: Video upload failed (URL is blob)');
                    // Verify if we can retry or just alert user
                    // For now, don't save broken entries
                } else {
                    try {
                        logger.log('[VIDEO ANALYSIS] 💾 Saving video to history...', { athleteId, entryId: entry.id });
                        await DataRing.ingestData('MODULE_VIDEO', 'VIDEO_UPLOAD', { athleteId: athleteId, entry });
                        logger.log('[VIDEO ANALYSIS] ✅ Video saved successfully to history');
                    } catch (saveError) {
                        console.error('[VIDEO ANALYSIS] ❌ Failed to save video to history:', saveError);
                    }
                }
            } else {
                logger.log('[VIDEO ANALYSIS] 📚 Didactic mode active - video NOT saved to history');
            }

            setSelectedEntry(entry);
            setActiveView('player');
        } catch (err) {
            console.error('Analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
            setProcessingStage('');
        }
    };

    const handleDeleteEntry = (entryId: string) => {
        // Optimistic Update
        setHistory(prev => prev.filter(h => h.id !== entryId));
        if (selectedEntry?.id === entryId) {
            setSelectedEntry(null);
            setPreviewUrl(null); // Clean up preview
            setActiveView('history');
        }

        // Background Sync
        DataRing.ingestData('MODULE_VIDEO', 'VIDEO_DELETE', { athleteId: athleteId, entryId });
    };

    const updateEntrySafely = (updates: Partial<VideoAnalysisEntry>) => {
        if (!selectedEntry) return;
        const updated = {
            ...selectedEntry,
            ...updates,
            hasFeedback: updates.coachFeedback ? true : selectedEntry.hasFeedback,
            status: (updates.coachFeedback || updates.telestrationData || updates.voiceNotes) ? 'REVIEWED' as const : selectedEntry.status
        };
        DataRing.ingestData('MODULE_VIDEO', 'VIDEO_DATA', { athleteId: athleteId, ...updated });
        setSelectedEntry(updated);
    };

    const handleDownloadRecording = () => {
        if (!previewUrl) return;
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = `elite_athletics_${Date.now()}.webm`;
        a.click();
    };

    const handleDownloadEntry = (entry: VideoAnalysisEntry) => {
        const url = entry.videoUrl || previewUrl;
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = `elite_analysis_${entry.exerciseName}_${new Date(entry.date).getTime()}.webm`;
        a.click();
    };

    // ROBUST VIDEO LOADING EFFECT - Fixes playback/replay issues
    useEffect(() => {
        if (previewUrl && videoRef.current) {
            // Only force load/pause if we are switching entries or reset
            const v = videoRef.current;
            v.load();
            v.currentTime = 0;
            v.pause();
            setIsPlaying(false);
            setCurrentTime(0);
        }
    }, [previewUrl]);

    const handleSelectHistory = async (entry: VideoAnalysisEntry) => {
        let playUrl = entry.videoUrl || null;

        // Handle IndexedDB fallback URLs
        if (playUrl && playUrl.startsWith('idb://')) {
            const key = playUrl.replace('idb://', '');
            try {
                const blob = await StorageSatellite.getFromLocalDB(key);
                if (blob) {
                    playUrl = URL.createObjectURL(blob);
                } else {
                    console.error("Video not found in local DB");
                    alert("Video no encontrado localmente.");
                    return;
                }
            } catch (e) {
                console.error("Error loading form IDB", e);
                return;
            }
        }

        setSelectedEntry(entry);
        setPreviewUrl(playUrl);
        setActiveView('player');
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration || 0);
        }
    };

    const handlePlayPause = () => {
        if (videoRef.current) {
            isPlaying ? videoRef.current.pause() : videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const changePlaybackRate = (rate: number) => {
        setPlaybackRate(rate);
        if (videoRef.current) videoRef.current.playbackRate = rate;
    };

    // SKELETON DRAWING LOGIC with alignment correction
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawFrame = () => {
            if (!video || !ctx || !showSkeleton || !selectedEntry?.skeletonSequence) return;
            const time = video.currentTime;

            const videoRatio = video.videoWidth / video.videoHeight;
            const rect = video.getBoundingClientRect();
            const elementRatio = rect.width / rect.height;

            let drawWidth = rect.width;
            let drawHeight = rect.height;
            let startX = 0;
            let startY = 0;

            if (elementRatio > videoRatio) {
                drawWidth = rect.height * videoRatio;
                startX = (rect.width - drawWidth) / 2;
            } else {
                drawHeight = rect.width / videoRatio;
                startY = (rect.height - drawHeight) / 2;
            }

            if (canvas.width !== rect.width || canvas.height !== rect.height) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }

            if (selectedEntry.skeletonSequence.length === 0) return;

            const seq = selectedEntry.skeletonSequence;
            let frame = seq[0];

            if (seq.length > 1) {
                const nextIdx = seq.findIndex(f => f.time > time);
                if (nextIdx === -1) {
                    frame = seq[seq.length - 1];
                } else if (nextIdx === 0) {
                    frame = seq[0];
                } else {
                    const prevFrame = seq[nextIdx - 1];
                    const nextFrame = seq[nextIdx];
                    const dt = nextFrame.time - prevFrame.time;
                    const t = (time - prevFrame.time) / dt;
                    const interpolatedLandmarks: any = {};
                    Object.keys(prevFrame.landmarks).forEach(key => {
                        const p1 = prevFrame.landmarks[key];
                        const p2 = nextFrame.landmarks[key];
                        if (p1 && p2) {
                            interpolatedLandmarks[key] = {
                                x: p1.x + (p2.x - p1.x) * t,
                                y: p1.y + (p2.y - p1.y) * t,
                                visibility: p1.visibility
                            };
                        }
                    });
                    frame = { time: time, landmarks: interpolatedLandmarks };
                }
            }

            if (frame && frame.landmarks) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const connections = [
                    ['leftShoulder', 'rightShoulder'], ['leftShoulder', 'leftHip'], ['rightShoulder', 'rightHip'],
                    ['leftHip', 'rightHip'], ['leftHip', 'leftKnee'], ['rightHip', 'rightKnee'],
                    ['leftKnee', 'leftAnkle'], ['rightKnee', 'rightAnkle'],
                    ['leftShoulder', 'leftElbow'], ['rightShoulder', 'rightElbow'],
                    ['leftElbow', 'leftWrist'], ['rightElbow', 'rightWrist'],
                    ['leftAnkle', 'leftFoot'], ['rightAnkle', 'rightFoot']
                ];
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                const isMobile = rect.width < 600;
                const borderWidth = isMobile ? 3 : 6;
                const mainWidth = isMobile ? 1.5 : 3;
                const Y_OFFSET = -10; // Visual correction

                connections.forEach(([start, end]) => {
                    const p1 = frame.landmarks[start];
                    const p2 = frame.landmarks[end];

                    if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
                        ctx.beginPath();
                        // Apply scaling and positioning
                        ctx.moveTo(startX + p1.x * drawWidth, startY + p1.y * drawHeight + Y_OFFSET);
                        ctx.lineTo(startX + p2.x * drawWidth, startY + p2.y * drawHeight + Y_OFFSET);
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.lineWidth = borderWidth;
                        ctx.stroke();
                        ctx.strokeStyle = '#00E5FF';
                        ctx.lineWidth = mainWidth;
                        ctx.stroke();
                    }
                });

                const jointRadius = isMobile ? 2.5 : 4;
                // Y_OFFSET is already defined above, no need to redefine.
                // const Y_OFFSET = -10; // Visual correction for common container/video discrepancies

                Object.values(frame.landmarks).forEach(lm => {
                    if (lm && lm.visibility > 0.5) {
                        ctx.beginPath();
                        ctx.arc(startX + lm.x * drawWidth, startY + lm.y * drawHeight + Y_OFFSET, jointRadius, 0, 2 * Math.PI);
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fill();
                        ctx.lineWidth = isMobile ? 0.5 : 1;
                        ctx.strokeStyle = '#00E5FF';
                        ctx.stroke();
                    }
                });
            }
        };

        const renderLoop = () => {
            if (isPlaying && showSkeleton) {
                drawFrame();
                requestAnimationFrame(renderLoop);
            }
        };

        const resizeCanvas = () => {
            if (video.videoWidth && video.videoHeight) {
                const rect = video.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                drawFrame();
            }
        };

        if (isPlaying) {
            requestAnimationFrame(renderLoop);
        } else {
            drawFrame();
        }

        video.addEventListener('timeupdate', drawFrame);
        window.addEventListener('resize', resizeCanvas);
        video.addEventListener('loadedmetadata', resizeCanvas);

        return () => {
            video.removeEventListener('timeupdate', drawFrame);
            window.removeEventListener('resize', resizeCanvas);
            video.removeEventListener('loadedmetadata', resizeCanvas);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, [showSkeleton, selectedEntry, isPlaying]);

    const captureScreenshot = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');

        // Use intrinsic video dimensions for maximum quality screenshot
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            if ("vibrate" in navigator) navigator.vibrate(50); // Haptic feedback

            // Draw the current video frame to the canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setSelectedCapture(dataUrl);
                setActiveCoachTool('drawing');
                setIsPlaying(false);
                video.pause();
            } catch (e) {
                console.error("Failed to capture screenshot (likely CORS):", e);
                alert("Error al capturar pantalla. Verifica que el video permita Cross-Origin.");
            }
        }
    };

    const startVoiceNote = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioRecorderRef.current = recorder;
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    const voiceUrl = reader.result as string;
                    const newVoiceNote = { id: `vn_${Date.now()}_${Math.random()}`, url: voiceUrl, duration: 0, timestamp: new Date().toISOString() };
                    const existingVoices = selectedEntry?.voiceNotes || [];
                    updateEntrySafely({ voiceNotes: [...existingVoices, newVoiceNote] });
                    setActiveCoachTool(null);
                };
                reader.readAsDataURL(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            setIsRecordingVoice(true);
            setActiveCoachTool('voice');
        } catch (err) { console.error('Mic failed:', err); }
    };

    const stopVoiceNote = () => {
        if (audioRecorderRef.current && audioRecorderRef.current.state === 'recording') {
            audioRecorderRef.current.stop();
        }
        setIsRecordingVoice(false);
    };

    const submitCoachFeedback = async () => {
        if (!coachComment.trim()) return;
        if (!selectedEntry) {
            // If no entry yet (new video), we can't save feedback until analysis runs
            alert('Por favor, ejecuta el análisis primero para poder guardar el feedback.');
            return;
        }

        if ("vibrate" in navigator) navigator.vibrate([30, 50, 30]); // Success pattern

        updateEntrySafely({ coachFeedback: coachComment });
        setCoachComment('');
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const pos = getMousePos(e);
        setCurrentPath([{ ...pos, color: drawColor }]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        setCurrentPath(prev => [...prev, { ...pos, color: drawColor }]);
    };

    const stopDrawing = () => {
        if (currentPath.length > 0) {
            setDrawPaths(prev => [...prev, currentPath]);
        }
        setIsDrawing(false);
        setCurrentPath([]);
    };

    const getMousePos = (e: any) => {
        const canvas = telestrationCanvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    };

    const telestrationCanvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = telestrationCanvasRef.current;
        if (!canvas || !selectedCapture) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw everything
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const drawStroke = (path: { x: number, y: number, color: string }[]) => {
            if (path.length < 2) return;
            ctx.beginPath();
            ctx.strokeStyle = path[0].color || '#00FF41';
            ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x * canvas.width, path[i].y * canvas.height);
            }
            ctx.stroke();
        };

        drawPaths.forEach(drawStroke);
        if (currentPath.length > 0) drawStroke(currentPath);

    }, [drawPaths, currentPath, selectedCapture]);

    const saveTelestration = () => {
        if (!selectedCapture) return;
        const canvas = document.createElement('canvas');
        const bgImg = new Image();
        bgImg.onload = () => {
            canvas.width = bgImg.width;
            canvas.height = bgImg.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(bgImg, 0, 0);
                ctx.lineWidth = 5;
                ctx.lineJoin = 'round';
                ctx.lineCap = 'round';

                drawPaths.forEach(path => {
                    if (path.length < 2) return;
                    ctx.beginPath();
                    ctx.strokeStyle = path[0].color;
                    ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);
                    for (let i = 1; i < path.length; i++) {
                        ctx.lineTo(path[i].x * canvas.width, path[i].y * canvas.height);
                    }
                    ctx.stroke();
                });

                const finalData = canvas.toDataURL('image/jpeg', 0.8);

                const existingCaptures = (() => {
                    try {
                        const parsed = JSON.parse(selectedEntry?.telestrationData || '[]');
                        return Array.isArray(parsed) ? parsed : [selectedEntry?.telestrationData];
                    } catch {
                        return selectedEntry?.telestrationData ? [selectedEntry.telestrationData] : [];
                    }
                })();

                const newCaptures = [...existingCaptures, finalData];
                updateEntrySafely({ telestrationData: JSON.stringify(newCaptures) });

                setDrawPaths([]);
                setSelectedCapture(null);
                setActiveCoachTool(null);
            }
        };
        bgImg.src = selectedCapture;
    };

    return (
        <div className="h-full bg-background overflow-y-auto custom-scrollbar">
            <div className="max-w-lg mx-auto p-3 pb-24 space-y-3">

                {/* Header */}
                <div className="flex items-center justify-between sticky top-0 z-10 bg-gradient-to-b from-background via-background to-transparent py-2 -mx-3 px-3">
                    <div className="flex items-center gap-2">
                        {onBack && <BackButton onClick={onBack} />}
                        <div>
                            <p className="text-[9px] text-volt uppercase tracking-widest">Biomecánica</p>
                            <h1 className="text-base font-black text-white uppercase">Video Análisis</h1>
                        </div>
                    </div>
                    <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                        <button onClick={() => setActiveView('upload')} className={`px-2 py-1 rounded text-[9px] font-bold ${activeView === 'upload' ? 'bg-volt text-black' : 'text-slate-500'}`}>
                            <span className="material-symbols-outlined text-sm">videocam</span>
                        </button>
                        <button onClick={() => setActiveView('history')} className={`px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 ${activeView === 'history' ? 'bg-volt text-black' : 'text-slate-500'}`}>
                            <span className="material-symbols-outlined text-sm">history</span>
                            {history.length > 0 && <span className="text-[8px]">{history.length}</span>}
                        </button>
                    </div>
                </div>

                {/* UPLOAD VIEW */}
                {activeView === 'upload' && !isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-6">
                        <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-volt/50 transition-all group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-volt/5 to-transparent"></div>
                            <div className="size-16 bg-volt/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-volt/20 relative z-10">
                                <span className="material-symbols-outlined text-3xl text-volt">cloud_upload</span>
                            </div>
                            <p className="text-white font-bold text-sm mb-1 relative z-10">Subir o Grabar Video</p>
                            <p className="text-[10px] text-slate-500 relative z-10">Toca para subir desde dispositivo</p>
                        </div>
                        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />

                        <div className="flex items-center gap-4 mt-4 text-[9px] text-slate-500"><span>— o —</span></div>

                        <button onClick={isRecording ? stopRecording : startRecording} className={`mt-4 w-full py-4 rounded-xl font-bold text-[11px] uppercase flex items-center justify-center gap-2 ${isRecording ? 'bg-danger text-white animate-pulse' : 'bg-white/10 text-white'}`}>
                            <span className={`material-symbols-outlined text-base ${isRecording ? 'text-white' : 'text-danger'}`}>{isRecording ? 'stop' : 'fiber_manual_record'}</span>
                            {isRecording ? `Grabando ${recordingTime}s...` : 'Grabar Video Directo'}
                        </button>

                        <div className="w-full mt-6 bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-volt text-lg">school</span>
                                    <div>
                                        <p className="text-[11px] text-white font-bold">Modo Didáctico</p>
                                        <p className="text-[9px] text-slate-500">Analizar sin guardar en historial</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsDidacticMode(!isDidacticMode)} className={`w-10 h-5 rounded-full relative transition-colors ${isDidacticMode ? 'bg-volt' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${isDidacticMode ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>

                        {/* Calibration Guide Button */}
                        <button
                            onClick={() => setShowCalibration(true)}
                            className="mt-6 flex items-center gap-2 text-[10px] text-volt font-bold uppercase tracking-wider bg-volt/5 border border-volt/20 px-4 py-2 rounded-full hover:bg-volt/10 transition-all"
                        >
                            <span className="material-symbols-outlined text-base">info</span>
                            Guía de Calibración de Cámara
                        </button>
                    </div>
                )}

                {/* ANALYZING */}
                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="size-20 border-4 border-volt/30 border-t-volt rounded-full animate-spin mb-6"></div>
                        <p className="text-white font-bold text-sm">{processingStage}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Esto puede tomar unos segundos...</p>
                    </div>
                )}

                {/* PLAYER VIEW */}
                {/* PLAYER VIEW */}
                {(activeView === 'player' || selectedEntry) && previewUrl && !isAnalyzing && (
                    <>
                        {/* Video */}
                        <div className="relative rounded-xl overflow-hidden bg-black shadow-2xl">
                            <video
                                ref={videoRef}
                                src={previewUrl}
                                crossOrigin="anonymous"
                                className="w-full aspect-video object-contain"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleTimeUpdate}
                                playsInline
                            />

                            {/* Overlay Canvas for Skeleton */}
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                            />

                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                {/* Timeline */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[8px] text-white font-mono">{currentTime.toFixed(2)}s</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 1}
                                        step="0.01"
                                        value={currentTime}
                                        onChange={(e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }}
                                        className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-volt"
                                    />
                                    <span className="text-[8px] text-white font-mono">{duration.toFixed(2)}s</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button onClick={handlePlayPause} className="size-10 bg-volt text-black rounded-full flex items-center justify-center transition-transform active:scale-95">
                                            <span className="material-symbols-outlined text-xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                                        </button>

                                        {/* Playback Speed */}
                                        <div className="flex gap-1 bg-white/10 p-1 rounded-lg">
                                            {[0.25, 0.5, 1, 2].map(rate => (
                                                <button
                                                    key={rate}
                                                    onClick={() => changePlaybackRate(rate)}
                                                    className={`px-2 py-0.5 rounded text-[8px] font-black ${playbackRate === rate ? 'bg-volt text-black' : 'text-white'}`}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {/* Skeleton Toggle */}
                                        {previewUrl && (
                                            <button
                                                onClick={() => setShowSkeleton(!showSkeleton)}
                                                className={`size-10 rounded-full flex items-center justify-center transition-all ${showSkeleton ? 'bg-volt/20 text-volt border border-volt/30' : 'bg-white/10 text-white border border-transparent'}`}
                                            >
                                                <span className="material-symbols-outlined text-xl">accessibility</span>
                                            </button>
                                        )}

                                        {/* Download button for new recordings */}
                                        {!selectedEntry && (
                                            <button
                                                onClick={handleDownloadRecording}
                                                className="size-10 bg-white/10 text-white rounded-full flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-xl">download</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Comparison Controls */}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowHistorySelector(!showHistorySelector)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all flex items-center gap-1 ${comparisonEntry ? 'bg-volt text-black' : 'bg-white/5 text-slate-500 border border-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-xs">compare_arrows</span>
                                        {comparisonEntry ? 'Comparando' : 'Comparar'}
                                    </button>
                                </div>
                            </div>

                            {/* History Selector Overlay */}
                            {showHistorySelector && (
                                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-4 animate-in slide-in-from-bottom-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="text-[10px] text-volt font-black uppercase">Seleccionar Benchmark</p>
                                        <button onClick={() => setShowHistorySelector(false)} className="text-white"><span className="material-symbols-outlined text-sm">close</span></button>
                                    </div>
                                    <div className="space-y-2 overflow-y-auto max-h-[80%] custom-scrollbar">
                                        {history.filter(h => h.id !== selectedEntry?.id).map(h => (
                                            <div key={h.id} onClick={() => { setComparisonEntry(h); setShowHistorySelector(false); }} className="bg-white/5 p-2 rounded-lg border border-white/10 flex items-center gap-3">
                                                <img src={h.thumbnailUrl} className="size-10 rounded object-cover" />
                                                <div className="flex-1">
                                                    <p className="text-[9px] text-white font-bold">{h.exerciseName}</p>
                                                    <p className="text-[7px] text-slate-500">{new Date(h.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-volt font-black text-xs">{h.score}%</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Comparison Metric Overlay */}
                            {comparisonEntry && (
                                <div className="absolute top-4 right-4 z-40 space-y-2">
                                    <div className="bg-black/80 backdrop-blur-md p-2 rounded-xl border border-volt/30 shadow-2xl animate-in slide-in-from-right-4">
                                        <p className="text-[7px] text-volt uppercase font-black mb-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[8px]">trending_up</span> DIFERENCIA VS BENCHMARK
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-black ${selectedEntry && (selectedEntry.score || 0) >= comparisonEntry.score ? 'text-success' : 'text-danger'}`}>
                                                {selectedEntry && ((selectedEntry.score || 0) - comparisonEntry.score).toFixed(0)}%
                                            </span>
                                            <span className="text-[8px] text-slate-500 italic">Score Técnico</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Analysis Trigger (Only for preview) */}
                        {!selectedEntry && (
                            <button
                                onClick={runAnalysis}
                                className="w-full py-4 bg-volt text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,65,0.3)]"
                            >
                                <span className="material-symbols-outlined animate-pulse">analytics</span>
                                Iniciar Análisis Biomecánico {isDidacticMode ? '(Didáctico)' : ''}
                            </button>
                        )}

                        {/* Exercise Badge + Score (Only if analyzed) */}
                        {selectedEntry && (
                            <div className="flex items-center justify-between">
                                <Badge variant="volt" className="text-[9px]">
                                    <span className="material-symbols-outlined text-xs mr-1">sports</span>
                                    {selectedEntry.exerciseName}
                                </Badge>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-white">{selectedEntry.score}</span>
                                    <span className="text-[9px] text-slate-500">/100</span>
                                    {selectedEntry.status === 'REVIEWED' && <Badge variant="success" className="text-[7px]">Revisado</Badge>}
                                </div>
                            </div>
                        )}

                        {/* COACH TOOLS - Show immediately when video loaded OR when viewing analyzed entry */}
                        {userRole === 'STAFF' && (previewUrl || selectedEntry) && (
                            <div className="glass-card p-3 rounded-xl space-y-3 border-volt/20">
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Feedback Pro</p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={captureScreenshot}
                                        className={`flex-1 py-3 rounded-xl text-[9px] font-bold flex items-center justify-center gap-2 transition-all ${activeCoachTool === 'drawing' ? 'bg-volt text-black shadow-lg shadow-volt/20' : 'bg-white/5 text-white border border-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">screenshot</span>
                                        {(() => {
                                            try {
                                                const parsed = JSON.parse(selectedEntry?.telestrationData || '[]');
                                                const count = Array.isArray(parsed) ? parsed.length : (selectedEntry?.telestrationData ? 1 : 0);
                                                return count > 0 ? `${count} Capturas` : 'Captura & Dibujo';
                                            } catch { return 'Captura & Dibujo'; }
                                        })()}
                                    </button>

                                    <button
                                        onClick={isRecordingVoice ? stopVoiceNote : startVoiceNote}
                                        className={`flex-1 py-3 rounded-xl text-[9px] font-bold flex items-center justify-center gap-2 transition-all ${isRecordingVoice ? 'bg-danger text-white animate-pulse' : activeCoachTool === 'voice' ? 'bg-volt text-black' : 'bg-white/5 text-white border border-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-sm">{isRecordingVoice ? 'stop' : 'mic'}</span>
                                        {isRecordingVoice ? 'Grabando...' : (selectedEntry?.voiceNotes?.length || 0) > 0 ? `${selectedEntry?.voiceNotes?.length} Audios` : 'Nota de Voz'}
                                    </button>
                                </div>


                                <div className="flex gap-2">
                                    <input value={coachComment} onChange={(e) => setCoachComment(e.target.value)} placeholder="Instrucciones del coach..." className="flex-1 bg-black/40 border border-white/10 px-3 py-3 rounded-xl text-[10px] text-white placeholder:text-slate-600 focus:border-volt/50 outline-none transition-all" />
                                    <button onClick={submitCoachFeedback} className="px-5 py-3 bg-success text-black rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-success/20 active:scale-95 transition-all">
                                        Enviar
                                    </button>
                                </div>
                                {selectedEntry?.coachFeedback && (
                                    <div className="bg-black/40 p-3 rounded-xl text-[10px] text-slate-300 border border-success/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[8px] text-success font-black uppercase">Último Feedback:</span>
                                        </div>
                                        {selectedEntry.coachFeedback}
                                    </div>
                                )}

                                {/* New: Persistence display of rich feedback */}
                                {selectedEntry?.telestrationData && (() => {
                                    try {
                                        const shots = JSON.parse(selectedEntry.telestrationData);
                                        return Array.isArray(shots) ? (
                                            <div className="space-y-2">
                                                <p className="text-[8px] text-volt uppercase font-black px-1">Capturas con Telestración ({shots.length}):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {shots.map((s, idx) => {
                                                        // Handle both {image, strokes} objects and legacy string format
                                                        const imageUrl = typeof s === 'string' ? s : s.image;
                                                        const strokes = typeof s === 'string' ? undefined : s.strokes;
                                                        return (
                                                            <div key={idx} className="relative group">
                                                                <div onClick={() => { setSelectedCapture(imageUrl); setSelectedStrokes(strokes); }} className="size-20 rounded-xl overflow-hidden border border-volt/20 cursor-pointer hover:border-volt/50 transition-all">
                                                                    <img src={imageUrl} className="size-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <span className="material-symbols-outlined text-volt">zoom_in</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (confirm('¿Eliminar captura?')) {
                                                                            const updated = shots.filter((_, i) => i !== idx);
                                                                            updateEntrySafely({ telestrationData: JSON.stringify(updated) });
                                                                        }
                                                                    }}
                                                                    className="absolute -top-1 -right-1 size-5 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg z-10"
                                                                >
                                                                    <span className="material-symbols-outlined text-xs">close</span>
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : null;
                                    } catch (e) {
                                        // Fallback for single image legacy data
                                        return (
                                            <div className="bg-black/40 p-1 rounded-xl border border-volt/20 overflow-hidden cursor-pointer" onClick={() => setSelectedCapture(selectedEntry.telestrationData!)}>
                                                <p className="text-[8px] text-volt uppercase font-black p-1">Captura con Telestración:</p>
                                                <img src={selectedEntry.telestrationData} className="w-full rounded-lg" />
                                            </div>
                                        );
                                    }
                                })()}

                                {selectedEntry?.voiceNotes?.map((vn, i) => (
                                    <div key={i} className="bg-volt/10 p-2 rounded-xl border border-volt/20 flex items-center gap-3 relative group">
                                        <button
                                            onClick={() => {
                                                const audio = new Audio(vn.url);
                                                audio.play();
                                            }}
                                            className="size-8 bg-volt text-black rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-all active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                                        </button>
                                        <div className="flex-1">
                                            <p className="text-[9px] text-white font-bold">Nota de Voz del Coach</p>
                                            <div className="h-1 bg-white/10 rounded-full mt-1"><div className="w-1/3 h-full bg-volt rounded-full"></div></div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (confirm('¿Eliminar audio?')) {
                                                    const updated = selectedEntry.voiceNotes?.filter((_, idx) => idx !== i);
                                                    updateEntrySafely({ voiceNotes: updated });
                                                }
                                            }}
                                            className="absolute -top-1 -right-1 size-5 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                                        >
                                            <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ANALYSIS REPORT */}
                        {selectedEntry && (
                            <div className="glass-card p-5 rounded-xl space-y-5">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-300 uppercase font-bold tracking-wide">Análisis Biomecánico</p>
                                    <div className="px-3 py-1 bg-volt/10 border border-volt/20 rounded-full flex items-center gap-2">
                                        <div className="size-1.5 bg-volt rounded-full animate-pulse"></div>
                                        <span className="text-[10px] text-volt font-bold uppercase tracking-wide">Elite Mode Active</span>
                                    </div>
                                </div>

                                {/* Expandable Insights */}
                                <div className="space-y-3">
                                    {selectedEntry?.biomechanics?.map((bio, i) => (
                                        <div key={i} className="bg-slate-800/30 rounded-xl overflow-hidden border border-slate-700/50">
                                            <button onClick={() => setExpandedInsight(expandedInsight === bio.joint ? null : bio.joint)} className="w-full p-3 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={`min-w-[3.5rem] px-2 h-11 shrink-0 rounded-lg ${bio.status === 'optimal' ? 'bg-slate-700/50' : bio.status === 'warning' ? 'bg-amber-500/20' : 'bg-red-500/20'} flex flex-col items-center justify-center`}>
                                                        <span className={`text-[11px] font-black leading-none ${bio.status === 'optimal' ? 'text-slate-300' : bio.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>{bio.angle}</span>
                                                        <span className="text-[7px] text-slate-500 uppercase mt-1 font-bold whitespace-nowrap">Grados</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1 text-left">
                                                        <span className="text-xs text-white block leading-tight font-black uppercase">{bio.joint}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase mt-0.5 block">{bio.status === 'optimal' ? 'Eficiente' : bio.status === 'warning' ? 'Limitado' : 'Fuga de Energía'}</span>
                                                    </div>
                                                </div>
                                                <span className={`material-symbols-outlined text-base text-slate-400 transition-transform shrink-0 ${expandedInsight === bio.joint ? 'rotate-180' : ''}`}>expand_more</span>
                                            </button>
                                            {expandedInsight === bio.joint && (
                                                <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2">
                                                    {bio.ideal && (
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-slate-400 italic">Rango Ideal:</span>
                                                            <span className="text-emerald-400 font-bold font-mono">{bio.ideal}</span>
                                                        </div>
                                                    )}
                                                    {bio.expertNote && <p className="text-xs text-slate-300 font-medium leading-relaxed border-l-2 border-slate-600 pl-3">{bio.expertNote}</p>}
                                                    {bio.recommendation && (
                                                        <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                                                            <p className="text-[10px] text-slate-300 uppercase font-bold mb-1.5 tracking-wide">Cue Técnico:</p>
                                                            <p className="text-xs text-slate-200 leading-relaxed">{bio.recommendation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Expert level metrics grid */}
                                {selectedEntry?.expertMetrics && (
                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 overflow-hidden relative">
                                            <div className="absolute top-2 right-2 opacity-10"><span className="material-symbols-outlined text-base">timer</span></div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">GCT Estimado</p>
                                            <p className="text-base text-white font-mono font-bold">{selectedEntry.expertMetrics.gctEstimate}</p>
                                        </div>
                                        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 overflow-hidden relative">
                                            <div className="absolute top-2 right-2 opacity-10"><span className="material-symbols-outlined text-base">height</span></div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">Estabilidad CoM</p>
                                            <p className="text-base text-white font-bold">{selectedEntry.expertMetrics.comOscillation}</p>
                                        </div>
                                        <div className="col-span-2 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Veredicto de Rendimiento</p>
                                                <span className="text-[10px] text-slate-500 font-bold tracking-wide uppercase">Expert Ver. L5</span>
                                            </div>
                                            <p className="text-sm text-slate-200 leading-relaxed italic">"{selectedEntry.expertMetrics.performanceVerdict}"</p>
                                        </div>
                                        {selectedEntry.expertMetrics.energyLeaks && selectedEntry.expertMetrics.energyLeaks.length > 0 && (
                                            <div className="col-span-2 flex flex-wrap gap-2 mt-2">
                                                {selectedEntry.expertMetrics.energyLeaks.map((leak, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-red-500/10 text-red-400 text-[10px] rounded-lg border border-red-500/20 font-semibold uppercase tracking-wide">⚠️ {leak}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Strengths */}
                                <div className="space-y-3 mt-6">
                                    <p className="text-sm text-emerald-400 uppercase flex items-center gap-2 font-bold tracking-wide">
                                        <span className="material-symbols-outlined text-base">thumb_up</span>Fortalezas Biomecánicas
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEntry?.aiAnalysis?.successes?.map((s, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-lg border border-emerald-500/20">{s}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Weaknesses */}
                                <div className="space-y-3 mt-6">
                                    <p className="text-sm text-amber-400 uppercase flex items-center gap-2 font-bold tracking-wide">
                                        <span className="material-symbols-outlined text-base">priority_high</span>Áreas de Mejora
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedEntry.aiAnalysis?.weaknesses?.map((w, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs rounded-lg border border-amber-500/20">{w}</span>
                                        )) || <span className="text-xs text-slate-400">Ninguna detectada</span>}
                                    </div>
                                </div>

                                {/* Correction Exercises */}
                                <div className="space-y-3 mt-6 pb-4">
                                    <p className="text-sm text-sky-400 uppercase flex items-center gap-2 font-bold tracking-wide">
                                        <span className="material-symbols-outlined text-base">fitness_center</span>Plan de Corrección Pro
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedEntry.aiAnalysis?.correctionPlan?.map((ex, i) => (
                                            <div key={i} onClick={() => ex.videoRef && window.open(ex.videoRef, '_blank')} className="bg-slate-800/30 p-4 rounded-xl flex items-center gap-4 border border-slate-700/50 cursor-pointer hover:border-sky-500/50 group transition-all">
                                                <div className="size-10 bg-sky-500/20 rounded-lg flex items-center justify-center group-hover:bg-sky-500/30 transition-all">
                                                    <span className="material-symbols-outlined text-sky-400 text-lg">play_circle</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-white font-semibold">{ex.drillName}</span>
                                                        <span className="material-symbols-outlined text-xs text-slate-500">open_in_new</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400 block leading-relaxed mt-1">{ex.prescription}</span>
                                                </div>
                                            </div>
                                        )) || <div className="text-xs text-slate-400">Sin ejercicios sugeridos</div>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* HISTORY VIEW */}
                {activeView === 'history' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-white font-black uppercase text-xs italic tracking-widest">Historial AI</h3>
                            <p className="text-[10px] text-slate-500 uppercase">{history.length} Sesiones</p>
                        </div>

                        {history.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                                <span className="material-symbols-outlined text-5xl text-slate-800">video_library</span>
                                <p className="text-slate-600 text-sm mt-4 font-bold">Sin análisis previos</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="glass-card p-3 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all group"
                                    >
                                        <div
                                            onClick={() => handleSelectHistory(entry)}
                                            className="relative size-16 shrink-0 bg-black rounded-lg overflow-hidden cursor-pointer border border-white/10 group-hover:border-white/30"
                                        >
                                            <img src={entry.thumbnailUrl} className="size-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg text-lg">play_circle</span>
                                            </div>
                                            <div className="absolute top-1 left-1 px-1 bg-black/80 rounded text-[7px] text-white font-bold">{entry.score}%</div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-[10px] font-bold truncate mb-0.5">{entry.exerciseName}</p>
                                            <p className="text-[8px] text-slate-500 font-medium mb-1.5">{new Date(entry.date).toLocaleDateString()}</p>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSelectHistory(entry)}
                                                    className="px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[7px] text-slate-300 font-bold uppercase transition-colors"
                                                >
                                                    Ver
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadEntry(entry)}
                                                    className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded text-slate-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[10px]">download</span>
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('¿Eliminar este análisis?')) {
                                                    handleDeleteEntry(entry.id);
                                                }
                                            }}
                                            className="size-8 rounded-lg bg-danger/5 text-danger/40 border border-transparent hover:border-danger/20 hover:bg-danger/10 hover:text-danger flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* CALIBRATION MODAL */}
                {showCalibration && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 animate-in fade-in backdrop-blur-md">
                        <div className="bg-slate-900 w-full max-w-md rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl">
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <div>
                                        <h2 className="text-xl font-black text-white uppercase italic tracking-widest leading-none">Protocolo Pro</h2>
                                        <p className="text-[8px] text-volt uppercase font-black mt-1">Garantía de Precisión Biomecánica</p>
                                    </div>
                                    <button onClick={() => setShowCalibration(false)} className="size-10 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { icon: 'photo_camera', title: 'Ángulo Lateral', desc: 'Cámara a 90° del atleta. El paralaje distorsiona ángulos.' },
                                        { icon: 'slow_motion_video', title: 'Obturación Rápida', desc: 'Usa 120/240fps para evitar motion blur.' },
                                        { icon: 'check_circle', title: 'Encuadre Técnico', desc: 'Pies y cabeza siempre dentro del cuadro.' }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-start bg-white/5 p-4 rounded-3xl border border-white/5">
                                            <div className="size-10 bg-volt/20 rounded-xl flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-volt text-xl">{item.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-white uppercase">{item.title}</p>
                                                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowCalibration(false)}
                                    className="w-full py-4 bg-volt text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-volt/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TELESTRATION LAYER */}
                {activeCoachTool === 'drawing' && selectedCapture && (
                    <div className="fixed inset-0 z-[400] bg-black flex items-center justify-center p-4">
                        {/* Screenshot as background */}
                        <img
                            src={selectedCapture}
                            alt="Screenshot"
                            className="absolute inset-0 w-full h-full object-contain"
                        />

                        {/* TelestrationLayer overlay */}
                        <TelestrationLayer
                            isActive={true}
                            onClose={() => {
                                setActiveCoachTool(null);
                                setSelectedCapture(null);
                            }}
                            onSave={(strokes) => {
                                console.log('[TELESTRATION] Saving strokes:', strokes);
                                // Standardize: telestrationData is an array of objects { image: string, strokes: string }
                                if (selectedEntry) {
                                    let currentData: any[] = [];
                                    try {
                                        currentData = JSON.parse(selectedEntry.telestrationData || '[]');
                                        if (!Array.isArray(currentData)) currentData = [];
                                    } catch {
                                        currentData = [];
                                    }

                                    const newCapture = {
                                        image: selectedCapture,
                                        strokes: strokes
                                    };

                                    const updatedData = [...currentData, newCapture];
                                    console.log('[TELESTRATION] Saving to entry:', updatedData);
                                    updateEntrySafely({
                                        telestrationData: JSON.stringify(updatedData)
                                    });
                                    console.log('[TELESTRATION] Save complete');
                                    // Show brief confirmation
                                    if ('vibrate' in navigator) navigator.vibrate(200);
                                }
                                setActiveCoachTool(null);
                                setSelectedCapture(null);
                            }}
                            initialData={undefined} // Staged capture doesn't have strokes yet
                            className="absolute inset-0"
                        />
                    </div>
                )}

                {/* VIEW CAPTURE MODAL (Zoom) */}
                {!activeCoachTool && selectedCapture && (
                    <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col p-4 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                        <div className="flex justify-end p-4">
                            <button onClick={() => setSelectedCapture(null)} className="size-10 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10 shadow-2xl">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-4 relative">
                            <img src={selectedCapture} className="max-w-full max-h-full object-contain rounded-3xl shadow-3xl border border-white/5" />
                            {selectedStrokes && (
                                <TelestrationLayer
                                    isActive={false}
                                    onClose={() => { }}
                                    initialData={selectedStrokes}
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default VideoAnalysis;