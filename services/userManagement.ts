import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';

const USERS_COLLECTION = 'users';

/**
 * Creates a new user in Firestore with PENDING status
 * First user automatically becomes ADMIN
 */
export async function createUser(uid: string, email: string, displayName?: string, photoURL?: string): Promise<User> {
    try {
        // Check if this is the first user
        const usersRef = collection(db, USERS_COLLECTION);
        const snapshot = await getDocs(usersRef);
        const isFirstUser = snapshot.empty;

        const newUser: User = {
            uid,
            email,
            displayName,
            photoURL,
            role: isFirstUser ? 'ADMIN' : 'PENDING',
            status: isFirstUser ? 'APPROVED' : 'PENDING',
            createdAt: new Date().toISOString(),
        };

        if (isFirstUser) {
            newUser.approvedBy = 'SYSTEM';
            newUser.approvedAt = new Date().toISOString();
        }

        await setDoc(doc(db, USERS_COLLECTION, uid), newUser);

        console.log(`[UserManagement] User created: ${email} as ${newUser.role}`);
        return newUser;
    } catch (error) {
        console.error('[UserManagement] Error creating user:', error);
        throw error;
    }
}

/**
 * Gets user by UID
 */
export async function getUser(uid: string): Promise<User | null> {
    try {
        const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
        if (userDoc.exists()) {
            return userDoc.data() as User;
        }
        return null;
    } catch (error) {
        console.error('[UserManagement] Error getting user:', error);
        return null;
    }
}

/**
 * Approves a user and assigns a role
 */
export async function approveUser(uid: string, role: 'ATHLETE' | 'STAFF' | 'ADMIN', adminUid: string): Promise<void> {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, {
            role,
            status: 'APPROVED',
            approvedBy: adminUid,
            approvedAt: new Date().toISOString(),
        });

        console.log(`[UserManagement] User ${uid} approved as ${role}`);
    } catch (error) {
        console.error('[UserManagement] Error approving user:', error);
        throw error;
    }
}

/**
 * Rejects a user's access request
 */
export async function rejectUser(uid: string, adminUid: string): Promise<void> {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, {
            status: 'REJECTED',
            approvedBy: adminUid,
            approvedAt: new Date().toISOString(),
        });

        console.log(`[UserManagement] User ${uid} rejected`);
    } catch (error) {
        console.error('[UserManagement] Error rejecting user:', error);
        throw error;
    }
}

/**
 * Gets all users with PENDING status
 */
export async function getAllPendingUsers(): Promise<User[]> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('status', '==', 'PENDING'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
        console.error('[UserManagement] Error getting pending users:', error);
        return [];
    }
}

/**
 * Gets all users
 */
export async function getAllUsers(): Promise<User[]> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const snapshot = await getDocs(usersRef);

        return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
        console.error('[UserManagement] Error getting all users:', error);
        return [];
    }
}

/**
 * Gets users by role
 */
export async function getUsersByRole(role: User['role']): Promise<User[]> {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where('role', '==', role));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
        console.error('[UserManagement] Error getting users by role:', error);
        return [];
    }
}

/**
 * Updates user role (admin only)
 */
export async function updateUserRole(uid: string, newRole: 'ATHLETE' | 'STAFF' | 'ADMIN', adminUid: string): Promise<void> {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, {
            role: newRole,
            approvedBy: adminUid,
            approvedAt: new Date().toISOString(),
        });

        console.log(`[UserManagement] User ${uid} role updated to ${newRole}`);
    } catch (error) {
        console.error('[UserManagement] Error updating user role:', error);
        throw error;
    }
}
