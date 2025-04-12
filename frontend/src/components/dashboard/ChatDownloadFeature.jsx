import React, { useState } from 'react';
import { Download, X, Settings, ChevronDown, ChevronUp, Calendar, FileText } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import { chatService } from '../../utils/axiosConfig';
import PropTypes from 'prop-types';

const ChatDownloadFeature = ({ 
  currentChatData, 
  chatHistory,
  activeConversationId,
  mainProjectId, 
  className 
}) => {
  // State for download menu
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  
  // State for date range picker
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  
  // State for customization options
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [options, setOptions] = useState({
    includeTimestamps: true,
    includeChatMetadata: true,
    includeFollowUpQuestions: true,
    formatCode: true
  });

  // Handle option toggle
  const handleOptionChange = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Function to download current chat as PDF
  const handleDownloadCurrentChat = async () => {
    if (!currentChatData || !activeConversationId) {
      toast.error('No active conversation to download');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await chatService.exportChatAsPdf({
        conversation_id: activeConversationId,
        options
      }, { responseType: 'blob' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // Set the download filename
      const chatTitle = currentChatData.title || 'Chat';
      const safeTitle = chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${safeTitle}_${date}.pdf`);
      
      // Append to the document body and click
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Chat exported successfully');
      setIsDownloadMenuOpen(false);
      
    } catch (error) {
      console.error('Error downloading chat:', error);
      toast.error('Failed to download chat');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate and download multiple chats as PDF
  const generateMultiChatPdf = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select a date range');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await chatService.exportChatAsPdf({
        date_range: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        main_project_id: mainProjectId,
        options
      }, { responseType: 'blob' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      
      // Set the download filename - FIXED DATE FORMATTING
      // Format the date without timezone conversion to prevent off-by-one errors
      const formatDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const startDateStr = formatDateString(startDate);
      const endDateStr = formatDateString(endDate);
      link.setAttribute('download', `Chats_${startDateStr}_to_${endDateStr}.pdf`);
      
      // Append to the document body and click
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Chats exported successfully');
      setIsDownloadMenuOpen(false);
      
    } catch (error) {
      console.error('Error generating multi-chat PDF:', error);
      toast.error('Failed to export chats');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Download Button */}
      <button
        onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 ${className}`}
        title="Download Chat"
      >
        <Download size={16} />
        <span className="hidden sm:inline">Download</span>
      </button>

      {/* Download Options Menu */}
      {isDownloadMenuOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-gray-900 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex justify-between items-center">
            <h3 className="font-semibold">Export Options</h3>
            <button
              onClick={() => setIsDownloadMenuOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* Current Chat Download */}
            <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
              <button
                onClick={handleDownloadCurrentChat}
                disabled={isLoading || !currentChatData}
                className={`w-full flex items-center justify-between ${!currentChatData ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <span>Download Current Chat</span>
                </div>
                <Download size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Date Range Selection */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar size={18} className="text-blue-600" />
                  <span>Download by Date Range</span>
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-50">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    maxDate={endDate || new Date()}
                    placeholderText="Select start date"
                    className="w-full p-2 border rounded bg-gray-900 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-50">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate}
                    maxDate={new Date()}
                    placeholderText="Select end date"
                    className="w-full p-2 border rounded bg-gray-900 text-white text-sm"
                  />
                </div>
              </div>

              <button
                onClick={generateMultiChatPdf}
                disabled={isLoading || !startDate || !endDate}
                className={`w-full py-2 rounded text-white flex items-center justify-center gap-2
                  ${
                    !startDate || !endDate
                      ? "bg-blue-700 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Generate PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* PDF Customization Options */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setIsCustomizationOpen(!isCustomizationOpen)}
                className="w-full p-3 flex items-center justify-between hover:bg-blue-950 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-blue-600" />
                  <span>Customization Options</span>
                </div>
                {isCustomizationOpen ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {isCustomizationOpen && (
                <div className="p-3 pt-0 border-t">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeTimestamps}
                        onChange={() => handleOptionChange("includeTimestamps")}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">Include Timestamps</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeChatMetadata}
                        onChange={() =>
                          handleOptionChange("includeChatMetadata")
                        }
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">Include Chat Metadata</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeFollowUpQuestions}
                        onChange={() =>
                          handleOptionChange("includeFollowUpQuestions")
                        }
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">
                        Include Follow-up Questions
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.formatCode}
                        onChange={() => handleOptionChange("formatCode")}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">Format Code Blocks</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ChatDownloadFeature.propTypes = {
  currentChatData: PropTypes.object,
  chatHistory: PropTypes.array,
  activeConversationId: PropTypes.string,
  mainProjectId: PropTypes.string,
  className: PropTypes.string
};

export default ChatDownloadFeature;