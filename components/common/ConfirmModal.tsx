import React from 'react';
import { Button } from './Atomic';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="glass-card bg-surface p-6 rounded-2xl max-w-sm w-full border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${variant === 'danger' ? 'bg-danger/20 text-danger' :
                        variant === 'warning' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
                        }`}>
                        <span className="material-symbols-outlined text-xl">
                            {variant === 'danger' ? 'warning' : variant === 'warning' ? 'help' : 'info'}
                        </span>
                    </div>
                    <h3 className="text-white font-black uppercase tracking-tight text-lg">{title}</h3>
                </div>

                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{message}</p>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'warning' ? 'secondary' : variant}
                        size="sm"
                        onClick={() => { onConfirm(); onClose(); }}
                        className="flex-1"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
