// // RightPanel.jsx - Improved with larger icons and better visual similarity
// import React from 'react';
// import { Brain, StickyNote, ChevronLeft, ChevronRight, BookOpen, PanelLeftClose, PanelLeft, PanelRight } from 'lucide-react';
// import PropTypes from 'prop-types';

// const RightPanel = ({
//   isExpanded,
//   onToggle,
//   onGenerateMindmap,
//   isMindmapGenerating,
//   selectedDocuments,
//   theme
// }) => {
//   if (!isExpanded) {
//     // Collapsed state - matching left sidebar exactly
//     return (
//       <div className={`fixed right-0 top-4 bottom-0 w-12 ${
//         theme === "dark"
//           ? "bg-gray-700/20 backdrop-blur-sm border-l border-gray-700/30"
//           : "bg-[#f7f3ea] backdrop-blur-sm border-l border-[#e8ddcc]"
//       } z-40 flex flex-col items-center pt-14 space-y-6`}>
        
//         {/* Expand Button */}
//         <button
//           onClick={onToggle}
//           className={`my-4 p-2 ${
//             theme === "dark"
//               ? "text-white hover:bg-gray-700"
//               : "text-[#5e4636] hover:bg-[#f5e6d8]"
//           } rounded-lg transition-colors`}
//           title="Expand Panel"
//         >
//           <PanelRight
//             size={20}
//             className={theme === "dark" ? "text-blue-500" : "text-[#c24124]"}
//           />
//         </button>

//         {/* Main icons */}
//         <div className="flex flex-col items-center space-y-6">
//           {/* Notes Button */}
//           <button
//             onClick={onToggle}
//             className={`p-2 ${
//               theme === "dark"
//                 ? "text-white hover:bg-gray-700"
//                 : "text-[#5e4636] hover:bg-[#f5e6d8]"
//             } rounded-full transition-colors`}
//             title="Open Notes"
//           >
//             <BookOpen
//               size={20}
//               className={theme === "dark" ? "text-blue-500" : "text-[#c24124]"}
//             />
//           </button>

//           {/* Mindmap Button */}
//           <button
//   onClick={onGenerateMindmap}
//   disabled={isMindmapGenerating || selectedDocuments.length === 0}
//   className={`p-2 ${
//     (isMindmapGenerating || selectedDocuments.length === 0)
//       ? 'text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-70 bg-gray-100 dark:bg-gray-800/50'
//       : theme === "dark"
//       ? "text-white hover:bg-gray-700"
//       : "text-[#5e4636] hover:bg-[#f5e6d8]"
//   } rounded-full transition-colors relative`}
//   title={
//     selectedDocuments.length === 0 
//       ? "Select documents to generate mindmap" 
//       : isMindmapGenerating 
//         ? "Generating mindmap..." 
//         : `Generate Mindmap (${selectedDocuments.length} docs)`
//   }
// >
//   <Brain
//     size={20}
//     className={
//       (isMindmapGenerating || selectedDocuments.length === 0)
//         ? 'text-gray-600 dark:text-gray-300'  // More visible disabled state
//         : theme === "dark" 
//           ? "text-purple-400" 
//           : "text-[#7a5741]"
//     }
//   />
            
            
//             {/* Badge showing selected documents count */}
//             {selectedDocuments.length > 0 && (
//               <div className="absolute -top-1 -right-1 bg-[#a44704] dark:bg-blue-500 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
//                 {selectedDocuments.length > 99
//                   ? "99+"
//                   : selectedDocuments.length}
//               </div>
//             )}
//           </button>
//         </div>

//         {/* Add space between main icons and footer */}
//         <div className="flex-grow"></div>
//       </div>
//     );
//   }

//   // Expanded state - show header with collapse button
//   return (
//     <div className="fixed right-0 top-16 bottom-0 w-80 z-30 
//                     bg-[#f9f7f4] dark:bg-gray-900/95 
//                     border-l border-[#e3d5c8] dark:border-blue-500/20 
//                     shadow-2xl backdrop-blur-md
//                     flex flex-col overflow-hidden">
      
//       {/* Header with Notes title and Mindmap button */}
//       <div className="p-4 border-b border-[#e3d5c8] dark:border-blue-500/20 
//                       bg-[#f0eee5] dark:bg-gray-800/80">
//         <div className="flex items-center justify-between mb-3">
//           <div className="flex items-center space-x-2">
//             <BookOpen className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
//             <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
//               Notes
//             </h2>
//           </div>
          
//           <div className="flex items-center space-x-2">
//             {/* Mindmap Button - Integrated in header */}
//             <button
//               onClick={onGenerateMindmap}
//               disabled={isMindmapGenerating || selectedDocuments.length === 0}
//               className={`p-2 rounded-lg transition-colors flex items-center space-x-1
//                          ${(isMindmapGenerating || selectedDocuments.length === 0)
//                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
//                            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
//                          }`}
//               title={
//                 selectedDocuments.length === 0 
//                   ? "Select documents to generate mindmap" 
//                   : isMindmapGenerating 
//                     ? "Generating mindmap..." 
//                     : `Generate Mindmap (${selectedDocuments.length} docs)`
//               }
//             >
//               <Brain className={`h-4 w-4 ${isMindmapGenerating ? 'animate-pulse' : ''}`} />
//               <span className="text-xs hidden lg:inline">
//                 {isMindmapGenerating ? 'Generating...' : 'Mindmap'}
//               </span>
//             </button>

//             {/* Collapse Button */}
//             <button
//               onClick={onToggle}
//               className="text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
//                          p-2 rounded-full hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50
//                          transition-colors"
//               title="Collapse Panel"
//             >
//               <PanelLeft className="h-4 w-4" />
//             </button>
//           </div>
//         </div>

//         {selectedDocuments.length > 0 && (
//           <div className="text-xs text-[#8c715f] dark:text-gray-400">
//             {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// RightPanel.propTypes = {
//   isExpanded: PropTypes.bool.isRequired,
//   onToggle: PropTypes.func.isRequired,
//   onGenerateMindmap: PropTypes.func.isRequired,
//   isMindmapGenerating: PropTypes.bool.isRequired,
//   selectedDocuments: PropTypes.array.isRequired,
//   theme: PropTypes.string.isRequired
// };

// export default RightPanel;


// RightPanel.jsx - Enhanced with mindmap history integration
import React, { useState } from 'react';
import { 
  Brain, 
  StickyNote, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  PanelLeftClose, 
  PanelLeft, 
  PanelRight,
  History,
  Plus
} from 'lucide-react';
import PropTypes from 'prop-types';
import MindMapHistory from './MindMapHistory'; // Import the history component

const RightPanel = ({
  isExpanded,
  onToggle,
  onGenerateMindmap,
  isMindmapGenerating,
  selectedDocuments,
  theme,
  mainProjectId,
  onViewMindmap // New prop for viewing existing mindmaps
}) => {
  const [showMindmapHistory, setShowMindmapHistory] = useState(false);

  const handleGenerateNewMindmap = () => {
    onGenerateMindmap(false); // Generate new mindmap
  };

  const handleRegenerateMindmap = (forceRegenerate = false) => {
    onGenerateMindmap(forceRegenerate);
  };

  const handleViewMindmapHistory = () => {
    setShowMindmapHistory(true);
  };

  if (!isExpanded) {
    // Collapsed state - matching left sidebar exactly
    return (
      <>
        <div className={`fixed right-0 top-4 bottom-0 w-12 ${
          theme === "dark"
            ? "bg-gray-700/20 backdrop-blur-sm border-l border-gray-700/30"
            : "bg-[#f7f3ea] backdrop-blur-sm border-l border-[#e8ddcc]"
        } z-40 flex flex-col items-center pt-14 space-y-6`}>
          
          {/* Expand Button */}
          <button
            onClick={onToggle}
            className={`my-4 p-2 ${
              theme === "dark"
                ? "text-white hover:bg-gray-700"
                : "text-[#5e4636] hover:bg-[#f5e6d8]"
            } rounded-lg transition-colors`}
            title="Expand Panel"
          >
            <PanelRight
              size={20}
              className={theme === "dark" ? "text-blue-500" : "text-[#c24124]"}
            />
          </button>

          {/* Main icons */}
          <div className="flex flex-col items-center space-y-6">
            {/* Notes Button */}
            <button
              onClick={onToggle}
              className={`p-2 ${
                theme === "dark"
                  ? "text-white hover:bg-gray-700"
                  : "text-[#5e4636] hover:bg-[#f5e6d8]"
              } rounded-full transition-colors`}
              title="Open Notes"
            >
              <BookOpen
                size={20}
                className={theme === "dark" ? "text-blue-500" : "text-[#c24124]"}
              />
            </button>

            {/* MindMap History Button */}
            <button
              onClick={handleViewMindmapHistory}
              className={`p-2 ${
                theme === "dark"
                  ? "text-white hover:bg-gray-700"
                  : "text-[#5e4636] hover:bg-[#f5e6d8]"
              } rounded-full transition-colors`}
              title="View MindMap History"
            >
              <History
                size={20}
                className={theme === "dark" ? "text-green-400" : "text-[#8B4513]"}
              />
            </button>

            {/* Generate New Mindmap Button */}
            <button
              onClick={handleGenerateNewMindmap}
              disabled={isMindmapGenerating || selectedDocuments.length === 0}
              className={`p-2 ${
                (isMindmapGenerating || selectedDocuments.length === 0)
                  ? 'text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-70 bg-gray-100 dark:bg-gray-800/50'
                  : theme === "dark"
                  ? "text-white hover:bg-gray-700"
                  : "text-[#5e4636] hover:bg-[#f5e6d8]"
              } rounded-full transition-colors relative`}
              title={
                selectedDocuments.length === 0 
                  ? "Select documents to generate mindmap" 
                  : isMindmapGenerating 
                    ? "Generating mindmap..." 
                    : `Generate New Mindmap (${selectedDocuments.length} docs)`
              }
            >
              <Brain
                size={20}
                className={
                  (isMindmapGenerating || selectedDocuments.length === 0)
                    ? 'text-gray-600 dark:text-gray-300'
                    : theme === "dark" 
                      ? "text-purple-400" 
                      : "text-[#7a5741]"
                }
              />
              
              {/* Badge showing selected documents count */}
              {selectedDocuments.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#a44704] dark:bg-blue-500 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                  {selectedDocuments.length > 99
                    ? "99+"
                    : selectedDocuments.length}
                </div>
              )}
            </button>
          </div>

          {/* Add space between main icons and footer */}
          <div className="flex-grow"></div>
        </div>

        {/* MindMap History Modal */}
        <MindMapHistory
          isOpen={showMindmapHistory}
          onClose={() => setShowMindmapHistory(false)}
          mainProjectId={mainProjectId}
          onViewMindmap={onViewMindmap}
          onRegenerateMindmap={handleRegenerateMindmap}
          selectedDocuments={selectedDocuments}
        />
      </>
    );
  }

  // Expanded state - show header with collapse button
  return (
    <>
      <div className="fixed right-0 top-16 bottom-0 w-80 z-30 
                      bg-[#f9f7f4] dark:bg-gray-900/95 
                      border-l border-[#e3d5c8] dark:border-blue-500/20 
                      shadow-2xl backdrop-blur-md
                      flex flex-col overflow-hidden">
        
        {/* Header with Notes title and MindMap buttons */}
        <div className="p-4 border-b border-[#e3d5c8] dark:border-blue-500/20 
                        bg-[#f0eee5] dark:bg-gray-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
                Notes & MindMaps
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Collapse Button */}
              <button
                onClick={onToggle}
                className="text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                           p-2 rounded-full hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50
                           transition-colors"
                title="Collapse Panel"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* MindMap Controls */}
          <div className="space-y-3">
            {/* View History Button */}
            <button
              onClick={handleViewMindmapHistory}
              className="w-full p-3 rounded-lg transition-colors flex items-center space-x-2
                         bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
              title="View MindMap History"
            >
              <History className="h-4 w-4" />
              <span className="text-sm font-medium">View MindMap History</span>
            </button>

            {/* Generate New Mindmap Button */}
            <button
              onClick={handleGenerateNewMindmap}
              disabled={isMindmapGenerating || selectedDocuments.length === 0}
              className={`w-full p-3 rounded-lg transition-colors flex items-center space-x-2
                         ${(isMindmapGenerating || selectedDocuments.length === 0)
                           ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                           : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                         }`}
              title={
                selectedDocuments.length === 0 
                  ? "Select documents to generate mindmap" 
                  : isMindmapGenerating 
                    ? "Generating mindmap..." 
                    : `Generate New MindMap (${selectedDocuments.length} docs)`
              }
            >
              <Brain className={`h-4 w-4 ${isMindmapGenerating ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium">
                {isMindmapGenerating ? 'Generating...' : 'Generate New MindMap'}
              </span>
              {selectedDocuments.length > 0 && !isMindmapGenerating && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                  {selectedDocuments.length}
                </span>
              )}
            </button>

            {selectedDocuments.length > 0 && (
              <div className="text-xs text-[#8c715f] dark:text-gray-400">
                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </div>

        {/* Rest of the panel content (Notes, etc.) */}
        <div className="flex-1 overflow-auto p-4">
          {/* Add your notes content here */}
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <StickyNote className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Notes functionality coming soon...</p>
          </div>
        </div>
      </div>

      {/* MindMap History Modal */}
      <MindMapHistory
        isOpen={showMindmapHistory}
        onClose={() => setShowMindmapHistory(false)}
        mainProjectId={mainProjectId}
        onViewMindmap={onViewMindmap}
        onRegenerateMindmap={handleRegenerateMindmap}
        selectedDocuments={selectedDocuments}
      />
    </>
  );
};

RightPanel.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onGenerateMindmap: PropTypes.func.isRequired,
  isMindmapGenerating: PropTypes.bool.isRequired,
  selectedDocuments: PropTypes.array.isRequired,
  theme: PropTypes.string.isRequired,
  mainProjectId: PropTypes.string.isRequired,
  onViewMindmap: PropTypes.func.isRequired
};

export default RightPanel;