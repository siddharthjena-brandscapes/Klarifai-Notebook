// NoteEditorModal.jsx
import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Maximize2, 
  Minimize2,
  Type,
  FileText,
  Loader,
} from 'lucide-react';
import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const quillRef = useRef(null);
  const modalRef = useRef(null);

  // Custom toolbar with Lucide icons
  const modules = {
    toolbar: {
       container: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
      handlers: {
        // Custom handlers can be added here
      }
    },
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
     'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
  ];

  // Update local state when props change
  useEffect(() => {
    setTitle(noteTitle || '');
    setContent(noteContent || '');
  }, [noteTitle, noteContent, isOpen]);

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

  const getWordCount = (text) => {
    if (!text) return 0;
    // Strip HTML tags before counting words
    return text.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
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
            : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[85vh] max-w-5xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e3d5c8] dark:border-blue-500/20 bg-[#f0eee5] dark:bg-gray-800/80 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
               Text Note Editor
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
        <div className="flex-1 overflow-hidden flex">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Title Section */}
            <div className="p-4 border-b border-[#e3d5c8] dark:border-blue-500/20">
              <div className="flex items-start space-x-3">
                <Type className="h-6 w-6 text-[#a55233] dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full text-xl font-bold bg-transparent border-none outline-none
                               text-[#5e4636] dark:text-white
                               placeholder:text-[#8c715f] dark:placeholder:text-gray-400
                               focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400
                               rounded-lg p-2 -m-2 leading-tight break-words"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ReactQuill
                ref={quillRef}
                value={content}
                onChange={setContent}
                modules={modules}
                formats={formats}
                placeholder="Start writing your note... (Ctrl+S to save)"
                className="flex-1 flex flex-col overflow-hidden editor-container"
                theme="snow"
              />
            </div>

            {/* Footer Info */}
            <div className="flex flex-wrap items-center justify-between text-xs text-[#8c715f] dark:text-gray-400 p-6 pt-3 gap-2">
              <span>
                {content.replace(/<[^>]*>/g, '').length} characters • {getWordCount(content)} words
              </span>
              <span>
                Press Ctrl+S to save • Esc to close
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar and Editor Styles */}
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

        /* Enhanced Quill editor styles to match viewer */
        .editor-container .ql-toolbar {
          border-color: #e3d5c8 !important;
          background-color: #f9f7f4;
          border-bottom: 1px solid #e3d5c8;
          border-top: none;
          border-left: none;
          border-right: none;
          border-radius: 0;
          padding: 12px 16px;
        }
        
        .editor-container .ql-container {
          border: none !important;
          font-family: inherit;
          flex: 1;
          display: flex;
          flex-direction: column;
           overflow: hidden; /* <-- Add this */
          min-height: 0;  
        }
        
        .editor-container .ql-editor {
          color: #5e4636;
          font-size: 1rem;
          line-height: 1.5;
          padding: 1.5rem;
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          min-height: 0;      
  padding-bottom: 2rem;
        }
        
        .editor-container .ql-editor.ql-blank::before {
          color: #8c715f;
          font-style: normal;
          left: 1.5rem;
          font-size: 1rem;
        }

        /* Enhanced editor content styling */
        .editor-container .ql-editor h1,
        .editor-container .ql-editor h2,
        .editor-container .ql-editor h3 {
          color: inherit;
          margin-top: 1.2em;
          margin-bottom: 0.4em;
          word-wrap: break-word;
          line-height: 1.3;
        }

        .editor-container .ql-editor h1 {
          font-size: 1.8em;
        }

        .editor-container .ql-editor h2 {
          font-size: 1.4em;
        }

        .editor-container .ql-editor h3 {
          font-size: 1.2em;
        }

        .editor-container .ql-editor p {
          margin-bottom: 0.8em;
          word-wrap: break-word;
          overflow-wrap: break-word;
          line-height: 1.5;
        }

        .editor-container .ql-editor ul,
        .editor-container .ql-editor ol {
          padding-left: 1.5em;
          margin-bottom: 0.8em;
        }

        .editor-container .ql-editor li {
          word-wrap: break-word;
          overflow-wrap: break-word;
          margin-bottom: 0.2em;
          line-height: 1.5;
        }

        .editor-container .ql-editor blockquote {
          border-left: 4px solid #e3d5c8;
          padding-left: 1em;
          margin-left: 0;
          margin-right: 0;
          margin-bottom: 0.8em;
          color: #8c715f;
          word-wrap: break-word;
          overflow-wrap: break-word;
          line-height: 1.5;
        }

        .editor-container .ql-editor a {
          color: #a55233;
          text-decoration: underline;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        /* Dark mode styles */
        .dark .editor-container .ql-toolbar {
          background-color: rgba(31, 41, 55, 0.5);
          border-color: rgba(59, 130, 246, 0.2) !important;
        }
        
        .dark .editor-container .ql-container {
          background-color: transparent;
        }
        
        .dark .editor-container .ql-editor {
          color: white;
        }
        
        .dark .editor-container .ql-editor.ql-blank::before {
          color: rgba(156, 163, 175, 0.7);
        }
        
        .dark .ql-snow .ql-stroke {
          stroke: rgba(209, 213, 219, 0.8);
        }
        
        .dark .ql-snow .ql-fill {
          fill: rgba(209, 213, 219, 0.8);
        }
        
        .dark .ql-snow .ql-picker {
          color: rgba(209, 213, 219, 0.8);
        }

        .dark .editor-container .ql-editor h1,
        .dark .editor-container .ql-editor h2,
        .dark .editor-container .ql-editor h3 {
          color: white !important;
        }

        .dark .ql-snow .ql-picker-label {
          color: rgba(209, 213, 219, 0.8) !important;
        }

        .dark .ql-snow .ql-picker-options {
          background-color: rgba(31, 41, 55, 0.9) !important;
          color: white !important;
        }

        .dark .editor-container .ql-editor blockquote {
          border-left-color: rgba(59, 130, 246, 0.5);
          color: rgba(156, 163, 175, 0.8);
        }

        .dark .editor-container .ql-editor a {
          color: #3b82f6;
        }

        /* Custom scrollbar for editor content */
        .editor-container .ql-editor::-webkit-scrollbar {
          width: 6px;
        }
        .editor-container .ql-editor::-webkit-scrollbar-track {
          background: rgba(214, 203, 191, 0.1);
          border-radius: 10px;
        }
        .editor-container .ql-editor::-webkit-scrollbar-thumb {
          background: rgba(165, 82, 51, 0.2);
          border-radius: 10px;
        }
        .editor-container .ql-editor::-webkit-scrollbar-thumb:hover {
          background: rgba(165, 82, 51, 0.3);
        }
        
        .dark .editor-container .ql-editor::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.1);
        }
        .dark .editor-container .ql-editor::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
        }
        .dark .editor-container .ql-editor::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        /* Remove first/last child margins */
        .editor-container .ql-editor > *:first-child {
          margin-top: 0;
        }

        .editor-container .ql-editor > *:last-child {
          margin-bottom: 0;
        }

        /* Ensure proper flex layout for Quill */
        .editor-container.ql-container {
          height: auto !important;
        }

        .editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
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