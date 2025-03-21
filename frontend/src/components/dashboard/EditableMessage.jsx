

// import React, { useState, useRef, useEffect } from 'react';
// import { Edit, Check, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

// const EditableMessage = ({ 
//   message, 
//   messageIndex, 
//   onUpdate,
//   messageVersions = {},
//   currentVersionIndex = {},
//   onRestoreVersion,
//   onOpenHistoryModal
// }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [editedContent, setEditedContent] = useState(message.content);
//   const textareaRef = useRef(null);
  
//   // Get version information
//   const versions = messageVersions[messageIndex] || [];
//   const hasHistory = versions.length > 0;
//   const currentVersion = currentVersionIndex[messageIndex] || 0;
  
//   // Reset content when message changes
//   useEffect(() => {
//     setEditedContent(message.content);
//   }, [message.content]);

//   useEffect(() => {
//     if (isEditing && textareaRef.current) {
//       textareaRef.current.focus();
//       textareaRef.current.style.height = 'auto';
//       textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
//     }
//   }, [isEditing]);

//   // Add keyboard navigation for version browsing
//   useEffect(() => {
//     if (hasHistory && !isEditing) {
//       const handleKeyDown = (e) => {
//         if (e.altKey && e.key === 'ArrowLeft') {
//           navigateVersion('prev');
//         } else if (e.altKey && e.key === 'ArrowRight') {
//           navigateVersion('next');
//         }
//       };

//       document.addEventListener('keydown', handleKeyDown);
//       return () => {
//         document.removeEventListener('keydown', handleKeyDown);
//       };
//     }
//   }, [currentVersion, hasHistory, isEditing, versions.length]);

//   const handleEdit = () => {
//     setIsEditing(true);
//     setEditedContent(message.content);
//   };

//   const handleCancel = () => {
//     setIsEditing(false);
//     setEditedContent(message.content);
//   };

//   const handleSave = () => {
//     if (editedContent.trim() !== message.content.trim()) {
//       onUpdate(messageIndex, editedContent);
//     }
//     setIsEditing(false);
//   };

//   const handleTextareaChange = (e) => {
//     setEditedContent(e.target.value);
    
//     // Auto-resize the textarea
//     e.target.style.height = 'auto';
//     e.target.style.height = `${e.target.scrollHeight}px`;
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
//       handleSave();
//     } else if (e.key === 'Escape') {
//       handleCancel();
//     }
//   };

//   const navigateVersion = (direction) => {
//     if (!hasHistory) return;
    
//     let newVersion;
    
//     if (direction === 'prev' && currentVersion > 0) {
//       newVersion = currentVersion - 1;
//     } else if (direction === 'next' && currentVersion < versions.length - 1) {
//       newVersion = currentVersion + 1;
//     } else {
//       return; // Invalid navigation
//     }
    
//     // Call the restore function with message index and version index
//     if (onRestoreVersion) {
//       onRestoreVersion(messageIndex, newVersion);
//     }
//   };

//   return (
//     <div className="relative group pb-8">
//       {message.role === 'user' && !isEditing && (
//         <>
//           <div className="absolute right-0 bottom-0">
//             <button
//               onClick={handleEdit}
//               className="p-2 rounded-lg"
//               title="Edit message"
//             >
//               <Edit className="h-4 w-4 text-gray-300 hover:text-white" />
//             </button>
//           </div>

//           {/* Version history controls */}
//           {(hasHistory || message.edited) && (
//             <div className="absolute bottom-[-30px] right-0 opacity-0 group-hover:opacity-100 transition-opacity">
//               <div className="flex items-center bg-gray-800/80 rounded-lg px-2 py-1 shadow-md">
//                 {/* Navigation controls */}
//                 <div className="flex items-center space-x-1">
//                   <button
//                     onClick={() => navigateVersion('prev')}
//                     disabled={currentVersion === 0}
//                     className={`p-1 rounded-full hover:bg-gray-700 ${currentVersion === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
//                     title="Previous version (Alt+←)"
//                   >
//                     <ChevronLeft className="h-3 w-3" />
//                   </button>
                  
//                   <button 
//                     onClick={() => onOpenHistoryModal && onOpenHistoryModal(messageIndex)}
//                     className="p-1 rounded-full hover:bg-gray-700"
//                     title="View full version history"
//                   >
//                     <Clock className="h-3 w-3" />
//                   </button>
                  
//                   <button
//                     onClick={() => navigateVersion('next')}
//                     disabled={!hasHistory || currentVersion === versions.length - 1}
//                     className={`p-1 rounded-full hover:bg-gray-700 ${!hasHistory || currentVersion === versions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
//                     title="Next version (Alt+→)"
//                   >
//                     <ChevronRight className="h-3 w-3" />
//                   </button>
//                 </div>
                
//                 {/* Version indicator */}
//                 {hasHistory && (
//                   <span className="text-xs ml-2 text-gray-300">
//                     {currentVersion === 0 && versions[0]?.isOriginal ? 'Original' : `v${currentVersion}`}
//                   </span>
//                 )}
//               </div>
//             </div>
//           )}
//         </>
//       )}

//       {isEditing ? (
//         <div className="border border-blue-500/50 rounded-lg p-2 bg-gray-900/50">
//           <textarea
//             ref={textareaRef}
//             value={editedContent}
//             onChange={handleTextareaChange}
//             onKeyDown={handleKeyDown}
//             className="w-full bg-transparent text-white p-2 resize-none focus:outline-none min-h-[100px]"
//           />
//           <div className="flex justify-end space-x-2 mt-1">
//             <button
//               onClick={handleCancel}
//               className="p-1 rounded-md hover:bg-gray-700"
//               title="Cancel (Esc)"
//             >
//               <X className="h-4 w-4 text-gray-400" />
//             </button>
//             <button
//               onClick={handleSave}
//               className="p-1 rounded-md bg-blue-600/70 hover:bg-blue-600"
//               title="Save changes (Ctrl+Enter)"
//             >
//               <Check className="h-4 w-4 text-white" />
//             </button>
//           </div>
//           <div className="text-gray-400 text-xs mt-1">
//             Press Ctrl+Enter to save, Esc to cancel
//           </div>
//         </div>
//       ) : (
//         <div className="message-content">
//           {/* Version indicator badge */}
//           {hasHistory && currentVersion < versions.length - 1 && (
//             <div className="inline-flex items-center bg-amber-500/20 border border-amber-500/30 rounded-full px-2 py-0.5 mb-2">
//               <span className="text-amber-400 text-xs">
//                 {currentVersion === 0 && versions[0]?.isOriginal ? 'Original Version' : `Version ${currentVersion}/${versions.length - 1}`}
//               </span>
//               <ChevronRight className="h-3 w-3 text-amber-400 ml-1" title="Use Alt+→ to view newer versions" />
//             </div>
//           )}
//           {message.content}
//         </div>
//       )}
//     </div>
//   );
// };

// export default EditableMessage;

import React, { useState, useRef, useEffect } from 'react';
import { Edit, Check, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

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
  }, [message.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

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
  };

  const handleSave = () => {
    if (editedContent.trim() !== message.content.trim()) {
      onUpdate(messageIndex, editedContent);
    }
    setIsEditing(false);
  };

  const handleTextareaChange = (e) => {
    setEditedContent(e.target.value);
    
    // Auto-resize the textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
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

  return (
    <div className="relative group pb-8">
      {message.role === 'user' && !isEditing && (
        <>
          <div className="absolute right-0 bottom-0">
            <button
              onClick={handleEdit}
              className="p-2 rounded-lg"
              title="Edit message"
            >
              <Edit className="h-4 w-4 text-gray-300 hover:text-white" />
            </button>
          </div>

          {/* Version history controls */}
          {(hasHistory || message.edited) && (
            <div className="absolute bottom-[-30px] right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center bg-gray-800/80 rounded-lg px-2 py-1 shadow-md">
                {/* Navigation controls */}
                <div className="flex items-center space-x-1">
                  {/* <button
                    onClick={() => navigateVersion('prev')}
                    disabled={currentVersion === 0}
                    className={`p-1 rounded-full hover:bg-gray-700 ${currentVersion === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Previous version (Alt+←)"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button> */}
                  
                  <button 
                    onClick={() => onOpenHistoryModal && onOpenHistoryModal(messageIndex)}
                    className="p-1 rounded-full hover:bg-gray-700"
                    title="View full version history"
                  >
                    <Clock className="h-3 w-3" />
                  </button>
                  
                  {/* <button
                    onClick={() => navigateVersion('next')}
                    disabled={!hasHistory || currentVersion === versions.length - 1}
                    className={`p-1 rounded-full hover:bg-gray-700 ${!hasHistory || currentVersion === versions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Next version (Alt+→)"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button> */}
                </div>
                
                {/* Version indicator */}
                {hasHistory && (
                  <span className="text-xs ml-2 text-gray-300">
                    {currentVersion === 0 && versions[0]?.isOriginal ? 'Original' : `v${currentVersion}`}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {isEditing ? (
        <div className="border border-blue-500/50 rounded-lg p-2 bg-gray-900/50">
          <textarea
            ref={textareaRef}
            value={editedContent}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white p-2 resize-none focus:outline-none min-h-[100px]"
          />
          <div className="flex justify-end space-x-2 mt-1">
            <button
              onClick={handleCancel}
              className="p-1 rounded-md hover:bg-gray-700"
              title="Cancel (Esc)"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={handleSave}
              className="p-1 rounded-md bg-blue-600/70 hover:bg-blue-600"
              title="Save changes (Ctrl+Enter)"
            >
              <Check className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="text-gray-400 text-xs mt-1">
            Press Ctrl+Enter to save, Esc to cancel
          </div>
        </div>
      ) : (
        <div className="message-content">
          {/* Version indicator badge - Only show when viewing a non-current version */}
          {hasHistory && currentVersion !== versions.length - 1 && (
            <div className="inline-flex items-center bg-amber-500/20 border border-amber-500/30 rounded-full px-2 py-0.5 mb-2">
              <span className="text-amber-400 text-xs">
                {currentVersion === 0 && versions[0]?.isOriginal 
                  ? 'Original Version' 
                  : `Version ${currentVersion}/${versions.length - 1}`}
              </span>
              <ChevronRight className="h-3 w-3 text-amber-400 ml-1" title="Use Alt+→ to view newer versions" />
            </div>
          )}
          {message.content}
        </div>
      )}
    </div>
  );
};

export default EditableMessage;