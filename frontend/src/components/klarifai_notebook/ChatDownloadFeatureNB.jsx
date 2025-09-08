// ChatDownloadFeature.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  X,
  Settings,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  Check,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { chatServiceNB } from "../../utils/axiosConfig";
import { processChatContent } from "../../utils/chatContentProcessor";
import PropTypes from "prop-types";

// Custom date picker styles - to make the calendar smaller
import "../dashboard/datepicker-custom.css";

const ChatDownloadFeatureNB = ({
  chatHistory,
  activeConversationId,
  mainProjectId,
  className,
}) => {
  // State for download menu
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  // State for date range picker
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);

  // State for multi-chat download
  const [selectedChats, setSelectedChats] = useState([]);
  const [showChatSelection, setShowChatSelection] = useState(false);

  // State for customization options
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [options, setOptions] = useState({
    includeTimestamps: true,
    includeChatMetadata: true,
    includeFollowUpQuestions: true,
    formatCode: true,
  });

  // Create refs for click-outside detection
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Reset selected chats when dropdown closes
  useEffect(() => {
    if (!isDownloadMenuOpen) {
      setShowChatSelection(false);
    }
  }, [isDownloadMenuOpen]);

  // Auto-select active conversation if it exists
  useEffect(() => {
    if (showChatSelection && activeConversationId) {
      // Only keep the current active conversation selected
      setSelectedChats([activeConversationId]);
    }
  }, [activeConversationId, showChatSelection]);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isDownloadMenuOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        // Don't close if clicking on a react-datepicker element
        if (
          event.target.closest(".react-datepicker") ||
          event.target.closest(".react-datepicker__portal")
        ) {
          return;
        }
        setIsDownloadMenuOpen(false);
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDownloadMenuOpen]);

  // Handle option toggle
  const handleOptionChange = (option) => {
    setOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  // Function to toggle chat selection
  const toggleChatSelection = (chatId) => {
    setSelectedChats((prev) => {
      if (prev.includes(chatId)) {
        return prev.filter((id) => id !== chatId);
      } else {
        return [...prev, chatId];
      }
    });
  };

  // Function to download multiple selected chats
  const handleDownloadSelectedChats = async () => {
    if (selectedChats.length === 0) {
      toast.error("Please select at least one chat");
      return;
    }

    setIsLoading(true);
    toast.info(`Exporting ${selectedChats.length} chats...`);

    try {
      // Process all selected chats
      const processedChats = selectedChats
        .map((chatId) => {
          const chat = chatHistory.find((c) => c.conversation_id === chatId);

          if (!chat) {
            console.error(`Chat with ID ${chatId} not found in history`);
            return null;
          }

          // Process each message in the chat
          const processedMessages = chat.messages.map((msg) => {
            return {
              ...msg,
              // Only process assistant messages (keep user messages as-is)
              content:
                msg.role === "assistant"
                  ? processChatContent(msg.content)
                  : msg.content,
            };
          });

          return {
            ...chat,
            messages: processedMessages,
          };
        })
        .filter((chat) => chat !== null);

      // Send the processed chats to the backend
      const response = await chatServiceNB.exportChatAsDocx(
        {
          chats: processedChats,
          options,
        },
        { responseType: "blob" }
      );

      // Rest of the download handling remains the same...
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const chatTitle = processedChats[0].title || "Chat";
      const safeTitle = chatTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const date = new Date(processedChats[0].created_at)
        .toISOString()
        .split("T")[0];
      link.setAttribute("download", `${safeTitle}_${date}.docx`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Successfully exported ${selectedChats.length} chats`);
      setIsDownloadMenuOpen(false);
      setSelectedChats([]);
    } catch (error) {
      console.error("Error in batch chat export:", error);
      toast.error("Failed to export some chats");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate and download multiple chats as DOCX by date range
  // Function to generate and download multiple chats as DOCX by date range
  const generateMultiChatDocx = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a date range");
      return;
    }

    try {
      setIsLoading(true);

      // Filter chats by date range on the frontend
      const filteredChats = chatHistory.filter((chat) => {
        const chatDate = new Date(chat.created_at);
        return chatDate >= startDate && chatDate <= endDate;
      });

      if (filteredChats.length === 0) {
        toast.error("No chats found in the selected date range");
        return;
      }

      // Process filtered chats (same logic as handleDownloadSelectedChats)
      const processedChats = filteredChats.map((chat) => {
        const processedMessages = chat.messages.map((msg) => {
          return {
            ...msg,
            content:
              msg.role === "assistant"
                ? processChatContent(msg.content)
                : msg.content,
          };
        });

        return {
          ...chat,
          messages: processedMessages,
        };
      });

      // Send processed chats to backend (same as selected chats)
      const response = await chatServiceNB.exportChatAsDocx(
        {
          chats: processedChats,
          options,
        },
        { responseType: "blob" }
      );

      // Rest of the download handling remains the same...
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const adjustedStartDate = new Date(startDate);
      adjustedStartDate.setDate(adjustedStartDate.getDate() + 1);
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

      const startDateStr = adjustedStartDate.toISOString().split("T")[0];
      const endDateStr = adjustedEndDate.toISOString().split("T")[0];
      link.setAttribute(
        "download",
        `Chats_${startDateStr}_to_${endDateStr}.docx`
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Successfully exported ${filteredChats.length} chats`);
      setIsDownloadMenuOpen(false);
    } catch (error) {
      console.error("Error generating multi-chat DOCX:", error);
      toast.error("Failed to export chats");
    } finally {
      setIsLoading(false);
    }
  };
  function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  // Toggle all chats selection
  const toggleAllChats = () => {
    if (selectedChats.length === chatHistory.length) {
      setSelectedChats([]);
    } else {
      setSelectedChats(chatHistory.map((chat) => chat.conversation_id));
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-center items-center w-full">
        <button
          ref={buttonRef}
          onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg
      bg-white/90 hover:bg-[#f5e6d8]
      dark:bg-gradient-to-r dark:from-gray-800/80 dark:to-gray-700/70
      dark:hover:from-blue-600/80 dark:hover:to-blue-700/70
      text-[#5e4636] dark:text-white transition-all duration-200
      border border-[#d6cbbf] hover:border-[#a68a70]
      dark:border-gray-600/30 dark:hover:border-blue-500/50
      shadow-sm hover:shadow-md ${className}`}
          title="Download Chat"
        >
          <Download size={18} className="text-[#a55233] dark:text-blue-400" />
          <span className="text-sm font-medium flex-grow text-left">
            Export Chats
          </span>
          {isDownloadMenuOpen ? (
            <ChevronDown
              size={16}
              className="text-[#5a544a] dark:text-gray-400"
            />
          ) : (
            <ChevronUp
              size={16}
              className="text-[#5a544a] dark:text-gray-400"
            />
          )}
        </button>
      </div>

      {/* Download Options Menu - Redesigned for Sidebar */}
      {isDownloadMenuOpen && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-2 left-0 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl z-50 border border-[#e8ddcc] dark:border-gray-700/50 max-h-[80vh] overflow-y-auto custom-scrollbar"
        >
          <div className="p-3 bg-gradient-to-r from-[#a55233] to-[#cd6f47] dark:from-blue-800/80 dark:to-blue-600/80 text-white flex justify-between items-center rounded-t-lg">
            <h3 className="font-medium text-sm">Export Options</h3>
            <button
              onClick={() => setIsDownloadMenuOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-[#884325]/30 dark:hover:bg-blue-500/30"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-3 flex flex-col gap-3">
            {/* Select Chats Option */}
            <div className="border border-[#e8ddcc] dark:border-gray-700/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowChatSelection(!showChatSelection)}
                className="w-full p-3 flex items-center justify-between hover:bg-[#f5e6d8] dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileText
                    size={18}
                    className="text-[#a55233] dark:text-blue-400"
                  />
                  <span className="text-sm text-[#5e4636] dark:text-gray-300">
                    Select Chats
                  </span>
                  {selectedChats.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-[#a55233] dark:bg-blue-600 text-white text-xs rounded-full">
                      {selectedChats.length}
                    </span>
                  )}
                </div>
                {showChatSelection ? (
                  <ChevronDown
                    size={16}
                    className="text-[#5a544a] dark:text-gray-400"
                  />
                ) : (
                  <ChevronUp
                    size={16}
                    className="text-[#5a544a] dark:text-gray-400"
                  />
                )}
              </button>

              {showChatSelection && (
                <div className="p-3 pt-0 border-t border-[#e3d5c8] dark:border-gray-700/50 bg-[#faf4ee]/50 dark:bg-gray-800/20">
                  {/* Select All Option */}
                  <div className="mb-2 pt-3">
                    <button
                      onClick={toggleAllChats}
                      className="text-xs text-[#a55233] hover:text-[#884325] dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      {selectedChats.length === chatHistory.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>

                  {/* List of Chats with improved scrolling */}
                  <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                    {chatHistory.length === 0 ? (
                      <div className="text-[#5a544a] dark:text-gray-400 text-center py-2 text-sm">
                        No chats available
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {chatHistory.map((chat) => (
                          <div
                            key={chat.conversation_id}
                            onClick={() =>
                              toggleChatSelection(chat.conversation_id)
                            }
                            className={`
                              flex items-center gap-2 p-2 rounded-lg cursor-pointer
                              ${
                                selectedChats.includes(chat.conversation_id)
                                  ? "bg-[#a55233]/10 border border-[#a55233]/30 dark:bg-blue-600/20 dark:border-blue-500/30"
                                  : "hover:bg-[#f5e6d8] dark:hover:bg-gray-700/30"
                              }
                              transition-all
                            `}
                          >
                            <div
                              className={`
                              w-4 h-4 rounded-sm border flex items-center justify-center
                              ${
                                selectedChats.includes(chat.conversation_id)
                                  ? "bg-[#a55233] border-[#a55233] dark:bg-blue-500 dark:border-blue-500"
                                  : "border-[#a68a70] dark:border-gray-500"
                              }
                            `}
                            >
                              {selectedChats.includes(chat.conversation_id) && (
                                <Check size={12} className="text-white" />
                              )}
                            </div>
                            <div className="flex-grow overflow-hidden">
                              <div className="truncate text-sm dark:text-gray-300 text-[#5e4636]">
                                {chat.title || "Untitled Conversation"}
                              </div>
                              <div className="text-xs text-[#5a544a] dark:text-gray-400">
                                {formatRelativeDate(chat.created_at)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Download Selected Button */}
                  <button
                    onClick={handleDownloadSelectedChats}
                    disabled={isLoading || selectedChats.length === 0}
                    className={`w-full py-2 mt-3 rounded text-white text-sm flex items-center justify-center gap-2
                      ${
                        selectedChats.length === 0
                          ? "bg-[#d6cbbf] cursor-not-allowed dark:bg-blue-800/50"
                          : "bg-[#a55233] hover:bg-[#884325] dark:bg-blue-600 dark:hover:bg-blue-700"
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
                        <span>
                          {selectedChats.length === 1
                            ? "Download Chat"
                            : "Download Selected Chats"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Date Range Selection */}
            <div className="border border-[#e8ddcc] dark:border-gray-700/50 rounded-lg p-3 hover:border-[#a68a70] dark:hover:border-blue-500/50 transition-colors hover:bg-[#f5e6d8]/50 dark:hover:bg-gray-800/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm flex items-center gap-2 dark:text-gray-300 text-[#5e4636]">
                  <Calendar
                    size={18}
                    className="text-[#a55233] dark:text-blue-400"
                  />
                  <span>By Date Range</span>
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-[#5a544a] dark:text-gray-400 block mb-1">
                    Start
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    maxDate={endDate || new Date()}
                    placeholderText="Start date"
                    className="w-full p-1.5 border border-[#e8ddcc] dark:border-gray-700 rounded bg-white/80 dark:bg-gray-800 text-[#5e4636] dark:text-white text-sm"
                    popperClassName="date-picker-small"
                    popperPlacement="bottom-start"
                    popperModifiers={[
                      {
                        name: "offset",
                        options: {
                          offset: [0, 5],
                        },
                      },
                      {
                        name: "preventOverflow",
                        options: {
                          rootBoundary: "viewport",
                          padding: 8,
                        },
                      },
                    ]}
                    calendarClassName="calendar-small"
                    dayClassName={() => "day-small"}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#5a544a] dark:text-gray-400 block mb-1">
                    End
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate}
                    maxDate={new Date()}
                    placeholderText="End date"
                    className="w-full p-1.5 border border-[#e8ddcc] dark:border-gray-700 rounded bg-white/80 dark:bg-gray-800 text-[#5e4636] dark:text-white text-sm"
                    popperClassName="date-picker-small"
                    popperPlacement="bottom-end"
                    popperModifiers={[
                      {
                        name: "offset",
                        options: {
                          offset: [0, 5],
                        },
                      },
                      {
                        name: "preventOverflow",
                        options: {
                          rootBoundary: "viewport",
                          padding: 8,
                        },
                      },
                    ]}
                    calendarClassName="calendar-small"
                    dayClassName={() => "day-small"}
                  />
                </div>
              </div>

              <button
                onClick={generateMultiChatDocx}
                disabled={isLoading || !startDate || !endDate}
                className={`w-full py-2 rounded text-white text-sm flex items-center justify-center gap-2
                  ${
                    !startDate || !endDate
                      ? "bg-[#d6cbbf] cursor-not-allowed dark:bg-blue-800/50"
                      : "bg-[#a55233] hover:bg-[#884325] dark:bg-blue-600 dark:hover:bg-blue-700"
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
                    <span>Generate Document</span>
                  </>
                )}
              </button>
            </div>

            {/* Customization Options */}
            <div className="border border-[#e8ddcc] dark:border-gray-700/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setIsCustomizationOpen(!isCustomizationOpen)}
                className="w-full p-3 flex items-center justify-between hover:bg-[#f5e6d8] dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings
                    size={18}
                    className="text-[#a55233] dark:text-blue-400"
                  />
                  <span className="text-sm dark:text-gray-300 text-[#5e4636]">
                    Options
                  </span>
                </div>
                {isCustomizationOpen ? (
                  <ChevronDown
                    size={16}
                    className="text-[#5a544a] dark:text-gray-400"
                  />
                ) : (
                  <ChevronUp
                    size={16}
                    className="text-[#5a544a] dark:text-gray-400"
                  />
                )}
              </button>

              {isCustomizationOpen && (
                <div className="p-3 pt-0 border-t border-[#e3d5c8] dark:border-gray-700/50 bg-[#faf4ee]/50 dark:bg-gray-800/20">
                  <div className="space-y-1">
                    <label className="flex items-center gap-2.5 cursor-pointer py-1 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/30 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={options.includeTimestamps}
                        onChange={() => handleOptionChange("includeTimestamps")}
                        className="rounded text-[#a55233] dark:text-blue-600 w-4 h-4"
                      />
                      <span className="text-sm dark:text-gray-300 text-[#5e4636]">
                        Include Timestamps
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer py-1 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/30 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={options.includeChatMetadata}
                        onChange={() =>
                          handleOptionChange("includeChatMetadata")
                        }
                        className="rounded text-[#a55233] dark:text-blue-600 w-4 h-4"
                      />
                      <span className="text-sm dark:text-gray-300 text-[#5e4636]">
                        Include Chat Metadata
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer py-1 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/30 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={options.includeFollowUpQuestions}
                        onChange={() =>
                          handleOptionChange("includeFollowUpQuestions")
                        }
                        className="rounded text-[#a55233] dark:text-blue-600 w-4 h-4"
                      />
                      <span className="text-sm dark:text-gray-300 text-[#5e4636]">
                        Include Follow-up Questions
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer py-1 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/30 px-2 rounded">
                      <input
                        type="checkbox"
                        checked={options.formatCode}
                        onChange={() => handleOptionChange("formatCode")}
                        className="rounded  text-[#a55233] dark:text-blue-600 w-4 h-4"
                      />
                      <span className="text-sm dark:text-gray-300 text-[#5e4636]">
                        Format Code Blocks
                      </span>
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

ChatDownloadFeatureNB.propTypes = {
  chatHistory: PropTypes.array,
  activeConversationId: PropTypes.string,
  mainProjectId: PropTypes.string,
  className: PropTypes.string,
};

export default ChatDownloadFeatureNB;
