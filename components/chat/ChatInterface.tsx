import React, { useState, useEffect, useRef } from 'react';
import { chatService, ChatMessage } from '../../services/ChatService';
import { storageService } from '../../services/StorageService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import AttachmentPreview from './AttachmentPreview';

interface ChatInterfaceProps {
    roomId: string;
    currentUserId: string;
    currentUserName: string;
    currentUserRole: 'STAFF' | 'ATHLETE' | 'ADMIN';
    otherUserName: string;
    onClose: () => void;
    inputPosition?: 'top' | 'bottom';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    roomId,
    currentUserId,
    currentUserName,
    currentUserRole,
    otherUserName,
    onClose,
    inputPosition = 'bottom',
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUserName, setTypingUserName] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();

    // Create room if it doesn't exist
    useEffect(() => {
        console.log('🔵 CHAT OPENED - RoomId:', roomId, 'User:', currentUserId, 'Role:', currentUserRole);

        const initRoom = async () => {
            try {
                // Extract participant IDs from roomId (format: staffId_athleteId)
                const [staffId, athleteId] = roomId.split('_');
                const staffName = currentUserRole === 'STAFF' || currentUserRole === 'ADMIN' ? currentUserName : otherUserName;
                const athleteName = currentUserRole === 'ATHLETE' ? currentUserName : otherUserName;

                console.log('📝 Creating room:', { staffId, staffName, athleteId, athleteName });

                await chatService.createOrGetRoom(
                    staffId,
                    staffName,
                    athleteId,
                    athleteName
                );

                console.log('✅ Room created/found successfully');
            } catch (error) {
                console.error('❌ Error creating room:', error);
            }
        };
        initRoom();
    }, [roomId, currentUserId, currentUserName, currentUserRole, otherUserName]);

    useEffect(() => {
        // Subscribe to messages
        const unsubscribeMessages = chatService.subscribeToMessages(roomId, (newMessages) => {
            setMessages(newMessages);
            // Mark as read
            chatService.markAsRead(roomId, currentUserId);
        });

        // Subscribe to typing status
        const unsubscribeTyping = chatService.subscribeToTyping(
            roomId,
            currentUserId,
            (typing, userName) => {
                setIsTyping(typing);
                setTypingUserName(userName || '');
            }
        );

        return () => {
            unsubscribeMessages();
            unsubscribeTyping();
        };
    }, [roomId, currentUserId]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim() && !selectedFile) return;

        try {
            let attachmentUrl: string | undefined;
            let attachmentName: string | undefined;
            let messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' = 'TEXT';

            // Upload file if selected
            if (selectedFile) {
                setIsUploading(true);
                attachmentUrl = await storageService.uploadChatAttachment(roomId, selectedFile);
                attachmentName = selectedFile.name;
                messageType = storageService.getFileType(selectedFile);
                setIsUploading(false);
                setSelectedFile(null);
            }

            await chatService.sendMessage(
                roomId,
                currentUserId,
                currentUserName,
                currentUserRole,
                content || `[${messageType}]`,
                messageType,
                attachmentUrl || null,
                attachmentName || null
            );

            // Clear typing status
            chatService.setTyping(roomId, currentUserId, false);
        } catch (error) {
            console.error('Error sending message:', error);
            setIsUploading(false);
        }
    };

    const handleInputChange = (content: string) => {
        // Set typing status
        chatService.setTyping(roomId, currentUserId, true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to clear typing status
        typingTimeoutRef.current = setTimeout(() => {
            chatService.setTyping(roomId, currentUserId, false);
        }, 2000);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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

            {/* Input Area (Top Position) */}
            {inputPosition === 'top' && (
                <div className="shrink-0 border-b border-white/10">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <MessageInput
                        onSend={handleSendMessage}
                        onInputChange={handleInputChange}
                        onAttachClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    />
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <MessageList messages={messages} currentUserId={currentUserId} />
            </div>

            {/* File Preview */}
            {selectedFile && (
                <div className="px-4 py-2 bg-surface border-t border-white/10 shrink-0">
                    <AttachmentPreview
                        url={URL.createObjectURL(selectedFile)}
                        type={storageService.getFileType(selectedFile)}
                        filename={selectedFile.name}
                        onRemove={handleRemoveFile}
                    />
                </div>
            )}

            {/* Input Area (Bottom Position - Default) */}
            {inputPosition === 'bottom' && (
                <div className="shrink-0">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <MessageInput
                        onSend={handleSendMessage}
                        onInputChange={handleInputChange}
                        onAttachClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
