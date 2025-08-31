interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
}

interface UploadOptions {
  folder?: string;
  transformation?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export class CloudinaryUploadError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'CloudinaryUploadError';
  }
}

/**
 * Upload file to Cloudinary using unsigned upload preset
 * This requires setting up an unsigned upload preset in Cloudinary dashboard
 */
export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResponse> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new CloudinaryUploadError(
      'Cloudinary configuration missing. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  
  // Preserve original filename for documents
  if (options.resourceType === 'raw' || file.type.includes('pdf') || file.type.includes('document')) {
    formData.append('public_id', `${options.folder}/${file.name.replace(/\.[^/.]+$/, '')}`);
    formData.append('use_filename', 'true');
    formData.append('unique_filename', 'false');
  }
  
  if (options.folder && options.resourceType !== 'raw') {
    formData.append('folder', options.folder);
  }
  
  // Note: transformations not allowed with unsigned upload presets
  // Apply transformations via URL manipulation instead

  const resourceType = options.resourceType || 'auto';
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new CloudinaryUploadError(
        errorData.error?.message || `Upload failed with status ${response.status}`,
        response.status
      );
    }

    const data: CloudinaryUploadResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof CloudinaryUploadError) {
      throw error;
    }
    throw new CloudinaryUploadError(
      error instanceof Error ? error.message : 'Upload failed'
    );
  }
}

/**
 * Upload avatar image with optimized settings
 */
export async function uploadAvatar(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new CloudinaryUploadError('Please select an image file');
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new CloudinaryUploadError('Image must be smaller than 5MB');
  }

  const result = await uploadToCloudinary(file, {
    folder: 'nexus/avatars',
    resourceType: 'image'
  });

  return result.secure_url;
}

/**
 * Upload resume/document - tries multiple approaches for better compatibility
 */
export async function uploadResume(file: File): Promise<string> {
  // Validate file type (PDF, DOC, DOCX)
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new CloudinaryUploadError('Please select a PDF, DOC, or DOCX file');
  }

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new CloudinaryUploadError('Resume must be smaller than 10MB');
  }

  try {
    // First try with raw resource type, preserving original filename
    const result = await uploadToCloudinary(file, {
      folder: 'nexus/resumes',
      resourceType: 'raw'
    });
    
    // Return both URL and original filename for better handling
    return result.secure_url;
  } catch (error) {
    // If raw upload fails due to untrusted account, try as auto
    if (error instanceof CloudinaryUploadError && 
        error.message.includes('untrusted')) {
      console.warn('Raw upload failed, trying auto resource type...');
      try {
        const result = await uploadToCloudinary(file, {
          folder: 'nexus/resumes',
          resourceType: 'auto'
        });
        return result.secure_url;
      } catch (autoError) {
        throw new CloudinaryUploadError(
          'Document upload failed. Your Cloudinary account may need verification. Please verify your account at cloudinary.com and try again.'
        );
      }
    }
    throw error;
  }
}

/**
 * Upload project image with optimization
 */
export async function uploadProjectImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new CloudinaryUploadError('Please select an image file');
  }

  const maxSize = 8 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new CloudinaryUploadError('Image must be smaller than 8MB');
  }

  const result = await uploadToCloudinary(file, {
    folder: 'nexus/projects',
    resourceType: 'image'
  });

  return result.secure_url;
}

/**
 * Get optimized image URL from Cloudinary URL
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const { width, height, quality = 'auto', format = 'auto' } = options;
  
  let transformation = '';
  if (width || height) {
    transformation += `c_limit,w_${width || 'auto'},h_${height || 'auto'},`;
  }
  transformation += `q_${quality},f_${format}`;

  // Insert transformation into Cloudinary URL
  return url.replace('/upload/', `/upload/${transformation}/`);
}
