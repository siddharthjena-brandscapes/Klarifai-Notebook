import { Globe, X } from "lucide-react";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";

const WebModeWelcome = ({ className = "" }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(true);
  
  useEffect(() => {
    // Start with entrance animation
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={`
        flex items-start
        text-center
        mx-auto
        my-4
        max-w-md
        transition-all
        duration-500
        p-2
        border border-blue-400/30 rounded-xl
        ${isAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'}
        ${className}
      `}
    >
      <div className="flex items-center">
        <Globe 
          className={`
            h-4 w-4 text-blue-400 mt-1
            transition-all duration-700
            ${isAnimating ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
          `}
        />
      </div>
      
      <div className="flex-1 text-left ml-2.5">
        <div className="flex items-center justify-between">
          <span 
            className={`
              text-sm font-medium text-blue-400
              transition-all duration-500 delay-100
              ${isAnimating ? 'opacity-0 transform -translate-x-2' : 'opacity-100 transform translate-x-0'}
            `}
          >
            Web Search Mode Active
          </span>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-blue-400" />
          </button>
        </div>
        
        <p 
          className={`
            text-sm text-gray-400 mt-0.5 leading-snug
            transition-all duration-500 delay-200
            ${isAnimating ? 'opacity-0 transform -translate-y-1' : 'opacity-100 transform translate-y-0'}
          `}
        >
          No documents selected. I will use my knowledge and search the web to answer your questions.
        </p>
      </div>
    </div>
  );
};

WebModeWelcome.propTypes = {
  className: PropTypes.string
};

export default WebModeWelcome;