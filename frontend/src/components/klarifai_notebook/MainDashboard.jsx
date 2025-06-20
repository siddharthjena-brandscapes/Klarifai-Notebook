

import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Menu, ChevronRight, ChevronLeft, X, Brain } from 'lucide-react';
import Header from '../dashboard/Header';
import MainChat from './MainChat';
import backgroundImage from '../../assets/bg-main.jpg';
import FaqButton from '../../components/faq/FaqButton';
import { ThemeContext } from '../../context/ThemeContext';
import SideTab from './SideTab';
import YouTubeUploadModal from "../klarifai_notebook/YouTubeUploadModal";
import NoteEditorModal from "../klarifai_notebook/NoteEditorModal";
import NotePad from "../klarifai_notebook/NotePad";
import NoteViewerModal from "../klarifai_notebook/NoteViewerModal";
import ConfirmationModal from "../klarifai_notebook/ConfirmationModal";
import MindMapViewer from "../klarifai_notebook/MindMapViewer";
import RightPanel from "./RightPanel";
import MindMapHistory from "../klarifai_notebook/MindMapHistory";
import BrainLoadingAnimation from '../klarifai_notebook/BrainLoadingAnimation';

const MainDashboard = () => {
  const { mainProjectId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [summary, setSummary] = useState('');
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

  const handleViewMindmap = (mindmapData, mindmapId, stats = null) => {
    console.log('MainDashboard: Viewing mindmap', {
      mindmapData,
      mindmapId,
      stats
    });
    
    if (!mindmapData) {
      console.error('No mindmap data provided to handleViewMindmap');
      return;
    }
    
    setCurrentMindmapData(mindmapData);
    setCurrentMindmapId(mindmapId);
    setMindmapStats(stats);
    setShowMindmapViewer(true);
    setShowMindmapHistory(false);
  };

  const handleOpenMindmapHistory = () => {
    setShowMindmapHistory(true);
  };

  const handleRegenerateMindmapFromHistory = async (forceRegenerate = false) => {
    if (selectedDocuments.length === 0) {
      alert('Please select at least one document to generate a mindmap');
      return;
    }

    setIsMindmapGenerating(true);
    
    try {
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      
      console.log('Regenerating mindmap for documents:', selectedDocuments);
      console.log('Main project ID:', mainProjectId);
      console.log('Force regenerate:', forceRegenerate);
      
      const response = await mindmapServiceNB.generateMindmap(
        mainProjectId,
        selectedDocuments,
        forceRegenerate
      );
      
      if (response.data && response.data.success) {
        console.log('Mindmap regenerated successfully:', response.data);
        
        const mindmapData = response.data.mindmap;
        const mindmapStats = response.data.stats;
        const mindmapId = response.data.mindmap_id;
        
        handleViewMindmap(mindmapData, mindmapId, mindmapStats);
        
        console.log(`New mindmap opened with ${mindmapStats.mindmap_nodes} nodes from ${mindmapStats.documents_processed} documents`);
        
      } else {
        console.error('Failed to regenerate mindmap:', response.data);
        alert('Failed to regenerate mindmap. Please try again.');
      }
      
    } catch (error) {
      console.error('Error regenerating mindmap:', error);
      alert(`Error regenerating mindmap: ${error.response?.data?.error || error.message}`);
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
    type: 'delete',
    data: null,
    isLoading: false
  });

  const [modalNoteData, setModalNoteData] = useState({
    id: null,
    title: '',
    content: ''
  });

  const handleGenerateMindmap = async () => {
    if (selectedDocuments.length === 0) {
      alert('Please select at least one document to generate a mindmap');
      return;
    }

    setIsMindmapGenerating(true);
    
    try {
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      
      console.log('Generating mindmap for documents:', selectedDocuments);
      console.log('Main project ID:', mainProjectId);
      
      const response = await mindmapServiceNB.generateMindmap(
        mainProjectId,
        selectedDocuments
      );
      
      if (response.data && response.data.success) {
        console.log('Mindmap generated successfully:', response.data);
        
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
        
        console.log(`Mindmap opened with ${mindmapStats.mindmap_nodes} nodes from ${mindmapStats.documents_processed} documents`);
        
      } else {
        console.error('Failed to generate mindmap:', response.data);
        alert('Failed to generate mindmap. Please try again.');
      }
      
    } catch (error) {
      console.error('Error generating mindmap:', error);
      alert(`Error generating mindmap: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsMindmapGenerating(false);
    }
  };

  const handleCloseMindmapViewer = () => {
    setIsMindmapViewerOpen(false);
    setMindmapData(null);
    setCurrentMindmapId(null);
  };

  const handleSendQuestionToChat = (question) => {
    console.log('Sending question from mindmap to chat:', question);
    
    if (mainChatRef.current && mainChatRef.current.handleSendMessage) {
      mainChatRef.current.handleSendMessage(question);
    } else {
      console.error('MainChat ref not available or handleSendMessage not exposed');
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
      const { noteServiceNB } = await import('../../utils/axiosConfig');
      await noteServiceNB.deleteNote(confirmationModal.data.id);
      
      const refreshEvent = new CustomEvent('refreshNotePad');
      document.dispatchEvent(refreshEvent);
      
      setConfirmationModal({ isOpen: false, type: 'delete', data: null, isLoading: false });
    } catch (error) {
      console.error('Failed to delete note:', error);
      setConfirmationModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleConvertToDocument = async () => {
    if (!confirmationModal.data) return;
    
    setConfirmationModal(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { noteServiceNB } = await import('../../utils/axiosConfig');
      await noteServiceNB.convertNoteToDocument(confirmationModal.data.id);
      
      const refreshEvent = new CustomEvent('refreshNotePad');
      document.dispatchEvent(refreshEvent);
      
      const refreshDocsEvent = new CustomEvent('refreshDocuments');
      document.dispatchEvent(refreshDocsEvent);
      
      setConfirmationModal({ isOpen: false, type: 'convert', data: null, isLoading: false });
    } catch (error) {
      console.error('Failed to convert note:', error);
      setConfirmationModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const [isModalSaving, setIsModalSaving] = useState(false);
  
  const handleOpenNoteEditor = (noteData = null) => {
    setModalNoteData({
      id: noteData?.id || null,
      title: noteData?.title || '',
      content: noteData?.content || ''
    });
    setIsNoteEditorModalOpen(true);
  };

  const handleCloseNoteEditor = () => {
    setIsNoteEditorModalOpen(false);
    setModalNoteData({ id: null, title: '', content: '' });
  };

  const handleSaveNoteFromModal = async (title, content) => {
    setIsModalSaving(true);
    try {
      const { noteServiceNB } = await import('../../utils/axiosConfig');
      
      const response = await noteServiceNB.saveNote(
        title.trim() || 'Untitled Note',
        content.trim(),
        mainProjectId,
        {},
        null,
        modalNoteData.id || null
      );

      if (response.data) {
        console.log('Note saved successfully from modal');
        
        const refreshEvent = new CustomEvent('refreshNotePad');
        document.dispatchEvent(refreshEvent);
        
        handleCloseNoteEditor();
      }
    } catch (error) {
      console.error('Failed to save note from modal:', error);
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

  // NEW: Add event listener for auto-expand functionality
  useEffect(() => {
    const handleRefresh = () => {
      // NotePad will handle its own refresh through the event listener
    };

    // NEW: Add auto-expand functionality when response is pinned
    const handleExpandRightPanel = () => {
      handleAutoExpandRightPanel();
    };

    document.addEventListener('refreshNotePad', handleRefresh);
    document.addEventListener('expandNotePad', handleExpandRightPanel);
    
    return () => {
      document.removeEventListener('refreshNotePad', handleRefresh);
      document.removeEventListener('expandNotePad', handleExpandRightPanel);
    };
  }, []);

  useEffect(() => {
    console.log('Dashboard mounted with mainProjectId:', mainProjectId);
    
    if (!mainProjectId) {
      console.warn('No mainProjectId found, redirecting...');
      navigate('/landing');
      return;
    }
  }, [mainProjectId, navigate]);

  useEffect(() => {
    console.log('Main Project ID in Dashboard:', mainProjectId);
    if (!mainProjectId) {
      console.warn('No mainProjectId in URL parameters');
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
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDocumentSelect = (doc) => {
    if (doc) {
      setSelectedDocument(doc);
      setSummary(doc.summary || 'No summary available');
      setFollowUpQuestions(doc.follow_up_questions || []);
      setIsSummaryPopupOpen(true);

      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } else {
      console.error('No document selected');
    }
  };

  const handleNewChat = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    console.log("Dashboard: Starting new chat, preserving documents:", selectedDocuments);
    
    setSelectedChat(null);
    setSelectedDocument(null);
    setSummary('');
    setFollowUpQuestions([]);
    setForceResetKey(prev => prev + 1);
    console.log("Incremented reset key to force MainContent reset");
  }

  const handleSendMessage = async (message, documents) => {
    console.log('Sending message:', message);
    console.log('With documents:', documents);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const handleSidebarToggle = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };
    
    document.addEventListener('toggle-sidebar', handleSidebarToggle);
    
    return () => {
      document.removeEventListener('toggle-sidebar', handleSidebarToggle);
    };
  }, [isSidebarOpen]);

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'dark:bg-black' : 'bg-[#f0efea]/50'} overflow-hidden`}>
      {/* Background for dark theme */}
      {theme === 'dark' && (
        <>
          <div 
            className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
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
            className={`fixed inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-[#5e4636]'} bg-opacity-50 z-40`} 
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
          />
          
          {/* Centered Main Content Container */}
          <div className={`
            flex-1 
            flex 
            justify-center 
            w-full 
            overflow-hidden
            transition-all 
            duration-300 
            ease-in-out 
            ${!isMobile && isSidebarOpen 
              ? 'px-0 max-w-[calc(100%-330px)]' 
              : 'pl-0 max-w-full'
            }
            ${isRightPanelOpen ? 'lg:pr-80 md:pr-80 pr-0' : 'pr-0'}
          `}>
            <div className={`
              w-full 
              max-w-full 
              transition-all 
              duration-300 
              ease-in-out 
              pl-16
              mx-16
              ${!isMobile && isSidebarOpen 
                ? 'ml-0 w-[100%]' 
                : 'ml-0 w-full'
              }
            `}>
              <MainChat
                ref={mainChatRef}
                key={`chat-${forceResetKey}`} 
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
                selectedDocuments={selectedDocuments}
                className="w-full"
                onChatInputFocus={handleChatInputFocus}
                onOpenYouTubeModal={() => setIsYouTubeModalOpen(true)}
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
        />
      )}

      {/* All your existing modals remain the same */}
      <YouTubeUploadModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        mainProjectId={mainProjectId}
        onUploadSuccess={(data) => {
          console.log('Upload successful:', data);
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
        onClose={() => setConfirmationModal({ isOpen: false, type: 'delete', data: null, isLoading: false })}
        onConfirm={confirmationModal.type === 'delete' ? handleDeleteNote : handleConvertToDocument}
        itemName={confirmationModal.data?.title || 'Untitled Note'}
        isLoading={confirmationModal.isLoading}
        loadingText={confirmationModal.type === 'convert' ? 'Converting...' : 'Deleting...'}
      />

      <MindMapHistory
        isOpen={showMindmapHistory}
        onClose={() => setShowMindmapHistory(false)}
        mainProjectId={mainProjectId}
        onViewMindmap={handleViewMindmap}
        onRegenerateMindmap={handleRegenerateMindmapFromHistory}
        selectedDocuments={selectedDocuments}
      />

      <MindMapViewer
        isOpen={showMindmapViewer}
        onClose={() => {
          setShowMindmapViewer(false);
          setCurrentMindmapData(null);
          setCurrentMindmapId(null);
          setMindmapStats(null);
        }}
        mindmapData={currentMindmapData}
        mainProjectId={mainProjectId}
        selectedDocuments={selectedDocuments}
        mindmapId={currentMindmapId}
        onSendToChat={handleSendQuestionToChat}
        mindmapStats={mindmapStats}
        isFromHistory={!!currentMindmapId}
      />

      {/* Brain Loading Modal */}
      {isMindmapGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-gray-900'} bg-opacity-70 backdrop-blur-sm`} />
          <div className={`
            relative max-w-md mx-4 
            ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} 
            rounded-lg shadow-2xl
          `}>
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