import React, { useState } from 'react';
import { Info } from 'lucide-react';

const IdeaMetadata = ({ ideaMetadata }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!ideaMetadata) return null;

  return (
    <div className="w-full">
      {/* Metadata Toggle Button */}
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center space-x-2 text-[#556052] hover:text-[#425142] dark:text-emerald-300 dark:hover:text-white transition-colors mb-2"
        title={isVisible ? "Hide Metadata" : "Show Metadata"}
      >
        <Info size={16} />
        <span className="text-xs">
          {isVisible ? "Hide Metadata" : "Show Metadata"}
        </span>
      </button>

      {/* Metadata Content */}
      {isVisible && (
        <div className="bg-white shadow-md border border-[#e3d5c8] dark:bg-gray-800 dark:border-transparent p-4 rounded-lg space-y-4">
          {/* Base Information Section */}
          <div>
            <h4 className="text-sm font-semibold text-[#0a3b25] dark:text-gray-200 mb-2 border-b border-[#e3d5c8] dark:border-gray-700 pb-1">
              Base Information
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ideaMetadata.baseData || {}).map(([key, value]) => (
                <div 
                  key={key} 
                  className="flex justify-between items-center text-xs bg-[#f0eee5] dark:bg-gray-700/30 p-2 rounded"
                >
                  <span className="text-[#5e4636] dark:text-gray-400 capitalize mr-2">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-[#0a3b25] dark:text-white font-medium truncate max-w-[150px]">
                    {value || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Negative Prompt Section */}
          {ideaMetadata.baseData?.negative_prompt && (
            <div>
              <h4 className="text-sm font-semibold text-[#0a3b25] dark:text-gray-200 mb-2 border-b border-[#e3d5c8] dark:border-gray-700 pb-1">
                Negative Prompt
              </h4>
              <div className="text-xs bg-[#f0eee5] dark:bg-gray-700/30 p-2 rounded text-[#0a3b25] dark:text-gray-300 italic">
                {ideaMetadata.baseData.negative_prompt || 'None'}
              </div>
            </div>
          )}

          {/* Dynamic Fields Section */}
          {ideaMetadata.dynamicFields && Object.keys(ideaMetadata.dynamicFields).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[#0a3b25] dark:text-gray-200 mb-2 border-b border-[#e3d5c8] dark:border-gray-700 pb-1">
                Active Fields
              </h4>
              <div className="space-y-2">
                {Object.entries(ideaMetadata.dynamicFields).map(([fieldId, field]) => (
                  <div 
                    key={fieldId} 
                    className={`flex justify-between items-center text-xs p-2 rounded transition-all ${
                      field.active === false 
                        ? 'bg-[#f0eee5]/50 dark:bg-gray-700/10 opacity-50' 
                        : 'bg-[#f0eee5] hover:bg-[#e9dcc9] dark:bg-gray-700/30 dark:hover:bg-gray-700/40'
                    }`}
                  >
                    <span className="text-[#5e4636] dark:text-gray-300 capitalize mr-2">{field.type}:</span>
                    <span className="text-[#0a3b25] dark:text-white font-medium truncate max-w-[200px]">
                      {field.value || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          {ideaMetadata.timestamp && (
            <div className="text-xs text-[#8c715f] dark:text-gray-500 text-right">
              Generated: {new Date(ideaMetadata.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IdeaMetadata;