
//Document Q/A parent component
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Menu, ChevronRight, ChevronLeft, X } from 'lucide-react';
import Header from '../dashboard/Header';

import MainChat from './MainChat';
import backgroundImage from '../../assets/bg-main.jpg';
import FaqButton from '../../components/faq/FaqButton';
import { ThemeContext } from '../../context/ThemeContext'; // Import ThemeContext
import SideTab from './SideTab';
import YouTubeUploadModal from "../klarifai_notebook/YouTubeUploadModal";
import NoteEditorModal from "../klarifai_notebook/NoteEditorModal";
import NotePad from "../klarifai_notebook/Notepad";


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
const handleToggleNotePad = () => {
  setIsNotePadOpen(!isNotePadOpen);
};

const [modalNoteData, setModalNoteData] = useState({
  id: null,
  title: '',
  content: ''
});
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
          ${isNotePadOpen ? 'pr-80' : 'pr-0'} // Add this line for notepad spacing
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
  onOpenEditor={handleOpenNoteEditor} // ADD THIS PROP
/>

<NoteEditorModal
  isOpen={isNoteEditorModalOpen}
  onClose={handleCloseNoteEditor}
  noteTitle={modalNoteData.title}
  noteContent={modalNoteData.content}
  onSave={handleSaveNoteFromModal}
  isSaving={isModalSaving}
/>


    </div>
  );
};

MainDashboard.propTypes = {
  isSidebarOpen: PropTypes.bool,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string),
};

export default MainDashboard;
