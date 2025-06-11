//Document Q/A parent component
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Menu, ChevronRight, ChevronLeft, X, Brain } from 'lucide-react';
import Header from '../dashboard/Header';

import MainChat from './MainChat';
import backgroundImage from '../../assets/bg-main.jpg';
import FaqButton from '../../components/faq/FaqButton';
import { ThemeContext } from '../../context/ThemeContext'; // Import ThemeContext
import SideTab from './SideTab';
import YouTubeUploadModal from "../klarifai_notebook/YouTubeUploadModal";
import NoteEditorModal from "../klarifai_notebook/NoteEditorModal";
import NotePad from "../klarifai_notebook/Notepad";
import NoteViewerModal from "../klarifai_notebook/NoteViewerModal";
import ConfirmationModal from "../klarifai_notebook/ConfirmationModal";
import MindMapViewer from "../klarifai_notebook/MindMapViewer";

const MainDashboard = () => {
  const { mainProjectId } = useParams();
  const navigate = useNavigate();
  // Change default sidebar state to closed
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [summary, setSummary] = useState('');
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [isSummaryPopupOpen, setIsSummaryPopupOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [chatInputFocused, setChatInputFocused] = useState(false);
  const { theme } = useContext(ThemeContext); // Get current theme from context\
  const [forceResetKey, setForceResetKey] = useState(0);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
const [isNotePadOpen, setIsNotePadOpen] = useState(true);
const [isNoteEditorModalOpen, setIsNoteEditorModalOpen] = useState(false);
const [isNoteViewerModalOpen, setIsNoteViewerModalOpen] = useState(false);
const [modalViewerNoteData, setModalViewerNoteData] = useState(null);

// New state for mindmap functionality
const [isMindmapGenerating, setIsMindmapGenerating] = useState(false);
const [isMindmapViewerOpen, setIsMindmapViewerOpen] = useState(false);
const [mindmapData, setMindmapData] = useState(null);
const [currentMindmapId, setCurrentMindmapId] = useState(null);
const mainChatRef = useRef(null);

const handleToggleNotePad = () => {
  setIsNotePadOpen(!isNotePadOpen);
};

const [confirmationModal, setConfirmationModal] = useState({
  isOpen: false,
  type: 'delete', // 'delete' | 'convert'
  data: null,
  isLoading: false
});

const [modalNoteData, setModalNoteData] = useState({
  id: null,
  title: '',
  content: ''
});

// Handle mindmap generation
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
      
      // Store mindmap data and open viewer
      const mindmapData = response.data.mindmap;
      const mindmapStats = response.data.stats;
      const mindmapId = response.data.mindmap_id;
      
      setMindmapData(mindmapData);
      setCurrentMindmapId(mindmapId);
      setIsMindmapViewerOpen(true);
      
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

// Handle mindmap viewer close
const handleCloseMindmapViewer = () => {
  setIsMindmapViewerOpen(false);
  setMindmapData(null);
  setCurrentMindmapId(null);
};

// Handle sending question from mindmap to chat
const handleSendQuestionToChat = (question) => {
  console.log('Sending question from mindmap to chat:', question);
  
  // Use the ref to call the MainChat's handleSendMessage function
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
    
    // Trigger NotePad refresh
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
    
    // Trigger NotePad refresh
    const refreshEvent = new CustomEvent('refreshNotePad');
    document.dispatchEvent(refreshEvent);
    
    // Trigger documents refresh
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
      
      // ADD THIS: Trigger NotePad refresh by dispatching custom event
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

  // Pass this event handler to MainContent
  const handleChatInputFocus = () => {
    setChatInputFocused(true);
    // Reset after a short delay
    setTimeout(() => setChatInputFocused(false), 100);
  };

  // Stable callback for setting follow-up questions
  const stableSetFollowUpQuestions = useCallback((questions) => {
    setFollowUpQuestions(questions);
  }, []); 

  // Stable callback for setting summary
  const stableSsetSummary = useCallback((summaryText) => {
    setSummary(summaryText);
  }, []);

  // Callback to close summary popup
  const handleCloseSummary = useCallback(() => {
    setIsSummaryPopupOpen(false);
  }, []);

// This should already exist in your MainDashboard.jsx
useEffect(() => {
  const handleRefresh = () => {
    // NotePad will handle its own refresh through the event listener
  };

  document.addEventListener('refreshNotePad', handleRefresh);
  
  return () => {
    document.removeEventListener('refreshNotePad', handleRefresh);
  };
}, []);

  useEffect(() => {
    console.log('Dashboard mounted with mainProjectId:', mainProjectId);
    
    // If no mainProjectId, redirect to landing
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

  // Responsive breakpoint management
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Only close sidebar on mobile, keep it open on desktop
      if (mobile) {
        setIsSidebarOpen(false);
      } 
    };

    // Check initial screen size
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup listener
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDocumentSelect = (doc) => {
    if (doc) {
      setSelectedDocument(doc);
      setSummary(doc.summary || 'No summary available');
      setFollowUpQuestions(doc.follow_up_questions || []);
      setIsSummaryPopupOpen(true);

      // On mobile, close sidebar after selection
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } else {
      console.error('No document selected');
    }
  };

  const handleNewChat = (e) => {
    // Prevent default behavior if called from a link or form
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    console.log("Dashboard: Starting new chat, preserving documents:", selectedDocuments);
    
    // CRITICAL: Reset the selectedChat state to null
    setSelectedChat(null);
    
    // Reset other chat-related states
    setSelectedDocument(null);
    setSummary('');
    setFollowUpQuestions([]);

     // Force a reset by incrementing the key
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
    // Listen for custom sidebar toggle events
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
      {/* Apply background only in dark theme */}
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

        {/* Fixed Action Buttons Container - Top Right */}
        <div className={`
          fixed top-20 right-4 z-30 
          flex flex-col gap-3
          transition-all duration-300 ease-in-out
          ${isNotePadOpen ? 'lg:right-80 md:right-80' : 'right-4'}
        `}>
          
          {/* Mindmap Generation Button */}
          <div className="relative">
            <button
              onClick={handleGenerateMindmap}
              disabled={isMindmapGenerating || selectedDocuments.length === 0}
              className={`
                group relative
                w-12 h-12 lg:w-14 lg:h-14
                rounded-full 
                shadow-lg hover:shadow-xl 
                transition-all duration-300 
                flex items-center justify-center
                ${theme === 'dark' 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }
                ${(isMindmapGenerating || selectedDocuments.length === 0) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-110 cursor-pointer'
                }
                backdrop-blur-sm
              `}
              title={
                selectedDocuments.length === 0 
                  ? "Select documents to generate mindmap" 
                  : isMindmapGenerating 
                    ? "Generating mindmap..." 
                    : "Generate Mindmap"
              }
            >
              <Brain 
                className={`w-5 h-5 lg:w-6 lg:h-6 text-white transition-transform duration-300 ${
                  isMindmapGenerating ? 'animate-pulse' : 'group-hover:scale-110'
                }`} 
              />
              
              {/* Tooltip */}
              <div className={`
                absolute right-16 top-1/2 transform -translate-y-1/2
                px-3 py-2 rounded-lg text-sm font-medium
                ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}
                opacity-0 group-hover:opacity-100
                transition-opacity duration-300
                pointer-events-none
                whitespace-nowrap
                shadow-lg
                hidden lg:block
              `}>
                {selectedDocuments.length === 0 
                  ? "Select documents first" 
                  : isMindmapGenerating 
                    ? "Generating mindmap..." 
                    : `Generate Mindmap (${selectedDocuments.length} docs)`
                }
                <div className={`
                  absolute left-full top-1/2 transform -translate-y-1/2
                  border-4 border-transparent
                  ${theme === 'dark' ? 'border-l-gray-800' : 'border-l-gray-900'}
                `} />
              </div>

              {/* Loading spinner overlay */}
              {isMindmapGenerating && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-30">
                  <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          </div>

         
        </div>

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
          ${isNotePadOpen ? 'lg:pr-80 md:pr-80 pr-0' : 'pr-0'}
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
        </div>
      </div>
     <YouTubeUploadModal
  isOpen={isYouTubeModalOpen}
  onClose={() => setIsYouTubeModalOpen(false)}
  mainProjectId={mainProjectId}
  onUploadSuccess={(data) => {
    console.log('Upload successful:', data);
    // Add any additional success handling here
  }}
/>
<NotePad
  mainProjectId={mainProjectId}
  isOpen={isNotePadOpen}
  onToggle={handleToggleNotePad}
  onOpenEditor={handleOpenNoteEditor}
  onOpenViewer={handleOpenNoteViewer}
  onShowConfirmation={setConfirmationModal}   
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

<MindMapViewer
  isOpen={isMindmapViewerOpen}
  onClose={handleCloseMindmapViewer}
  mindmapData={mindmapData}
  mainProjectId={mainProjectId}
  selectedDocuments={selectedDocuments}
  mindmapId={currentMindmapId}
  onSendToChat={handleSendQuestionToChat}
/>

    </div>
  );
};

MainDashboard.propTypes = {
  isSidebarOpen: PropTypes.bool,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string),
};

export default MainDashboard;