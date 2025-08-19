// NoteViewerModal.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Edit3, 
  Maximize2, 
  Minimize2,
  Eye,
  FileText,
  Calendar,
  Type,
  Hash,
  Copy,
  Check
} from 'lucide-react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';

const NoteViewerModal = ({ 
  isOpen, 
  onClose, 
  note,
  onEdit
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Auto-focus content area for keyboard navigation
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const handleCopyContent = async () => {
    try {
      // Strip HTML tags when copying
      const textToCopy = `${note?.title || 'Untitled Note'}\n\n${note?.content ? 
        note.content.replace(/<[^>]*>/g, '') : ''}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const getWordCount = (text) => {
    if (!text) return 0;
    // Strip HTML tags before counting words
    return text.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = (text) => {
    const words = getWordCount(text);
    const readingSpeed = 200; // words per minute
    const minutes = Math.ceil(words / readingSpeed);
    return minutes;
  };

  // Sanitize HTML content before rendering
  const createSanitizedHtml = (html) => {
    return {
      __html: DOMPurify.sanitize(html || '')
    };
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`absolute bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-[#e3d5c8] dark:border-blue-500/20 flex flex-col transition-all duration-300 ${
          isMaximized 
            ? 'inset-4' 
            : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[85vh] max-w-5xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-[#e3d5c8] dark:border-blue-500/20 bg-[#f0eee5] dark:bg-gray-800/80 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <Eye className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
              Note Viewer
            </h2>
            {note.is_converted_to_document && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs
                             bg-green-100 dark:bg-green-900/30 
                             text-green-800 dark:text-green-400">
                Document Source
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Copy Content Button */}
            <button
              onClick={handleCopyContent}
              className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                         hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              title="Copy Note Content"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            {/* Maximize/Minimize Toggle */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                         hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Edit Button - Only show if not a Document Source */}
            {!note.is_converted_to_document && (
              <button
                onClick={() => {
                  onEdit();
                  onClose();
                }}
                className="px-4 py-2 bg-[#a55233] dark:bg-blue-600 hover:bg-[#8b4513] dark:hover:bg-blue-700
                           text-white rounded-lg transition-colors
                           flex items-center space-x-2"
                title="Edit Note"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400
                         hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Title Section */}
            <div className="p-3 border-b border-[#e3d5c8] dark:border-blue-500/20">
              <div className="flex items-start space-x-3">
                <Type className="h-6 w-6 text-[#a55233] dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-[#5e4636] dark:text-white mb-2 leading-tight break-words">
                    {note.title || 'Untitled Note'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#8c715f] dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Last updated: {formatDate(note.updated_at || note.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Hash className="h-4 w-4" />
                      <span>{note.content ? note.content.replace(/<[^>]*>/g, '').length : 0} characters</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{getWordCount(note.content)} words</span>
                    </div>
                    <div className="text-xs">
                      ~{getReadingTime(note.content)} min read
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note Content */}
            <div className="flex-1 overflow-hidden">
              <div 
                ref={contentRef}
                tabIndex={0}
                className="h-full w-full p-4 overflow-y-auto focus:outline-none
                           text-[#5e4636] dark:text-white text-base leading-relaxed
                           prose prose-lg max-w-none custom-scrollbar"
                style={{
                  minHeight: '100%',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                {note.content ? (
                  <div 
                    dangerouslySetInnerHTML={createSanitizedHtml(note.content)}
                  />
                ) : (
                  <div className="text-center text-[#8c715f] dark:text-gray-400 italic py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">This note is empty</p>
                    <p className="text-sm mt-2">Click Edit to add content</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Info */}
            <div className="flex flex-wrap items-center justify-between text-xs text-[#8c715f] dark:text-gray-400 p-2 pt-3 gap-2">
              <span>
                {note.content ? note.content.replace(/<[^>]*>/g, '').length : 0} characters • {getWordCount(note.content)} words
              </span>
              <span>
                Press Esc to close
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        [contenteditable] {
          outline: none;
        }

        [contenteditable] h1,
        [contenteditable] h2,
        [contenteditable] h3,
        [contenteditable] h4,
        [contenteditable] h5,
        [contenteditable] h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: bold;
          line-height: 1.2;
          color: inherit;
        }

        .dark [contenteditable] h1,
        .dark [contenteditable] h2,
        .dark [contenteditable] h3,
        .dark [contenteditable] h4,
        .dark [contenteditable] h5,
        .dark [contenteditable] h6 {
          color: #ffffff;
        }

        [contenteditable] h1 { font-size: 2em; }
        [contenteditable] h2 { font-size: 1.5em; }
        [contenteditable] h3 { font-size: 1.3em; }

        [contenteditable] p {
          margin-bottom: 1em;
          line-height: 1.6;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin-left: 2em;
          margin-bottom: 1em;
          padding-left: 0;
        }

        [contenteditable] li {
          margin-bottom: 0.5em;
          list-style-position: outside;
        }

        [contenteditable] ul li {
          list-style-type: disc;
        }

        [contenteditable] ol li {
          list-style-type: decimal;
        }

        [contenteditable] blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 4px solid #e3d5c8;
          color: #8c715f;
          font-style: italic;
        }

        .dark [contenteditable] blockquote {
          border-left-color: rgba(59, 130, 246, 0.5);
          color: rgba(156, 163, 175, 0.8);
        }

        [contenteditable] table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }

        [contenteditable] table td,
        [contenteditable] table th {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        [contenteditable] table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

        .dark [contenteditable] table td,
        .dark [contenteditable] table th {
          border-color: rgba(59, 130, 246, 0.2);
        }

        .dark [contenteditable] table th {
          background-color: rgba(59, 130, 246, 0.1);
        }
 

        [contenteditable] a {
          color: #a55233;
          text-decoration: underline;
        }

        .dark [contenteditable] a {
          color: #3b82f6;
        }

        /* Custom scrollbar - exactly like NoteEditorModal */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(214, 203, 191, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(165, 82, 51, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(165, 82, 51, 0.3);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.1);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        [contenteditable] {
          outline: none;
        }

        /* Custom scrollbar for contenteditable (fallback) */
        [contenteditable]::-webkit-scrollbar {
          width: 6px;
        }
        [contenteditable]::-webkit-scrollbar-track {
          background: rgba(214, 203, 191, 0.1);
          border-radius: 10px;
        }
        [contenteditable]::-webkit-scrollbar-thumb {
          background: rgba(165, 82, 51, 0.2);
          border-radius: 10px;
        }
        [contenteditable]::-webkit-scrollbar-thumb:hover {
          background: rgba(165, 82, 51, 0.3);
        }
        
        .dark [contenteditable]::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.1);
        }
        .dark [contenteditable]::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
        }
        .dark [contenteditable]::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        /* Viewer-specific styles for content container */
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: bold;
          line-height: 1.2;
          color: inherit;
        }

        .dark .prose h1,
        .dark .prose h2,
        .dark .prose h3,
        .dark .prose h4,
        .dark .prose h5,
        .dark .prose h6 {
          color: #ffffff;
        }

        .prose h1 { font-size: 2em; }
        .prose h2 { font-size: 1.5em; }
        .prose h3 { font-size: 1.3em; }

        .prose p {
          margin-bottom: 1em;
          line-height: 1.6;
        }

        .prose ul,
        .prose ol {
          margin-left: 2em;
          margin-bottom: 1em;
          padding-left: 0;
        }

        .prose li {
          margin-bottom: 0.5em;
          list-style-position: outside;
        }

        .prose ul li {
          list-style-type: disc;
        }

        .prose ol li {
          list-style-type: decimal;
        }

        .prose blockquote {
          margin: 1em 0;
          padding-left: 1em;
          border-left: 4px solid #e3d5c8;
          color: #8c715f;
          font-style: italic;
        }

        .dark .prose blockquote {
          border-left-color: rgba(59, 130, 246, 0.5);
          color: rgba(156, 163, 175, 0.8);
        }

        .prose table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }

        .prose table td,
        .prose table th {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        .prose table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

        .dark .prose table td,
        .dark .prose table th {
          border-color: rgba(59, 130, 246, 0.2);
        }

        .dark .prose table th {
  background-color: #000000 !important;
  color: #ffffff !important;
}

        .prose a {
          color: #a55233;
          text-decoration: underline;
        }

        .dark .prose a {
          color: #3b82f6;
        }

        /* Override default prose margins */
        .prose > *:first-child {
          margin-top: 0;
        }

        .prose > *:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

NoteViewerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  note: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
};

export default NoteViewerModal;