// import React, { useState, useEffect } from "react";
// import { ScrollText, FileText, CheckCircle, XCircle } from "lucide-react";
// import PropTypes from "prop-types";

// const DocumentProcessingLoader = ({ 
//   progress, 
//   documents = [], 
//   onComplete,
//   onCancel,
//   showLoader = true
// }) => {
//   // Ensure progress is a valid number between 0-100
//   const safeProgress = typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : 0;
  
//   // Status messages based on progress
//   const [statusMessage, setStatusMessage] = useState("Initializing...");
//   const [secondaryMessage, setSecondaryMessage] = useState("");
  
//   // Process completion animation
//   const [showCompletion, setShowCompletion] = useState(false);
  
//   useEffect(() => {
//     // Update messages based on progress
//     if (safeProgress < 10) {
//       setStatusMessage("Initializing documents...");
//       setSecondaryMessage("Getting things ready");
//     } else if (safeProgress < 30) {
//       setStatusMessage("Uploading documents...");
//       setSecondaryMessage("Sending your files to our servers");
//     } else if (safeProgress < 50) {
//       setStatusMessage("Processing content...");
//       setSecondaryMessage("Extracting text and information");
//     } else if (safeProgress < 70) {
//       setStatusMessage("Analyzing documents...");
//       setSecondaryMessage("Identifying key concepts and structure");
//     } else if (safeProgress < 90) {
//       setStatusMessage("Almost there...");
//       setSecondaryMessage("Preparing your documents for interaction");
//     } else if (safeProgress < 100) {
//       setStatusMessage("Finalizing...");
//       setSecondaryMessage("Just a few more seconds");
//     } else {
//       setStatusMessage("Processing complete!");
//       setSecondaryMessage("Your documents are ready");
      
//       // Show completion animation when 100% is reached
//       if (!showCompletion) {
//         setShowCompletion(true);
//         // Call onComplete callback after animation
//         setTimeout(() => {
//           if (onComplete) onComplete();
//         }, 1500);
//       }
//     }
//   }, [safeProgress, onComplete, showCompletion]);
  
//   // Don't render if we shouldn't show the loader
//   if (!showLoader) return null;

//   return (
//     <div
//       className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm 
//                 flex flex-col items-center justify-center space-y-8"
//     >
//       {/* Progress Circle */}
//       <div className="relative w-32 h-32">
//         {/* Background Circle */}
//         <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
//           <circle
//             className="text-gray-700"
//             strokeWidth="8"
//             stroke="currentColor"
//             fill="transparent"
//             r="42"
//             cx="50"
//             cy="50"
//           />
//           {/* Progress Circle */}
//           <circle
//             className="text-blue-500 transition-all duration-300 ease-in-out"
//             strokeWidth="8"
//             strokeDasharray={264}
//             strokeDashoffset={264 - (safeProgress / 100) * 264}
//             strokeLinecap="round"
//             stroke="currentColor"
//             fill="transparent"
//             r="42"
//             cx="50"
//             cy="50"
//           />
//         </svg>
        
//         {/* Percentage in center */}
//         <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
//           <span className="text-2xl font-bold text-white">{Math.round(safeProgress)}%</span>
//         </div>
        
//         {/* Completion check icon with animation */}
//         {showCompletion && (
//           <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center animate-scale-in">
//             <CheckCircle className="w-20 h-20 text-green-500" />
//           </div>
//         )}
//       </div>

//       {/* Status text */}
//       <div className="text-center space-y-2">
//         <h2 className="text-xl font-bold text-white">
//           {statusMessage}
//         </h2>
//         <p className="text-gray-300">
//           {secondaryMessage}
//         </p>
//       </div>

//       {/* Document list - show if there are documents */}
//       {documents.length > 0 && (
//         <div className="w-full max-w-md bg-gray-900/70 rounded-lg p-4 mt-4 border border-gray-700">
//           <h3 className="text-sm text-gray-400 mb-3 flex items-center space-x-2">
//             <FileText className="h-4 w-4" />
//             <span>Documents being processed: {documents.length}</span>
//           </h3>
          
//           <div className="max-h-40 overflow-y-auto custom-scrollbar">
//             <ul className="space-y-2">
//               {documents.map((doc, index) => (
//                 <li 
//                   key={index}
//                   className="text-sm text-white flex items-center space-x-2 border-b border-gray-700 pb-2"
//                 >
//                   <ScrollText className="h-3 w-3 text-blue-400" />
//                   <span className="truncate flex-1">{typeof doc === 'string' ? doc : doc.filename || `Document ${index + 1}`}</span>
//                   {safeProgress === 100 ? (
//                     <CheckCircle className="h-4 w-4 text-green-400" />
//                   ) : (
//                     <div className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>
//       )}

//       {/* Cancel button - only show if progress is not complete */}
//       {safeProgress < 100 && onCancel && (
//         <button
//           onClick={onCancel}
//           className="mt-4 px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white 
//                    rounded-lg transition-colors duration-300"
//         >
//           Cancel
//         </button>
//       )}
      
//       {/* Add animation keyframes */}
//       <style jsx>{`
//         @keyframes scale-in {
//           0% { transform: scale(0); opacity: 0; }
//           60% { transform: scale(1.2); opacity: 1; }
//           100% { transform: scale(1); opacity: 1; }
//         }
//         .animate-scale-in {
//           animation: scale-in 0.5s ease-out forwards;
//         }
//       `}</style>
//     </div>
//   );
// };

// DocumentProcessingLoader.propTypes = {
//   progress: PropTypes.number.isRequired,
//   documents: PropTypes.arrayOf(
//     PropTypes.oneOfType([
//       PropTypes.string,
//       PropTypes.shape({
//         id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
//         filename: PropTypes.string
//       })
//     ])
//   ),
//   onComplete: PropTypes.func,
//   onCancel: PropTypes.func,
//   showLoader: PropTypes.bool
// };

// export default DocumentProcessingLoader;

// import React, { useState, useEffect } from "react";
// import { ScrollText, FileText, CheckCircle, XCircle, Paperclip, AlertTriangle, X, Server } from "lucide-react";
// import PropTypes from "prop-types";

// const DocumentProcessingLoader = ({ 
//   progress, 
//   documents = [], 
//   onComplete,
//   onCancel,
//   showLoader = true
// }) => {
//   // Ensure progress is a valid number between 0-100
//   const safeProgress = typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : 0;
  
//   // Status messages based on progress
//   const [statusMessage, setStatusMessage] = useState("Initializing...");
//   const [secondaryMessage, setSecondaryMessage] = useState("");
  
//   // Process completion animation
//   const [showCompletion, setShowCompletion] = useState(false);
  
//   useEffect(() => {
//     // Update messages based on progress with more granular stages
//     if (safeProgress < 5) {
//       setStatusMessage("Initializing upload...");
//       setSecondaryMessage("Preparing your documents");
//     } else if (safeProgress < 25) {
//       setStatusMessage("Uploading documents...");
//       setSecondaryMessage(`${Math.round(safeProgress/0.7)}% uploaded`);
//     } else if (safeProgress < 50) {
//       setStatusMessage("Processing documents...");
//       setSecondaryMessage(`Transferring data to the server (${Math.round(safeProgress/0.7)}% complete)`);
//     } else if (safeProgress < 70) {
//       setStatusMessage("Finalizing upload...");
//       setSecondaryMessage("Almost done with upload stage");
//     } else if (safeProgress === 75) {
//       setStatusMessage("Upload complete!");
//       setSecondaryMessage("Beginning document processing");
//     } else if (safeProgress < 85) {
//       setStatusMessage("Processing content...");
//       setSecondaryMessage("Extracting text and information");
//     } else if (safeProgress < 90) {
//       setStatusMessage("Analyzing documents...");
//       setSecondaryMessage("Identifying key concepts and structure");
//     } else if (safeProgress < 95) {
//       setStatusMessage("Creating search index...");
//       setSecondaryMessage("Making your documents searchable");
//     } else if (safeProgress < 100) {
//       setStatusMessage("Finalizing...");
//       setSecondaryMessage("Just a few more seconds");
//     } else {
//       setStatusMessage("Processing complete!");
//       setSecondaryMessage("Your documents are ready");
      
//       // Show completion animation when 100% is reached
//       if (!showCompletion) {
//         setShowCompletion(true);
//         // Call onComplete callback after animation
//         setTimeout(() => {
//           if (onComplete) onComplete();
//         }, 1000);
//       }
//     }
//   }, [safeProgress, onComplete, showCompletion]);
  
//   // Don't render if we shouldn't show the loader
//   if (!showLoader) return null;

//   // Get completion status for multiple documents
//   const getCompletionStatus = () => {
//     const total = documents.length;
    
//     // For accurate document-by-document tracking, compute based on progress bands
//     let completed;
//     if (safeProgress < 75) {
//       // During upload, show partially completed documents
//       completed = Math.floor((safeProgress / 75) * total);
//     } else if (safeProgress < 100) {
//       // During processing, all documents are being processed
//       completed = 0;
//     } else {
//       // When complete, all documents are processed
//       completed = total;
//     }
    
//     const remaining = total - completed;
    
//     if (safeProgress < 75) {
//       return `Uploading: ${completed} of ${total} documents`;
//     } else if (safeProgress < 100) {
//       return `Processing ${total} document${total > 1 ? 's' : ''}`;
//     } else {
//       return `All ${total} document${total > 1 ? 's' : ''} processed!`;
//     }
//   };

//   return (
//     <div 
//       className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm 
//                 flex items-center justify-center p-4"
//     >
//       <div className="w-full max-w-2xl bg-gray-900/90 border border-blue-500/20 rounded-lg p-6 shadow-lg">
//         {/* Overall progress header */}
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex items-center space-x-2">
//             {safeProgress < 75 ? (
//               <Paperclip className="h-5 w-5 text-blue-400" />
//             ) : safeProgress < 100 ? (
//               <Server className="h-5 w-5 text-green-400" />
//             ) : (
//               <CheckCircle className="h-5 w-5 text-green-400" />
//             )}
//             <span className="font-medium text-white text-lg">{statusMessage}</span>
//           </div>
//           {onCancel && (
//             <button 
//               onClick={onCancel}
//               className="p-1 hover:bg-gray-700 rounded-full transition-colors"
//             >
//               <X className="h-5 w-5 text-gray-400 hover:text-white" />
//             </button>
//           )}
//         </div>

//         {/* Main progress bar */}
//         <div className="w-full h-3 bg-gray-700 rounded-full mb-2">
//           <div
//             className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
//             style={{ width: `${safeProgress}%` }}
//           ></div>
//         </div>
        
//         {/* Overall status text */}
//         <div className="flex justify-between text-sm mb-6">
//           <span className="text-gray-300">{getCompletionStatus()}</span>
//           <span className="text-gray-300 font-bold">{Math.round(safeProgress)}%</span>
//         </div>

//         {/* Status message */}
//         <div className="text-center mb-6">
//           <p className="text-white text-lg font-medium">{statusMessage}</p>
//           <p className="text-gray-400">{secondaryMessage}</p>
//         </div>

//         {/* Individual document progress */}
//         <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
//           {documents.map((doc, index) => {
//             const docName = typeof doc === 'string' ? doc : doc.filename || `Document ${index + 1}`;
            
//             // Calculate individual progress based on overall progress
//             let docProgress;
//             let docStatus;
            
//             if (safeProgress < 75) {
//               // During upload (0-75%), spread document progress
//               const startPoint = (index / documents.length) * 75;
//               const endPoint = ((index + 1) / documents.length) * 75;
              
//               if (safeProgress < startPoint) {
//                 // This document hasn't started uploading yet
//                 docProgress = 0;
//                 docStatus = "waiting";
//               } else if (safeProgress >= endPoint) {
//                 // This document is done uploading
//                 docProgress = 100;
//                 docStatus = "uploaded";
//               } else {
//                 // This document is currently uploading
//                 docProgress = ((safeProgress - startPoint) / (endPoint - startPoint)) * 100;
//                 docStatus = "uploading";
//               }
//             } else if (safeProgress < 100) {
//               // During processing (75-100%), all documents show processing progress
//               docProgress = (safeProgress - 75) * 4; // Scale 75-100% to 0-100% for processing
//               docStatus = "processing";
//             } else {
//               // All done
//               docProgress = 100;
//               docStatus = "complete";
//             }
            
//             return (
//               <div key={index} className="bg-gray-800/60 rounded-md p-3">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-sm text-white truncate" title={docName}>
//                     {docName}
//                   </span>
//                   <div className="flex items-center">
//                     {docStatus === "complete" && (
//                       <CheckCircle className="h-4 w-4 text-green-400" />
//                     )}
//                     {docStatus === "error" && (
//                       <AlertTriangle className="h-4 w-4 text-red-400" />
//                     )}
//                     {docStatus === "processing" && (
//                       <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
//                     )}
//                     {docStatus === "uploading" && (
//                       <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
//                     )}
//                     {docStatus === "waiting" && (
//                       <div className="h-4 w-4 rounded-full border-2 border-gray-500 opacity-50"></div>
//                     )}
//                     {docStatus === "uploaded" && (
//                       <div className="h-4 w-4 rounded-full border-2 border-yellow-500"></div>
//                     )}
//                   </div>
//                 </div>
                
//                 {/* Individual file progress bar */}
//                 <div className="w-full h-1 bg-gray-700 rounded-full">
//                   <div
//                     className={`h-full rounded-full transition-all duration-300 ${
//                       docStatus === "error" 
//                         ? "bg-red-500" 
//                         : docStatus === "complete"
//                           ? "bg-green-500"
//                           : docStatus === "uploaded"
//                             ? "bg-yellow-500"
//                             : "bg-blue-500"
//                     }`}
//                     style={{ width: `${Math.min(100, Math.max(0, docProgress))}%` }}
//                   ></div>
//                 </div>
                
//                 {/* Document status message */}
//                 <div className="mt-1 text-xs">
//                   <span className={`
//                     ${docStatus === "error" ? "text-red-400" : ""}
//                     ${docStatus === "complete" ? "text-green-400" : ""}
//                     ${docStatus === "uploaded" ? "text-yellow-400" : ""}
//                     ${docStatus === "processing" ? "text-blue-400" : ""}
//                     ${docStatus === "uploading" ? "text-blue-400" : ""}
//                     ${docStatus === "waiting" ? "text-gray-400" : ""}
//                   `}>
//                     {docStatus === "complete" ? "Processing complete!" : 
//                      docStatus === "error" ? "Processing failed" :
//                      docStatus === "waiting" ? "Waiting to upload..." :
//                      docStatus === "uploaded" ? "Uploaded, waiting for processing..." :
//                      docStatus === "processing" ? `Processing: ${Math.round(docProgress)}%` :
//                      `Uploading: ${Math.round(docProgress)}%`}
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Cancel button - only show if progress is not complete */}
//         {safeProgress < 100 && onCancel && (
//           <button
//             onClick={onCancel}
//             className="mt-6 px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white 
//                     rounded-lg transition-colors duration-300 mx-auto block"
//           >
//             Cancel Processing
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// DocumentProcessingLoader.propTypes = {
//   progress: PropTypes.number.isRequired,
//   documents: PropTypes.arrayOf(
//     PropTypes.oneOfType([
//       PropTypes.string,
//       PropTypes.shape({
//         id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
//         filename: PropTypes.string
//       })
//     ])
//   ),
//   onComplete: PropTypes.func,
//   onCancel: PropTypes.func,
//   showLoader: PropTypes.bool
// };

// export default DocumentProcessingLoader;

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
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm 
                flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-gray-900/90 border border-blue-500/20 rounded-lg p-6 shadow-lg">
        {/* Overall progress header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            {safeProgress < 75 ? (
              <Paperclip className="h-5 w-5 text-blue-400" />
            ) : safeProgress < 100 ? (
              <Server className="h-5 w-5 text-green-400" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-400" />
            )}
            <span className="font-medium text-white text-lg">{statusMessage}</span>
          </div>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="p-1 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>

        {/* Main progress bar */}
        <div className="w-full h-3 bg-gray-700 rounded-full mb-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300"
            style={{ width: `${safeProgress}%` }}
          ></div>
        </div>
        
        {/* Overall status text */}
        <div className="flex justify-between text-sm mb-6">
          <span className="text-gray-300">{getCompletionStatus()}</span>
          {/* <span className="text-gray-300 font-bold">{Math.round(safeProgress)}%</span> */}
        </div>

        {/* Status message */}
        <div className="text-center mb-6">
          <p className="text-white text-lg font-medium">{statusMessage}</p>
          <p className="text-gray-400">{secondaryMessage}</p>
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
              <div key={index} className="bg-gray-800/60 rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white truncate" title={docName}>
                    {docName}
                  </span>
                  <div className="flex items-center">
                    {docStatus === "complete" && (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                    {docStatus === "error" && (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                    {docStatus === "processing" && (
                      <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                    )}
                    {docStatus === "uploading" && (
                      <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                    )}
                    {docStatus === "waiting" && (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-500 opacity-50"></div>
                    )}
                    {docStatus === "uploaded" && (
                      <div className="h-4 w-4 rounded-full border-2 border-yellow-500"></div>
                    )}
                  </div>
                </div>
                
                {/* Individual file progress bar */}
                <div className="w-full h-1 bg-gray-700 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      docStatus === "error" 
                        ? "bg-red-500" 
                        : docStatus === "complete"
                          ? "bg-green-500"
                          : docStatus === "uploaded"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, docProgress))}%` }}
                  ></div>
                </div>
                
                {/* Document status message */}
                <div className="mt-1 text-xs">
                  <span className={`
                    ${docStatus === "error" ? "text-red-400" : ""}
                    ${docStatus === "complete" ? "text-green-400" : ""}
                    ${docStatus === "uploaded" ? "text-yellow-400" : ""}
                    ${docStatus === "processing" ? "text-blue-400" : ""}
                    ${docStatus === "uploading" ? "text-blue-400" : ""}
                    ${docStatus === "waiting" ? "text-gray-400" : ""}
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
            className="mt-6 px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white 
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