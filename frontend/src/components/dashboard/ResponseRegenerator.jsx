import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { RefreshCw, ChevronLeft, ChevronRight, Loader } from "lucide-react";

const ResponseRegenerator = ({
  messageIndex,
  message,
  onRegenerateResponse,
  regeneratedResponses,
  currentResponseIndex,
  setCurrentResponseIndex,
  displayRegeneratedResponse,
  responseLength: defaultResponseLength,
  isLoading
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  // Add a local state to track regeneration loading specifically
  const [isRegenerateLoading, setIsRegenerateLoading] = useState(false);
  const [selectedLength, setSelectedLength] = useState(
    message?.response_length || defaultResponseLength
  );
  
  const buttonRef = useRef(null);
  const popupRef = useRef(null);
  
  const responses = regeneratedResponses[messageIndex] || [];
  const currentIndex = currentResponseIndex[messageIndex] || 0;
  const responseCount = responses.length;
  
  // Handle clicks outside the popup to close it
  useEffect(() => {
    if (!isRegenerating) return;
    
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsRegenerating(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRegenerating]);
  
  const handleRegenerate = () => {
    setIsRegenerating(true);
    setSelectedLength(message?.response_length || defaultResponseLength);
  };
  
  const handleConfirmRegenerate = async () => {
    // Set local regenerate loading state to true
    setIsRegenerateLoading(true);
    
    try {
      // Call the regenerate function
      await onRegenerateResponse(messageIndex, selectedLength);
    } finally {
      // Reset loading state when done
      setIsRegenerateLoading(false);
      setIsRegenerating(false);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      displayRegeneratedResponse(messageIndex, currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < responseCount - 1) {
      displayRegeneratedResponse(messageIndex, currentIndex + 1);
    }
  };
  
  // Only show navigation controls if there are multiple responses
  const showNavigation = responseCount > 1;
  
  return (
    <div className="flex items-center space-x-2 relative">
      
      {/* Navigation controls - only show if there are multiple responses */}
      {showNavigation && (
        <div className="flex items-center space-x-1 px-2 py-1">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`p-1 rounded-md transition-colors ${
              currentIndex === 0 
                ? 'text-[#d6cbbf] dark:text-gray-600 cursor-not-allowed' 
                : 'text-[#8c715f] dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700/40 hover:text-[#a55233] hover:bg-[#f5e6d8]'
            }`}
            title="Previous response"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-xs text-[#8c715f] dark:text-gray-400 font-light">
            {currentIndex + 1}/{responseCount}
          </span>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === responseCount - 1}
            className={`p-1 rounded-md transition-colors ${
              currentIndex === responseCount - 1 
                ? 'text-[#d6cbbf] dark:text-gray-600 cursor-not-allowed' 
                : 'text-[#8c715f] dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700/40 hover:text-[#a55233] hover:bg-[#f5e6d8]'
            }`}
            title="Next response"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
  
      {/* Regenerate button */}
      <button
        ref={buttonRef}
        onClick={handleRegenerate}
        disabled={isLoading}
        className="flex items-center px-3 py-1 rounded-md dark:text-gray-400 text-[#602f1a] dark:hover:text-blue-400 dark:hover:bg-blue-900/20 hover:text-[#a55233] hover:bg-[#f5e6d8] active:scale-95 transition-all duration-150"
        title="Regenerate response"
      >
        {/* Only spin the icon when message being regenerated, not during general loading */}
        <RefreshCw className={`h-3 w-3 mr-1.5 ${isRegenerateLoading ? 'animate-spin' : ''}`} />
        <span className="text-xs">Regenerate</span>
      </button>
      
      {/* Positioned popup for regeneration options - appears above the regenerate button */}
      {isRegenerating && (
        <div 
          ref={popupRef}
          className="absolute bottom-full mb-2 right-0 z-50 bg-[#ffffff] dark:bg-gray-800 border border-[#d6cbbf] dark:border-blue-500/40 rounded-lg shadow-lg overflow-hidden w-55 animate-popup"
        >
          <div className="p-2 text-center text-sm text-[#5e4636] dark:text-gray-300 border-b border-[#e3d5c8] dark:border-blue-500/30">
            Response length
          </div>
          <div className="p-3 space-y-2">
            {/* Short Option */}
            <button
              onClick={() => setSelectedLength('short')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedLength === 'short'
                  ? 'bg-gradient-to-r from-[#f5e6d8] to-[#faf4ee] border border-[#a68a70] text-[#0a3b25] dark:bg-gradient-to-r dark:from-[#1570ef] dark:to-blue-900 dark:border-blue-800/90 dark:text-blue-100'
                  : 'hover:bg-[#faf4ee] text-[#5e4636] dark:hover:bg-gray-800/70 dark:text-gray-300'
              }`}
            >
              Short
            </button>
            
            {/* Comprehensive Option */}
            <button
              onClick={() => setSelectedLength('comprehensive')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedLength === 'comprehensive'
                  ? 'bg-gradient-to-r from-[#f5e6d8] to-[#faf4ee] border border-[#a68a70] text-[#0a3b25] dark:bg-gradient-to-r dark:from-[#1570ef] dark:to-blue-900 dark:border-blue-800/90 dark:text-blue-100'
                  : 'hover:bg-[#faf4ee] text-[#5e4636] dark:hover:bg-gray-800/70 dark:text-gray-300'
              }`}
            >
              Comprehensive
            </button>
          </div>
          <div className="p-3 bg-[#faf4ee] dark:bg-gray-800 flex justify-center border-t border-[#e3d5c8] dark:border-blue-500/30">
            <button
              onClick={handleConfirmRegenerate}
              disabled={isRegenerateLoading}
              className="w-full py-2 text-sm text-white bg-gradient-to-r from-[#a55233] to-[#8b4513] hover:from-[#8b4513] hover:to-[#794012] dark:text-white dark:bg-gradient-to-r dark:from-blue-800/80 dark:to-blue-600/80 dark:hover:from-blue-600/80 dark:hover:to-blue-500/80 rounded-md transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isRegenerateLoading ? (
                <>
                  <Loader className="h-3 w-3 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3" />
                  <span>Regenerate</span>
                </>
              )}
            </button>
          </div>
          
          {/* Arrow pointing down to the button */}
          <div className="absolute bottom-0 right-8 w-4 h-4 bg-[#faf4ee] dark:bg-gray-800/40 transform translate-y-2 rotate-45 border-r border-b border-[#d6cbbf] dark:border-blue-500/20"></div>
        </div>
      )}
    </div>
  );
};

ResponseRegenerator.propTypes = {
  messageIndex: PropTypes.number.isRequired,
  message: PropTypes.object.isRequired,
  onRegenerateResponse: PropTypes.func.isRequired,
  regeneratedResponses: PropTypes.object.isRequired,
  currentResponseIndex: PropTypes.object.isRequired,
  setCurrentResponseIndex: PropTypes.func.isRequired,
  displayRegeneratedResponse: PropTypes.func.isRequired,
  responseLength: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired
};

export default ResponseRegenerator;