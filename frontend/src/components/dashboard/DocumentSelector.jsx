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
          bg-gray-800/30 text-white
          rounded-lg px-4 py-2.5 
          border border-blue-500/20
          hover:bg-blue-800/30 transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-700/30
        "
      >
        <div className="flex items-center truncate">
          {isConsolidatedView ? (
            <>
              <Layers className="h-4 w-4 mr-2 text-purple-400" />
              <span className="truncate text-purple-200">Consolidated View</span>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2 text-blue-400" />
              <span className="truncate">{activeDocument?.filename || 'Select Document'}</span>
            </>
          )}
        </div>
        <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
      </button>

      {isOpen && (
        <div className="
          absolute z-50 mt-1 w-full
          bg-gray-800 border border-blue-500/20 rounded-lg
          shadow-lg overflow-hidden max-h-72 overflow-y-auto
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
                    ? 'bg-gradient-to-r from-blue-900/70 to-purple-900/70 text-white' 
                    : 'hover:bg-gray-700/50 text-gray-200'}
                `}
              >
                <Layers className="h-4 w-4 mr-2 text-purple-400" />
                <div className="flex flex-col">
                  <span className="font-medium">Consolidated Summary</span>
                  <span className="text-xs text-gray-400">Analyze all documents together</span>
                </div>
              </button>
            )}
            
            <div className={selectedDocuments.length > 1 ? "border-t border-gray-700 pt-1 mt-1" : ""}>
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
                        ? 'bg-blue-900/40 text-blue-200' 
                        : 'hover:bg-gray-700/50 text-gray-200'}
                    `}
                  >
                    <FileText className="h-4 w-4 mr-2 text-blue-400 flex-shrink-0" />
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