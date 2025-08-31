'use client';

import React, { useState, useRef } from 'react';
import { 
  Image, 
  Paperclip, 
  Link, 
  Hash, 
  Globe, 
  School, 
  X, 
  Send,
  Plus,
  FileText,
  Video,
  Smile
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PostCreatorProps {
  onPostCreated?: () => void;
}

export default function PostCreator({ onPostCreated }: PostCreatorProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'COLLEGE'>('COLLEGE');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (newLink.trim() && !links.includes(newLink.trim())) {
      setLinks(prev => [...prev, newLink.trim()]);
      setNewLink('');
    }
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = newTag.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // TODO: Implement actual post creation API call
      console.log('Creating post:', {
        content,
        visibility,
        attachments,
        links,
        tags
      });
      
      // Reset form
      setContent('');
      setAttachments([]);
      setLinks([]);
      setTags([]);
      setIsExpanded(false);
      
      onPostCreated?.();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {user?.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">{user?.name || 'Anonymous'}</p>
          <p className="text-sm text-gray-500">Share something with your network</p>
        </div>
      </div>

      {/* Content Input */}
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="What's on your mind?"
          className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          rows={isExpanded ? 4 : 2}
        />
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Attachments ({attachments.length})</h4>
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {links.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Links</h4>
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-blue-600" />
                  <a 
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {link}
                  </a>
                </div>
                <button
                  onClick={() => removeLink(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                #{tag}
                <button
                  onClick={() => removeTag(index)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Options */}
      {isExpanded && (
        <div className="space-y-4 mb-4">
          {/* Add Link */}
          <div className="flex gap-2">
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Add a link..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addLink()}
            />
            <button
              onClick={addLink}
              disabled={!newLink.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Tag */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <button
              onClick={addTag}
              disabled={!newTag.trim()}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Hash className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            <span className="text-sm">Attach</span>
          </button>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => setVisibility(visibility === 'PUBLIC' ? 'COLLEGE' : 'PUBLIC')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                visibility === 'PUBLIC' 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              }`}
            >
              {visibility === 'PUBLIC' ? (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <School className="w-4 h-4" />
                  <span>College Only</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && attachments.length === 0) || isSubmitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
