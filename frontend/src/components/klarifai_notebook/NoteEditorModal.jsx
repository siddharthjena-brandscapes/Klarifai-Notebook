import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Maximize2, 
  Minimize2,
  Type,
  FileText,
  Loader,
  Table,
  List,
  ListOrdered,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
} from 'lucide-react';

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
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef(null);
  const modalRef = useRef(null);

  // Common colors for text and highlight
  const colors = [
    '#000000', '#333333', '#666666', '#999999',
    '#ff0000', '#ff6600', '#ffcc00', '#00cc00',
    '#0066cc', '#6600cc', '#cc0066', '#ff3366',
    '#ffffff', '#ffcccc', '#ccffcc', '#ccccff'
  ];

  // Update local state when props change
  useEffect(() => {
    setTitle(noteTitle || '');
    setContent(noteContent || '');
  }, [noteTitle, noteContent, isOpen]);

  // Initialize editor content when modal opens or content changes from props
  useEffect(() => {
    if (isOpen && editorRef.current && noteContent !== undefined) {
      // Only set innerHTML if the current content is different from what we want to set
      if (editorRef.current.innerHTML !== noteContent) {
        editorRef.current.innerHTML = noteContent || '';
        setContent(noteContent || '');
      }
    }
  }, [isOpen, noteContent]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (showTableDialog || showLinkDialog || showTextColorPicker || showHighlightColorPicker) {
          setShowTableDialog(false);
          setShowLinkDialog(false);
          setShowTextColorPicker(false);
          setShowHighlightColorPicker(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, showTableDialog, showLinkDialog, showTextColorPicker, showHighlightColorPicker]);

  // Close color pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showTextColorPicker || showHighlightColorPicker) {
        // Check if click is outside color picker areas
        const colorPickerElements = document.querySelectorAll('[data-color-picker]');
        let clickedOutside = true;
        
        colorPickerElements.forEach(element => {
          if (element.contains(e.target)) {
            clickedOutside = false;
          }
        });
        
        if (clickedOutside) {
          setShowTextColorPicker(false);
          setShowHighlightColorPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTextColorPicker, showHighlightColorPicker]);

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

  const getSelection = () => {
    const selection = window.getSelection();
    return selection.toString();
  };

  const insertHTML = (html) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const fragment = range.createContextualFragment(html);
      range.deleteContents();
      range.insertNode(fragment);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // If no selection, append to end
      if (editorRef.current) {
        editorRef.current.innerHTML += html;
      }
    }
    // Update content state
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const formatText = (command, value = null) => {
    // Focus the editor first
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    // Use execCommand for formatting
    const result = document.execCommand(command, false, value);
    
    // Update content state
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
    
    return result;
  };

  const handleListCommand = (listType) => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      const command = listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList';
      document.execCommand(command, false, null);
      
      // Update content state
      setContent(editorRef.current.innerHTML);
    }
  };

  const applyTextColor = (color) => {
    formatText('foreColor', color);
    setShowTextColorPicker(false);
  };

  const applyHighlightColor = (color) => {
    formatText('backColor', color);
    setShowHighlightColorPicker(false);
  };

  const insertTable = (rows, cols) => {
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; margin: 1em 0; border: 1px solid #ddd;">';
    
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        const isHeader = i === 0;
        const tag = isHeader ? 'th' : 'td';
        const style = isHeader 
          ? 'border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; font-weight: bold;'
          : 'border: 1px solid #ddd; padding: 8px;';
        tableHTML += `<${tag} style="${style}">${isHeader ? `Header ${j + 1}` : ''}</${tag}>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    
    insertHTML(tableHTML);
    setShowTableDialog(false);
  };

  const handleTextSelection = () => {
    const selection = getSelection();
    setSelectedText(selection);
  };

  const handleEditorInput = (e) => {
    // Only update content state, don't modify innerHTML
    setContent(e.target.innerHTML);
  };

  const handleEditorClick = (e) => {
    // Ensure the cursor stays where clicked
    e.stopPropagation();
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
        <div className="flex items-center justify-between p-2 border-b border-[#e3d5c8] dark:border-blue-500/20 bg-[#f0eee5] dark:bg-gray-800/80 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
              Enhanced Note Editor
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
            <div className="p-3 border-b border-[#e3d5c8] dark:border-blue-500/20">
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

            {/* Toolbar */}
            <div className="border-b border-[#e3d5c8] dark:border-blue-500/20 bg-[#f9f7f4] dark:bg-gray-800/50 p-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Text Formatting */}
                <div className="flex items-center space-x-1 border-r border-[#e3d5c8] dark:border-blue-500/20 pr-2">
                  <button
                    onClick={() => formatText('bold')}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => formatText('italic')}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => formatText('underline')}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Underline"
                  >
                    <Underline className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => formatText('strikeThrough')}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Strikethrough"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </button>
                </div>

                {/* Alignment */}
                <div className="flex items-center space-x-1 border-r border-[#e3d5c8] dark:border-blue-500/20 pr-2">
                  <button
                    onClick={() => formatText('justifyLeft')}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Align Left"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => formatText('justifyCenter')}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Align Center"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => formatText('justifyRight')}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Align Right"
                  >
                    <AlignRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Text Color and Highlight */}
                <div className="flex items-center space-x-1 border-r border-[#e3d5c8] dark:border-blue-500/20 pr-2 relative">
                  {/* Text Color */}
                  <div className="relative" data-color-picker>
                   <button
                      onClick={() => {
                        setShowTextColorPicker(!showTextColorPicker);
                        setShowHighlightColorPicker(false);
                      }}
                      className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                                 hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors flex items-center"
                      title="Text Color"
                    >
                      <Palette className="h-4 w-4" />
                    </button>
                    
                    {showTextColorPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-[#e3d5c8] dark:border-blue-500/20 
                                      rounded-lg shadow-lg p-2 z-50 grid grid-cols-4 gap-1">
                        {colors.map((color, index) => (
                          <button
                            key={index}
                            onClick={() => applyTextColor(color)}
                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={`Text color: ${color}`}
                          />
                        ))}
                        <button
                          onClick={() => applyTextColor('inherit')}
                          className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform
                                     bg-gradient-to-br from-red-500 via-transparent to-transparent relative"
                          title="Remove text color"
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-red-600">×</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Text Highlight */}
                  <div className="relative" data-color-picker>
                    <button
                      onClick={() => {
                        setShowHighlightColorPicker(!showHighlightColorPicker);
                        setShowTextColorPicker(false);
                      }}
                      className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                                 hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors flex items-center"
                      title="Highlight Color"
                    >
                      <Highlighter className="h-4 w-4" />
                    </button>
                    
                    {showHighlightColorPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-[#e3d5c8] dark:border-blue-500/20 
                                      rounded-lg shadow-lg p-2 z-50 grid grid-cols-4 gap-1">
                        {colors.map((color, index) => (
                          <button
                            key={index}
                            onClick={() => applyHighlightColor(color)}
                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={`Highlight color: ${color}`}
                          />
                        ))}
                        <button
                          onClick={() => applyHighlightColor('transparent')}
                          className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform
                                     bg-gradient-to-br from-red-500 via-transparent to-transparent relative"
                          title="Remove highlight"
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-red-600">×</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lists */}
                <div className="flex items-center space-x-1 border-r border-[#e3d5c8] dark:border-blue-500/20 pr-2">
                  <button
                    onClick={() => handleListCommand('ul')}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Bullet List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleListCommand('ol')}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Numbered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>
                </div>

                {/* Headers */}
                <div className="flex items-center space-x-1 border-r border-[#e3d5c8] dark:border-blue-500/20 pr-2">
                  <select
                    onChange={(e) => formatText('formatBlock', e.target.value)}
                    className="px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-[#e3d5c8] dark:border-blue-500/20 
                               rounded text-[#5e4636] dark:text-white"
                    defaultValue=""
                  >
                    <option value="" className="bg-white dark:bg-gray-700 text-[#5e4636] dark:text-white">Normal</option>
                    <option value="h1" className="bg-white dark:bg-gray-700 text-[#5e4636] dark:text-white">Heading 1</option>
                    <option value="h2" className="bg-white dark:bg-gray-700 text-[#5e4636] dark:text-white">Heading 2</option>
                    <option value="h3" className="bg-white dark:bg-gray-700 text-[#5e4636] dark:text-white">Heading 3</option>
                    <option value="p" className="bg-white dark:bg-gray-700 text-[#5e4636] dark:text-white">Paragraph</option>
                  </select>
                </div>

                {/* Insert Elements */}
                <div className="flex items-center space-x-1">
                 
                  <button
                    onClick={() => setShowTableDialog(true)}
                    className="p-2 text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                               hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50 rounded transition-colors"
                    title="Insert Table"
                  >
                    <Table className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Editor */}
            <div className="flex-1 overflow-hidden">
              <div
                ref={editorRef}
                contentEditable
                className="h-full w-full p-4 overflow-y-auto focus:outline-none
                           text-[#5e4636] dark:text-white text-base leading-relaxed
                           prose prose-lg max-w-none"
                style={{
                  minHeight: '100%',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
                onInput={handleEditorInput}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                onKeyDown={handleKeyDown}
                onClick={handleEditorClick}
                placeholder="Start writing your note..."
                suppressContentEditableWarning={true}
              />
            </div>

            {/* Footer Info */}
            <div className="flex flex-wrap items-center justify-between text-xs text-[#8c715f] dark:text-gray-400 p-2 pt-3 gap-2">
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

      {/* Table Dialog */}
      {showTableDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-[#5e4636] dark:text-white">
              Insert Table
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#5e4636] dark:text-white">
                  Rows
                </label>
                <input
                  type="number"
                  id="table-rows"
                  defaultValue="3"
                  min="1"
                  max="10"
                  className="w-full p-2 border border-[#e3d5c8] dark:border-blue-500/20 rounded-lg
                             bg-white dark:bg-gray-700 text-[#5e4636] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[#5e4636] dark:text-white">
                  Columns
                </label>
                <input
                  type="number"
                  id="table-cols"
                  defaultValue="3"
                  min="1"
                  max="10"
                  className="w-full p-2 border border-[#e3d5c8] dark:border-blue-500/20 rounded-lg
                             bg-white dark:bg-gray-700 text-[#5e4636] dark:text-white"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const rows = parseInt(document.getElementById('table-rows').value);
                    const cols = parseInt(document.getElementById('table-cols').value);
                    insertTable(rows, cols);
                  }}
                  className="flex-1 px-4 py-2 bg-[#a55233] dark:bg-blue-600 text-white rounded-lg
                             hover:bg-[#8b4513] dark:hover:bg-blue-700 transition-colors"
                >
                  Insert
                </button>
                <button
                  onClick={() => setShowTableDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 
                             rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #8c715f;
          font-style: italic;
          pointer-events: none;
        }
        
        .dark [contenteditable]:empty:before {
          color: rgba(156, 163, 175, 0.7);
        }

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
          background-color: #000000;
          font-weight: bold;
        }

      .dark [contenteditable] table th {
  background-color: #000000 !important; /* Black background */
  color: #ffffff !important;           /* White text */
  font-weight: bold;
}

.dark [contenteditable] table td {
  background-color: #0f172a; /* Slightly lighter than black for contrast */
  color: #ffffff;
}

/*

       

        [contenteditable] a {
          color: #a55233;
          text-decoration: underline;
        }

        .dark [contenteditable] a {
          color: #3b82f6;
        }

        /* Custom scrollbar */
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

        /* Ensure proper cursor positioning */
        [contenteditable] * {
          cursor: text;
        }

        [contenteditable]:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default NoteEditorModal;