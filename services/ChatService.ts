import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    updateDoc,
    doc,
    onSnapshot,
    Timestamp,
    setDoc,
    getDoc,
    increment,
} from 'firebase/firestore';
import { logger } from './Logger';

export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    senderRole: 'STAFF' | 'ATHLETE' | 'ADMIN';
    content: string;
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
    attachmentUrl?: string;
    attachmentName?: string;
    timestamp: string;
    read: boolean;
}

export interface ChatRoom {
    id: string;
    participants: string[]; // [staffId, athleteId]
    participantNames: { [userId: string]: string };
    participantRoles: { [userId: string]: string };
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: { [userId: string]: number };
    createdAt: string;
}

class ChatService {
    /**
     * Create or get existing chat room between staff and athlete
     */
    async createOrGetRoom(
        staffId: string,
        staffName: string,
        athleteId: string,
        athleteName: string
    ): Promise<string> {
        try {
            // Check if room already exists
            const q = query(
                collection(db, 'chats'),
                where('participants', 'array-contains', staffId)
            );

            const snapshot = await getDocs(q);
            let existingRoom: string | null = null;

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.participants.includes(athleteId)) {
                    existingRoom = doc.id;
                }
            });

            if (existingRoom) {
                logger.log(`[CHAT] Found existing room: ${existingRoom}`);
                return existingRoom;
            }

            // Create new room
            const roomData: Omit<ChatRoom, 'id'> = {
                participants: [staffId, athleteId],
                participantNames: {
                    [staffId]: staffName,
                    [athleteId]: athleteName,
                },
                participantRoles: {
                    [staffId]: 'STAFF',
                    [athleteId]: 'ATHLETE',
                },
                lastMessage: '',
                lastMessageTime: new Date().toISOString(),
                unreadCount: {
                    [staffId]: 0,
                    [athleteId]: 0,
                },
                createdAt: new Date().toISOString(),
            };

            const docRef = await addDoc(collection(db, 'chats'), roomData);
            logger.log(`[CHAT] Created new room: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            logger.error('[CHAT] Error creating/getting room:', error);
            throw error;
        }
    }

    /**
     * Send a message in a chat room
     */
    async sendMessage(
        roomId: string,
        senderId: string,
        senderName: string,
        senderRole: 'STAFF' | 'ATHLETE' | 'ADMIN',
        content: string,
        type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' = 'TEXT',
        attachmentUrl?: string,
        attachmentName?: string
    ): Promise<void> {
        try {
            const messageData: Omit<ChatMessage, 'id'> = {
                roomId,
                senderId,
                senderName,
                senderRole,
                content,
                type,
                attachmentUrl: attachmentUrl || null,
                attachmentName: attachmentName || null,
                timestamp: new Date().toISOString(),
                read: false,
            };

            // Remove nulls if preferred, or keep as null. Firestore handles null.
            // Converting undefined to null above ensures safety.

            // Add message to subcollection
            await addDoc(collection(db, 'chatRooms', roomId, 'messages'), messageData);

            // Update room metadata
            const roomRef = doc(db, 'chats', roomId);
            const roomDoc = await getDoc(roomRef);

            if (roomDoc.exists()) {
                const roomData = roomDoc.data();
                const otherParticipant = roomData.participants.find((p: string) => p !== senderId);

                await updateDoc(roomRef, {
                    lastMessage: type === 'TEXT' ? content : `[${type}]`,
                    lastMessageTime: new Date().toISOString(),
                    [`unreadCount.${otherParticipant}`]: increment(1),
                });
            }

            logger.log(`[CHAT] Message sent in room ${roomId}`);
        } catch (error) {
            logger.error('[CHAT] Error sending message:', error);
            throw error;
        }
    }

    /**
     * Subscribe to messages in a room (real-time)
     */
    subscribeToMessages(
        roomId: string,
        callback: (messages: ChatMessage[]) => void
    ): () => void {
        const q = query(
            collection(db, 'chatRooms', roomId, 'messages'),
            orderBy('timestamp', 'asc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages: ChatMessage[] = [];
            snapshot.forEach((doc) => {
                messages.push({
                    id: doc.id,
                    ...doc.data(),
                } as ChatMessage);
            });

            callback(messages);
        });

        return unsubscribe;
    }

    /**
     * Subscribe to chat rooms for a user (real-time)
     */
    subscribeToRooms(
        userId: string,
        callback: (rooms: ChatRoom[]) => void
    ): () => void {
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId),
            orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rooms: ChatRoom[] = [];
            snapshot.forEach((doc) => {
                rooms.push({
                    id: doc.id,
                    ...doc.data(),
                } as ChatRoom);
            });

            callback(rooms);
        });

        return unsubscribe;
    }

    /**
     * Mark messages as read
     */
    async markAsRead(roomId: string, userId: string): Promise<void> {
        try {
            const roomRef = doc(db, 'chatRooms', roomId);
            await updateDoc(roomRef, {
                [`unreadCount.${userId}`]: 0,
            });

            logger.log(`[CHAT] Marked messages as read in room ${roomId}`);
        } catch (error) {
            logger.error('[CHAT] Error marking as read:', error);
            throw error;
        }
    }

    /**
     * Get total unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, 'chatRooms'),
                where('participants', 'array-contains', userId)
            );

            const snapshot = await getDocs(q);
            let total = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                total += data.unreadCount?.[userId] || 0;
            });

            return total;
        } catch (error) {
            logger.error('[CHAT] Error getting unread count:', error);
            return 0;
        }
    }

    /**
     * Set typing status for a user in a room
     */
    async setTyping(roomId: string, userId: string, isTyping: boolean): Promise<void> {
        try {
            const roomRef = doc(db, 'chatRooms', roomId);

            if (isTyping) {
                await setDoc(roomRef, {
                    typingUsers: {
                        [userId]: Timestamp.now()
                    }
                }, { merge: true });
            } else {
                // Remove typing status
                await setDoc(roomRef, {
                    typingUsers: {
                        [userId]: null // FieldValue.delete() is better but null works for logic
                    }
                }, { merge: true });
            }
        } catch (error) {
            logger.error('[CHAT] Error setting typing status:', error);
        }
    }

    /**
     * Subscribe to typing status in a room
     */
    subscribeToTyping(
        roomId: string,
        currentUserId: string,
        callback: (isTyping: boolean, typingUserName?: string) => void
    ): () => void {
        const roomRef = doc(db, 'chatRooms', roomId);

        const unsubscribe = onSnapshot(roomRef, (snapshot) => {
            if (!snapshot.exists()) {
                callback(false);
                return;
            }

            const data = snapshot.data();
            const typingUsers = data.typingUsers || {};

            // Check if anyone else is typing (not current user)
            const otherTypingUsers = Object.keys(typingUsers)
                .filter(id => id !== currentUserId && typingUsers[id] !== null);

            if (otherTypingUsers.length > 0) {
                const typingUserId = otherTypingUsers[0];
                const typingUserName = data.participantNames?.[typingUserId] || 'Usuario';
                callback(true, typingUserName);
            } else {
                callback(false);
            }
        });

        return unsubscribe;
    }

    /**
     * Upload attachment (placeholder - implement with Firebase Storage)
     */
    async uploadAttachment(file: File): Promise<string> {
        // TODO: Implement Firebase Storage upload
        logger.warn('[CHAT] Attachment upload not yet implemented');
        return '';
    }
}

export const chatService = new ChatService();
