import { Database, X } from "lucide-react";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const DocumentModeWelcome = ({ className = "", selectedDocuments = [], documents = [] }) => {
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
  
  // Get the names of selected documents
  const selectedDocNames = documents
    .filter(doc => selectedDocuments.includes(doc.id.toString()))
    .map(doc => doc.filename || doc.name)
    .slice(0, 3); // Show max 3 document names
  
  const documentCount = selectedDocuments.length;
  
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
        <X className="h-4 w-4 dark:text-indigo-400" />
      </button>
      
      {/* Centered content */}
      <div className="flex flex-col items-center text-center">
        <Database 
          className={`
            h-5 w-5 dark:text-indigo-400 text-[#1a535c] mb-2
            transition-all duration-700
            ${isAnimating ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
          `}
        />
        
        <span 
          className={`
            text-lg font-semibold tracking-normal dark:text-indigo-400 font-serif text-[#1a535c]
            transition-all duration-500 delay-100
            ${isAnimating ? 'opacity-0 transform -translate-x-2' : 'opacity-100 transform translate-x-0'}
          `}
        >
          Document Mode Active
        </span>
        
        <p 
          className={`
            text-sm dark:text-gray-400 text-[#374700] mt-2 leading-snug
            transition-all duration-500 delay-200
            ${isAnimating ? 'opacity-0 transform -translate-y-1' : 'opacity-100 transform translate-y-0'}
          `}
        >
          {documentCount === 1 
            ? `Ready to answer questions about "${selectedDocNames[0]}"`
            : documentCount <= 3
            ? `Ready to answer questions about ${selectedDocNames.join(", ")}`
            : `Ready to answer questions about ${documentCount} selected documents`
          }
        </p>
        
        {/* Optional: Show document count if more than 3 */}
        {documentCount > 3 && (
          <p 
            className={`
              text-xs dark:text-gray-500 text-[#5a544a] mt-1
              transition-all duration-500 delay-300
              ${isAnimating ? 'opacity-0 transform -translate-y-1' : 'opacity-100 transform translate-y-0'}
            `}
          >
            and {documentCount - 3} more documents
          </p>
        )}
      </div>
    </div>
  );
};

DocumentModeWelcome.propTypes = {
  className: PropTypes.string,
  selectedDocuments: PropTypes.arrayOf(PropTypes.string),
  documents: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    filename: PropTypes.string,
    name: PropTypes.string,
  })),
};

export default DocumentModeWelcome;