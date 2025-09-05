// // ConsolidatedViewBadge.jsx
// import React from 'react';
// import { FileText, Combine } from 'lucide-react';

// const ConsolidatedViewBadge = ({ documentCount }) => {
//   return (
//     <div className="flex items-center px-3 py-1.5 dark:bg-gradient-to-r dark:from-blue-600/30 dark:to-purple-600/30 rounded-full border dark:border-purple-500/30 text-xs dark:text-white animate-fadeIn">
//       <Combine className="h-3 w-3 mr-1.5 dark:text-purple-400" />
//       <span>
//         {documentCount} documents analyzed together
//       </span>
//     </div>
//   );
// };

// // Animation for the badge
// const badgeStyles = `
//   @keyframes fadeIn {
//     from { opacity: 0; transform: translateY(5px); }
//     to { opacity: 1; transform: translateY(0); }
//   }
  
//   .animate-fadeIn {
//     animation: fadeIn 0.5s ease-out forwards;
//   }
// `;

// export { ConsolidatedViewBadge, badgeStyles };

// ConsolidatedViewBadge.jsx
import React from 'react';
import { FileText, Combine } from 'lucide-react';

const ConsolidatedViewBadge = ({ documentCount, theme = 'light' }) => {
  // Define theme-specific styles
  const badgeClasses = theme === 'light'
    ? "flex items-center px-3 py-1.5 bg-gradient-to-r from-[#556052]/20 to-[#a55233]/20 rounded-full border border-[#d6cbbf] text-xs text-[#5e4636] animate-fadeIn"
    : "flex items-center px-3 py-1.5 dark:bg-gradient-to-r dark:from-blue-600/30 dark:to-purple-600/30 rounded-full border dark:border-purple-500/30 text-xs dark:text-white animate-fadeIn";

  const iconClasses = theme === 'light'
    ? "h-3 w-3 mr-1.5 text-[#a55233]"
    : "h-3 w-3 mr-1.5 dark:text-purple-400";

  return (
    <div className={badgeClasses}>
      <Combine className={iconClasses} />
      <span>
        {documentCount} documents analyzed together
      </span>
    </div>
  );
};

// Animation for the badge
const badgeStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;

export { ConsolidatedViewBadge, badgeStyles };