import React from 'react';
import { ChatMessage } from '../../services/ChatService';

interface MessageBubbleProps {
    message: ChatMessage;
    isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const msgTime = new Date(timestamp);
        const diffMs = now.getTime() - msgTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return msgTime.toLocaleDateString();
    };

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {/* Sender name (only for other person's messages) */}
                {!isOwn && (
                    <span className="text-[9px] text-slate-500 font-bold uppercase px-3">
                        {message.senderName}
                    </span>
                )}

                {/* Message bubble */}
                <div
                    className={`px-4 py-2.5 rounded-2xl ${isOwn
                            ? 'bg-volt text-black rounded-br-sm'
                            : 'bg-white/10 text-white rounded-bl-sm'
                        }`}
                >
                    {message.type === 'TEXT' && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                        </p>
                    )}

                    {message.type === 'IMAGE' && message.attachmentUrl && (
                        <div className="space-y-2">
                            <img
                                src={message.attachmentUrl}
                                alt="Attachment"
                                className="max-w-full rounded-lg"
                            />
                            {message.content && (
                                <p className="text-sm leading-relaxed">{message.content}</p>
                            )}
                        </div>
                    )}

                    {message.type === 'FILE' && message.attachmentUrl && (
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">description</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{message.attachmentName}</p>
                                {message.content && (
                                    <p className="text-xs opacity-80">{message.content}</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                <span className={`text-[9px] text-slate-600 font-mono px-3 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {getTimeAgo(message.timestamp)}
                </span>
            </div>
        </div>
    );
};

export default MessageBubble;
