import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FileAttachment } from '../types';

/**
 * Determines file type based on extension
 */
function getFileType(filename: string): FileAttachment['type'] {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (!ext) return 'other';

    if (['pdf'].includes(ext)) return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'excel';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['zip', 'rar', '7z'].includes(ext)) return 'zip';

    return 'other';
}

/**
 * Uploads a file to Firebase Storage for Staff Wall
 * @param file - File to upload
 * @param athleteId - Athlete ID for organization
 * @param postId - Post ID for organization
 * @returns FileAttachment metadata
 */
export async function uploadStaffFile(
    file: File,
    athleteId: string,
    postId: string
): Promise<FileAttachment> {
    try {
        // Create storage reference
        const storageRef = ref(storage, `staff-wall/${athleteId}/${postId}/${file.name}`);

        // Upload file
        await uploadBytes(storageRef, file);

        // Get download URL
        const url = await getDownloadURL(storageRef);

        // Return metadata
        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            url,
            type: getFileType(file.name),
            size: file.size,
            uploadedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('[FileUpload] Error uploading file:', error);
        throw new Error(`Failed to upload ${file.name}`);
    }
}

/**
 * Uploads multiple files concurrently
 * @param files - Array of files to upload
 * @param athleteId - Athlete ID
 * @param postId - Post ID
 * @returns Array of FileAttachment metadata
 */
export async function uploadMultipleFiles(
    files: File[],
    athleteId: string,
    postId: string
): Promise<FileAttachment[]> {
    const uploadPromises = files.map(file => uploadStaffFile(file, athleteId, postId));
    return Promise.all(uploadPromises);
}

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Gets icon name for file type
 * @param type - File type
 * @returns Material icon name
 */
export function getFileIcon(type: FileAttachment['type']): string {
    switch (type) {
        case 'pdf': return 'picture_as_pdf';
        case 'image': return 'image';
        case 'excel': return 'table_chart';
        case 'word': return 'description';
        case 'zip': return 'folder_zip';
        default: return 'insert_drive_file';
    }
}
