import { uploadMedia } from './uploadMedia';

/**
 * Fallback resume upload using the existing API route
 * Use this when direct Cloudinary uploads fail due to account restrictions
 */
export async function uploadResumeViaAPI(file: File): Promise<string> {
  // Validate file type (PDF, DOC, DOCX)
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please select a PDF, DOC, or DOCX file');
  }

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Resume must be smaller than 10MB');
  }

  try {
    const result = await uploadMedia(file, {
      folder: 'resumes',
      resource_type: 'raw'
    });
    
    return result.url;
  } catch (error) {
    console.error('Resume upload via API failed:', error);
    throw new Error('Failed to upload resume. Please try again or contact support.');
  }
}
