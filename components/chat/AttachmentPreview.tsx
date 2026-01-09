import React from 'react';

interface AttachmentPreviewProps {
    url: string;
    type: 'IMAGE' | 'VIDEO' | 'FILE';
    filename?: string;
    onRemove?: () => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
    url,
    type,
    filename,
    onRemove
}) => {
    if (type === 'IMAGE') {
        return (
            <div className="relative inline-block group">
                <a href={url} target="_blank" rel="noopener noreferrer" className="block relative">
                    <img
                        src={url}
                        alt={filename || 'Attachment'}
                        className="max-w-xs max-h-48 rounded-lg object-cover cursor-zoom-in group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                        <span className="material-symbols-outlined text-white">open_in_new</span>
                    </div>
                </a>
                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black rounded-full p-1.5 transition-colors z-10"
                    >
                        <span className="material-symbols-outlined text-white text-sm">close</span>
                    </button>
                )}
            </div>
        );
    }

    if (type === 'VIDEO') {
        return (
            <div className="relative inline-block group">
                <div className="relative">
                    <video
                        src={url}
                        controls
                        className="max-w-xs max-h-48 rounded-lg"
                    />
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-12 bg-black/70 hover:bg-black text-white p-1 rounded transition-colors text-xs flex items-center gap-1 z-10"
                    >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                </div>
                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black rounded-full p-1.5 transition-colors z-10"
                    >
                        <span className="material-symbols-outlined text-white text-sm">close</span>
                    </button>
                )}
            </div>
        );
    }

    // FILE type
    return (
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg max-w-xs">
            <div className="flex items-center justify-center size-10 bg-primary/10 rounded-lg shrink-0">
                <span className="material-symbols-outlined text-primary">attach_file</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{filename || 'Archivo'}</p>
                <a
                    href={url}
                    download={filename}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                    Descargar
                </a>
            </div>
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="shrink-0 p-1 hover:bg-white/5 rounded transition-colors"
                >
                    <span className="material-symbols-outlined text-slate-400 text-sm">close</span>
                </button>
            )}
        </div>
    );
};

export default AttachmentPreview;
