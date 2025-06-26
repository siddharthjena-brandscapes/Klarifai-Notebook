

import React, { useState, useEffect } from "react";
import { ScrollText, FileText, CheckCircle, XCircle, Paperclip, AlertTriangle, X, Server } from "lucide-react";
import PropTypes from "prop-types";

const DocumentProcessingLoader = ({ 
  progress, 
  documents = [], 
  onComplete,
  onCancel,
  showLoader = true
}) => {
  // Ensure progress is a valid number between 0-100
  const safeProgress = typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : 0;
  
  // Status messages based on progress
  const [statusMessage, setStatusMessage] = useState("Initializing...");
  const [secondaryMessage, setSecondaryMessage] = useState("");
  
  // Process completion animation
  const [showCompletion, setShowCompletion] = useState(false);
  
  useEffect(() => {
    // Update messages based on progress with more granular stages
    if (safeProgress < 5) {
      setStatusMessage("Initializing upload...");
      setSecondaryMessage("Preparing your documents");
    } else if (safeProgress < 25) {
      setStatusMessage("Uploading documents...");
      setSecondaryMessage(`${Math.round(safeProgress/0.7)}% uploaded`);
    } else if (safeProgress < 50) {
      setStatusMessage("Processing documents...");
      setSecondaryMessage(`Transferring data to the server (${Math.round(safeProgress/0.7)}% complete)`);
    } else if (safeProgress < 70) {
      setStatusMessage("Finalizing upload...");
      setSecondaryMessage("Almost done with upload stage");
    } else if (safeProgress === 75) {
      setStatusMessage("Upload complete!");
      setSecondaryMessage("Beginning document processing");
    } else if (safeProgress < 85) {
      setStatusMessage("Processing content...");
      setSecondaryMessage("Extracting text and information");
    } else if (safeProgress < 90) {
      setStatusMessage("Analyzing documents...");
      setSecondaryMessage("Identifying key concepts and structure");
    } else if (safeProgress < 95) {
      setStatusMessage("Creating search index...");
      setSecondaryMessage("Making your documents searchable");
    } else if (safeProgress < 100) {
      setStatusMessage("Finalizing...");
      setSecondaryMessage("Just a few more seconds");
    } else {
      setStatusMessage("Processing complete!");
      setSecondaryMessage("Your documents are ready");
      
      // Show completion animation when 100% is reached
      if (!showCompletion) {
        setShowCompletion(true);
        // Call onComplete callback after animation
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1000);
      }
    }
  }, [safeProgress, onComplete, showCompletion]);
  
  // Don't render if we shouldn't show the loader
  if (!showLoader) return null;

  // Get completion status for multiple documents
  const getCompletionStatus = () => {
    const total = documents.length;
    
    // For accurate document-by-document tracking, compute based on progress bands
    let completed;
    if (safeProgress < 75) {
      // During upload, show partially completed documents
      completed = Math.floor((safeProgress / 75) * total);
    } else if (safeProgress < 100) {
      // During processing, all documents are being processed
      completed = 0;
    } else {
      // When complete, all documents are processed
      completed = total;
    }
    
    const remaining = total - completed;
    
    if (safeProgress < 75) {
      return `Uploading: ${completed} of ${total} documents`;
    } else if (safeProgress < 100) {
      return `Processing ${total} document${total > 1 ? 's' : ''}`;
    } else {
      return `All ${total} document${total > 1 ? 's' : ''} processed!`;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/60 dark:bg-black/80 backdrop-blur-sm 
                flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-white/90 dark:bg-gray-900/90 border border-[#d6cbbf] dark:border-blue-500/20 rounded-lg p-6 shadow-lg">
        {/* Overall progress header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            {safeProgress < 75 ? (
              <Paperclip className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
            ) : safeProgress < 100 ? (
              <Server className="h-5 w-5 text-[#556052] dark:text-green-400" />
            ) : (
              <CheckCircle className="h-5 w-5 text-[#556052] dark:text-green-400" />
            )}
            <span className="font-medium text-[#0a3b25] dark:text-white text-lg">{statusMessage}</span>
          </div>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="p-1 hover:bg-[#f5e6d8] dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-[#5a544a] hover:text-[#5e4636] dark:text-gray-400 dark:hover:text-white" />
            </button>
          )}
        </div>

        {/* Main progress bar */}
        <div className="w-full h-3 bg-[#e9dcc9] dark:bg-gray-700 rounded-full mb-2">
          <div
            className="h-full bg-gradient-to-r from-[#a55233] to-[#556052] dark:from-blue-500 dark:to-green-500 rounded-full transition-all duration-300"
            style={{ width: `${safeProgress}%` }}
          ></div>
        </div>
        
        {/* Overall status text */}
        <div className="flex justify-between text-sm mb-6">
          <span className="text-[#5a544a] dark:text-gray-300">{getCompletionStatus()}</span>
          {/* <span className="text-gray-300 font-bold">{Math.round(safeProgress)}%</span> */}
        </div>

        {/* Status message */}
        <div className="text-center mb-6">
          <p className="text-[#5e4636] dark:text-white text-lg font-medium">{statusMessage}</p>
          <p className="text-[#8c715f] dark:text-gray-400">{secondaryMessage}</p>
        </div>

        {/* Individual document progress */}
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
          {documents.map((doc, index) => {
            const docName = typeof doc === 'string' ? doc : doc.filename || `Document ${index + 1}`;
            
            // Calculate individual progress based on overall progress
            let docProgress;
            let docStatus;
            
            if (safeProgress < 75) {
              // During upload (0-75%), spread document progress
              const startPoint = (index / documents.length) * 75;
              const endPoint = ((index + 1) / documents.length) * 75;
              
              if (safeProgress < startPoint) {
                // This document hasn't started uploading yet
                docProgress = 0;
                docStatus = "waiting";
              } else if (safeProgress >= endPoint) {
                // This document is done uploading
                docProgress = 100;
                docStatus = "uploaded";
              } else {
                // This document is currently uploading
                docProgress = ((safeProgress - startPoint) / (endPoint - startPoint)) * 100;
                docStatus = "uploading";
              }
            } else if (safeProgress < 100) {
              // During processing (75-100%), all documents show processing progress
              docProgress = (safeProgress - 75) * 4; // Scale 75-100% to 0-100% for processing
              docStatus = "processing";
            } else {
              // All done
              docProgress = 100;
              docStatus = "complete";
            }
            
            return (
              <div key={index} className="bg-[#f5e6d8]/60 dark:bg-gray-800/60 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-[#5e4636] dark:text-white truncate" title={docName}>
                    {docName}
                  </span>
                  <div className="flex items-center">
                    {docStatus === "complete" && (
                      <CheckCircle className="h-4 w-4 text-[#556052] dark:text-green-400" />
                    )}
                    {docStatus === "error" && (
                      <AlertTriangle className="h-4 w-4 text-[#ff4a4a] dark:text-red-400" />
                    )}
                    {docStatus === "processing" && (
                      <div className="h-4 w-4 rounded-full border-2 border-[#a55233] dark:border-blue-500 border-t-transparent animate-spin"></div>
                    )}
                    {docStatus === "uploading" && (
                      <div className="h-4 w-4 rounded-full border-2 border-[#a55233] dark:border-blue-500 border-t-transparent animate-spin"></div>
                    )}
                    {docStatus === "waiting" && (
                      <div className="h-4 w-4 rounded-full border-2 border-[#d6cbbf] dark:border-gray-500 opacity-50"></div>
                    )}
                    {docStatus === "uploaded" && (
                      <div className="h-4 w-4 rounded-full border-2 border-[#8b4513] dark:border-yellow-500"></div>
                    )}
                  </div>
                </div>
                
                {/* Individual file progress bar */}
                <div className="w-full h-1 bg-[#e9dcc9] dark:bg-gray-700 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      docStatus === "error" 
                        ? "bg-[#ff4a4a] dark:bg-red-500" 
                        : docStatus === "complete"
                          ? "bg-[#556052] dark:bg-green-500"
                          : docStatus === "uploaded"
                            ? "bg-[#8b4513] dark:bg-yellow-500"
                            : "bg-[#a55233] dark:bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, docProgress))}%` }}
                  ></div>
                </div>
                
                {/* Document status message */}
                <div className="mt-1 text-xs">
                  <span className={`
                    ${docStatus === "error" ? "text-[#ff4a4a] dark:text-red-400" : ""}
                    ${docStatus === "complete" ? "text-[#556052] dark:text-green-400" : ""}
                    ${docStatus === "uploaded" ? "text-[#8b4513] dark:text-yellow-400" : ""}
                    ${docStatus === "processing" ? "text-[#a55233] dark:text-blue-400" : ""}
                    ${docStatus === "uploading" ? "text-[#a55233] dark:text-blue-400" : ""}
                    ${docStatus === "waiting" ? "text-[#8c715f] dark:text-gray-400" : ""}
                  `}>
                    {docStatus === "complete" ? "Processing complete!" : 
                     docStatus === "error" ? "Processing failed" :
                     docStatus === "waiting" ? "Waiting to upload..." :
                     docStatus === "uploaded" ? "Uploaded, waiting for processing..." :
                     docStatus === "processing" ? `Processing: ${Math.round(docProgress)}%` :
                     `Uploading: ${Math.round(docProgress)}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancel button - only show if progress is not complete */}
        {safeProgress < 100 && onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 px-4 py-2 bg-white hover:bg-[#f5e6d8] text-[#5e4636] border border-[#d6cbbf]
                    dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white 
                    rounded-lg transition-colors duration-300 mx-auto block"
          >
            Cancel Processing
          </button>
        )}
      </div>
    </div>
  );
};

DocumentProcessingLoader.propTypes = {
  progress: PropTypes.number.isRequired,
  documents: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        filename: PropTypes.string
      })
    ])
  ),
  onComplete: PropTypes.func,
  onCancel: PropTypes.func,
  showLoader: PropTypes.bool
};

export default DocumentProcessingLoader;