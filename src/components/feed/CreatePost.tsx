'use client';

import React, { useRef, useState } from 'react';
import { ImageIcon, FileText, Link as LinkIcon, Hash, Users, X, MessageSquare, Trophy, Calendar, Handshake, FileImage, AlertCircle, Type, Award } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { uploadMedia } from '@/lib/uploadMedia';
import { networkApi } from '@/lib/networkApi';
import httpNetwork from '@/lib/httpNetwork';
import { compressImage, validateImageFile } from '@/lib/imageUtils';

interface CreatePostProps {
  onClose: () => void;
  onSubmit: (post: {
    authorId: string;
    authorName: string;
    authorRole: 'student' | 'faculty' | 'admin';
    authorDepartment: string;
    content: string;
    visibility: 'PUBLIC' | 'COLLEGE';
    type: 'text' | 'project_update' | 'achievement' | 'event' | 'collaboration';
    attachments?: Array<{
      type: 'image' | 'document' | 'link';
      url: string;
      title?: string;
      mediaId?: string;
      mimeType?: string;
    }>;
    tags?: string[];
    links?: Array<{ url: string; title?: string }>;
    timestamp: Date;
    mediaIds?: string[];
  }) => void;
}

export default function CreatePost({ onClose, onSubmit }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'COLLEGE'>('COLLEGE');
  const [postType, setPostType] = useState<'text' | 'project_update' | 'achievement' | 'event' | 'collaboration'>('text');
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);

  type UploadedAttachment = {
    id: string; // backend media id
    url: string;
    mimeType: string;
    width?: number | null;
    height?: number | null;
    name?: string;
  };
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const postTypes = [
    { value: 'text', label: 'General Update', icon: Type, color: 'bg-blue-100 text-blue-700' },
    { value: 'project_update', label: 'Project Update', icon: FileText, color: 'bg-green-100 text-green-700' },
    { value: 'achievement', label: 'Achievement', icon: Award, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'event', label: 'Event', icon: Calendar, color: 'bg-purple-100 text-purple-700' },
    { value: 'collaboration', label: 'Collaboration', icon: Users, color: 'bg-orange-100 text-orange-700' }
  ];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const mapUserRoleToPostRole = (role: UserRole): 'student' | 'faculty' | 'admin' => {
    switch (role) {
      case 'student':
        return 'student';
      case 'faculty':
        return 'faculty';
      case 'dept_admin':
      case 'placements_admin':
      case 'head_admin':
        return 'admin';
      default:
        return 'student';
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    onSubmit({
      authorId: user?.id || '',
      authorName: user?.name || 'Anonymous',
      authorRole: mapUserRoleToPostRole(user?.role || 'student'),
      authorDepartment: user?.department || '',
      content: content.trim(),
      visibility,
      type: postType,
      tags: tags.length > 0 ? tags : undefined,
      timestamp: new Date(),
      mediaIds: attachments.map((a) => a.id),
      links: [], // Will be implemented later
      attachments: attachments.map((a) => ({
        type: a.mimeType?.startsWith('image/') ? 'image' : 'document',
        url: a.url,
        title: a.name,
        mediaId: a.id,
        mimeType: a.mimeType,
      })),
    });
  };

  const selectedType = postTypes.find(type => type.value === postType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.name?.charAt(0)}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{user?.name || 'You'}</div>
              <div className="text-sm text-gray-500">{user?.department}</div>
            </div>
          </div>

          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Post Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {postTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPostType(type.value as any)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    postType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`p-2 rounded-lg ${type.color}`}>
                      <type.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Input */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Share your ${selectedType?.label.toLowerCase()}...`}
              className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Attachments Preview */}
          {(attachments.length > 0 || imagePreviewUrls.length > 0) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Media Attachments</h4>
              
              {/* Images grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Uploaded images */}
                {attachments
                  .filter((a) => a.mimeType?.startsWith('image/'))
                  .map((a) => (
                    <div key={a.id} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={a.url} 
                        alt={a.name || 'uploaded image'} 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" 
                        onError={(e) => {
                          console.error('Image failed to load:', a.url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                      <button
                        type="button"
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {a.name}
                      </div>
                    </div>
                  ))}
                
                {/* Preview images (uploading) */}
                {imagePreviewUrls.map((previewUrl, idx) => (
                  <div key={`preview-${idx}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={previewUrl} 
                      alt="uploading..." 
                      className="w-full h-32 object-cover rounded-lg border border-blue-200 shadow-sm opacity-70" 
                    />
                    <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <div className="bg-white/90 px-2 py-1 rounded text-xs text-blue-600 font-medium">
                        Uploading...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Documents list */}
              <div className="space-y-2">
                {attachments
                  .filter((a) => !a.mimeType?.startsWith('image/'))
                  .map((a) => (
                    <div key={a.id} className="flex items-center justify-between border rounded-lg p-2 text-sm">
                      <div className="truncate">
                        <span className="text-gray-800">{a.name || 'Attachment'}</span>
                        <span className="text-gray-500 ml-2">({a.mimeType})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          View
                        </a>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (optional)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-blue-500 hover:text-blue-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button onClick={handleAddTag} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                Add
              </button>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="border-t border-gray-200 pt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Who can see this post?</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setVisibility('COLLEGE')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    visibility === 'COLLEGE'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  College Only
                </button>
                <button
                  onClick={() => setVisibility('PUBLIC')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    visibility === 'PUBLIC'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Public
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {visibility === 'COLLEGE' 
                  ? 'Only people from your college can see this post'
                  : 'Anyone on the platform can see this post'
                }
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Add to your post</span>
              <div className="flex space-x-2">
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={async (e) => {
                  const files = e.target.files; 
                  if (!files || files.length === 0) return; 
                  
                  // Create preview URLs immediately for better UX
                  const newPreviewUrls: string[] = [];
                  const filesToUpload = Array.from(files).slice(0, Math.max(0, 10 - attachments.length));
                  
                  for (const file of filesToUpload) {
                    // Validate file
                    const validation = validateImageFile(file);
                    if (!validation.valid) {
                      setUploadError(validation.error || 'Invalid file');
                      continue;
                    }
                    
                    // Create preview URL
                    const previewUrl = URL.createObjectURL(file);
                    newPreviewUrls.push(previewUrl);
                  }
                  
                  setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
                  e.currentTarget.value = '';
                  setUploadError(undefined); 
                  setUploading(true);
                  
                  try {
                    for (let i = 0; i < filesToUpload.length; i++) {
                      const file = filesToUpload[i];
                      const previewUrl = newPreviewUrls[i];
                      
                      try {
                        // Compress image before upload to reduce timeout issues
                        let fileToUpload = file;
                        if (file.type.startsWith('image/') && file.size > 1024 * 1024) { // Compress if > 1MB
                          try {
                            fileToUpload = await compressImage(file, 1920, 1080, 0.85);
                            console.log(`Compressed ${file.name}: ${file.size} -> ${fileToUpload.size} bytes`);
                          } catch (compressionErr) {
                            console.warn('Image compression failed, uploading original:', compressionErr);
                            // Continue with original file if compression fails
                          }
                        }
                        
                        // Upload media directly via network service
                        const formData = new FormData();
                        formData.append('file', fileToUpload);
                        
                        const response = await httpNetwork.post('/v1/media/upload', formData, {
                          headers: {
                            'Content-Type': 'multipart/form-data',
                          },
                        });
                        
                        const created = response.data;
                        
                        setAttachments((prev) => [
                          ...prev,
                          { 
                            id: created.id, 
                            url: created.url, 
                            mimeType: created.mimeType, 
                            width: created.width ?? null, 
                            height: created.height ?? null, 
                            name: file.name 
                          },
                        ]);
                        
                        // Remove preview URL after successful upload
                        URL.revokeObjectURL(previewUrl);
                        setImagePreviewUrls(prev => prev.filter(url => url !== previewUrl));
                      } catch (fileErr) {
                        console.error(`Failed to upload ${file.name}:`, fileErr);
                        URL.revokeObjectURL(previewUrl);
                        setImagePreviewUrls(prev => prev.filter(url => url !== previewUrl));
                        throw fileErr;
                      }
                    }
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    setUploadError(`Upload failed: ${msg}`);
                  } finally { 
                    setUploading(false); 
                  }
                }} />
                <input ref={docInputRef} type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple hidden onChange={async (e) => {
                  const files = e.target.files; if (!files || files.length === 0) return; e.currentTarget.value = '';
                  setUploadError(undefined); setUploading(true);
                  try {
                    const toUpload = Array.from(files).slice(0, Math.max(0, 10 - attachments.length));
                    for (const file of toUpload) {
                      // Upload file directly via network service
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      const response = await httpNetwork.post('/v1/media/upload', formData, {
                        headers: {
                          'Content-Type': 'multipart/form-data',
                        },
                      });
                      
                      const created = response.data;
                      setAttachments((prev) => [
                        ...prev,
                        { id: created.id, url: created.url, mimeType: created.mimeType, width: created.width ?? null, height: created.height ?? null, name: file.name },
                      ]);
                    }
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    setUploadError(msg);
                  } finally { setUploading(false); }
                }} />
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Add image"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading || attachments.length >= 10}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Add document"
                  onClick={() => docInputRef.current?.click()}
                  disabled={uploading || attachments.length >= 10}
                >
                  <FileText className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" aria-label="Add link">
                  <LinkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            {uploadError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span>Uploading images to Cloudinary...</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || uploading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
