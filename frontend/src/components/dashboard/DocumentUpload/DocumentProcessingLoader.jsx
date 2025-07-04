

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
//       className="fixed inset-0 z-[1000] bg-black/60 dark:bg-black/80 backdrop-blur-sm 
//                 flex items-center justify-center p-4"
//     >
//       <div className="w-full max-w-2xl bg-white/90 dark:bg-gray-900/90 border border-[#d6cbbf] dark:border-blue-500/20 rounded-lg p-6 shadow-lg">
//         {/* Overall progress header */}
//         <div className="flex justify-between items-center mb-4">
//           <div className="flex items-center space-x-2">
//             {safeProgress < 75 ? (
//               <Paperclip className="h-5 w-5 text-[#a55233] dark:text-blue-400" />
//             ) : safeProgress < 100 ? (
//               <Server className="h-5 w-5 text-[#556052] dark:text-green-400" />
//             ) : (
//               <CheckCircle className="h-5 w-5 text-[#556052] dark:text-green-400" />
//             )}
//             <span className="font-medium text-[#0a3b25] dark:text-white text-lg">{statusMessage}</span>
//           </div>
//           {onCancel && (
//             <button 
//               onClick={onCancel}
//               className="p-1 hover:bg-[#f5e6d8] dark:hover:bg-gray-700 rounded-full transition-colors"
//             >
//               <X className="h-5 w-5 text-[#5a544a] hover:text-[#5e4636] dark:text-gray-400 dark:hover:text-white" />
//             </button>
//           )}
//         </div>

//         {/* Main progress bar */}
//         <div className="w-full h-3 bg-[#e9dcc9] dark:bg-gray-700 rounded-full mb-2">
//           <div
//             className="h-full bg-gradient-to-r from-[#a55233] to-[#556052] dark:from-blue-500 dark:to-green-500 rounded-full transition-all duration-300"
//             style={{ width: `${safeProgress}%` }}
//           ></div>
//         </div>
        
//         {/* Overall status text */}
//         {/* <div className="flex justify-between text-sm mb-6">
//           <span className="text-[#5a544a] dark:text-gray-300">{getCompletionStatus()}</span>
//           {/* <span className="text-gray-300 font-bold">{Math.round(safeProgress)}%</span> */}
//         {/* </div> */} 

//         {/* Status message */}
//         <div className="text-center mb-6">
//           <p className="text-[#5e4636] dark:text-white text-lg font-medium">{statusMessage}</p>
//           <p className="text-[#8c715f] dark:text-gray-400">{secondaryMessage}</p>
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
//               <div key={index} className="bg-[#f5e6d8]/60 dark:bg-gray-800/60 rounded-md p-3">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-sm text-[#5e4636] dark:text-white truncate" title={docName}>
//                     {docName}
//                   </span>
//                   <div className="flex items-center">
//                     {docStatus === "complete" && (
//                       <CheckCircle className="h-4 w-4 text-[#556052] dark:text-green-400" />
//                     )}
//                     {docStatus === "error" && (
//                       <AlertTriangle className="h-4 w-4 text-[#ff4a4a] dark:text-red-400" />
//                     )}
//                     {docStatus === "processing" && (
//                       <div className="h-4 w-4 rounded-full border-2 border-[#a55233] dark:border-blue-500 border-t-transparent animate-spin"></div>
//                     )}
//                     {docStatus === "uploading" && (
//                       <div className="h-4 w-4 rounded-full border-2 border-[#a55233] dark:border-blue-500 border-t-transparent animate-spin"></div>
//                     )}
//                     {docStatus === "waiting" && (
//                       <div className="h-4 w-4 rounded-full border-2 border-[#d6cbbf] dark:border-gray-500 opacity-50"></div>
//                     )}
//                     {docStatus === "uploaded" && (
//                       <div className="h-4 w-4 rounded-full border-2 border-[#8b4513] dark:border-yellow-500"></div>
//                     )}
//                   </div>
//                 </div>
                
//                 {/* Individual file progress bar */}
//                 <div className="w-full h-1 bg-[#e9dcc9] dark:bg-gray-700 rounded-full">
//                   <div
//                     className={`h-full rounded-full transition-all duration-300 ${
//                       docStatus === "error" 
//                         ? "bg-[#ff4a4a] dark:bg-red-500" 
//                         : docStatus === "complete"
//                           ? "bg-[#556052] dark:bg-green-500"
//                           : docStatus === "uploaded"
//                             ? "bg-[#8b4513] dark:bg-yellow-500"
//                             : "bg-[#a55233] dark:bg-blue-500"
//                     }`}
//                     style={{ width: `${Math.min(100, Math.max(0, docProgress))}%` }}
//                   ></div>
//                 </div>
                
//                 {/* Document status message */}
//                 <div className="mt-1 text-xs">
//                   <span className={`
//                     ${docStatus === "error" ? "text-[#ff4a4a] dark:text-red-400" : ""}
//                     ${docStatus === "complete" ? "text-[#556052] dark:text-green-400" : ""}
//                     ${docStatus === "uploaded" ? "text-[#8b4513] dark:text-yellow-400" : ""}
//                     ${docStatus === "processing" ? "text-[#a55233] dark:text-blue-400" : ""}
//                     ${docStatus === "uploading" ? "text-[#a55233] dark:text-blue-400" : ""}
//                     ${docStatus === "waiting" ? "text-[#8c715f] dark:text-gray-400" : ""}
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
//             className="mt-6 px-4 py-2 bg-white hover:bg-[#f5e6d8] text-[#5e4636] border border-[#d6cbbf]
//                     dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white 
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
import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  X,
  Paperclip,
  Server,
  Loader as LoaderIcon,
  Clock,
  ArrowRight,
} from "lucide-react";
import PropTypes from "prop-types";

// Animated shimmer for progress bar
const Shimmer = () => (
  <div className="absolute inset-0 w-full h-full overflow-hidden rounded-full">
    <div className="animate-shimmer w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-40" />
  </div>
);

const statusIcon = {
  waiting: <Clock className="h-5 w-5 text-[#a55233] dark:text-blue-400 animate-pulse" />,
  uploading: <LoaderIcon className="h-5 w-5 text-[#a55233] dark:text-blue-400 animate-spin" />,
  uploaded: <Server className="h-5 w-5 text-[#556052] dark:text-green-400 animate-bounce" />,
  processing: <LoaderIcon className="h-5 w-5 text-[#7b2cbf] dark:text-blue-400 animate-spin" />,
  parsing: <LoaderIcon className="h-5 w-5 text-[#7b2cbf] dark:text-blue-400 animate-spin" />,
  indexing: <LoaderIcon className="h-5 w-5 text-[#1b7742] dark:text-green-400 animate-spin" />,
  complete: <CheckCircle className="h-5 w-5 text-[#556052] dark:text-green-400 animate-pop" />,
  error: <AlertTriangle className="h-5 w-5 text-[#ff4a4a] dark:text-red-400 animate-shake" />,
};

const statusLabel = {
  waiting: "In queue",
  uploading: "Uploading...",
  uploaded: "Uploaded, awaiting processing...",
  processing: "Processing...",
  parsing: "Parsing (LlamaParse)...",
  indexing: "Indexing...",
  complete: "Complete!",
  error: "Failed",
};

const getStatusGroup = (docs, statusArr) =>
  docs.filter((doc) => statusArr.includes(doc.status));

const DocumentProcessingLoader = ({
  documents = [],
  queuedFilenames = [],
  onComplete,
  onCancel,
  showLoader = true,
}) => {
  if (!showLoader) return null;

  // Find docs in queue (not yet started by backend)
  const backendFilenames = documents.map(doc => doc.filename);
  const frontendQueued = queuedFilenames
    .filter(name => !backendFilenames.includes(name))
    .map(name => ({
      filename: name,
      status: "waiting",
      progress: 0,
      message: "In queue",
    }));

  // Merge backend and frontend queue
  const allDocs = [...documents, ...frontendQueued];

  const queuedDocs = getStatusGroup(allDocs, ["waiting"]);
  const activeDocs = getStatusGroup(allDocs, [
    "uploading",
    "uploaded",
    "processing",
    "parsing",
    "indexing",
  ]);
  const completedDocs = getStatusGroup(allDocs, ["complete"]);
  const erroredDocs = getStatusGroup(allDocs, ["error"]);

  const allComplete = allDocs.length > 0 && allDocs.every((doc) => doc.status === "complete");
  const anyError = erroredDocs.length > 0;

  let mainStatus = "Processing documents...";
  if (allComplete) mainStatus = "All documents processed!";
  else if (anyError) mainStatus = "Some documents failed to process";

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/95 dark:bg-gray-900/95 border border-[#d6cbbf] dark:border-blue-500/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-gradient-to-br from-[#a55233]/30 via-[#7b2cbf]/20 to-[#1b7742]/10 rounded-full blur-2xl animate-pulse-slow" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-gradient-to-tr from-[#1b7742]/30 via-[#7b2cbf]/20 to-[#a55233]/10 rounded-full blur-2xl animate-pulse-slower" />
        </div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center space-x-3">
            {allComplete
              ? statusIcon.complete
              : anyError
              ? statusIcon.error
              : statusIcon.processing}
            <span className="font-semibold text-[#0a3b25] dark:text-white text-xl tracking-wide drop-shadow">
              {mainStatus}
            </span>
          </div>
          {onCancel && !allComplete && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-[#f5e6d8] dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Cancel processing"
            >
              <X className="h-6 w-6 text-[#5a544a] hover:text-[#5e4636] dark:text-gray-400 dark:hover:text-white" />
            </button>
          )}
        </div>

        {/* Queued documents */}
        {queuedDocs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-[#a55233] dark:text-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-[#a55233] dark:text-blue-400 uppercase tracking-wider">
                In Queue
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {queuedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-[#f5e6d8]/70 dark:bg-gray-800/70 rounded-lg px-3 py-1 text-xs font-medium text-[#5e4636] dark:text-white animate-queue"
                >
                  <Paperclip className="h-4 w-4 mr-1 animate-pulse" />
                  <span className="truncate max-w-[120px]">{doc.filename}</span>
                  <span className="ml-2 px-2 py-0.5 bg-[#e9dcc9] dark:bg-gray-700 rounded-full text-[10px] font-bold text-[#a55233] dark:text-blue-400">
                    QUEUED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active processing documents */}
        {activeDocs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="h-4 w-4 text-[#7b2cbf] dark:text-blue-400 animate-bounce" />
              <span className="text-xs font-semibold text-[#7b2cbf] dark:text-blue-400 uppercase tracking-wider">
                Processing
              </span>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
              {activeDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="bg-[#f5e6d8]/80 dark:bg-gray-800/80 rounded-lg p-3 flex items-center shadow transition-all duration-300"
                >
                  <div className="flex-shrink-0 mr-3">
                    {statusIcon[doc.status] || statusIcon.processing}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm text-[#5e4636] dark:text-white truncate"
                        title={doc.filename}
                      >
                        {doc.filename}
                      </span>
                      <span
                        className={`text-xs ml-2 font-semibold ${
                          doc.status === "error"
                            ? "text-[#ff4a4a] dark:text-red-400"
                            : doc.status === "complete"
                            ? "text-[#556052] dark:text-green-400"
                            : doc.status === "parsing"
                            ? "text-[#7b2cbf] dark:text-blue-400"
                            : doc.status === "indexing"
                            ? "text-[#1b7742] dark:text-green-400"
                            : doc.status === "uploading"
                            ? "text-[#a55233] dark:text-blue-400"
                            : "text-[#8c715f] dark:text-gray-400"
                        }`}
                      >
                        {doc.message || statusLabel[doc.status] || "Processing..."}
                      </span>
                    </div>
                    {/* Animated progress bar */}
                    {(doc.status === "uploading" ||
                      doc.status === "processing" ||
                      doc.status === "parsing" ||
                      doc.status === "indexing") &&
                      typeof doc.progress === "number" && (
                        <div className="w-full h-2 bg-[#e9dcc9] dark:bg-gray-700 rounded-full mt-2 relative overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              doc.status === "error"
                                ? "bg-[#ff4a4a] dark:bg-red-500"
                                : doc.status === "complete"
                                ? "bg-[#556052] dark:bg-green-500"
                                : doc.status === "parsing"
                                ? "bg-gradient-to-r from-[#7b2cbf] via-[#a55233] to-[#1b7742] dark:from-blue-500 dark:to-green-500"
                                : doc.status === "indexing"
                                ? "bg-gradient-to-r from-[#1b7742] via-[#7b2cbf] to-[#a55233] dark:from-green-500 dark:to-blue-500"
                                : "bg-gradient-to-r from-[#a55233] via-[#7b2cbf] to-[#556052] dark:from-blue-500 dark:to-green-500"
                            } animate-progress`}
                            style={{
                              width: `${Math.min(100, Math.max(0, doc.progress))}%`,
                            }}
                          >
                            <Shimmer />
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed documents */}
        {completedDocs.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-[#1b7742] dark:text-green-400" />
              <span className="text-xs font-semibold text-[#1b7742] dark:text-green-400 uppercase tracking-wider">
                Completed
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {completedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-[#e9dcc9]/80 dark:bg-green-900/40 rounded-lg px-3 py-1 text-xs font-medium text-[#556052] dark:text-green-200 animate-pop"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="truncate max-w-[120px]">{doc.filename}</span>
                  <span className="ml-2 px-2 py-0.5 bg-[#d6cbbf] dark:bg-green-800 rounded-full text-[10px] font-bold text-[#1b7742] dark:text-green-300">
                    DONE
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errored documents */}
        {erroredDocs.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-[#ff4a4a] dark:text-red-400 animate-shake" />
              <span className="text-xs font-semibold text-[#ff4a4a] dark:text-red-400 uppercase tracking-wider">
                Failed
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {erroredDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-[#ff4a4a]/10 dark:bg-red-900/40 rounded-lg px-3 py-1 text-xs font-medium text-[#ff4a4a] dark:text-red-300 animate-shake"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="truncate max-w-[120px]">{doc.filename}</span>
                  <span className="ml-2 px-2 py-0.5 bg-[#ff4a4a]/20 dark:bg-red-800 rounded-full text-[10px] font-bold text-[#ff4a4a] dark:text-red-300">
                    ERROR
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancel button */}
        {!allComplete && onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 px-4 py-2 bg-white hover:bg-[#f5e6d8] text-[#5e4636] border border-[#d6cbbf]
                    dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white 
                    rounded-lg transition-colors duration-300 mx-auto block"
          >
            Cancel Processing
          </button>
        )}

        {/* Animations */}
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .animate-shimmer {
            animation: shimmer 1.5s infinite linear;
          }
          @keyframes pop {
            0% { transform: scale(0.8); opacity: 0.5; }
            60% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-pop {
            animation: pop 0.5s;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-4px); }
            40%, 80% { transform: translateX(4px); }
          }
          .animate-shake {
            animation: shake 0.6s;
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s infinite;
          }
          @keyframes pulse-slower {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
          .animate-pulse-slower {
            animation: pulse-slower 6s infinite;
          }
          @keyframes queue-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          .animate-queue {
            animation: queue-bounce 1.2s infinite;
          }
          @keyframes progress {
            0% { width: 0; }
            100% { width: 100%; }
          }
          .animate-progress {
            transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
          }
        `}</style>
      </div>
    </div>
  );
};

DocumentProcessingLoader.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      filename: PropTypes.string.isRequired,
      status: PropTypes.oneOf([
        "waiting",
        "uploading",
        "uploaded",
        "processing",
        "parsing",
        "indexing",
        "complete",
        "error",
      ]).isRequired,
      progress: PropTypes.number,
      message: PropTypes.string,
    })
  ),
  queuedFilenames: PropTypes.arrayOf(PropTypes.string),
  onComplete: PropTypes.func,
  onCancel: PropTypes.func,
  showLoader: PropTypes.bool,
};

export default DocumentProcessingLoader;