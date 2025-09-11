import React from "react";
import { Paperclip, FilePlus, Mic, Loader, X, Send, ScrollText, MessageCircle, Layers, Globe, Database } from "lucide-react";
import PropTypes from "prop-types";
 
const ChatInputArea = ({
  message,
  setMessage,
  pastedImages,
  setPastedImages,
  imagePreviews,
  setImagePreviews,
  hasImages,
  setHasImages,
  fileInputRef,
  isLoading,
  onSendClick,
  onPaste,
  onMicInput,
  onOpenYouTubeModal,
  onChatInputFocus,
  handleFileChange,
  contextMode,
  propSelectedDocuments,
  useWebKnowledge,
  toggleWebKnowledge,
  responseLength,
  setResponseLength,
  ResponseLengthToggle,
  isDocumentProcessing,
  hasUploadPermissions,
  removeImage,
  textSize,
  isRecording,
  currentView,
  toggleView,
  isSummaryGenerating,
}) => (
  <div className="flex flex-col w-full">
    {/* Image Preview Section */}
    {hasImages && imagePreviews.length > 0 && (
      <div className="mb-3 p-3 bg-white/50 dark:bg-gray-800/20 rounded-xl border border-[#d6cbbf] dark:border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#5e4636] dark:text-gray-300">
            Pasted Images ({imagePreviews.length})
          </span>
          <button
            onClick={() => {
              setPastedImages([]);
              setImagePreviews([]);
              setHasImages(false);
            }}
            className="text-[#8c715f] dark:text-gray-400 hover:text-red-500 transition-colors"
            title="Clear all images"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {imagePreviews.map((src, idx) => (
            <div key={idx} className="relative group">
              <img
                src={src}
                alt={`pasted-${idx}`}
                className="w-16 h-16 object-cover rounded-lg border border-[#d6cbbf] dark:border-blue-500/20"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
    {/* Input field */}
    <div className="w-full relative bg-white dark:bg-gray-900/20 rounded-xl transition-colors overflow-hidden mb-2 border border-[#d6cbbf] dark:border-blue-500/20 focus-within:border-[#887d4e] dark:focus-within:border-blue-400/40 shadow-sm">
      <textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          e.target.style.height = "inherit";
          const scrollHeight = e.target.scrollHeight;
          const maxHeight = 100;
          e.target.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }}
        onKeyPress={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSendClick();
          }
        }}
        onPaste={onPaste}
        placeholder={
          hasImages
            ? "Ask a question about your pasted images..."
            : propSelectedDocuments.length === 0
            ? "Please select a document to start the conversation..."
            : useWebKnowledge
            ? "Ask me about your documents with web assistance..."
            : "Ask me about your documents..."
        }
        onFocus={onChatInputFocus}
        className="w-full bg-transparent text-[#5e4636] dark:text-white font-medium py-2 px-3 text-sm focus:outline-none resize-none overflow-y-auto min-h-[36px] max-h-[100px] custom-scrollbar custom-textarea chat-input-area placeholder:text-[#8c715f]/80 placeholder:tracking-wider dark:placeholder:text-gray-400"
        disabled={isLoading}
        style={{ scrollbarWidth: "thin" }}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept=".pdf, .docx, .txt,  .mp3, .mp4"
      />
    </div>
    {/* Icons and buttons row */}
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-2">
        {hasUploadPermissions && (
          <button
            title={
              isDocumentProcessing
                ? "Please wait for current upload to finish"
                : "Upload documents"
            }
            onClick={() => {
              if (!isDocumentProcessing) fileInputRef.current?.click();
            }}
            className={`text-[#5a544a] dark:text-gray-400 hover:text-[#a55233] dark:hover:text-white transition-colors p-1 rounded-full
              ${isDocumentProcessing ? "opacity-50 cursor-not-allowed" : ""}
            `}
            disabled={isDocumentProcessing}
            style={{ position: "relative" }}
          >
            <Paperclip className="h-4 w-4" />
            {isDocumentProcessing && (
              <Loader className="h-3 w-3 ml-1 animate-spin absolute right-0 top-0" />
            )}
          </button>
        )}
        {/* <button
          title="Add sources from URL, YouTube, or Text"
          onClick={onOpenYouTubeModal}
          className="text-[#5a544a] dark:text-gray-400 hover:text-[#a55233] dark:hover:text-white transition-colors p-1 rounded-full"
        >
          <FilePlus className="h-4 w-4" />
        </button> */}
        {!message && !hasImages && (
          <button
            onClick={onMicInput}
            className={`relative text-[#5a544a] dark:text-gray-400 transition-colors p-1 rounded-full ${
              isRecording
                ? "text-red-500 bg-red-500/10"
                : "hover:text-[#a55233] dark:hover:text-white"
            }`}
            title="Voice input"
          >
            <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`} />
            {isRecording && (
              <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        )}
        <button
          title={currentView === "chat" ? "View Summary" : "View Chat"}
          onClick={() => toggleView(currentView === "chat" ? "summary" : "chat")}
          className="text-[#5a544a] dark:text-gray-400 hover:text-[#a55233] dark:hover:text-white transition-colors p-1 rounded-full"
        >
          {currentView === "chat" ? (
           <div className="relative"> {/* Added wrapper div */}
      <ScrollText className="h-4 w-4" />
      {isSummaryGenerating && (
        <span className="absolute -top-2 -right-2"> {/* Adjusted position */}
          <Loader className="h-3 w-3 animate-spin text-[#a55233] dark:text-blue-400" />
        </span>
      )}
    </div>
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
        </button>
        {propSelectedDocuments.length > 0 && !hasImages ? (
          <button
            onClick={toggleWebKnowledge}
            title={
              useWebKnowledge
                ? "Answers from documents and web knowledge"
                : "Answers from documents only"
            }
            className={`
              flex items-center justify-center gap-1 px-2 py-1 rounded-lg transition-all duration-300 text-xs
              ${useWebKnowledge
                ? "bg-[#caeaf9] dark:bg-gradient-to-r dark:from-purple-600/70 dark:to-blue-500/70 dark:text-white shadow-sm"
                : "bg-white/80 dark:bg-gray-900 text-[#381c0f] dark:text-gray-300 hover:bg-[#ddd9c5]/10 border border-[#d6cbbf] dark:border-blue-500/20 shadow-sm"
              }
            `}
          >
            {contextMode === "image" ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs">
                <Layers className="h-3 w-3" />
                Image
              </span>
            ) : useWebKnowledge ? (
              <>
                <Globe className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">Web</span>
              </>
            ) : (
              <>
                <Database className="h-3 w-3 dark:text-blue-400" />
                <span className="hidden sm:inline text-xs">Context-only</span>
              </>
            )}
          </button>
        ) : (
          <button
            title={hasImages ? "Image mode active" : "Web mode active (no documents selected)"}
            className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-[#caeaf9] dark:bg-gray-900/80 text-[#5a544a] dark:text-gray-300 border border-[#d6cbbf] dark:border-blue-500/20 text-xs cursor-default shadow-sm"
            disabled
          >
            <Globe className="h-3 w-3 dark:text-blue-400" />
            <span className="hidden sm:inline text-xs">
              {hasImages ? "Image" : "Web"}
            </span>
          </button>
        )}
        {!hasImages && (
          <ResponseLengthToggle
            responseLength={responseLength}
            setResponseLength={setResponseLength}
            className="bg-white/80 dark:bg-gray-900/10 text-[#5e4636] dark:text-gray-300 hover:bg-[#f5e6d8] dark:hover:bg-gray-800/90 border-[#d6cbbf] dark:border-blue-500/20 border shadow-sm"
            activeClassName="bg-[#556052] dark:bg-gradient-to-r dark:from-purple-600/70 dark:to-blue-500/70 text-white dark:text-white border-transparent shadow-sm"
          />
        )}
      </div>
      <button
        onClick={onSendClick}
        disabled={isLoading}
        className={`
          text-white p-2 rounded-lg transition-all disabled:opacity-50 shadow-sm
          ${hasImages
            ? "bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-purple-600/90 dark:to-pink-600/80 dark:hover:from-purple-500/80 dark:hover:to-pink-500/70"
            : "bg-[#a55233] hover:bg-[#884325] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 dark:hover:from-blue-500/80 dark:hover:to-emerald-500/70"
          }
          ${isLoading ? "disabled:bg-[#d6cbbf] disabled:dark:bg-gray-600" : ""}
        `}
        title={hasImages ? "Send image message" : "Send message"}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  </div>
);
 
ChatInputArea.propTypes = {
  message: PropTypes.string.isRequired,
  setMessage: PropTypes.func.isRequired,
  pastedImages: PropTypes.array.isRequired,
  setPastedImages: PropTypes.func.isRequired,
  imagePreviews: PropTypes.array.isRequired,
  setImagePreviews: PropTypes.func.isRequired,
  hasImages: PropTypes.bool.isRequired,
  setHasImages: PropTypes.func.isRequired,
  fileInputRef: PropTypes.object.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onSendClick: PropTypes.func.isRequired,
  onPaste: PropTypes.func.isRequired,
  onMicInput: PropTypes.func.isRequired,
  onOpenYouTubeModal: PropTypes.func.isRequired,
  onChatInputFocus: PropTypes.func.isRequired,
  handleFileChange: PropTypes.func.isRequired,
  contextMode: PropTypes.string.isRequired,
  propSelectedDocuments: PropTypes.array.isRequired,
  useWebKnowledge: PropTypes.bool.isRequired,
  toggleWebKnowledge: PropTypes.func.isRequired,
  responseLength: PropTypes.string.isRequired,
  setResponseLength: PropTypes.func.isRequired,
  ResponseLengthToggle: PropTypes.func.isRequired,
  isDocumentProcessing: PropTypes.bool.isRequired,
  hasUploadPermissions: PropTypes.bool.isRequired,
  removeImage: PropTypes.func.isRequired,
  textSize: PropTypes.string.isRequired,
  isRecording: PropTypes.bool.isRequired,
  currentView: PropTypes.string.isRequired,
  toggleView: PropTypes.func.isRequired,
  isSummaryGenerating: PropTypes.bool.isRequired,
};
 
export default ChatInputArea;