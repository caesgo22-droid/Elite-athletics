import React, { useState, useEffect, useRef } from 'react';
import { Card } from './common/Atomic';

interface ChatMessage {
    id: string;
    senderId: string;
    senderRole: 'COACH' | 'ATHLETE' | 'SYSTEM';
    senderName: string;
    text: string;
    timestamp: string;
    contextId: string; // Links message to specific video/plan
}

interface ContextualChatProps {
    contextId: string;
    contextTitle: string;
    userRole: 'STAFF' | 'ATHLETE' | null;
    onClose?: () => void;
    onSendMessage?: (msg: string) => void;
    initialMessages?: ChatMessage[];
    className?: string;
}

const ContextualChat: React.FC<ContextualChatProps> = ({ contextId, contextTitle, userRole, onClose, onSendMessage, initialMessages, className }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Mock initial load of messages for demo purposes
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            setMessages(initialMessages);
        } else {
            // Fallback mock
            setMessages([
                {
                    id: '1',
                    senderId: 'coach-1',
                    senderRole: 'COACH',
                    senderName: 'Coach Sarah',
                    text: `Feedback para ${contextTitle}: Observa la extensión de rodilla aquí.`,
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    contextId
                }
            ]);
        }
    }, [contextId, initialMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const newNode: ChatMessage = {
            id: Date.now().toString(),
            senderId: userRole === 'STAFF' ? 'coach-1' : 'athlete-1',
            senderRole: userRole === 'STAFF' ? 'COACH' : 'ATHLETE',
            senderName: userRole === 'STAFF' ? 'You' : 'Me',
            text: input,
            timestamp: new Date().toISOString(),
            contextId
        };

        setMessages(prev => [...prev, newNode]);
        if (onSendMessage) onSendMessage(input);
        setInput('');
    };

    return (
        <div className={`flex flex-col bg-background/95 backdrop-blur border-l border-white/10 h-full ${className}`}>
            {/* Context Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/40">
                <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Secure Link</div>
                    <h3 className="text-white text-xs font-black truncate max-w-[150px]">{contextTitle}</h3>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-black/20">
                {messages.map(msg => {
                    const isMe = (userRole === 'STAFF' && msg.senderRole === 'COACH') || (userRole === 'ATHLETE' && msg.senderRole === 'ATHLETE');
                    const isSystem = msg.senderRole === 'SYSTEM';

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-2">
                                <span className="text-[8px] bg-white/5 px-2 py-1 rounded text-slate-400 border border-white/5 font-mono uppercase">
                                    {msg.text}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="text-[8px] text-slate-500 mb-0.5 px-1 flex gap-2">
                                <span className="font-bold uppercase tracking-wider">{msg.senderName}</span>
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`max-w-[85%] p-2 rounded-lg text-[10px] md:text-xs leading-relaxed font-medium border ${isMe
                                ? 'bg-primary text-black border-primary'
                                : 'bg-white/10 text-slate-200 border-white/5'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 border-t border-white/10 bg-black/40">
                <div className="flex items-center gap-2">
                    <input
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-600"
                        placeholder="Type functionality..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="p-1.5 bg-primary rounded text-black hover:bg-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm font-bold">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContextualChat;
