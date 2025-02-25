// ConsolidatedViewBadge.jsx
import React from 'react';
import { FileText, Combine } from 'lucide-react';

const ConsolidatedViewBadge = ({ documentCount }) => {
  return (
    <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full border border-purple-500/30 text-xs text-white animate-fadeIn">
      <Combine className="h-3 w-3 mr-1.5 text-purple-400" />
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