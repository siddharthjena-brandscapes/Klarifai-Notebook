// //sidebar.jsx with project management
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
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
  Tag,
  Lightbulb, Sparkles,
  Eye, 
  Download
} from 'lucide-react';
import { documentService, chatService } from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import DeleteModal from './DeleteModal';
import DeleteChatModal  from './DeleteChatModal';
import { ideaService, coreService } from '../../utils/axiosConfig';
import DocumentViewer from './DocumentViewer'; 
import DocumentSearchModal from './DocumentSearchModal'; 
import BulkDeleteModal from './BulkDeleteModal';

const Sidebar = ({ 
  isOpen, 
  isMobile,
  mainProjectId,
  onSelectChat, 
  onDocumentSelect, 
  onSendMessage, 
  setSelectedDocuments, 
  selectedDocuments,
  onNewChat,
  
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

  const [disabledModules, setDisabledModules] = useState({});
  const [projectModules, setProjectModules] = useState([]);

  const [viewingDocument, setViewingDocument] = useState(null);

  // Add navigate for redirection
  const navigate = useNavigate();
  
  // Add this state for tracking the generate ideas button animation
  const [isGenerateIdeasAnimating, setIsGenerateIdeasAnimating] = useState(false);

  const [isDocumentSearchModalOpen, setIsDocumentSearchModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const toggleBulkDeleteMode = () => {
    // If turning off bulk delete mode, clear any document selections
    if (bulkDeleteMode) {
      setSelectedDocuments([]);
      setIsSelectAllChecked(false);
    }
    setBulkDeleteMode(!bulkDeleteMode);
  };
  
  // Function to handle bulk deletion confirmation
  const handleBulkDeleteConfirmation = () => {
    if (selectedDocuments.length > 0) {
      setIsBulkDeleteModalOpen(true);
    } else {
      toast.warning("Please select at least one document to delete");
    }
  };
  
  // Function to perform bulk delete operation
  const handleBulkDelete = async () => {
    try {
      // Show a loading toast
      const loadingToastId = toast.loading(`Deleting ${selectedDocuments.length} documents...`);
      
      // Create an array of promises for each document delete operation
      const deletePromises = selectedDocuments.map(docId => 
        documentService.deleteDocument(parseInt(docId), mainProjectId)
      );
      
      // Wait for all delete operations to complete
      await Promise.all(deletePromises);
      
      // Update the documents list by filtering out deleted documents
      setDocuments(prevDocs => 
        prevDocs.filter(doc => !selectedDocuments.includes(doc.id.toString()))
      );
      
      // Clear selections
      setSelectedDocuments([]);
      setIsSelectAllChecked(false);
      
      // Close the modal
      setIsBulkDeleteModalOpen(false);
      
      // Exit bulk delete mode
      setBulkDeleteMode(false);
      
      // Update the toast notification
      toast.update(loadingToastId, {
        render: `Successfully deleted ${selectedDocuments.length} documents`,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Failed to delete documents', error);
      toast.error('Failed to delete some documents. Please try again.');
      setIsBulkDeleteModalOpen(false);
    }
  };


   // Check for disabled modules and project modules on mount
   useEffect(() => {
    // Get disabled modules from localStorage (set by Header component)
    const storedDisabledModules = localStorage.getItem('disabled_modules');
    if (storedDisabledModules) {
      try {
        setDisabledModules(JSON.parse(storedDisabledModules));
      } catch (error) {
        console.error('Error parsing disabled modules:', error);
      }
    }
    
    // Check if project modules in localStorage
    const storedProjectModules = localStorage.getItem('project_modules');
    if (storedProjectModules) {
      try {
        setProjectModules(JSON.parse(storedProjectModules));
      } catch (error) {
        console.error('Error parsing project modules:', error);
      }
    }
  }, []);

  // Fetch project details to get selected modules when not in localStorage
  useEffect(() => {
    const fetchProjectModules = async () => {
      if (!mainProjectId || projectModules.length > 0) return;
      
      try {
        const projectDetails = await coreService.getProjectDetails(mainProjectId);
        if (projectDetails && projectDetails.selected_modules) {
          setProjectModules(projectDetails.selected_modules);
          // Store for other components
          localStorage.setItem('project_modules', JSON.stringify(projectDetails.selected_modules));
        }
      } catch (error) {
        console.error("Failed to fetch project details:", error);
      }
    };
    
    fetchProjectModules();
  }, [mainProjectId, projectModules]);

  
  // Function to check if a module is disabled
  const isModuleDisabled = (moduleId) => {
    return disabledModules[moduleId] === true;
  };

   // Function to check if module is included in the current project
   const isModuleIncludedInProject = (moduleId) => {
    return projectModules.includes(moduleId);
  };
  
  // Function to check if a module should be available
  const isModuleAvailable = (moduleId) => {
    return !isModuleDisabled(moduleId) && isModuleIncludedInProject(moduleId);
  };

  const getMainProjectName = async () => {
    try {
      const project = await coreService.getProjectDetails(mainProjectId);
      return project.name;
    } catch (error) {
      console.error("Error fetching project name:", error);
      return "My Project"; // Fallback name
    }
  };
  
  
  
  // Function to handle generating ideas from selected documents
  // Update the handleGenerateIdeas function in your Sidebar.jsx
const handleGenerateIdeas = async () => {

    // Check if the idea-generator module is disabled or not included in project
    if (!isModuleAvailable('idea-generator')) {
      toast.error("Idea Generator is not available for this project");
      return;
    }
  if (!selectedDocuments || selectedDocuments.length === 0) {
    toast.warning("Please select at least one document first");
    return;
  }

 
  const mainProjectName = await getMainProjectName();

  try {
    // Show animation while processing
    setIsGenerateIdeasAnimating(true);
    
    toast.info("Extracting idea parameters from document...", {
      autoClose: 3000
    });

    // Call the backend API to extract parameters from the first selected document
    const response = await documentService.generateIdeaContext({
      document_id: selectedDocuments[0],
      main_project_id: mainProjectId
    });

    // Stop animation
    setIsGenerateIdeasAnimating(false);

    if (response.data && response.data.idea_parameters) {
      // Find the selected document's name for project title
      const selectedDoc = documents.find(doc => doc.id.toString() === selectedDocuments[0]);
      const documentName = selectedDoc ? selectedDoc.filename : "Document";
      
      // Create a default project name from document
      const projectName = response.data.suggested_project_name || 
      		`Ideas from ${response.data.document_name_no_ext || response.data.document_name}`;
      
      // Create a new project first
      const projectResponse = await ideaService.createProject({
        name: projectName,
        main_project_id: mainProjectId
      });
      
      if (projectResponse.data && projectResponse.data.success) {
        // Now navigate to the regular IdeaForm route with the new project ID
        const newProjectId = projectResponse.data.project.id;
        
        // Navigate to the form endpoint for this new project
        navigate(`/idea-generation/${mainProjectId}/form`, {
          state: {
            fromDocQA: true,
            document_id: response.data.document_id,
            document_name: response.data.document_name,
            idea_parameters: response.data.idea_parameters,
            main_project_id: mainProjectId,
            newProject: {
              id: newProjectId,
              name: projectName
            },
            projectName: mainProjectName
          }
        });
        
        toast.success("New project created! Loading Idea Generator...");
      } else {
        throw new Error("Failed to create a new project");
      }
    } else {
      toast.error("Failed to extract idea parameters from the document.");
    }
  } catch (error) {
    // Stop animation on error
    setIsGenerateIdeasAnimating(false);
    console.error("Error generating idea context:", error);
    toast.error("Failed to extract idea parameters. Please try again.");
  }
};
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

        const chatDocIds = fullChatData.selected_documents.map(doc => 
          doc.toString ? doc.toString() : String(doc)
        );

        if (chatDocIds.length > 0) {
          scrollToSelectedDocument(chatDocIds[0]);
        }
    
  
        if (onSelectChat) {
          onSelectChat(fullChatData);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      toast.error('Failed to load conversation history');
    }
  };

// New function to scroll to a selected document with visual feedback
const scrollToSelectedDocument = (documentId) => {
  if (!documentId) return;
  
  console.log('Attempting to scroll to document:', documentId);
  
  // Find the document element by its data attribute
  const documentElement = document.querySelector(`[data-doc-id="${documentId}"]`);
  
  if (documentElement) {
    console.log('Found document element:', documentElement);
    
    // Force update the checkbox state
    const checkbox = documentElement.querySelector('input[type="checkbox"]');
    if (checkbox) {
      console.log('Found checkbox, ensuring it is checked');
      checkbox.checked = true;
    }
    
    // Get the document container - the scrollable parent
    const documentContainer = documentElement.closest('.custom-scrollbar');
    
    if (documentContainer) {
      // Function to handle the visual highlighting
      const highlightDocument = () => {
        // Add a highlight animation class
        documentElement.classList.add('document-highlight-animation');
        
        // Remove the highlight class after animation completes
        setTimeout(() => {
          documentElement.classList.remove('document-highlight-animation');
        }, 2000);
      };
      
      // Scroll the document into view with a smooth animation
      documentElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Apply the highlight effect after scrolling
      setTimeout(highlightDocument, 300);
      
      // Also display a toast notification to enhance UX
      
    }
  } else {
    console.log('Document element not found for ID:', documentId);
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
    }, 10000);
  
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
  
 
  // Replace the existing handleDeleteConversation function with this updated version
  const handleDeleteConversation = async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);
      
      // Remove from chat history state
      setChatHistory(prevHistory => 
        prevHistory.filter(chat => chat.conversation_id !== conversationId)
      );
      
      // If the deleted chat was active, reset the view
      if (activeConversationId === conversationId) {
        // Clear the active conversation ID
        setActiveConversationId(null);
        
        // Call the onNewChat callback properly
        if (onNewChat) {
          // Call with no parameter to avoid preventDefault errors
          onNewChat();
          
          // Add a toast notification for better UX
          toast.success('Started new conversation');
        }
      }
      
      // Close the modal
      setIsDeleteChatModalOpen(false);
      setChatToDelete(null);
      
      // Show success message
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
  
const activeConversation = activeConversationId ? 
  chatHistory.find(chat => chat.conversation_id === activeConversationId) : 
  null; 
  

  // Add a new method to handle viewing the original document
  const handleViewOriginalDocument = (doc) => {
    // Track document view (optional)
    documentService.trackDocumentView(doc.id)
      .catch(error => console.error('Failed to track document view:', error));
    
    setViewingDocument(doc);
  };

  // Add this function to close the document viewer
  const closeDocumentViewer = () => {
    setViewingDocument(null);
  };

  const renderDocumentItem = (doc) => (
    <div
      key={doc.id}
      data-doc-id={doc.id}
      className={`
        flex items-center gap-2 
        p-2 rounded-lg 
        cursor-pointer 
        transition-all 
        ${selectedDocuments.includes(doc.id.toString())
          ? ' bg-gradient-to-b from-blue-300/20 border border-[#5ff2b6]/50 text-white' 
          : 'hover:bg-gray-700'}
        ${activeDocumentId === doc.id && !bulkDeleteMode ? 'border border-yellow-400' : ''}
        ${bulkDeleteMode ? 'hover:bg-red-900/20' : ''}
        group relative
      `}
      onClick={() => bulkDeleteMode ? handleDocumentToggle(doc.id) : handleDocumentClick(doc.id)}
    >
      <input
        type="checkbox"
        checked={selectedDocuments.includes(doc.id.toString())}
        readOnly
        className={`mr-2 form-checkbox 
          h-3 w-3 
          ${bulkDeleteMode ? 'text-red-600 border-red-400' : 'text-blue-600 border-[#5ff2b6]'}
          rounded-xl
          focus:ring-[#5ff2b6]`}
      />
      <FileText size={16} className={bulkDeleteMode ? "text-red-400 flex-shrink-0" : "text-blue-400 flex-shrink-0"} />
      <div className="flex-grow flex items-center justify-between overflow-hidden">
        <div className="flex flex-col flex-grow overflow-hidden">
          <span className="truncate text-sm">{doc.filename}</span>
          <span className="text-xs text-gray-400">
            {formatRelativeDate(doc.created_at || doc.uploaded_at)}
          </span>
        </div>
        
        {/* Document actions menu - only show when not in bulk delete mode */}
        {!bulkDeleteMode && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleViewOriginalDocument(doc);
              }}
              className="text-blue-400 hover:text-blue-300 p-1 rounded-full
                transition-colors duration-300
                focus:outline-none
                hover:bg-blue-500/10"
              title="View Original Document"
            >
              <Eye size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteConfirmation(doc);
              }}
              className="text-red-400 hover:text-red-300 p-1 rounded-full
                transition-colors duration-300
                focus:outline-none
                hover:bg-red-500/10"
              title="Delete Document"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
  
  // Modified documents list rendering with bulk delete option
  const renderDocumentsList = () => (
    <>
      {/* Documents actions header */}
      {filteredDocuments.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center p-2 bg-gray-800/30 to-blue-900/20 rounded-lg backdrop-blur-md mb-2 justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="select-all-documents"
              checked={isSelectAllChecked}
              onChange={handleSelectAllDocuments}
              className={`mr-2 form-checkbox 
                  h-3 w-3 
                  ${bulkDeleteMode ? 'text-red-600 border-red-400' : 'text-blue-600 border-gray-300'}
                  rounded-xl
                  focus:ring-blue-500
                  backdrop-blur-md`}
            />
            <label 
              htmlFor="select-all-documents" 
              className="text-sm text-gray-300 cursor-pointer"
            >
              Select All
            </label>
            
            {selectedDocuments.length > 0 && (
              <span className="text-xs text-red-400 ml-2">
                {selectedDocuments.length} selected
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            {/* Delete button that opens modal directly */}
            <button
              onClick={() => {
                if (selectedDocuments.length > 0) {
                  setIsBulkDeleteModalOpen(true);
                } else {
                  toast.info("Select documents to delete", { autoClose: 2000 });
                }
              }}
              className="p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-300 hover:bg-red-700/30"
              title="Delete Selected Documents"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
      
      {filteredDocuments.length === 0 ? (
        <div className="text-gray-400 text-center py-4">
          {documentSearchTerm 
            ? `No documents match "${documentSearchTerm}"` 
            : 'No documents available'}
        </div>
      ) : (
        filteredDocuments.map(doc => renderDocumentItem(doc))
      )}
    </>
  );
  
  // Add this before the return statement in your Sidebar component
const formattedActiveConversation = activeConversation ? {
  ...activeConversation,
  conversation_id: activeConversation.conversation_id || activeConversationId,
  title: activeConversation.title || 'Untitled Conversation',
  created_at: activeConversation.created_at || new Date().toISOString(),
  messages: activeConversation.messages || []
} : null;

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

           {/* Generate Ideas Button - Only shown if user has access to the idea-generator module */}
           {isOpen && isModuleAvailable('idea-generator') && (
            <div className="mb-4 relative">
              <button
                onClick={handleGenerateIdeas}
                disabled={!selectedDocuments || selectedDocuments.length === 0}
                className={`
                  w-full py-3 px-4 rounded-lg
                  ${selectedDocuments && selectedDocuments.length > 0 
                    ? 'bg-gradient-to-r from-indigo-600/90 to-purple-500/90 hover:from-indigo-700 hover:to-purple-600' 
                    : 'bg-gray-700/50 cursor-not-allowed opacity-60'
                  }
                  text-white transition-all duration-300
                  flex items-center justify-center gap-2
                  shadow-lg hover:shadow-xl active:scale-95
                  border ${selectedDocuments && selectedDocuments.length > 0 ? 'border-indigo-400/30' : 'border-gray-600/30'}
                  relative overflow-hidden
                `}
              >
                {/* Animated background when active */}
                {isGenerateIdeasAnimating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-500/30 animate-pulse"></div>
                )}
                
                {/* Icon with conditional animation */}
                <Lightbulb 
                  size={18} 
                  className={`
                    ${selectedDocuments && selectedDocuments.length > 0 ? 'text-yellow-300' : 'text-gray-400'}
                    ${isGenerateIdeasAnimating ? 'animate-pulse' : ''}
                  `} 
                />
                
                {/* Sparkles animation when hovering and enabled */}
                {selectedDocuments && selectedDocuments.length > 0 && (
                  <Sparkles 
                    size={14} 
                    className="absolute top-1 right-2 text-yellow-200/70 animate-pulse" 
                  />
                )}
                
                <span>Create Ideas from Documents</span>
              </button>
              
              {/* Status indicator text */}
              <p className={`
                text-xs text-center mt-1.5 
                ${selectedDocuments && selectedDocuments.length > 0 ? 'text-indigo-300/80' : 'text-gray-500'}
                transition-colors duration-300
              `}>
                {selectedDocuments && selectedDocuments.length > 0 
                  ? `Transform ${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''} into creative ideas`
                  : 'Select documents first to generate ideas'}
              </p>
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
    onClick={() => setIsDocumentSearchModalOpen(true)}
    className="p-1.5 text-gray-300 hover:text-white transition-colors 
      rounded-lg hover:bg-gray-700/30 relative group"
    title='Advanced Document Search'
  >
    <Search size={16} />
    <span className="hidden group-hover:block absolute -top-8 left-1/2 transform -translate-x-1/2 
      bg-gray-900 text-xs text-white py-1 px-2 rounded whitespace-nowrap">
      Search in content
    </span>
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
                    renderDocumentsList()
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
  
       {/* Sidebar Footer with Download Feature */}
{/* {isOpen && (
  <div className="sidebar-footer mt-auto border-t border-gray-700/30 pt-3 px-4 pb-4">
    <div className="flex items-center justify-between">
      <div className="flex-grow">
        <ChatDownloadFeature
          currentChatData={formattedActiveConversation}
          mainProjectId={mainProjectId}
          chatHistory={chatHistory}
          activeConversationId={activeConversationId}
          className="download-button"
        />
      </div>
      
     
    </div>
  </div>
)} */}
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

            @keyframes documentHighlight {
        0% { background-color: rgba(95, 242, 182, 0.6); box-shadow: 0 0 10px rgba(95, 242, 182, 0.8); }
        50% { background-color: rgba(95, 242, 182, 0.3); box-shadow: 0 0 15px rgba(95, 242, 182, 0.4); }
        100% { background-color: transparent; box-shadow: none; }
      }
      
      .document-highlight-animation {
        animation: documentHighlight 2s ease-out forwards;
      }
      
      .selected-document {
        background: linear-gradient(to right, rgba(95, 242, 182, 0.1), rgba(44, 62, 149, 0.1)) !important;
        border: 1px solid rgba(95, 242, 182, 0.5) !important;
      }
      
      /* Make checkboxes more visible */
      input[type="checkbox"] {
        accent-color: #5ff2b6;
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      
      /* Ensure checkboxes are properly positioned */
      [data-doc-id] {
        position: relative;
      }
      
      /* Style for when document is both selected and active */
      [data-doc-id].selected-document.document-highlight-animation {
        border: 1px solid rgba(95, 242, 182, 0.8) !important;
      }
         @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(124, 58, 237, 0.5); }
            50% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.8); }
            100% { box-shadow: 0 0 5px rgba(124, 58, 237, 0.5); }
          }
          
          .glow-animation {
            animation: glow 2s infinite;
          }
          
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-3px); }
            100% { transform: translateY(0px); }
          }
          
          .float-animation {
            animation: float 3s ease-in-out infinite;
          }

          .sidebar-footer .download-button {
  height: 40px;
  background: rgba(44, 62, 149, 0.5);
  border: 1px solid rgba(95, 242, 182, 0.2);
  transition: all 0.2s ease;
}

.sidebar-footer .download-button:hover {
  background: rgba(44, 62, 149, 0.7);
  border-color: rgba(95, 242, 182, 0.5);
}
        `}</style>

{viewingDocument && (
        <DocumentViewer
          documentId={viewingDocument.id}
          filename={viewingDocument.filename}
          onClose={closeDocumentViewer}
        />
      )}
        <DeleteModal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onConfirm={handleConfirmDelete}
  documentName={documentToDelete?.filename || ''}
/>
<DocumentSearchModal
    isOpen={isDocumentSearchModalOpen}
    onClose={() => setIsDocumentSearchModalOpen(false)}
    documents={documents}
    mainProjectId={mainProjectId}
    onDocumentSelect={handleDocumentSelect}
    setSelectedDocuments={setSelectedDocuments}
    selectedDocuments={selectedDocuments}
  />

<DeleteChatModal
  isOpen={isDeleteChatModalOpen}
  onClose={() => setIsDeleteChatModalOpen(false)}
  onConfirm={() => handleDeleteConversation(chatToDelete?.conversation_id)}
  chatTitle={chatToDelete?.title || 'Untitled Conversation'}
/>
<BulkDeleteModal
      isOpen={isBulkDeleteModalOpen}
      onClose={() => setIsBulkDeleteModalOpen(false)}
      onConfirm={handleBulkDelete}
      selectedCount={selectedDocuments.length}
      selectedDocuments={selectedDocuments}
      documents={documents}
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

