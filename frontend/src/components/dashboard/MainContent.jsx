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
  Edit,
  Layers,
  Mic,
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

import {
  SummaryGenerationLoader,
  SummaryFormatter,
  summaryStyles,
} from "./EnhancedSummaryFormatter";

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
    useState(false);
  const chatContainerRef = useRef(null);
  const [localSelectedDocuments, setLocalSelectedDocuments] = useState(
    propSelectedDocuments || [] // Initialize with prop value if provided
  );

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
  const [activeDocumentForSummary, setActiveDocumentForSummary] =
    useState(null);

  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);

  // Add this to the state declarations at the top of the component:
  const [consolidatedSummary, setConsolidatedSummary] = useState("");
  const [isConsolidatedView, setIsConsolidatedView] = useState(false);
  const [isConsolidatedSummaryLoading, setIsConsolidatedSummaryLoading] =
    useState(false);

  // Add this state variable inside MainContent component
  const [useWebKnowledge, setUseWebKnowledge] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Add a new Citation component for inline citations
  const recognitionRef = useRef(null);

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

  // const WebSearchToggle = ({ useWebKnowledge }) => {
  //  // Only render the indicator when web knowledge is enabled
  //   if (!useWebKnowledge) return null;
    
  //   return (
  //     <div className="web-knowledge-indicator fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fadeIn">
  //       <div className="flex items-center gap-2 bg-blue-900/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-blue-300 text-xs border border-blue-500/20">
  //         <Globe className="h-3 w-3" />
  //         <span>Web search enabled</span>
  //       </div>
  //     </div>
  //   );
  // };

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
    if (view === "summary" && localSelectedDocuments.length === 0) {
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
    setUseWebKnowledge(prev => !prev);
    // Show a toast to confirm the mode change
    toast.info(`Mode switched to ${!useWebKnowledge ? 'Web-Enhanced' : 'Document-Only'}`);
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
    if (!localSelectedDocuments.length) {
      toast.warning("Please select documents to generate summary");
      return;
    }

    setIsSummaryGenerating(true);
    try {
      const response = await documentService.generateSummary(
        localSelectedDocuments,
        mainProjectId
      );

      if (response.data.summaries) {
        // Combine all summaries
        const combinedSummary = response.data.summaries
          .map((summary) => {
            return `<h3 class="text-lg font-bold mb-2">${summary.filename}</h3>${summary.summary}`;
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

  const renderSummaryView = () => {
    // If no documents are selected, show a placeholder
    if (!localSelectedDocuments || localSelectedDocuments.length === 0) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <p className="mb-4">No documents selected</p>
          <button
            onClick={() => toggleView("chat")}
            className="px-4 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors text-white"
          >
            <MessageCircle className="inline-block mr-2 h-4 w-4" />
            Return to Chat
          </button>
          {isConsolidatedSummaryLoading && <ConsolidatedSummaryLoader />}
        </div>
      );
    }

    // Get the currently active document for summary view
    const currentDocId = activeDocumentForSummary || localSelectedDocuments[0];
    const currentDocument = documents.find(
      (doc) => doc.id.toString() === currentDocId
    );

    // Check if all selected documents have summaries
    const selectedDocs = documents.filter((doc) =>
      localSelectedDocuments.includes(doc.id.toString())
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
          ...localSelectedDocuments.filter((id) => id !== newDocId),
        ];
        setLocalSelectedDocuments(updatedDocs);

        if (setSelectedDocuments) {
          setSelectedDocuments(updatedDocs);
        }
      }
    };

    return (
      <div className="absolute inset-0 pt-16 backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out ">
        {/* View Toggle at the top */}
        <div className="fixed left-0 right-0 flex justify-center z-50 top-4">
          <div className="flex items-center space-x-2 bg-gray-800/50 rounded-full p-1 backdrop-blur-md shadow-lg">
            <button
              title="Chat View"
              onClick={() => toggleView("chat")}
              className={`
              px-3 py-1.5 rounded-full text-xs transition-all duration-300
              ${
                currentView === "chat"
                  ? "bg-gradient-to-r from-blue-600/70 to-green-500/70 text-white"
                  : "text-gray-300 hover:bg-gray-700/50"
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
                  ? "bg-gradient-to-r from-blue-600/70 to-green-500/70 text-white"
                  : "text-gray-300 hover:bg-gray-700/50"
              }
            `}
            >
              <ScrollText className="inline-block mr-1.5 h-3 w-3" />
              Summary
            </button>
          </div>
        </div>
        <div className="h-full w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="h-full flex flex-col bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 border border-blue-500/20 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-2 bg-gradient-to-r from-gray-800/30 to-blue-900/20 border-b border-blue-500/10 flex justify-between items-center">
              <div>
                <h2 className="text-sm sm:text-xl font-bold text-white">
                  {isConsolidatedView
                    ? "Consolidated Document Summary"
                    : "Document Summary"}
                </h2>
                {currentDocument && !isConsolidatedView && (
                  <p className="text-sm text-blue-400 mt-1">
                    File: {currentDocument.filename}
                  </p>
                )}

                {isConsolidatedView && (
                  <ConsolidatedViewBadge
                    documentCount={localSelectedDocuments.length}
                  />
                )}
              </div>

              <div className="flex items-center space-x-3">
                {/* Enhanced Document Selector */}
                {localSelectedDocuments.length > 0 && (
                  <DocumentSelector
                    documents={documents}
                    selectedDocuments={localSelectedDocuments}
                    activeDocumentId={activeDocumentForSummary}
                    isConsolidatedView={isConsolidatedView}
                    onDocumentChange={handleDocumentChange}
                    onConsolidatedView={handleGenerateConsolidatedSummary}
                    isConsolidatedSummaryLoading={isConsolidatedSummaryLoading}
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
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600"
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
                  className="text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-blue-500/20"
                  title="Copy Summary"
                >
                  <Copy className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>
            </div>

            {/* Summary Content */}
            {/* Summary Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900/80 p-4">
              {isConsolidatedView && !consolidatedSummary ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Layers className="h-16 w-16 mb-4 text-gray-600" />
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
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ScrollText className="h-16 w-16 mb-4 text-gray-600" />
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
      setConversation(
        [...chatMessages].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        )
      );

      // Set conversation ID
      setConversationId(selectedChat.conversation_id);

      // Set summary state
      if (selectedChat.summary) {
        setSummary(selectedChat.summary);
        setPersistentSummary(selectedChat.summary); // Add this line
      }

      // Handle documents
      if (selectedChat.selected_documents?.length > 0) {
        const documentIds = selectedChat.selected_documents.map((doc) =>
          typeof doc === "object" ? doc.id.toString() : doc.toString()
        );
        setLocalSelectedDocuments(documentIds);
        setActiveDocumentForSummary(documentIds[0]);

        // Important: Also update the parent's selectedDocuments
        if (setSelectedDocuments) {
          setSelectedDocuments(documentIds);
        }
      }

      // Handle follow-up questions - Modified this part
      const followUps = selectedChat.follow_up_questions || [];
      if (followUps.length > 0) {
        console.log("Setting follow-up questions:", followUps);
        setCurrentFollowUpQuestions(followUps);
        setFollowUpQuestions(followUps);
        setIsFollowUpQuestionsMinimized(false); // Make sure they're visible
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
      setLocalSelectedDocuments(propSelectedDocuments);
    }
  }, [propSelectedDocuments]);

  useEffect(() => {
    // When local state changes, update the prop
    if (setSelectedDocuments) {
      setSelectedDocuments(localSelectedDocuments);
    }
  }, [localSelectedDocuments, setSelectedDocuments]);

  // 4. Add method to generate consolidated summary
  const handleGenerateConsolidatedSummary = async () => {
    if (localSelectedDocuments.length <= 1) {
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
        localSelectedDocuments,
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
    const selectedFiles = Array.from(event.target.files);
    if (!selectedFiles.length) return;

    setIsDocumentProcessing(true);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("main_project_id", mainProjectId);

      const simulateProgress = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev < 90) {
            return prev + Math.random() * 10;
          }
          clearInterval(simulateProgress);
          return 90;
        });
      }, 500);

      const response = await documentService.uploadDocument(
        formData,
        mainProjectId,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProcessingProgress(Math.min(percentCompleted, 90));
          },
        }
      );

      clearInterval(simulateProgress);

      const documents = response.data.documents || [];

      if (documents.length > 0) {
        // Automatically select all uploaded documents
        const newSelectedDocuments = documents.map((doc) => doc.id.toString());
        setLocalSelectedDocuments(newSelectedDocuments);

        if (setSelectedDocuments) {
          setSelectedDocuments(newSelectedDocuments);
        }

        setCurrentView("chat");
        setProcessingProgress(100);

        // Update documents list
        setDocuments((prevDocs) => {
          const newDocs = documents.filter(
            (newDoc) =>
              !prevDocs.some((existingDoc) => existingDoc.id === newDoc.id)
          );
          return [...prevDocs, ...newDocs];
        });

        toast.success(
          `${documents.length} document(s) uploaded successfully! Click "Generate Summary" to analyze the content.`
        );
      }
    } catch (error) {
      console.error("Upload Error:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsDocumentProcessing(false);
    }
  };
  // Add a processing loader component
  const DocumentProcessingLoader = ({ progress }) => {
    const safeProgress =
      typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : 0;
    return (
      <div
        className="
        fixed 
        inset-0 
        z-[1000] 
        bg-black/80 
        backdrop-blur-sm 
        flex 
        flex-col 
        items-center 
        justify-center 
        space-y-6
      "
      >
        <div
          className="
          w-64 
          h-2 
          bg-gray-700 
          rounded-full 
          overflow-hidden
        "
        >
          <div
            className="
            h-full 
            bg-gradient-to-r 
            from-blue-500 
            to-green-500 
            transition-all 
            duration-300 
            ease-out
          "
            style={{ width: `${safeProgress}%` }}
          />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            Processing Document
          </h2>
          <p className="text-gray-300">Analyzing and extracting insights...</p>
          <p className="text-sm text-gray-400 mt-2">
            {/* Use optional chaining and fallback */}
            {typeof safeProgress === "number"
              ? `${safeProgress.toFixed(0)}% complete`
              : "0% complete"}
          </p>
        </div>

        <div className="animate-pulse">
          <ScrollText
            className="
            h-16 
            w-16 
            text-blue-400 
            opacity-70
          "
          />
        </div>
      </div>
    );
  };

  // Comprehensive PropTypes validation
  DocumentProcessingLoader.propTypes = {
    progress: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      .isRequired,
  };

  // Default props to prevent errors
  DocumentProcessingLoader.defaultProps = {
    progress: 0,
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    // Check if any documents are selected
    // if (!localSelectedDocuments || localSelectedDocuments.length === 0) {
    //   toast.warning("Please select at least one document for your query.");
    //   return;
    // }

    // Add user message to conversation
    const newConversation = [
      ...conversation,
      { role: "user", content: message },
    ];
    setConversation(newConversation);
    setMessage(""); // <== CLEAR INPUT FIELD HERE
    setIsLoading(true);

    try {
      // Prepare request data
      const messageData = {
        message,
        conversation_id: conversationId,
        selected_documents: localSelectedDocuments,
        mainProjectId: mainProjectId,
        messages: newConversation, // Include the full conversation history
        use_web_knowledge: useWebKnowledge, // Include the mode flag
      };

      console.log("Sending message with data:", messageData);

      const response = await chatService.sendMessage(messageData);

      if (response && response.data) {
        const assistantMessage = {
          role: "assistant",
          content: response.data.response || response.data.content,
          citations: response.data.citations || [],
          follow_up_questions: response.data.follow_up_questions || [],
          use_web_knowledge: response.data.use_web_knowledge || false, // Store the mode used for this message
        };

        // Update conversation with the new assistant message
        const updatedConversation = [...newConversation, assistantMessage];
        setConversation(updatedConversation);
        setMessage("");

        // Update follow-up questions if available
        if (response.data.follow_up_questions) {
          setCurrentFollowUpQuestions(response.data.follow_up_questions);
          setFollowUpQuestions(response.data.follow_up_questions);
        }
        // Ensure conversation_id is set for the entire chat session
        if (!conversationId && response.data.conversation_id) {
          setConversationId(response.data.conversation_id);
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error("Failed to send message. Please try again.");
      // Remove the user message on error
      setConversation((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
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

  // Add this method to handle message updates
  const handleMessageUpdate = async (messageIndex, newContent) => {
    if (newContent === conversation[messageIndex].content) {
      setEditingMessageId(null);
      return;
    }

    setIsLoading(true);

    try {
      // Store the original message and its response if not already stored
      if (!messageHistory[messageIndex]) {
        const originalMessage = conversation[messageIndex];
        const originalResponse = conversation[messageIndex + 1];
        const subsequentMessages = conversation.slice(messageIndex + 2);
        storeMessageHistory(
          messageIndex,
          originalMessage.content,
          originalResponse,
          subsequentMessages
        );
      }

      // Create a new conversation array up to the edited message
      const conversationUpToEdit = conversation.slice(0, messageIndex + 1);

      // Update the edited message
      const updatedMessage = {
        ...conversationUpToEdit[messageIndex],
        content: newContent,
        edited: true,
        editedAt: new Date().toISOString(),
      };

      conversationUpToEdit[messageIndex] = updatedMessage;

      // Update conversation state immediately for better UX
      setConversation(conversationUpToEdit);

      // Prepare request data for the API
      const requestData = {
        message: newContent,
        conversation_id: conversationId,
        selected_documents: localSelectedDocuments,
        context: conversationUpToEdit,
      };

      const response = await chatService.sendMessage(requestData);

      // Add the new assistant response
      const assistantMessage = {
        role: "assistant",
        content: response.response || "No response received",
        citations: response.citations || [],
        follow_up_questions: response.follow_up_questions || [],
      };

      const finalConversation = [...conversationUpToEdit, assistantMessage];

      setConversation(finalConversation);
      setEditingMessageId(null);

      // Update follow-up questions if available
      if (response.follow_up_questions?.length > 0) {
        setCurrentFollowUpQuestions(response.follow_up_questions);
        setFollowUpQuestions(response.follow_up_questions);
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
  // Add this method to your component
  const storeMessageHistory = (
    messageIndex,
    originalMessage,
    originalResponse,
    subsequentMessages
  ) => {
    setMessageHistory((prev) => ({
      ...prev,
      [messageIndex]: {
        message: originalMessage,
        response: originalResponse,
        subsequentMessages: subsequentMessages,
      },
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
        {/* Conditional rendering of the WebSearchToggle only when documents are selected
    {localSelectedDocuments.length > 0 && (
      <WebSearchToggle 
        useWebKnowledge={useWebKnowledge} 
        toggleWebKnowledge={toggleWebKnowledge} 
      />
    )} */}
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
                        ${
                          !isFollowUpQuestionsMinimized ? "pb-[150px]" : "pb-4"
                        }`}
            >
              {/* Rest of the chat messages rendering code */}
              {conversation.map((msg, index) => (
                <React.Fragment key={index}>
                  <div
                    className={`flex ${
                      msg.role === "user"
                        ? "justify-end mt-16"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`
                        p-4
                        rounded-lg
                        backdrop-blur-md
                        border
                        shadow-lg
                        ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-blue-600/30 to-emerald-600/30 text-white max-w-[70%] border-emerald-500/20"
                            : "bg-gray-900 text-gray-300 max-w-full border-blue-500/20"
                        }
                        transition-all
                        duration-300
                        hover:shadow-xl
                        hover:border-opacity-50
                      `}
                    >
                      <div className="flex items-center mb-2">
                        {msg.role === "user" ? (
                          <User className="mr-2 h-5 w-5" />
                        ) : (
                         <img src={BotIcon} alt="Klarifai" className="mr-2 h-5 w-5" />
                        )}
                        <span className="font-bold">
                          {msg.role === "user" ? "You" : "Klarifai"}
                        </span>
                        
                        {/* Add web knowledge mode indicator */}
                        {msg.role === "assistant" && msg.use_web_knowledge && (
                          <div className="ml-2 web-knowledge-badge">
                            <span className="web-knowledge-badge-pulse"></span>
                            <Globe className="h-3 w-3" />
                            <span>Web-Enhanced</span>
                          </div>
                        )}
                      </div>
                      
                      <div
                        className="message-content"
                        dangerouslySetInnerHTML={{
                          __html: msg.content
                            .replace(/<p>/g, '<p class="mb-4">')
                            .replace(/<b>/g, '<b class="block mb-2 mt-2">')
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
                            // Remove excess newlines
                            .replace(/\n{3,}/g, "\n\n")
                            // Ensure one line break after headers
                            .replace(/<\/b>\s*\n+/g, "</b>\n"),
                        }}
                      />

                      {/* Add Copy option for Klarifai messages only */}
                      {msg.role !== "user" && (
  <div className="flex justify-end mt-4 text-gray-400 text-sm">
    {/* Move Info icon and text to the left side */}
    <div className="flex items-center mr-auto">
      {msg.use_web_knowledge && (
        <>
          <Info className="h-3 w-3 mr-1" />
          <span>This response includes information from both your documents and general knowledge.</span>
        </>
      )}
    </div>

    {/* Copy button remains on the right side */}
    <button
      onClick={() => handleCopyMessage(msg.content, index)}
      className="flex items-center px-3 py-1 rounded hover:text-blue-400 hover:bg-blue-900/30 active:scale-95 transition-all duration-150"
    >
      {copyMessageIndex === index ? (
        <span className="text-green-400 ml-2">Copied!</span>
      ) : (
        <>
          <Copy className="h-4 w-4 ml-2" /> Copy
        </>
      )}
    </button>
  </div>
)}
                    </div>
                  </div>
                </React.Fragment>
              ))}

              {isLoading && (
                <div className="text-center text-white">
                  Generating response...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
{/* Follow-up Questions and Input Area */}
<div className="w-full fixed-bottom-0 z-20 pointer-events-none">
  <div
    className="w-full px-2 pb-2 bottom-20
      transition-all duration-300 ease-in-out
      transform ${isFollowUpQuestionsMinimized ? 'translate-y-full' : 'translate-y-0'}
      z-20
      pointer-events-auto
    "
  >
    <div
      className="
        bg-gradient-to-b 
        from-gray-900/80 
        via-gray-800/80 
        to-gray-900/80
        backdrop-blur-xl 
        rounded-t-2xl 
        sm:rounded-t-3xl 
        shadow-2xl 
        overflow-hidden
        relative 
        border-t 
        border-blue-500/20
      "
    >
      <div className="flex justify-center">
        <button
          onClick={toggleFollowUpQuestions}
          className="text-white p-0.5 transition-colors"
        >
          {isFollowUpQuestionsMinimized ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>
      {!isFollowUpQuestionsMinimized &&
        currentFollowUpQuestions.length > 0 && (
        <div className="w-full px-2">
          <div className="flex gap-1 overflow-x-auto">
            {currentFollowUpQuestions.map((question, index) => (
              <Card
                key={index}
                onClick={() => {
                  // Remove numbering like "1. ", "2. ", etc. at the start of the question
                  const cleanedQuestion = question
                    .replace(/^(\d+\.\s*)/, "")
                    .trim();
                  setMessage(cleanedQuestion); // Only sets the message, doesn't send
                }}
                className="flex-shrink-0 mt-1 py-1 px-2 text-xs"
              >
                {question}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
    {/* Input Area */}
    <div className="bg-gray-900/90 backdrop-blur-xl rounded-b-2xl sm:rounded-b-3xl shadow-2xl p-2 relative border-t border-blue-500/10">
      <div className="flex flex-col w-full">
        {/* Input field */}
        <div className="w-full relative bg-gray-900/90 rounded-xl transition-colors overflow-hidden mb-2">
          {/* Textarea - Auto-resizing with reduced min-height */}
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              // Auto-resize logic
              e.target.style.height = "inherit";
              const scrollHeight = e.target.scrollHeight;
              const maxHeight = 100; // Reduced maximum height in pixels
              e.target.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(message);
              }
            }}
            placeholder={`${localSelectedDocuments.length === 0 
              ? "Ask me anything..." 
              : "Ask a question about your documents..."}`}
            className="w-full bg-transparent text-white py-2 px-3 text-sm focus:outline-none resize-none overflow-y-auto min-h-[36px] max-h-[100px] custom-scrollbar custom-textarea"
            disabled={isLoading}
            style={{ scrollbarWidth: "thin" }}
          />
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
            accept=".pdf,.docx,.txt,.pptx"
          />
        </div>
        
        {/* Icons and buttons row below textarea - with reduced sizing */}
        <div className="flex items-center justify-between w-full">
          {/* Left-side actions */}
          <div className="flex items-center space-x-2">
            <button
              title="Upload documents"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            
            {/* Mic button with recording indicator */}
            {!message && (
              <button
                onClick={handleMicInput}
                className={`text-gray-400 transition-colors p-1 rounded-full ${
                  isRecording ? "text-red-500 bg-red-500/10" : "hover:text-white"
                }`}
                title="Voice input"
              >
                <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`} />
                {isRecording && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            )}

             {/* View toggle button */}
             <button
              title={currentView === "chat" ? "View Summary" : "View Chat"}
              onClick={() => toggleView(currentView === "chat" ? "summary" : "chat")}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full"
            >
              {currentView === "chat" ? (
                <ScrollText className="h-4 w-4" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </button>
            
            {/* Context/Web knowledge toggle - reduced size */}
            {localSelectedDocuments.length > 0 && (
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
                  ${useWebKnowledge
                    ? "bg-gradient-to-r from-purple-600/70 to-blue-500/70 text-white"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"}
                `}
              >
                {useWebKnowledge ? (
                  <>
                    <Globe className="h-3 w-3" />
                    <span className="hidden sm:inline text-xs">Web</span>
                  </>
                ) : (
                  <>
                    <Database className="h-3 w-3" />
                    <span className="hidden sm:inline text-xs">Context-only</span>
                  </>
                )}
              </button>
            )}
            
           
          </div>
          
          {/* Send button - reduced size */}
          <button
            onClick={() => handleSendMessage(message)}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600/90 to-emerald-600/80 hover:from-blue-500/80 hover:to-emerald-500/70 text-white p-2 rounded-lg transition-all disabled:opacity-50"
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
        <DocumentProcessingLoader progress={processingProgress} />
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`

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
