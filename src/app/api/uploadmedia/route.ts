import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export const runtime = 'nodejs'

type ResourceType = 'image' | 'video' | 'raw' | 'auto'

// Security: restrict what/where clients can upload
const ALLOWED_FOLDERS = new Set(['user_avatars', 'resumes', 'project_images', 'project_files'])
const IMAGE_MIME_WHITELIST = new Set(['image/jpeg', 'image/png', 'image/webp'])
const DOC_MIME_WHITELIST = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_DOC_BYTES = 10 * 1024 * 1024 // 10MB

function uploadBufferToCloudinary(
  buffer: Buffer,
  opts: { folder?: string; resource_type?: ResourceType; public_id?: string; tags?: string[] } = {}
) {
  const { folder, resource_type = 'auto', public_id, tags } = opts
  return new Promise<import('cloudinary').UploadApiResponse>((resolve, reject) => {
    const stream = (cloudinary as any).uploader.upload_stream(
      { folder, resource_type, public_id, tags },
      (error: unknown, result: import('cloudinary').UploadApiResponse | undefined) => {
        if (error || !result) return reject(error || new Error('Cloudinary upload returned no result'))
        resolve(result)
      }
    )
    stream.end(buffer)
  })
}

export async function POST(req: NextRequest) {
  try {
    // Require authenticated session
    const session = await getServerSession(authOptions)
    const userId = (session as any)?.user?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No file provided. Use multipart/form-data with a "file" field.' },
        { status: 400 }
      )
    }

    const requestedFolder = (formData.get('folder') as string) || ''
    if (!ALLOWED_FOLDERS.has(requestedFolder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }
    const defaultFolder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim()
    const effectiveFolder = defaultFolder ? `${defaultFolder}/${requestedFolder}` : requestedFolder
    const requestedResource = (formData.get('resource_type') as ResourceType) || 'auto'
    const projectId = (formData.get('projectId') as string) || undefined

    const f = file as File
    const byteSize = (f as any).size as number | undefined
    const mime = (f as any).type as string | undefined

    // Enforce per-folder constraints
    let resourceType: ResourceType = 'auto'
    if (requestedFolder === 'user_avatars' || requestedFolder === 'project_images') {
      // Images only
      resourceType = 'image'
      if (typeof byteSize === 'number' && byteSize > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 413 })
      }
      if (mime && !IMAGE_MIME_WHITELIST.has(mime)) {
        return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 })
      }
    } else if (requestedFolder === 'resumes') {
      // Documents only (pdf/doc/docx). Allow auto/raw on Cloudinary.
      resourceType = requestedResource === 'raw' ? 'raw' : 'auto'
      if (typeof byteSize === 'number' && byteSize > MAX_DOC_BYTES) {
        return NextResponse.json({ error: 'Document too large (max 10MB)' }, { status: 413 })
      }
      if (mime && !DOC_MIME_WHITELIST.has(mime)) {
        return NextResponse.json({ error: 'Unsupported document type' }, { status: 415 })
      }
    } else if (requestedFolder === 'project_files') {
      // Mixed: allow either images or docs with respective limits and whitelists
      if (mime && IMAGE_MIME_WHITELIST.has(mime)) {
        resourceType = 'image'
        if (typeof byteSize === 'number' && byteSize > MAX_IMAGE_BYTES) {
          return NextResponse.json({ error: 'Image too large (max 5MB)' }, { status: 413 })
        }
      } else if (mime && DOC_MIME_WHITELIST.has(mime)) {
        resourceType = 'raw'
        if (typeof byteSize === 'number' && byteSize > MAX_DOC_BYTES) {
          return NextResponse.json({ error: 'Document too large (max 10MB)' }, { status: 413 })
        }
      } else {
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
      }
    }

    const arrayBuffer = await f.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const publicId = `${userId}_${Date.now()}`
    const tags = ['nexus', requestedFolder, userId, ...(projectId ? [`project:${projectId}`] : [])]
    const result = await uploadBufferToCloudinary(buffer, {
      folder: effectiveFolder,
      resource_type: resourceType,
      public_id: publicId,
      tags,
    })

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      bytes: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
      original_filename: f.name,
      folder: requestedFolder,
      mime,
      projectId,
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Cloudinary upload failed', err)
    return NextResponse.json(
      { error: 'Upload failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
