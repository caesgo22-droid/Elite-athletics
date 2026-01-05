import React, { useState, useRef } from 'react';

interface MessageInputProps {
    onSend: (content: string) => void;
    onInputChange?: (content: string) => void;
    onAttachClick?: () => void;
    disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    onInputChange,
    onAttachClick,
    disabled = false
}) => {
    const [message, setMessage] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSend(message);
            setMessage('');
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-surface border-t border-white/10 p-4 shrink-0"
        >
            <div className="flex items-end gap-2">
                {/* Attachment button */}
                <button
                    type="button"
                    onClick={onAttachClick}
                    disabled={disabled}
                    className="size-10 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
                    title="Adjuntar archivo"
                >
                    <span className="material-symbols-outlined text-slate-400 text-lg">attach_file</span>
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                    <textarea
                        ref={inputRef}
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            onInputChange?.(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un mensaje..."
                        disabled={disabled}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-volt/50 resize-none custom-scrollbar disabled:opacity-50"
                        rows={1}
                        style={{
                            minHeight: '44px',
                            maxHeight: '120px',
                        }}
                    />
                </div>

                {/* Send button */}
                <button
                    type="submit"
                    disabled={!message.trim() || disabled}
                    className="size-10 rounded-lg bg-volt hover:bg-volt/90 disabled:bg-white/5 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
                    title="Enviar"
                >
                    <span className="material-symbols-outlined text-black text-lg">send</span>
                </button>
            </div>

            <p className="text-[9px] text-slate-600 mt-2 text-center">
                Presiona Enter para enviar • Shift+Enter para nueva línea
            </p>
        </form>
    );
};

export default MessageInput;
