// //sidebar.jsx with project management
/* eslint-disable no-unused-vars */
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useContext,
} from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  CircleHelp,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageCircle,
  Search,
  X,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  Tag,
  Lightbulb,
  Sparkles,
  Eye,
  Download,
  ChevronRight,
  PanelLeft,
  HelpCircle,
} from "lucide-react";
import { documentService, chatService } from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import DeleteModal from "./DeleteModal";
import DeleteChatModal from "./DeleteChatModal";
import { ideaService, coreService } from "../../utils/axiosConfig";
import DocumentViewer from "./DocumentViewer";
import DocumentSearchModal from "./DocumentSearchModal";
import ChatDownloadFeature from "./ChatDownloadFeature";
import BulkDeleteModal from "./BulkDeleteModal";
import FaqButton from "../faq/FaqButton";
import { ThemeContext } from "../../context/ThemeContext";

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
  chatInputFocused,
  onToggle,
}) => {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatHistoryVisible, setIsChatHistoryVisible] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isDocumentsVisible, setIsDocumentsVisible] = useState(false);
  const [showDocumentSearch, setShowDocumentSearch] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [documentSearchTerm, setDocumentSearchTerm] = useState("");
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Add new state for chat management
  const [chatFilterMode, setChatFilterMode] = useState(null);
  const [isRenamingChat, setIsRenamingChat] = useState(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isDeleteChatModalOpen, setIsDeleteChatModalOpen] = useState(false);

  const [disabledModules, setDisabledModules] = useState({});
  const [projectModules, setProjectModules] = useState([]);

  const [viewingDocument, setViewingDocument] = useState(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Add navigate for redirection
  const navigate = useNavigate();

  // Add this state for tracking the generate ideas button animation
  const [isGenerateIdeasAnimating, setIsGenerateIdeasAnimating] =
    useState(false);

  const [isDocumentSearchModalOpen, setIsDocumentSearchModalOpen] =
    useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [isDocumentsExpanded, setIsDocumentsExpanded] = useState(false);

  const { theme } = useContext(ThemeContext);

  // Add this with your other state variables
  const [sidebarView, setSidebarView] = useState("chats"); // Options: 'chats' or 'documents'

  // In Sidebar.jsx, update the useEffect for chat input focus
  // useEffect(() => {
  //   if (chatInputFocused) {
  //     setSidebarView("chats");
  //   }
  // }, [chatInputFocused]);

  // Add this with your other useEffect hooks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isFilterDropdownOpen &&
        !event.target.closest(".filter-dropdown-container")
      ) {
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

  useEffect(() => {
    // Use setTimeout to ensure the DOM is fully loaded
    setTimeout(() => {
      // Try multiple selectors to find the chat input
      const chatInputElement =
        document.querySelector(".chat-input-area") ||
        document.querySelector('textarea[placeholder*="Ask me"]');

      console.log("Chat input element found:", chatInputElement); // Debug

      if (!chatInputElement) {
        console.warn("Chat input element not found");
        return;
      }

      const handleChatInputFocus = () => {
        console.log("Chat input focused"); // Debug
        // Collapse Documents section
        setIsDocumentsVisible(false);
        // Expand Chat History section
        setIsChatHistoryVisible(true);
      };

      chatInputElement.addEventListener("focus", handleChatInputFocus);

      return () => {
        chatInputElement.removeEventListener("focus", handleChatInputFocus);
      };
    }, 1000); // Wait 1 second for everything to render
  }, []);
  // Modify this function to toggle Documents visibility and close Chat section
  const toggleDocumentsVisibility = () => {
    setIsDocumentsVisible(!isDocumentsVisible);
    // Close the chat history when documents are made visible
    if (!isDocumentsVisible) {
      setIsChatHistoryVisible(false);
    }
  };

  // Similarly, modify chat toggle function to close documents section

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
      const loadingToastId = toast.loading(
        `Deleting ${selectedDocuments.length} documents...`
      );

      // Create an array of promises for each document delete operation
      const deletePromises = selectedDocuments.map((docId) =>
        documentService.deleteDocument(parseInt(docId), mainProjectId)
      );

      // Wait for all delete operations to complete
      await Promise.all(deletePromises);

      // Update the documents list by filtering out deleted documents
      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => !selectedDocuments.includes(doc.id.toString()))
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
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Failed to delete documents", error);
      toast.error("Failed to delete some documents. Please try again.");
      setIsBulkDeleteModalOpen(false);
    }
  };

  // Check for disabled modules and project modules on mount
  useEffect(() => {
    // Get disabled modules from localStorage (set by Header component)
    const storedDisabledModules = localStorage.getItem("disabled_modules");
    if (storedDisabledModules) {
      try {
        setDisabledModules(JSON.parse(storedDisabledModules));
      } catch (error) {
        console.error("Error parsing disabled modules:", error);
      }
    }

    // Check if project modules in localStorage
    const storedProjectModules = localStorage.getItem("project_modules");
    if (storedProjectModules) {
      try {
        setProjectModules(JSON.parse(storedProjectModules));
      } catch (error) {
        console.error("Error parsing project modules:", error);
      }
    }
  }, []);

  // Fetch project details to get selected modules when not in localStorage
  useEffect(() => {
    const fetchProjectModules = async () => {
      if (!mainProjectId || projectModules.length > 0) return;

      try {
        const projectDetails = await coreService.getProjectDetails(
          mainProjectId
        );
        if (projectDetails && projectDetails.selected_modules) {
          setProjectModules(projectDetails.selected_modules);
          // Store for other components
          localStorage.setItem(
            "project_modules",
            JSON.stringify(projectDetails.selected_modules)
          );
        }
      } catch (error) {
        console.error("Failed to fetch project details:", error);
      }
    };

    fetchProjectModules();
  }, [mainProjectId, projectModules]);


  const processWebSources = (sourcesInfo, extractedUrls) => {
  let webSources = [];
  
  if (sourcesInfo) {
    if (typeof sourcesInfo === 'string') {
      webSources = sourcesInfo
        .split(',')
        .map(source => source.trim())
        .filter(source => source && source !== '*');
    } else if (Array.isArray(sourcesInfo)) {
      webSources = sourcesInfo;
    }
  } else if (extractedUrls && Array.isArray(extractedUrls) && extractedUrls.length > 0) {
    webSources = extractedUrls;
  }
  
  return webSources;
};


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
  if (!isModuleAvailable("idea-generator")) {
    toast.error("Idea Generator is not available for this project");
    return;
  }
  if (!selectedDocuments || selectedDocuments.length === 0) {
    toast.warning("Please select at least one document first");
    return;
  }

  // Check if more than one document is selected
  if (selectedDocuments.length > 1) {
    toast.warning("Please select only one document to generate ideas");
    return;
  }

  // Create and show loading overlay
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'idea-generator-loading-overlay';
  loadingOverlay.className = `fixed inset-0 flex items-center justify-center z-50 ${theme === "dark" ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-sm`;
  
  // Create the loader element
  const loaderHTML = `
    <div class="flex flex-col items-center">
      <span class="idea-generator-loader mb-4"></span>
      <div class="${theme === "dark" ? 'text-white' : 'text-[#a55233]'} text-lg font-medium">
        Analyzing document and preparing ideas...
      </div>
    </div>
  `;
  
  loadingOverlay.innerHTML = loaderHTML;
  document.body.appendChild(loadingOverlay);

  try {
    // Show animation while processing
    setIsGenerateIdeasAnimating(true);

    // toast.info("Extracting idea parameters from document...", {
    //   autoClose: 3000,
    // });

    const mainProjectName = await getMainProjectName();

    // Call the backend API to extract parameters from the first selected document
    const response = await documentService.generateIdeaContext({
      document_id: selectedDocuments[0],
      main_project_id: mainProjectId,
    });

    // Find the selected document's name for project title
    const selectedDoc = documents.find(
      (doc) => doc.id.toString() === selectedDocuments[0]
    );
    const documentName = selectedDoc ? selectedDoc.filename : "Document";

    // Create a default project name from document
    const projectName =
      response.data.suggested_project_name ||
      `Ideas from ${
        response.data.document_name_no_ext || response.data.document_name
      }`;

    // Create a new project first
    const projectResponse = await ideaService.createProject({
      name: projectName,
      main_project_id: mainProjectId,
    });

    if (projectResponse.data && projectResponse.data.success) {
      // Now navigate to the regular IdeaForm route with the new project ID
      const newProjectId = projectResponse.data.project.id;

      // Remove the loading overlay before navigation
      const loadingElement = document.getElementById('idea-generator-loading-overlay');
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }
      
      // Reset animation state
      setIsGenerateIdeasAnimating(false);

      // Navigate to the idea generator form
      navigate(`/idea-generation/${mainProjectId}/form`, {
        state: {
          fromDocQA: true,
          document_id: response.data.document_id,
          document_name: response.data.document_name,
          idea_parameters: response.data.idea_parameters,
          main_project_id: mainProjectId,
          newProject: {
            id: newProjectId,
            name: projectName,
          },
          projectName: mainProjectName,
        },
      });

      toast.success("New project created!");
    } else {
      throw new Error("Failed to create a new project");
    }
  } catch (error) {
    // Remove the loading overlay on error
    const loadingElement = document.getElementById('idea-generator-loading-overlay');
    if (loadingElement) {
      document.body.removeChild(loadingElement);
    }
    
    // Stop animation on error
    setIsGenerateIdeasAnimating(false);
    console.error("Error generating idea context:", error);
    toast.error("Failed to extract idea parameters. Please try again.");
  }
};

  const handleResetSearch = () => {
    setDocumentSearchTerm("");
  };
  // New method to handle document deletion
  const handleDeleteDocument = async (documentId) => {
    try {
      // Call delete service
      await documentService.deleteDocument(documentId, mainProjectId);

      // Remove document from local state
      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== documentId)
      );

      // Remove from selected documents
      setSelectedDocuments((prevSelected) =>
        prevSelected.filter((id) => id !== documentId.toString())
      );

      // If deleted document was active, reset active document
      if (activeDocumentId === documentId) {
        setActiveDocumentId(null);
        sessionStorage.removeItem("active_document_id");
      }

      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Failed to delete document", error);
      toast.error("Failed to delete document");
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
    return safeDocuments.filter(
      (doc) =>
        doc &&
        (doc.filename.toLowerCase().includes(searchTermLower) ||
          (doc.description &&
            doc.description.toLowerCase().includes(searchTermLower)))
    );
  }, [documents, documentSearchTerm]);

  const generateChatTitle = (chat) => {
    // If there's a custom title already set, use it
    if (chat.title && !chat.title.startsWith("Chat 20")) {
      return chat.title;
    }

    // Find the first user message
    const firstUserMessage = chat.messages?.find(
      (msg) => msg.role === "user"
    )?.content;

    if (firstUserMessage) {
      // Truncate and clean the message to create a title
      let title = firstUserMessage
        .trim()
        .split(/[.!?]/)[0] // Take first sentence
        .slice(0, 22); // Limit length

      // Add ellipsis if truncated
      if (firstUserMessage.length > 25) {
        title += "...";
      }

      return title;
    }

    return "New Conversation"; // Default fallback
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
        console.warn("No mainProjectId provided, skipping chat history fetch");
        setChatHistory([]);
        return;
      }

      setLoading(true);
      console.log("Fetching chat history for project:", mainProjectId);

      const response = await chatService.getAllConversations(mainProjectId);

      if (response && response.data) {
        // Process chat history to ensure proper grouping of messages
        const processedChatHistory = response.data.map((chat) => {
          // Use the first user message as the title if no title is set

          const messageCount = chat.messages?.length || 0;

          return {
            ...chat,
            title: generateChatTitle(chat),
            message_count: messageCount,
            messages: chat.messages || [],
            conversation_id: chat.conversation_id,
          };
        });

        // Sort chats by most recent first
        const sortedHistory = processedChatHistory.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setChatHistory(sortedHistory);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast.error("Failed to fetch chat history");
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
    console.log("Fetching conversation details for:", selectedChat.conversation_id);

    const response = await chatService.getConversationDetails(
      selectedChat.conversation_id,
      mainProjectId
    );

    if (response && response.data) {
      console.log("Fetched conversation details:", response.data);

      // Process messages to include webSources
      const processedMessages = (response.data.messages || []).map(msg => {
        if (msg.sources_info || msg.extracted_urls || msg.webSources) {
          return {
            ...msg,
            webSources: msg.webSources || processWebSources(msg.sources_info, msg.extracted_urls)
          };
        }
        return msg;
      });

      // Prepare the full chat data with processed messages
      const fullChatData = {
        ...response.data,
        conversation_id: selectedChat.conversation_id,
        messages: processedMessages, // ← Use processed messages instead
        selected_documents: response.data.selected_documents || [],
        title: response.data.title,
        follow_up_questions: response.data.follow_up_questions || [],
      };

      const chatDocIds = fullChatData.selected_documents.map((doc) =>
        doc.toString ? doc.toString() : String(doc)
      );

      if (chatDocIds.length > 0) {
        scrollToSelectedDocument(chatDocIds[0]);
      }

      if (onSelectChat) {
        onSelectChat(fullChatData);
      }
      if (setSelectedDocuments) {
        setSelectedDocuments(fullChatData.selected_documents || []);
      }
    }
  } catch (error) {
    console.error("Error fetching conversation details:", error);
    toast.error("Failed to load conversation history");
  }
  setSidebarView("chats");
};

  // New function to scroll to a selected document with visual feedback
  const scrollToSelectedDocument = (documentId) => {
    if (!documentId) return;

    console.log("Attempting to scroll to document:", documentId);

    // Find the document element by its data attribute
    const documentElement = document.querySelector(
      `[data-doc-id="${documentId}"]`
    );

    if (documentElement) {
      console.log("Found document element:", documentElement);

      // Force update the checkbox state
      const checkbox = documentElement.querySelector('input[type="checkbox"]');
      if (checkbox) {
        console.log("Found checkbox, ensuring it is checked");
        checkbox.checked = true;
      }

      // Get the document container - the scrollable parent
      const documentContainer = documentElement.closest(".custom-scrollbar");

      if (documentContainer) {
        // Function to handle the visual highlighting
        const highlightDocument = () => {
          // Add a highlight animation class
          documentElement.classList.add("document-highlight-animation");

          // Remove the highlight class after animation completes
          setTimeout(() => {
            documentElement.classList.remove("document-highlight-animation");
          }, 2000);
        };

        // Scroll the document into view with a smooth animation
        documentElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        // Apply the highlight effect after scrolling
        setTimeout(highlightDocument, 300);

        // Also display a toast notification to enhance UX
      }
    } else {
      console.log("Document element not found for ID:", documentId);
    }
  };

  // Fetch documents on component mount and set up periodic refresh
  useEffect(() => {
    console.log("mainProjectId changed to:", mainProjectId);
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
      console.log("No mainProjectId, skipping fetch");
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
      console.error("Error fetching documents:", error);
      setDocuments([]);
      toast.error("Failed to fetch documents");
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
    const doc = documents.find((d) => d.id === documentId);
    if (doc) {
      try {
        await documentService.setActiveDocument(doc.id, mainProjectId);
        setActiveDocumentId(doc.id);

        if (onDocumentSelect) {
          onDocumentSelect(doc);
        }

        sessionStorage.setItem("active_document_id", doc.id.toString());

        // Check if document is being selected or deselected
        const isSelected = selectedDocuments.includes(doc.id.toString());

        // Show different toast messages based on selection state
        toast.success(
          isSelected
            ? `Document "${doc.filename}" deselected`
            : `Document "${doc.filename}" selected`,
          {
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,

            icon: () => <FileText className="text-[#114430]" />,
          }
        );
      } catch (error) {
        console.error("Failed to set active document:", error);
        toast.error("Failed to set active document");
      }
    }
  };

  const toggleChatHistory = () => {
    setIsChatHistoryVisible(!isChatHistoryVisible);
    // Close the documents section when chat history is made visible
    if (!isChatHistoryVisible) {
      setIsDocumentsVisible(false);
    }
  };

  const handleNewChat = () => {
    console.log("New Chat clicked in sidebar with documents:", selectedDocuments);
    
    // First, reset the active conversation ID in the sidebar component itself
    setActiveConversationId(null);
    
    // Call the parent component's onNewChat callback
    if (onNewChat) {
      onNewChat();
      // Show confirmation to user
      toast.success(
        selectedDocuments.length > 0
          ? `Started new conversation with ${selectedDocuments.length} selected document${selectedDocuments.length !== 1 ? 's' : ''}`
          : "Started new conversation"
      );
    }
  };
  const handleDocumentToggle = async (documentId) => {
    const stringDocumentId = documentId.toString();

    // Create a new array based on the current selected documents
    const newSelectedDocuments = selectedDocuments.includes(stringDocumentId)
      ? selectedDocuments.filter((id) => id !== stringDocumentId)
      : [...selectedDocuments, stringDocumentId];

    // Update the parent component's state
    setSelectedDocuments(newSelectedDocuments);

    // Update "Select All" checkbox state
    const allDocumentIds = filteredDocuments.map((doc) => doc.id.toString());
    setIsSelectAllChecked(
      newSelectedDocuments.length === allDocumentIds.length
    );

    // Set the active document if it's being selected
    if (!selectedDocuments.includes(stringDocumentId)) {
      try {
        await documentService.setActiveDocument(documentId, mainProjectId); // Set the active document
      } catch (error) {
        console.error("Failed to set active document:", error);
        toast.error("Failed to set active document");
      }
    }
  };

  // New method to handle "Select All" and "Deselect All"
  const handleSelectAllDocuments = () => {
    if (isSelectAllChecked) {
      // Deselect all documents
      setSelectedDocuments([]);
      setIsSelectAllChecked(false);
      toast.success("All documents deselected", {
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,

        icon: () => <FileText className="text-[#114430]" />,
      });
    } else {
      // Select all documents
      const allDocumentIds = filteredDocuments.map((doc) => doc.id.toString());
      setSelectedDocuments(allDocumentIds);
      setIsSelectAllChecked(true);
      toast.success(`${allDocumentIds.length} documents selected`, {
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,

        icon: () => <FileText className="text-[#114430]" />,
      });
    }
  };

  const handleDocumentClick = (documentId) => {
    handleDocumentSelect(documentId); // Call the select function
    handleDocumentToggle(documentId); // Call the toggle function
    setSidebarView("documents");
  };

  const handleUpdateConversationTitle = async (conversationId, newTitle) => {
    try {
      // Validate title
      if (!newTitle || !newTitle.trim()) {
        toast.error("Chat title cannot be empty");
        return;
      }

      // Log the details for debugging
      console.log("Attempting to update conversation title:", {
        conversationId,
        newTitle,
      });

      // Add more detailed logging
      const updateData = {
        title: newTitle,
        is_active: true, // Ensure the conversation remains active
      };

      console.log("Update payload:", updateData);

      // Enhanced error handling in the service call
      const response = await chatService.updateConversationTitle(
        conversationId,
        updateData
      );

      console.log("Conversation update response:", response);

      // Update the local state to reflect the new title
      setChatHistory((prevHistory) =>
        prevHistory.map((chat) =>
          chat.conversation_id === conversationId
            ? { ...chat, title: newTitle }
            : chat
        )
      );

      toast.success("Conversation title updated successfully");

      // Reset renaming state
      setIsRenamingChat(null);
      setNewChatTitle("");
    } catch (error) {
      // Comprehensive error logging
      console.error("Failed to update conversation title", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        conversationId,
        newTitle,
      });

      // More specific error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        toast.error(
          error.response.data?.error || "Failed to update conversation title"
        );
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("No response received from server");
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error("Error setting up the request");
      }

      // Optionally, revert any UI changes
      setIsRenamingChat(null);
      setNewChatTitle("");
    }
  };

  // Replace the existing handleDeleteConversation function with this updated version
  const handleDeleteConversation = async (conversationId) => {
    try {
      await chatService.deleteConversation(conversationId);

      // Remove from chat history state
      setChatHistory((prevHistory) =>
        prevHistory.filter((chat) => chat.conversation_id !== conversationId)
      );

      // If the deleted chat was active, reset the view
      if (activeConversationId === conversationId) {
        // Clear the active conversation ID
        setActiveConversationId(null);

        if (onSelectChat) {
          onSelectChat(null);
        }
        // Call the onNewChat callback properly
        if (onNewChat) {
          // Call with no parameter to avoid preventDefault errors
          onNewChat();

          // Add a toast notification for better UX
          toast.success("Started new conversation");
        }
      }

      // Close the modal
      setIsDeleteChatModalOpen(false);
      setChatToDelete(null);

      // Show success message
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Failed to delete conversation", error);
      toast.error("Failed to delete conversation");
    }
  };

  const handleDeleteChatConfirmation = (chat) => {
  // Select the chat before opening the delete modal
  if (chat && chat.conversation_id) {
    // Set as active in sidebar
    setActiveConversationId(chat.conversation_id);
    // Notify parent to set as selected in main area
    if (onSelectChat) {
      handleChatSelection(chat); // This will fetch and set the chat as selected
    }
  }
  setChatToDelete(chat);
  setIsDeleteChatModalOpen(true);
};

  function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  // Enhanced chat filtering
  const filteredChatHistory = useMemo(() => {
    let filtered = [...chatHistory];

    // Apply search filter first
    if (chatSearchTerm) {
      const searchTermLower = chatSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (chat) =>
          chat.title.toLowerCase().includes(searchTermLower) ||
          (chat.summary && chat.summary.toLowerCase().includes(searchTermLower))
      );
    }

    switch (chatFilterMode) {
      case "recent":
        filtered.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "mostMessages":
        filtered.sort(
          (a, b) => (b.message_count || 0) - (a.message_count || 0)
        );
        break;
      default:
        break;
    }

    return filtered;
  }, [chatHistory, chatFilterMode, chatSearchTerm]);

  // Add this method to handle resetting chat search
  const handleResetChatSearch = () => {
    setChatSearchTerm("");
  };

  // Rename chat handler
  const handleRenameChat = async (conversationId) => {
    if (!newChatTitle.trim()) {
      toast.error("Chat title cannot be empty");
      return;
    }

    try {
      const updateData = {
        title: newChatTitle.trim(),
        is_active: true,
        main_project_id: mainProjectId, // Make sure this is available in your component
      };

      const response = await chatService.updateConversationTitle(
        conversationId,
        updateData
      );

      // Update local state
      setChatHistory((prevHistory) =>
        prevHistory.map((chat) =>
          chat.conversation_id === conversationId
            ? { ...chat, title: newChatTitle.trim() }
            : chat
        )
      );

      setIsRenamingChat(null);
      setNewChatTitle("");
      toast.success("Chat title updated successfully");
    } catch (error) {
      console.error("Failed to update conversation title", error);
      toast.error(error.response?.data?.error || "Failed to update chat title");
    }
  };

  const activeConversation = activeConversationId
    ? chatHistory.find((chat) => chat.conversation_id === activeConversationId)
    : null;

  // Add a new method to handle viewing the original document
  const handleViewOriginalDocument = (doc) => {
    // Track document view (optional)
    documentService
      .trackDocumentView(doc.id)
      .catch((error) => console.error("Failed to track document view:", error));

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
        flex items-center gap-1 
        py-1 px-2 rounded-lg 
        cursor-pointer 
        transition-all 
        ${
          selectedDocuments.includes(doc.id.toString())
            ? " bg-gradient-to-b from-blue-300/20 border border-[#5ff2b6]/50 text-white"
            : "hover:bg-gray-700"
        }
        ${
          activeDocumentId === doc.id && !bulkDeleteMode
            ? "border border-yellow-400"
            : ""
        }
        ${bulkDeleteMode ? "hover:bg-red-900/20" : ""}
        group relative
      `}
      onClick={() =>
        bulkDeleteMode
          ? handleDocumentToggle(doc.id)
          : handleDocumentClick(doc.id)
      }
    >
      <input
        type="checkbox"
        checked={selectedDocuments.includes(doc.id.toString())}
        readOnly
        className={`mr-1 form-checkbox 
          h-1 w-1 
          ${
            bulkDeleteMode
              ? "text-red-600 border-red-400"
              : "text-blue-600 border-[#5ff2b6]"
          }
          rounded-xl
          focus:ring-[#5ff2b6]`}
      />
      <FileText
        size={14}
        className={
          bulkDeleteMode
            ? "text-red-400 flex-shrink-0"
            : "text-blue-400 flex-shrink-0"
        }
      />
      <div className="flex-grow flex items-center justify-between overflow-hidden">
        <div className="flex flex-col flex-grow overflow-hidden">
          <span className="truncate text-xs">{doc.filename}</span>
          <span className="text-[10px] text-gray-400">
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
              className="text-blue-400 hover:text-blue-300 p-0.5 rounded-full
                transition-colors duration-300
                focus:outline-none
                hover:bg-blue-500/10"
              title="View Original Document"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteConfirmation(doc);
              }}
              className="text-red-400 hover:text-red-300 p-0.5 rounded-full
                transition-colors duration-300
                focus:outline-none
                hover:bg-red-500/10"
              title="Delete Document"
            >
              <Trash2 size={14} />
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
        <div
          className={`sticky top-0 z-10 flex items-center p-1 ${
            theme === "dark" ? "bg-gray-800/10" : "bg-[#e9dcc9]/70"
          } rounded-lg backdrop-blur-md mb-2 justify-between`}
        >
          <div className="flex items-center ">
            <input
              type="checkbox"
              id="select-all-documents"
              checked={isSelectAllChecked}
              onChange={handleSelectAllDocuments}
              className={`mr-2 form-checkbox 
            h-1 w-1
            ${
              bulkDeleteMode
                ? theme === "dark"
                  ? "text-red-600 border-red-400"
                  : "text-red-600 border-red-400"
                : theme === "dark"
                ? "text-blue-600 border-gray-300"
                : "text-[#0c393b] border-[#d6cbbf]"
            }
            rounded-xl
            focus:ring-blue-500
            backdrop-blur-md`}
            />
            <label
              htmlFor="select-all-documents"
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-[#5a544a]"
              } cursor-pointer`}
            >
              Select All
            </label>

            {selectedDocuments.length > 0 && (
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-red-400" : "text-[#0c393b]"
                } ml-2`}
              >
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
              className={`p-1.5 rounded-lg transition-colors ${
                theme === "dark"
                  ? "text-red-400 hover:text-red-300 hover:bg-red-700/30"
                  : "text-red-600 hover:text-red-700 hover:bg-red-100"
              }`}
              title="Delete Selected Documents"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {filteredDocuments.length === 0 ? (
        <div
          className={`${
            theme === "dark" ? "text-gray-400" : "text-[#5a544a]"
          } text-center py-4`}
        >
          {documentSearchTerm
            ? `No documents match "${documentSearchTerm}"`
            : "No documents available"}
        </div>
      ) : (
        // Display either all documents or a limited number based on expansion state
        filteredDocuments
          .slice(0, isDocumentsExpanded ? filteredDocuments.length : 10)
          .map((doc) => (
            <div
              key={doc.id}
              data-doc-id={doc.id}
              className={`
          flex items-center gap-1 
          py-1 px-2 rounded-lg 
          cursor-pointer 
          transition-all 
          ${
            selectedDocuments.includes(doc.id.toString())
              ? theme === "dark"
                ? "bg-gradient-to-b from-blue-300/20 border border-[#5ff2b6]/50 text-white"
                : "bg-[#556052]/10 border border-[#a55233]/30 text-[#0c393b]"
              : theme === "dark"
              ? "hover:bg-gray-700"
              : "hover:bg-[#e8ddcc]"
          }
          ${
            activeDocumentId === doc.id && !bulkDeleteMode
              ? theme === "dark"
                ? "border border-yellow-400"
                : "border border-[#a55233]"
              : ""
          }
          ${
            bulkDeleteMode
              ? theme === "dark"
                ? "hover:bg-red-900/20"
                : "hover:bg-red-100"
              : ""
          }
          group relative
        `}
              onClick={() =>
                bulkDeleteMode
                  ? handleDocumentToggle(doc.id)
                  : handleDocumentClick(doc.id)
              }
            >
              <input
                type="checkbox"
                checked={selectedDocuments.includes(doc.id.toString())}
                readOnly
                className={`mr-1 form-checkbox 
            h-1 w-1 
            ${
              bulkDeleteMode
                ? theme === "dark"
                  ? "text-red-600 border-red-400"
                  : "text-red-600 border-red-400"
                : theme === "dark"
                ? "text-blue-600 border-[#5ff2b6]"
                : "text-[#0c393b] border-[#d6cbbf]"
            }
            rounded-xl
            ${
              theme === "dark" ? "focus:ring-[#5ff2b6]" : "focus:ring-[#a55233]"
            }`}
              />
              <FileText
                size={14}
                className={
                  bulkDeleteMode
                    ? theme === "dark"
                      ? "text-red-400 flex-shrink-0"
                      : "text-red-600 flex-shrink-0"
                    : theme === "dark"
                    ? "text-blue-400 flex-shrink-0"
                    : "text-[#0c393b] flex-shrink-0"
                }
              />
              <div className="flex-grow flex items-center justify-between overflow-hidden">
                <div className="flex flex-col flex-grow overflow-hidden">
                  <span
                    className={`truncate text-sm ${
                      theme === "dark"
                        ? "text-gray-300"
                        : "text-[#1a535c] font-medium"
                    }`}
                  >
                    {doc.filename}
                  </span>
                  <span
                    className={`text-[10px] ${
                      theme === "dark" ? "text-gray-400" : "text-[#5a544a]"
                    }`}
                  >
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
                      className={`${
                        theme === "dark"
                          ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          : "text-[#556052] hover:text-[#425142] hover:bg-[#556052]/10"
                      } 
                  p-0.5 rounded-full
                  transition-colors duration-300
                  focus:outline-none`}
                      title="View Original Document"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConfirmation(doc);
                      }}
                      className={`${
                        theme === "dark"
                          ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          : "text-red-600 hover:text-red-700 hover:bg-red-100"
                      } 
                  p-0.5 rounded-full
                  transition-colors duration-300
                  focus:outline-none`}
                      title="Delete Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
      )}

      {/* Show "Show more" button when there are more than 5 documents and not expanded */}
      {!isDocumentsExpanded && filteredDocuments.length > 10 && (
        <button
          onClick={() => setIsDocumentsExpanded(true)}
          className={`w-full text-center py-2 text-sm ${
            theme === "dark"
              ? "text-blue-400 hover:text-blue-300"
              : "text-[#0c393b] hover:text-[#8b4513]"
          } 
      flex items-center justify-center transition-colors`}
        >
          <ChevronDown size={16} className="mr-1" />
          Show {filteredDocuments.length - 5} more
        </button>
      )}

      {/* Show "Show less" button when expanded */}
      {isDocumentsExpanded && filteredDocuments.length > 5 && (
        <button
          onClick={() => setIsDocumentsExpanded(false)}
          className={`w-full text-center py-2 text-sm ${
            theme === "dark"
              ? "text-blue-400 hover:text-blue-300"
              : "text-[#0c393b] hover:text-[#8b4513]"
          } 
      flex items-center justify-center transition-colors`}
        >
          <ChevronUp size={16} className="mr-1" />
          Show less
        </button>
      )}
    </>
  );

  // Add this before the return statement in your Sidebar component
  const formattedActiveConversation = activeConversation
    ? {
        ...activeConversation,
        conversation_id:
          activeConversation.conversation_id || activeConversationId,
        title: activeConversation.title || "Untitled Conversation",
        created_at: activeConversation.created_at || new Date().toISOString(),
        messages: activeConversation.messages || [],
      }
    : null;

  return (
    <div className="flex h-screen relative">
      {/* Sidebar */}
      <aside
        className={`
      ${isOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full"} 
      ${
        theme === "dark"
          ? "dark:bg-gray-700/20"
          : "bg-[#f7f3ea] border-r border-[#e8ddcc]"
      } 
      ${theme === "dark" ? "text-white" : "text-[#5e4636]"} 
      transition-all duration-300 
      overflow-hidden 
      h-[calc(100vh-4rem)] 
      fixed left-0
      top-16 bottom-0
      flex flex-col 
      rounded-r-lg
      ${theme === "dark" ? "shadow-2xl" : "shadow-md"}
      z-40
      relative
      ${isMobile ? "mobile-sidebar" : ""}
      aria-hidden={!isOpen}
    `}
      >
        <div className="p-4 pb-0 flex flex-col h-full overflow-hidden">
          {isOpen && (
            <div className="mb-3 flex items-center gap-2">
              {/* Collapse button - placed at the beginning of the row */}
              <button
                onClick={onToggle}
                className={`p-2 ${
                  theme === "dark"
                    ? "text-gray-300 hover:text-white hover:bg-gray-700/50"
                    : "text-[#5e4636] hover:text-[#a55233] hover:bg-[#f5e6d8]"
                } rounded-lg transition-colors`}
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <PanelLeft
                  size={20}
                  className={
                    theme === "dark" ? "text-gray-300" : "text-[#5e4636]"
                  }
                />
              </button>

              {/* New Chat Button */}
              <button
                onClick={handleNewChat}
                className={`
              ${
                theme === "dark"
                  ? "text-white bg-gradient-to-r from-[#2c3e95]/80 to-[#3fa88e]/70 hover:from-[#2c3e95] hover:to-[#3fa88e]"
                  : "text-white bg-[#a55233] hover:bg-[#8b4513]"
              }
              font-medium
              p-2 rounded-lg 
              flex items-center justify-center flex-1
              shadow-sm hover:shadow-md 
              transition-all duration-300
              active:scale-95 space-x-2
              text-sm
            `}
              >
                <Plus size={16} className="mr-1" />
                <span>New Chat</span>
              </button>

              {/* Generate Ideas Button - only shown if user has access */}
              {isModuleAvailable("idea-generator") && (
                <button
                  onClick={handleGenerateIdeas}
                  disabled={
                    !selectedDocuments || selectedDocuments.length === 0
                  }
                  className={`
                flex-1 py-2 px-2 rounded-lg text-sm
                ${
                  selectedDocuments && selectedDocuments.length > 0
                    ? theme === "dark"
                      ? "bg-gradient-to-r from-indigo-600/80 to-purple-500/70 hover:from-indigo-600 hover:to-purple-500"
                      : "bg-[#556052] hover:bg-[#425142] text-white"
                    : theme === "dark"
                    ? "bg-gray-700/40 cursor-not-allowed opacity-60"
                    : "bg-[#d6cbbf] cursor-not-allowed opacity-60"
                }
                text-white transition-all duration-300
                flex items-center justify-center gap-2
                shadow-sm hover:shadow-md active:scale-95
                border ${
                  selectedDocuments && selectedDocuments.length > 0
                    ? theme === "dark"
                      ? "border-indigo-400/20"
                      : "border-[#556052]/20"
                    : theme === "dark"
                    ? "border-gray-600/20"
                    : "border-[#d6cbbf]"
                }
                relative overflow-hidden
              `}
                >
                  <Lightbulb
                    size={16}
                    className={`
                  ${
                    selectedDocuments && selectedDocuments.length > 0
                      ? "text-yellow-300"
                      : "text-gray-400"
                  }
                  ${isGenerateIdeasAnimating ? "animate-pulse" : ""}
                `}
                  />
                  <span>Ideas</span>

                  {/* Sparkles only visible when enabled */}
                  {selectedDocuments && selectedDocuments.length > 0 && (
                    <Sparkles
                      size={12}
                      className="absolute top-1 right-2 text-yellow-200/70 animate-pulse"
                    />
                  )}
                </button>
              )}
            </div>
          )}
          {isOpen && (
            <div className="flex items-center justify-between mb-1 p-1 rounded-lg">
              <div className="flex w-full bg-[#f5f5f5] dark:bg-gray-700/30 p-1 rounded-lg">
                <button
                  onClick={() => setSidebarView("chats")}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors 
          ${
            sidebarView === "chats"
              ? theme === "dark"
                ? "bg-blue-500/20 text-white"
                : "bg-[#a55233]/30 text-[#5e4636]"
              : theme === "dark"
              ? "text-gray-400 hover:text-white"
              : "text-[#5a544a] hover:text-[#5e4636]"
          }`}
                >
                  <div className="flex items-center justify-center">
                    <MessageCircle size={14} className="mr-1.5" />
                    History
                  </div>
                </button>

                <button
                  onClick={() => setSidebarView("documents")}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors 
          ${
            sidebarView === "documents"
              ? theme === "dark"
                ? "bg-blue-500/20 text-white"
                : "bg-[#a55233]/30 text-[#5e4636]"
              : theme === "dark"
              ? "text-gray-400 hover:text-white"
              : "text-[#5a544a] hover:text-[#5e4636]"
          }`}
                >
                  <div className="flex items-center justify-center">
                    <FileText size={14} className="mr-1.5" />
                    Documents
                    {selectedDocuments.length > 0 && (
                      <span className="ml-1.5 dark:bg-blue-500 bg-[#a44704] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {selectedDocuments.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}
          {/* Documents Section */}
          {isOpen && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Content based on selected view */}
              {sidebarView === "documents" ? (
                /* DOCUMENTS VIEW */
                <div className="flex flex-col overflow-hidden h-full">
                  {/* Documents Header - Restructured */}
                  <div
                    className={`flex items-center justify-between mb-1 p-1.5 rounded-lg ${
                      theme === "dark" ? "" : "border-b border-[#e3d5c8]"
                    }`}
                  >
                    <span
                      className={`${
                        theme === "dark" ? "text-gray-300" : "text-[#0a3b25]"
                      } font-medium text-xs tracking-wider`}
                    >
                      Documents{" "}
                      {filteredDocuments.length > 0 &&
                        `(${filteredDocuments.length})`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsDocumentSearchModalOpen(true)}
                        className={`p-1 ${
                          theme === "dark"
                            ? "text-gray-300 hover:text-white hover:bg-gray-700/30"
                            : "text-[#5e4636] hover:text-[#a55233] hover:bg-[#f5e6d8]"
                        } transition-colors rounded-lg relative group`}
                        title="Advanced Document Search"
                      >
                        <Search size={14} />
                        <span
                          className={`hidden group-hover:block absolute -top-8 left-1/2 transform -translate-x-1/2 ${
                            theme === "dark" ? "bg-gray-900" : "bg-[#5e4636]"
                          } text-xs text-white py-1 px-2 rounded whitespace-nowrap`}
                        >
                          Search in content
                        </span>
                      </button>
                    </div>
                  </div>

                  {showDocumentSearch && (
                    <div className="mb-2">
                      <div
                        className={`flex items-center ${
                          theme === "dark"
                            ? "bg-gray-800/30"
                            : "bg-white/80 border border-[#d6cbbf]"
                        } rounded-lg`}
                      >
                        <Search
                          size={16}
                          className={`ml-2 ${
                            theme === "dark"
                              ? "text-gray-400"
                              : "text-[#5a544a]"
                          }`}
                        />
                        <input
                          type="text"
                          placeholder="Search documents..."
                          value={documentSearchTerm}
                          onChange={(e) =>
                            setDocumentSearchTerm(e.target.value)
                          }
                          className={`
              w-full bg-transparent 
              ${
                theme === "dark"
                  ? "text-white placeholder-gray-400"
                  : "text-[#5e4636] placeholder-[#5a544a]"
              }
              p-2 
              focus:outline-none 
              text-sm
            `}
                        />
                        {documentSearchTerm && (
                          <button
                            onClick={handleResetSearch}
                            className={`mr-2 ${
                              theme === "dark"
                                ? "text-gray-400 hover:text-white"
                                : "text-[#5a544a] hover:text-[#a55233]"
                            }`}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documents List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {isLoading && isInitialLoad ? (
                      <div
                        className={`${
                          theme === "dark" ? "text-gray-400" : "text-[#5a544a]"
                        } text-center py-4 flex items-center justify-center`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`animate-spin h-4 w-4 border-2 ${
                              theme === "dark"
                                ? "border-blue-500"
                                : "border-[#a55233]"
                            } rounded-full border-t-transparent`}
                          />
                          Loading documents...
                        </div>
                      </div>
                    ) : (
                      renderDocumentsList()
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col overflow-hidden h-full">
                  <h6
                    className={`
        ${
          theme === "dark" ? "text-gray-300" : "text-[#0a3b25]"
        } mb-1 flex justify-between 
        items-center font-medium text-xs 
        tracking-wider
        p-1.5 rounded-lg
        relative
        ${theme === "dark" ? "" : "border-b border-[#e3d5c8]"}
      `}
                  >
                    Recent Chats{" "}
                    {filteredChatHistory.length > 0 &&
                      `(${filteredChatHistory.length})`}
                    <div className="flex items-center gap-1">
                      <div className="relative filter-dropdown-container">
                        <button
                          onClick={() =>
                            setIsFilterDropdownOpen(!isFilterDropdownOpen)
                          }
                          className={`p-1 relative ${
                            theme === "dark"
                              ? "text-gray-300 hover:text-white hover:bg-gray-700/30"
                              : "text-[#5e4636] hover:text-[#a55233] hover:bg-[#f5e6d8]"
                          } 
        ${
          chatFilterMode
            ? theme === "dark"
              ? "bg-blue-500/20"
              : "bg-[#a55233]/10"
            : ""
        }
        transition-colors rounded-lg`}
                          title="Filter Chats"
                        >
                          <Filter size={14} />
                          {chatFilterMode && (
                            <span
                              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                                theme === "dark"
                                  ? "bg-blue-500"
                                  : "bg-[#a55233]"
                              }`}
                            ></span>
                          )}
                        </button>

                        {/* Filter dropdown menu */}
                        {isFilterDropdownOpen && (
                          <div
                            className={`absolute right-0 mt-1 py-1 w-36 rounded-md shadow-lg 
        ${theme === "dark" ? "bg-gray-800" : "bg-white border border-[#e3d5c8]"}
        z-10`}
                          >
                            <button
                              onClick={() => {
                                setChatFilterMode(null);
                                setIsFilterDropdownOpen(false);
                              }}
                              className={`block px-4 py-1 text-sm w-full text-left
            ${
              !chatFilterMode
                ? theme === "dark"
                  ? "bg-blue-500/20 text-white"
                  : "bg-[#ddd9c5] text-[#a55233]"
                : theme === "dark"
                ? "text-gray-300 hover:bg-gray-700"
                : "text-[#5e4636] hover:bg-[#f0eee5]"
            }`}
                            >
                              Default
                            </button>
                            <button
                              onClick={() => {
                                setChatFilterMode("recent");
                                setIsFilterDropdownOpen(false);
                              }}
                              className={`block px-4 py-1 text-sm w-full text-left
            ${
              chatFilterMode === "recent"
                ? theme === "dark"
                  ? "bg-blue-500/20 text-white"
                  : "bg-[#ddd9c5] text-[#a55233]"
                : theme === "dark"
                ? "text-gray-300 hover:bg-gray-700"
                : "text-[#5e4636] hover:bg-[#f0eee5]"
            }`}
                            >
                              Most Recent
                            </button>
                            <button
                              onClick={() => {
                                setChatFilterMode("oldest");
                                setIsFilterDropdownOpen(false);
                              }}
                              className={`block px-4 py-1 text-sm w-full text-left
            ${
              chatFilterMode === "oldest"
                ? theme === "dark"
                  ? "bg-blue-500/20 text-white"
                  : "bg-[#d88e6f]/20 text-[#a55233]"
                : theme === "dark"
                ? "text-gray-300 hover:bg-gray-700"
                : "text-[#5e4636] hover:bg-[#f0eee5]"
            }`}
                            >
                              Oldest First
                            </button>
                            <button
                              onClick={() => {
                                setChatFilterMode("mostMessages");
                                setIsFilterDropdownOpen(false);
                              }}
                              className={`block px-4 py-1 text-sm w-full text-left
            ${
              chatFilterMode === "mostMessages"
                ? theme === "dark"
                  ? "bg-blue-500/20 text-white"
                  : "bg-[#ddd9c5] text-[#a55233]"
                : theme === "dark"
                ? "text-gray-300 hover:bg-gray-700"
                : "text-[#5e4636] hover:bg-[#f0eee5]"
            }`}
                            >
                              Most Messages
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </h6>

                  {/* Add Chat Search Input */}

                  <div className="mb-2">
                    <div
                      className={`flex items-center ${
                        theme === "dark"
                          ? "bg-gray-800/10"
                          : "bg-white/80 border border-[#d6cbbf]"
                      } rounded-lg`}
                    >
                      <Search
                        size={16}
                        className={`ml-2 ${
                          theme === "dark" ? "text-gray-400" : "text-[#5a544a]"
                        }`}
                      />
                      <input
                        type="text"
                        placeholder="Search chats..."
                        value={chatSearchTerm}
                        onChange={(e) => setChatSearchTerm(e.target.value)}
                        className={`
              w-full bg-transparent 
              ${
                theme === "dark"
                  ? "text-white placeholder-gray-400"
                  : "text-[#5e4636] placeholder-[#5a544a]"
              } 
              p-2 
              focus:outline-none 
              text-sm
            `}
                      />
                      {chatSearchTerm && (
                        <button
                          onClick={handleResetChatSearch}
                          className={`mr-2 ${
                            theme === "dark"
                              ? "text-gray-400 hover:text-white"
                              : "text-[#5a544a] hover:text-[#a55233]"
                          }`}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {filteredChatHistory.length === 0 ? (
                      <div
                        className={`${
                          theme === "dark" ? "text-gray-400" : "text-[#5a544a]"
                        } text-center py-4`}
                      >
                        {chatSearchTerm
                          ? `No chats match "${chatSearchTerm}"`
                          : "No recent chats available"}
                      </div>
                    ) : (
                      filteredChatHistory.map((chat) => (
                        <div
                          key={`chat-${chat.conversation_id}`}
                          className={`
                          relative group cursor-pointer 
                          ${
                            theme === "dark"
                              ? "hover:bg-gray-700"
                              : "hover:bg-[#f5e6d8]"
                          } 
                          hover:shadow-md 
                          p-2 rounded-lg text-sm
                          transition-all duration-300
                          ${
                            activeConversationId === chat.conversation_id
                              ? theme === "dark"
                                ? "bg-gradient-to-b from-blue-300/20 border border-[#5ff2b6]/50 text-white"
                                : "bg-[#e8ddcc] border-l-2 border-[#a55233] text-[#5e4636]"
                              : ""
                          }
                        `}
                        >
                          {isRenamingChat === chat.conversation_id ? (
                            <div className="flex items-center">
                              <input
                                type="text"
                                value={newChatTitle}
                                onChange={(e) =>
                                  setNewChatTitle(e.target.value)
                                }
                                className={`flex-grow ${
                                  theme === "dark"
                                    ? "bg-gray-700 text-white"
                                    : "bg-white text-[#5e4636] border border-[#d6cbbf]"
                                } p-1 rounded`}
                                placeholder="Enter new chat name"
                              />
                              <button
                                onClick={() =>
                                  handleRenameChat(chat.conversation_id)
                                }
                                className={`ml-2 ${
                                  theme === "dark"
                                    ? "text-green-400 hover:text-green-300"
                                    : "text-[#556052] hover:text-[#425142]"
                                }`}
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setIsRenamingChat(null)}
                                className={`ml-2 ${
                                  theme === "dark"
                                    ? "text-red-400 hover:text-red-300"
                                    : "text-red-600 hover:text-red-700"
                                }`}
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
                                <MessageCircle
                                  size={14}
                                  className={
                                    theme === "dark"
                                      ? "text-green-400 mr-2"
                                      : "text-[#1a535c] mr-2"
                                  }
                                />
                                <div className="flex flex-col flex-grow overflow-hidden">
                                  <span
                                    className={`text-sm ${
                                      theme === "dark"
                                        ? "text-gray-300"
                                        : "text-[#1a535c] font-medium tracking-wide "
                                    }`}
                                  >
                                    {chat.title || "Untitled Conversation"}
                                  </span>
                                  <span
                                    className={`text-sm ${
                                      theme === "dark"
                                        ? "text-gray-400"
                                        : "text-[#5a544a] "
                                    }`}
                                  >
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
                                  className={`${
                                    theme === "dark"
                                      ? "text-blue-400 hover:text-blue-300"
                                      : "text-[#556052] hover:text-[#425142]"
                                  }`}
                                  title="Rename Chat"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChatConfirmation(chat);
                                  }}
                                  className={`${
                                    theme === "dark"
                                      ? "text-red-400 hover:text-red-300"
                                      : "text-red-600 hover:text-red-700"
                                  }`}
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
                </div>
              )}
            </div>
          )}
          {/* Sidebar Footer with Download Feature */}
          {isOpen && (
            <div
              className={`sidebar-footer ${
                theme === "dark"
                  ? "border-t border-gray-700/30"
                  : "border-t border-[#e3d5c8]"
              } pt-3 px-4 pb-3 mt-auto`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-grow">
                  <ChatDownloadFeature
                    currentChatData={formattedActiveConversation}
                    mainProjectId={mainProjectId}
                    chatHistory={chatHistory}
                    activeConversationId={activeConversationId}
                    className={`download-button ${
                      theme === "dark"
                        ? ""
                        : "bg-white border-[#d6cbbf] hover:bg-[#f5e6d8] text-[#5e4636]"
                    }`}
                  />
                </div>

                {/* Add FAQ button here */}
                {/* <FaqButton
                  className={`ml-2 ${
                    theme === "dark"
                      ? "hover:bg-gray-700/50"
                      : "hover:bg-[#f5e6d8]"
                  } rounded-lg`}
                /> */}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Custom Scrollbar Styles */}
      {/* Custom Scrollbar Styles */}
      <style>{`
/* Make loader visible on both light and dark modes */
.idea-generator-loader {
  position: relative;
  width: 100px;
  height: 100px;
}

/* Dark theme loader - using more specific selectors to ensure it applies */
html.dark #idea-generator-loading-overlay .idea-generator-loader:before,
body.dark #idea-generator-loading-overlay .idea-generator-loader:before,
.dark #idea-generator-loading-overlay .idea-generator-loader:before {
  content: '';
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  top: 50%;
  left: 0;
  transform: translate(-5px, -50%);
  background: linear-gradient(to right, #60a5fa 50%, #93c5fd 50%) no-repeat; /* Using Tailwind blue-400 (#60a5fa) and blue-300 (#93c5fd) */
  background-size: 200% auto;
  background-position: 100% 0;
  animation: colorBallMoveXDark 1.5s linear infinite alternate;
}

html.dark #idea-generator-loading-overlay .idea-generator-loader:after,
body.dark #idea-generator-loading-overlay .idea-generator-loader:after,
.dark #idea-generator-loading-overlay .idea-generator-loader:after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 2px;
  height: 100%;
  background: #60a5fa; /* Exact blue-400 color from Tailwind */
}

@keyframes colorBallMoveXDark {
  0% {
    background-position: 0% 0;
    transform: translate(-15px, -50%);
  }
  15%, 25% {
    background-position: 0% 0;
    transform: translate(0px, -50%);
  }
  75%, 85% {
    background-position: 100% 0;
    transform: translate(50px, -50%);
  }
  100% {
    background-position: 100% 0;
    transform: translate(65px, -50%);
  }
}

/* Light theme loader */
:not(.dark) .idea-generator-loader:before {
  content: '';
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  top: 50%;
  left: 0;
  transform: translate(-5px, -50%);
  background: linear-gradient(to right, #a55233 50%, #556052 50%) no-repeat;
  background-size: 200% auto;
  background-position: 100% 0;
  animation: colorBallMoveXLight 1.5s linear infinite alternate;
}

:not(.dark) .idea-generator-loader:after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  width: 2px;
  height: 100%;
  background: #a55233;
}

@keyframes colorBallMoveXLight {
  0% {
    background-position: 0% 0;
    transform: translate(-15px, -50%);
  }
  15%, 25% {
    background-position: 0% 0;
    transform: translate(0px, -50%);
  }
  75%, 85% {
    background-position: 100% 0;
    transform: translate(50px, -50%);
  }
  100% {
    background-position: 100% 0;
    transform: translate(65px, -50%);
  }
}

/* Optional animation to add a pulsing effect to the text */
@keyframes textPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

#idea-generator-loading-overlay div {
  animation: textPulse 2s ease-in-out infinite;
}

/* Ensure the loading overlay has higher z-index than other elements */
#idea-generator-loading-overlay {
  z-index: 9999;
}

/* Ensure the loading overlay has higher z-index than other elements */
#idea-generator-loading-overlay {
  z-index: 9999;
}
  /* Add to your styles */
  .sidebar-footer {
    margin-top: auto; /* Push to bottom */
  }

  /* For collapsed sidebar footer positioning */
  .collapsed-sidebar-footer {
    position: absolute;
    bottom: 16px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* Add to your style section */
  .collapsed-sidebar-icon {
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* For tooltip display */
  .tooltip {
    position: absolute;
    left: 100%;
    margin-left: 10px;
    opacity: 0;
    background-color: rgba(30, 30, 30, 0.9);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    transition: opacity 0.2s;
    pointer-events: none;
    white-space: nowrap;
  }

  .collapsed-sidebar-icon:hover .tooltip {
    opacity: 1;
  }

  /* Common scrollbar styling */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  /* Theme-specific scrollbar styling */
  ${
    theme === "dark"
      ? `
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
    `
      : `
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(165,82,51,0.05);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(165,82,51,0.2);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(165,82,51,0.3);
    }
    `
  }

  /* Animation updates for both themes */
  @keyframes documentHighlight {
    0% { 
      background-color: ${
        theme === "dark" ? "rgba(95, 242, 182, 0.6)" : "rgba(165, 82, 51, 0.2)"
      }; 
      box-shadow: 0 0 10px ${
        theme === "dark" ? "rgba(95, 242, 182, 0.8)" : "rgba(165, 82, 51, 0.3)"
      }; 
    }
    50% { 
      background-color: ${
        theme === "dark" ? "rgba(95, 242, 182, 0.3)" : "rgba(165, 82, 51, 0.1)"
      }; 
      box-shadow: 0 0 15px ${
        theme === "dark" ? "rgba(95, 242, 182, 0.4)" : "rgba(165, 82, 51, 0.2)"
      }; 
    }
    100% { 
      background-color: transparent; 
      box-shadow: none; 
    }
  }
  
  .document-highlight-animation {
    animation: documentHighlight 2s ease-out forwards;
  }
  
  .selected-document {
    background: ${
      theme === "dark"
        ? "linear-gradient(to right, rgba(95, 242, 182, 0.1), rgba(44, 62, 149, 0.1)) !important"
        : "linear-gradient(to right, rgba(165, 82, 51, 0.05), rgba(85, 96, 82, 0.05)) !important"
    };
    border: ${
      theme === "dark"
        ? "1px solid rgba(95, 242, 182, 0.5) !important"
        : "1px solid rgba(165, 82, 51, 0.2) !important"
    };
  }
  
  /* Make checkboxes more visible */
  input[type="checkbox"] {
    accent-color: ${theme === "dark" ? "#5ff2b6" : "#a55233"};
    width: 11px;
    height: 14px;
    cursor: pointer;
  }
  
  /* Ensure checkboxes are properly positioned */
  [data-doc-id] {
    position: relative;
  }
  
  /* Style for when document is both selected and active */
  [data-doc-id].selected-document.document-highlight-animation {
    border: ${
      theme === "dark"
        ? "1px solid rgba(95, 242, 182, 0.8) !important"
        : "1px solid rgba(165, 82, 51, 0.5) !important"
    };
  }

  @keyframes glow {
    0% { box-shadow: 0 0 5px ${
      theme === "dark" ? "rgba(124, 58, 237, 0.5)" : "rgba(165, 82, 51, 0.2)"
    }; }
    50% { box-shadow: 0 0 20px ${
      theme === "dark" ? "rgba(124, 58, 237, 0.8)" : "rgba(165, 82, 51, 0.4)"
    }; }
    100% { box-shadow: 0 0 5px ${
      theme === "dark" ? "rgba(124, 58, 237, 0.5)" : "rgba(165, 82, 51, 0.2)"
    }; }
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

  /* Download button styling */
  .sidebar-footer .download-button {
    height: 30px;
    padding: 1px 5px; 
    
    background: ${
      theme === "dark" ? "rgba(44, 62, 149, 0.5)" : "rgba(255, 255, 255, 0.8)"
    };
    border: ${
      theme === "dark"
        ? "1px solid rgba(95, 242, 182, 0.2)"
        : "1px solid rgba(214, 203, 191, 1)"
    };
    transition: all 0.2s ease;
    border-radius: 3px;
    display: inline-flex; 
    gap: 2px;
    align-items: center;
    
    font-size: 0.875rem;
    width: auto; 
    min-width: 32px;
    max-width: 100%; 
    color: ${theme === "dark" ? "white" : "#5e4636"};
  }

  .sidebar-footer .download-button:hover {
    background: ${theme === "dark" ? "rgba(44, 62, 149, 0.7)" : "#f5e6d8"};
    border-color: ${theme === "dark" ? "rgba(95, 242, 182, 0.5)" : "#a68a70"};
    transform: translateY(-1px); 
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); 
  }

  .sidebar-footer .download-button:active {
    transform: translateY(0px);
  }

  /* This ensures the icon inside the button is properly sized */
  .sidebar-footer .download-button svg {
    width: 12px;
    height: 16px;
    margin-right: 4px;
    color: ${theme === "dark" ? "white" : "#a55233"};
  }

  /* If there's text and icon, keep them nicely spaced */
  .sidebar-footer .download-button span {
    margin-left: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
        documentName={documentToDelete?.filename || ""}
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
        onConfirm={() =>
          handleDeleteConversation(chatToDelete?.conversation_id)
        }
        chatTitle={chatToDelete?.title || "Untitled Conversation"}
      />
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        selectedCount={selectedDocuments.length}
        selectedDocuments={selectedDocuments}
        documents={documents}
      />
      {/* Collapsed Sidebar */}
      {!isOpen && (
        <div
          className={`fixed left-0 top-4 bottom-0 w-12 ${
            theme === "dark"
              ? "bg-gray-700/20 backdrop-blur-sm border-r border-gray-700/30"
              : "bg-[#f7f3ea] backdrop-blur-sm border-r border-[#e8ddcc]"
          } z-40 flex flex-col items-center pt-14 space-y-6`}
        >
          {/* Add the toggle button first, at the top of the sidebar */}
          <button
            onClick={() => {
              // We need direct access to the toggle function
              // Option 1: If onToggle is passed as a prop
              if (typeof onToggle === "function") {
                onToggle();
              }
              // Option 2: Create a custom event that Dashboard.jsx listens for
              else {
                const event = new CustomEvent("toggle-sidebar");
                document.dispatchEvent(event);
              }
            }}
            className={`my-4 p-2 ${
              theme === "dark"
                ? "text-white hover:bg-gray-700"
                : "text-[#5e4636] hover:bg-[#f5e6d8]"
            } rounded-lg transition-colors`}
            title="Expand Sidebar"
          >
            <PanelLeft
              size={20}
              className={theme === "dark" ? "text-blue-500" : "text-[#c24124]"}
            />
          </button>
          {/* Main icons */}
          <div className="flex flex-col items-center space-y-6">
            {/* New Chat Button - Same function as expanded mode */}
            <button
              onClick={handleNewChat}
              className={`p-2 ${
                theme === "dark"
                  ? "text-white hover:bg-gray-700"
                  : "text-[#5e4636] hover:bg-[#f5e6d8]"
              } rounded-full transition-colors`}
              title="New Chat"
            >
              <Plus
                size={20}
                className={
                  theme === "dark" ? "text-indigo-400" : "text-[#c24124]"
                }
              />
            </button>

            {/* Ideas Button - Same function as expanded mode */}
            {isModuleAvailable("idea-generator") && (
              <button
                onClick={handleGenerateIdeas}
                disabled={!selectedDocuments || selectedDocuments.length === 0}
                className={`p-2 rounded-full transition-colors
            ${
              selectedDocuments && selectedDocuments.length > 0
                ? theme === "dark"
                  ? "text-yellow-400 hover:bg-indigo-700/50"
                  : "text-[#3d7647] hover:bg-[#556052]/20"
                : theme === "dark"
                ? "text-gray-400 cursor-not-allowed"
                : "text-[#d6cbbf] cursor-not-allowed"
            }
          `}
                title="Generate Ideas from Documents"
              >
                <Lightbulb size={20} />
              </button>
            )}

            {/* Documents Button - Opens sidebar and shows documents */}
            <button
              onClick={() => {
                if (onToggle) onToggle();
                setTimeout(() => {
                  setSidebarView("documents");
                }, 300);
              }}
              className={`p-2 ${
                theme === "dark"
                  ? `text-white ${
                      sidebarView === "documents"
                        ? "bg-gray-700/50"
                        : "hover:bg-gray-700"
                    }`
                  : `text-[#5e4636] ${
                      sidebarView === "documents"
                        ? "bg-[#f5e6d8]/50"
                        : "hover:bg-[#f5e6d8]"
                    }`
              } 
    rounded-full transition-colors relative`}
              title="Documents"
            >
              <FileText
                size={20}
                className={
                  sidebarView === "documents"
                    ? theme === "dark"
                      ? "text-blue-400"
                      : "text-[#a55233]"
                    : theme === "dark"
                    ? "text-blue-500"
                    : "text-[#c24124]"
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

            {/* Chats Button - Opens sidebar and shows chats */}
            <button
              onClick={() => {
                if (onToggle) onToggle();
                setTimeout(() => {
                  setSidebarView("chats");
                }, 300);
              }}
              className={`p-2 ${
                theme === "dark"
                  ? `text-white ${
                      sidebarView === "chats"
                        ? "bg-gray-700/50"
                        : "hover:bg-gray-700"
                    }`
                  : `text-[#5e4636] ${
                      sidebarView === "chats"
                        ? "bg-[#f5e6d8]/50"
                        : "hover:bg-[#f5e6d8]"
                    }`
              } 
    rounded-full transition-colors`}
              title="Recent Chats"
            >
              <MessageCircle
                size={20}
                className={
                  sidebarView === "chats"
                    ? theme === "dark"
                      ? "text-green-400"
                      : "text-[#3d7647]"
                    : theme === "dark"
                    ? "text-green-500"
                    : "text-[#3d7647]"
                }
              />
            </button>
          </div>

          {/* Add space between main icons and footer */}
          <div className="flex-grow"></div>

          {/* Footer section with Export Chat and FAQ */}
          <div
            className={`flex flex-col items-center space-y-5 mb-4 border-t ${
              theme === "dark" ? "border-gray-700/30" : "border-[#e3d5c8]"
            } pt-5`}
          >
            {/* Export Chat button */}
            <button
              onClick={() => {
                if (onToggle) onToggle();
                setTimeout(() => {
                  document.querySelector(".download-button")?.click();
                }, 300);
              }}
              className={`p-2 ${
                theme === "dark"
                  ? "text-white hover:bg-gray-700"
                  : "text-[#5e4636] hover:bg-[#f5e6d8]"
              } rounded-full transition-colors`}
              title="Export Chats"
            >
              <Download
                size={20}
                className={
                  theme === "dark" ? "text-indigo-400" : "text-[#c24124]"
                }
              />
            </button>

            {/* FAQ button */}
            {/* <button
              onClick={() => window.open("/faq", "_blank")}
              className={`p-2 ${
                theme === "dark"
                  ? "text-white hover:bg-gray-700"
                  : "text-[#5e4636] hover:bg-[#f5e6d8]"
              } rounded-full transition-colors`}
              title="Frequently Asked Questions"
            >
              <HelpCircle
                size={20}
                className={
                  theme === "dark" ? "text-purple-400" : "text-[#7a5741]"
                }
              />
            </button> */}
          </div>
        </div>
      )}
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