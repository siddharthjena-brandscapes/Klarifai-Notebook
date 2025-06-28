

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Search, X, FileText, 
 Loader, 
  MessageCircle, Plus
} from 'lucide-react';
import { documentService } from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const DocumentSearchModal = ({ 
  isOpen, 
  onClose, 
  documents, 
  mainProjectId,
  onDocumentSelect,
  setSelectedDocuments,
  selectedDocuments
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('filename'); // 'filename' or 'content'
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target) && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Search by filename function (client-side)
  const searchByFilename = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const results = documents.filter(doc => 
      doc.filename.toLowerCase().includes(searchTermLower)
    );
    
    setSearchResults(results);
  };

  // Search by content function (server-side)
  const searchByContent = async () => {
    if (!searchTerm.trim() || !mainProjectId) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await documentService.searchDocumentContent({
        query: searchTerm,
        main_project_id: mainProjectId
      });
      
      if (response.data && response.data.results) {
        setSearchResults(response.data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching document content:', error);
      toast.error('Failed to search document content');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Perform search when the search term or tab changes
  useEffect(() => {
    // Add debounce for better performance
    const timer = setTimeout(() => {
      if (activeTab === 'filename') {
        searchByFilename();
      } else {
        searchByContent();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab]);

  // Handle document selection
  const handleDocumentSelect = (doc) => {
    const docId = doc.id.toString();
    
    // Toggle document selection
    if (selectedDocuments.includes(docId)) {
      setSelectedDocuments(selectedDocuments.filter(id => id !== docId));
    } else {
      setSelectedDocuments([...selectedDocuments, docId]);
    }
    
    // Call the select function
    if (onDocumentSelect) {
      onDocumentSelect(doc.id);
    }
    
    // toast.success(`Document "${doc.filename}" ${selectedDocuments.includes(docId) ? 'deselected' : 'selected'}`);
  };

  // Handle view document in QA
  const handleViewInQA = (doc) => {
    handleDocumentSelect(doc);
    onClose();
  };

  // Format document match preview
  const formatMatchPreview = (content, term) => {
    if (!content || !term) return '';
    
    const maxLength = 150;
    const termLower = term.toLowerCase();
    const contentLower = content.toLowerCase();
    const index = contentLower.indexOf(termLower);
    
    if (index === -1) return content.substring(0, maxLength) + '...';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + term.length + 50);
    
    let preview = content.substring(start, end);
    
    // Add ellipsis if needed
    if (start > 0) preview = '...' + preview;
    if (end < content.length) preview = preview + '...';
    
    // Add simple highlighting with bold
    const highlightedTermRegex = new RegExp(term, 'gi');
    preview = preview.replace(
      highlightedTermRegex, 
      match => `<b style="color: #5ff2b6">${match}</b>`
    );
    
    return preview;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 dark:bg-black/60 flex items-center justify-center z-50 p-4 overflow-auto">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-[#d6cbbf] dark:border-gray-700"
      >
        {/* Header & Search Input */}
        <div className="p-4 border-b border-[#e3d5c8] dark:border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl  text-[#0a3b25] font-serif dark:text-white">Document Search</h2>
            <button 
              onClick={onClose}
              className="text-[#5a544a] hover:text-[#a55233] transition-colors dark:text-gray-400 dark:hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex items-center bg-white/80 border border-[#d6cbbf] rounded-lg overflow-hidden dark:bg-gray-700 dark:border-transparent">
            <div className="pl-3">
              <Search size={18} className="text-[#5a544a] dark:text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-[#5e4636] placeholder-[#8c715f]/70 p-3 focus:outline-none dark:text-white dark:placeholder-gray-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="px-3 text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          {/* Search Tabs */}
          <div className="flex mt-3">
            <button
              onClick={() => setActiveTab('filename')}
              className={`px-4 py-2 rounded-t-lg ${activeTab === 'filename' 
                ? 'bg-[#f5e6d8] text-[#a55233] border-b-2 border-[#a55233] dark:bg-gray-700 dark:text-blue-400 dark:border-blue-400' 
                : 'text-[#5a544a] hover:text-[#5e4636] dark:text-gray-400 dark:hover:text-white'}`}
            >
              Search by Filename
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-t-lg ${activeTab === 'content' 
                ? 'bg-[#f5e6d8] text-[#a55233] border-b-2 border-[#a55233] dark:bg-gray-700 dark:text-blue-400 dark:border-blue-400' 
                : 'text-[#5a544a] hover:text-[#5e4636] dark:text-gray-400 dark:hover:text-white'}`}
            >
              Search in Content
            </button>
          </div>
        </div>
        
        {/* Search Results */}
        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-[#faf4ee]/50 dark:bg-transparent">
          {isSearching ? (
            <div className="flex items-center justify-center h-32">
              <Loader size={24} className="text-[#a55233] animate-spin mr-2 dark:text-blue-400" />
              <span className="text-[#5e4636] dark:text-gray-300">Searching document content...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-[#8c715f] py-10 dark:text-gray-400">
              {searchTerm 
                ? `No documents found matching "${searchTerm}"` 
                : 'Enter search term to find documents'}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[#8c715f] text-sm dark:text-gray-400">
                {searchResults.length} document{searchResults.length !== 1 ? 's' : ''} found
              </p>
              
              {searchResults.map(doc => (
                <div 
                  key={doc.id}
                  className={`
                    p-3 rounded-lg transition-all duration-200
                    ${selectedDocuments.includes(doc.id.toString()) 
                      ? 'bg-[#556052]/10 border border-[#556052]/30 dark:bg-gradient-to-r dark:from-blue-900/40 dark:to-blue-800/20 dark:border-blue-700/50' 
                      : 'bg-white/80 hover:bg-[#f5e6d8] border border-[#e8ddcc] hover:border-[#a68a70] dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-transparent dark:hover:border-gray-500'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <FileText size={20} className="text-[#a55233] mt-1 flex-shrink-0 dark:text-blue-400" />
                      <div>
                        <h3 className="font-medium text-[#5e4636] dark:text-white">{doc.filename}</h3>
                        
                        {activeTab === 'content' && doc.match_context && (
                          <div className="mt-2 text-sm text-[#5a544a] bg-white/80 p-2 rounded border border-[#e8ddcc] dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: formatMatchPreview(doc.match_context, searchTerm) 
                              }} 
                            />
                            {doc.match_count > 1 && (
                              <p className="text-xs text-[#556052] mt-1 dark:text-blue-400">
                                + {doc.match_count - 1} more {doc.match_count - 1 === 1 ? 'match' : 'matches'}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-[#8c715f] mt-1 dark:text-gray-400">
                          {doc.pages 
                            ? `${doc.pages} pages · ${new Date(doc.uploaded_at).toLocaleDateString()}`
                            : new Date(doc.uploaded_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDocumentSelect(doc)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedDocuments.includes(doc.id.toString())
                            ? 'bg-[#556052]/20 text-[#556052] hover:bg-[#556052]/30 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30'
                            : 'bg-white border border-[#d6cbbf] hover:bg-[#f5e6d8] text-[#5e4636] dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-300 dark:hover:text-white dark:border-transparent'
                        }`}
                        title={selectedDocuments.includes(doc.id.toString()) ? "Deselect document" : "Select document"}
                      >
                        {selectedDocuments.includes(doc.id.toString()) 
                          ? <X title="Deselect document" size={16} /> 
                          : <Plus title="Select document" size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[#e3d5c8] flex justify-between items-center dark:border-gray-700">
          {selectedDocuments.length > 0 && (
            <div className="text-sm text-[#8c715f] dark:text-gray-400">
              <span className="text-[#556052] font-medium dark:text-blue-400">{selectedDocuments.length}</span> document{selectedDocuments.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      </div>
      
      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(213, 203, 191, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(166, 138, 112, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(165, 82, 51, 0.4);
        }
        
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        }
      `}</style>
    </div>
  );
};

DocumentSearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  documents: PropTypes.array.isRequired,
  mainProjectId: PropTypes.string.isRequired,
  onDocumentSelect: PropTypes.func,
  setSelectedDocuments: PropTypes.func.isRequired,
  selectedDocuments: PropTypes.array.isRequired
};

export default DocumentSearchModal;