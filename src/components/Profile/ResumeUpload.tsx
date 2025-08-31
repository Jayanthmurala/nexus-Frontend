'use client';

import React, { useState } from 'react';
import { Upload, FileText, X, Download, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface ResumeUploadProps {
  currentResumeUrl?: string;
  currentResumeFilename?: string;
  onResumeUpdate: (url: string, filename?: string) => void;
  disabled?: boolean;
}

export default function ResumeUpload({ 
  currentResumeUrl, 
  currentResumeFilename,
  onResumeUpdate, 
  disabled = false 
}: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    
    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a PDF, DOC, or DOCX file');
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Resume must be smaller than 10MB');
        return;
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'resumes');
      formData.append('resource_type', 'raw');

      // Upload to API
      const response = await fetch('/api/uploadmedia', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed (${response.status})`);
      }

      const result = await response.json();
      
      // Update resume URL
      await onResumeUpdate(result.url, file.name);
      toast.success('Resume uploaded successfully!');
      
    } catch (error) {
      console.error('Resume upload error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to upload resume. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value to allow re-uploading the same file
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleRemoveResume = async () => {
    try {
      await onResumeUpdate('', '');
      toast.success('Resume removed');
    } catch (error) {
      toast.error('Failed to remove resume');
    }
  };

  const getFileName = (url: string) => {
    // Use stored filename if available, otherwise extract from URL
    if (currentResumeFilename) {
      return currentResumeFilename;
    }
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'resume';
      return decodeURIComponent(fileName);
    } catch {
      return 'resume.pdf';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Resume
        </label>
        {currentResumeUrl && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(currentResumeUrl, '_blank')}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              View
            </button>
            <button
              onClick={handleRemoveResume}
              disabled={disabled || uploading}
              className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          </div>
        )}
      </div>

      {currentResumeUrl ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <FileText className="w-8 h-8 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                {getFileName(currentResumeUrl)}
              </p>
              <p className="text-xs text-green-700">Resume uploaded successfully</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(currentResumeUrl, '_blank')}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                title="View Resume"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <a
                href={currentResumeUrl}
                download={getFileName(currentResumeUrl)}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                title="Download Resume"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="text-center">
            {uploading ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-600">Uploading resume...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, or DOCX (max 10MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
