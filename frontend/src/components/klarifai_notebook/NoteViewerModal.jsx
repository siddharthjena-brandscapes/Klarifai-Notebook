// NoteViewerModal.jsx - Create this as a new component file
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
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleCopyContent = async () => {
    try {
      const textToCopy = `${note?.title || 'Untitled Note'}\n\n${note?.content || ''}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };

  const getWordCount = (text) => {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = (text) => {
    const words = getWordCount(text);
    const readingSpeed = 200; // words per minute
    const minutes = Math.ceil(words / readingSpeed);
    return minutes;
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
        <div className="flex items-center justify-between p-4 border-b border-[#e3d5c8] dark:border-blue-500/20 bg-[#f0eee5] dark:bg-gray-800/80 rounded-t-xl">
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

            {/* Edit Button */}
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
            <div className="p-6 border-b border-[#e3d5c8] dark:border-blue-500/20">
              <div className="flex items-start space-x-3">
                <Type className="h-6 w-6 text-[#a55233] dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-[#5e4636] dark:text-white mb-2 leading-tight">
                    {note.title || 'Untitled Note'}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-[#8c715f] dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Last updated: {formatDate(note.updated_at || note.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Hash className="h-4 w-4" />
                      <span>{note.content ? note.content.length : 0} characters</span>
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
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <div 
                ref={contentRef}
                tabIndex={0}
                className="prose prose-lg max-w-none 
                           text-[#5e4636] dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
                           rounded-lg p-4 -m-4"
              >
                {note.content ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-base">
                    {note.content}
                  </div>
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
            <div className="flex items-center justify-between text-xs text-[#8c715f] dark:text-gray-400 p-6 pt-0">
              <span>
                {note.content ? note.content.length : 0} characters • {getWordCount(note.content)} words
              </span>
              <span>
                Press Esc to close • Edit to modify
              </span>
            </div>
          </div>

          {/* Sidebar with metadata (only in maximized mode) */}
          {isMaximized && (
            <div className="w-80 border-l border-[#e3d5c8] dark:border-blue-500/20 bg-[#f9f7f4] dark:bg-gray-800/50 p-4 overflow-y-auto custom-scrollbar">
              <h3 className="text-sm font-semibold text-[#5e4636] dark:text-white mb-4">
                Note Information
              </h3>
              
              <div className="space-y-4">
                {/* Creation Date */}
                <div className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-[#e3d5c8] dark:border-blue-500/20">
                  <h4 className="text-xs font-medium text-[#8c715f] dark:text-gray-400 mb-1">Created</h4>
                  <p className="text-sm text-[#5e4636] dark:text-white">
                    {formatDate(note.created_at)}
                  </p>
                </div>

                {/* Last Modified */}
                <div className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-[#e3d5c8] dark:border-blue-500/20">
                  <h4 className="text-xs font-medium text-[#8c715f] dark:text-gray-400 mb-1">Last Modified</h4>
                  <p className="text-sm text-[#5e4636] dark:text-white">
                    {formatDate(note.updated_at)}
                  </p>
                </div>

                {/* Statistics */}
                <div className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-[#e3d5c8] dark:border-blue-500/20">
                  <h4 className="text-xs font-medium text-[#8c715f] dark:text-gray-400 mb-2">Statistics</h4>
                  <div className="space-y-2 text-sm text-[#5e4636] dark:text-white">
                    <div className="flex justify-between">
                      <span>Characters:</span>
                      <span>{note.content ? note.content.length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Words:</span>
                      <span>{getWordCount(note.content)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lines:</span>
                      <span>{note.content ? note.content.split('\n').length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reading time:</span>
                      <span>~{getReadingTime(note.content)} min</span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-[#e3d5c8] dark:border-blue-500/20">
                  <h4 className="text-xs font-medium text-[#8c715f] dark:text-gray-400 mb-2">Status</h4>
                  <div className="flex items-center space-x-2">
                    {note.is_converted_to_document ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs
                                     bg-green-100 dark:bg-green-900/30 
                                     text-green-800 dark:text-green-400">
                        Document Source
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs
                                     bg-gray-100 dark:bg-gray-700 
                                     text-gray-800 dark:text-gray-300">
                        Note Only
                      </span>
                    )}
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="bg-white dark:bg-gray-700/50 p-3 rounded-lg border border-[#e3d5c8] dark:border-blue-500/20">
                  <h4 className="text-xs font-medium text-[#8c715f] dark:text-gray-400 mb-2">Shortcuts</h4>
                  <div className="space-y-1 text-xs text-[#5e4636] dark:text-white">
                    <div className="flex justify-between">
                      <span>Close viewer:</span>
                      <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">Esc</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Copy content:</span>
                      <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-xs">Ctrl+C</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
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

        .prose {
          line-height: 1.7;
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