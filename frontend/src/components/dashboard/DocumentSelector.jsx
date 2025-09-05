// DocumentSelector.jsx with improved error handling and project ID management
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileText, Layers, AlertTriangle, ExternalLink, Download } from 'lucide-react';
import { toast } from 'react-toastify';

const DocumentSelector = ({ 
  documents, 
  selectedDocuments, 
  activeDocumentId,
  isConsolidatedView,
  onDocumentChange,
  onConsolidatedView,
  isConsolidatedSummaryLoading,
  mainProjectId,
   // Passed from parent component
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionError, setSelectionError] = useState(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Find the currently active document
  const activeDocument = documents.find(doc => doc.id.toString() === activeDocumentId);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Validate parameters and get project ID from localStorage if missing
  useEffect(() => {
    // First try to use passed prop, then fall back to localStorage
    let projectId = mainProjectId;
    
    if (!projectId) {
      projectId = localStorage.getItem('currentProjectId');
      console.log('DocumentSelector: Retrieved projectId from localStorage:', projectId);
    }
    
    // Check if projectId is available from either source
    if (!projectId) {
      console.error('DocumentSelector: projectId is missing from both props and localStorage');
      setSelectionError('Project ID is missing. Document selection may not work properly.');
    } else {
      console.log(`DocumentSelector: Using projectId: ${projectId}`);
      setSelectionError(null);
    }
  }, [mainProjectId]);

  // Handle document selection with validation
  const handleSelect = (docId) => {
    setLoading(true);
    
    // Get project ID from props or localStorage
    const projectId = mainProjectId || localStorage.getItem('currentProjectId');
    
    // Validate projectId
    if (!projectId) {
      console.error('DocumentSelector: Cannot select document without projectId');
      toast.error('Cannot select document: Project ID is missing');
      setLoading(false);
      return;
    }

    if (docId === 'consolidated') {
      onConsolidatedView();
      console.log('Switched to consolidated view');
    } else {
      console.log(`Selecting document: ${docId} for project: ${projectId}`);
      
      // Track document view (optional, if you have this service)
      try {
        // Only if you have this service available
        // documentService.trackDocumentView(docId, projectId)
        //   .catch(err => console.warn("Failed to log document view:", err));
      } catch (err) {
        // Non-blocking error
        console.warn("Failed to log document view:", err);
      }
      
      // Pass the docId and ensure the event object structure is correct
      onDocumentChange({ target: { value: docId } });
      
      // Log success for debugging
      console.log(`Document selection event triggered for ID: ${docId}`);
    }
    
    setIsOpen(false);
    setLoading(false);
  };

  // Function to log and debug document selection issues
  const debugDocumentSelection = (docId) => {
    console.group('Document Selection Debug');
    console.log('Selected document ID:', docId);
    console.log('mainProjectId:', mainProjectId || localStorage.getItem('currentProjectId'));
    console.log('All documents:', documents);
    console.log('Active document ID:', activeDocumentId);
    console.log('Selected documents:', selectedDocuments);
    
    // Check if document exists
    const selectedDoc = documents.find(doc => doc.id.toString() === docId);
    if (!selectedDoc) {
      console.error(`Document with ID ${docId} not found in documents array`);
    } else {
      console.log('Selected document details:', selectedDoc);
    }
    
    console.groupEnd();
  };

  // Debug function for document paths (similar to what's in DocumentViewer)
  const debugDocumentPath = (docId) => {
    const projectId = mainProjectId || localStorage.getItem('currentProjectId');
    console.log(`Debugging document path for ID: ${docId} in project: ${projectId}`);
    
    // This would normally call a service
    toast.info(`Debugging document ID: ${docId}`);
    
    // In real implementation, you might have:
    // documentService.debugDocumentPath(docId)
    //   .then(debugInfo => {
    //     console.log("Document path debug info:", debugInfo);
    //   })
    //   .catch(debugErr => {
    //     console.error("Debug info error:", debugErr);
    //   });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Error notification if needed */}
      {selectionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
          <span className="text-sm">{selectionError}</span>
        </div>
      )}
    
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isConsolidatedSummaryLoading || loading}
        className="
          flex items-center justify-between
          min-w-[200px] max-w-[300px]
          bg-white dark:bg-gray-800/30 
          text-[#5e4636] dark:text-white
          rounded-lg px-4 py-2.5 
          border border-[#e8ddcc] dark:border-blue-500/20
          hover:bg-[#f9f6f2] dark:hover:bg-blue-800/30 
          shadow-sm
          transition-colors
          focus:outline-none focus:ring-1 focus:ring-[#556052] dark:focus:ring-blue-700/30
          disabled:bg-[#d6cbbf] disabled:text-[#5a544a] disabled:cursor-not-allowed
        "
      >
        <div className="flex items-center truncate">
          {loading ? (
            <div className="animate-spin h-4 w-4 border-2 border-[#a55233] dark:border-blue-500 rounded-full border-t-transparent mr-2"></div>
          ) : isConsolidatedView ? (
            <>
              <Layers className="h-4 w-4 mr-2 text-[#556052] dark:text-purple-400" />
              <span className="truncate text-[#0a3b25] dark:text-purple-200">Consolidated View</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2 text-[#a55233] dark:text-blue-400" />
              <span className="truncate">{activeDocument?.filename || 'Select Document'}</span>
            </>
          )}
        </div>
        <ChevronDown className="h-4 w-4 ml-2 text-[#5a544a] dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="
          absolute z-50 mt-1 w-full
          bg-white dark:bg-gray-800 
          border border-[#e8ddcc] dark:border-blue-500/20 
          rounded-lg
          shadow-md overflow-hidden max-h-72 overflow-y-auto
        ">
          <div className="p-1">
            {/* Consolidated option */}
            {/* {selectedDocuments.length > 1 && (
              <button
                onClick={() => {
                  handleSelect('consolidated');
                  // Debug info
                  console.log('Selected consolidated view');
                }}
                className={`
                  w-full text-left px-4 py-2.5 rounded-md mb-1
                  flex items-center
                  ${isConsolidatedView 
                    ? 'bg-[#556052]/20 text-[#0a3b25] dark:bg-gradient-to-r dark:from-blue-900/70 dark:to-purple-900/70 dark:text-white' 
                    : 'hover:bg-[#f5e6d8] text-[#5e4636] dark:hover:bg-gray-700/50 dark:text-gray-200'}
                `}
              >
                <Layers className="h-4 w-4 mr-2 text-[#556052] dark:text-purple-400" />
                <div className="flex flex-col">
                  <span className="font-medium">Consolidated Summary</span>
                  <span className="text-xs text-[#5a544a] dark:text-gray-400">Analyze all documents together</span>
                </div>
              </button>
            )} */}
            
            <div className={selectedDocuments.length > 1 ? "border-t border-[#e3d5c8] dark:border-gray-700 pt-1 mt-1" : ""}>
              {/* Individual documents */}
              {selectedDocuments.map(docId => {
                const doc = documents.find(d => d.id.toString() === docId);
                if (!doc) {
                  console.warn(`Document with ID ${docId} not found in documents array`);
                  return null;
                }
                
                return (
                  <button
                    key={docId}
                    onClick={() => {
                      handleSelect(docId);
                      // Add debug info
                      debugDocumentSelection(docId);
                    }}
                    className={`
                      w-full text-left px-4 py-2 rounded-md 
                      flex items-center
                      ${activeDocumentId === docId && !isConsolidatedView
                        ? 'bg-[#eee5d9] text-[#5e4636] border-l-2 border-[#a55233] dark:bg-blue-900/40 dark:text-blue-200' 
                        : 'hover:bg-[#f3e8df] text-[#5e4636] dark:hover:bg-gray-700/50 dark:text-gray-200'}
                    `}
                  >
                    <FileText className="h-4 w-4 mr-2 text-[#a55233] dark:text-blue-400 flex-shrink-0" />
                    <span className="truncate">{doc.filename}</span>
                  </button>
                );
              })}
              
              {/* Show message if no documents are found */}
              {selectedDocuments.length === 0 && (
                <div className="px-4 py-2 text-[#5a544a] dark:text-gray-400 text-sm italic">
                  No documents selected. Please select documents from the sidebar.
                </div>
              )}
            </div>
            
            {/* Debug buttons section - only show when there's an active document */}
            {/* {activeDocumentId && !isConsolidatedView && (
              <div className="border-t border-[#e3d5c8] dark:border-gray-700 pt-1 mt-1">
                <button
                  onClick={() => {
                    debugDocumentPath(activeDocumentId);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-md text-[#5a544a] dark:text-gray-300 hover:bg-[#f3e8df] dark:hover:bg-gray-700/50 flex items-center text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-2 text-[#a55233] dark:text-blue-400 flex-shrink-0" />
                  <span>Debug Document Path</span>
                </button>
              </div>
            )} */}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSelector;