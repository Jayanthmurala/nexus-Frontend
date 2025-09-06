import { getLatestAccessToken } from './authRefresh';
import httpNetwork from './httpNetwork';
import { networkApi } from './networkApi';

// Define interfaces locally since they're not exported from types/post
interface CreateMediaRequest {
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

interface MediaResponse {
  id: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
}

interface UploadResponse {
  id: string;
  url: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  mediaId?: string;
  error?: string;
}

export class MediaUploadService {
  private static instance: MediaUploadService;
  private uploadQueue: Map<string, UploadProgress> = new Map();
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();

  static getInstance(): MediaUploadService {
    if (!MediaUploadService.instance) {
      MediaUploadService.instance = new MediaUploadService();
    }
    return MediaUploadService.instance;
  }

  async uploadFiles(
    files: File[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadSingleFile(file, onProgress));
    const results = await Promise.allSettled(uploadPromises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  private async uploadSingleFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const progressData: UploadProgress = {
      file,
      progress: 0,
      status: 'uploading'
    };

    if (onProgress) {
      onProgress(progressData);
    }

    try {
      // Validate file
      this.validateFile(file);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', this.getFileCategory(file));

      // Upload to backend media service
      const fileId = Math.random().toString(36).substring(7);
      
      // Set up progress tracking for this file
      this.progressCallbacks.set(fileId, (progress: UploadProgress) => {
        if (onProgress) onProgress(progress);
      });
      
      const uploadResponse = await this.uploadToBackend(file, fileId);

      // Media record is already created by the upload endpoint
      progressData.status = 'completed';
      progressData.mediaId = uploadResponse.id;
      if (onProgress) onProgress({ ...progressData });
      
      return uploadResponse.id;

    } catch (error) {
      progressData.status = 'error';
      progressData.error = error instanceof Error ? error.message : 'Upload failed';
      if (onProgress) onProgress(progressData);
      throw error;
    }
  }

  private validateFile(file: File): void {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`File ${file.name} is too large. Maximum size is 50MB.`);
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported.`);
    }
  }

  private getFileCategory(file: File): string {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'document';
    if (file.type.includes('word') || file.type.includes('powerpoint') || file.type === 'text/plain') return 'document';
    return 'other';
  }

  private async uploadToBackend(file: File, fileId: string): Promise<MediaResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', this.getFileCategory(file));

    try {
      const response = await httpNetwork.post('/v1/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            this.updateProgress(fileId, { file, progress, status: 'uploading' });
            
            const callback = this.progressCallbacks.get(fileId);
            if (callback) {
              callback({ file, progress, status: 'uploading' });
            }
          }
        }
      });

      this.updateProgress(fileId, { file, progress: 100, status: 'completed' });
      
      const callback = this.progressCallbacks.get(fileId);
      if (callback) {
        callback({ file, progress: 100, status: 'completed' });
      }
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.status 
        ? `Upload failed with status ${error.response.status}`
        : 'Network error occurred';
        
      this.updateProgress(fileId, { file, progress: 0, status: 'error', error: errorMessage });
      
      const callback = this.progressCallbacks.get(fileId);
      if (callback) {
        callback({ file, progress: 0, status: 'error', error: errorMessage });
      }
      
      throw new Error(errorMessage);
    }
  }

  private updateProgress(fileId: string, progress: UploadProgress): void {
    this.uploadQueue.set(fileId, progress);
  }

  getUploadProgress(fileId: string): UploadProgress | undefined {
    return this.uploadQueue.get(fileId);
  }

  cancelUpload(fileId: string): void {
    this.uploadQueue.delete(fileId);
    this.progressCallbacks.delete(fileId);
  }
}

export const mediaUploadService = MediaUploadService.getInstance();
