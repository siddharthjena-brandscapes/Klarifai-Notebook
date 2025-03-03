import React, { useState } from "react";
import PropTypes from "prop-types";
import { Download, Calendar, MessageCircle } from "lucide-react";
import DownloadChatModal from "./DownloadChatModal";
import DownloadChatsDateRangeModal from "./DownloadChatsDateRangeModal";

const ChatDownloadMenu = ({ 
  isOpen, 
  activeConversation, 
  mainProjectId, 
  className 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSingleChatModal, setShowSingleChatModal] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSingleChatDownload = () => {
    setIsMenuOpen(false);
    setShowSingleChatModal(true);
  };

  const handleDateRangeDownload = () => {
    setIsMenuOpen(false);
    setShowDateRangeModal(true);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={toggleMenu}
          className="text-gray-300 hover:text-white transition-colors hover:bg-gray-700/50 p-2 rounded-lg flex items-center gap-2"
          title="Download Chats"
        >
          <Download className="h-5 w-5" />
          <span>Download Chat</span>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-64 bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 border border-blue-500/20 rounded-lg shadow-2xl p-2 transform transition-all">
            <div className="p-1">
              <button
                onClick={handleSingleChatDownload}
                disabled={!activeConversation}
                className={`
                  w-full text-left px-4 py-2 hover:bg-gray-700/50 
                  flex items-center gap-2 rounded-lg
                  ${!activeConversation ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700/50'}
                `}
              >
                <MessageCircle className="h-4 w-4 text-blue-400" />
                <div>
                  <div className="text-white font-medium">Current Conversation</div>
                  <div className="text-xs text-gray-400">
                    Download the active chat
                  </div>
                </div>
              </button>

              <button
                onClick={handleDateRangeDownload}
                className="w-full text-left px-4 py-2 hover:bg-gray-700/50 flex items-center gap-2 rounded-lg"
              >
                <Calendar className="h-4 w-4 text-green-400" />
                <div>
                  <div className="text-white font-medium">Date Range</div>
                  <div className="text-xs text-gray-400">
                    Download multiple chats
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Single Chat Download Modal */}
      <DownloadChatModal
        isOpen={showSingleChatModal}
        onClose={() => setShowSingleChatModal(false)}
        conversation={activeConversation}
        mainProjectId={mainProjectId}
      />

      {/* Date Range Download Modal */}
      <DownloadChatsDateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        mainProjectId={mainProjectId}
      />
    </>
  );
};

ChatDownloadMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  activeConversation: PropTypes.object,
  mainProjectId: PropTypes.string.isRequired,
  className: PropTypes.string,
};

ChatDownloadMenu.defaultProps = {
  className: "",
  activeConversation: null,
};

export default ChatDownloadMenu;