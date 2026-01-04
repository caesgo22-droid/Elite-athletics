
/**
 * VISION SATELLITE (EDGE AI LAYER)
 * 
 * Responsabilidad: Procesamiento de imágenes en el dispositivo (Client-Side).
 * Objetivo: Extraer esqueletos y ángulos (Pose Landmarks) sin latencia de red.
 * Tecnología Subyacente: Google MediaPipe Pose (Simulado aquí para la arquitectura).
 * 
 * Ventaja: Reduce costos de API y da feedback instantáneo.
 */

// Import MediaPipe
import { Pose, Results } from '@mediapipe/pose';
import { ISatellite } from './ISatellite';

export interface PoseLandmark {
    x: number;
    y: number;
    z?: number;
    visibility?: number;
}

export interface BiomechanicalFrame {
    timestamp: number;
    landmarks: Record<string, PoseLandmark>;
    derivedAngles: {
        kneeFlexion: number;
        hipExtension: number;
        trunkAngle: number;
        shinAngle: number;
    };
    expertMarkers: {
        comHeight: number; // Y-coordinate of hips
        footHeight: number; // Y-coordinate of support foot
        verticalStability: number;
    };
    thumbnail?: string;
    rawResults?: Results;
}

class VisionSatelliteService implements ISatellite {
    readonly name = "Vision Satellite";
    private pose: Pose | null = null;
    private isReady: boolean = false;

    constructor() {
        this.initialize();
    }

    async initialize() {
        await this.initializeMediaPipe();
    }

    async healthCheck(): Promise<boolean> {
        return this.isReady && !!this.pose;
    }

    private async initializeMediaPipe() {
        if (typeof window === 'undefined') return;
        console.log("[VISION SATELLITE] ⚙️ Initializing MediaPipe Pose...");

        try {
            // Triple-safe detection of Pose constructor
            let poseCtor: any = Pose;

            // 1. Check for ES Module default export with full safety
            if (poseCtor && typeof poseCtor !== 'function' && (poseCtor as any).default) {
                poseCtor = (poseCtor as any).default;
            }

            // 2. Check for global window object (fallback for CDN/Bundler)
            if (!poseCtor || typeof poseCtor !== 'function') {
                poseCtor = (window as any).Pose;
            }

            // 3. Final instantiation with guard
            if (typeof poseCtor === 'function') {
                this.pose = new poseCtor({
                    locateFile: (file: string) => {
                        // Use official Google CDN which has all required WASM and data files
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                    }
                });
            } else {
                throw new Error("[VISION SATELLITE] Pose constructor not found.");
            }
        } catch (err) {
            console.error("[VISION SATELLITE] ❌ Critical failure initializing Pose:", err);
            this.isReady = false;
            return;
        }

        if (!this.pose) {
            console.error("[VISION SATELLITE] ❌ Could not initialize Pose constructor.");
            this.isReady = false;
            return;
        }

        try {
            this.pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            await this.pose.initialize();
            this.isReady = true;
            console.log("[VISION SATELLITE] ✅ MediaPipe Pose Ready.");
        } catch (err) {
            console.error("[VISION SATELLITE] ❌ Failed to initialize MediaPipe:", err);
            this.isReady = false;
        }
    }

    private calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) angle = 360.0 - angle;
        return Math.round(angle);
    }

    private calculateVerticalAngle(p1: PoseLandmark, p2: PoseLandmark): number {
        const radians = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        const deviation = Math.abs(Math.abs(angle) - 90);
        return Math.round(deviation);
    }

    private async downscaleBase64(base64: string, maxWidth: number = 400): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = maxWidth / img.width;
                if (scale >= 1) return resolve(base64);
                canvas.width = maxWidth;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => resolve(base64);
        });
    }

    /**
     * Extracts a frame from a video URL (base64 or blob)
     */
    public async extractFrameFromVideo(videoUrl: string): Promise<string> {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.preload = 'auto';
            video.muted = true;
            video.playsInline = true;

            const cleanup = () => {
                video.onloadeddata = null;
                video.onseeked = null;
                video.onerror = null;
            };

            video.onloadeddata = () => {
                const seekTime = Math.min(video.duration * 0.1, 1.0) || 0.1;
                video.currentTime = seekTime;
            };

            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const frame = canvas.toDataURL('image/jpeg', 0.8);
                cleanup();
                resolve(frame);
            };

            video.onerror = () => {
                console.error("[VISION SATELLITE] ❌ Frame extraction failed.");
                cleanup();
                resolve("");
            };
        });
    }

    private async isBlobVideo(url: string): Promise<boolean> {
        try {
            const resp = await fetch(url);
            const blob = await resp.blob();
            return blob.type.startsWith('video/');
        } catch {
            return false;
        }
    }

    /**
     * Extracts and processes multiple frames from a video for dynamic tracking
     */
    public async processVideoSequence(videoUrl: string, frameCount: number = 8): Promise<{ time: number, landmarks: Record<string, PoseLandmark>, image: string }[]> {
        if (!this.pose) await this.initializeMediaPipe();

        const video = document.createElement('video');
        video.src = videoUrl;
        video.muted = true;
        video.playsInline = true;

        await new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(true);
        });

        const duration = video.duration;
        const sequence: { time: number, landmarks: Record<string, PoseLandmark>, image: string }[] = [];
        const interval = duration / frameCount;

        for (let i = 0; i < frameCount; i++) {
            const time = Math.min(i * interval + (interval * 0.1), duration - 0.1);
            video.currentTime = time;

            await new Promise((resolve) => {
                video.onseeked = () => resolve(true);
            });

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameBase64 = canvas.toDataURL('image/jpeg', 0.5);

            const results = await new Promise<Results>((resolve) => {
                this.pose!.onResults((res) => resolve(res));
                this.pose!.send({ image: canvas });
            });

            const landmarks: Record<string, PoseLandmark> = {};
            if (results.poseLandmarks) {
                const l = results.poseLandmarks;
                landmarks.nose = l[0];
                landmarks.leftShoulder = l[11]; landmarks.rightShoulder = l[12];
                landmarks.leftElbow = l[13]; landmarks.rightElbow = l[14];
                landmarks.leftWrist = l[15]; landmarks.rightWrist = l[16];
                landmarks.leftHip = l[23]; landmarks.rightHip = l[24];
                landmarks.leftKnee = l[25]; landmarks.rightKnee = l[26];
                landmarks.leftAnkle = l[27]; landmarks.rightAnkle = l[28];
                landmarks.leftFoot = l[31]; landmarks.rightFoot = l[32];
            }

            sequence.push({
                time: time,
                landmarks: landmarks,
                image: frameBase64
            });
        }

        return sequence;
    }

    public async processFrameLocal(inputUrl: string): Promise<BiomechanicalFrame> {
        // Ensure MediaPipe is initialized
        if (!this.isReady || !this.pose) {
            console.warn("[VISION SATELLITE] ⚠️ MediaPipe not ready, initializing...");
            await this.initializeMediaPipe();

            // If still not ready after initialization, throw error
            if (!this.isReady || !this.pose) {
                throw new Error("[VISION SATELLITE] MediaPipe failed to initialize. Cannot process frame.");
            }
        }

        let imageUrl = inputUrl;

        // Detect if it's a video (Blob URL or data header)
        const isVideo = inputUrl.startsWith('data:video') ||
            (inputUrl.startsWith('blob:') && await this.isBlobVideo(inputUrl));

        if (isVideo) {
            console.log("[VISION SATELLITE] 🎥 Video detected, extracting frame...");
            imageUrl = await this.extractFrameFromVideo(inputUrl);
            if (!imageUrl) throw new Error("Could not extract frame from video");
        }

        if (!this.pose) await this.initializeMediaPipe();

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = imageUrl;
            img.onload = async () => {
                this.pose!.onResults((results: Results) => {
                    const l = results.poseLandmarks;
                    if (!l || l.length === 0) {
                        return reject(new Error("POSE_NOT_DETECTED: No se detectó un cuerpo válido en la imagen."));
                    }

                    // Check visibility/confidence of core landmarks (hips, knees)
                    const coreLandmarks = [11, 12, 23, 24, 25, 26]; // shoulders, hips, knees
                    const averageVisibility = coreLandmarks.reduce((acc, idx) => acc + (l[idx]?.visibility || 0), 0) / coreLandmarks.length;

                    if (averageVisibility < 0.60) {
                        return reject(new Error("POCA PRECISIÓN: El cuerpo no es plenamente visible. Asegúrate de encuadrar al atleta completo."));
                    }

                    // Full landmarks for UI rendering
                    const landmarks: Record<string, PoseLandmark> = {
                        nose: l[0],
                        leftShoulder: l[11], rightShoulder: l[12],
                        leftElbow: l[13], rightElbow: l[14],
                        leftWrist: l[15], rightWrist: l[16],
                        leftHip: l[23], rightHip: l[24],
                        leftKnee: l[25], rightKnee: l[26],
                        leftAnkle: l[27], rightAnkle: l[28],
                        leftFoot: l[31], rightFoot: l[32]
                    };

                    const frameData: BiomechanicalFrame = {
                        timestamp: Date.now(),
                        landmarks: landmarks,
                        derivedAngles: {
                            kneeFlexion: landmarks.leftKnee && landmarks.leftHip && landmarks.leftAnkle ? this.calculateAngle(landmarks.leftHip, landmarks.leftKnee, landmarks.leftAnkle) : 0,
                            hipExtension: landmarks.leftShoulder && landmarks.leftHip && landmarks.leftKnee ? this.calculateAngle(landmarks.leftShoulder, landmarks.leftHip, landmarks.leftKnee) : 0,
                            trunkAngle: landmarks.leftShoulder && landmarks.leftHip ? this.calculateVerticalAngle(landmarks.leftHip, landmarks.leftShoulder) : 0,
                            shinAngle: landmarks.leftAnkle && landmarks.leftKnee ? this.calculateVerticalAngle(landmarks.leftAnkle, landmarks.leftKnee) : 0
                        },
                        expertMarkers: {
                            comHeight: landmarks.leftHip && landmarks.rightHip ? (landmarks.leftHip.y + landmarks.rightHip.y) / 2 : 0,
                            footHeight: Math.min(landmarks.leftFoot?.y || 1, landmarks.rightFoot?.y || 1),
                            verticalStability: landmarks.nose ? landmarks.nose.y : 0
                        },
                        rawResults: results
                    };

                    this.downscaleBase64(imageUrl).then(thumb => {
                        frameData.thumbnail = thumb;
                        resolve(frameData);
                    });
                });

                await this.pose!.send({ image: img });
            };
            img.onerror = (e) => {
                console.error("[VISION SATELLITE] ❌ Image loading failed", e);
                reject(e);
            };
        });
    }

    public prepareHybridPayload(mainImage: string, data: BiomechanicalFrame, sequence?: { time: number, landmarks: Record<string, PoseLandmark>, image: string }[]) {
        const sequenceData = sequence ? sequence.map(s => `[T=${s.time.toFixed(2)}s]: ${Object.keys(s.landmarks).length > 0 ? 'Pose OK' : 'Pose Failed'}`).join('\n') : "No sequence data";

        return {
            image: data.thumbnail || mainImage,
            images: sequence ? sequence.map(s => s.image) : undefined,
            contextData: `
            [DATOS BIOMECÁNICOS REALES - MEDIAPIPE]
            - Flexion Rodilla: ${data.derivedAngles.kneeFlexion}°
            - Extension Cadera: ${data.derivedAngles.hipExtension}°
            - Inclinacion Tronco: ${data.derivedAngles.trunkAngle}°
            - Angulo Tibia: ${data.derivedAngles.shinAngle}°
            
            [DEEP BIOMECHANICS]:
            - H-CoM (Normalizado): ${data.expertMarkers.comHeight.toFixed(4)}
            - Soporte Foot-Z: ${data.expertMarkers.footHeight.toFixed(4)}
            - Oscilación Vertical: ${data.expertMarkers.verticalStability.toFixed(4)}

            [SECUENCIA TEMPORAL]:
            ${sequenceData}
            `
        };
    }
}

export const VisionSatellite = new VisionSatelliteService();
