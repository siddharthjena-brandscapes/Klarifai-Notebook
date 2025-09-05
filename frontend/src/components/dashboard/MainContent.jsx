

// MainContent.jsx
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
import BotIcon from "/src/assets/demo-image.png";
import {
  Paperclip,
  Globe,
  Database,
  Info,
  Send,
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  ScrollText,
  MessageCircle,
  Copy,
  Layers,
  Mic,
  Check,
  Loader,
  Trash,

} from "lucide-react";
import PropTypes from "prop-types";
import { documentService, chatService } from "../../utils/axiosConfig";
import { toast } from "react-toastify";
import Card from "../Card";
import EditableMessage from "./EditableMessage";
import {
  ConsolidatedSummaryLoader,
  consolidatedSummaryStyles,
} from "./ConsolidatedSummaryLoader";
import { ConsolidatedViewBadge, badgeStyles } from "./ConsolidatedViewBadge";
import DocumentSelector from "./DocumentSelector";
import ResponseRegenerator from "./ResponseRegenerator";
import {
  SummaryGenerationLoader,
  SummaryFormatter,
  summaryStyles,
} from "./EnhancedSummaryFormatter";

import MessageVersionHistory from "./MessageVersionHistory";
import DocumentProcessingLoader from "./DocumentUpload/DocumentProcessingLoader";
import WebModeWelcome from "./WebModeWelcome";
import TextSizeControls from "./TextSizeControls";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ImprovedCitationManager } from "./CitationManager";
import DocumentModeWelcome from "./DocumentModeWelcome";
import DeleteChatConfirmationModal from "./DeleteChatConfirmationModal";

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
  smartypants: true,
});

const MainContent = ({
  selectedChat,
  mainProjectId,
  summary: propSummary,
  followUpQuestions: initialFollowUpQuestions,
  isSummaryPopupOpen,
  onCloseSummary,
  setSummary,
  setFollowUpQuestions,
  setIsSummaryPopupOpen,
  selectedDocuments: propSelectedDocuments,
  setSelectedDocuments,
  onChatInputFocus,

}) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [currentFollowUpQuestions, setCurrentFollowUpQuestions] = useState([]);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isFollowUpQuestionsMinimized, setIsFollowUpQuestionsMinimized] =
    useState(true);
  const chatContainerRef = useRef(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  

  // New state for persistent summary
  const [persistentSummary, setPersistentSummary] = useState("");
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  // New state for view toggle
  const [currentView, setCurrentView] = useState("chat");

  //  new state for document processing
  const [isDocumentProcessing, setIsDocumentProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [messageHistory, setMessageHistory] = useState({});
  const [viewingHistoryState, setViewingHistoryState] = useState({});
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activeHistoryMessageIndex, setActiveHistoryMessageIndex] =
    useState(null);

  const [messageVersions, setMessageVersions] = useState({});
  const [currentVersionIndex, setCurrentVersionIndex] = useState({});

  const [activeDocumentForSummary, setActiveDocumentForSummary] =
    useState(null);

  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);

  // Add this to the state declarations at the top of the component:
  const [consolidatedSummary, setConsolidatedSummary] = useState("");
  const [isConsolidatedView, setIsConsolidatedView] = useState(false);
  const [isConsolidatedSummaryLoading, setIsConsolidatedSummaryLoading] =
    useState(false);

  // Add this state variable inside MainContent component
  const [useWebKnowledge, setUseWebKnowledge] = useState(
    propSelectedDocuments.length === 0 ? true : false
  );
  const [isRecording, setIsRecording] = useState(false);

  // Add a new Citation component for inline citations
  const recognitionRef = useRef(null);

  const [processingDocuments, setProcessingDocuments] = useState([]);
  //for response length
  const [responseLength, setResponseLength] = useState("short");
  const [responseFormat, setResponseFormat] = useState("auto-detect");
  const [hasUploadPermissions, setHasUploadPermissions] = useState(true);

  const [regeneratedResponses, setRegeneratedResponses] = useState({});
  const [currentResponseIndex, setCurrentResponseIndex] = useState({});
  const [textSize, setTextSize] = useState("medium");
  const [currentUploadFilenames, setCurrentUploadFilenames] = useState([]);

  // Add this inside your MainContent component
  useEffect(() => {
    // Configure DOMPurify to allow standard HTML tags but sanitize potentially dangerous content
    DOMPurify.setConfig({
      ALLOWED_TAGS: [
        'p', 'b', 'strong', 'i', 'em', 'u', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 
        'code', 'pre', 'blockquote', 'br', 'hr', 'span', 'div'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      ALLOW_DATA_ATTR: false
    });
  }, []);

  useEffect(() => {
    // Save to localStorage whenever textSize changes
    localStorage.setItem('preferredTextSize', textSize);
  }, [textSize]);

  // Add this useEffect to load saved preference on component mount
  useEffect(() => {
    const savedTextSize = localStorage.getItem('preferredTextSize');
    if (savedTextSize) {
      setTextSize(savedTextSize);
    }
  }, []);


  useEffect(() => {
  let intervalId;
  if (isDocumentProcessing) {
    const fetchStatus = async () => {
      try {
        const res = await documentService.getProcessingStatus();
        setProcessingDocuments(res.data); // [{filename, status, progress, message, document_id}]
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchStatus();
    intervalId = setInterval(fetchStatus, 2000);
  }
  return () => clearInterval(intervalId);
}, [isDocumentProcessing]);


  // Add this right after the imports and before the MainContent component definition
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

  // Utility function to process follow-up questions consistently
const processFollowUpQuestions = (questionsData) => {
  if (!questionsData) return [];
  
  let questions = questionsData;
  
  // Handle string responses (JSON or plain text)
  if (typeof questions === 'string') {
    try {
      const parsed = JSON.parse(questions);
      questions = parsed.questions || parsed || [];
    } catch (e) {
      // If not JSON, treat as a single question or split by newlines
      questions = questions.split('\n').filter(q => q.trim());
    }
  } 
  // Handle object responses
  else if (typeof questions === 'object' && !Array.isArray(questions)) {
    questions = questions.questions || [];
  }
  
  // Ensure we have an array
  if (!Array.isArray(questions)) {
    return [];
  }
  
  // Clean and validate questions
  return questions
    .filter(q => q && typeof q === 'string')
    .map(q => q.trim())
    .filter(q => q.length > 0)
    .slice(0, 5); // Limit to 5 questions max
};

  
  const getTextSizeClass = (size) => {
    switch (size) {
      case "xs":
        return "text-xs";
      case "small":
        return "text-sm";
      case "medium":
        return "text-base";
      case "large":
        return "text-lg";
      case "xl":
        return "text-xl";
      case "2xl":
        return "text-2xl";
      default:
        return "text-base"; // medium as default
    }
  };

  

  // Add event handler to textarea
  const handleTextareaFocus = () => {
    if (onChatInputFocus) onChatInputFocus();
  };
  

  // Updated handleRegenerateResponse function
const handleRegenerateResponse = async (messageIndex, length = responseLength) => {
  // Find the user message that prompted this response
  const userMessageIndex = messageIndex - 1;
  
  if (userMessageIndex < 0 || conversation[userMessageIndex].role !== 'user') {
    toast.error('Could not find the question for this response');
    return;
  }
  
  const userMessage = conversation[userMessageIndex].content;
  
  try {
    // Make sure regeneratedResponses exists for this message index
    if (!regeneratedResponses[messageIndex]) {
      // Store the original response as the first response in the array
      setRegeneratedResponses(prev => ({
        ...prev,
        [messageIndex]: [conversation[messageIndex]]
      }));
      
      // Set current index to 0 (the original response)
      setCurrentResponseIndex(prev => ({
        ...prev,
        [messageIndex]: 0
      }));
    }
    
    // Force web mode when no documents are selected
    const useWebMode = propSelectedDocuments.length === 0 ? true : useWebKnowledge;
    
    // Prepare request data for the API
    const requestData = {
      message: userMessage,
      conversation_id: conversationId,
      selected_documents: propSelectedDocuments,
      main_project_id: mainProjectId,
      use_web_knowledge: useWebMode,
      response_length: length,
      response_format: responseFormat,
      general_chat_mode: propSelectedDocuments.length === 0,
      regenerate: true
    };
    
    const response = await chatService.sendMessage(requestData);
    
    if (response && response.data) {
      // Parse the JSON response
      let responseContent = response.data.response || response.data.content;
      let citations = response.data.citations || [];
      
      // Process web sources using the helper function
      const webSources = processWebSources(response.data.sources_info, response.data.extracted_urls);
      
      // Handle JSON response format
      if (typeof responseContent === 'string' && responseContent.startsWith('{')) {
        try {
          const parsedResponse = JSON.parse(responseContent);
          responseContent = parsedResponse.content || responseContent;
          if (parsedResponse.citations) {
            citations = parsedResponse.citations;
          }
        } catch (jsonError) {
          console.warn("Failed to parse JSON response:", jsonError);
        }
      }

      const regeneratedMessage = {
        role: 'assistant',
        content: responseContent,
        citations: response.data.citations || [],
        follow_up_questions: response.data.follow_up_questions || [],
        use_web_knowledge: response.data.use_web_knowledge || useWebMode,
        response_length: response.data.response_length || length,
        response_format: response.data.response_format || responseFormat,
        regenerated: true,
        timestamp: new Date().toISOString(),
        webSources: webSources, // Add processed web sources
        sources_info: response.data.sources_info, // Store original sources_info
        extracted_urls: response.data.extracted_urls, // Store original extracted_urls
      };
      
      // Add the regenerated response to the collection
      setRegeneratedResponses(prev => {
        const updatedResponses = [...(prev[messageIndex] || []), regeneratedMessage];
        return {
          ...prev,
          [messageIndex]: updatedResponses
        };
      });
      
      // Set the current index to the newly added response
      setCurrentResponseIndex(prev => ({
        ...prev,
        [messageIndex]: (prev[messageIndex] !== undefined ? prev[messageIndex] : 0) + 1
      }));
      
      // Update the displayed message in the conversation
      setConversation(prev => {
        const updatedConversation = [...prev];
        updatedConversation[messageIndex] = regeneratedMessage;
        return updatedConversation;
      });
      
      // Update follow-up questions if available
      if (response.data.follow_up_questions) {
        const validQuestions = processFollowUpQuestions(response.data.follow_up_questions);
        if (validQuestions.length > 0) {
          setCurrentFollowUpQuestions(validQuestions);
          setFollowUpQuestions(validQuestions);
        }
      }
      toast.success('Response regenerated successfully!', {
        isLoading: false,
        autoClose: 2000
      });
    }
  } catch (error) {
    console.error("Response regeneration error:", error);
    toast.error("Failed to regenerate response. Please try again.");
  }
  
  return Promise.resolve();
};
  
  // Function to display a specific regenerated response
  const displayRegeneratedResponse = (messageIndex, responseIndex) => {
    if (!regeneratedResponses[messageIndex] || 
        !regeneratedResponses[messageIndex][responseIndex]) {
      return;
    }
    
    // Update the displayed message in the conversation
    setConversation(prev => {
      const updatedConversation = [...prev];
      updatedConversation[messageIndex] = regeneratedResponses[messageIndex][responseIndex];
      return updatedConversation;
    });
    
    // Update the current index
    setCurrentResponseIndex(prev => ({
      ...prev,
      [messageIndex]: responseIndex
    }));
  };
  // Add a function to check upload permissions when component mounts
  const checkUploadPermissions = async () => {
    try {
      const response = await documentService.checkUploadPermissions();
      setHasUploadPermissions(response.data.can_upload);
    } catch (error) {
      console.error("Failed to check upload permissions:", error);
      // If we can't determine permissions, default to allowing the button
      setHasUploadPermissions(true);
    }
  };

  // Add this to your useEffect hooks
  useEffect(() => {
    // Call this after component mounts
    checkUploadPermissions();
  }, []);
  useEffect(() => {
    // If no documents are selected, force web knowledge mode on
    if (propSelectedDocuments.length === 0) {
      setUseWebKnowledge(true);
    } else {
      // When documents are selected, default to context-only mode (web knowledge off)
      setUseWebKnowledge(false);
    }
  }, [propSelectedDocuments]);

  // Updated Response Length Toggle Component
  const ResponseLengthToggle = ({ responseLength, setResponseLength }) => {
    return (
      <div className="relative">
        <select
  value={responseLength}
  onChange={(e) => {
    setResponseLength(e.target.value);
    toast.info(
      `Response mode: ${
        e.target.value === "short"
          ? "Short & Concise"
          : "Detailed & Comprehensive"
      }`
    );
  }}
  className="
    appearance-none
    dark:bg-gray-900
    dark:hover:bg-gray-800/90
    bg-white 
    border border-[#d6cbbf]
    hover:bg-[#ddd9c5]/10
    dark:text-gray-300
    text-[#381c0f]
    text-xs
    rounded-lg
    px-2
    py-1
    pl-6
    pr-7
    focus:outline-none
    focus:ring-1
    focus:ring-[#a55233]
    dark:focus:ring-blue-500
    cursor-pointer
    transition-colors
    dark:border-blue-500/20
  "
>
          <option value="short">Short</option>
          <option value="comprehensive">Comprehensive</option>
        </select>
        <span className="absolute inset-y-0 left-1 flex items-center pointer-events-none">
          <Layers className="h-3 w-3 dark:text-blue-400" />
        </span>
        <span className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
          <ChevronDown className="h-3 w-3 dark:text-blue-400" />
        </span>
      </div>
    );
  };

  // Updated Response Format Toggle Component
  const ResponseFormatToggle = ({ responseFormat, setResponseFormat }) => {
    return (
      <div className="relative">
        <select
          value={responseFormat}
          onChange={(e) => {
            setResponseFormat(e.target.value);
            toast.info(`Format mode: ${getFormatDisplayName(e.target.value)}`);
          }}
          className="
           appearance-none
    dark:bg-gray-900
    dark:hover:bg-gray-800/90
    bg-white 
    border border-[#d6cbbf]
    hover:bg-[#ddd9c5]/10
    dark:text-gray-300
    text-[#381c0f]
    text-xs
    rounded-lg
    px-2
    py-1
    pl-6
    pr-7
    focus:outline-none
    focus:ring-1
    focus:ring-[#a55233]
    dark:focus:ring-blue-500
    cursor-pointer
    transition-colors
    dark:border-blue-500/20
        "
        >
          <option value="auto_detect">Auto-Detect</option>
          <option value="natural">Natural</option>
          <option value="executive_summary">Executive Summary</option>
          <option value="detailed_analysis">Detailed Analysis</option>
          <option value="strategic_recommendation">
            Strategic Recommendation
          </option>
          <option value="comparative_analysis">Comparative Analysis</option>
          <option value="market_insights">Market Insights</option>
          <option value="factual_brief">Factual Brief</option>
          <option value="technical_deep_dive">Technical Deep Dive</option>
        </select>
        <span className="absolute inset-y-0 left-1 flex items-center pointer-events-none">
          <ScrollText className="h-3 w-3 dark:text-blue-400" />
        </span>
        <span className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
          <ChevronDown className="h-3 w-3 dark:text-blue-400" />
        </span>
      </div>
    );
  };

  // Add ResponseLengthToggle PropTypes
  ResponseLengthToggle.propTypes = {
    responseLength: PropTypes.string.isRequired,
    setResponseLength: PropTypes.func.isRequired,
  };

  // Add the PropTypes for ResponseFormatToggle
  ResponseFormatToggle.propTypes = {
    responseFormat: PropTypes.string.isRequired,
    setResponseFormat: PropTypes.func.isRequired,
  };

  // Helper function to get display names for the toast notification
  const getFormatDisplayName = (formatKey) => {
    const formatNames = {
      auto_detect: "Auto-Detect",
      natural: "Natural Response",
      executive_summary: "Executive Summary",
      detailed_analysis: "Detailed Analysis",
      strategic_recommendation: "Strategic Recommendation",
      comparative_analysis: "Comparative Analysis",
      market_insights: "Market Insights",
      factual_brief: "Factual Brief",
      technical_deep_dive: "Technical Deep Dive",
    };

    return formatNames[formatKey] || formatKey;
  };

  // Add this in your MainContent component
  useEffect(() => {
    console.log("Current message versions:", messageVersions);
  }, [messageVersions]);

  const handleMicInput = (event) => {
    event.preventDefault(); // Prevent zooming when clicking

    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Your browser does not support speech recognition.");
      return;
    }

    // If recognition instance doesn't exist, create one
    if (!recognitionRef.current) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Speech recognized:", transcript);

        setMessage(transcript); // Set the recognized text
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Speech recognition failed. Please try again.");
        setIsRecording(false); // End recording state on error
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended.");
        setIsRecording(false); // Ensure recording state is reset
      };
    }

    // Set recording state
    setIsRecording(true);

    // Stop ongoing recognition before starting a new one
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setTimeout(() => recognitionRef.current.start(), 200); // Restart after stopping
    } else {
      recognitionRef.current.start();
    }
  };

  const InlineCitation = ({ citation, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <span
        className="relative inline-block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <sup
          className="
          text-xs 
          text-blue-400 
          cursor-help 
          hover:underline 
          ml-0.5 
          transition-colors
        "
        >
          [{index + 1}]
        </sup>

        {isHovered && (
          <div
            className="
            absolute 
            z-50 
            bottom-full 
            left-1/2 
            transform 
            -translate-x-1/2 
            bg-gray-800 
            text-white 
            p-2 
            rounded-lg 
            shadow-lg 
            text-xs 
            w-64 
            pointer-events-none
            transition-all
            duration-300
            opacity-100
            animate-fade-in
          "
          >
            <div className="font-bold mb-1">Source Details</div>
            <div className="space-y-1">
              <p>
                <strong>Document:</strong> {citation.source_file}
              </p>
              <p>
                <strong>Page:</strong> {citation.page_number}
              </p>
              <div className="mt-1 text-gray-300 italic">
                {citation.snippet}
              </div>
            </div>
          </div>
        )}
      </span>
    );
  };

  InlineCitation.propTypes = {
    citation: PropTypes.shape({
      source_file: PropTypes.string,
      page_number: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.oneOf([null, undefined]),
      ]),
      snippet: PropTypes.string,
    }),
    index: PropTypes.number,
  };

  // New method to toggle between chat and summary views
  // Updated toggleView method
  const toggleView = (view) => {
    if (view === "summary" && propSelectedDocuments.length === 0) {
      toast.warning(
        "Please upload a document or select at least one document to view the summary."
      );
      // Still allow the view change if switching to chat
      if (view === "chat") {
        setCurrentView(view);
      }
      return;
    }
    setCurrentView(view);
  };

  // Add this function to handle the toggle
  const toggleWebKnowledge = () => {
    // If no documents are selected, don't allow turning off web mode
    if (propSelectedDocuments.length === 0) {
      toast.info("Web mode is required when no documents are selected");
      return;
    }

    setUseWebKnowledge((prev) => !prev);
    // Show a toast to confirm the mode change
    toast.info(
      `Mode switched to ${!useWebKnowledge ? "Web-Enhanced" : "Document-Only"}`
    );
  };

  // New method to copy summary to clipboard
  const copySummaryToClipboard = () => {
    if (persistentSummary) {
      // Create a temporary textarea to copy text
      const tempTextArea = document.createElement("textarea");
      tempTextArea.value = persistentSummary.replace(/<[^>]*>/g, ""); // Strip HTML tags
      document.body.appendChild(tempTextArea);
      tempTextArea.select();
      document.execCommand("copy");
      document.body.removeChild(tempTextArea);

      toast.success("Summary copied to clipboard!");
    }
  };

  // Add new method to handle summary generation
  const handleGenerateSummary = async () => {
    if (!propSelectedDocuments.length) {
      toast.warning("Please select documents to generate summary");
      return;
    }

    setIsSummaryGenerating(true);
    try {
      const response = await documentService.generateSummary(
        propSelectedDocuments,
        mainProjectId
      );

        
      if (response.data.summaries) {
        const combinedSummary = response.data.summaries
          .map((summary) => {
            // Parse summary content if it's JSON
            let summaryContent = summary.summary;
            if (typeof summaryContent === 'string' && summaryContent.startsWith('{')) {
              try {
                const parsedSummary = JSON.parse(summaryContent);
                summaryContent = parsedSummary.content || parsedSummary.summary || summaryContent;
              } catch (jsonError) {
                console.warn("Failed to parse summary JSON:", jsonError);
              }
            }
            
            return `<h3 class="text-lg font-bold mb-2">${summary.filename}</h3>${summaryContent}`;
          })
          .join('<hr class="my-4 border-blue-500/20" />');

        setSummary(combinedSummary);
        setPersistentSummary(combinedSummary);
        setIsSummaryVisible(true);
        toast.success("Summary generated successfully!");
      }
    } catch (error) {
      console.error("Summary Generation Error:", error);
      toast.error("Failed to generate summary. Please try again.");
    } finally {
      setIsSummaryGenerating(false);
    }
  };

 // This code focuses on the renderSummaryView method and related styling
// to be updated in your MainContent.jsx file

const renderSummaryView = () => {
  // If no documents are selected, show a placeholder
  if (!propSelectedDocuments || propSelectedDocuments.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#5a544a] dark:text-gray-400">
        <p className="mb-4">No documents selected</p>
        <button
          onClick={() => toggleView("chat")}
          className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] dark:bg-gray-800/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-white"
        >
          <MessageCircle className="inline-block mr-2 h-4 w-4" />
          Return to Chat
        </button>
        {isConsolidatedSummaryLoading && <ConsolidatedSummaryLoader />}
      </div>
    );
  }

  // Get the currently active document for summary view
  const currentDocId = activeDocumentForSummary || propSelectedDocuments[0];
  const currentDocument = documents.find(
    (doc) => doc.id.toString() === currentDocId
  );

  // Check if all selected documents have summaries
  const selectedDocs = documents.filter((doc) =>
    propSelectedDocuments.includes(doc.id.toString())
  );
  const allDocsHaveSummaries = selectedDocs.every(
    (doc) => doc.summary && doc.summary.trim() !== ""
  );

  // Determine which summary to show
  const summaryToShow = isConsolidatedView
    ? consolidatedSummary
    : selectedChat?.summary ||
      currentDocument?.summary ||
      persistentSummary ||
      "No summary available";

  // Handler for document selection change
  const handleDocumentChange = (event) => {
    const newDocId = event.target.value;
    setActiveDocumentForSummary(newDocId);

    if (newDocId === "consolidated") {
      setIsConsolidatedView(true);
      // Generate consolidated summary if it doesn't exist
      if (!consolidatedSummary) {
        handleGenerateConsolidatedSummary();
      }
    } else {
      setIsConsolidatedView(false);

      // Move selected document to front of array
      const updatedDocs = [
        newDocId,
        ...propSelectedDocuments.filter((id) => id !== newDocId),
      ];
      setSelectedDocuments(updatedDocs);

      if (setSelectedDocuments) {
        setSelectedDocuments(updatedDocs);
      }
    }
  };

  return (
    <div className="absolute inset-0 pt-16 backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
      {/* View Toggle at the top */}
      <div className="fixed left-0 right-0 flex justify-center z-50 top-4">
        <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-md shadow-lg border border-[#d6cbbf] dark:border-blue-500/20">
          <button
            title="Chat View"
            onClick={() => toggleView("chat")}
            className={`
              px-3 py-1.5 rounded-full text-xs transition-all duration-300
              ${
                currentView === "chat"
                  ? "bg-gradient-to-r from-[#a55233] to-[#8b4513] dark:from-blue-600/70 dark:to-green-500/70 text-white"
                  : "text-[#5e4636] dark:text-gray-300 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/50"
              }
            `}
          >
            <MessageCircle className="inline-block mr-1.5 h-3 w-3" />
            Chat
          </button>
          <button
            title="Summarize"
            onClick={() => toggleView("summary")}
            className={`
              px-3 py-1.5 rounded-full text-xs transition-all duration-300
              ${
                currentView === "summary"
                  ? "bg-gradient-to-r from-[#a55233] to-[#8b4513] dark:from-blue-600/70 dark:to-green-500/70 text-white"
                  : "text-[#5e4636] dark:text-gray-300 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/50"
              }
            `}
          >
            <ScrollText className="inline-block mr-1.5 h-3 w-3" />
            Summary
          </button>
        </div>
      </div>

      <div className="h-full w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="h-full flex flex-col bg-white/90 dark:bg-gradient-to-br dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80 border border-[#d6cbbf] dark:border-blue-500/20 rounded-3xl shadow-md dark:shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-2 bg-[#556052] dark:bg-gradient-to-r dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80  border-b border-[#e3d5c8] dark:border-blue-900/90 flex justify-between items-center">
            <div>
              <h2 className="text-sm sm:text-xl font-normal font-serif text-white">
                {isConsolidatedView
                  ? "Consolidated Document Summary"
                  : "Document Summary"}
              </h2>
              

              {isConsolidatedView && (
                <ConsolidatedViewBadge
                  documentCount={propSelectedDocuments.length}
                />
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Enhanced Document Selector */}
              {propSelectedDocuments.length > 0 && (
                <DocumentSelector
                  documents={documents}
                  selectedDocuments={propSelectedDocuments}
                  activeDocumentId={activeDocumentForSummary}
                  isConsolidatedView={isConsolidatedView}
                  onDocumentChange={handleDocumentChange}
                  onConsolidatedView={handleGenerateConsolidatedSummary}
                  isConsolidatedSummaryLoading={isConsolidatedSummaryLoading}
                  mainProjectId={mainProjectId}
                />
              )}
              {/* Generate Summary Button - Only show if summaries don't exist */}
              {!allDocsHaveSummaries && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={isSummaryGenerating}
                  className={`
                    px-4 py-2 rounded-lg text-sm
                    ${
                      isSummaryGenerating
                        ? "bg-[#d6cbbf] dark:bg-gray-600 cursor-not-allowed"
                        : "bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-600 dark:to-green-500 dark:hover:from-blue-700 dark:hover:to-green-600"
                    }
                    text-white transition-all duration-300 flex items-center space-x-2
                  `}
                >
                  {isSummaryGenerating ? (
                    <>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      <span>Generate Summary</span>
                    </>
                  )}
                </button>
              )}

              {/* Copy Button */}
              <button
                onClick={copySummaryToClipboard}
                className="text-white hover:text-[#a55233] dark:text-gray-300 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-[#f5e6d8]/50 dark:hover:bg-blue-500/20"
                title="Copy Summary"
              >
                <Copy className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Summary Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900/80 p-4">
            {isConsolidatedView && !consolidatedSummary ? (
              <div className="flex flex-col items-center justify-center h-full text-[#8c715f] dark:text-gray-400">
                <Layers className="h-16 w-16 mb-4 text-[#a55233]/30 dark:text-gray-600" />
                <p className="mb-4 text-center">
                  {isConsolidatedSummaryLoading
                    ? "Generating consolidated summary..."
                    : "Click 'Analyze Together' to create a unified summary across all documents"}
                </p>
              </div>
            ) : (!persistentSummary &&
                !consolidatedSummary &&
                !summaryToShow) ||
              summaryToShow === "No summary available" ? (
              <div className="flex flex-col items-center justify-center h-full text-[#8c715f] dark:text-gray-400">
                <ScrollText className="h-16 w-16 mb-4 text-[#a55233]/30 dark:text-gray-600" />
                <p className="mb-4 text-center">
                  {allDocsHaveSummaries
                    ? "Loading summary..."
                    : "Click 'Generate Summary' to analyze the selected documents"}
                </p>
              </div>
            ) : (
              <SummaryFormatter content={summaryToShow} />
            )}
          </div>
        </div>
      </div>
      {/* Show proper loading states */}
      {isSummaryGenerating && <SummaryGenerationLoader />}
      {isConsolidatedSummaryLoading && <ConsolidatedSummaryLoader />}

      {/* Styles */}
      <style>{summaryStyles}</style>
      <style>{consolidatedSummaryStyles}</style>
      <style>{badgeStyles}</style>
      
      {/* Add light theme specific styles */}
      <style>{`
        /* Light theme specific prose styles */
        .SummaryFormatter h1, .SummaryFormatter h2, .SummaryFormatter h3, .SummaryFormatter h4 {
          color: #0a3b25;
        }
        .SummaryFormatter p, .SummaryFormatter ul, .SummaryFormatter ol {
          color: #5e4636;
        }
        .SummaryFormatter strong {
          color: #5e4636;
          font-weight: 600;
        }
        
        /* Custom scrollbar for light theme */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(213, 190, 170, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(165, 82, 51, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(165, 82, 51, 0.3);
        }
      `}</style>
    </div>
  );
};


  useEffect(() => {
    // Update persistent summary when prop or popup summary changes
    if (propSummary) {
      setPersistentSummary(propSummary);
      setIsSummaryVisible(true);
    }
  }, [propSummary]);

  useEffect(() => {
    fetchUserDocuments();
  }, []);

 useEffect(() => {
  if (selectedChat) {
    console.log("Loading selected chat:", selectedChat);

    // Set conversation state with messages
    const chatMessages = selectedChat.messages || [];
    
    // Process messages and ensure webSources are included
    const processedMessages = chatMessages.map(msg => {
      if (msg.sources_info || msg.extracted_urls || msg.webSources) {
        return {
          ...msg,
          webSources: msg.webSources || processWebSources(msg.sources_info, msg.extracted_urls)
        };
      }
      return msg;
    });
    
    setConversation(
      [...processedMessages].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )
    );

    // Set conversation ID
    setConversationId(selectedChat.conversation_id);

    // Set summary state
    if (selectedChat.summary) {
      setSummary(selectedChat.summary);
      setPersistentSummary(selectedChat.summary);
    }

    // Handle documents
    if (selectedChat.selected_documents?.length > 0) {
      const documentIds = selectedChat.selected_documents.map((doc) =>
        typeof doc === "object" ? doc.id.toString() : doc.toString()
      );
      setSelectedDocuments(documentIds);
      setActiveDocumentForSummary(documentIds[0]);

      // Important: Also update the parent's selectedDocuments
      if (setSelectedDocuments) {
        setSelectedDocuments(documentIds);
      }
    }

    // Handle follow-up questions
    const followUps = selectedChat.follow_up_questions || [];
    const processedFollowUps = processFollowUpQuestions(followUps);

    if (processedFollowUps.length > 0) {
      console.log("Setting follow-up questions:", processedFollowUps);
      setCurrentFollowUpQuestions(processedFollowUps);
      setFollowUpQuestions(processedFollowUps);
    } else {
      // Reset follow-up questions if none exist
      setCurrentFollowUpQuestions([]);
      setFollowUpQuestions([]);
    }
  }
}, [selectedChat, setFollowUpQuestions, setSummary, setSelectedDocuments]);

  useEffect(() => {
    // Cleanup function to reset states when component unmounts or chat changes
    return () => {
      setConversation([]);
      setMessage("");
      setConversationId(null);
      setCurrentFollowUpQuestions([]);
    };
  }, []);

  useEffect(() => {
    // Only scroll if the last message is a user message
    const lastMessage = conversation[conversation.length - 1];
    if (lastMessage && lastMessage.role === "user") {
      scrollToBottom();
    }
  }, [conversation]);

  useEffect(() => {
    // Sync local state with prop when prop changes
    if (propSelectedDocuments) {
      setSelectedDocuments(propSelectedDocuments);
    }
  }, [propSelectedDocuments]);

  useEffect(() => {
    // When local state changes, update the prop
    if (setSelectedDocuments) {
      setSelectedDocuments(propSelectedDocuments);
    }
  }, [propSelectedDocuments, setSelectedDocuments]);

  // 4. Add method to generate consolidated summary
  const handleGenerateConsolidatedSummary = async () => {
    if (propSelectedDocuments.length <= 1) {
      toast.warning(
        "Please select at least two documents for a consolidated summary"
      );
      return;
    }

    setIsConsolidatedSummaryLoading(true);
    setIsConsolidatedView(true); // Automatically switch to consolidated view

    try {
      // Show a user-friendly toast to indicate the process has started
      toast.info("Creating consolidated summary from multiple documents...", {
        autoClose: false,
        toastId: "consolidated-summary-loading",
      });

      const response = await documentService.generateConsolidatedSummary(
        propSelectedDocuments,
        mainProjectId
      );

      if (response.data.consolidated_summary) {
        setConsolidatedSummary(response.data.consolidated_summary);

        // Close the loading toast and show success
        toast.dismiss("consolidated-summary-loading");
        toast.success("Consolidated summary generated successfully!");
      }
    } catch (error) {
      console.error("Consolidated Summary Generation Error:", error);
      toast.dismiss("consolidated-summary-loading");
      toast.error("Failed to generate consolidated summary. Please try again.");

      // Reset the view if generation fails
      setIsConsolidatedView(false);
    } finally {
      setIsConsolidatedSummaryLoading(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchUserDocuments = useCallback(async () => {
    if (!mainProjectId) {
      console.log("No mainProjectId, skipping fetch");
      return;
    }

    try {
      const response = await documentService.getUserDocuments(mainProjectId);
      if (response?.data) {
        setDocuments(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("Failed to fetch documents");
    }
  }, [mainProjectId]);

  // Update the useEffect for document fetching
  useEffect(() => {
    fetchUserDocuments();

    // Set up periodic refresh
    const intervalId = setInterval(fetchUserDocuments, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchUserDocuments]);

  const handleFileChange = async (event) => {
  if (!hasUploadPermissions) {
    toast.error(
      "You do not have permission to upload documents. Please contact your administrator."
    );
    event.target.value = "";
    return;
  }
  const selectedFiles = Array.from(event.target.files);
  if (!selectedFiles.length) return;

  setCurrentUploadFilenames(selectedFiles.map(f => f.name));
 
  setIsDocumentProcessing(true);
  setProcessingProgress(0);
 
  const processingDocuments = selectedFiles.map((file) => ({
    filename: file.name,
    status: "waiting",
    progress: 0,
    message: "Waiting to upload",
  }));
  setProcessingDocuments(processingDocuments);
 
  try {
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("main_project_id", mainProjectId);
 
    const totalUploadSize = selectedFiles.reduce(
      (total, file) => total + file.size,
      0
    );
 
    let uploadStage = 0;
 
    // Simple fix: just remove timeout and add better progress messages
    const response = await documentService.uploadDocument(
      formData,
      mainProjectId,
      {
        onUploadProgress: (progressEvent) => {
          const uploadPercentage = Math.round(
            (progressEvent.loaded * 100) / totalUploadSize
          );
          const scaledProgress = Math.floor(uploadPercentage * 0.7);
 
          uploadStage = 1;
          setProcessingProgress(scaledProgress);
 
          setProcessingDocuments((prevDocs) => {
            return prevDocs.map((doc, index) => {
              const fileProgress = Math.min(
                100,
                uploadPercentage - index * 10
              );
 
              return {
                ...doc,
                status: fileProgress > 0 ? "uploading" : "waiting",
                progress: Math.max(0, fileProgress),
                message:
                  fileProgress > 0
                    ? `Uploading: ${Math.min(100, fileProgress)}%`
                    : "Waiting to upload",
              };
            });
          });
        },
      }
    );
 
    // Processing stage
    uploadStage = 2;
    setProcessingProgress(75);
 
    setProcessingDocuments((prevDocs) => {
      return prevDocs.map((doc) => ({
        ...doc,
        status: "processing",
        progress: 75,
        message: "Processing document - please wait, this may take several minutes for large files",
      }));
    });
 
    const documents = response.data.documents || [];
    const uploadResults = response.data.upload_results || [];
 
    if (uploadResults.length > 0) {
      setProcessingDocuments((prevDocs) => {
        const updatedDocs = [...prevDocs];
 
        uploadResults.forEach((result) => {
          const docIndex = updatedDocs.findIndex(
            (doc) => doc.filename === result.filename
          );
          if (docIndex !== -1) {
            updatedDocs[docIndex] = {
              ...updatedDocs[docIndex],
              id: result.id,
              status: result.status,
              progress: result.progress,
              message: result.message,
            };
          }
        });
 
        return updatedDocs;
      });
    }
 
    // Complete progress
    for (let progress = 80; progress <= 100; progress += 5) {
      setProcessingProgress(progress);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
 
    uploadStage = 3;
 
    if (documents.length > 0) {
      const newSelectedDocuments = documents.map((doc) => doc.id.toString());
      setSelectedDocuments(newSelectedDocuments);
 
      if (setSelectedDocuments) {
        setSelectedDocuments(newSelectedDocuments);
      }
 
      setCurrentView("chat");
 
      setDocuments((prevDocs) => {
        const newDocs = documents.filter(
          (newDoc) =>
            !prevDocs.some((existingDoc) => existingDoc.id === newDoc.id)
        );
        return [...prevDocs, ...newDocs];
      });
 
      setTimeout(() => {
        toast.success(
          `${documents.length} document${
            documents.length > 1 ? "s" : ""
          } uploaded successfully!`
        );
        setIsDocumentProcessing(false);
      }, 1000);
    }
  } catch (error) {
    console.error("Upload Error:", error);
   
    // Better error messages based on error type
    let errorMessage = "Upload failed. Please try again.";
   
    if (error.code === 'ECONNABORTED') {
      errorMessage = "Connection timed out. Please check your internet and try again.";
    } else if (!error.response && error.request) {
      errorMessage = "Network error. Please check your connection.";
    } else if (error.response?.status === 413) {
      errorMessage = "File size too large. Please try with smaller files.";
    } else if (error.response?.status >= 500) {
      errorMessage = "Server error. Please try again in a few minutes.";
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
   
    toast.error(errorMessage);
    setIsDocumentProcessing(false);
 
    setProcessingDocuments((prevDocs) => {
      return prevDocs.map((doc) => ({
        ...doc,
        status: "error",
        progress: 0,
        message: "Upload failed",
      }));
    });
  }
};

const filteredProcessingDocuments = processingDocuments.filter(doc =>
  currentUploadFilenames.includes(doc.filename)
);

 const handleSendMessage = async (message) => {
    if (!message.trim()) return;
 
    // Optimistically add user message
    const newConversation = [
      ...conversation,
      { role: "user", content: message },
    ];
    setConversation(newConversation);
    setMessage("");
    setIsLoading(true);
 
    if (!isFollowUpQuestionsMinimized) {
      setIsFollowUpQuestionsMinimized(true);
    }
 
    try {
      // Force useWebKnowledge to true if no documents are selected
      const useWebMode =
        propSelectedDocuments.length === 0 ? true : useWebKnowledge;
 
      // Prepare request data
      const messageData = {
        message,
        conversation_id: conversationId,
        selected_documents: propSelectedDocuments,
        main_project_id: mainProjectId,
        messages: newConversation,
        use_web_knowledge: useWebMode,
        response_length: responseLength,
        response_format: responseFormat,
        general_chat_mode: propSelectedDocuments.length === 0,
      };
 
      console.log("🚀 SENDING REQUEST TO BACKEND:", messageData);
 
      const response = await chatService.sendMessage(messageData);
 
      console.log("📦 Full Response Object:", response);
 
      if (response && response.data) {
        // If backend returns the full conversation/messages array, use it:
        if (response.data.messages && Array.isArray(response.data.messages)) {
          setConversation(response.data.messages);
        } else {
          // Fallback: append assistant message as before
          let responseContent = response.data.response || response.data.content;
          let citations = response.data.citations || [];
          const webSources = processWebSources(
            response.data.sources_info,
            response.data.extracted_urls
          );
 
          if (
            typeof responseContent === "string" &&
            responseContent.startsWith("{")
          ) {
            try {
              const parsedResponse = JSON.parse(responseContent);
              responseContent = parsedResponse.content || responseContent;
              if (parsedResponse.citations) {
                citations = parsedResponse.citations;
              }
            } catch (jsonError) {
              console.warn(
                "⚠️ Failed to parse JSON response, using as-is:",
                jsonError
              );
            }
          }
 
          const assistantMessage = {
            role: "assistant",
            content: responseContent,
            citations: citations,
            follow_up_questions: response.data.follow_up_questions || [],
            use_web_knowledge: response.data.use_web_knowledge || useWebMode,
            response_length: response.data.response_length || responseLength,
            response_format: response.data.response_format || responseFormat,
            webSources: webSources,
            sources_info: response.data.sources_info,
            extracted_urls: response.data.extracted_urls,
          };
 
          setConversation([...newConversation, assistantMessage]);
        }
 
        // Update follow-up questions if available
        if (response.data.follow_up_questions) {
          let questions = response.data.follow_up_questions;
          if (
            typeof questions === "string" &&
            questions.includes('"questions"')
          ) {
            try {
              const parsed = JSON.parse(questions);
              questions = parsed.questions || [];
            } catch (e) {
              console.error("Failed to parse follow-up questions:", e);
              questions = [];
            }
          }
          if (Array.isArray(questions) && questions.length > 0) {
            setCurrentFollowUpQuestions(questions);
            setFollowUpQuestions(questions);
          }
        }
 
        // Ensure conversation_id is set for the entire chat session
        if (!conversationId && response.data.conversation_id) {
          setConversationId(response.data.conversation_id);
        }
      }
    } catch (error) {
      console.error("\n❌ CHAT ERROR OCCURRED:", error);
      toast.error("Failed to send message. Please try again.");
      // Remove the user message on error
      setConversation((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleDeleteMessageClick = (index) => {
    setMessageToDelete(index);
    setDeleteModalOpen(true);
  };
 
  const confirmDeleteMessage = () => {
    if (messageToDelete !== null) {
      handleDeleteMessage(messageToDelete); // Call your existing function
      setDeleteModalOpen(false);
      setMessageToDelete(null);
    }
  };
 
  const handleDeleteMessage = async (userMsgIndex) => {
    if (
      conversation[userMsgIndex]?.role !== "user" ||
      !conversation[userMsgIndex + 1] ||
      conversation[userMsgIndex + 1].role !== "assistant"
    ) {
      toast.error("Could not find the corresponding assistant response.");
      return;
    }
 
    const userMessage = conversation[userMsgIndex];
    const assistantMessage = conversation[userMsgIndex + 1];
 
    // Optimistically update UI
    setConversation((prev) => {
      const updated = [...prev];
      updated.splice(userMsgIndex, 2);
      return updated;
    });
 
    try {
      console.log("Deleting message pair:", {
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        conversationId,
      });
 
      // Call backend API to delete both messages by their IDs
      await chatService.deleteMessagePair(
        userMessage.id,
        assistantMessage.id,
        conversationId
      );
      toast.success("Message and response deleted.");
    } catch (error) {
      toast.error("Failed to delete message. Please refresh.");
      // Optionally: reload chat from backend to sync
      // Or revert the UI change:
      setConversation((prev) => {
        const updated = [...prev];
        updated.splice(userMsgIndex, 0, userMessage, assistantMessage);
        return updated;
      });
    }
  };

const WebSourcesDisplay = ({ sources }) => {
  if (!sources || sources.length === 0) return null;
  
  // Define file extensions that should not be clickable
  const fileExtensions = [
    '.pdf', '.docx', '.txt', '.pptx', '.jpg', '.jpeg', '.bmp', 
    '.png', '.mp3', '.mp4', '.wav', '.mpeg', '.doc', '.xls', 
    '.xlsx', '.ppt', '.gif', '.tiff', '.zip', '.rar'
  ];
  
  // Process sources to determine if they're web links or files
  const processedSources = sources.map((source, index) => {
    // Remove any leading/trailing whitespace and asterisks
    let cleanSource = source.trim().replace(/\*$/, '');
    
    // Check if it's a file by looking for file extensions
    const isFile = fileExtensions.some(ext => 
      cleanSource.toLowerCase().includes(ext.toLowerCase())
    );
    
    if (isFile) {
      // For files, just return the clean source as display text
      return {
        type: 'file',
        display: cleanSource,
        url: null
      };
    } else {
      // For web sources, process as before
      // If it's just a domain without http/https, add https://
      if (!cleanSource.startsWith('http')) {
        cleanSource = `https://${cleanSource}`;
      }
      
      // Extract just the domain for display
      const domainMatch = cleanSource.match(/^https?:\/\/(?:www\.)?([^\/]+)/i);
      const displayText = domainMatch ? domainMatch[1] : cleanSource;
      
      return {
        type: 'web',
        url: cleanSource,
        display: displayText
      };
    }
  });

  return (
    <div className="web-sources-container">
      <style>{`
        .web-source-link {
          color: #0066cc;
          text-decoration: underline;
          cursor: pointer;
        }
        
        .web-source-link:hover {
          color: #0052a3;
        }
        
        .file-source-text {
          color: #666;
          font-style: italic;
        }
        
        .sources-label {
          font-weight: 500;
          margin-right: 8px;
        }
        
        .source-item {
          display: inline;
        }
      `}</style>
      <div className="web-sources-header">
        <span className="sources-label">Sources:</span>
      </div>
      <div className="web-sources-list">
        {processedSources.map((source, index) => (
          <span key={index} className="source-item">
            {source.type === 'web' ? (
              <a 
                href={source.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="web-source-link"
              >
                {source.display}
              </a>
            ) : (
              <span className="file-source-text">
                {source.display}
              </span>
            )}
            {index < processedSources.length - 1 && ', '}
          </span>
        ))}
      </div>
    </div>
  );
};


  const toggleFollowUpQuestions = () => {
    setIsFollowUpQuestionsMinimized((prev) => !prev);
  };

  // Add a method to clean up duplicate messages
  const cleanupConversation = (messages) => {
    const uniqueMessages = [];
    const seenMessages = new Set();

    messages.forEach((message, index) => {
      // Create a unique key for the message
      const messageKey = JSON.stringify({
        role: message.role,
        content: message.content,
        // Add index to ensure uniqueness of assistant messages
        index: index,
      });

      // For assistant messages, only keep the most recent one after a user message
      if (message.role === "assistant") {
        // Find the last user message before this assistant message
        const lastUserMessageIndex = messages
          .slice(0, index)
          .reverse()
          .findIndex((m) => m.role === "user");

        if (lastUserMessageIndex !== -1) {
          const messageKey = JSON.stringify({
            role: message.role,
            content: message.content,
            userMessageIndex: index - lastUserMessageIndex - 1,
          });

          if (!seenMessages.has(messageKey)) {
            uniqueMessages.push(message);
            seenMessages.add(messageKey);
          }
        } else {
          // If no previous user message, add the assistant message
          uniqueMessages.push(message);
        }
      } else {
        // For user messages, always add
        if (!seenMessages.has(messageKey)) {
          uniqueMessages.push(message);
          seenMessages.add(messageKey);
        }
      }
    });

    return uniqueMessages;
  };

  // Add this useEffect in MainContent.jsx to handle null selectedChat
  useEffect(() => {
    // If selectedChat becomes null (e.g., when a chat is deleted),
    // reset the conversation state
    if (selectedChat === null) {
        console.log("🔄 MainChat: selectedChat is NULL - CLEARING EVERYTHING");
      setConversation([]);
      setConversationId(null);
      setMessage("");
      setCurrentFollowUpQuestions([]);

      // Reset any message history or version tracking
    setMessageVersions({});
    setCurrentVersionIndex({});
    setRegeneratedResponses({});
    setCurrentResponseIndex({});

      // Reset any other chat-specific states as needed
      // For example, you might want to keep document selections

      console.log("Chat reset due to null selectedChat");
    }
  }, [selectedChat]);

  // Replace the existing handleMessageUpdate function with this simpler implementation
  const handleMessageUpdate = async (messageIndex, newContent) => {
  // Ignore if content hasn't changed
  if (newContent === conversation[messageIndex].content) {
    setEditingMessageId(null);
    return;
  }

  setIsLoading(true);

  if (!isFollowUpQuestionsMinimized) {
    setIsFollowUpQuestionsMinimized(true);
  }

  try {
    // Get current message content and create a version entry
    const originalContent = conversation[messageIndex].content;

    // Store the original version if this is the first edit
    if (!messageVersions[messageIndex]) {
      // First time editing - store original content WITH its response
      // Get the original response that comes after this message
      const originalResponse = conversation[messageIndex + 1];

      setMessageVersions((prev) => ({
        ...prev,
        [messageIndex]: [
          {
            content: originalContent,
            response: originalResponse, // Store the full response object
            timestamp: new Date().toISOString(),
            isOriginal: true,
          },
        ],
      }));

      // Set current version to 0 (original)
      setCurrentVersionIndex((prev) => ({
        ...prev,
        [messageIndex]: 0,
      }));

      console.log("Stored original message and response:", {
        message: originalContent,
        response: originalResponse,
      });
    }

    // Update the edited message in the conversation
    const updatedMessage = {
      ...conversation[messageIndex],
      content: newContent,
      edited: true,
      editedAt: new Date().toISOString(),
    };

    // Create conversation array up to the edited message
    const conversationUpToEdit = [
      ...conversation.slice(0, messageIndex),
      updatedMessage,
    ];

    // Update conversation state immediately for better UX
    setConversation(conversationUpToEdit);

    // Get current response format and length
    const currentResponseFormat = responseFormat;
    const currentResponseLength = responseLength;

    // Force web mode when no documents are selected
    const useWebMode =
      propSelectedDocuments.length === 0 ? true : useWebKnowledge;

    // Prepare request data for the API
    const requestData = {
      message: newContent,
      conversation_id: conversationId,
      selected_documents: propSelectedDocuments,
      main_project_id: mainProjectId,
      context: conversationUpToEdit,
      use_web_knowledge: useWebMode,
      response_length: currentResponseLength,
      response_format: currentResponseFormat,
      general_chat_mode: propSelectedDocuments.length === 0,
    };

    // Send to API and get new response
    const response = await chatService.sendMessage(requestData);
    
    // Parse the JSON response
    let responseContent = response.data.response || response.data.content || "No response received";
    let citations = response.data.citations || [];
    
    // Process web sources using the helper function
    const webSources = processWebSources(response.data.sources_info, response.data.extracted_urls);
    
    // Handle JSON response format
    if (typeof responseContent === 'string' && responseContent.startsWith('{')) {
      try {
        const parsedResponse = JSON.parse(responseContent);
        responseContent = parsedResponse.content || responseContent;
        if (parsedResponse.citations) {
          citations = parsedResponse.citations;
        }
      } catch (jsonError) {
        console.warn("Failed to parse JSON response:", jsonError);
      }
    }

    // Add the new assistant response
    const assistantMessage = {
      role: "assistant",
      content: responseContent,
      citations: response.data.citations || [],
      follow_up_questions: response.data.follow_up_questions || [],
      use_web_knowledge: response.data.use_web_knowledge || useWebMode,
      response_length: response.data.response_length || currentResponseLength,
      response_format: response.data.response_format || currentResponseFormat,
      general_chat_mode: propSelectedDocuments.length === 0,
      webSources: webSources, // Add processed web sources
      sources_info: response.data.sources_info, // Store original sources_info
      extracted_urls: response.data.extracted_urls, // Store original extracted_urls
    };

    const finalConversation = [...conversationUpToEdit, assistantMessage];

    // Update conversation with the new response
    setConversation(finalConversation);

    // Store the new version with its response
    setMessageVersions((prev) => {
      const versions = [...(prev[messageIndex] || [])];

      // If this is the first edit and we don't have the original stored yet,
      // store the original first before adding the new version
      if (versions.length === 0) {
        // Get the original message and response
        const originalMessage = conversation[messageIndex].content;
        const originalResponse = conversation[messageIndex + 1];

        versions.push({
          content: originalMessage,
          response: originalResponse,
          timestamp: originalResponse?.created_at || new Date().toISOString(),
          isOriginal: true,
        });

        console.log("Added original message and response to versions:", {
          content: originalMessage,
          response: originalResponse,
        });
      }

      // Add the new version
      versions.push({
        content: newContent,
        response: assistantMessage,
        timestamp: new Date().toISOString(),
        isOriginal: false, // Explicitly mark as not original
        isEdited: true, // Add an explicit edited flag
      });

      console.log("Added new edited version to history:", {
        content: newContent,
        response: assistantMessage,
      });

      return {
        ...prev,
        [messageIndex]: versions,
      };
    });

    // Update current version to the latest
    setCurrentVersionIndex((prev) => {
      const versions = messageVersions[messageIndex] || [];
      return {
        ...prev,
        [messageIndex]: versions.length, // Point to the new version
      };
    });

    setEditingMessageId(null);

    // Update follow-up questions if available
    if (response.data.follow_up_questions) {
      const validQuestions = processFollowUpQuestions(response.data.follow_up_questions);
      if (validQuestions.length > 0) {
        setCurrentFollowUpQuestions(validQuestions);
        setFollowUpQuestions(validQuestions);
      }
    }
  } catch (error) {
    console.error("Failed to update message:", error);
    toast.error(
      error.response?.data?.error ||
        "Failed to update message. Please try again."
    );
    // Restore the original conversation state
    setConversation(conversation);
  } finally {
    setIsLoading(false);
  }
};

  // Replace the previous handleRestoreVersion with this simpler version
  const handleRestoreVersion = (messageIndex, versionIndex) => {
    // Get versions for this message
    const versions = messageVersions[messageIndex] || [];

    if (versions.length === 0 || versionIndex >= versions.length) {
      console.error(
        "Cannot restore version - invalid version index or no versions"
      );
      return;
    }

    // Get the version to restore
    const versionToRestore = versions[versionIndex];

    console.log(
      `Restoring message at index ${messageIndex} to version ${versionIndex}:`,
      versionToRestore
    );

    // Update the conversation with the selected version
    const updatedConversation = [...conversation];

    // Update the message content
    updatedConversation[messageIndex] = {
      ...updatedConversation[messageIndex],
      content: versionToRestore.content,
      currentVersionIndex: versionIndex,
    };

    // If we have a response for this version, update it too
    if (versionToRestore.response) {
      updatedConversation[messageIndex + 1] = {
        ...updatedConversation[messageIndex + 1],
        content: versionToRestore.response.content,
        citations: versionToRestore.response.citations || [],
      };

      console.log("Also restoring response:", versionToRestore.response);
    } else {
      console.warn("No response found for this version");
    }

    // Update the conversation
    setConversation(updatedConversation);

    // Update the current version index
    setCurrentVersionIndex((prev) => ({
      ...prev,
      [messageIndex]: versionIndex,
    }));
  };
  // Add a useEffect to further clean up conversation on initial load
  useEffect(() => {
    if (conversation.length > 0) {
      const cleanedConversation = cleanupConversation(conversation);
      if (cleanedConversation.length !== conversation.length) {
        setConversation(cleanedConversation);
      }
    }
  }, [conversation]);

  const [copyMessageIndex, setCopyMessageIndex] = useState(null);

  // Copy function with feedback
  const handleCopyMessage = (content, index) => {
    // Create a temporary element to strip HTML tags for plain text copy
    const tempElement = document.createElement("div");
    tempElement.innerHTML = content;
    const textContent = tempElement.textContent || tempElement.innerText;

    navigator.clipboard
      .writeText(textContent)
      .then(() => {
        // Show "Copied!" text
        setCopyMessageIndex(index);

        // Reset after 2 seconds
        setTimeout(() => {
          setCopyMessageIndex(null);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const cleanAndFormatHTML = (content) => {
    // If content doesn't have HTML tags, return it as is
    if (!content.includes('<li>') && !content.includes('<p>') && !content.includes('<b>')) {
      return content;
    }
  
    // Handle incomplete or malformed lists
    let cleanedContent = content;
    
    // Check if there are any <li> tags without an enclosing <ul> or <ol>
    if ((cleanedContent.includes('<li>') || cleanedContent.includes('</li>')) && 
        !cleanedContent.includes('<ul>') && !cleanedContent.includes('<ol>')) {
      // Wrap all the content in a <ul> if it contains list items but no list container
      cleanedContent = '<ul>' + cleanedContent + '</ul>';
    }
    
    // Make sure all list items are properly closed
    cleanedContent = cleanedContent.replace(/<li>(.*?)(?!<\/li>)(<li>|$)/g, '<li>$1</li>$2');
    
    // Make sure all paragraphs are properly closed
    cleanedContent = cleanedContent.replace(/<p>(.*?)(?!<\/p>)(<p>|$)/g, '<p>$1</p>$2');
    
    // Make sure all bold tags are properly closed
    cleanedContent = cleanedContent.replace(/<b>(.*?)(?!<\/b>)(<b>|$)/g, '<b>$1</b>$2');
    
    return cleanedContent;
  };

  return (
    <div
      className="flex-1 h-screen w-full overflow-hidden backdrop-blur-lg relative
          transition-all 
          duration-300 
          ease-in-out
          
          "
    >
      {/* Conditional Rendering based on current view */}
      <div className="absolute inset-0 top-16 overflow-hidden">
        {currentView === "chat" ? (
          <div
            className="flex flex-col h-full w-full backdrop-blur-xl 
              top-16
              rounded-t-3xl 
              overflow-hidden 
              
            "
          >
            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-2 sm:p-4 backdrop-blur-lg
              sm:space-y-4
              custom-scrollbar
              pb-[100px] flex flex-col space-y-4 transition-all duration-300 ease-in-out 
              ${!isFollowUpQuestionsMinimized ? "pb-[150px]" : "pb-4"}`}
            >
              {/* Add welcome components based on document selection */}
{conversation.length === 0 && (
  propSelectedDocuments.length === 0 ? (
    <WebModeWelcome className="mt-4 mx-auto max-w-3xl" />
  ) : (
    <DocumentModeWelcome 
      className="mt-4 mx-auto max-w-3xl" 
      selectedDocuments={propSelectedDocuments}
      documents={documents}
    />
  )
)}

              {/* Rest of the chat messages rendering code */}
              {conversation.map((msg, index) => (
                <React.Fragment key={index}>
                  <div
                    className={`flex items-start ${
                      msg.role === "user" ? "justify-end " : "justify-start"
                    }`}
                  >
                    {/* Delete button for user messages - positioned outside and to the left */}
                    {msg.role === "user" && (
                      <button
                        onClick={() => handleDeleteMessageClick(index)}
                        className="mr-2 mt-1 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Delete this message and its response"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                    <div
  className={`
    p-4
    rounded-lg
    backdrop-blur-md
    border
    shadow-sm
    ${
      msg.role === "user"
        ? "dark:bg-[#1e3a3e]/95 bg-[#f0eee5] font-medium tracking-wide dark:text-white text-[#1a535c] max-w-[70%] dark:border-[#2a4a4e]/40"
        : "dark:bg-[#121a1e]/90 bg-[#ffffff] dark:text-gray-300 text-[#0a2b1c] max-w-full dark:border-[#1e3a46]/25 border-white shadow-sm"
    }
    transition-all
    duration-300
    dark:hover:shadow-xl
    hover:shadow-md
    hover:border-opacity-50
    
  `}
>
                      <div className="flex items-center mb-2">
                        {msg.role === "assistant" && (
  <>
    <img
      src={BotIcon}
      alt="Klarifai"
      className="mr-2 h-5 w-5"
    />
    <span className="font-bold">Klarifai</span>
  </>
)}

                        {/* Add edited indicator i message was edited */}
                        {msg.edited && (
                          <span className="ml-2 text-xs dark:text-blue-400 text-[#1a7d54]">
                            (edited)
                          </span>
                        )}

                        {/* Add historical view indicator if viewing a previous version */}
                        {msg.isHistoricalView && (
                          <span className="ml-2 text-xs dark:text-amber-400 text-[#a55233]">
                            (historical view)
                          </span>
                        )}

                        {/* All badges for assistant messages */}
                        {msg.role === "assistant" && (
                          <div className="flex flex-wrap items-center ml-2 gap-1.5">
                            {/* Web Knowledge Badge */}
                            {msg.use_web_knowledge ? (
                              <div className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs  text-blue-400">
                                <Globe className="h-3 w-3 mr-0.5" />
                                <span>Web</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs  dark:text-indigo-400 text-[#7b2cbf]">
                                <Database className="h-3 w-3 mr-0.5" />
                                <span>Context</span>
                              </div>
                            )}

                            {/* Response Length Badge */}
                            {msg.response_length && (
                              <div
                                className={`
                    inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs
                    ${
                      msg.response_length === "short"
                        ? "dark:text-[#7ccc7c]/90 text-[#1b7742]"
                        : "dark:text-yellow-100 text-[#e76f51]"
                    }
                  `}
                              >
                                <Layers className="h-3 w-3 mr-0.5" />
                                <span>
                                  {msg.response_length === "short"
                                    ? "Short"
                                    : "Comprehensive"}
                                </span>
                              </div>
                            )}

                            {/* Format Badge - Show ALL formats including "natural" */}
                            <div className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs  dark:text-[#e67e5e] text-[#9c6644]">
                              <ScrollText className="h-3 w-3 mr-0.5" />
                              <span>
                                {(() => {
                                  // Format display names mapping
                                  const formatNames = {
                                    natural: "Natural",
                                    executive_summary: "Summary",
                                    detailed_analysis: "Analysis",
                                    strategic_recommendation: "Recommendation",
                                    comparative_analysis: "Comparison",
                                    market_insights: "Market",
                                    factual_brief: "Factual",
                                    technical_deep_dive: "Technical",
                                    auto_detect: "Auto-Detect",
                                  };
                                  return (
                                    formatNames[
                                      msg.response_format || "natural"
                                    ] || "Natural"
                                  );
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                        {msg.role === "assistant" && (
            <div className="ml-auto">
              <TextSizeControls 
                textSize={textSize} 
                setTextSize={setTextSize} 
              />
            </div>
          )}
                      </div>

                      {msg.role === "user" ? (
  <EditableMessage
    message={msg}
    messageIndex={index}
    onUpdate={handleMessageUpdate}
    messageVersions={messageVersions}
    currentVersionIndex={currentVersionIndex}
    onRestoreVersion={handleRestoreVersion}
    onOpenHistoryModal={() => {
      setActiveHistoryMessageIndex(index);
      setIsHistoryModalOpen(true);
    }}
  />
) : (
  // Use SimpleCitationManager for assistant messages with citations
  msg.citations && msg.citations.length > 0 ? (
    <div className={`message-content ${getTextSizeClass(textSize)}`}>
      <ImprovedCitationManager 
    content={msg.content} 
    citations={msg.citations || []} 
    textSizeClass={getTextSizeClass(textSize)}
  />
    </div>
  ) : (
    // Fallback to current HTML rendering for messages without citations
    <div
      className={`message-content ${getTextSizeClass(textSize)}`}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(
          // If the content has HTML list, paragraph, or formatting tags, process it as HTML
          msg.content.includes('<li>') || msg.content.includes('<p>') || msg.content.includes('<b>') 
            ? cleanAndFormatHTML(msg.content)  // Clean and format the HTML
            : marked.parse(msg.content)        // Otherwise parse as markdown
        )
          // Remove code block markers
          .replace(/```html/g, "")
          .replace(/```/g, "")
          .replace(/"""html/g, "")
          .replace(/"""/g, "")
          // Add proper spacing and styling
          .replace(/<p>/g, '<p class="mb-4">')
          .replace(/<b>/g, '<b class="font-bold">')
          .replace(/<strong>/g, '<strong class="font-bold">')
          .replace(
            /<h3>/g,
            '<h3 class="text-lg font-semibold mt-4 mb-2">'
          )
          .replace(
            /<ul>/g,
            '<ul class="list-disc pl-6 mb-4">'
          )
          .replace(
            /<ol>/g,
            '<ol class="list-decimal pl-6 mb-4">'
          )
          .replace(/<li>/g, '<li class="mb-2">')
          // Add proper styling for tables
          .replace(
            /<table>/g,
            '<table class="w-full border-collapse border border-gray-500 mt-4 mb-4">'
          )
          .replace(
            /<th>/g,
            '<th class="border border-gray-500 bg-gray-700 text-white p-2">'
          )
          .replace(
            /<td>/g,
            '<td class="border border-gray-500 p-2">'
          )
          // Ensure proper spacing for tables
          .replace(
            /<\/table>\s*<p>/g,
            '</table><p class="mt-4">'
          )
          // Convert markdown symbols to HTML
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
          .replace(/\*(.*?)\*/g, '<em>$1</em>') 
          // Link formatting
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>')
          // Code formatting
          .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">$1</code>')
          // Remove excess newlines
          .replace(/\n{3,}/g, "\n\n")
          // Ensure one line break after headers
          .replace(/<\/b>\s*\n+/g, "</b>\n")
          .replace(/<\/strong>\s*\n+/g, "</strong>\n"),
      }}
    />
  )
)}
 {(() => {
  const sources = msg.webSources || processWebSources(msg.sources_info, msg.extracted_urls);
  return sources && sources.length > 0 && propSelectedDocuments.length > 0;
})() && (
  <WebSourcesDisplay
    sources={msg.webSources || processWebSources(msg.sources_info, msg.extracted_urls)}
  />
)}

                      {/* Add Copy option for Klarifai messages only */}
                      {msg.role !== "user" && (
                        <div className="flex justify-end mt-4 dark:text-gray-400 text-[#8c715f] text-sm">
                          {/* Move Info icon and text to the left side */}
                          <div className="flex items-center mr-auto">
                            {msg.use_web_knowledge && (
                              <>
                                <Info className="h-3 w-3 mr-1" />
                                {msg.general_chat_mode ||
                                (msg.citations &&
                                  msg.citations.length === 0) ? (
                                  <span>
                                    This response includes information from web
                                    searches.
                                  </span>
                                ) : (
                                  <span>
                                    This response includes information from both
                                    your documents and general knowledge.
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* Right side - Response Regenerator and Copy button */}
                          <div className="flex items-center space-x-2 relative">
                            {/* Add Response Regenerator Component */}
                            <ResponseRegenerator
                              messageIndex={index}
                              message={msg}
                              conversation={conversation}
                              onRegenerateResponse={handleRegenerateResponse}
                              regeneratedResponses={regeneratedResponses}
                              currentResponseIndex={currentResponseIndex}
                              setCurrentResponseIndex={setCurrentResponseIndex}
                              displayRegeneratedResponse={
                                displayRegeneratedResponse
                              }
                              responseLength={responseLength}
                              responseFormat={responseFormat}
                              isLoading={isLoading}
                            />

                            {/* Copy button */}
                            <button
                              onClick={() =>
                                handleCopyMessage(msg.content, index)
                              }
                              className="flex items-center px-3 py-1 rounded-md dark:text-gray-400 text-[#602f1a] dark:hover:text-blue-400 dark:hover:bg-blue-900/20  hover:text-[#a55233] hover:bg-[#f5e6d8] active:scale-95 transition-all duration-150"
                            >
                              {copyMessageIndex === index ? (
                                <span className="text-green-400 ml-2">
                                  Copied!
                                </span>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 ml-1.5" />
                                  <span className="text-xs pl-2">Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))}

              {isLoading && (
                <div className="flex items-center justify-center py-4 dark:text-blue-400 text-[#1b7742]">
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  <span>Generating response...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
             {/* Delete Confirmation Modal */}
            <DeleteChatConfirmationModal
              isOpen={deleteModalOpen}
              onClose={() => {
                setDeleteModalOpen(false);
                setMessageToDelete(null);
              }}
              onConfirm={confirmDeleteMessage}
              messageIndex={messageToDelete}
            />
            {/* Add the Version History Modal */}
            {isHistoryModalOpen && activeHistoryMessageIndex !== null && (
              <MessageVersionHistory
                messageVersions={messageVersions} // Replace messageHistory
                messageIndex={activeHistoryMessageIndex}
                onRestoreVersion={handleRestoreVersion}
                conversation={conversation}
                onClose={() => {
                  setIsHistoryModalOpen(false);
                  setActiveHistoryMessageIndex(null);
                }}
              />
            )}
<div className="w-full fixed-bottom-0 z-20 pointer-events-none">
  <div
    className="w-full px-2 pb-2 bottom-20
        transition-all duration-300 ease-in-out
        transform ${isFollowUpQuestionsMinimized ? 'translate-y-full' : 'translate-y-0'}
        z-20
        pointer-events-auto
      "
  >
    {/* Follow-up questions container */}
    <div
      className="
          bg-[#f0eee5] dark:bg-gray-700/20 backdrop-blur-sm
          rounded-t-2xl 
          sm:rounded-t-3xl 
          shadow-lg
          overflow-hidden
          relative 
          border-t 
          border-[#e3d5c8] dark:border-blue-500/20
        "
    >
      <div className="flex justify-center">
        <button
          onClick={toggleFollowUpQuestions}
          className="text-[#5e4636] dark:text-white p-0.5 transition-colors relative group hover:text-[#a55233] dark:hover:text-[#f5e6d8]" 
          title={
            isFollowUpQuestionsMinimized
              ? "Show follow-up questions"
              : "Hide follow-up questions"
          }
        >
          {isFollowUpQuestionsMinimized ? (
            <>
              <ChevronUp className="h-4 w-4" />
              {/* Enhanced tooltip that appears on hover */}
              {currentFollowUpQuestions.length > 0 && (
                <div
                  className="
                    absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                    px-3 py-1 
                    bg-[#f5e6d8] dark:bg-gray-800/90 backdrop-blur-md 
                    text-[#5e4636] dark:text-white text-xs 
                    rounded-lg shadow-lg
                    border border-[#e3d5c8] dark:border-blue-500/20
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                    whitespace-nowrap
                    pointer-events-none
                    z-50
                  "
                >
                  <div className="flex items-center">
                    <Info className="h-3 w-3 mr-1.5 text-[#a55233] dark:text-blue-400" />
                    <span>
                      Expand to see{" "}
                      {currentFollowUpQuestions.length} follow-up
                      question
                      {currentFollowUpQuestions.length > 1
                        ? "s"
                        : ""}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 
                    bg-[#f5e6d8] dark:bg-gray-800/90 
                    border-r border-b border-[#e3d5c8] dark:border-blue-500/20"></div>
                </div>
              )}
            </>
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      {isFollowUpQuestionsMinimized &&
      currentFollowUpQuestions.length > 0 ? (
        <div className="text-xs text-center text-[#292928] dark:text-gray-400 py-1 animate-pulse">
          {currentFollowUpQuestions.length} follow-up question
          {currentFollowUpQuestions.length > 1 ? "s" : ""} available
        </div>
      ) : (
        !isFollowUpQuestionsMinimized &&
        currentFollowUpQuestions.length > 0 && (
          <div className="w-full px-2">
            <div className="flex gap-1 overflow-x-auto pb-1">
              {currentFollowUpQuestions.map((question, index) => (
                <Card
                  key={index}
                  onClick={() => {
                    const cleanedQuestion = question
                      .replace(/^(\d+\.\s*)/, "")
                      .trim();
                    setMessage(cleanedQuestion);
                  }}
                  className="flex-shrink-0 mt-1 py-1 px-2 text-xs
                    bg-[] dark:bg-gray-800/50
                    hover:bg-white dark:hover:bg-gray-700
                    text-[#0c393b] dark:text-white
                    border-[#e3d5c8] dark:border-blue-500/20
                    transition-all hover:-translate-y-0.5
                    cursor-pointer border rounded-lg"
                >
                  {question}
                </Card>
              ))}
            </div>
          </div>
        )
      )}
    </div>
    
    {/* Input Area */}
    <div className="bg-[#f0eee5] dark:bg-gray-700/20 backdrop-blur-sm rounded-b-2xl sm:rounded-b-3xl shadow-xl p-2 relative border-t border-[#e3d5c8] dark:border-blue-500/10">
      <div className="flex flex-col w-full">
        {/* Input field */}
        <div className="w-full relative bg-white dark:bg-gray-900/20 rounded-xl transition-colors overflow-hidden mb-2 border border-[#d6cbbf] dark:border-blue-500/20 focus-within:border-[#887d4e] dark:focus-within:border-blue-400/40 shadow-sm">
          {/* Textarea - Auto-resizing with reduced min-height */}
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              // Auto-resize logic
              e.target.style.height = "inherit";
              const scrollHeight = e.target.scrollHeight;
              const maxHeight = 100; // Reduced maximum height in pixels
              e.target.style.height = `${Math.min(
                scrollHeight,
                maxHeight
              )}px`;
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(message);
              }
            }}
            placeholder={
              propSelectedDocuments.length === 0
                ? "Ask me anything using web knowledge..."
                : useWebKnowledge
                ? "Ask me about your documents with web assistance..."
                : "Ask me about your documents..."
            }
            onFocus={handleTextareaFocus}
            className="w-full bg-transparent text-[#5e4636] dark:text-white font-medium py-2 px-3 text-sm focus:outline-none resize-none overflow-y-auto min-h-[36px] max-h-[100px] custom-scrollbar custom-textarea chat-input-area placeholder:text-[#8c715f]/80 placeholder:tracking-wider dark:placeholder:text-gray-400"
            disabled={isLoading}
            style={{ scrollbarWidth: "thin" }}
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept=".pdf,.docx,.txt,.pptx, .jpg, .jpeg, .bmp, .png, .mp3, .mp4, .wav, .mpeg"
          />
        </div>

        {/* Icons and buttons row below textarea - with reduced sizing */}
        <div className="flex items-center justify-between w-full">
          {/* Left-side actions */}
          <div className="flex items-center space-x-2">
            {hasUploadPermissions && (
              <button
                title="Upload documents"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#5a544a] dark:text-gray-400 hover:text-[#a55233] dark:hover:text-white transition-colors p-1 rounded-full"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            )}

            {/* Mic button with recording indicator */}
            {!message && (
              <button
                onClick={handleMicInput}
                className={`relative text-[#5a544a] dark:text-gray-400 transition-colors p-1 rounded-full ${
                  isRecording
                    ? "text-red-500 bg-red-500/10"
                    : "hover:text-[#a55233] dark:hover:text-white"
                }`}
                title="Voice input"
              >
                <Mic
                  className={`h-4 w-4 ${
                    isRecording ? "animate-pulse" : ""
                  }`}
                />

                {isRecording && (
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            )}

            {/* View toggle button */}
            <button
              title={
                currentView === "chat"
                  ? "View Summary"
                  : "View Chat"
              }
              onClick={() =>
                toggleView(
                  currentView === "chat" ? "summary" : "chat"
                )
              }
              className="text-[#5a544a] dark:text-gray-400 hover:text-[#a55233] dark:hover:text-white transition-colors p-1 rounded-full"
            >
              {currentView === "chat" ? (
                <ScrollText className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </button>
            
            {/* Context/Web knowledge toggle */}
            {propSelectedDocuments.length > 0 ? (
              <button
                onClick={toggleWebKnowledge}
                title={
                  useWebKnowledge
                    ? "Answers from documents and web knowledge"
                    : "Answers from documents only"
                }
                className={`
                  flex items-center justify-center gap-1
                  px-2 py-1
                  rounded-lg 
                  transition-all 
                  duration-300
                  text-xs
                  ${
                    useWebKnowledge
                      ? "bg-[#caeaf9] dark:bg-gradient-to-r dark:from-purple-600/70 dark:to-blue-500/70  dark:text-white shadow-sm"
                      : "appearance-none bg-white/80 dark:bg-gray-900 text-[#381c0f] dark:text-gray-300 dark:hover:bg-gray-800/90 hover:bg-[#ddd9c5]/10 border-[#d6cbbf] dark:border-blue-500/20 border shadow-sm"
                  }
                `}
              >
                {useWebKnowledge ? (
                  <>
                    <Globe className="h-3 w-3" />
                    <span className="hidden sm:inline text-xs">
                      Web
                    </span>
                  </>
                ) : (
                  <>
                    <Database className="h-3 w-3  dark:text-blue-400" />
                    <span className="hidden sm:inline text-xs">
                      Context-only
                    </span>
                  </>
                )}
              </button>
            ) : (
              // When no documents are selected, show a disabled/locked web mode button
              <button
                title="Web mode active (no documents selected)"
                className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg appearance-none bg-[#caeaf9] dark:bg-gray-900/80 text-[#5a544a] dark:text-gray-300 border border-[#d6cbbf] dark:border-blue-500/20 text-xs cursor-default shadow-sm"
                disabled
              >
                <Globe className="h-3 w-3  dark:text-blue-400" />
                <span className="hidden sm:inline text-xs">
                  Web
                </span>
              </button>
            )}

            {/* Response Length Toggle */}
            <ResponseLengthToggle
              responseLength={responseLength}
              setResponseLength={setResponseLength}
              className="bg-white/80 dark:bg-gray-900/10 text-[#5e4636] dark:text-gray-300 hover:bg-[#f5e6d8] dark:hover:bg-gray-800/90 border-[#d6cbbf] dark:border-blue-500/20 border shadow-sm"
              activeClassName="bg-[#556052] dark:bg-gradient-to-r dark:from-purple-600/70 dark:to-blue-500/70 text-white dark:text-white border-transparent shadow-sm"
            />

            {/* Response Format Toggle */}
            <ResponseFormatToggle
              responseFormat={responseFormat}
              setResponseFormat={setResponseFormat}
              className="bg-white/80 dark:bg-gray-900/10 text-[#5e4636] dark:text-gray-300 hover:bg-[#f5e6d8] dark:hover:bg-gray-800/90 border-[#d6cbbf] dark:border-blue-500/20 border shadow-sm"
              activeClassName="bg-[#556052] dark:bg-gradient-to-r dark:from-purple-600/70 dark:to-blue-500/70 text-white dark:text-white border-transparent shadow-sm"
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => handleSendMessage(message)}
            disabled={isLoading}
            className="bg-[#a55233] hover:bg-[#884325] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 dark:hover:from-blue-500/80 dark:hover:to-emerald-500/70 text-white p-2 rounded-lg transition-all disabled:opacity-50 disabled:bg-[#d6cbbf] disabled:dark:bg-gray-600 shadow-sm"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
          </div>
        ) : (
          renderSummaryView()
        )}
      </div>
      {/* Document Processing Loader - Add this at the top level */}
      {isDocumentProcessing && (
      <DocumentProcessingLoader
          documents={filteredProcessingDocuments}
          queuedFilenames={currentUploadFilenames}
          showLoader={isDocumentProcessing}
          onComplete={() => {
            setIsDocumentProcessing(false);
            setProcessingDocuments([]);
            setCurrentUploadFilenames([]);
          }}
          onCancel={() => {
            setIsDocumentProcessing(false);
            setProcessingDocuments([]);
            setCurrentUploadFilenames([]);
            toast.info("Document processing cancelled");
          }}
        />
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
      @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.15s ease-out forwards;
  }
  
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
  
                .animate-bounce {
                  animation: bounce 1s ease-in-out;
                }
  
                @keyframes pulse {
                  0% { transform: scale(1); }
                  50% { transform: scale(1.05); }
                  100% { transform: scale(1); }
                }
  
                .animate-pulse {
                  animation: pulse 1.5s ease-in-out infinite;
                }
              .custom-tooltip {
                background-color: #1f2937 !important; /* dark gray background */
                color: #ffffff !important;
                padding: 12px !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
                max-width: 300px !important;
                width: 300px !important;
                z-index: 1000 !important;
                animation: fadeIn 0.3s ease-out !important;
              }
              @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    
              
              .animate-fade-in {
                animation: fadeIn 0.3s ease-out;
              }
              
              .citation-inline-wrapper {
                position: relative;
                display: inline-block;
              }
              
              .citation-tooltip {
                display: none;
              }
  
              .citation-inline-wrapper:hover .citation-tooltip {
                display: block;
              }
              .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(16, 185, 129, 0.1);
                  border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(16, 185, 129, 0.2);
                  border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                   background: rgba(16, 185, 129, 0.3);
              }
              .group:hover .opacity-0 {
                opacity: 1;
              }
  
              .transition-opacity {
                transition: opacity 0.2s ease-in-out;
              }
  
  
           .web-knowledge-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: 9999px;
      padding: 0.25rem 0.5rem;
      font-size: 0.65rem;
      color: #a5b4fc;
      background-color: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      margin-left: 0.5rem;
    }
  
            .web-knowledge-badge svg {
              margin-right: 0.25rem;
            }
  
            .mode-toggle-btn::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              
              transition: all 0.6s ease;
            }
  
            .mode-toggle-btn:hover::before {
              left: 100%;
            }

            .web-mode-active {
  background: linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%);
  border: 1px solid rgba(79, 70, 229, 0.3);
}

.web-mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  background: linear-gradient(90deg, rgba(79, 70, 229, 0.7) 0%, rgba(56, 189, 248, 0.7) 100%);
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-left: 0.5rem;
  transition: all 0.3s ease;
}

.web-mode-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

/* Add a subtle indicator in the chat container when web mode is active */
.web-mode-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(79, 70, 229, 0.7) 0%, rgba(56, 189, 248, 0.7) 100%);
  z-index: 10;
}

/* Web mode animation effects */
@keyframes webModeGlow {
  0% {
    box-shadow: 0 0 5px rgba(79, 70, 229, 0.5);
  }
  50% {
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.7);
  }
  100% {
    box-shadow: 0 0 5px rgba(79, 70, 229, 0.5);
  }
}

/* Dark mode scrollbar variant */
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 58, 62, 0.3);  /* Darker blue-green that matches dark mode theme */
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(85, 96, 82, 0.4);  /* Sage green with higher opacity for better visibility */
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(85, 96, 82, 0.6);  /* Brighter on hover for better interaction feedback */
}

.web-mode-effect {
  animation: webModeGlow 2s infinite;
}

/* Add this to style the web mode welcome message */
.web-mode-welcome {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%);
  border: 1px solid rgba(79, 70, 229, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
}

.web-mode-welcome h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 0.5rem;
}

.web-mode-welcome p {
  font-size: 0.875rem;
  color: #cbd5e0;
}
  
            
          `}</style>
    </div>
  );
};

MainContent.propTypes = {
  mainProjectId: PropTypes.string.isRequired,
  selectedChat: PropTypes.shape({
    conversation_id: PropTypes.string,
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string,
        content: PropTypes.string,
        citations: PropTypes.array,
      })
    ),
    summary: PropTypes.string,
    follow_up_questions: PropTypes.arrayOf(PropTypes.string),
    // conversation_id: PropTypes.string,
    selected_documents: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    ),
  }),
  
  

  sources: PropTypes.arrayOf(PropTypes.string),
  summary: PropTypes.string,
  followUpQuestions: PropTypes.array,
  isSummaryPopupOpen: PropTypes.bool.isRequired,
  onCloseSummary: PropTypes.func.isRequired,
  setSummary: PropTypes.func.isRequired,
  setFollowUpQuestions: PropTypes.func.isRequired,
  setIsSummaryPopupOpen: PropTypes.func.isRequired,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string),
  setSelectedDocuments: PropTypes.func,
  updateSelectedDocuments: PropTypes.func,
  isDocumentProcessing: PropTypes.bool,
  processingProgress: PropTypes.number,
};

export default MainContent;