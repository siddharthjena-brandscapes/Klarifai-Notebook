// import React, { useState, useEffect, useRef } from 'react';
// import PropTypes from 'prop-types';
// import { 
//   Search, X, FileText, ArrowDownCircle,
//   Loader, ExternalLink, MessageCircle
// } from 'lucide-react';
// import { documentService } from '../../utils/axiosConfig';
// import { toast } from 'react-toastify';

// const DocumentSearchModal = ({ 
//   isOpen, 
//   onClose, 
//   documents, 
//   mainProjectId,
//   onDocumentSelect,
//   setSelectedDocuments,
//   selectedDocuments
// }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [isSearching, setIsSearching] = useState(false);
//   const [searchResults, setSearchResults] = useState([]);
//   const [activeTab, setActiveTab] = useState('filename'); // 'filename' or 'content'
//   const inputRef = useRef(null);
//   const modalRef = useRef(null);

//   // Focus input on open
//   useEffect(() => {
//     if (isOpen && inputRef.current) {
//       setTimeout(() => {
//         inputRef.current.focus();
//       }, 100);
//     }
//   }, [isOpen]);

//   // Close modal on escape key
//   useEffect(() => {
//     const handleEscape = (e) => {
//       if (e.key === 'Escape' && isOpen) {
//         onClose();
//       }
//     };
    
//     window.addEventListener('keydown', handleEscape);
//     return () => window.removeEventListener('keydown', handleEscape);
//   }, [isOpen, onClose]);
  
//   // Handle click outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (modalRef.current && !modalRef.current.contains(e.target) && isOpen) {
//         onClose();
//       }
//     };
    
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [isOpen, onClose]);

//   // Search by filename function (client-side)
//   const searchByFilename = () => {
//     if (!searchTerm.trim()) {
//       setSearchResults([]);
//       return;
//     }

//     const searchTermLower = searchTerm.toLowerCase();
//     const results = documents.filter(doc => 
//       doc.filename.toLowerCase().includes(searchTermLower)
//     );
    
//     setSearchResults(results);
//   };

//   // Search by content function (server-side)
//   const searchByContent = async () => {
//     if (!searchTerm.trim() || !mainProjectId) {
//       setSearchResults([]);
//       return;
//     }

//     try {
//       setIsSearching(true);
//       const response = await documentService.searchDocumentContent({
//         query: searchTerm,
//         main_project_id: mainProjectId
//       });
      
//       if (response.data && response.data.results) {
//         setSearchResults(response.data.results);
//       } else {
//         setSearchResults([]);
//       }
//     } catch (error) {
//       console.error('Error searching document content:', error);
//       toast.error('Failed to search document content');
//       setSearchResults([]);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   // Perform search when the search term or tab changes
//   useEffect(() => {
//     // Add debounce for better performance
//     const timer = setTimeout(() => {
//       if (activeTab === 'filename') {
//         searchByFilename();
//       } else {
//         searchByContent();
//       }
//     }, 300);
    
//     return () => clearTimeout(timer);
//   }, [searchTerm, activeTab]);

//   // Handle document selection
//   const handleDocumentSelect = (doc) => {
//     const docId = doc.id.toString();
    
//     // Toggle document selection
//     if (selectedDocuments.includes(docId)) {
//       setSelectedDocuments(selectedDocuments.filter(id => id !== docId));
//     } else {
//       setSelectedDocuments([...selectedDocuments, docId]);
//     }
    
//     // Call the select function
//     if (onDocumentSelect) {
//       onDocumentSelect(doc.id);
//     }
    
//     toast.success(`Document "${doc.filename}" ${selectedDocuments.includes(docId) ? 'deselected' : 'selected'}`);
//   };

//   // Handle view document in QA
//   const handleViewInQA = (doc) => {
//     handleDocumentSelect(doc);
//     onClose();
//   };

//   // Format document match preview
//   const formatMatchPreview = (content, term) => {
//     if (!content || !term) return '';
    
//     const maxLength = 150;
//     const termLower = term.toLowerCase();
//     const contentLower = content.toLowerCase();
//     const index = contentLower.indexOf(termLower);
    
//     if (index === -1) return content.substring(0, maxLength) + '...';
    
//     const start = Math.max(0, index - 50);
//     const end = Math.min(content.length, index + term.length + 50);
    
//     let preview = content.substring(start, end);
    
//     // Add ellipsis if needed
//     if (start > 0) preview = '...' + preview;
//     if (end < content.length) preview = preview + '...';
    
//     return preview;
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-auto">
//       <div 
//         ref={modalRef}
//         className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-700"
//       >
//         {/* Header & Search Input */}
//         <div className="p-4 border-b border-gray-700">
//           <div className="flex justify-between items-center mb-3">
//             <h2 className="text-xl font-semibold text-white">Document Search</h2>
//             <button 
//               onClick={onClose}
//               className="text-gray-400 hover:text-white transition-colors"
//             >
//               <X size={20} />
//             </button>
//           </div>
          
//           <div className="flex items-center bg-gray-700 rounded-lg overflow-hidden">
//             <div className="pl-3">
//               <Search size={18} className="text-gray-400" />
//             </div>
//             <input
//               ref={inputRef}
//               type="text"
//               placeholder="Search documents..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full bg-transparent text-white placeholder-gray-400 p-3 focus:outline-none"
//             />
//             {searchTerm && (
//               <button 
//                 onClick={() => setSearchTerm('')}
//                 className="px-3 text-gray-400 hover:text-white"
//               >
//                 <X size={18} />
//               </button>
//             )}
//           </div>
          
//           {/* Search Tabs */}
//           <div className="flex mt-3">
//             <button
//               onClick={() => setActiveTab('filename')}
//               className={`px-4 py-2 rounded-t-lg ${activeTab === 'filename' 
//                 ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400' 
//                 : 'text-gray-400 hover:text-white'}`}
//             >
//               Search by Filename
//             </button>
//             <button
//               onClick={() => setActiveTab('content')}
//               className={`px-4 py-2 rounded-t-lg ${activeTab === 'content' 
//                 ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400' 
//                 : 'text-gray-400 hover:text-white'}`}
//             >
//               Search in Content
//             </button>
//           </div>
//         </div>
        
//         {/* Search Results */}
//         <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
//           {isSearching ? (
//             <div className="flex items-center justify-center h-32">
//               <Loader size={24} className="text-blue-400 animate-spin mr-2" />
//               <span className="text-gray-300">Searching document content...</span>
//             </div>
//           ) : searchResults.length === 0 ? (
//             <div className="text-center text-gray-400 py-10">
//               {searchTerm 
//                 ? `No documents found matching "${searchTerm}"` 
//                 : 'Enter search term to find documents'}
//             </div>
//           ) : (
//             <div className="space-y-3">
//               <p className="text-gray-400 text-sm">
//                 {searchResults.length} document{searchResults.length !== 1 ? 's' : ''} found
//               </p>
              
//               {searchResults.map(doc => (
//                 <div 
//                   key={doc.id}
//                   className={`
//                     p-3 rounded-lg transition-all duration-200
//                     ${selectedDocuments.includes(doc.id.toString()) 
//                       ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-700/50' 
//                       : 'bg-gray-700 hover:bg-gray-600 border border-transparent hover:border-gray-500'}
//                   `}
//                 >
//                   <div className="flex items-start justify-between">
//                     <div className="flex items-start space-x-3">
//                       <FileText size={20} className="text-blue-400 mt-1 flex-shrink-0" />
//                       <div>
//                         <h3 className="font-medium text-white">{doc.filename}</h3>
                        
//                         {activeTab === 'content' && doc.match_context && (
//                           <div className="mt-2 text-sm text-gray-300 bg-gray-800 p-2 rounded border border-gray-700">
//                             <p>{formatMatchPreview(doc.match_context, searchTerm)}</p>
//                             {doc.match_count > 1 && (
//                               <p className="text-xs text-blue-400 mt-1">
//                                 + {doc.match_count - 1} more {doc.match_count - 1 === 1 ? 'match' : 'matches'}
//                               </p>
//                             )}
//                           </div>
//                         )}
                        
//                         <div className="text-xs text-gray-400 mt-1">
//                           {doc.pages 
//                             ? `${doc.pages} pages · ${new Date(doc.uploaded_at).toLocaleDateString()}`
//                             : new Date(doc.uploaded_at).toLocaleDateString()}
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="flex space-x-2">
//                       <button
//                         onClick={() => handleDocumentSelect(doc)}
//                         className={`p-2 rounded-lg transition-colors ${
//                           selectedDocuments.includes(doc.id.toString())
//                             ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
//                             : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white'
//                         }`}
//                         title={selectedDocuments.includes(doc.id.toString()) ? "Deselect document" : "Select document"}
//                       >
//                         <ArrowDownCircle size={16} />
//                       </button>
                      
//                       <button
//                         onClick={() => handleViewInQA(doc)}
//                         className="p-2 bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white rounded-lg transition-colors"
//                         title="View in Document QA"
//                       >
//                         <MessageCircle size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
        
//         {/* Footer */}
//         <div className="p-4 border-t border-gray-700 flex justify-between items-center">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
//           >
//             Close
//           </button>
          
//           {selectedDocuments.length > 0 && (
//             <div className="text-sm text-gray-400">
//               <span className="text-blue-400 font-medium">{selectedDocuments.length}</span> document{selectedDocuments.length !== 1 ? 's' : ''} selected
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// DocumentSearchModal.propTypes = {
//   isOpen: PropTypes.bool.isRequired,
//   onClose: PropTypes.func.isRequired,
//   documents: PropTypes.array.isRequired,
//   mainProjectId: PropTypes.string.isRequired,
//   onDocumentSelect: PropTypes.func,
//   setSelectedDocuments: PropTypes.func.isRequired,
//   selectedDocuments: PropTypes.array.isRequired
// };

// export default DocumentSearchModal;

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-auto">
      <div 
        ref={modalRef}
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-700"
      >
        {/* Header & Search Input */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-white">Document Search</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex items-center bg-gray-700 rounded-lg overflow-hidden">
            <div className="pl-3">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-white placeholder-gray-400 p-3 focus:outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="px-3 text-gray-400 hover:text-white"
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
                ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'}`}
            >
              Search by Filename
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-t-lg ${activeTab === 'content' 
                ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'}`}
            >
              Search in Content
            </button>
          </div>
        </div>
        
        {/* Search Results */}
        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
          {isSearching ? (
            <div className="flex items-center justify-center h-32">
              <Loader size={24} className="text-blue-400 animate-spin mr-2" />
              <span className="text-gray-300">Searching document content...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              {searchTerm 
                ? `No documents found matching "${searchTerm}"` 
                : 'Enter search term to find documents'}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">
                {searchResults.length} document{searchResults.length !== 1 ? 's' : ''} found
              </p>
              
              {searchResults.map(doc => (
                <div 
                  key={doc.id}
                  className={`
                    p-3 rounded-lg transition-all duration-200
                    ${selectedDocuments.includes(doc.id.toString()) 
                      ? 'bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-blue-700/50' 
                      : 'bg-gray-700 hover:bg-gray-600 border border-transparent hover:border-gray-500'}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <FileText size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-white">{doc.filename}</h3>
                        
                        {activeTab === 'content' && doc.match_context && (
                          <div className="mt-2 text-sm text-gray-300 bg-gray-800 p-2 rounded border border-gray-700">
                            <div 
                              dangerouslySetInnerHTML={{ 
                                __html: formatMatchPreview(doc.match_context, searchTerm) 
                              }} 
                            />
                            {doc.match_count > 1 && (
                              <p className="text-xs text-blue-400 mt-1">
                                + {doc.match_count - 1} more {doc.match_count - 1 === 1 ? 'match' : 'matches'}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400 mt-1">
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
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                            : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white'
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
        <div className="p-4 border-t border-gray-700 flex justify-between items-center">
         
          
          {selectedDocuments.length > 0 && (
            <div className="text-sm text-gray-400">
              <span className="text-blue-400 font-medium">{selectedDocuments.length}</span> document{selectedDocuments.length !== 1 ? 's' : ''} selected
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
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
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