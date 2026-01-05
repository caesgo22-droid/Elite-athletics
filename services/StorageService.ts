import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class StorageService {
    private storage = getStorage();

    /**
     * Upload a chat attachment
     */
    async uploadChatAttachment(
        roomId: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        try {
            // Validate file
            this.validateFile(file);

            // Create unique filename
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filename = `${timestamp}_${sanitizedName}`;

            // Create storage reference
            const storageRef = ref(this.storage, `chat/${roomId}/${filename}`);

            // Upload file
            const snapshot = await uploadBytes(storageRef, file);

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            return downloadURL;
        } catch (error) {
            console.error('Error uploading chat attachment:', error);
            throw new Error('Failed to upload attachment');
        }
    }

    /**
     * Upload a video for analysis
     */
    async uploadVideo(
        athleteId: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        try {
            this.validateFile(file, 50 * 1024 * 1024); // 50MB max for videos

            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filename = `${timestamp}_${sanitizedName}`;

            const storageRef = ref(this.storage, `videos/${athleteId}/${filename}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return downloadURL;
        } catch (error) {
            console.error('Error uploading video:', error);
            throw new Error('Failed to upload video');
        }
    }

    /**
     * Upload a profile picture
     */
    async uploadProfilePicture(
        userId: string,
        file: File
    ): Promise<string> {
        try {
            this.validateFile(file, 5 * 1024 * 1024); // 5MB max

            if (!file.type.startsWith('image/')) {
                throw new Error('Only images are allowed for profile pictures');
            }

            const filename = `profile_${Date.now()}.${file.type.split('/')[1]}`;
            const storageRef = ref(this.storage, `profiles/${userId}/${filename}`);

            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            return downloadURL;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            throw new Error('Failed to upload profile picture');
        }
    }

    /**
     * Delete a file from storage
     */
    async deleteFile(fileUrl: string): Promise<void> {
        try {
            const fileRef = ref(this.storage, fileUrl);
            await deleteObject(fileRef);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error('Failed to delete file');
        }
    }

    /**
     * Validate file size and type
     */
    private validateFile(file: File, maxSize: number = 10 * 1024 * 1024) {
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        }

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/quicktime',
            'video/webm',
            'application/pdf'
        ];

        if (!allowedTypes.includes(file.type)) {
            throw new Error('File type not allowed');
        }
    }

    /**
     * Get file type from file
     */
    getFileType(file: File): 'IMAGE' | 'VIDEO' | 'FILE' {
        if (file.type.startsWith('image/')) return 'IMAGE';
        if (file.type.startsWith('video/')) return 'VIDEO';
        return 'FILE';
    }
}

export const storageService = new StorageService();
