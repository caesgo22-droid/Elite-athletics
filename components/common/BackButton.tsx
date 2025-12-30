import React from 'react';

interface BackButtonProps {
    onClick: () => void;
    label?: string; // Optional label, defaults to "Volver"
    className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, label = "Volver", className = "" }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 text-slate-400 hover:text-white transition-colors group ${className}`}
        >
            <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">{label}</span>
        </button>
    );
};
