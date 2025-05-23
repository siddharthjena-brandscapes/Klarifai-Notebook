

import React, { useState, useRef, useEffect } from 'react';
import {  Check, X, ChevronRight, Clock, Edit3 } from 'lucide-react';
 
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
    // Reset undo/redo stacks when starting to edit a new message
    setUndoStack([]);
    setRedoStack([]);
  }, [message.content]);
 
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      resizeTextarea(textareaRef.current);
      // Initialize undo stack with the original content
      setUndoStack([message.content]);
      setRedoStack([]);
    }
  }, [isEditing, message.content]);
 
  // Function to handle textarea resizing
  const resizeTextarea = (element) => {
    // Start with a default height
    element.style.height = '60px';
   
    // Allow growth up to a max height, then enable scrolling
    if (element.scrollHeight > 100) {
      element.style.overflowY = 'auto';
      element.style.height = '100px';
    } else if (element.scrollHeight > 60) {
      element.style.height = `${element.scrollHeight}px`;
    }
   
    // Ensure the textarea takes full width
    element.style.width = '100%';
    element.style.minWidth = '600px';
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
 
  const handleButtonSave = () => {
    // Same functionality as handleSave but with a different name to match UI
    handleSave();
  };

  // Enhanced change handler with undo stack management
  const handleTextareaChange = (e) => {
    const newValue = e.target.value;
    
    // Only add to undo stack if the content actually changed
    if (newValue !== editedContent) {
      setUndoStack(prev => [...prev, editedContent]);
      setRedoStack([]); // Clear redo stack when new changes are made
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
      
      // Resize textarea after undo
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
      
      // Resize textarea after redo
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
          // Remove 4 spaces
          const newValue = value.substring(0, start - 4) + value.substring(start);
          setUndoStack(prev => [...prev, editedContent]);
          setRedoStack([]);
          setEditedContent(newValue);
          
          // Set cursor position
          setTimeout(() => {
            e.target.selectionStart = start - 4;
            e.target.selectionEnd = end - 4;
          }, 0);
        } else if (currentLine.startsWith('  ')) {
          // Remove 2 spaces
          const newValue = value.substring(0, start - 2) + value.substring(start);
          setUndoStack(prev => [...prev, editedContent]);
          setRedoStack([]);
          setEditedContent(newValue);
          
          // Set cursor position
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
        
        // Set cursor position
        setTimeout(() => {
          e.target.selectionStart = start + 4;
          e.target.selectionEnd = start + 4;
        }, 0);
      }
      
      resizeTextarea(e.target);
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      // Ctrl+Z: Undo
      e.preventDefault();
      handleUndo();
    } else if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || 
               (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
      // Ctrl+Y or Ctrl+Shift+Z: Redo
      e.preventDefault();
      handleRedo();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Enter: Save
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      // Escape: Cancel
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
      return; // Invalid navigation
    }
   
    // Call the restore function with message index and version index
    if (onRestoreVersion) {
      onRestoreVersion(messageIndex, newVersion);
    }
  };

  // Function to format message content with preserved line breaks
  const formatMessageContent = (content) => {
    // Convert newlines to <br> tags for HTML rendering
    // Also preserve spaces for indentation
    return content
      .replace(/\n/g, '<br>')
      .replace(/  /g, '&nbsp;&nbsp;'); // Convert double spaces to non-breaking spaces for indentation
  };
 
  return (
    <div className="relative group pb-3">
      {message.role === 'user' && !isEditing && (
  <>
    {/* Version history controls with edit button moved here - Always visible */}
    <div className="absolute bottom-[-30px] right-0 flex items-center space-x-2">
       {/* Version controls as a separate element */}
       {hasHistory && (
        <div className="flex items-center rounded-md px-2 py-1">
          {/* Version history button */}
          <button
            onClick={() => onOpenHistoryModal && onOpenHistoryModal(messageIndex)}
            className="rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-700 transition-colors duration-200"
            title="View version history"
          >
            <Clock className="h-3 w-3 text-[#a55233] dark:text-amber-400" />
          </button>
         
          {/* Version indicator with improved styling */}
          <div className="flex items-center ml-2 px-2 py-0.5">
            <span className="text-xs font-medium text-[#8b4513] dark:text-amber-300">
              {currentVersion === 0 && versions[0]?.isOriginal ? 'Original' : `v${currentVersion}`}
            </span>
          </div>
        </div>
      )}
      {/* Edit button - Standalone with improved styling */}
      <button
        onClick={handleEdit}
        className="flex items-center rounded-md px-3 py-1.5"
        title="Edit message"
      >
        <Edit3 className="h-4 w-4 text-[#556052] dark:text-blue-400 mr-1" />
        {/* <span className="text-xs font-medium text-gray-200">Edit</span> */}
      </button>
    </div>
  </>
)}
 
 {isEditing ? (
  <div className="border border-[#a55233]/30 dark:border-blue-500/50 rounded-lg p-2 bg-white/80 dark:bg-gray-900/50 w-full max-w-full" style={{ maxWidth: '100%', minWidth: '600px' }}>
    <textarea
      ref={textareaRef}
      value={editedContent}
      onChange={handleTextareaChange}
      onKeyDown={handleKeyDown}
      className="w-full bg-transparent text-[#5e4636] dark:text-white p-2 resize-none focus:outline-none leading-relaxed font-mono"
      style={{
        height: '60px',
        maxHeight: '100px',
        minWidth: '600px',
        overflowY: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: 'inherit',
        lineHeight: '1.5',
        tabSize: 4
      }}
    />
    <div className="flex justify-between mt-2">
      <div className="text-[#5a544a] dark:text-gray-400 text-xs self-center">
        <div>Tab/Shift+Tab: Indent/Unindent</div>
        <div>Ctrl+Z/Ctrl+Y: Undo/Redo • Ctrl+Enter: Save • Esc: Cancel</div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 flex items-center"
          title="Cancel (Esc)"
        >
          <X className="h-4 w-4 text-[#5a544a] dark:text-gray-400" />
          <span className="ml-1 text-xs text-[#5a544a] dark:text-gray-400">Cancel</span>
        </button>
        <button
          onClick={handleButtonSave}
          className="p-1.5 rounded-md bg-[#a55233] hover:bg-[#8b4513] dark:bg-blue-600/70 dark:hover:bg-blue-600 flex items-center"
          title="Save changes (Ctrl+Enter)"
        >
          <Check className="h-4 w-4 text-white" />
          <span className="ml-1 text-xs text-white">Save</span>
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
    {/* Updated message content display with preserved line breaks and indentation */}
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