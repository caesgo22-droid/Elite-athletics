import React from 'react';

interface VideoControlsProps {
    isPlaying: boolean;
    playbackRate: number;
    currentTime: number;
    duration: number;
    onPlayPause: () => void;
    onSeek: (time: number) => void;
    onPlaybackRateChange: (rate: number) => void;
    onFrameStep: (direction: 'forward' | 'backward') => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
    isPlaying,
    playbackRate,
    currentTime,
    duration,
    onPlayPause,
    onSeek,
    onPlaybackRateChange,
    onFrameStep
}) => {

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div className="glass-card bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-2 md:p-3 flex flex-col gap-2 shadow-2xl">

            {/* Timeline Scrubber */}
            <div className="flex items-center gap-3 px-1">
                <span className="text-[9px] md:text-[10px] font-mono font-black text-primary tabular-nums tracking-widest">
                    {formatTime(currentTime)}
                </span>

                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.01"
                    value={currentTime}
                    onChange={(e) => onSeek(parseFloat(e.target.value))}
                    className="flex-1 h-1 md:h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:md:size-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-glow transition-all hover:bg-white/30"
                />

                <span className="text-[9px] md:text-[10px] font-mono font-black text-slate-500 tabular-nums tracking-widest">
                    {formatTime(duration)}
                </span>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between">

                {/* Speed Controls */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                    {[0.25, 0.5, 1.0].map((rate) => (
                        <button
                            key={rate}
                            onClick={() => onPlaybackRateChange(rate)}
                            className={`px-2 py-1 rounded text-[8px] md:text-[9px] font-black w-8 md:w-10 transition-all ${playbackRate === rate ? 'bg-primary text-black shadow-glow' : 'text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {rate}x
                        </button>
                    ))}
                </div>

                {/* Playback Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => onFrameStep('backward')}
                        className="size-8 md:size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
                        title="-1 Frame"
                    >
                        <span className="material-symbols-outlined text-sm md:text-base">skip_previous</span>
                    </button>

                    <button
                        onClick={onPlayPause}
                        className="size-10 md:size-12 rounded-full bg-white text-black flex items-center justify-center shadow-glow hover:scale-105 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl md:text-2xl font-black">
                            {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                    </button>

                    <button
                        onClick={() => onFrameStep('forward')}
                        className="size-8 md:size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-all active:scale-90"
                        title="+1 Frame"
                    >
                        <span className="material-symbols-outlined text-sm md:text-base">skip_next</span>
                    </button>
                </div>

                {/* Extra Tools (Placeholder for future Zoom) */}
                <div className="flex items-center gap-2">
                    <button className="size-8 rounded-lg border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <span className="material-symbols-outlined text-sm">zoom_in</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
