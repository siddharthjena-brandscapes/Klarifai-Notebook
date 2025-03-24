// DocumentViewer.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Download, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { documentService } from '../../utils/axiosConfig';

const DocumentViewer = ({ documentId, filename, onClose }) => {
  const [documentUrl, setDocumentUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) return;
      
      try {
        setLoading(true);
        const response = await documentService.getOriginalDocument(documentId);
        
        // Create a blob URL for the document
        const blob = new Blob([response.data], { type: getContentType(filename) });
        const url = URL.createObjectURL(blob);
        setDocumentUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching original document:', err);
        setError('Failed to load document. Please try again.');
        setLoading(false);
      }
    };

    fetchDocument();

    // Clean up the blob URL when the component unmounts
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [documentId, filename]);

  const getContentType = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    const contentTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    
    return contentTypes[extension] || 'application/octet-stream';
  };

  const downloadDocument = () => {
    if (documentUrl) {
      const a = document.createElement('a');
      a.href = documentUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderDocumentPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="ml-2 text-gray-200">Loading document...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <div className="text-red-500 mb-2 text-lg">⚠️ {error}</div>
          <p className="text-gray-300">
            The document could not be loaded. It may be in a format that cannot be displayed in the browser.
          </p>
          <button
            onClick={downloadDocument}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
          >
            <Download size={16} className="mr-2" />
            Download Instead
          </button>
        </div>
      );
    }

    if (!documentUrl) {
      return <div className="text-center text-gray-300">No document selected</div>;
    }

    const extension = filename.split('.').pop().toLowerCase();
    
    // PDF viewer
    if (extension === 'pdf') {
      return (
        <iframe 
          src={`${documentUrl}#view=FitH`}
          className="w-full h-full border-none"
          title={filename}
        />
      );
    }
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return (
        <div className="flex items-center justify-center h-full">
          <img 
            src={documentUrl} 
            alt={filename} 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }
    
    // Text files
    if (extension === 'txt' || extension === 'csv') {
      return (
        <iframe 
          src={documentUrl} 
          className="w-full h-full bg-white text-black p-4"
          title={filename}
        />
      );
    }
    
    // For other formats, offer download option
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-gray-300 mb-4">
          This document format ({extension.toUpperCase()}) cannot be previewed directly in the browser.
        </p>
        <button
          onClick={downloadDocument}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
        >
          <Download size={16} className="mr-2" />
          Download Document
        </button>
        <a 
          href={documentUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg flex items-center"
        >
          <ExternalLink size={16} className="mr-2" />
          Open in New Tab
        </a>
      </div>
    );
  };

  return (
    <div 
      className={`
        fixed z-50 transition-all duration-300 
        ${isFullscreen 
          ? 'inset-0 bg-gray-900' 
          : 'top-20 left-1/2 -translate-x-1/2 w-4/5 max-w-4xl h-3/4 bg-gray-800 rounded-xl shadow-2xl'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-700 p-3 border-b border-gray-600 rounded-t-xl">
        <h3 className="text-white font-semibold truncate flex-1">{filename}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadDocument}
            className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-600"
            title="Download document"
          >
            <Download size={18} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-600"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-gray-600"
            title="Close viewer"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {/* Document Viewer Content */}
      <div className="h-[calc(100%-4rem)] overflow-auto bg-gray-900">
        {renderDocumentPreview()}
      </div>
    </div>
  );
};

DocumentViewer.propTypes = {
  documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  filename: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default DocumentViewer;