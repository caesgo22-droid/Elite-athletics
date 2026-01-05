import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../services/ChatService';
import MessageBubble from './MessageBubble';

interface MessageListProps {
    messages: ChatMessage[];
    currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-slate-600 text-2xl">chat</span>
                </div>
                <p className="text-slate-500 text-sm font-bold">No hay mensajes aún</p>
                <p className="text-slate-600 text-[10px] mt-1">Inicia la conversación</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-3">
            {messages.map((message) => (
                <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUserId}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
