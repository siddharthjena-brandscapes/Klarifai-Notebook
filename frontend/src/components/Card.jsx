// Card.jsx
import React from 'react';
import PropTypes from 'prop-types';

// Custom scrollbar styles included directly in the component
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(165, 82, 51, 0.05);  /* Terracotta color with low opacity */
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(165, 82, 51, 0.2);  /* Terracotta color with medium opacity */
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(165, 82, 51, 0.35);  /* Terracotta color with higher opacity on hover */
  }
  
  /* Dark mode scrollbar variant */
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 58, 62, 0.3);  /* Darker blue-green that matches dark mode theme */
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(85, 96, 82, 0.4);  /* Sage green with higher opacity for better visibility */
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(85, 96, 82, 0.6);  /* Brighter on hover for better interaction feedback */
}
`;

const Card = ({ title, children, onClick, className = "", maxHeight = null }) => {
  return (
    <>
      {/* Include the styles once per component */}
      <style>{scrollbarStyles}</style>
      
      <div 
        className={`
          dark:bg-gray-900/20 bg-[#f2f2f2]
          rounded-xl shadow-sm
          mb-4 p-5 
          cursor-pointer 
          dark:hover:bg-gray-800/50 hover:bg-[#f5e6d8]
          transition-all duration-300 
          transform hover:-translate-y-1 
          hover:shadow-lg 
          border dark:border-[#1e3a46]/25 border-[#d6cbbf]
          dark:hover:border-blue-500/30 hover:border-[#a68a70]
          ${className}
        `}
        onClick={onClick}
      >
        {title && (
          <h3 className="text-lg font-semibold dark:text-blue-400 text-[#a55233] mb-2">
            {title}
          </h3>
        )}
        <div 
          className={`
            text-sm 
            dark:text-gray-300 text-[#0c393b]
            leading-relaxed
            custom-scrollbar
            ${maxHeight ? 'overflow-y-auto' : ''}
          `}
          style={maxHeight ? { maxHeight } : {}}
        >
          {children}
        </div>
      </div>
    </>
  );
};

Card.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  maxHeight: PropTypes.string
};

export default Card;