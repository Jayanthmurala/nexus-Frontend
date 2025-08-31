// Client-side helper to upload a file to our Next.js API and receive a Cloudinary URL
// Usage: import { uploadMedia } from '@/lib/uploadMedia'
// Only import this in Client Components.

export type UploadMediaResponse = {
  url: string
  public_id: string
  resource_type: string
  bytes: number
  format?: string
  width?: number
  height?: number
  original_filename?: string
  // Additional fields returned by the API route
  mime?: string
  folder?: string
  projectId?: string
}

export async function uploadMedia(
  file: File,
  opts: { folder?: string; resource_type?: 'image' | 'video' | 'raw' | 'auto' } = {}
): Promise<UploadMediaResponse> {
  const fd = new FormData()
  fd.append('file', file)
  if (opts.folder) fd.append('folder', opts.folder)
  if (opts.resource_type) fd.append('resource_type', opts.resource_type)

  // Create AbortController for timeout handling
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout

  try {
    const res = await fetch('/api/uploadmedia', {
      method: 'POST',
      body: fd,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Upload failed (${res.status}): ${text}`)
    }

    return (await res.json()) as UploadMediaResponse
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Upload timeout - please try with a smaller image or check your connection')
    }
    throw error
  }
}
