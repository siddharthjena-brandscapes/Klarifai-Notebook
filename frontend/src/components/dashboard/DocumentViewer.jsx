

// // DocumentViewer.jsx
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import PropTypes from 'prop-types';
// import { 
//   X, Download, ExternalLink, Maximize2, Minimize2, Move, 
//  ZoomIn, ZoomOut, RotateCcw
// } from 'lucide-react';
// import { documentService } from '../../utils/axiosConfig';
// import { toast } from 'react-toastify';

// const DocumentViewer = ({ documentId, filename, onClose, zIndex = 50, onBringToFront }) => {
//   const [documentUrl, setDocumentUrl] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [isMinimized, setIsMinimized] = useState(false);
  
//   // Position and size states
//   const [position, setPosition] = useState({ x: 0, y: 0 });
//   const [size, setSize] = useState({ width: '80%', height: '75%' });
//   const [prevSize, setPrevSize] = useState(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
//   // Document viewing states
//   const [zoomLevel, setZoomLevel] = useState(1.0);
//   const [rotation, setRotation] = useState(0);
//   // Add state for handling close animation
//   const [isClosing, setIsClosing] = useState(false);
  
//   // References
//   const viewerRef = useRef(null);
//   // const dragStartPosRef = useRef({ x: 0, y: 0 });
//   const iframeRef = useRef(null);
  
//   // Track when the viewer was last active
//   const [lastActive, setLastActive] = useState(Date.now());

//   // Load saved viewer state
//   useEffect(() => {
//     // Try to load saved state from localStorage
//     try {
//       const savedViewerState = localStorage.getItem('documentViewerState');
//       if (savedViewerState) {
//         const parsedState = JSON.parse(savedViewerState);
//         // Only restore if the screen size is similar to avoid positioning issues
//         if (window.innerWidth >= parsedState.screenWidth * 0.8) {
//           if (parsedState.position) setPosition(parsedState.position);
//           if (parsedState.size) setSize(parsedState.size);
//           if (parsedState.isMinimized !== undefined) setIsMinimized(parsedState.isMinimized);
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load viewer state:', error);
//     }
//   }, []);

//   // Save viewer state on relevant changes
//   useEffect(() => {
//     // Only save after initial render
//     if (documentUrl) {
//       const stateToSave = {
//         position,
//         size,
//         isMinimized,
//         screenWidth: window.innerWidth,
//         screenHeight: window.innerHeight,
//         lastDocumentId: documentId
//       };
      
//       try {
//         localStorage.setItem('documentViewerState', JSON.stringify(stateToSave));
//       } catch (error) {
//         console.error('Failed to save viewer state:', error);
//       }
//     }
//   }, [position, size, isMinimized, documentId, documentUrl]);

//   // DocumentViewer.jsx - Fixed fetchDocument method
// useEffect(() => {
//     const fetchDocument = async () => {
//         if (!documentId) return;
        
//         try {
//             setLoading(true);
            
//             // Log the document view first - non-blocking
//             documentService.trackDocumentView(documentId);
            
//             // Fetch the document with proper response type
//             const response = await documentService.getOriginalDocument(documentId);
            
//             console.log("=== DOCUMENT FETCH DEBUG ===");
//             console.log("Response status:", response.status);
//             console.log("Response headers:", response.headers);
//             console.log("Response data type:", typeof response.data);
//             console.log("Response data instanceof Blob:", response.data instanceof Blob);
//             console.log("Content-Type:", response.headers['content-type']);
            
//             // Check if response contains a redirect URL (JSON response)
//             if (response.data && typeof response.data === 'object' && response.data.redirect_url) {
//                 console.log("Received redirect URL:", response.data.redirect_url);
//                 setDocumentUrl(response.data.redirect_url);
//                 setLoading(false);
//                 return;
//             }
            
//             // Check if we received actual file content (blob or binary data)
//             let blob;
//             if (response.data instanceof Blob) {
//                 // Already a blob
//                 blob = response.data;
//                 console.log("Response is already a Blob:", blob.size, "bytes");
//             } else if (response.data instanceof ArrayBuffer || response.data instanceof Uint8Array) {
//                 // Convert ArrayBuffer/Uint8Array to Blob
//                 const contentType = response.headers['content-type'] || getContentType(filename);
//                 blob = new Blob([response.data], { type: contentType });
//                 console.log("Converted ArrayBuffer/Uint8Array to Blob:", blob.size, "bytes");
//             } else if (typeof response.data === 'string' && response.headers['content-type']?.includes('application/')) {
//                 // This might be base64 encoded or binary data as string
//                 try {
//                     // Try to convert to blob
//                     const contentType = response.headers['content-type'] || getContentType(filename);
//                     blob = new Blob([response.data], { type: contentType });
//                     console.log("Converted string data to Blob:", blob.size, "bytes");
//                 } catch (e) {
//                     console.error("Failed to convert string data to blob:", e);
//                     setError('Failed to process document data');
//                     setLoading(false);
//                     return;
//                 }
//             } else {
//                 // If we get here, we might have received the actual binary content
//                 // but axios didn't properly handle it as a blob
//                 console.log("Attempting to handle binary response data...");
//                 const contentType = response.headers['content-type'] || getContentType(filename);
                
//                 try {
//                     // Try to create blob from response data
//                     blob = new Blob([response.data], { type: contentType });
//                     console.log("Created Blob from response data:", blob.size, "bytes");
//                 } catch (e) {
//                     console.error("Failed to create blob from response data:", e);
//                     setError('Failed to load document. The document format may not be supported for preview.');
//                     setLoading(false);
//                     return;
//                 }
//             }
            
//             // Validate the blob
//             if (!blob || blob.size === 0) {
//                 console.error("Blob is empty or invalid");
//                 setError('Document is empty or corrupted');
//                 setLoading(false);
//                 return;
//             }
            
//             // Create object URL from the blob
//             const url = URL.createObjectURL(blob);
//             console.log("Created object URL:", url);
//             setDocumentUrl(url);
//             setLoading(false);
            
//         } catch (err) {
//             console.error('Error fetching document:', err);
//             console.error('Error details:', {
//                 message: err.message,
//                 response: err.response?.data,
//                 status: err.response?.status,
//                 headers: err.response?.headers
//             });
            
//             setError('Failed to load document. Please try again.');
//             setLoading(false);
//         }
//     };

//     fetchDocument();

//     // Center the viewer initially if no position was restored
//     if (viewerRef.current && !isMinimized && !isFullscreen && position.x === 0 && position.y === 0) {
//         const rect = viewerRef.current.getBoundingClientRect();
//         setPosition({
//             x: (window.innerWidth - rect.width) / 2,
//             y: Math.max(80, (window.innerHeight - rect.height) / 4)
//         });
//     }

//     // Clean up the blob URL when the component unmounts
//     return () => {
//         if (documentUrl && documentUrl.startsWith('blob:')) {
//             URL.revokeObjectURL(documentUrl);
//         }
//     };
// }, [documentId, filename, isMinimized, isFullscreen, position.x, position.y]);

//   // States for resize handling
//   const [isResizing, setIsResizing] = useState(false);
//   const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

//   // Setup event listeners for drag and resize
//   useEffect(() => {
//     const handleMouseMove = (e) => {
//       // Handle dragging
//       if (isDragging && !isFullscreen) {
//         const newX = e.clientX - dragOffset.x;
//         const newY = e.clientY - dragOffset.y;
        
//         // Ensure the viewer stays within the viewport
//         const maxX = window.innerWidth - (isMinimized ? 60 : 200);
//         const maxY = window.innerHeight - (isMinimized ? 60 : 100);
        
//         setPosition({
//           x: Math.min(Math.max(0, newX), maxX),
//           y: Math.min(Math.max(0, newY), maxY)
//         });
//       }
      
//       // Handle resizing
//       if (isResizing && !isFullscreen && !isMinimized) {
//         const deltaX = e.clientX - resizeStart.x;
//         const deltaY = e.clientY - resizeStart.y;
        
//         // Calculate new size with minimum constraints
//         const newWidth = Math.max(300, resizeStart.width + deltaX);
//         const newHeight = Math.max(200, resizeStart.height + deltaY);
        
//         // Enforce maximum size constraints
//         const maxWidth = window.innerWidth - position.x - 20;
//         const maxHeight = window.innerHeight - position.y - 20;
        
//         setSize({
//           width: `${Math.min(newWidth, maxWidth)}px`,
//           height: `${Math.min(newHeight, maxHeight)}px`
//         });
//       }
//     };
    
//     const handleMouseUp = () => {
//       setIsDragging(false);
//       setIsResizing(false);
//     };
    
//     if (isDragging || isResizing) {
//       document.addEventListener('mousemove', handleMouseMove);
//       document.addEventListener('mouseup', handleMouseUp);
//     }
    
//     return () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, [isDragging, isResizing, dragOffset, resizeStart, position, isMinimized, isFullscreen]);

//   const getContentType = (filename) => {
//     const extension = filename.split('.').pop().toLowerCase();
//     const contentTypes = {
//       'pdf': 'application/pdf',
//       'doc': 'application/msword',
//       'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       'xls': 'application/vnd.ms-excel',
//       'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'ppt': 'application/vnd.ms-powerpoint',
//       'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//       'txt': 'text/plain',
//       'csv': 'text/csv',
//       'jpg': 'image/jpeg',
//       'jpeg': 'image/jpeg',
//       'png': 'image/png',
//       'gif': 'image/gif'
//     };
    
//     return contentTypes[extension] || 'application/octet-stream';
//   };

//   const downloadDocument = () => {
//     if (documentUrl) {
//       const a = document.createElement('a');
//       a.href = documentUrl;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//     }
//   };

//   const toggleFullscreen = () => {
//     if (isMinimized) {
//       // If minimized, restore to normal first
//       toggleMinimize();
//     }
    
//     setIsFullscreen(!isFullscreen);
    
//     // Reset position when toggling fullscreen
//     if (!isFullscreen) {
//       // Save current size before going fullscreen
//       setPrevSize(size);
//     } else {
//       // When exiting fullscreen, center the viewer
//       setPosition({
//         x: (window.innerWidth - 800) / 2,
//         y: Math.max(80, (window.innerHeight - 600) / 4)
//       });
//     }
//   };

//   const toggleMinimize = () => {
//     if (isFullscreen && !isMinimized) {
//       // Exit fullscreen before minimizing
//       setIsFullscreen(false);
//     }
    
//     if (!isMinimized) {
//       // Save current size before minimizing
//       setPrevSize(size);
//     } 
    
//     setIsMinimized(!isMinimized);
//   };

//   const handleStartDrag = (e) => {
//     if (isFullscreen) return;
    
//     setIsDragging(true);
//     const rect = e.currentTarget.getBoundingClientRect();
//     setDragOffset({
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top
//     });
    
//     e.preventDefault();
//   };

//   const handleMinimizedClick = () => {
//     toggleMinimize();
//   };

//   // Zoom in function
//   const zoomIn = useCallback(() => {
//     setZoomLevel(prev => Math.min(prev + 0.25, 3.0));
//     toast.info(`Zoom: ${Math.round((zoomLevel + 0.25) * 100)}%`, { autoClose: 1000 });
//   }, [zoomLevel]);

//   // Zoom out function
//   const zoomOut = useCallback(() => {
//     setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
//     toast.info(`Zoom: ${Math.round((zoomLevel - 0.25) * 100)}%`, { autoClose: 1000 });
//   }, [zoomLevel]);
  
//   // Reset zoom and rotation
//   const resetView = useCallback(() => {
//     setZoomLevel(1.0);
//     setRotation(0);
//     toast.info('View reset', { autoClose: 1000 });
//   }, []);
  
//   // Rotate document
//   const rotateDocument = useCallback(() => {
//     setRotation(prev => (prev + 90) % 360);
//     toast.info(`Rotated to ${(rotation + 90) % 360}°`, { autoClose: 1000 });
//   }, [rotation]);

//   // Handle keyboard shortcuts
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       // Only process if the viewer is active
//       if (Date.now() - lastActive > 30000) return; // 30 seconds timeout
      
//       if (e.ctrlKey && e.key === '=') {
//         zoomIn();
//         e.preventDefault();
//       } else if (e.ctrlKey && e.key === '-') {
//         zoomOut();
//         e.preventDefault();
//       } else if (e.ctrlKey && e.key === '0') {
//         resetView();
//         e.preventDefault();
//       } else if (e.key === 'r') {
//         rotateDocument();
//         e.preventDefault();
//       } else if (e.key === 'Escape' && !isMinimized) {
//         if (isFullscreen) {
//           toggleFullscreen();
//         } else {
//           toggleMinimize();
//         }
//         e.preventDefault();
//       }
//     };
    
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [zoomIn, zoomOut, resetView, rotateDocument, isFullscreen, isMinimized, lastActive]);

//   const renderDocumentPreview = () => {
//     if (loading) {
//       return (
//         <div className="flex items-center justify-center h-full">
//           <div className="animate-spin h-8 w-8 border-4 border-[#a55233] dark:border-blue-500 rounded-full border-t-transparent"></div>
//           <p className="ml-2 text-[#5e4636] dark:text-gray-200">Loading document...</p>
//         </div>
//       );
//     }
  
//     if (error) {
//       return (
//         <div className="flex flex-col items-center justify-center h-full text-center p-4">
//           <div className="text-red-600 mb-2 text-lg">⚠️ {error}</div>
//           <p className="text-[#5a544a] dark:text-gray-300">
//             The document could not be loaded. It may be in a format that cannot be displayed in the browser.
//           </p>
//           <button
//             onClick={downloadDocument}
//             className="mt-4 px-4 py-2 bg-[#a55233] dark:bg-blue-600 text-white rounded-lg flex items-center hover:bg-[#8b4513] dark:hover:bg-blue-700 transition-colors"
//           >
//             <Download size={16} className="mr-2" />
//             Download Instead
//           </button>
//         </div>
//       );
//     }
  
//     if (!documentUrl) {
//       return <div className="text-center text-[#5a544a] dark:text-gray-300">No document selected</div>;
//     }
  
//     const extension = filename.split('.').pop().toLowerCase();
    
//     // PDF viewer
//     if (extension === 'pdf') {
//       return (
//         <div className="h-full w-full relative">
//           <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center bg-[#e9dcc9]/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 space-x-2 z-10 shadow-lg">
//             <button 
//               onClick={zoomOut} 
//               className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 text-[#5a544a] dark:text-gray-300 hover:text-[#5e4636] dark:hover:text-white"
//               title="Zoom Out (Ctrl -)"
//             >
//               <ZoomOut size={18} />
//             </button>
//             <span className="text-[#5e4636] dark:text-white text-sm">{Math.round(zoomLevel * 100)}%</span>
//             <button 
//               onClick={zoomIn} 
//               className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 text-[#5a544a] dark:text-gray-300 hover:text-[#5e4636] dark:hover:text-white"
//               title="Zoom In (Ctrl +)"
//             >
//               <ZoomIn size={18} />
//             </button>
//             <button 
//               onClick={rotateDocument} 
//               className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 text-[#5a544a] dark:text-gray-300 hover:text-[#5e4636] dark:hover:text-white"
//               title="Rotate 90° (R)"
//             >
//               <RotateCcw size={18} />
//             </button>
//           </div>
          
//           <iframe 
//             ref={iframeRef}
//             src={`${documentUrl}#view=FitH&zoom=${zoomLevel * 100}`}
//             className="w-full h-full border-none"
//             title={filename}
//             style={{
//               transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
//               transformOrigin: 'center center',
//               transition: 'transform 0.2s ease-in-out',
//             }}
//           />
//         </div>
//       );
//     }
    
//     // Images
//     if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
//       return (
//         <div className="flex flex-col items-center justify-center h-full relative">
//           <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center bg-[#e9dcc9]/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 space-x-2 z-10 shadow-lg">
//             <button 
//               onClick={zoomOut} 
//               className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 text-[#5a544a] dark:text-gray-300 hover:text-[#5e4636] dark:hover:text-white"
//               title="Zoom Out (Ctrl -)"
//             >
//               <ZoomOut size={18} />
//             </button>
//             <span className="text-[#5e4636] dark:text-white text-sm">{Math.round(zoomLevel * 100)}%</span>
//             <button 
//               onClick={zoomIn} 
//               className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 text-[#5a544a] dark:text-gray-300 hover:text-[#5e4636] dark:hover:text-white"
//               title="Zoom In (Ctrl +)"
//             >
//               <ZoomIn size={18} />
//             </button>
//             <button 
//               onClick={rotateDocument} 
//               className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 text-[#5a544a] dark:text-gray-300 hover:text-[#5e4636] dark:hover:text-white"
//               title="Rotate 90° (R)"
//             >
//               <RotateCcw size={18} />
//             </button>
//             <button 
//               onClick={resetView} 
//               className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 text-[#5a544a] dark:text-gray-300 hover:text-[#5e4636] dark:hover:text-white"
//               title="Reset View (Ctrl 0)"
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
//                 <path d="M12 8v4l3 3"/>
//               </svg>
//             </button>
//           </div>
          
//           <div className="overflow-auto h-full w-full flex items-center justify-center">
//             <img 
//               src={documentUrl} 
//               alt={filename} 
//               style={{
//                 transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
//                 transformOrigin: 'center center',
//                 transition: 'transform 0.2s ease-in-out',
//                 maxWidth: zoomLevel > 1 ? 'none' : '100%',
//                 maxHeight: zoomLevel > 1 ? 'none' : '100%',
//               }}
//               className="object-contain"
//               onClick={() => setLastActive(Date.now())}
//             />
//           </div>
//         </div>
//       );
//     }
    
//     // Text files
//     if (extension === 'txt' || extension === 'csv') {
//       return (
//         <div className="h-full w-full relative">
//           <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center bg-[#e9dcc9]/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 space-x-2 z-10 shadow-lg">
//             <button 
//               onClick={zoomOut} 
//               className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 text-[#5a544a] dark:text-gray-300 hover:text-[#5e4636] dark:hover:text-white"
//               title="Zoom Out (Ctrl -)"
//             >
//               <ZoomOut size={18} />
//             </button>
//             <span className="text-[#5e4636] dark:text-white text-sm">{Math.round(zoomLevel * 100)}%</span>
//             <button 
//               onClick={zoomIn} 
//               className="p-1.5 rounded-md hover:bg-[#f5e6d8] dark:hover:bg-gray-700 text-[#5a544a] dark:text-gray-300 hover:text-[#5e4636] dark:hover:text-white"
//               title="Zoom In (Ctrl +)"
//             >
//               <ZoomIn size={18} />
//             </button>
//           </div>
          
//           <iframe 
//             src={documentUrl} 
//             className="w-full h-full bg-white text-[#5e4636] dark:text-black p-4"
//             title={filename}
//             style={{
//               transform: `scale(${zoomLevel})`,
//               transformOrigin: 'top left',
//               transition: 'transform 0.2s ease-in-out',
//             }}
//           />
//         </div>
//       );
//     }
    
//     // For other formats, offer download option
//     return (
//       <div className="flex flex-col items-center justify-center h-full text-center p-4">
//         <p className="text-[#5a544a] dark:text-gray-300 mb-4">
//           This document format ({extension.toUpperCase()}) cannot be previewed directly in the browser.
//         </p>
//         <button
//           onClick={downloadDocument}
//           className="px-4 py-2 bg-[#a55233] dark:bg-blue-600 text-white rounded-lg flex items-center hover:bg-[#8b4513] dark:hover:bg-blue-700 transition-colors"
//         >
//           <Download size={16} className="mr-2" />
//           Download Document
//         </button>
//         <a 
//           href={documentUrl} 
//           target="_blank" 
//           rel="noopener noreferrer" 
//           className="mt-4 px-4 py-2 bg-[#e9dcc9] dark:bg-gray-700 text-[#5e4636] dark:text-white rounded-lg flex items-center hover:bg-[#f5e6d8] dark:hover:bg-gray-600 transition-colors"
//         >
//           <ExternalLink size={16} className="mr-2" />
//           Open in New Tab
//         </a>
//       </div>
//     );
//   };

//   // Render minimized floating button
//   if (isMinimized) {
//     return (
//       <div 
//         ref={viewerRef}
//         className="fixed cursor-move"
//         style={{
//           left: `${position.x}px`,
//           top: `${position.y}px`,
//           zIndex: zIndex - 1, // Slightly lower z-index when minimized
//         }}
//         onClick={() => {
//           if (onBringToFront) onBringToFront();
//           setLastActive(Date.now());
//         }}
//         onMouseDown={(e) => {
//           handleStartDrag(e);
//           if (onBringToFront) onBringToFront();
//           setLastActive(Date.now());
//         }}
//       >
//         <div 
//           className="minimized-icon bg-gradient-to-r from-[#a55233] to-[#8b4513] dark:from-blue-600 dark:to-indigo-700 rounded-full p-3 shadow-lg flex items-center justify-center cursor-pointer hover:from-[#8b4513] hover:to-[#5e4636] dark:hover:from-blue-500 dark:hover:to-indigo-600 transition-all duration-300"
//           onClick={handleMinimizedClick}
//           title={filename}
//         >
//           <FileIcon extension={filename.split('.').pop().toLowerCase()} />
//           <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-xs text-white border-2 border-[#faf4ee] dark:border-gray-800">
//             {loading ? '⟳' : ''}
//           </span>
//         </div>
//         <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-[#e9dcc9] dark:bg-gray-800 text-xs text-[#5e4636] dark:text-white py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg border border-[#d6cbbf] dark:border-gray-700">
//           {filename.length > 15 ? filename.substring(0, 15) + '...' : filename}
//         </div>
//       </div>
//     );
//   }

  
  
//   // Smoothly close the viewer
//   const handleClose = () => {
//     setIsClosing(true);
//     setTimeout(() => {
//       onClose();
//     }, 300); // Match animation duration
//   };
  
//   // This is the main return for the non-minimized viewer
//   return (
//     <div 
//       ref={viewerRef}
//       className={`fixed bg-white dark:bg-gray-800 shadow-lg border border-[#d6cbbf] dark:border-gray-600 flex flex-col 
//         ${isFullscreen ? 'inset-0 w-full h-full rounded-none' : 'rounded-xl'} 
//         ${isClosing ? 'viewer-container closing' : 'viewer-container'}
//       `}
//       style={{
//         width: isFullscreen ? '100%' : size.width,
//         height: isFullscreen ? '100%' : size.height,
//         zIndex: zIndex,
//         left: isFullscreen ? 0 : `${position.x}px`,
//         top: isFullscreen ? 0 : `${position.y}px`,
//         resize: isFullscreen ? 'none' : 'both',
//         overflow: 'hidden'
//       }}
//       onClick={() => {
//         if (onBringToFront) onBringToFront();
//         setLastActive(Date.now());
//       }}
//     >
//       {/* Header with drag handle */}
//       <div 
//         className={`
//           flex items-center justify-between bg-[#e9dcc9] dark:bg-gray-700 p-3 border-b border-[#d6cbbf] dark:border-gray-600 
//           ${isFullscreen ? '' : 'rounded-t-xl cursor-move'}
//         `}
//         onMouseDown={isFullscreen ? null : handleStartDrag}
//       >
//         <div className="flex items-center">
//           {!isFullscreen && <Move size={16} className="text-[#5a544a] dark:text-gray-400 mr-2" />}
//           <h3 className="text-[#0a3b25] dark:text-white font-serif truncate max-w-md">{filename}</h3>
//         </div>
//         <div className="flex items-center space-x-2">
//           {/* Quick positioning buttons */}
//           {!isFullscreen && !isMinimized && (
//             <div className="flex items-center mr-2 bg-[#f5e6d8]/60 dark:bg-gray-800/60 rounded-md p-1">
//               <button
//                 onClick={() => {
//                   // Position to left half
//                   setPosition({ x: 10, y: 80 });
//                   setSize({ 
//                     width: `${Math.floor(window.innerWidth / 2) - 20}px`, 
//                     height: `${window.innerHeight - 100}px` 
//                   });
//                 }}
//                 className="p-1 text-[#5a544a] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white rounded-sm hover:bg-[#e8ddcc]/50 dark:hover:bg-gray-700/50"
//                 title="Snap to left"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                   <rect x="3" y="3" width="7" height="18" rx="1" />
//                   <rect x="12" y="3" width="9" height="18" rx="1" opacity="0.3" />
//                 </svg>
//               </button>
//               <button
//                 onClick={() => {
//                   // Position to right half
//                   const width = Math.floor(window.innerWidth / 2) - 20;
//                   setPosition({ x: window.innerWidth - width - 10, y: 80 });
//                   setSize({ 
//                     width: `${width}px`, 
//                     height: `${window.innerHeight - 100}px` 
//                   });
//                 }}
//                 className="p-1 text-[#5a544a] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white rounded-sm hover:bg-[#e8ddcc]/50 dark:hover:bg-gray-700/50"
//                 title="Snap to right"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                   <rect x="3" y="3" width="9" height="18" rx="1" opacity="0.3" />
//                   <rect x="14" y="3" width="7" height="18" rx="1" />
//                 </svg>
//               </button>
//               <button
//                 onClick={() => {
//                   // Reset to center
//                   setPosition({
//                     x: (window.innerWidth - 800) / 2,
//                     y: Math.max(80, (window.innerHeight - 600) / 4)
//                   });
//                   setSize({ width: '800px', height: '600px' });
//                 }}
//                 className="p-1 text-[#5a544a] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white rounded-sm hover:bg-[#e8ddcc]/50 dark:hover:bg-gray-700/50"
//                 title="Center"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                   <rect x="6" y="6" width="12" height="12" rx="1" />
//                 </svg>
//               </button>
//             </div>
//           )}
          
//           <button
//             onClick={downloadDocument}
//             className="p-2 text-[#a55233] dark:text-gray-300 hover:text-[#8b4513] dark:hover:text-white rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-600"
//             title="Download document"
//           >
//             <Download size={18} />
//           </button>
//           <button
//             onClick={toggleMinimize}
//             className="p-2 text-[#a55233] dark:text-gray-300 hover:text-[#8b4513] dark:hover:text-white rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-600"
//             title="Minimize"
//           >
//             <Minimize2 size={18} />
//           </button>
//           <button
//             onClick={toggleFullscreen}
//             className="p-2 text-[#a55233] dark:text-gray-300 hover:text-[#8b4513] dark:hover:text-white rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-600"
//             title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
//           >
//             {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
//           </button>
//           <button
//             onClick={handleClose}
//             className="p-2 text-[#a55233] dark:text-gray-300 hover:text-[#8b4513] dark:hover:text-white rounded-full hover:bg-[#f5e6d8] dark:hover:bg-gray-600"
//             title="Close viewer"
//           >
//             <X size={18} />
//           </button>
//         </div>
//       </div>
      
//       {/* Document Viewer Content */}
//       <div className="h-[calc(100%-4rem)] overflow-auto bg-[#faf4ee] dark:bg-gray-900">
//         {renderDocumentPreview()}
//       </div>
      
//       {/* Resize handle indicator - only show when not fullscreen */}
//       {!isFullscreen && !isMinimized && (
//         <div 
//           className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center hover:bg-[#f5e6d8]/50 dark:hover:bg-gray-700/50 rounded-tl-md transition-colors"
//           onMouseDown={(e) => {
//             e.preventDefault();
//             setIsResizing(true);
            
//             // Get current dimensions of the viewer
//             const rect = viewerRef.current.getBoundingClientRect();
//             setResizeStart({
//               x: e.clientX,
//               y: e.clientY,
//               width: rect.width,
//               height: rect.height
//             });
//           }}
//         >
//           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#5a544a] dark:text-gray-400">
//             <path d="M22 22L12 12M22 12L12 22" strokeWidth="2" strokeLinecap="round" />
//           </svg>
//         </div>
//       )}
      
//       {/* Resize handles for edges */}
//       {!isFullscreen && !isMinimized && (
//         <>
//           {/* Right edge resize handle */}
//           <div
//             className="absolute top-0 right-0 w-2 h-full cursor-ew-resize"
//             onMouseDown={(e) => {
//               e.preventDefault();
//               setIsResizing(true);
//               const rect = viewerRef.current.getBoundingClientRect();
//               setResizeStart({
//                 x: e.clientX,
//                 y: e.clientY,
//                 width: rect.width,
//                 height: rect.height
//               });
//             }}
//           />
          
//           {/* Bottom edge resize handle */}
//           <div
//             className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize"
//             onMouseDown={(e) => {
//               e.preventDefault();
//               setIsResizing(true);
//               const rect = viewerRef.current.getBoundingClientRect();
//               setResizeStart({
//                 x: e.clientX,
//                 y: e.clientY,
//                 width: rect.width,
//                 height: rect.height
//               });
//             }}
//           />
//         </>
//       )}
      
//       {/* CSS animations for transitions */}
//       <style>{`
//         @keyframes popIn {
//           0% { transform: scale(0.9); opacity: 0; }
//           100% { transform: scale(1); opacity: 1; }
//         }
        
//         @keyframes popOut {
//           0% { transform: scale(1); opacity: 1; }
//           100% { transform: scale(0.9); opacity: 0; }
//         }
        
//         @keyframes floatAnimation {
//           0% { transform: translateY(0px); }
//           50% { transform: translateY(-5px); }
//           100% { transform: translateY(0px); }
//         }
        
//         .minimized-icon {
//           animation: popIn 0.3s ease-out forwards, floatAnimation 2s ease-in-out infinite;
//           box-shadow: 0 10px 25px -5px rgba(165, 82, 51, 0.5);
//         }
        
//         .viewer-container {
//           animation: popIn 0.3s ease-out forwards;
//         }
        
//         .viewer-container.closing {
//           animation: popOut 0.3s ease-out forwards;
//         }
//       `}</style>
//     </div>
//   );
// };
// // Component for file icon in minimized state
// // Add this component in your file or in a separate component file
// const FileIcon = ({ extension }) => {
//   // Map file extensions to appropriate colors
//   const extensionColors = {
//     pdf: 'text-red-500',
//     doc: 'text-blue-600',
//     docx: 'text-blue-700',
//     xls: 'text-green-600',
//     xlsx: 'text-green-700',
//     ppt: 'text-orange-600',
//     pptx: 'text-orange-700',
//     txt: 'text-gray-600',
//     csv: 'text-green-500',
//     jpg: 'text-purple-500',
//     jpeg: 'text-purple-500',
//     png: 'text-purple-600',
//     gif: 'text-pink-500',
//     // Add more extensions as needed
//   };

//   const color = extensionColors[extension] || 'text-gray-500';

//   return (
//     <div className="flex items-center justify-center">
//       <div className={`${color}`}>
//         {/* Generic file icon */}
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//           <polyline points="14 2 14 8 20 8" />
//           {extension && (
//             <text x="12" y="16" textAnchor="middle" fontSize="5" fill="currentColor" fontWeight="bold">
//               {extension.toUpperCase().substring(0, 3)}
//             </text>
//           )}
//         </svg>
//       </div>
//     </div>
//   );
// };
// DocumentViewer.propTypes = {
//   documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
//   filename: PropTypes.string.isRequired,
//   onClose: PropTypes.func.isRequired,
//   zIndex: PropTypes.number,
//   onBringToFront: PropTypes.func
// };
// export default DocumentViewer;



import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Copy, Check } from 'lucide-react';

const DocumentViewer = ({ documentId, filename, fileType, onClose }) => {
  const [documentUrl, setDocumentUrl] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Determine if this is a PDF or text file
  const isPdf = filename?.toLowerCase().endsWith('.pdf') || fileType === 'pdf';
  const isText = fileType === 'text' || (!isPdf && !filename?.toLowerCase().endsWith('.pdf'));

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get the auth token for API requests
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        // FIXED: Use the correct backend endpoint that handles blob storage
        const response = await fetch(`/api/documents/${documentId}/view/`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = 'Failed to load document';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use status text
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        // Check if the response is JSON (redirect URL) or binary data
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          // Backend returned a redirect URL (for direct blob access)
          const data = await response.json();
          
          if (data.redirect_url) {
            console.log('Using redirect URL for document:', data.redirect_url);
            
            if (isPdf) {
              setDocumentUrl(data.redirect_url);
            } else {
              // For text files, fetch the content from the redirect URL
              try {
                const textResponse = await fetch(data.redirect_url);
                if (textResponse.ok) {
                  const textData = await textResponse.text();
                  setTextContent(textData);
                } else {
                  throw new Error('Failed to fetch text content from redirect URL');
                }
              } catch (textError) {
                console.error('Error fetching text content:', textError);
                setError('Failed to load text content');
              }
            }
          } else {
            throw new Error('No document URL provided by server');
          }
        } else {
          // Backend returned the actual file content
          console.log('Received direct file content from backend');
          
          if (isPdf) {
            // For PDF files, create a blob URL
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setDocumentUrl(url);
          } else {
            // For text files, get text content
            const textData = await response.text();
            setTextContent(textData);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.message || 'Failed to load document. Please try again.');
        setLoading(false);
      }
    };

    fetchDocument();

    // Clean up the blob URL when the component unmounts
    return () => {
      if (documentUrl && documentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [documentId, isPdf]);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleDownload = async () => {
    try {
      if (isPdf && documentUrl) {
        // For PDF files - trigger download
        const link = document.createElement('a');
        link.href = documentUrl;
        link.download = filename || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (isText && textContent) {
        // For text files - create blob and download
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename || 'document'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Fallback: try to download using the backend endpoint
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/documents/${documentId}/view/`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${token}`,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename || 'document';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          throw new Error('Download failed');
        }
      }
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download document');
    }
  };

  // FIXED: Add proper error boundary and loading states
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex items-center space-x-4">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="text-gray-700">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <div className="text-red-600 mb-4 text-lg">⚠️ Error Loading Document</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="flex space-x-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800 truncate">{filename}</h3>
          </div>
          <div className="flex items-center space-x-2">
            {isText && textContent && (
              <button
                onClick={handleCopyContent}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                title="Copy content"
              >
                {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
              </button>
            )}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              title="Download document"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              title="Close viewer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isPdf && documentUrl ? (
            /* PDF Viewer */
            <div className="h-full">
              <iframe
                src={documentUrl}
                className="w-full h-full border-none"
                title={filename}
                onError={() => setError('Failed to load PDF viewer')}
              />
            </div>
          ) : isText && textContent ? (
            /* Text Viewer */
            <div className="h-full overflow-auto p-6">
              <div className="max-w-4xl mx-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                  {textContent}
                </pre>
              </div>
            </div>
          ) : (
            /* Fallback for when content is not available */
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Document content not available</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Try Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer for text files */}
        {isText && textContent && (
          <div className="border-t border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{textContent.split('\n').length} lines • {textContent.length} characters</span>
              <span>Text Document</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;