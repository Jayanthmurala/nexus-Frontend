'use client';

import React, { useState } from 'react';
import { FileText, Download, ExternalLink, Eye, AlertCircle } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  filename: string;
  className?: string;
}

export default function PDFViewer({ url, filename, className = '' }: PDFViewerProps) {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure URL is properly formatted for PDF viewing
  const getPDFViewUrl = (originalUrl: string) => {
    try {
      // If it's a Cloudinary URL, ensure it's set up for PDF viewing
      if (originalUrl.includes('cloudinary.com')) {
        // For Cloudinary PDFs, we need to use the raw URL format
        return originalUrl.replace('/upload/', '/upload/fl_attachment/');
      }
      return originalUrl;
    } catch (error) {
      console.error('Error formatting PDF URL:', error);
      return originalUrl;
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  const pdfUrl = getPDFViewUrl(url);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-red-600" />
          <div>
            <h4 className="font-medium text-gray-900">{filename}</h4>
            <p className="text-sm text-gray-500">PDF Document</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </a>
          <a
            href={pdfUrl}
            download={filename}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="relative h-96">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}

        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-sm mx-auto p-6">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Preview Not Available</h3>
              <p className="text-sm text-gray-600 mb-4">
                This PDF cannot be previewed in the browser. You can still view or download it using the buttons above.
              </p>
              <div className="flex justify-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </a>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1&page=1&view=FitH`}
            className="w-full h-full border-0"
            title={`PDF Viewer - ${filename}`}
            onLoad={handleLoad}
            onError={handleError}
            style={{ display: isLoading ? 'none' : 'block' }}
          />
        )}
      </div>
    </div>
  );
}
