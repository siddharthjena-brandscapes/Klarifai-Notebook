// NoteEditorModal.jsx - Create this as a new component file
import  { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Maximize2, 
  Minimize2,
  Type,
  FileText,
  Loader
} from 'lucide-react';
import PropTypes from 'prop-types';

const NoteEditorModal = ({ 
  isOpen, 
  onClose, 
  noteTitle, 
  noteContent, 
  onSave, 
  isSaving 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  // Update local state when props change
  useEffect(() => {
    setTitle(noteTitle || '');
    setContent(noteContent || '');
  }, [noteTitle, noteContent, isOpen]);

  // Auto-focus and resize textarea
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      autoResizeTextarea();
    }
  }, [isOpen, content]);

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

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSave = () => {
    onSave(title.trim() || 'Untitled Note', content.trim());
  };

  const handleKeyDown = (e) => {
    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

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
            : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[80vh] max-w-4xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e3d5c8] dark:border-blue-500/20 bg-[#f0eee5] dark:bg-gray-800/80 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
              Expanded Note Editor
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
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

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-[#a55233] dark:bg-blue-600 hover:bg-[#8b4513] dark:hover:bg-blue-700
                         text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center space-x-2"
              title="Save Note (Ctrl+S)"
            >
              {isSaving ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save</span>
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
        <div className="flex-1 p-6 overflow-hidden flex flex-col space-y-4">
          {/* Title Input */}
          <div className="flex items-center space-x-3">
            <Type className="h-5 w-5 text-[#a55233] dark:text-blue-400 flex-shrink-0" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="flex-1 p-3 text-lg font-medium rounded-lg
                         bg-[#f9f7f4] dark:bg-gray-800/50
                         border border-[#d6cbbf] dark:border-blue-500/20
                         text-[#5e4636] dark:text-white
                         placeholder:text-[#8c715f] dark:placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
                         focus:border-transparent"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Content Textarea */}
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-[#5e4636] dark:text-white mb-2">
              Content
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                autoResizeTextarea();
              }}
              placeholder="Start writing your note... (Ctrl+S to save)"
              className="flex-1 p-4 text-base rounded-lg resize-none
                         bg-[#f9f7f4] dark:bg-gray-800/50
                         border border-[#d6cbbf] dark:border-blue-500/20
                         text-[#5e4636] dark:text-white
                         placeholder:text-[#8c715f] dark:placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
                         focus:border-transparent
                         min-h-[300px] custom-scrollbar"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-[#8c715f] dark:text-gray-400 pt-2 border-t border-[#e3d5c8] dark:border-blue-500/20">
            <span>
              {content.length} characters • {content.split(/\s+/).filter(word => word.length > 0).length} words
            </span>
            <span>
              Press Ctrl+S to save • Esc to close
            </span>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style >{`
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
      `}</style>
    </div>
  );
};

NoteEditorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  noteTitle: PropTypes.string,
  noteContent: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
};

export default NoteEditorModal;
