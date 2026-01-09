import React from 'react';
import { ChatMessage } from '../../services/ChatService';
import AttachmentPreview from './AttachmentPreview';

interface MessageBubbleProps {
    message: ChatMessage;
    isOwn: boolean;
    resolvedName?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, resolvedName }) => {
    const time = new Date(message.timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {/* Sender name (only for received messages) */}
                {!isOwn && (
                    <span className="text-[9px] text-slate-500 font-bold px-3">
                        {resolvedName || message.senderName}
                    </span>
                )}

                {/* Message bubble */}
                <div
                    className={`rounded-2xl px-4 py-2 ${isOwn
                        ? 'bg-volt text-black rounded-br-sm'
                        : 'bg-white/5 text-white border border-white/10 rounded-bl-sm'
                        }`}
                >
                    {/* Attachment preview */}
                    {message.attachmentUrl && message.type !== 'TEXT' && (
                        <div className="mb-2">
                            <AttachmentPreview
                                url={message.attachmentUrl}
                                type={message.type}
                                filename={message.attachmentName}
                            />
                        </div>
                    )}

                    {/* Text content */}
                    {message.type === 'TEXT' && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                        </p>
                    )}

                    {/* Time */}
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <span
                            className={`text-[9px] font-mono ${isOwn ? 'text-black/60' : 'text-slate-500'
                                }`}
                        >
                            {time}
                        </span>
                        {isOwn && (
                            <span className="material-symbols-outlined text-black/60 text-xs">
                                {message.read ? 'done_all' : 'done'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
