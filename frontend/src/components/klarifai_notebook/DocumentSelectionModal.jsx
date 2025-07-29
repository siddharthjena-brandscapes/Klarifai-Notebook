// DocumentSelectionModal.jsx - Modal for single document selection for mindmap generation
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Brain, FileText, AlertCircle } from 'lucide-react';

const DocumentSelectionModal = ({
  isOpen,
  onClose,
  selectedDocuments,
  documents, // Add this prop to get full document objects
  onSelectDocument,
  onGenerateMindmap,
  theme,
  mainProjectId
}) => {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Get full document objects from the selected document IDs
  const selectedDocumentObjects = documents.filter(doc => 
    selectedDocuments.includes(doc.id.toString())
  );

  const handleDocumentSelect = (docId) => {
    setSelectedDocId(docId);
  };

  const handleGenerateMindmap = async () => {
    if (!selectedDocId) return;

    setIsGenerating(true);
    try {
      // Call the parent's mindmap generation function with single document
      await onGenerateMindmap([selectedDocId.toString()]);
      onClose();
    } catch (error) {
      console.error('Error generating mindmap:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setSelectedDocId(null);
    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-gray-900'} bg-opacity-70 backdrop-blur-sm`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`
        relative max-w-md w-full mx-4 
        ${theme === 'dark' ? 'bg-gray-900 border-blue-500/20' : 'bg-white border-[#e3d5c8]'} 
        rounded-lg shadow-2xl border
        max-h-[80vh] overflow-hidden
      `}>
        {/* Header */}
        <div className={`
          p-6 border-b 
          ${theme === 'dark' ? 'border-blue-500/20 bg-gray-800/50' : 'border-[#e3d5c8] bg-[#f0eee5]'}
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-lg 
                ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'}
              `}>
                <AlertCircle className={`
                  h-5 w-5 
                  ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}
                `} />
              </div>
              <div>
                <h2 className={`
                  text-lg font-semibold 
                  ${theme === 'dark' ? 'text-white' : 'text-[#5e4636]'}
                `}>
                  Select Single Document
                </h2>
                <p className={`
                  text-sm 
                  ${theme === 'dark' ? 'text-gray-400' : 'text-[#8c715f]'}
                `}>
                  Choose one document for mindmap generation
                </p>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className={`
                p-2 rounded-full transition-colors
                ${theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-[#8c715f] hover:text-[#5e4636] hover:bg-[#e8d5c4]'
                }
              `}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          <div className={`
            p-2 rounded-lg mb-4
            ${theme === 'dark' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200'}
            border
          `}>
            <div className="flex items-start space-x-3">
              <div>
               
                <p className={`
                  text-sm mt-1
                  ${theme === 'dark' ? 'text-orange-400' : 'text-orange-700'}
                `}>
                  You have {selectedDocuments.length} documents selected.
                </p>
              </div>
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-3">
            <h3 className={`
              text-sm font-medium 
              ${theme === 'dark' ? 'text-white' : 'text-[#5e4636]'}
            `}>
              Available Documents ({selectedDocumentObjects.length})
            </h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDocumentObjects.map((doc) => (
                <label
                  key={doc.id}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedDocId === doc.id
                      ? theme === 'dark'
                        ? 'bg-blue-500/20 border-blue-500/40'
                        : 'bg-[#c24124]/10 border-[#c24124]/30'
                      : theme === 'dark'
                        ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }
                    border
                  `}
                >
                  <input
                    type="radio"
                    name="selectedDocument"
                    value={doc.id}
                    checked={selectedDocId === doc.id}
                    onChange={() => handleDocumentSelect(doc.id)}
                    className={`
                      w-4 h-4 
                      ${theme === 'dark' ? 'text-blue-500' : 'text-[#c24124]'}
                      focus:ring-2 
                      ${theme === 'dark' ? 'focus:ring-blue-500' : 'focus:ring-[#c24124]'}
                    `}
                  />
                  
                  <FileText className={`
                    h-4 w-4 flex-shrink-0
                    ${theme === 'dark' ? 'text-gray-400' : 'text-[#8c715f]'}
                  `} />
                  
                  <div className="flex-1 min-w-0">
                    <p className={`
                      text-sm font-medium truncate
                      ${theme === 'dark' ? 'text-white' : 'text-[#5e4636]'}
                    `}>
                      {doc.filename}
                    </p>
                    {(doc.summary || doc.description) && (
                      <p className={`
                        text-xs mt-1 truncate
                        ${theme === 'dark' ? 'text-gray-400' : 'text-[#8c715f]'}
                      `}>
                        {doc.summary || doc.description}
                      </p>
                    )}
                    <p className={`
                      text-xs mt-0.5
                      ${theme === 'dark' ? 'text-gray-500' : 'text-[#a1927e]'}
                    `}>
                      Uploaded: {new Date(doc.created_at || doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`
          p-6 border-t 
          ${theme === 'dark' ? 'border-blue-500/20 bg-gray-800/30' : 'border-[#e3d5c8] bg-gray-50'}
        `}>
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
              disabled={isGenerating}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${theme === 'dark' 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-500' 
                  : 'text-[#8c715f] hover:text-[#5e4636] hover:bg-[#e8d5c4] disabled:text-gray-400'
                }
                disabled:cursor-not-allowed
              `}
            >
              Cancel
            </button>
            
            <button
              onClick={handleGenerateMindmap}
              disabled={!selectedDocId || isGenerating}
              className={`
                px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2
                ${(!selectedDocId || isGenerating)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : theme === 'dark'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                    : 'bg-gradient-to-r from-[#c24124] to-[#a44704] hover:from-[#a63920] hover:to-[#8b3d03] text-white'
                }
              `}
            >
              <Brain className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`} />
              <span>
                {isGenerating ? 'Generating...' : 'Generate MindMap'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DocumentSelectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedDocuments: PropTypes.array.isRequired,
  documents: PropTypes.array.isRequired, // Add this prop type
  onSelectDocument: PropTypes.func.isRequired,
  onGenerateMindmap: PropTypes.func.isRequired,
  theme: PropTypes.string.isRequired,
  mainProjectId: PropTypes.string.isRequired
};

export default DocumentSelectionModal;