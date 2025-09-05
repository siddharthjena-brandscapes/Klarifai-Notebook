// import React, { useState, useEffect } from 'react';
// import {
//   Clock,
//   ChevronLeft,
//   ChevronRight,
//   X,
//   Check,
//   User,
//   Calendar,
//   Bot
// } from 'lucide-react';

// const MessageVersionHistory = ({
//   messageVersions,
//   messageIndex,
//   onRestoreVersion,
//   onClose,
//   conversation
// }) => {
//   // Get versions for this message
//   const versions = messageVersions[messageIndex] || [];
//   // Initialize state with a safe index (defaulting to 0 if no versions exist)
//   const [selectedVersionIndex, setSelectedVersionIndex] = useState(versions.length > 0 ? versions.length - 1 : 0);

//   // If no versions, show a fallback UI
//   if (versions.length === 0) {
//     const currentMessage = conversation[messageIndex];
//     if (currentMessage?.edited) {
//       return (
//         <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
//           <div className="bg-gray-900 border border-blue-500/30 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
//             <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-blue-500/20 p-4 flex justify-between items-center">
//               <div className="flex items-center">
//                 <Clock className="h-5 w-5 text-blue-400 mr-2" />
//                 <h2 className="text-xl font-bold text-white">Message History</h2>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700/50"
//               >
//                 <X className="h-5 w-5" />
//               </button>
//             </div>

//             <div className="flex-1 p-6 flex flex-col items-center justify-center">
//               <div className="text-center text-gray-400 mb-4">
//                 <p>This message has been edited, but version history is not available yet.</p>
//                 <p className="mt-2">The history will be available after the next edit.</p>
//               </div>

//               <button
//                 onClick={onClose}
//                 className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white flex items-center mt-4"
//               >
//                 <Check className="h-4 w-4 mr-2" />
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       );
//     }
//     return null;
//   }

//   // Get the currently selected version (with additional safety check)
//   const currentVersion = versions && selectedVersionIndex < versions.length
//     ? versions[selectedVersionIndex] || {}
//     : {};

//   // Format timestamp
//   const formatTimestamp = (timestamp) => {
//     if (!timestamp) return 'Unknown time';
//     try {
//       const date = new Date(timestamp);
//       return date.toLocaleString();
//     } catch (e) {
//       return timestamp;
//     }
//   };

//   // Handle version selection
//   const handleVersionChange = (index) => {
//     // Make sure the index is valid
//     if (index < 0 || index >= versions.length) {
//       console.error(`Invalid version index: ${index}. Available versions: ${versions.length}`);
//       return;
//     }

//     setSelectedVersionIndex(index);
//     if (onRestoreVersion) {
//       onRestoreVersion(messageIndex, index);
//     }
//   };

//   // Handle navigation between versions
//   const handleNavigation = (direction) => {
//     const newIndex = direction === 'prev'
//       ? Math.max(0, selectedVersionIndex - 1)
//       : Math.min(versions.length - 1, selectedVersionIndex + 1);

//     handleVersionChange(newIndex);
//   };

//   // Add keyboard navigation
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === 'ArrowLeft') {
//         handleNavigation('prev');
//       } else if (e.key === 'ArrowRight') {
//         handleNavigation('next');
//       } else if (e.key === 'Escape') {
//         onClose();
//       }
//     };

//     document.addEventListener('keydown', handleKeyDown);
//     return () => {
//       document.removeEventListener('keydown', handleKeyDown);
//     };
//   }, [selectedVersionIndex, versions.length]);

//   return (
//     <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
//       <div className="bg-gray-900 border border-blue-500/30 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-blue-500/20 p-4 flex justify-between items-center">
//           <div className="flex items-center">
//             <Clock className="h-5 w-5 text-blue-400 mr-2" />
//             <h2 className="text-xl font-bold text-white">Message Version History</h2>
//           </div>
//           <button
//             onClick={onClose}
//             className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700/50"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         {/* Navigation */}
//         <div className="bg-gray-800/50 border-b border-blue-500/10 p-3 flex items-center justify-between">
//           <div className="flex items-center">
//             <button
//               onClick={() => handleNavigation('prev')}
//               disabled={selectedVersionIndex === 0}
//               className={`p-1 rounded-full hover:bg-gray-700 ${selectedVersionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
//               aria-label="Previous version"
//             >
//               <ChevronLeft className="h-5 w-5 text-white"/>
//             </button>

//             <span className="mx-3 text-gray-300">
//               Version {selectedVersionIndex + 1} of {versions.length}
//             </span>

//             <button
//               onClick={() => handleNavigation('next')}
//               disabled={selectedVersionIndex === versions.length - 1}
//               className={`p-1 rounded-full hover:bg-gray-700 ${selectedVersionIndex === versions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
//               aria-label="Next version"
//             >
//               <ChevronRight className="h-5 w-5 text-white" />
//             </button>
//           </div>

//           <div className="flex items-center text-gray-400 text-sm">
//             <Calendar className="h-4 w-4 mr-1" />
//             <span>{formatTimestamp(currentVersion.timestamp)}</span>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-4 space-y-4">
//           {/* User Message */}
//           <div className="bg-gradient-to-r from-blue-600/30 to-emerald-600/30 border border-emerald-500/20 p-4 rounded-lg">
//             <div className="flex items-center mb-2">
//               <User className="h-5 w-5 mr-2" />
//               <span className="font-bold text-white">Your Message</span>
//               {currentVersion.isOriginal && (
//                 <span className="ml-2 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
//                   Original
//                 </span>
//               )}
//               {currentVersion.isEdited && (
//                 <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
//                   Edited
//                 </span>
//               )}
//             </div>
//             <div className='text-white'>{currentVersion.content || 'Content not available'}</div>
//           </div>

//           {/* AI Response */}
//           {currentVersion.response && (
//             <div className="bg-gray-800/50 border border-blue-500/20 p-4 rounded-lg">
//               <div className="flex items-center mb-2">
//                 <Bot className="mr-2 h-5 w-5 text-blue-400" />
//                 <span className="font-bold text-white">Klarifai</span>
//               </div>
//               <div
//                 className='text-white'
//                 dangerouslySetInnerHTML={{
//                   __html: currentVersion && currentVersion.response && currentVersion.response.content
//                     ? currentVersion.response.content
//                       .replace(/<p>/g, '<p class="mb-4">')
//                       .replace(/<b>/g, '<b class="block mb-2 mt-2">')
//                       .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-4">')
//                       .replace(/<ol>/g, '<ol class="list-decimal pl-6 mb-4">')
//                       .replace(/<li>/g, '<li class="mb-2">')
//                       .replace(/<table>/g, '<table class="w-full border-collapse border border-gray-500 mt-4 mb-4">')
//                       .replace(/<th>/g, '<th class="border border-gray-500 bg-gray-700 text-white p-2">')
//                       .replace(/<td>/g, '<td class="border border-gray-500 p-2">')
//                       .replace(/<\/table>\s*<p>/g, '</table><p class="mt-4">')
//                       .replace(/\n{3,}/g, "\n\n")
//                       .replace(/<\/b>\s*\n+/g, "</b>\n")
//                     : 'No response available for this version'
//                 }}
//               />
//             </div>
//           )}
//         </div>

//         {/* Footer Actions */}
//         <div className="bg-gray-800/50 border-t border-blue-500/20 p-3 flex justify-between">
//           <div className="flex items-center text-gray-400 text-sm">
//             <span className="mr-2">Use keyboard arrow keys ◀ ▶ to navigate between versions</span>
//           </div>

//           <button
//             onClick={() => {
//               // Use this version and close the modal
//               onRestoreVersion(messageIndex, selectedVersionIndex);
//               onClose();
//             }}
//             className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white flex items-center"
//           >
//             <Check className="h-4 w-4 mr-2" />
//             Use This Version
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MessageVersionHistory;

import React, { useState, useEffect } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  User,
  Calendar,
  Bot,
} from "lucide-react";

const MessageVersionHistory = ({
  messageVersions,
  messageIndex,
  onRestoreVersion,
  onClose,
  conversation,
}) => {
  // Get versions for this message
  const versions = messageVersions[messageIndex] || [];
  // Initialize state with a safe index (defaulting to 0 if no versions exist)
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(
    versions.length > 0 ? versions.length - 1 : 0
  );

  // If no versions, show a fallback UI
  if (versions.length === 0) {
    const currentMessage = conversation[messageIndex];
    if (currentMessage?.edited) {
      return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white/80 dark:bg-gray-900 border border-[#e8ddcc] dark:border-blue-500/30 rounded-xl shadow-md dark:shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-[#f5e6d8] to-[#e9dcc9] dark:from-gray-800 dark:to-gray-900 border-b border-[#d6cbbf] dark:border-blue-500/20 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-[#a55233] dark:text-blue-400 mr-2" />
                <h2 className="text-xl font-bold text-[#0a3b25] dark:text-white">
                  Message History
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-[#5a544a] hover:text-[#5e4636] dark:text-gray-400 dark:hover:text-white p-1 rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-700/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#faf4ee]/50 dark:bg-transparent">
              <div className="text-center text-[#5a544a] dark:text-gray-400 mb-4">
                <p>
                  This message has been edited, but version history is not
                  available yet.
                </p>
                <p className="mt-2">
                  The history will be available after the next edit.
                </p>
              </div>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg text-white flex items-center mt-4"
              >
                <Check className="h-4 w-4 mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Get the currently selected version (with additional safety check)
  const currentVersion =
    versions && selectedVersionIndex < versions.length
      ? versions[selectedVersionIndex] || {}
      : {};

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown time";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  // Handle version selection
  const handleVersionChange = (index) => {
    // Make sure the index is valid
    if (index < 0 || index >= versions.length) {
      console.error(
        `Invalid version index: ${index}. Available versions: ${versions.length}`
      );
      return;
    }

    setSelectedVersionIndex(index);
    if (onRestoreVersion) {
      onRestoreVersion(messageIndex, index);
    }
  };

  // Handle navigation between versions
  const handleNavigation = (direction) => {
    const newIndex =
      direction === "prev"
        ? Math.max(0, selectedVersionIndex - 1)
        : Math.min(versions.length - 1, selectedVersionIndex + 1);

    handleVersionChange(newIndex);
  };

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        handleNavigation("prev");
      } else if (e.key === "ArrowRight") {
        handleNavigation("next");
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedVersionIndex, versions.length]);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-white/80 dark:bg-gray-900 border border-[#e8ddcc] dark:border-blue-500/30 rounded-xl shadow-md dark:shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#f5e6d8] to-[#e9dcc9] dark:from-gray-800 dark:to-gray-900 border-b border-[#d6cbbf] dark:border-blue-500/20 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-[#a55233] dark:text-blue-400 mr-2" />
            <h2 className="text-xl font-bold text-[#0a3b25] dark:text-white">
              Message Version History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#5a544a] hover:text-[#5e4636] dark:text-gray-400 dark:hover:text-white p-1 rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-700/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="bg-[#faf4ee] dark:bg-gray-800/50 border-b border-[#e3d5c8] dark:border-blue-500/10 p-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => handleNavigation("prev")}
              disabled={selectedVersionIndex === 0}
              className={`p-1 rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-700 ${
                selectedVersionIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              aria-label="Previous version"
            >
              <ChevronLeft className="h-5 w-5 text-[#5e4636] dark:text-white" />
            </button>

            <span className="mx-3 text-[#5e4636] dark:text-gray-300">
              Version {selectedVersionIndex + 1} of {versions.length}
            </span>

            <button
              onClick={() => handleNavigation("next")}
              disabled={selectedVersionIndex === versions.length - 1}
              className={`p-1 rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-700 ${
                selectedVersionIndex === versions.length - 1
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              aria-label="Next version"
            >
              <ChevronRight className="h-5 w-5 text-[#5e4636] dark:text-white" />
            </button>
          </div>

          <div className="flex items-center text-[#5a544a] dark:text-gray-400 text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formatTimestamp(currentVersion.timestamp)}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf4ee]/50 dark:bg-transparent">
          {/* User Message */}
          <div className="bg-gradient-to-r from-[#556052]/10 to-[#a55233]/10 dark:from-blue-600/30 dark:to-emerald-600/30 border border-[#a55233]/20 dark:border-emerald-500/20 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <User className="h-5 w-5 mr-2 text-[#556052] dark:text-white" />
              <span className="font-bold text-[#0a3b25] dark:text-white">
                Your Message
              </span>
              {currentVersion.isOriginal && (
                <span className="ml-2 text-xs bg-[#a55233]/10 text-[#a55233] dark:bg-amber-500/20 dark:text-amber-300 px-2 py-0.5 rounded-full">
                  Original
                </span>
              )}
              {currentVersion.isEdited && (
                <span className="ml-2 text-xs bg-[#556052]/20 text-[#556052] dark:bg-blue-500/20 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  Edited
                </span>
              )}
            </div>
            <div className="text-[#5e4636] dark:text-white">
              {currentVersion.content || "Content not available"}
            </div>
          </div>

          {/* AI Response */}
          {currentVersion.response && (
            <div className="bg-white/80 dark:bg-gray-800/50 border border-[#d6cbbf] dark:border-blue-500/20 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Bot className="mr-2 h-5 w-5 text-[#a55233] dark:text-blue-400" />
                <span className="font-bold text-[#0a3b25] dark:text-white">
                  Klarifai
                </span>
              </div>
              <div
                className="text-[#5e4636] dark:text-white"
                dangerouslySetInnerHTML={{
                  __html:
                    currentVersion &&
                    currentVersion.response &&
                    currentVersion.response.content
                      ? currentVersion.response.content
                          .replace(/<p>/g, '<p class="mb-4">')
                          .replace(/<b>/g, '<b class="block mb-2 mt-2">')
                          .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-4">')
                          .replace(
                            /<ol>/g,
                            '<ol class="list-decimal pl-6 mb-4">'
                          )
                          .replace(/<li>/g, '<li class="mb-2">')
                          .replace(
                            /<table>/g,
                            '<table class="w-full border-collapse border border-gray-500 mt-4 mb-4">'
                          )
                          .replace(
                            /<th>/g,
                            '<th class="border border-gray-500 bg-[#e9dcc9] dark:bg-gray-700 text-[#5e4636] dark:text-white p-2">'
                          )
                          .replace(
                            /<td>/g,
                            '<td class="border border-[#e3d5c8] dark:border-gray-500 p-2">'
                          )
                          .replace(
                            /<\/table>\s*<p>/g,
                            '</table><p class="mt-4">'
                          )
                          .replace(/\n{3,}/g, "\n\n")
                          .replace(/<\/b>\s*\n+/g, "</b>\n")
                      : "No response available for this version",
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#faf4ee] dark:bg-gray-800/50 border-t border-[#e3d5c8] dark:border-blue-500/20 p-3 flex justify-between">
          <div className="flex items-center text-[#5a544a] dark:text-gray-400 text-sm">
            <span className="mr-2">
              Use keyboard arrow keys ◀ ▶ to navigate between versions
            </span>
          </div>

          <button
            onClick={() => {
              // Use this version and close the modal
              onRestoreVersion(messageIndex, selectedVersionIndex);
              onClose();
            }}
            className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg text-white flex items-center"
          >
            <Check className="h-4 w-4 mr-2" />
            Use This Version
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageVersionHistory;
