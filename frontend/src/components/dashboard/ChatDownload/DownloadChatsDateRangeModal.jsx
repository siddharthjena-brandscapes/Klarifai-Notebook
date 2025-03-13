import React, { useState } from "react";
import PropTypes from "prop-types";
import { X, Download, FileText, File, Database, Table, Calendar } from "lucide-react";
import { chatService } from "../../../utils/axiosConfig";
import { toast } from "react-toastify";

const DownloadChatsDateRangeModal = ({ isOpen, onClose, mainProjectId }) => {
  const [selectedFormat, setSelectedFormat] = useState("txt");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // Calculate default max date (today)
  const today = new Date().toISOString().split("T")[0];

  const handleDownload = async () => {
    // Validate dates
    if (!startDate) {
      toast.warning("Please select a start date");
      return;
    }

    try {
      setIsDownloading(true);
      
      const dateRange = {
        start_date: startDate,
        end_date: endDate || today // Use today if no end date is selected
      };
      
      await chatService.downloadChatsByDateRange(
        dateRange,
        mainProjectId,
        selectedFormat
      );
      
      toast.success(`Chats downloaded successfully in ${selectedFormat.toUpperCase()} format`);
      onClose();
    } catch (error) {
      console.error("Download failed:", error);
      
      // Check if it's a "No conversations found" error
      if (error.response && error.response.status === 404) {
        toast.warning("No conversations found within the selected date range");
      } else {
        toast.error("Failed to download chats. Please try again.");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 border border-blue-500/20 rounded-xl shadow-2xl p-4 w-full max-w-md transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Download Chats by Date</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full"
          >
            <X className="h-5 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Select a date range to download all chat conversations within that period.
          </p>

          {/* Date Range Selection */}
          <div className="space-y-3 mb-6">
            <div className="flex flex-col">
              <label className="text-white mb-2 flex items-center text-sm font-medium">
                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today}
                className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-white mb-2 flex items-center text-sm font-medium">
                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                End Date (optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={today}
                min={startDate}
                className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400 mt-1">
                If not specified, today's date will be used
              </span>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-3 mb-4">
            <p className="text-white text-sm font-medium mb-2">Select Format</p>
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
                  selectedFormat === "json"
                    ? "bg-blue-600/30 border border-blue-500/50"
                    : "bg-gray-800/50 hover:bg-gray-700/50"
                }
              `}
              onClick={() => setSelectedFormat("json")}
            >
              <div className="flex items-center">
                <div className="w-6 h-6 mr-3">
                  <input
                    type="radio"
                    checked={selectedFormat === "json"}
                    onChange={() => setSelectedFormat("json")}
                    className="w-5 h-5 accent-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">JSON (.json)</div>
                  <div className="text-sm text-gray-300">
                    Structured data format
                  </div>
                </div>
                <Database className="h-6 w-6 text-green-400" />
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

DownloadChatsDateRangeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mainProjectId: PropTypes.string.isRequired,
};

export default DownloadChatsDateRangeModal;