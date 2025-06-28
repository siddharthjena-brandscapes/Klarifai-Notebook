

// DocumentSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileText, Layers } from 'lucide-react';

const DocumentSelector = ({ 
  documents, 
  selectedDocuments, 
  activeDocumentId,
  isConsolidatedView,
  onDocumentChange,
  onConsolidatedView,
  isConsolidatedSummaryLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
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

  // Handle document selection
  const handleSelect = (docId) => {
    if (docId === 'consolidated') {
      onConsolidatedView();
    } else {
      onDocumentChange({ target: { value: docId } });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isConsolidatedSummaryLoading}
        className="
          flex items-center justify-between
          min-w-[200px] max-w-[300px]
          bg-white dark:bg-gray-800/30 
          text-[#5e4636] dark:text-white
          rounded-lg px-4 py-2.5 
          border  dark:border-blue-500/20
          hover:bg-[#f9f6f2] dark:hover:bg-blue-800/30 
          shadow-sm
          transition-colors
          focus:outline-none focus:ring-1 focus:ring-[#556052] dark:focus:ring-blue-700/30
          disabled:bg-[#d6cbbf] disabled:text-[#5a544a] disabled:cursor-not-allowed
        "
      >
        <div className="flex items-center truncate">
          {isConsolidatedView ? (
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
            {selectedDocuments.length > 1 && (
              <button
                onClick={() => handleSelect('consolidated')}
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
            )}
            
            <div className={selectedDocuments.length > 1 ? "border-t border-[#e3d5c8] dark:border-gray-700 pt-1 mt-1" : ""}>
              {/* Individual documents */}
              {selectedDocuments.map(docId => {
                const doc = documents.find(d => d.id.toString() === docId);
                if (!doc) return null;
                
                return (
                  <button
                    key={docId}
                    onClick={() => handleSelect(docId)}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentSelector;