import { Globe, X } from "lucide-react";
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
        relative
        mx-auto
        my-4
        max-w-md
        transition-all
        duration-500
        p-4
        border dark:border-blue-400/30 border-[#1a535c] rounded-xl
        ${isAnimating ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'}
        ${className}
      `}
    >
      {/* Close button positioned in the top right */}
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 transition-colors p-1"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 dark:text-blue-400" />
      </button>
      
      {/* Centered content */}
      <div className="flex flex-col items-center text-center">
        <Globe 
          className={`
            h-5 w-5 dark:text-blue-400 text-[#1a535c] mb-2
            transition-all duration-700
            ${isAnimating ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
          `}
        />
        
        <span 
          className={`
            text-lg font-semibold tracking-normal dark:text-blue-400 font-serif text-[#1a535c]
            transition-all duration-500 delay-100
            ${isAnimating ? 'opacity-0 transform -translate-x-2' : 'opacity-100 transform translate-x-0'}
          `}
        >
          Web Search Mode Active
        </span>
        
        <p 
          className={`
            text-sm dark:text-gray-400 text-[#374700] mt-2 leading-snug
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

export default WebModeWelcome;