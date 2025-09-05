

/// RightPanel.jsx - Complete component with permission checks
import React, { useState } from 'react';
import { 
  Brain, 
  StickyNote, 
 
  BookOpen, 
 Loader2,
  PanelLeft, 
  PanelRight,
  History,

} from 'lucide-react';
import PropTypes from 'prop-types';
import MindMapHistory from './MindMapHistory';
import { useUser } from '../../context/UserContext';

const RightPanel = ({
  isExpanded,
  onToggle,
  onGenerateMindmap,
  isMindmapGenerating,
  selectedDocuments,
  theme,
  mainProjectId,
  onViewMindmap,
  onDocumentSelectionChange
}) => {
  const [showMindmapHistory, setShowMindmapHistory] = useState(false);
  
  // Get user permissions from context
  const { rightPanelPermissions, loading: permissionsLoading } = useUser();

  // Check feature permissions (true means disabled)
  const isRightPanelDisabled = rightPanelPermissions['right-panel-access'];
  const isMindmapGenerationDisabled = rightPanelPermissions['mindmap-generation'];
  const isMindmapHistoryDisabled = rightPanelPermissions['mindmap-history'];
  const isNotesPanelDisabled = rightPanelPermissions['notes-panel'];

  // If permissions are still loading, show loading state
  if (permissionsLoading) {
    return (
      <div className={`fixed right-0 top-4 bottom-0 w-12 ${
        theme === "dark"
          ? "bg-gray-700/20 backdrop-blur-sm border-l border-gray-700/30"
          : "bg-[#f7f3ea] backdrop-blur-sm border-l border-[#e8ddcc]"
      } z-40 flex flex-col items-center justify-center`}>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#a55233] dark:border-emerald-400"></div>
      </div>
    );
  }

  // If entire right panel is disabled, show disabled state but keep it visible
  const isPanelDisabled = isRightPanelDisabled;

  const handleGenerateNewMindmap = () => {
    if (isMindmapGenerationDisabled) {
      return; // Do nothing if disabled
    }
    onGenerateMindmap(false);
  };

  const handleRegenerateMindmap = (forceRegenerate = false) => {
    if (isMindmapGenerationDisabled) {
      return; // Do nothing if disabled
    }
    onGenerateMindmap(forceRegenerate);
  };

  const handleViewMindmapHistory = () => {
    if (isMindmapHistoryDisabled) {
      return; // Do nothing if disabled
    }
    setShowMindmapHistory(true);
  };

  if (!isExpanded) {
    // Collapsed state
    return (
      <>
        <div className={`fixed right-0 top-4 bottom-0 w-12 ${
          theme === "dark"
            ? "bg-gray-700/20 backdrop-blur-sm border-l border-gray-700/30"
            : "bg-[#f7f3ea] backdrop-blur-sm border-l border-[#e8ddcc]"
        } z-40 flex flex-col items-center pt-14 space-y-6 ${
          isPanelDisabled ? 'opacity-50 pointer-events-none' : ''
        }`}>
          
          {/* Expand Button - disabled if panel is disabled */}
          <button
            onClick={isPanelDisabled ? undefined : onToggle}
            disabled={isPanelDisabled}
            className={`my-4 p-2 ${
              isPanelDisabled
                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                : theme === "dark"
                ? "text-white hover:bg-gray-700"
                : "text-[#5e4636] hover:bg-[#f5e6d8]"
            } rounded-lg transition-colors`}
            title={isPanelDisabled ? "Right panel access disabled by administrator" : "Expand Panel"}
          >
            <PanelRight
              size={20}
              className={
                isPanelDisabled
                  ? "text-gray-400 dark:text-gray-600"
                  : theme === "dark" ? "text-blue-500" : "text-[#c24124]"
              }
            />
          </button>

          {/* Main icons */}
          <div className="flex flex-col items-center space-y-6">
            {/* Notes Button */}
            <button
              onClick={(isPanelDisabled || isNotesPanelDisabled) ? undefined : onToggle}
              disabled={isPanelDisabled || isNotesPanelDisabled}
              className={`p-2 ${
                (isPanelDisabled || isNotesPanelDisabled)
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                  : theme === "dark"
                  ? "text-white hover:bg-gray-700"
                  : "text-[#5e4636] hover:bg-[#f5e6d8]"
              } rounded-full transition-colors`}
              title={
                isPanelDisabled 
                  ? "Right panel access disabled by administrator"
                  : isNotesPanelDisabled 
                    ? "Notes access disabled by administrator" 
                    : "Open Notes"
              }
            >
              <BookOpen
                size={20}
                className={
                  (isPanelDisabled || isNotesPanelDisabled)
                    ? "text-gray-400 dark:text-gray-600"
                    : theme === "dark" ? "text-blue-500" : "text-[#c24124]"
                }
              />
            </button>

            {/* MindMap History Button */}
            <button
              onClick={(isPanelDisabled || isMindmapHistoryDisabled) ? undefined : handleViewMindmapHistory}
              disabled={isPanelDisabled || isMindmapHistoryDisabled}
              className={`p-2 ${
                (isPanelDisabled || isMindmapHistoryDisabled)
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                  : theme === "dark"
                  ? "text-white hover:bg-gray-700"
                  : "text-[#5e4636] hover:bg-[#f5e6d8]"
              } rounded-full transition-colors`}
              title={
                isPanelDisabled 
                  ? "Right panel access disabled by administrator"
                  : isMindmapHistoryDisabled 
                    ? "MindMap history access disabled by administrator" 
                    : "View MindMap History"
              }
            >
              <History
                size={20}
                className={
                  (isPanelDisabled || isMindmapHistoryDisabled)
                    ? "text-gray-400 dark:text-gray-600"
                    : theme === "dark" ? "text-green-400" : "text-[#8B4513]"
                }
              />
            </button>

            {/* Generate New Mindmap Button */}
           <button
  onClick={
    isPanelDisabled || isMindmapGenerationDisabled
      ? undefined
      : handleGenerateNewMindmap
  }
  disabled={
    isPanelDisabled ||
    isMindmapGenerationDisabled ||
    isMindmapGenerating ||
    selectedDocuments.length === 0
  }
  className={`flex-1 p-3 rounded-lg transition-colors flex items-center justify-center relative ${
    isPanelDisabled ||
    isMindmapGenerationDisabled ||
    isMindmapGenerating ||
    selectedDocuments.length === 0
      ? 'bg-transparent text-gray-400 cursor-not-allowed'
      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
  }`}
  title={
    isPanelDisabled
      ? "Right panel access disabled by administrator"
      : isMindmapGenerationDisabled
      ? "MindMap generation disabled by administrator"
      : selectedDocuments.length === 0
      ? "Select documents to generate mindmap"
      : isMindmapGenerating
      ? "Generating mindmap..."
      : `Generate New MindMap (${selectedDocuments.length} docs)`
  }
>
  {isMindmapGenerating ? (
    <Loader2 className="h-5 w-5 animate-spin text-white" />
  ) : (
    <Brain
      className={`h-5 w-5 ${
        isPanelDisabled ||
        isMindmapGenerationDisabled ||
        isMindmapGenerating ||
        selectedDocuments.length === 0
          ? 'text-purple-400 opacity-60'
          : 'text-white'
      }`}
    />
  )}

  {selectedDocuments.length > 0 &&
    !isPanelDisabled &&
    !isMindmapGenerationDisabled &&
    !isMindmapGenerating && (
      <span className="absolute -top-1 -right-1 bg-white text-purple-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-purple-600">
        {selectedDocuments.length > 9 ? "9+" : selectedDocuments.length}
      </span>
    )}
</button>

          </div>

          {/* Add space between main icons and footer */}
          <div className="flex-grow"></div>
          
          {/* Show disabled message at bottom if panel is disabled */}
          {isPanelDisabled && (
            <div className="text-center p-2">
              <p className="text-xs text-gray-400 dark:text-gray-600 transform rotate-90 whitespace-nowrap">
                Access Restricted
              </p>
            </div>
          )}
        </div>

        {/* MindMap History Modal - Only show if panel and feature not disabled */}
        {!isPanelDisabled && !isMindmapHistoryDisabled && (
          <MindMapHistory
            isOpen={showMindmapHistory}
            onClose={() => setShowMindmapHistory(false)}
            mainProjectId={mainProjectId}
            onViewMindmap={onViewMindmap}
            onRegenerateMindmap={handleRegenerateMindmap}
            selectedDocuments={selectedDocuments}
            onDocumentSelectionChange={onDocumentSelectionChange}
          />
        )}
      </>
    );
  }

  // Expanded state
  return (
    <>
      <div className={`fixed right-0 top-16 bottom-0 w-80 z-30 
                      bg-[#f9f7f4] dark:bg-gray-900/95 
                      border-l border-[#e3d5c8] dark:border-blue-500/20 
                      shadow-2xl backdrop-blur-md
                      flex flex-col overflow-hidden ${
                        isPanelDisabled ? 'opacity-50 pointer-events-none' : ''
                      }`}>
        
        {/* Header with Notes title and MindMap buttons */}
        <div className="p-4 border-b border-[#e3d5c8] dark:border-blue-500/20 
                        bg-[#f0eee5] dark:bg-gray-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-[#5e4636] dark:text-white">
                Notes & MindMaps
                {isPanelDisabled && (
                  <span className="ml-2 text-xs text-red-500 dark:text-red-400 font-normal">
                    (Access Restricted)
                  </span>
                )}
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Collapse Button - disabled if panel access is disabled */}
              <button
                onClick={isPanelDisabled ? undefined : onToggle}
                disabled={isPanelDisabled}
                className={`${
                  isPanelDisabled
                    ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : "text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50"
                } p-2 rounded-full transition-colors`}
                title={isPanelDisabled ? "Right panel access disabled by administrator" : "Collapse Panel"}
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Show disabled message if panel is disabled */}
          {isPanelDisabled && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Access Restricted
                  </h3>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                    <p>Right panel access has been disabled by your administrator.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

{/* MindMap Controls */}
<div className="space-y-3">
  {/* Buttons Row - Icon Only */}
  <div className="flex space-x-3">
    {/* View History Button - Icon Only */}
    <button
      onClick={(isPanelDisabled || isMindmapHistoryDisabled) ? undefined : handleViewMindmapHistory}
      disabled={isPanelDisabled || isMindmapHistoryDisabled}
      className={`flex-1 p-3 rounded-lg transition-colors flex items-center justify-center ${
        (isPanelDisabled || isMindmapHistoryDisabled)
          ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
          : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
      }`}
      title={
        isPanelDisabled 
          ? "Right panel access disabled by administrator"
          : isMindmapHistoryDisabled 
            ? "MindMap history disabled by administrator" 
            : "View MindMap History"
      }
    >
      <History className="h-5 w-5" />
    </button>

    {/* Generate New Mindmap Button - Icon Only */}
    <button
      onClick={(isPanelDisabled || isMindmapGenerationDisabled) ? undefined : handleGenerateNewMindmap}
      disabled={isPanelDisabled || isMindmapGenerationDisabled || isMindmapGenerating || selectedDocuments.length === 0}
      className={`flex-1 p-3 rounded-lg transition-colors flex items-center justify-center relative ${
        (isPanelDisabled || isMindmapGenerationDisabled || isMindmapGenerating || selectedDocuments.length === 0)
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
      }`}
      title={
        isPanelDisabled
          ? "Right panel access disabled by administrator"
          : isMindmapGenerationDisabled
            ? "MindMap generation disabled by administrator"
            : selectedDocuments.length === 0 
              ? "Select documents to generate mindmap" 
              : isMindmapGenerating 
                ? "Generating mindmap..." 
                : `Generate New MindMap (${selectedDocuments.length} docs)`
      }
    >
      <Brain className={`h-5 w-5 ${isMindmapGenerating ? 'animate-pulse' : ''}`} />
      
      {/* Badge showing selected documents count - positioned on the button */}
      {selectedDocuments.length > 0 && !isPanelDisabled && !isMindmapGenerationDisabled && (
        <span className="absolute -top-1 -right-1 bg-white text-purple-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-purple-600">
          {selectedDocuments.length > 9 ? "9+" : selectedDocuments.length}
        </span>
      )}
    </button>
  </div>

  {/* Document count text below buttons */}
  {selectedDocuments.length > 0 && !isPanelDisabled && !isMindmapGenerationDisabled && (
    <div className="text-xs text-[#8c715f] dark:text-gray-400 text-center">
      {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
    </div>
  )}
</div>
        </div>

        {/* Rest of the panel content (Notes, etc.) */}
        <div className="flex-1 overflow-auto p-4">
          {isPanelDisabled ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Right panel access disabled by administrator</p>
            </div>
          ) : isNotesPanelDisabled ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-8">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Notes access disabled by administrator</p>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <StickyNote className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Notes functionality coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* MindMap History Modal - Only show if panel and feature not disabled */}
      {!isPanelDisabled && !isMindmapHistoryDisabled && (
        <MindMapHistory
          isOpen={showMindmapHistory}
          onClose={() => setShowMindmapHistory(false)}
          mainProjectId={mainProjectId}
          onViewMindmap={onViewMindmap}
          onRegenerateMindmap={handleRegenerateMindmap}
          selectedDocuments={selectedDocuments}
          onDocumentSelectionChange={onDocumentSelectionChange}
        />
      )}
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
  onViewMindmap: PropTypes.func.isRequired,
  onDocumentSelectionChange: PropTypes.func.isRequired
};

export default RightPanel;