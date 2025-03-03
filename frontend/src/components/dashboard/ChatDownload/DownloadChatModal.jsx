import React, { useState } from "react";
import PropTypes from "prop-types";
import { X, Download, FileText, File, Database, Table } from "lucide-react";
import { chatService } from "../../../utils/axiosConfig";
import { toast } from "react-toastify";

const DownloadChatModal = ({ isOpen, onClose, conversation, mainProjectId }) => {
  const [selectedFormat, setSelectedFormat] = useState("txt");
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      await chatService.downloadSingleChat(
        conversation.conversation_id,
        mainProjectId,
        selectedFormat
      );
      
      toast.success(`Chat downloaded successfully in ${selectedFormat.toUpperCase()} format`);
      onClose();
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download chat. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 border border-blue-500/20 rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Download Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-blue-300 font-medium mb-2">
            Conversation: {conversation?.title || "Untitled Chat"}
          </p>
          <p className="text-gray-300 mb-4">
            Select a format to download this chat conversation.
          </p>

          <div className="space-y-3 mb-4">
            <div
              className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${
                  selectedFormat === "txt"
                    ? "bg-blue-600/30 border border-blue-500/50"
                    : "bg-gray-800/50 hover:bg-gray-700/50"
                }
              `}
              onClick={() => setSelectedFormat("txt")}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 mr-3">
                  <input
                    type="radio"
                    checked={selectedFormat === "txt"}
                    onChange={() => setSelectedFormat("txt")}
                    className="w-5 h-5 accent-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Text (.txt)</div>
                  <div className="text-sm text-gray-300">
                    Simple, readable text format
                  </div>
                </div>
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
            </div>

            <div
              className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${
                  selectedFormat === "pdf"
                    ? "bg-blue-600/30 border border-blue-500/50"
                    : "bg-gray-800/50 hover:bg-gray-700/50"
                }
              `}
              onClick={() => setSelectedFormat("pdf")}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 mr-3">
                  <input
                    type="radio"
                    checked={selectedFormat === "pdf"}
                    onChange={() => setSelectedFormat("pdf")}
                    className="w-5 h-5 accent-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">PDF (.pdf)</div>
                  <div className="text-sm text-gray-300">
                    Professional document format
                  </div>
                </div>
                <File className="h-6 w-6 text-red-400" />
              </div>
            </div>

            

            <div
              className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${
                  selectedFormat === "csv"
                    ? "bg-blue-600/30 border border-blue-500/50"
                    : "bg-gray-800/50 hover:bg-gray-700/50"
                }
              `}
              onClick={() => setSelectedFormat("csv")}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 mr-3">
                  <input
                    type="radio"
                    checked={selectedFormat === "csv"}
                    onChange={() => setSelectedFormat("csv")}
                    className="w-5 h-5 accent-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">CSV (.csv)</div>
                  <div className="text-sm text-gray-300">
                    Spreadsheet compatible format
                  </div>
                </div>
                <Table className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`
              px-4 py-2 rounded-lg text-white
              flex items-center space-x-2
              ${
                isDownloading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600"
              }
              transition-all duration-300
            `}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

DownloadChatModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  conversation: PropTypes.shape({
    conversation_id: PropTypes.string.isRequired,
    title: PropTypes.string,
  }),
  mainProjectId: PropTypes.string.isRequired,
};

export default DownloadChatModal;