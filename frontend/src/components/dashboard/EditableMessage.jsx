
import React, { useState, useEffect } from 'react';
import { Pencil, Check, X, RotateCcw, ChevronLeft, ChevronRight, Clock, History } from 'lucide-react';
import PropTypes from 'prop-types';

const EditableMessage = ({ 
  content, 
  isEditing, 
  setIsEditing, 
  onSave, 
  onRevert,
  disabled,
  messageIndex,
  messageHistory
}) => {
  const [editedContent, setEditedContent] = useState(content);
  const [originalContent] = useState(content);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [versions, setVersions] = useState([]);

  // Initialize versions on component mount
  useEffect(() => {
    if (messageHistory && messageHistory[messageIndex]) {
      const allVersions = [
        {
          content: messageHistory[messageIndex].message,
          timestamp: messageHistory[messageIndex].timestamp || new Date().toISOString(),
          type: 'original'
        },
        ...(messageHistory[messageIndex].versions || []).map(version => ({
          ...version,
          type: 'edit'
        }))
      ];
      setVersions(allVersions);
      const currentIndex = allVersions.findIndex(v => v.content === content);
      setCurrentVersionIndex(currentIndex >= 0 ? currentIndex : allVersions.length - 1);
    }
  }, [messageHistory, messageIndex, content]);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  useEffect(() => {
    setHasBeenEdited(content !== originalContent);
  }, [content, originalContent]);

  const navigateVersion = (direction) => {
    const newIndex = direction === 'next' 
      ? Math.min(currentVersionIndex + 1, versions.length - 1)
      : Math.max(currentVersionIndex - 1, 0);
    
    if (newIndex !== currentVersionIndex) {
      setCurrentVersionIndex(newIndex);
      const version = versions[newIndex];
      onSave(version.content, version.type === 'original');
    }
  };

  const handleRevert = () => {
    if (messageHistory && messageHistory[messageIndex]) {
      const { message, response, subsequentMessages } = messageHistory[messageIndex];
      onRevert(message, response, subsequentMessages);
      setCurrentVersionIndex(0);
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (editedContent.trim() !== content) {
      const newVersion = {
        content: editedContent,
        timestamp: new Date().toISOString(),
        type: 'edit'
      };
      
      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(updatedVersions.length - 1);
      
      onSave(editedContent);
      setHasBeenEdited(true);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col space-y-4 min-w-[300px]">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full bg-gray-900/50 text-white rounded-lg p-4 min-h-[120px] 
            border border-blue-500/50 focus:border-blue-500/70 
            focus:ring-2 focus:ring-blue-500/30 
            focus:outline-none resize-none
            shadow-lg"
          placeholder="Edit your message..."
          autoFocus
        />
        <div className="flex justify-end items-center space-x-2">
          {messageHistory && messageHistory[messageIndex] && (
            <button
              onClick={handleRevert}
              className="flex items-center px-3 py-1.5 text-sm 
                bg-gray-800 hover:bg-gray-700
                text-gray-200 hover:text-white
                rounded-lg transition-all duration-200
                border border-gray-600 hover:border-gray-500
                shadow-md hover:shadow-lg"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Revert
            </button>
          )}
          <button
            onClick={handleCancel}
            className="flex items-center px-3 py-1.5 text-sm 
              bg-gray-800 hover:bg-gray-700
              text-gray-200 hover:text-white
              rounded-lg transition-all duration-200
              border border-gray-600 hover:border-gray-500
              shadow-md hover:shadow-lg"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={editedContent.trim() === content}
            className={`flex items-center px-3 py-1.5 text-sm
              ${editedContent.trim() === content 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600' 
                : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 hover:border-blue-400'}
              rounded-lg transition-all duration-200
              border shadow-md hover:shadow-lg`}
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="flex flex-col space-y-2">
        <div className="pr-16">
          <p className="text-sm">{content}</p>
          {hasBeenEdited && (
            <div className="flex items-center space-x-3 mt-1.5">
              <span className="text-xs text-gray-400 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Edited
              </span>
              {versions.length > 1 && (
                <span className="text-xs text-gray-400 flex items-center">
                  <History className="w-3 h-3 mr-1" />
                  Version {currentVersionIndex + 1} of {versions.length}
                </span>
              )}
            </div>
          )}
        </div>
        {!disabled && (
          <div className="absolute top-0 right-0 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {versions.length > 1 && (
              <>
                <button
                  onClick={() => navigateVersion('prev')}
                  disabled={currentVersionIndex === 0}
                  className={`flex items-center justify-center
                    w-6 h-6 rounded-md
                    ${currentVersionIndex === 0 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700'}
                    transition-all duration-200
                    border border-gray-600 hover:border-gray-500
                    shadow-md hover:shadow-lg`}
                  title="Previous version"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigateVersion('next')}
                  disabled={currentVersionIndex === versions.length - 1}
                  className={`flex items-center justify-center
                    w-6 h-6 rounded-md
                    ${currentVersionIndex === versions.length - 1 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700'}
                    transition-all duration-200
                    border border-gray-600 hover:border-gray-500
                    shadow-md hover:shadow-lg`}
                  title="Next version"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {messageHistory && messageHistory[messageIndex] && (
              <button
                onClick={handleRevert}
                className="flex items-center justify-center
                  w-6 h-6 rounded-md
                  text-gray-300 hover:text-white
                  bg-gray-800 hover:bg-gray-700
                  transition-all duration-200
                  border border-gray-600 hover:border-gray-500
                  shadow-md hover:shadow-lg"
                title="Revert to original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center
                w-6 h-6 rounded-md
                text-gray-300 hover:text-white
                bg-gray-800 hover:bg-gray-700
                transition-all duration-200
                border border-gray-600 hover:border-gray-500
                shadow-md hover:shadow-lg"
              title="Edit message"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

EditableMessage.propTypes = {
  content: PropTypes.string.isRequired,
  isEditing: PropTypes.bool.isRequired,
  setIsEditing: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onRevert: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  messageIndex: PropTypes.number,
  messageHistory: PropTypes.object
};

EditableMessage.defaultProps = {
  disabled: false,
  messageHistory: null
};

export default EditableMessage;