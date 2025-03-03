import React, { useState } from "react";
import PropTypes from "prop-types";
import { Download } from "lucide-react";
import DownloadChatModal from "./DownloadChatModal";

const ChatDownloadButton = ({ conversation, mainProjectId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!conversation || !conversation.conversation_id) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-blue-500/20 transition-colors"
        title="Download Conversation"
      >
        <Download className="h-5 w-5" />
      </button>

      <DownloadChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        conversation={conversation}
        mainProjectId={mainProjectId}
      />
    </>
  );
};

ChatDownloadButton.propTypes = {
  conversation: PropTypes.shape({
    conversation_id: PropTypes.string,
    title: PropTypes.string,
  }),
  mainProjectId: PropTypes.string.isRequired,
};

export default ChatDownloadButton;