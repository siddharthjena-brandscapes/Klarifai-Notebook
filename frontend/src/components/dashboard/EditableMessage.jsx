

import React, { useState, useRef, useEffect } from 'react';
import { Check, X, ChevronRight, Clock, Edit3 } from 'lucide-react';

const EditableMessage = ({
  message,
  messageIndex,
  onUpdate,
  messageVersions = {},
  currentVersionIndex = {},
  onRestoreVersion,
  onOpenHistoryModal
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const textareaRef = useRef(null);

  // Get version information
  const versions = messageVersions[messageIndex] || [];
  const hasHistory = versions.length > 0;
  const currentVersion = currentVersionIndex[messageIndex] || (versions.length > 0 ? versions.length - 1 : 0);

  console.log(`Message ${messageIndex} - Versions:`, versions.length,
              "Current:", currentVersion,
              "Has history:", hasHistory);

  // Reset content when message changes
  useEffect(() => {
    setEditedContent(message.content);
    setUndoStack([]);
    setRedoStack([]);
  }, [message.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      resizeTextarea(textareaRef.current);
      setUndoStack([message.content]);
      setRedoStack([]);
    }
  }, [isEditing, message.content]);

  // Function to handle textarea resizing
  const resizeTextarea = (element) => {
    element.style.height = 'auto';
    const scrollHeight = element.scrollHeight;
    const maxHeight = 200; // Increased max height
    element.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    element.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  // Add keyboard navigation for version browsing
  useEffect(() => {
    if (hasHistory && !isEditing) {
      const handleKeyDown = (e) => {
        if (e.altKey && e.key === 'ArrowLeft') {
          navigateVersion('prev');
        } else if (e.altKey && e.key === 'ArrowRight') {
          navigateVersion('next');
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [currentVersion, hasHistory, isEditing, versions.length]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(message.content);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleSave = () => {
    if (editedContent.trim() !== message.content.trim()) {
      onUpdate(messageIndex, editedContent);
    }
    setIsEditing(false);
    setUndoStack([]);
    setRedoStack([]);
  };

  // Enhanced change handler with undo stack management
  const handleTextareaChange = (e) => {
    const newValue = e.target.value;
    
    if (newValue !== editedContent) {
      setUndoStack(prev => [...prev, editedContent]);
      setRedoStack([]);
      setEditedContent(newValue);
    }
    
    resizeTextarea(e.target);
  };

  // Undo function
  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, editedContent]);
      setEditedContent(previousState);
      setUndoStack(prev => prev.slice(0, -1));
      
      setTimeout(() => {
        if (textareaRef.current) {
          resizeTextarea(textareaRef.current);
        }
      }, 0);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, editedContent]);
      setEditedContent(nextState);
      setRedoStack(prev => prev.slice(0, -1));
      
      setTimeout(() => {
        if (textareaRef.current) {
          resizeTextarea(textareaRef.current);
        }
      }, 0);
    }
  };

  // Handle tab indentation and other shortcuts
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      
      if (e.shiftKey) {
        // Shift+Tab: Remove indentation
        const lines = value.substring(0, start).split('\n');
        const currentLine = lines[lines.length - 1];
        
        if (currentLine.startsWith('    ')) {
          const newValue = value.substring(0, start - 4) + value.substring(start);
          setUndoStack(prev => [...prev, editedContent]);
          setRedoStack([]);
          setEditedContent(newValue);
          
          setTimeout(() => {
            e.target.selectionStart = start - 4;
            e.target.selectionEnd = end - 4;
          }, 0);
        } else if (currentLine.startsWith('  ')) {
          const newValue = value.substring(0, start - 2) + value.substring(start);
          setUndoStack(prev => [...prev, editedContent]);
          setRedoStack([]);
          setEditedContent(newValue);
          
          setTimeout(() => {
            e.target.selectionStart = start - 2;
            e.target.selectionEnd = end - 2;
          }, 0);
        }
      } else {
        // Tab: Add indentation (4 spaces)
        const newValue = value.substring(0, start) + '    ' + value.substring(end);
        setUndoStack(prev => [...prev, editedContent]);
        setRedoStack([]);
        setEditedContent(newValue);
        
        setTimeout(() => {
          e.target.selectionStart = start + 4;
          e.target.selectionEnd = start + 4;
        }, 0);
      }
      
      resizeTextarea(e.target);
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    } else if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || 
               (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
      e.preventDefault();
      handleRedo();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const navigateVersion = (direction) => {
    if (!hasHistory) return;

    let newVersion;

    if (direction === 'prev' && currentVersion > 0) {
      newVersion = currentVersion - 1;
    } else if (direction === 'next' && currentVersion < versions.length - 1) {
      newVersion = currentVersion + 1;
    } else {
      return;
    }

    if (onRestoreVersion) {
      onRestoreVersion(messageIndex, newVersion);
    }
  };

  // Function to format message content with preserved line breaks
  const formatMessageContent = (content) => {
    return content
      .replace(/\n/g, '<br>')
      .replace(/  /g, '&nbsp;&nbsp;');
  };

  return (
    <div className="relative w-full">
      {message.role === 'user' && !isEditing && (
        <>
          {/* Edit controls positioned at bottom right of message container */}
         <div className="absolute -bottom-6 right-0 flex items-center space-x-2 opacity-100 transition-opacity duration-200">
            {/* Version controls */}
            {hasHistory && (
              <div className="flex items-center">
                <button
                  onClick={() => onOpenHistoryModal && onOpenHistoryModal(messageIndex)}
                  className="p-1 rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-700 transition-colors duration-200"
                  title="View version history"
                >
                  <Clock className="h-3 w-3 text-[#a55233] dark:text-amber-400" />
                </button>
                
                <div className="ml-2 px-2 py-0.5">
                  <span className="text-xs font-medium text-[#8b4513] dark:text-amber-300">
                    {currentVersion === 0 && versions[0]?.isOriginal ? 'Original' : `v${currentVersion}`}
                  </span>
                </div>
              </div>
            )}
            
            {/* Edit button */}
            <button
              onClick={handleEdit}
              className="flex items-center p-1 rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-700 transition-colors duration-200"
              title="Edit message"
            >
              <Edit3 className="h-3 w-3 text-[#556052] dark:text-blue-400" />
            </button>
          </div>
        </>
      )}

      {isEditing ? (
        <div className="w-full p-3 border border-[#a55233]/30 dark:border-blue-500/50 rounded-lg bg-[#f0eee5]/90 dark:bg-gray-900/50 backdrop-blur-sm">
          <textarea
            ref={textareaRef}
            value={editedContent}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-[#5e4636] dark:text-white p-2 resize-none focus:outline-none leading-relaxed font-mono border-none"
            style={{
              minHeight: '60px',
              maxHeight: '200px',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: 'inherit',
              lineHeight: '1.5',
              tabSize: 4
            }}
            placeholder="Edit your message..."
          />
          
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#d6cbbf] dark:border-gray-600">
            <div className="text-[#5a544a] dark:text-gray-400 text-xs">
              <div>Tab/Shift+Tab: Indent/Unindent</div>
              <div>Ctrl+Z/Ctrl+Y: Undo/Redo • Ctrl+Enter: Save • Esc: Cancel</div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 flex items-center transition-colors"
                title="Cancel (Esc)"
              >
                <X className="h-4 w-4 text-[#5a544a] dark:text-gray-400 mr-1" />
                <span className="text-xs text-[#5a544a] dark:text-gray-400">Cancel</span>
              </button>
              
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-md bg-[#a55233] hover:bg-[#8b4513] dark:bg-blue-600/70 dark:hover:bg-blue-600 flex items-center transition-colors"
                title="Save changes (Ctrl+Enter)"
              >
                <Check className="h-4 w-4 text-white mr-1" />
                <span className="text-xs text-white">Save</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="message-content">
          {/* Version indicator badge - Only show when viewing a non-current version */}
          {hasHistory && currentVersion !== versions.length - 1 && (
            <div className="inline-flex items-center bg-gradient-to-r from-[#a55233]/10 to-[#556052]/10 dark:from-amber-500/20 dark:to-amber-400/10 border border-[#a55233]/20 dark:border-amber-500/30 rounded-md px-3 py-1 mb-3 shadow-sm">
              <Clock className="h-4 w-4 text-[#a55233] dark:text-amber-400 mr-2" />
              <span className="text-[#8b4513] dark:text-amber-300 text-xs font-medium">
                {currentVersion === 0 && versions[0]?.isOriginal
                  ? 'Viewing Original Version'
                  : `Viewing Version ${currentVersion} of ${versions.length - 1}`}
              </span>
              <ChevronRight className="h-3 w-3 text-[#556052] dark:text-amber-400 ml-2" title="Use Alt+→ to view newer versions" />
            </div>
          )}
          
          {/* Message content with preserved formatting */}
          <div 
            className="whitespace-pre-wrap break-words font-mono"
            dangerouslySetInnerHTML={{
              __html: formatMessageContent(message.content)
            }}
          />
        </div>
      )}
    </div>
  );
};

export default EditableMessage;