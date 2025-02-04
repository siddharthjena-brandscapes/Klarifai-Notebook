// //Dashboard.jsx original
// /* eslint-disable no-unused-vars */
// import React, { useState, useEffect, useCallback } from 'react';
// import PropTypes from 'prop-types';
// import { Menu, ChevronRight, ChevronLeft, X } from 'lucide-react';
// import Header from '../../components/dashboard/Header';
// import Sidebar from '../../components/dashboard/Sidebar';
// import MainContent from '../../components/dashboard/MainContent';
// import backgroundImage from '../../assets/bg-main.jpg';

// const Dashboard = () => {
//   // Change default sidebar state to closed
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [isMobile, setIsMobile] = useState(false);
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [selectedDocument, setSelectedDocument] = useState(null);
//   const [summary, setSummary] = useState('');
//   const [followUpQuestions, setFollowUpQuestions] = useState([]);
//   const [isSummaryPopupOpen, setIsSummaryPopupOpen] = useState(false);
//   const [selectedDocuments, setSelectedDocuments] = useState([]);

//   // Stable callback for setting follow-up questions
//   const stableSetFollowUpQuestions = useCallback((questions) => {
//     setFollowUpQuestions(questions);
//   }, []); 

//   // Stable callback for setting summary
//   const stableSsetSummary = useCallback((summaryText) => {
//     setSummary(summaryText);
//   }, []);

//   // Callback to close summary popup
//   const handleCloseSummary = useCallback(() => {
//     setIsSummaryPopupOpen(false);
//   }, []);

//   // Responsive breakpoint management
//   useEffect(() => {
//     const checkMobile = () => {
//       const mobile = window.innerWidth <= 768;
//       setIsMobile(mobile);
//       // Only close sidebar on mobile, keep it open on desktop
//       if (mobile) {
//         setIsSidebarOpen(false);
//       } else {
//         setIsSidebarOpen(true); // Keep sidebar open on desktop
//       }
//     };
  
//     // Check initial screen size
//     checkMobile();
  
//     // Add resize listener
//     window.addEventListener('resize', checkMobile);
  
//     // Cleanup listener
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   const handleDocumentSelect = (doc) => {
//     if (doc) {
//       setSelectedDocument(doc);
//       setSummary(doc.summary || 'No summary available');
//       setFollowUpQuestions(doc.follow_up_questions || []);
//       setIsSummaryPopupOpen(true);

//       // On mobile, close sidebar after selection
//       if (isMobile) {
//         setIsSidebarOpen(false);
//       }
//     } else {
//       console.error('No document selected');
//     }
//   };

//   const handleNewChat = () => {
//     // Reset relevant states
//     setSelectedChat(null);
//     setSelectedDocument(null);
//     setSummary('');
//     setFollowUpQuestions([]);
//     setSelectedDocuments([]);
//   };

//   const handleSendMessage = async (message, documents) => {
//     console.log('Sending message:', message);
//     console.log('With documents:', documents);
//   };

//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   return (
//     <div className="flex flex-col min-h-screen bg-black overflow-hidden">
//       <div 
//         className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
//         style={{
//           backgroundImage: `url(${backgroundImage})`,
//           backgroundSize: 'cover',
//           backgroundPosition: 'center',
//         }}
//         role="img"
//         aria-label="Background"
//       />
//       <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
//       <Header />
      
//       <div className="flex flex-1 relative">
//         {/* Mobile Overlay for Sidebar */}
//         {isMobile && isSidebarOpen && (
//           <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-40" 
//             onClick={() => setIsSidebarOpen(false)}
//             aria-hidden="true"
//           />
//         )}

//         {/* Sidebar Toggle Button */}
//         <button
//           onClick={toggleSidebar}
//           className={`
//             fixed z-50 
//             top-20  
//             text-white p-2 
//             ${isMobile 
//               ? 'left-0 rounded-r-lg' 
//               : isSidebarOpen 
//                 ? 'left-[330px] rounded-l-none' 
//                 : 'left-0 rounded-r-lg'}
//             shadow-lg
//             transition-all duration-300 ease-in-out
//             focus:outline-none focus:ring-2 focus:ring-blue-500
//             hover:opacity-90
//           `}
//           aria-label={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
//         >
//           {isSidebarOpen ? 
//             (isMobile ? <X size={24} /> : <ChevronLeft size={24} className="text-gray-300" />) : 
//             <Menu size={24} />
//           }
//         </button>

//         {/* Responsive Layout Container */}
//         <div className="flex flex-1 overflow-hidden w-full">
//           <Sidebar
//             isOpen={isSidebarOpen}
//             isMobile={isMobile}
//             onSelectChat={setSelectedChat}
//             onDocumentSelect={handleDocumentSelect}
//             onClose={() => setIsSidebarOpen(false)}
//             onSendMessage={handleSendMessage}
//             setSelectedDocuments={setSelectedDocuments}
//             selectedDocuments={selectedDocuments}
//             onToggle={toggleSidebar}
//             onNewChat={handleNewChat}
//           />
          
//           {/* Centered Main Content Container */}
//           <div 
//             className={`
//               flex-1 
//               flex 
//               justify-center 
//               w-full 
//               overflow-hidden
//               transition-all 
//               duration-300 
//               ease-in-out 
//               ${!isMobile && isSidebarOpen 
//                 ? 'px-0 max-w-[calc(100%-330px)]' 
//                 : 'pl-0 max-w-full'
//               }
//             `}
//           >
//             <div 
//               className={`
//                 w-full 
//                 max-w-full 
//                 transition-all 
//                 duration-300 
//                 ease-in-out 
//                 pl-16
//                 mx-16
//                 ${!isMobile && isSidebarOpen 
//                   ? 'ml-0 w-[100%]' 
//                   : 'ml-0 w-full'
//                 }
//               `}
//             >
//               <MainContent
//                 selectedChat={selectedChat}
//                 selectedDocument={selectedDocument}
//                 summary={summary}
//                 followUpQuestions={followUpQuestions}
//                 isSummaryPopupOpen={isSummaryPopupOpen}
//                 onCloseSummary={handleCloseSummary}
//                 setSummary={stableSsetSummary}
//                 setFollowUpQuestions={stableSetFollowUpQuestions}
//                 setIsSummaryPopupOpen={setIsSummaryPopupOpen}
//                 isMobile={isMobile}
//                 setSelectedDocuments={setSelectedDocuments}
//                 selectedDocuments={selectedDocuments}
//                 className="w-full"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// Dashboard.propTypes = {
//   isSidebarOpen: PropTypes.bool,
//   selectedDocuments: PropTypes.arrayOf(PropTypes.string),
// };

// export default Dashboard;

//Document Q/A parent component
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Menu, ChevronRight, ChevronLeft, X } from 'lucide-react';
import Header from '../../components/dashboard/Header';
import Sidebar from '../../components/dashboard/Sidebar';
import MainContent from '../../components/dashboard/MainContent';
import backgroundImage from '../../assets/bg-main.jpg';


const Dashboard = () => {
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
      } else {
        setIsSidebarOpen(true); // Keep sidebar open on desktop
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

  const handleNewChat = () => {
    // Reset relevant states
    setSelectedChat(null);
    setSelectedDocument(null);
    setSummary('');
    setFollowUpQuestions([]);
    setSelectedDocuments([]);
  };

  const handleSendMessage = async (message, documents) => {
    console.log('Sending message:', message);
    console.log('With documents:', documents);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden">
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
      <Header />
      
      <div className="flex flex-1 relative">
        {/* Mobile Overlay for Sidebar */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40" 
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`
            fixed z-50 
            top-20  
            text-white p-2 
            ${isMobile 
              ? 'left-0 rounded-r-lg' 
              : isSidebarOpen 
                ? 'left-[330px] rounded-l-none' 
                : 'left-0 rounded-r-lg'}
            shadow-lg
            transition-all duration-300 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500
            hover:opacity-90
          `}
          aria-label={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {isSidebarOpen ? 
            (isMobile ? <X size={24} /> : <ChevronLeft size={24} className="text-gray-300" />) : 
            <Menu size={24} />
          }
        </button>

        {/* Responsive Layout Container */}
        <div className="flex flex-1 overflow-hidden w-full">
          <Sidebar
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
          />
          
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
              ${!isMobile && isSidebarOpen 
                ? 'px-0 max-w-[calc(100%-330px)]' 
                : 'pl-0 max-w-full'
              }
            `}
          >
            <div 
              className={`
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
              `}
            >
              <MainContent
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  isSidebarOpen: PropTypes.bool,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string),
};

export default Dashboard;