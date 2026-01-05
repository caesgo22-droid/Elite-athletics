import React, { useState, useEffect, useRef } from 'react';
import { chatService, ChatMessage } from '../../services/ChatService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatInterfaceProps {
    roomId: string;
    currentUserId: string;
    currentUserName: string;
    currentUserRole: 'STAFF' | 'ATHLETE' | 'ADMIN';
    otherUserName: string;
    onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    roomId,
    currentUserId,
    currentUserName,
    currentUserRole,
    otherUserName,
    onClose,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        // Subscribe to messages
        const unsubscribe = chatService.subscribeToMessages(roomId, (newMessages) => {
            setMessages(newMessages);
            // Mark as read
            chatService.markAsRead(roomId, currentUserId);
        });

        return () => unsubscribe();
    }, [roomId, currentUserId]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        try {
            await chatService.sendMessage(
                roomId,
                currentUserId,
                currentUserName,
                currentUserRole,
                content
            );
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="bg-surface border-b border-white/10 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="size-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
                    >
                        <span className="material-symbols-outlined text-white text-lg">arrow_back</span>
                    </button>

                    <div>
                        <h2 className="text-white font-bold text-sm">{otherUserName}</h2>
                        {isTyping && (
                            <p className="text-[10px] text-volt animate-pulse">escribiendo...</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <div className="size-2 rounded-full bg-success"></div>
                    <span className="text-[9px] text-slate-500 uppercase">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
                <MessageList messages={messages} currentUserId={currentUserId} />
            </div>

            {/* Input */}
            <MessageInput onSend={handleSendMessage} />
        </div>
    );
};

export default ChatInterface;
