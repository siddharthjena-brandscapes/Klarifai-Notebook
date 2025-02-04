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
        className="flex items-center space-x-2 text-emerald-300 hover:text-white transition-colors mb-2"
        title={isVisible ? "Hide Metadata" : "Show Metadata"}
      >
        <Info size={16} />
        <span className="text-xs">
          {isVisible ? "Hide Metadata" : "Show Metadata"}
        </span>
      </button>

      {/* Metadata Content */}
      {isVisible && (
        <div className="bg-gray-800 p-4 rounded-lg space-y-4">
          {/* Base Information Section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-200 mb-2 border-b border-gray-700 pb-1">
              Base Information
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ideaMetadata.baseData || {}).map(([key, value]) => (
                <div 
                  key={key} 
                  className="flex justify-between items-center text-xs bg-gray-700/30 p-2 rounded"
                >
                  <span className="text-gray-400 capitalize mr-2">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-white font-medium truncate max-w-[150px]">
                    {value || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Negative Prompt Section */}
          {ideaMetadata.baseData?.negative_prompt && (
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-2 border-b border-gray-700 pb-1">
                Negative Prompt
              </h4>
              <div className="text-xs bg-gray-700/30 p-2 rounded text-gray-300 italic">
                {ideaMetadata.baseData.negative_prompt || 'None'}
              </div>
            </div>
          )}

          {/* Dynamic Fields Section */}
          {ideaMetadata.dynamicFields && Object.keys(ideaMetadata.dynamicFields).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-2 border-b border-gray-700 pb-1">
                Active Fields
              </h4>
              <div className="space-y-2">
                {Object.entries(ideaMetadata.dynamicFields).map(([fieldId, field]) => (
                  <div 
                    key={fieldId} 
                    className={`flex justify-between items-center text-xs p-2 rounded transition-all ${
                      field.active === false 
                        ? 'bg-gray-700/10 opacity-50' 
                        : 'bg-gray-700/30 hover:bg-gray-700/40'
                    }`}
                  >
                    <span className="text-gray-300 capitalize mr-2">{field.type}:</span>
                    <span className="text-white font-medium truncate max-w-[200px]">
                      {field.value || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          {ideaMetadata.timestamp && (
            <div className="text-xs text-gray-500 text-right">
              Generated: {new Date(ideaMetadata.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IdeaMetadata;