import React, { useState, useRef } from "react";
import { Paperclip, ScrollText, Check, AlertTriangle, X } from "lucide-react";
import { documentService } from "../../../utils/axiosConfig";
import { toast } from "react-toastify";

const EnhancedDocumentUpload = ({ mainProjectId, onUploadSuccess, setDocuments }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (!selectedFiles.length) return;

    // Initialize upload state
    setIsUploading(true);
    const initialProgressState = selectedFiles.map(file => ({
      name: file.name,
      progress: 0,
      status: "uploading", // uploading, processing, complete, error
      message: "Starting upload...",
      error: null
    }));
    setUploadProgress(initialProgressState);
    setOverallProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("main_project_id", mainProjectId);

      // Handle the upload with progress tracking
      const response = await documentService.uploadDocument(
        formData,
        mainProjectId,
        {
          onUploadProgress: (progressEvent) => {
            // Update upload progress
            const uploadPercentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            
            // Update all files with upload progress
            setUploadProgress(prev => 
              prev.map(item => ({
                ...item,
                progress: uploadPercentage,
                message: uploadPercentage < 100 
                  ? `Uploading: ${uploadPercentage}%` 
                  : "Processing document...",
                status: uploadPercentage < 100 ? "uploading" : "processing"
              }))
            );
            
            // Set overall progress based on upload percentage (up to 60% of total process)
            setOverallProgress(Math.floor(uploadPercentage * 0.6));
          },
        }
      );

      // Handle successful response
      const documents = response.data.documents || [];
      
      if (documents.length > 0) {
        // Update progress to reflect processing completion
        setUploadProgress(prev => 
          prev.map((item, index) => ({
            ...item,
            progress: 100,
            status: "complete",
            message: "Upload complete!"
          }))
        );
        
        // Set overall progress to 100%
        setOverallProgress(100);

        // Update document list
        if (setDocuments) {
          setDocuments((prevDocs) => {
            const newDocs = documents.filter(
              (newDoc) =>
                !prevDocs.some((existingDoc) => existingDoc.id === newDoc.id)
            );
            return [...prevDocs, ...newDocs];
          });
        }

        // Trigger success callback
        if (onUploadSuccess) {
          onUploadSuccess(documents);
        }

        // Show success toast
        toast.success(
          `${documents.length} document${documents.length > 1 ? 's' : ''} uploaded successfully!`
        );
      }
    } catch (error) {
      console.error("Upload Error:", error);
      
      // Update progress state to show error
      setUploadProgress(prev => 
        prev.map(item => ({
          ...item,
          status: "error",
          message: "Upload failed",
          error: error.message || "Unknown error occurred"
        }))
      );
      
      toast.error("Upload failed. Please try again.");
    } finally {
      // Reset after a delay to show completion state
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress([]);
        setOverallProgress(0);
      }, 3000);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Cancel ongoing upload
  const handleCancelUpload = () => {
    // Note: Actual cancellation would require aborting the axios request
    // For simplicity, we're just resetting the UI state
    setIsUploading(false);
    setUploadProgress([]);
    setOverallProgress(0);
    toast.info("Upload cancelled");
  };

  // Get appropriate status message based on overall progress
  const getStatusMessage = () => {
    if (overallProgress === 0) return "Ready to upload";
    if (overallProgress < 40) return "Uploading files...";
    if (overallProgress < 70) return "Processing documents...";
    if (overallProgress < 95) return "Almost there!";
    return "Finalizing upload...";
  };

  // Get completion status for multiple files
  const getCompletionStatus = () => {
    const completed = uploadProgress.filter(item => item.status === "complete").length;
    const total = uploadProgress.length;
    const remaining = total - completed;
    
    if (completed === 0) return "";
    if (completed === total) return "All uploads complete!";
    return `${completed} complete, ${remaining} remaining`;
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept=".pdf,.docx,.txt,.pptx"
      />

      {/* Upload button */}
      {!isUploading && (
        <button
          onClick={handleUploadClick}
          className="flex items-center justify-center space-x-2 w-full px-4 py-3 
                    bg-gradient-to-r from-blue-600/90 to-emerald-600/80 
                    hover:from-blue-500/80 hover:to-emerald-500/70 
                    text-white rounded-lg transition-all"
        >
          <Paperclip className="h-5 w-5" />
          <span>Upload Documents</span>
        </button>
      )}

      {/* Progress display */}
      {isUploading && (
        <div className="w-full bg-gray-900/90 border border-blue-500/20 rounded-lg p-4 shadow-lg">
          {/* Overall progress header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <ScrollText className="h-5 w-5 text-blue-400" />
              <span className="font-medium text-white">{getStatusMessage()}</span>
            </div>
            <button 
              onClick={handleCancelUpload}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Main progress bar */}
          <div className="w-full h-2 bg-gray-700 rounded-full mb-2">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          
          {/* Overall status text
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-400">{getCompletionStatus()}</span>
            {/* <span className="text-gray-400">{overallProgress}%</span> */}
          </div> */}

          {/* Individual file progress */}
          <div className="space-y-3 mt-4 max-h-60 overflow-y-auto custom-scrollbar">
            {uploadProgress.map((file, index) => (
              <div key={index} className="bg-gray-800/60 rounded-md p-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-white truncate" title={file.name}>
                    {file.name}
                  </span>
                  <div className="flex items-center">
                    {file.status === "complete" && (
                      <Check className="h-4 w-4 text-green-400" />
                    )}
                    {file.status === "error" && (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                    {(file.status === "uploading" || file.status === "processing") && (
                      <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                    )}
                  </div>
                </div>
                
                {/* Individual file progress bar */}
                <div className="w-full h-1 bg-gray-700 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      file.status === "error" 
                        ? "bg-red-500" 
                        : file.status === "complete"
                          ? "bg-green-500"
                          : "bg-blue-500"
                    }`}
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
                
                {/* File status message */}
                <div className="mt-1 text-xs">
                  <span className={`
                    ${file.status === "error" ? "text-red-400" : ""}
                    ${file.status === "complete" ? "text-green-400" : ""}
                    ${file.status === "uploading" || file.status === "processing" ? "text-gray-400" : ""}
                  `}>
                    {file.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDocumentUpload;