// //sidebar.jsx with project management
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Settings, 
  CircleHelp, 
  Plus, 
  ChevronDown,
  ChevronUp,
  FileText,
  MessageCircle,
  Search, X,
  Edit2, 
  Trash2, 
  Filter, 
  Calendar, 
  Tag 
} from 'lucide-react';
import { documentService, chatService } from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import DeleteModal from './DeleteModal';
import DeleteChatModal  from './DeleteChatModal';
const Sidebar = ({ 
  isOpen, 
  isMobile,
  mainProjectId,
  onSelectChat, 
  onDocumentSelect, 
  onSendMessage, 
  setSelectedDocuments, 
  selectedDocuments,
  onNewChat
}) => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatHistoryVisible, setIsChatHistoryVisible] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isDocumentsVisible, setIsDocumentsVisible] = useState(true);
  const [showDocumentSearch, setShowDocumentSearch] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Add new state for chat management
  const [chatFilterMode, setChatFilterMode] = useState(null);
  const [isRenamingChat, setIsRenamingChat] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isDeleteChatModalOpen, setIsDeleteChatModalOpen] = useState(false);
  
  
  const handleResetSearch = () => {
    setDocumentSearchTerm('');
  };
  // New method to handle document deletion
  const handleDeleteDocument = async (documentId) => {
    try {
      // Call delete service
      await documentService.deleteDocument(documentId, mainProjectId);

      // Remove document from local state
      setDocuments(prevDocs => 
        prevDocs.filter(doc => doc.id !== documentId)
      );

      // Remove from selected documents
      setSelectedDocuments(prevSelected => 
        prevSelected.filter(id => id !== documentId.toString())
      );

      // If deleted document was active, reset active document
      if (activeDocumentId === documentId) {
        setActiveDocumentId(null);
        sessionStorage.removeItem('active_document_id');
      }

      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Failed to delete document', error);
      toast.error('Failed to delete document');
    }
  };

  // Confirmation method
  const handleDeleteConfirmation = (doc) => {
    setDocumentToDelete(doc);
    setIsDeleteModalOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (documentToDelete) {
      handleDeleteDocument(documentToDelete.id);
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
    }
  };

  // Memoized filtered documents
  const filteredDocuments = useMemo(() => {
    // Ensure documents is an array
    const safeDocuments = Array.isArray(documents) ? documents : [];

    if (!documentSearchTerm) return safeDocuments;

    const searchTermLower = documentSearchTerm.toLowerCase();
    return safeDocuments.filter(doc => 
      doc && (
        doc.filename.toLowerCase().includes(searchTermLower) ||
        (doc.description && doc.description.toLowerCase().includes(searchTermLower))
      )
    );
  }, [documents, documentSearchTerm]);

  const generateChatTitle = (chat) => {
    // If there's a custom title already set, use it
    if (chat.title && !chat.title.startsWith('Chat 20')) {
      return chat.title;
    }
  
    // Find the first user message
    const firstUserMessage = chat.messages?.find(msg => msg.role === 'user')?.content;
  
    if (firstUserMessage) {
      // Truncate and clean the message to create a title
      let title = firstUserMessage
        .trim()
        .split(/[.!?]/)[0] // Take first sentence
        .slice(0, 25); // Limit length
      
      // Add ellipsis if truncated
      if (firstUserMessage.length > 25) {
        title += '...';
      }
  
      return title;
    }
  
    return 'New Conversation'; // Default fallback
  };

  // Add refresh interval constant
  const CHAT_REFRESH_INTERVAL = 5000; 

  // Enhanced chat history naming and fetching
  const fetchChatHistory = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    try {
      if (!mainProjectId) {
        console.warn('No mainProjectId provided, skipping chat history fetch');
        setChatHistory([]);
        return;
      }
  
      setLoading(true);
      console.log('Fetching chat history for project:', mainProjectId);
      
      const response = await chatService.getAllConversations(mainProjectId);
      
      if (response && response.data) {
        // Process chat history to ensure proper grouping of messages
        const processedChatHistory = response.data.map(chat => {
          // Use the first user message as the title if no title is set
          
          const messageCount = chat.messages?.length || 0;
          
          return {
            ...chat,
            title: generateChatTitle(chat),
            message_count: messageCount,
            messages: chat.messages || [],
            conversation_id: chat.conversation_id
          };
        });
        
        // Sort chats by most recent first
        const sortedHistory = processedChatHistory.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        setChatHistory(sortedHistory);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to fetch chat history');
      setChatHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chat history on component mount and set up periodic refresh
  useEffect(() => {
    let isSubscribed = true;
  
    // Initial fetch
    fetchChatHistory(true);
  
    // Set up polling interval
    const intervalId = setInterval(() => {
      if (isSubscribed && mainProjectId) {
        fetchChatHistory(false);
      }
    }, CHAT_REFRESH_INTERVAL);
  
    // Cleanup function
    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [mainProjectId]); 

  

  
  // Enhanced chat selection handler
  const handleChatSelection = async (selectedChat) => {
    try {
      setActiveConversationId(selectedChat.conversation_id);
      console.log('Fetching conversation details for:', selectedChat.conversation_id);
      
      const response = await chatService.getConversationDetails(
        selectedChat.conversation_id,
        mainProjectId
      );
      
      if (response && response.data) {
        console.log('Fetched conversation details:', response.data);
        
        // Prepare the full chat data
        const fullChatData = {
          ...response.data,
          conversation_id: selectedChat.conversation_id,
          messages: response.data.messages || [],
          selected_documents: response.data.selected_documents || [],
          title: response.data.title,
          follow_up_questions: response.data.follow_up_questions || []
        };

         // Log the follow-up questions for debugging
        console.log('Follow-up questions:', fullChatData.follow_up_questions);
  
        if (onSelectChat) {
          onSelectChat(fullChatData);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      toast.error('Failed to load conversation history');
    }
  };

// Fetch documents on component mount and set up periodic refresh
  useEffect(() => {
    console.log('mainProjectId changed to:', mainProjectId);
    if (mainProjectId) {
      fetchUserDocuments();
    }
  }, [mainProjectId]);

  // Fetch user documents
  const fetchUserDocuments = useCallback(async () => {
    // Don't set loading to true for background refreshes
    if (isInitialLoad) {
      setLoading(true);
    }
  
    if (!mainProjectId) {
      console.log('No mainProjectId, skipping fetch');
      setDocuments([]);
      setLoading(false);
      setIsInitialLoad(false);
      return;
    }
  
    try {
      const response = await documentService.getUserDocuments(mainProjectId);
      
      if (response?.data) {
        const sortedDocs = Array.isArray(response.data) 
          ? [...response.data].sort((a, b) => {
              const dateA = new Date(a.created_at || a.uploaded_at);
              const dateB = new Date(b.created_at || b.uploaded_at);
              return dateB - dateA;
            })
          : [];
        setDocuments(sortedDocs);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [mainProjectId, isInitialLoad]);

  // Fetch documents on component mount and set up periodic refresh
  useEffect(() => {
    let isSubscribed = true;
    
    const fetchData = async () => {
      if (!isSubscribed) return;
      
      await fetchUserDocuments();
    };
  
    // Initial fetch
    fetchData();
  
    // Set up polling
    const intervalId = setInterval(() => {
      if (isSubscribed) {
        fetchUserDocuments();
      }
    }, 50000);
  
    // Cleanup function
    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, [fetchUserDocuments]);



  const handleDocumentSelect = async (documentId) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      try {
        await documentService.setActiveDocument(doc.id, mainProjectId);
        setActiveDocumentId(doc.id);
        
        if (onDocumentSelect) {
          onDocumentSelect(doc);
        }
        
        sessionStorage.setItem('active_document_id', doc.id.toString());
  
        // Check if document is being selected or deselected
        const isSelected = selectedDocuments.includes(doc.id.toString());
        
        // Show different toast messages based on selection state
        toast.success(isSelected ? 
          `Document "${doc.filename}" deselected` : 
          `Document "${doc.filename}" selected`, 
          {
            position: "bottom-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            style: {
              background: 'linear-gradient(to right, #2c3e95, #3fa88e)',
              color: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            },
            icon: () => <FileText className="text-[#5ff2b6]" />
          });
      } catch (error) {
        console.error('Failed to set active document:', error);
        toast.error('Failed to set active document');
      }
    }
  };

  const toggleChatHistory = () => {
    setIsChatHistoryVisible(!isChatHistoryVisible);
  };

  const handleNewChat = () => {
    window.location.reload();
  };

  const handleDocumentToggle = async (documentId) => {
    const stringDocumentId = documentId.toString();
    
    // Create a new array based on the current selected documents
    const newSelectedDocuments = selectedDocuments.includes(stringDocumentId)
      ? selectedDocuments.filter(id => id !== stringDocumentId)
      : [...selectedDocuments, stringDocumentId];
    
    // Update the parent component's state
    setSelectedDocuments(newSelectedDocuments);

     // Update "Select All" checkbox state
     const allDocumentIds = filteredDocuments.map(doc => doc.id.toString());
     setIsSelectAllChecked(newSelectedDocuments.length === allDocumentIds.length);
    
    // Set the active document if it's being selected
    if (!selectedDocuments.includes(stringDocumentId)) {
      try {
        await documentService.setActiveDocument(documentId); // Set the active document
      } catch (error) {
        console.error('Failed to set active document:', error);
        toast.error('Failed to set active document');
      }
    }
  };

  // New method to handle "Select All" and "Deselect All"
  const handleSelectAllDocuments = () => {
    if (isSelectAllChecked) {
      // Deselect all documents
      setSelectedDocuments([]);
      setIsSelectAllChecked(false);
      toast.success('All documents deselected', {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        style: {
          background: 'linear-gradient(to right, #2c3e95, #3fa88e)',
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        },
        icon: () => <FileText className="text-[#5ff2b6]" />
      });
    } else {
      // Select all documents
      const allDocumentIds = filteredDocuments.map(doc => doc.id.toString());
      setSelectedDocuments(allDocumentIds);
      setIsSelectAllChecked(true);
      toast.success(`${allDocumentIds.length} documents selected`, {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        style: {
          background: 'linear-gradient(to right, #2c3e95, #3fa88e)',
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        },
        icon: () => <FileText className="text-[#5ff2b6]" />
      });
    }
  };

  const handleDocumentClick = (documentId) => {
    handleDocumentSelect(documentId); // Call the select function
    handleDocumentToggle(documentId); // Call the toggle function
  };






  const handleUpdateConversationTitle = async (conversationId, newTitle) => {
    try {
      // Validate title
      if (!newTitle || !newTitle.trim()) {
        toast.error('Chat title cannot be empty');
        return;
      }
  
      // Log the details for debugging
      console.log('Attempting to update conversation title:', {
        conversationId,
        newTitle,
      });
  
      // Add more detailed logging
      const updateData = { 
        title: newTitle,
        is_active: true  // Ensure the conversation remains active
      };
  
      console.log('Update payload:', updateData);
  
      // Enhanced error handling in the service call
      const response = await chatService.updateConversationTitle(conversationId, updateData);
  
      console.log('Conversation update response:', response);
  
      // Update the local state to reflect the new title
      setChatHistory(prevHistory => 
        prevHistory.map(chat => 
          chat.conversation_id === conversationId 
            ? { ...chat, title: newTitle } 
            : chat
        )
      );
  
      toast.success('Conversation title updated successfully');
      
      // Reset renaming state
      setIsRenamingChat(null);
      setNewChatTitle('');
  
    } catch (error) {
      // Comprehensive error logging
      console.error('Failed to update conversation title', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        conversationId,
        newTitle
      });
  
      // More specific error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        toast.error(error.response.data?.error || 'Failed to update conversation title');
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error('Error setting up the request');
      }
  
      // Optionally, revert any UI changes
      setIsRenamingChat(null);
      setNewChatTitle('');
    }
  };
  
  // You can add a method to archive/soft delete a conversation
  const handleDeleteConversation = async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);
      setChatHistory(prevHistory => 
        prevHistory.filter(chat => chat.conversation_id !== conversationId)
      );
      
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        if (onNewChat) {
          onNewChat();
        }
      }
      
      setIsDeleteChatModalOpen(false);
      setChatToDelete(null);
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation', error);
      toast.error('Failed to delete conversation');
    }
  };
  
  const handleDeleteChatConfirmation = (chat) => {
    setChatToDelete(chat);
    setIsDeleteChatModalOpen(true);
  };
  

  function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }


   // Enhanced chat filtering
   const filteredChatHistory = useMemo(() => {
    let filtered = [...chatHistory];

    // Apply search filter first
    if (chatSearchTerm) {
      const searchTermLower = chatSearchTerm.toLowerCase();
      filtered = filtered.filter(chat => 
        chat.title.toLowerCase().includes(searchTermLower) ||
        (chat.summary && chat.summary.toLowerCase().includes(searchTermLower))
      );
    }

    switch(chatFilterMode) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'mostMessages':
        filtered.sort((a, b) => (b.message_count || 0) - (a.message_count || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [chatHistory, chatFilterMode, chatSearchTerm]);

  // Add this method to handle resetting chat search
const handleResetChatSearch = () => {
  setChatSearchTerm('');
};

  // Rename chat handler
  const handleRenameChat = async (conversationId) => {
    if (!newChatTitle.trim()) {
        toast.error('Chat title cannot be empty');
        return;
    }

    try {
        const updateData = {
            title: newChatTitle.trim(),
            is_active: true,
            main_project_id: mainProjectId  // Make sure this is available in your component
        };

        const response = await chatService.updateConversationTitle(conversationId, updateData);
        
        // Update local state
        setChatHistory(prevHistory => 
            prevHistory.map(chat => 
                chat.conversation_id === conversationId 
                    ? { ...chat, title: newChatTitle.trim() } 
                    : chat
            )
        );

        setIsRenamingChat(null);
        setNewChatTitle('');
        toast.success('Chat title updated successfully');
    } catch (error) {
        console.error('Failed to update conversation title', error);
        toast.error(error.response?.data?.error || 'Failed to update chat title');
    }
};
  
  
  
  return (
    <div className="flex h-screen relative">
        {/* Sidebar */}
      <aside
        className={`
          ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'} 
          bg-gray-700/20
          text-white transition-all duration-300 
          overflow-hidden 
          h-[calc(100vh-4rem)] mt-16 
          fixed top-0 left-0
          flex flex-col 
          shadow-2xl
          z-40
          relative
          ${isMobile ? 'mobile-sidebar' : ''}
          aria-hidden={!isOpen}
        `}
      >
        <div className="p-4 flex flex-col flex-grow overflow-hidden">
          {/* New Chat Button */}
          {isOpen && (
            <div className="mb-4 flex justify-center items-center">
              <button
                onClick={handleNewChat}
                className="
                  text-[#d6292c] font-semibold text-white
                  bg-gradient-to-r from-[#2c3e95]/90 to-[#3fa88e]/80 p-3 rounded-lg flex items-center 
                  justify-center w-full
                  hover:bg-gray-100 hover:shadow-md 
                  transition-all duration-300
                  active:scale-95 space-x-2
                "
              >
                <Plus size={20} />New Chat
              </button>
            </div>
          )}
          {/* Documents Section */}
          {isOpen && (
  <div className="mb-4 flex flex-col overflow-hidden">
    {/* Documents Header - Restructured */}
    <div className="flex items-center justify-between mb-2 bg-gradient-to-r from-gray-800/30 to-transparent p-2 rounded-lg">
      <span className="text-white font-semibold text-xs uppercase tracking-wider">
        Documents
      </span>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowDocumentSearch(!showDocumentSearch)}
          className="p-1.5 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-700/30"
          title='Search Documents'
        >
          <Search size={16} />
        </button>
        <button
          onClick={() => setIsDocumentsVisible(!isDocumentsVisible)}
          className="p-1.5 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-700/30"
        >
          {isDocumentsVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  
              {/* Expandable Search Input */}
              {showDocumentSearch && (
                <div className=" mb-2">
                  <div className="flex items-center bg-gray-800/30 rounded-lg">
                    <Search size={16} className="ml-2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={documentSearchTerm}
                      onChange={(e) => setDocumentSearchTerm(e.target.value)}
                      className="
                        w-full bg-transparent 
                        text-white 
                        placeholder-gray-400 
                        p-2 
                        focus:outline-none 
                        text-sm
                      "
                    />
                    {documentSearchTerm && (
                      <button 
                        onClick={handleResetSearch}
                        className="mr-2 text-gray-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
  
              {/* Documents List with Visibility Toggle */}
              {isDocumentsVisible && (
                <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {isLoading && isInitialLoad ? (
                    <div className="text-gray-400 text-center py-4 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"/>
                        Loading documents...
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Select All Checkbox with Descriptive Text */}
                      {filteredDocuments.length > 0 && (
                        <div className="sticky top-0 z-10 flex items-center p-2 bg-gray-800/30 to-blue-900/20 rounded-lg backdrop-blur-md mb-2 ">
                          <input
                            type="checkbox"
                            id="select-all-documents"
                            checked={isSelectAllChecked}
                            onChange={handleSelectAllDocuments}
                            className="mr-2 form-checkbox 
                                h-3 w-3 
                                text-blue-600 
                                border-gray-300 
                                rounded-xl
                                focus:ring-blue-500
                                backdrop-blur-md "
                          />
                          <label 
                            htmlFor="select-all-documents" 
                            className="text-sm text-gray-300 flex-grow cursor-pointer"
                          >
                            Select All
                          </label>
                          {selectedDocuments.length > 0 && (
                            <span className="text-xs text-blue-400">
                              {selectedDocuments.length} selected
                            </span>
                          )}
                        </div>
                      )}
                      
                      {filteredDocuments.length === 0 ? (
                        <div className="text-gray-400 text-center py-4">
                          {documentSearchTerm 
                            ? `No documents match "${documentSearchTerm}"` 
                            : 'No documents available'}
                        </div>
                      ) : (
                        filteredDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            data-doc-id={doc.id}
                            className={`
                              flex items-center gap-2 
                              p-2 rounded-lg 
                              cursor-pointer 
                              transition-all 
                              ${selectedDocuments.includes(doc.id.toString())
                                ? ' bg-gradient-to-b from-blue-300/20 border border-[#5ff2b6]/50  text-white' 
                                : 'hover:bg-gray-700'}
                              ${activeDocumentId === doc.id ? 'border border-yellow-400' : ''}
                            `}
                            onClick={() => handleDocumentClick(doc.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id.toString())}
                              readOnly
                              className="mr-2 form-checkbox 
                                h-3 w-3 
                                text-blue-600 
                                border-[#5ff2b6]
                                rounded-xl
                                focus:ring-[#5ff2b6]"
                            />
                            <FileText size={16} className="text-blue-400 flex-shrink-0" />
                            <div className="flex-grow flex items-center justify-between overflow-hidden">
                              <div className="flex flex-col flex-grow overflow-hidden">
                                <span className="truncate text-sm">{doc.filename}</span>
                                <span className="text-xs text-gray-400">
                                  {formatRelativeDate(doc.created_at || doc.uploaded_at)}
                                </span>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConfirmation(doc);
                                }}
                                className="text-red-400 hover:text-red-300 p-1 rounded-full
                                transition-colors duration-300
                                focus:outline-none
                                hover:bg-red-500/10 right-0"
                                title="Delete Document"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Recent Chats Section with Enhanced Rendering */}
          {isOpen && (
            <div className="flex-grow flex flex-col overflow-hidden">
              <h6
                className="
                  text-white mb-2 flex justify-between 
                  items-center font-semibold text-xs uppercase 
                  tracking-wider
                  bg-gradient-to-r from-gray-800/30 to-transparent 
                  p-2 rounded-lg
                  relative
                "
              >
                Recent Chats
                <div className="flex items-center space-x-2">
  <button 
    onClick={() => setChatFilterMode(prev => prev ? null : 'recent')}
    className="p-1 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-gray-700/30"
    title='Filter Chats'
  >
    <Filter size={16} />
  </button>
  <button
    onClick={toggleChatHistory}
    className="p-1 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-gray-700/30"
  >
    {isChatHistoryVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
  </button>
</div>
                
                {/* Chat Filter Dropdown */}
                {chatFilterMode && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gradient-to-r from-[#2c3e95] to-[#3fa88e] focus:ring-[#5ff2b6]  rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      {[
                        { value: 'recent', label: 'Most Recent', icon: <Calendar size={16} /> },
                        { value: 'oldest', label: 'Oldest First', icon: <Calendar size={16} /> },
                        { value: 'mostMessages', label: 'Most Messages', icon: <Tag size={16} /> }
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setChatFilterMode(filter.value)}
                          className={`
                            w-full text-left px-4 py-2 flex items-center 
                            hover:bg-gray-500/30 
                            ${chatFilterMode === filter.value ? 'bg-gradient-to-b from-blue-300/20 focus:ring-[#5ff2b6] border border-[#5ff2b6] rounded-xl shadow-lgtext-white' : ''}
                          `}
                        >
                          {filter.icon}
                          <span className="ml-2">{filter.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </h6>

              {/* Add Chat Search Input */}
              {isChatHistoryVisible && (
                <div className="mb-2">
                  <div className="flex items-center bg-gray-800/30 rounded-lg">
                    <Search size={16} className="ml-2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      value={chatSearchTerm}
                      onChange={(e) => setChatSearchTerm(e.target.value)}
                      className="
                        w-full bg-transparent 
                        text-white 
                        placeholder-gray-400 
                        p-2 
                        focus:outline-none 
                        text-sm
                      "
                    />
                    {chatSearchTerm && (
                      <button 
                        onClick={handleResetChatSearch}
                        className="mr-2 text-gray-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {isChatHistoryVisible && (
                <div
                  className="
                    max-h-60 overflow-y-auto 
                    custom-scrollbar pr-2 space-y-2
                  "
                >
                  {filteredChatHistory.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">
                      {chatSearchTerm 
                        ? `No chats match "${chatSearchTerm}"` 
                        : 'No recent chats available'}
                  </div>
                  ) : (
                    filteredChatHistory.map((chat) => (
                      <div
                        key={`chat-${chat.conversation_id}`}
                        className={`
                          relative group cursor-pointer 
                          hover:bg-gray-700 
                          hover:shadow-md 
                          p-2 rounded-lg text-sm
                          transition-all duration-300
                          ${activeConversationId === chat.conversation_id 
                            ? 'bg-gradient-to-b from-blue-300/20 border border-[#5ff2b6]/50 text-white' 
                            : ''}
                        `}
                      >
                        {isRenamingChat === chat.conversation_id ? (
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={newChatTitle}
                              onChange={(e) => setNewChatTitle(e.target.value)}
                              className="flex-grow bg-gray-700 text-white p-1 rounded"
                              placeholder="Enter new chat name"
                            />
                            <button 
                              onClick={() => handleRenameChat(chat.conversation_id)}
                              className="ml-2 text-green-400 hover:text-green-300"
                            >
                              ✓
                            </button>
                            <button 
                              onClick={() => setIsRenamingChat(null)}
                              className="ml-2 text-red-400 hover:text-red-300"
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => handleChatSelection(chat)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <MessageCircle size={16} className="text-green-400 mr-2" />
                              <div className="flex flex-col flex-grow overflow-hidden">
                                <span>{chat.title || 'Untitled Conversation'}</span>
                                <span className="text-xs text-gray-400">
                                    {formatRelativeDate(chat.created_at)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Chat Management Actions */}
                            <div className="hidden group-hover:flex items-center space-x-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsRenamingChat(chat.conversation_id);
                                  setNewChatTitle(chat.title);
                                }}
                                className="text-blue-400 hover:text-blue-300"
                                title="Rename Chat"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteChatConfirmation(chat);
  }}
  className="text-red-400 hover:text-red-300"
  title="Delete Chat"
>
  <Trash2 size={16} />
</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
  
        {/* Footer Options (previous implementation remains the same) */}
          {isOpen && (
            <div className="border-t border-gray-600 p-4 pt-2">
              <div className="space-y-2">
                <button
                  className="
                    text-white w-full text-left flex 
                    items-center gap-3 p-2 
                    rounded-lg hover:bg-gray-700 
                    hover:shadow-md transition-all active:scale-95 
                  "
                >
                  <Settings size={20} className="text-blue-400" />
                  Settings
                </button>
                <button
                  className="
                    text-white w-full text-left flex 
                    items-center gap-3 p-2 
                    rounded-lg hover:bg-gray-700 active:scale-95 
                    hover:shadow-md transition-all
                  "
                >
                  <CircleHelp size={20} className="text-green-400" />
                  Help
                </button>
              </div>
            </div>
          )}
        </aside>
    
        {/* Custom Scrollbar Styles */}
        <style>{`
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
        <DeleteModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleConfirmDelete}
  documentName={documentToDelete?.filename || ''}
/>




<DeleteChatModal
  isOpen={isDeleteChatModalOpen}
  onClose={() => setIsDeleteChatModalOpen(false)}
  onConfirm={() => handleDeleteConversation(chatToDelete?.conversation_id)}
  chatTitle={chatToDelete?.title || 'Untitled Conversation'}
/>
      </div>
      
      
    );
    
  }; 
 
Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired, 
  isMobile: PropTypes.bool.isRequired,
  mainProjectId: PropTypes.string.isRequired,
  onSelectChat: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDocumentSelect: PropTypes.func,
  onNewChat: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  setSelectedDocuments: PropTypes.func.isRequired,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string).isRequired,
};


export default Sidebar;