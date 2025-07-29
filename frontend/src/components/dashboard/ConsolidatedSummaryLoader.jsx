// // ConsolidatedSummaryLoader.jsx
// import React from 'react';
// import { FileText } from 'lucide-react';

// // Enhanced loading component for consolidated summary generation
// const ConsolidatedSummaryLoader = () => (
//   <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-lg">
//     <div className="text-center max-w-md mx-auto px-4">
//       <div className="flex flex-col items-center justify-center mb-6">
//         <div className="relative">
//           <FileText className="h-16 w-16 text-blue-400 animate-pulse" />
//           <div className="absolute -top-1 -right-1">
//             <FileText className="h-10 w-10 text-green-400 animate-pulse" />
//           </div>
//           <div className="absolute top-8 -left-2">
//             <FileText className="h-8 w-8 text-purple-400 animate-pulse opacity-70" />
//           </div>
//         </div>
//       </div>
//       <h3 className="text-xl font-bold text-white mb-2">Creating Consolidated Summary</h3>
//       <p className="text-gray-300 mb-6">
//         Analyzing relationships and connections across your documents...
//       </p>
      
//       <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
//         <div 
//           className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 animate-shimmer"
//         />
//       </div>
      
//       <div className="text-sm text-gray-400 mt-4">
//         Creating unified insights from multiple documents
//       </div>
//     </div>
//   </div>
// );

// export default ConsolidatedSummaryLoader;

// // Add this to your styles
// const consolidatedSummaryStyles = `
//   @keyframes shimmer {
//     0% { background-position: -1000px 0; }
//     100% { background-position: 1000px 0; }
//   }
  
//   .animate-shimmer {
//     animation: shimmer 3s infinite linear;
//     background-size: 1000px 100%;
//   }
// `;

// export { ConsolidatedSummaryLoader, consolidatedSummaryStyles };

// ConsolidatedSummaryLoader.jsx
import React from 'react';
import { FileText } from 'lucide-react';

// Enhanced loading component for consolidated summary generation with theme support
const ConsolidatedSummaryLoader = ({ theme = 'light' }) => {
  // Theme-specific styles
  const containerClasses = theme === 'light'
    ? "absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#faf4ee]/90 backdrop-blur-lg"
    : "absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-lg";
  
  const titleClasses = theme === 'light'
    ? "text-xl font-bold text-[#0a3b25] mb-2"
    : "text-xl font-bold text-white mb-2";
  
  const descriptionClasses = theme === 'light'
    ? "text-[#5e4636] mb-6"
    : "text-gray-300 mb-6";
  
  const progressBarBgClasses = theme === 'light'
    ? "w-full h-2 bg-[#e9dcc9] rounded-full overflow-hidden mb-2"
    : "w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2";
  
  const progressBarFillClasses = theme === 'light'
    ? "h-full bg-gradient-to-r from-[#556052] via-[#a55233] to-[#a68a70] animate-shimmer"
    : "h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 animate-shimmer";
  
  const footerTextClasses = theme === 'light'
    ? "text-sm text-[#5a544a] mt-4"
    : "text-sm text-gray-400 mt-4";

  const primaryIconClasses = theme === 'light'
    ? "h-16 w-16 text-[#a55233] animate-pulse"
    : "h-16 w-16 text-blue-400 animate-pulse";
    
  const secondaryIconClasses = theme === 'light'
    ? "h-10 w-10 text-[#556052] animate-pulse"
    : "h-10 w-10 text-green-400 animate-pulse";
    
  const tertiaryIconClasses = theme === 'light'
    ? "h-8 w-8 text-[#a68a70] animate-pulse opacity-70"
    : "h-8 w-8 text-purple-400 animate-pulse opacity-70";

  return (
    <div className={containerClasses}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative">
            <FileText className={primaryIconClasses} />
            <div className="absolute -top-1 -right-1">
              <FileText className={secondaryIconClasses} />
            </div>
            <div className="absolute top-8 -left-2">
              <FileText className={tertiaryIconClasses} />
            </div>
          </div>
        </div>
        <h3 className={titleClasses}>Creating Consolidated Summary</h3>
        <p className={descriptionClasses}>
          Analyzing relationships and connections across your documents...
        </p>
        
        <div className={progressBarBgClasses}>
          <div className={progressBarFillClasses} />
        </div>
        
        <div className={footerTextClasses}>
          Creating unified insights from multiple documents
        </div>
      </div>
    </div>
  );
};

// Add this to your styles
const consolidatedSummaryStyles = `
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  .animate-shimmer {
    animation: shimmer 3s infinite linear;
    background-size: 1000px 100%;
  }
`;

export { ConsolidatedSummaryLoader, consolidatedSummaryStyles };
export default ConsolidatedSummaryLoader;