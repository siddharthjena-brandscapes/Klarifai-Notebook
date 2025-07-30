import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
// import { Menu, ChevronRight, ChevronLeft, X, Brain } from 'lucide-react';
import Header from "../dashboard/Header";
import MainChat from "./MainChat";
import backgroundImage from "../../assets/bg-main.jpg";
import FaqButton from "../../components/faq/FaqButton";
import { ThemeContext } from "../../context/ThemeContext";
import SideTab from "./SideTab";
import YouTubeUploadModal from "../klarifai_notebook/YouTubeUploadModal";
import NoteEditorModal from "../klarifai_notebook/NoteEditorModal";
import NotePad from "../klarifai_notebook/NotePad";
import NoteViewerModal from "../klarifai_notebook/NoteViewerModal";
import ConfirmationModal from "../klarifai_notebook/ConfirmationModal";
import MindMapViewer from "../klarifai_notebook/MindMapViewer";
import RightPanel from "./RightPanel";
import MindMapHistory from "../klarifai_notebook/MindMapHistory";
import BrainLoadingAnimation from "../klarifai_notebook/BrainLoadingAnimation";
import { toast } from "react-toastify";
// import DocumentSelectionModal from "../klarifai_notebook/DocumentSelectionModal";

const MainDashboard = () => {
  const { mainProjectId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [summary, setSummary] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [isSummaryPopupOpen, setIsSummaryPopupOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [chatInputFocused, setChatInputFocused] = useState(false);
  const { theme } = useContext(ThemeContext);
  const [forceResetKey, setForceResetKey] = useState(0);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);

  // Replace isNotePadOpen with isRightPanelOpen
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isNoteEditorModalOpen, setIsNoteEditorModalOpen] = useState(false);
  const [isNoteViewerModalOpen, setIsNoteViewerModalOpen] = useState(false);
  const [modalViewerNoteData, setModalViewerNoteData] = useState(null);

  // Mindmap states
  const [isMindmapGenerating, setIsMindmapGenerating] = useState(false);
  const [isMindmapViewerOpen, setIsMindmapViewerOpen] = useState(false);
  const [mindmapData, setMindmapData] = useState(null);
  const [currentMindmapId, setCurrentMindmapId] = useState(null);
  const mainChatRef = useRef(null);

  const [showMindmapViewer, setShowMindmapViewer] = useState(false);
  const [currentMindmapData, setCurrentMindmapData] = useState(null);
  const [mindmapStats, setMindmapStats] = useState(null);
  const [showMindmapHistory, setShowMindmapHistory] = useState(false);

  // NEW: Document session tracking states
  const [documentSessions, setDocumentSessions] = useState(new Map());
  const [currentDocumentSet, setCurrentDocumentSet] = useState([]);
  const [lastDocumentSignature, setLastDocumentSignature] = useState("");

  // const [isDocumentSelectionModalOpen, setIsDocumentSelectionModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);

  const [message, setMessage] = useState("");
  const [pastedImages, setPastedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [hasImages, setHasImages] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const allowedExtensions = [".pdf", ".docx", ".txt", ".mp3", ".mp4"];

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    // Check upload permission from MainChat
    if (
      mainChatRef.current &&
      mainChatRef.current.hasUploadPermissions === false
    ) {
      toast.warn("You do not have permission to upload documents.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return;
    }

    let files = Array.from(e.dataTransfer.files);

    // Filter files by allowed extensions
    const validFiles = files.filter((file) => {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      return allowedExtensions.includes(ext);
    });

    if (
      validFiles.length > 0 &&
      mainChatRef.current &&
      mainChatRef.current.handleFileChange
    ) {
      mainChatRef.current.handleFileChange({ target: { files: validFiles } });
    }

    // Show toast if all dropped files are invalid
    if (files.length > 0 && validFiles.length === 0) {
      toast.warn("Only .pdf, .docx, .txt, .mp3, .mp4 files are allowed.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    }
  };

  // NEW: Helper function to create document signature
  const createDocumentSignature = useCallback((documentIds) => {
    if (!documentIds || documentIds.length === 0) return "web_mode";
    return documentIds.sort().join(",");
  }, []);

  // NEW: Function to check if we need a new chat session
  const shouldCreateNewChatSession = useCallback(
    (newDocuments) => {
      const newSignature = createDocumentSignature(newDocuments);
      const currentSignature = createDocumentSignature(currentDocumentSet);

      console.log("🔍 Session Check:", {
        newSignature,
        currentSignature,
        needsNewSession: newSignature !== currentSignature,
      });

      return newSignature !== currentSignature;
    },
    [createDocumentSignature, currentDocumentSet]
  );

  // NEW: Function to handle document context changes
  const handleDocumentContextChange = useCallback(
    (newDocuments, source = "unknown") => {
      console.log(`📋 Document context change from ${source}:`, {
        previous: currentDocumentSet,
        new: newDocuments,
        source,
      });

      const newSignature = createDocumentSignature(newDocuments);

      // FIXED: Don't reset chat session for chat selections
      if (source === "chat_selection") {
        console.log(
          "📄 Chat selection context change - updating documents without session reset"
        );
        setCurrentDocumentSet(newDocuments);
        setSelectedDocuments(newDocuments);
        setLastDocumentSignature(newSignature);
        return;
      }

      if (shouldCreateNewChatSession(newDocuments)) {
        console.log(
          "🔄 Creating new chat session for document set:",
          newSignature
        );

        // Save current session if it exists
        if (selectedChat && currentDocumentSet.length > 0) {
          const currentSignature = createDocumentSignature(currentDocumentSet);
          setDocumentSessions((prev) =>
            new Map(prev).set(currentSignature, {
              chat: selectedChat,
              documents: [...currentDocumentSet],
              lastUsed: Date.now(),
            })
          );
          console.log("💾 Saved session for:", currentSignature);
        }

        // Check if we have an existing session for the new document set
        const existingSession = documentSessions.get(newSignature);

        if (existingSession) {
          console.log("🔍 Found existing session for:", newSignature);
          setSelectedChat(existingSession.chat);
          setCurrentDocumentSet(newDocuments);
          setLastDocumentSignature(newSignature);

          // Update last used timestamp
          setDocumentSessions((prev) => {
            const updated = new Map(prev);
            updated.set(newSignature, {
              ...existingSession,
              lastUsed: Date.now(),
            });
            return updated;
          });
        } else {
          console.log("✨ Starting fresh session for:", newSignature);
          // Start a new chat session
          setSelectedChat(null);
          setCurrentDocumentSet(newDocuments);
          setLastDocumentSignature(newSignature);
          setForceResetKey((prev) => prev + 1);
        }
      } else {
        console.log("📄 Same document context, keeping current session");
        setCurrentDocumentSet(newDocuments);
      }

      // Always update selectedDocuments
      setSelectedDocuments(newDocuments);
    },
    [
      selectedChat,
      currentDocumentSet,
      documentSessions,
      createDocumentSignature,
      shouldCreateNewChatSession,
    ]
  );

  const handleSendQuestionToChat = useCallback(
    (question, questionSource = "mindmap") => {
      console.log(`💬 Sending question from ${questionSource}:`, question);
      console.log("📋 Current document context:", currentDocumentSet);

      // Ensure we're in the right document context before sending
      const questionDocuments =
        currentDocumentSet.length > 0 ? currentDocumentSet : selectedDocuments;

      if (mainChatRef.current && mainChatRef.current.handleSendMessage) {
        // Send the question as-is without adding any prefix
        // The backend can handle mindmap context through other means
        mainChatRef.current.handleSendMessage(question);
        console.log(
          "✅ Question sent to chat with document context:",
          questionDocuments
        );
      } else {
        console.error("❌ MainChat ref not available");
      }
    },
    [currentDocumentSet, selectedDocuments]
  );

  // NEW: Enhanced handleViewMindmap with document session management
  const handleViewMindmap = useCallback(
    async (mindmapData, mindmapId, stats = null) => {
      console.log("🧠 MainDashboard: handleViewMindmap called", {
        mindmapId,
        currentMindmapId,
        stats,
        currentSelectedDocuments: selectedDocuments,
      });

      if (!mindmapData) {
        console.error("❌ No mindmap data provided");
        return;
      }

      // ✅ CRITICAL: Close any existing mindmap first to clear state
      if (showMindmapViewer && currentMindmapId !== mindmapId) {
        console.log(
          "🔄 MainDashboard: Closing previous mindmap to clear state"
        );
        setShowMindmapViewer(false);
        setCurrentMindmapData(null);
        setCurrentMindmapId(null);
        setMindmapStats(null);

        // Wait for state to clear
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Determine the document context for this mindmap
      let mindmapDocuments = [];

      if (stats?.document_ids && stats.document_ids.length > 0) {
        mindmapDocuments = stats.document_ids;
        console.log(
          "📋 Using document IDs from mindmap stats:",
          mindmapDocuments
        );
      } else if (selectedDocuments && selectedDocuments.length > 0) {
        mindmapDocuments = selectedDocuments;
        console.log("📋 Using current selected documents:", mindmapDocuments);
      }

      // Handle document context change BEFORE opening mindmap
      if (mindmapDocuments.length > 0) {
        handleDocumentContextChange(mindmapDocuments, "mindmap_view");

        // Wait for state to settle
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Set new mindmap data
      setCurrentMindmapData(mindmapData);
      setCurrentMindmapId(mindmapId);
      setMindmapStats(stats);

      // Log the final state
      console.log("🧠 MainDashboard: Set mindmap data", {
        mindmapId,
        statsDocumentIds: stats?.document_ids,
        currentSelectedDocuments: selectedDocuments,
      });

      // Open the mindmap viewer
      setShowMindmapViewer(true);
      setShowMindmapHistory(false);
    },
    [
      showMindmapViewer,
      currentMindmapId,
      selectedDocuments,
      handleDocumentContextChange,
    ]
  );

  const handleOpenMindmapHistory = () => {
    setShowMindmapHistory(true);
  };

  const handleRegenerateMindmapFromHistory = async (
    forceRegenerate = false
  ) => {
    if (selectedDocuments.length === 0) {
      alert("Please select at least one document to generate a mindmap");
      return;
    }

    setIsMindmapGenerating(true);

    try {
      const { mindmapServiceNB } = await import("../../utils/axiosConfig");

      console.log("Regenerating mindmap for documents:", selectedDocuments);
      console.log("Main project ID:", mainProjectId);
      console.log("Force regenerate:", forceRegenerate);

      const response = await mindmapServiceNB.generateMindmap(
        mainProjectId,
        selectedDocuments,
        forceRegenerate
      );

      if (response.data && response.data.success) {
        console.log("Mindmap regenerated successfully:", response.data);

        const mindmapData = response.data.mindmap;
        const mindmapStats = response.data.stats;
        const mindmapId = response.data.mindmap_id;

        handleViewMindmap(mindmapData, mindmapId, mindmapStats);

        console.log(
          `New mindmap opened with ${mindmapStats.mindmap_nodes} nodes from ${mindmapStats.documents_processed} documents`
        );
      } else {
        console.error("Failed to regenerate mindmap:", response.data);
        alert("Failed to regenerate mindmap. Please try again.");
      }
    } catch (error) {
      console.error("Error regenerating mindmap:", error);
      alert(
        `Error regenerating mindmap: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setIsMindmapGenerating(false);
    }
  };

  // Updated handleToggleRightPanel with auto-expand logic
  const handleToggleRightPanel = () => {
    setIsRightPanelOpen(!isRightPanelOpen);
  };

  // NEW: Function to handle auto-expand when response is pinned
  const handleAutoExpandRightPanel = () => {
    if (!isRightPanelOpen) {
      setIsRightPanelOpen(true);
    }
  };

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: "delete",
    data: null,
    isLoading: false,
  });

  const [modalNoteData, setModalNoteData] = useState({
    id: null,
    title: "",
    content: "",
  });

  const handleGenerateMindmap = async (forceDocuments = null) => {
    const documentsToUse = forceDocuments || selectedDocuments;

    // // If multiple documents selected, show selection modal
    // if (documentsToUse.length > 1) {
    //   setIsDocumentSelectionModalOpen(true);
    //   return;
    // }

    if (documentsToUse.length === 0) {
      alert("Please select at least one document to generate a mindmap");
      return;
    }

    setIsMindmapGenerating(true);

    try {
      const { mindmapServiceNB } = await import("../../utils/axiosConfig");

      console.log("Generating mindmap for documents:", documentsToUse);
      console.log("Main project ID:", mainProjectId);

      const response = await mindmapServiceNB.generateMindmap(
        mainProjectId,
        documentsToUse
      );

      if (response.data && response.data.success) {
        console.log("Mindmap generated successfully:", response.data);

        const mindmapData = response.data.mindmap;
        const mindmapStats = response.data.stats;
        const mindmapId = response.data.mindmap_id;

        setMindmapData(mindmapData);
        setCurrentMindmapId(mindmapId);
        setIsMindmapViewerOpen(true);

        handleViewMindmap(
          response.data.mindmap,
          response.data.mindmap_id,
          response.data.stats
        );

        console.log(
          `Mindmap opened with ${mindmapStats.mindmap_nodes} nodes from ${mindmapStats.documents_processed} documents`
        );
      } else {
        console.error("Failed to generate mindmap:", response.data);
        alert("Failed to generate mindmap. Please try again.");
      }
    } catch (error) {
      console.error("Error generating mindmap:", error);
      alert(
        `Error generating mindmap: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setIsMindmapGenerating(false);
    }
  };

  const handleOpenNoteViewer = (noteData) => {
    setModalViewerNoteData(noteData);
    setIsNoteViewerModalOpen(true);
  };

  const handleCloseNoteViewer = () => {
    setIsNoteViewerModalOpen(false);
    setModalViewerNoteData(null);
  };

  const handleDeleteNote = async () => {
    if (!confirmationModal.data) return;

    try {
      const { noteServiceNB } = await import("../../utils/axiosConfig");
      await noteServiceNB.deleteNote(confirmationModal.data.id);

      const refreshEvent = new CustomEvent("refreshNotePad");
      document.dispatchEvent(refreshEvent);

      setConfirmationModal({
        isOpen: false,
        type: "delete",
        data: null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to delete note:", error);
      setConfirmationModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleConvertToDocument = async () => {
    if (!confirmationModal.data) return;

    setConfirmationModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const { noteServiceNB } = await import("../../utils/axiosConfig");
      await noteServiceNB.convertNoteToDocument(confirmationModal.data.id);

      const refreshEvent = new CustomEvent("refreshNotePad");
      document.dispatchEvent(refreshEvent);

      const refreshDocsEvent = new CustomEvent("refreshDocuments");
      document.dispatchEvent(refreshDocsEvent);

      setConfirmationModal({
        isOpen: false,
        type: "convert",
        data: null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to convert note:", error);
      setConfirmationModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const [isModalSaving, setIsModalSaving] = useState(false);

  const handleOpenNoteEditor = (noteData = null) => {
    setModalNoteData({
      id: noteData?.id || null,
      title: noteData?.title || "",
      content: noteData?.content || "",
    });
    setIsNoteEditorModalOpen(true);
  };

  const handleCloseNoteEditor = () => {
    setIsNoteEditorModalOpen(false);
    setModalNoteData({ id: null, title: "", content: "" });
  };

  const handleSaveNoteFromModal = async (title, content) => {
    setIsModalSaving(true);
    try {
      const { noteServiceNB } = await import("../../utils/axiosConfig");

      const response = await noteServiceNB.saveNote(
        title.trim() || "Untitled Note",
        content.trim(),
        mainProjectId,
        {},
        null,
        modalNoteData.id || null
      );

      if (response.data) {
        console.log("Note saved successfully from modal");

        const refreshEvent = new CustomEvent("refreshNotePad");
        document.dispatchEvent(refreshEvent);

        handleCloseNoteEditor();
      }
    } catch (error) {
      console.error("Failed to save note from modal:", error);
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleChatInputFocus = () => {
    setChatInputFocused(true);
    setTimeout(() => setChatInputFocused(false), 100);
  };

  const stableSetFollowUpQuestions = useCallback((questions) => {
    setFollowUpQuestions(questions);
  }, []);

  const stableSsetSummary = useCallback((summaryText) => {
    setSummary(summaryText);
  }, []);

  const handleCloseSummary = useCallback(() => {
    setIsSummaryPopupOpen(false);
  }, []);

  // NEW: Enhanced handleDocumentSelectionFromMindmap
  const handleDocumentSelectionFromMindmap = useCallback(
    async (documentIds) => {
      console.log(
        "🔄 MainDashboard: Document selection from mindmap:",
        documentIds
      );
      console.log(
        "🔄 MainDashboard: Current selectedDocuments before update:",
        selectedDocuments
      );

      // Clear any existing mindmap state to prevent stale context
      setCurrentMindmapData(null);
      setCurrentMindmapId(null);
      setMindmapStats(null);

      // Use the document context change handler
      handleDocumentContextChange(documentIds, "mindmap_selection");

      // Force a small delay to ensure state propagation
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("✅ MainDashboard: Document context updated from mindmap");
    },
    [selectedDocuments, handleDocumentContextChange]
  );

  // NEW: Add event listener for auto-expand functionality
  useEffect(() => {
    const handleRefresh = () => {
      // NotePad will handle its own refresh through the event listener
    };

    // NEW: Add auto-expand functionality when response is pinned
    const handleExpandRightPanel = () => {
      handleAutoExpandRightPanel();
    };

    document.addEventListener("refreshNotePad", handleRefresh);
    document.addEventListener("expandNotePad", handleExpandRightPanel);

    return () => {
      document.removeEventListener("refreshNotePad", handleRefresh);
      document.removeEventListener("expandNotePad", handleExpandRightPanel);
    };
  }, []);

  useEffect(() => {
    console.log("Dashboard mounted with mainProjectId:", mainProjectId);

    if (!mainProjectId) {
      console.warn("No mainProjectId found, redirecting...");
      navigate("/landing");
      return;
    }
  }, [mainProjectId, navigate]);

  useEffect(() => {
    console.log("Main Project ID in Dashboard:", mainProjectId);
    if (!mainProjectId) {
      console.warn("No mainProjectId in URL parameters");
    }
  }, [mainProjectId]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
        setIsRightPanelOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ✅ UPDATE: Enhanced state sync effect
  useEffect(() => {
    console.log("🔍 MainDashboard: State sync check", {
      selectedDocuments,
      selectedDocumentsLength: selectedDocuments?.length || 0,
      currentMindmapId,
      showMindmapViewer,
      timestamp: new Date().toISOString(),
    });
  }, [selectedDocuments, currentMindmapId, showMindmapViewer]);

  // NEW: Update selectedDocuments effect to use document context handler
  useEffect(() => {
    const signature = createDocumentSignature(selectedDocuments);
    if (signature !== lastDocumentSignature) {
      console.log("📋 selectedDocuments changed, updating context via effect");
      handleDocumentContextChange(selectedDocuments, "documents_effect");
    }
  }, [
    selectedDocuments,
    lastDocumentSignature,
    handleDocumentContextChange,
    createDocumentSignature,
  ]);

  // NEW: Cleanup old sessions periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      setDocumentSessions((prev) => {
        const cleaned = new Map();
        for (const [key, session] of prev) {
          if (session.lastUsed > oneHourAgo) {
            cleaned.set(key, session);
          }
        }
        console.log(`🧹 Cleaned up ${prev.size - cleaned.size} old sessions`);
        return cleaned;
      });
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  // NEW: Debug logging for session state
  useEffect(() => {
    console.log("📊 Session State Update:", {
      currentDocumentSet,
      documentSignature: createDocumentSignature(currentDocumentSet),
      activeSessionsCount: documentSessions.size,
      selectedChatExists: !!selectedChat,
    });
  }, [
    currentDocumentSet,
    documentSessions,
    selectedChat,
    createDocumentSignature,
  ]);

  const handleDocumentSelect = (doc) => {
    if (doc) {
      setSelectedDocument(doc);
      setSummary(doc.summary || "No summary available");
      setFollowUpQuestions(doc.follow_up_questions || []);
      setIsSummaryPopupOpen(true);

      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } else {
      console.error("No document selected");
    }
  };

  const handleNewChat = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Always clear any existing chat session for the current document set
    const newSignature = createDocumentSignature(selectedDocuments);

    // Remove any existing session for this document set
    setDocumentSessions((prev) => {
      const updated = new Map(prev);
      updated.delete(newSignature);
      return updated;
    });

    // Force update document context and reset chat state
    setSelectedChat(null);
    setSelectedDocument(null);
    setSummary("");
    setFollowUpQuestions([]);
    setForceResetKey((prev) => prev + 1);

    // Always update document context to ensure a fresh session
    handleDocumentContextChange(selectedDocuments, "new_chat_forced");

    console.log(
      "✅ New chat started with current document selection:",
      selectedDocuments
    );
  };

  const handleSendMessage = async (message, documents) => {
    console.log("Sending message:", message);
    console.log("With documents:", documents);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleSidebarToggle = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };

    document.addEventListener("toggle-sidebar", handleSidebarToggle);

    return () => {
      document.removeEventListener("toggle-sidebar", handleSidebarToggle);
    };
  }, [isSidebarOpen]);

  const handleDocumentSelectionChange = (newSelection) => {
    console.log("📡 Dashboard: Document selection changed:", newSelection);

    // Update MainChat directly via ref
    if (mainChatRef.current) {
      mainChatRef.current.updateDocumentSelection(newSelection);
    }
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${
        theme === "dark" ? "dark:bg-black" : "bg-[#f0efea]/50"
      } overflow-hidden ${
        isDragOver ? "border-2 border-blue-400 bg-blue-50" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Background for dark theme */}
      {theme === "dark" && (
        <>
          <div
            className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            role="img"
            aria-label="Background"
          />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
        </>
      )}

      <Header />

      <div className="flex flex-1 relative">
        {/* Mobile Overlay for Sidebar */}
        {isMobile && isSidebarOpen && (
          <div
            className={`fixed inset-0 ${
              theme === "dark" ? "bg-black" : "bg-[#5e4636]"
            } bg-opacity-50 z-40`}
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Responsive Layout Container */}
        <div className="flex flex-1 overflow-hidden w-full">
          <SideTab
            isOpen={isSidebarOpen}
            isMobile={isMobile}
            mainProjectId={mainProjectId}
            onSelectChat={setSelectedChat}
            onDocumentSelect={handleDocumentSelect}
            onClose={() => setIsSidebarOpen(false)}
            onSendMessage={handleSendMessage}
            setSelectedDocuments={setSelectedDocuments}
            selectedDocuments={selectedDocuments}
            onToggle={toggleSidebar}
            onNewChat={handleNewChat}
            chatInputFocused={chatInputFocused}
            onDocumentSelectionChange={handleDocumentSelectionChange}
            onDocumentContextChange={handleDocumentContextChange}
            onDocumentsUpdate={setDocuments}
          />

          {/* Centered Main Content Container */}

          {/* Centered Main Content Container */}
          <div
            className={`
  flex-1 
  flex 
  justify-center 
  w-full 
  overflow-hidden
  transition-all 
  duration-300 
  ease-in-out 
  ${!isMobile && isSidebarOpen ? "max-w-[calc(100%-330px)]" : "max-w-full"}
  ${isRightPanelOpen && !isMobile ? "pr-80" : "pr-0"}
`}
          >
            <div
              className={`
    w-full 
    max-w-full 
    transition-all 
    duration-300 
    ease-in-out 
    overflow-hidden
    ${
      !isMobile
        ? isSidebarOpen
          ? isRightPanelOpen
            ? "px-4"
            : "pl-4 pr-16"
          : isRightPanelOpen
          ? "pl-16 pr-4"
          : "px-16"
        : "px-4"
    }
  `}
            >
              <MainChat
                ref={mainChatRef}
                key={`chat-${forceResetKey}-${createDocumentSignature(
                  currentDocumentSet
                )}`}
                selectedChat={selectedChat}
                mainProjectId={mainProjectId}
                selectedDocument={selectedDocument}
                summary={summary}
                followUpQuestions={followUpQuestions}
                isSummaryPopupOpen={isSummaryPopupOpen}
                onCloseSummary={handleCloseSummary}
                setSummary={stableSsetSummary}
                setFollowUpQuestions={stableSetFollowUpQuestions}
                setIsSummaryPopupOpen={setIsSummaryPopupOpen}
                isMobile={isMobile}
                setSelectedDocuments={setSelectedDocuments}
                selectedDocuments={currentDocumentSet}
                className="w-full max-w-full overflow-hidden"
                onChatInputFocus={handleChatInputFocus}
                onOpenYouTubeModal={() => setIsYouTubeModalOpen(true)}
                message={message}
                setMessage={setMessage}
                pastedImages={pastedImages}
                setPastedImages={setPastedImages}
                imagePreviews={imagePreviews}
                setImagePreviews={setImagePreviews}
                hasImages={hasImages}
                setHasImages={setHasImages}
              />
            </div>
          </div>

          {/* RightPanel Component */}
          <RightPanel
            isExpanded={isRightPanelOpen}
            onToggle={handleToggleRightPanel}
            onGenerateMindmap={handleGenerateMindmap}
            isMindmapGenerating={isMindmapGenerating}
            selectedDocuments={selectedDocuments}
            theme={theme}
            mainProjectId={mainProjectId}
            onViewMindmap={handleViewMindmap}
            onDocumentSelectionChange={handleDocumentSelectionFromMindmap}
          />
        </div>
      </div>

      {/* NotePad - Updated to use the toggle function that can handle auto-expand */}
      {isRightPanelOpen && (
        <NotePad
          mainProjectId={mainProjectId}
          isOpen={isRightPanelOpen}
          onToggle={handleToggleRightPanel}
          onOpenEditor={handleOpenNoteEditor}
          onOpenViewer={handleOpenNoteViewer}
          onShowConfirmation={setConfirmationModal}
          onGenerateMindmap={handleGenerateMindmap}
          isMindmapGenerating={isMindmapGenerating}
          selectedDocuments={selectedDocuments}
          onViewMindmapHistory={handleOpenMindmapHistory}
        />
      )}

      {/* All your existing modals remain the same */}
      <YouTubeUploadModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        mainProjectId={mainProjectId}
        onUploadSuccess={(data) => {
          console.log("Upload successful:", data);
        }}
      />

      <NoteEditorModal
        isOpen={isNoteEditorModalOpen}
        onClose={handleCloseNoteEditor}
        noteTitle={modalNoteData.title}
        noteContent={modalNoteData.content}
        onSave={handleSaveNoteFromModal}
        isSaving={isModalSaving}
      />

      <NoteViewerModal
        isOpen={isNoteViewerModalOpen}
        onClose={handleCloseNoteViewer}
        note={modalViewerNoteData}
        onEdit={() => {
          handleOpenNoteEditor(modalViewerNoteData);
          handleCloseNoteViewer();
        }}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        type={confirmationModal.type}
        onClose={() =>
          setConfirmationModal({
            isOpen: false,
            type: "delete",
            data: null,
            isLoading: false,
          })
        }
        onConfirm={
          confirmationModal.type === "delete"
            ? handleDeleteNote
            : handleConvertToDocument
        }
        itemName={confirmationModal.data?.title || "Untitled Note"}
        isLoading={confirmationModal.isLoading}
        loadingText={
          confirmationModal.type === "convert" ? "Converting..." : "Deleting..."
        }
      />

      <MindMapHistory
        isOpen={showMindmapHistory}
        onClose={() => setShowMindmapHistory(false)}
        mainProjectId={mainProjectId}
        onViewMindmap={handleViewMindmap}
        onRegenerateMindmap={handleRegenerateMindmapFromHistory}
        selectedDocuments={selectedDocuments}
        setSelectedDocuments={setSelectedDocuments}
        onDocumentSelectionChange={handleDocumentSelectionFromMindmap}
      />

      <MindMapViewer
        key={`mindmap-${currentMindmapId}-${createDocumentSignature(
          currentDocumentSet
        )}`} // NEW: Enhanced key with document session
        isOpen={showMindmapViewer}
        onClose={() => {
          setShowMindmapViewer(false);
          setCurrentMindmapData(null);
          setCurrentMindmapId(null);
          setMindmapStats(null);
        }}
        mindmapData={currentMindmapData}
        mainProjectId={mainProjectId}
        selectedDocuments={currentDocumentSet} // NEW: Use currentDocumentSet for consistency
        mindmapId={currentMindmapId}
        onSendToChat={handleSendQuestionToChat}
        mindmapStats={mindmapStats}
        isFromHistory={!!currentMindmapId}
      />

      {/* <DocumentSelectionModal
  isOpen={isDocumentSelectionModalOpen}
  onClose={() => setIsDocumentSelectionModalOpen(false)}
  selectedDocuments={selectedDocuments}
  documents={documents || []} // You'll need to pass documents from SideTab or fetch them
  onSelectDocument={() => {}} // Not used in this flow
  onGenerateMindmap={handleGenerateMindmap}
  theme={theme}
  mainProjectId={mainProjectId}
/> */}

      {/* Brain Loading Modal */}
      {isMindmapGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className={`fixed inset-0 ${
              theme === "dark" ? "bg-black" : "bg-gray-900"
            } bg-opacity-70 backdrop-blur-sm`}
          />
          <div
            className={`
            relative max-w-md mx-4 
            ${theme === "dark" ? "bg-gray-900" : "bg-white"} 
            rounded-lg shadow-2xl
          `}
          >
            <BrainLoadingAnimation theme={theme} />
          </div>
        </div>
      )}
    </div>
  );
};

MainDashboard.propTypes = {
  isSidebarOpen: PropTypes.bool,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string),
};

export default MainDashboard;
