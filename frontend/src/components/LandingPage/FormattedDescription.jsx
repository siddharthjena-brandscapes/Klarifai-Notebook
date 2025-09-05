import React, { useState, useRef, useEffect } from 'react';
import { Loader, Wand2, Paperclip, FileText, Check, AlertCircle } from 'lucide-react';

const FormattedDescription= () => {
  const [projectData, setProjectData] = useState({
    description: ''
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const textareaRef = useRef(null);
  const editableRef = useRef(null);

  // Handle document change
  const handleDocumentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
      setUploadStatus(null);
    }
  };

  // Handle generating description from document
  const handleGenerateDescription = () => {
    if (!documentFile) return;
    
    setUploadLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setUploadLoading(false);
      setUploadStatus("success");
      setProjectData(prev => ({
        ...prev,
        description: `Generated description for ${documentFile.name}.\n\n• This would include formatted content\n• With bullet points\n• And possibly **bold text** or *italics*`
      }));
    }, 2000);
  };

  // Handle enhancing description with AI
  const handleEnhanceDescription = () => {
    if (!projectData.description || projectData.description.trim().length < 10) return;
    
    setEnhanceLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setEnhanceLoading(false);
      setProjectData(prev => ({
        ...prev,
        description: prev.description + "\n\n**Enhanced content:**\n\n1. With numbered lists\n2. And improved formatting\n3. Making it look more professional"
      }));
    }, 1500);
  };

  // Format content with Markdown-like syntax
  const formatContent = (content) => {
    if (!content) return '';
    
    // Replace markdown-style formatting with HTML
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n• (.*)/g, '<br/>• $1')
      .replace(/\n(\d+)\. (.*)/g, '<br/>$1. $2');
    
    return formatted;
  };

  // Toggle between edit and preview mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Save content from textarea to state before switching to preview
      setProjectData(prev => ({
        ...prev,
        description: textareaRef.current.value
      }));
    } else {
      // Focus textarea when switching to edit mode
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
    setIsEditing(!isEditing);
  };

  // Handle content changes in preview mode
  const handleEditableChange = () => {
    if (editableRef.current) {
      const content = editableRef.current.innerHTML
        .replace(/<br>/g, '\n')
        .replace(/<br\/>/g, '\n')
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*');
      
      setProjectData(prev => ({
        ...prev,
        description: content
      }));
    }
  };

  return (
    <div>
      <label
        htmlFor="description"
        className="block text-sm font-medium text-gray-200 mb-2"
      >
        Description
      </label>

      <div className="relative">
        {isEditing ? (
          <textarea
            id="description"
            ref={textareaRef}
            className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent scrollbar-styled"
            placeholder="Describe your project's goals and objectives..."
            rows={5}
            value={projectData.description}
            onChange={(e) =>
              setProjectData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            disabled={uploadLoading}
            required
          />
        ) : (
          <div
            ref={editableRef}
            contentEditable
            className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent scrollbar-styled overflow-auto min-h-[120px]"
            style={{ whiteSpace: 'pre-wrap' }}
            onBlur={handleEditableChange}
            dangerouslySetInnerHTML={{ __html: formatContent(projectData.description) }}
          />
        )}

        {/* Loading overlay - only shows during active generation */}
        {uploadLoading && (
          <div className="absolute top-0 left-0 w-full h-full bg-gray-900/70 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center">
            <div className="flex items-center space-x-3 mb-4">
              <Loader className="w-6 h-6 text-emerald-400 animate-spin" />
              <p className="text-emerald-300">
                Generating description...
              </p>
            </div>
            <button
              onClick={() => {
                setUploadLoading(false);
                setUploadStatus("error");
                setUploadError("Generation cancelled.");
              }}
              className="px-3 py-1 bg-gray-700/70 text-gray-300 hover:bg-gray-600/70 rounded-md text-xs"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Action buttons positioned in bottom-right corner */}
        <div className="absolute bottom-3 right-3 flex space-x-2">
          {/* Toggle edit/preview mode button */}
          <button
            type="button"
            onClick={toggleEditMode}
            className="p-2 rounded-full transition-colors bg-white/10 text-blue-300 hover:bg-blue-600/30 hover:text-white"
            title={isEditing ? "Show formatted view" : "Switch to editing mode"}
          >
            {isEditing ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            )}
          </button>

          {/* Enhance with AI button */}
          <button
            type="button"
            onClick={handleEnhanceDescription}
            disabled={
              !projectData.description ||
              projectData.description.trim().length < 10 ||
              enhanceLoading ||
              uploadLoading
            }
            className={`p-2 rounded-full transition-colors ${
              !projectData.description ||
              projectData.description.trim().length < 10 ||
              uploadLoading
                ? "bg-white/10 text-gray-500 cursor-not-allowed"
                : enhanceLoading
                ? "bg-emerald-600/30 text-purple-300"
                : "bg-white/10 text-purple-300 hover:bg-emerald-600/30 hover:text-white"
            }`}
            title="Enhance description with AI"
          >
            <Wand2 className="w-4 h-4" />
          </button>

          {/* File upload button */}
          <label
            className={`p-2 rounded-full transition-colors cursor-pointer
            ${
              documentFile
                ? "bg-emerald-600/30 text-emerald-300"
                : "bg-white/10 text-emerald-300 hover:text-emerald-400 hover:bg-white/20"
            }`}
            title="Upload document to generate description"
          >
            <input
              type="file"
              accept=".pdf,.pptx"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleDocumentChange(e);
                  setUploadError(null);
                }
              }}
              className="hidden"
            />
            <Paperclip className="w-4 h-4" />
          </label>
        </div>
      </div>

      {/* Status display section */}
      {documentFile && (
        <div className="mt-2 flex items-center justify-between">
          {/* File name with manual generate button */}
          <div className="flex items-center text-xs">
            <FileText className="w-3 h-3 mr-1 text-emerald-300" />
            <span className="truncate max-w-xs text-emerald-300">
              {documentFile.name}
            </span>

            {/* Generate button when file is uploaded and not currently generating */}
            {!uploadLoading && uploadStatus !== "success" && (
              <button
                onClick={handleGenerateDescription}
                className="ml-2 px-2 py-0.5 bg-emerald-600/30 text-emerald-300 rounded-md text-xs"
              >
                Generate
              </button>
            )}
          </div>

          {/* Status indicators */}
          {!uploadLoading && (
            <>
              {uploadStatus === "success" && (
                <span className="text-emerald-300 flex items-center text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  Description generated
                </span>
              )}
              {enhanceLoading && (
                <span className="text-emerald-300 flex items-center text-xs">
                  <Loader className="w-3 h-3 mr-1 animate-spin" />
                  Enhancing...
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Help text when no file is uploaded */}
      {!documentFile && !uploadLoading && (
        <p className="mt-2 text-xs text-gray-400">
          Upload a document or write a description, then enhance with AI.
        </p>
      )}

      {/* Error message */}
      {uploadError && !uploadLoading && (
        <div className="mt-2 flex items-center text-red-400 text-xs">
          <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};

export default FormattedDescription;