// // // YouTubeUploadModal.jsx
// // import React, { useState } from 'react';
// // import { X, Upload, Youtube, Link, FileText, ArrowLeft } from 'lucide-react';
// // import PropTypes from 'prop-types';
// // import { toast } from 'react-toastify';
// // import { documentServiceNB } from '../../utils/axiosConfig';

// // const YouTubeUploadModal = ({ isOpen, onClose, mainProjectId, onUploadSuccess }) => {
// //   const [currentView, setCurrentView] = useState('main'); // 'main' or 'youtube'
// //   const [youtubeUrl, setYoutubeUrl] = useState('');
// //   const [isUploading, setIsUploading] = useState(false);

// //   const handleYouTubeClick = () => {
// //     setCurrentView('youtube');
// //   };

// //   const handleBackToMain = () => {
// //     setCurrentView('main');
// //     setYoutubeUrl(''); // Clear URL when going back
// //   };

// //   const handleInsert = async () => {
// //     if (!youtubeUrl.trim()) return;

// //     setIsUploading(true);
// //     try {
// //       const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/).+/;
// //       if (!youtubeRegex.test(youtubeUrl)) {
// //         toast.error('Please enter a valid YouTube URL');
// //         setIsUploading(false);
// //         return;
// //       }

// //       const response = await documentServiceNB.uploadYouTubeVideo(youtubeUrl, mainProjectId);
// //       if (response.data) {
// //         toast.success('YouTube video processed successfully!');
// //         if (onUploadSuccess) {
// //           onUploadSuccess(response.data);
// //         }
// //       }

// //       setYoutubeUrl('');
// //       setCurrentView('main');
// //       onClose();
// //     } catch (error) {
// //       console.error('Upload error:', error);
// //       toast.error(error.response?.data?.error || 'Failed to process content');
// //     } finally {
// //       setIsUploading(false);
// //     }
// //   };

// //   const handleKeyPress = (e) => {
// //     if (e.key === 'Enter' && !isUploading && youtubeUrl.trim()) {
// //       handleInsert();
// //     }
// //   };

// //   const handleClose = () => {
// //     setCurrentView('main');
// //     setYoutubeUrl('');
// //     onClose();
// //   };

// //   if (!isOpen) return null;

// //   // YouTube URL Input View
// //   if (currentView === 'youtube') {
// //     return (
// //       <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
// //         <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
// //           {/* Header */}
// //           <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
// //             <button
// //               onClick={handleBackToMain}
// //               className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
// //             >
// //               <ArrowLeft className="h-4 w-4" />
// //             </button>
// //             <h2 className="text-lg font-medium text-gray-900 dark:text-white">YouTube URL</h2>
// //           </div>

// //           {/* Content */}
// //           <div className="p-4">
// //             <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
// //               Paste in a YouTube URL below to upload as a source in NotebookLM
// //             </p>

// //             {/* YouTube URL Input */}
// //             <div className="relative mb-4">
// //               <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
// //                 <Youtube className="h-4 w-4 text-gray-400" />
// //               </div>
// //               <input
// //                 type="url"
// //                 placeholder="Paste YouTube URL *"
// //                 value={youtubeUrl}
// //                 onChange={(e) => setYoutubeUrl(e.target.value)}
// //                 onKeyPress={handleKeyPress}
// //                 className="w-full pl-10 pr-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
// //                 disabled={isUploading}
// //                 autoFocus
// //               />
// //             </div>

// //             {/* Notes Section */}
// //             <div className="mb-6">
// //               <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
// //               <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
// //                 <li className="flex items-start">
// //                   <span className="mr-2 mt-0.5">•</span>
// //                   <span>Only the text transcript will be imported at this moment</span>
// //                 </li>
// //                 <li className="flex items-start">
// //                   <span className="mr-2 mt-0.5">•</span>
// //                   <span>Only public YouTube videos are supported</span>
// //                 </li>
// //                 <li className="flex items-start">
// //                   <span className="mr-2 mt-0.5">•</span>
// //                   <span>Recently uploaded videos may not be available to import</span>
// //                 </li>
// //                 <li className="flex items-start">
// //                   <span className="mr-2 mt-0.5">•</span>
// //                   <span>If upload fails, <a href="#" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors">learn more</a> for common reasons.</span>
// //                 </li>
// //               </ul>
// //             </div>

// //             {/* Action Button */}
// //             <div className="flex justify-end">
// //               <button
// //                 onClick={handleInsert}
// //                 disabled={!youtubeUrl.trim() || isUploading}
// //                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md disabled:shadow-none"
// //               >
// //                 {isUploading ? (
// //                   <>
// //                     <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
// //                     <span>Processing...</span>
// //                   </>
// //                 ) : (
// //                   <span>Insert</span>
// //                 )}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // Main Add Sources View
// //   return (
// //     <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
// //       <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
// //         {/* Header */}
// //         <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
// //           <div className="flex items-center space-x-2">
// //             <h2 className="text-lg font-medium text-gray-900 dark:text-white">Add sources</h2>
           
// //           </div>
// //           <button
// //             onClick={handleClose}
// //             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5"
// //           >
// //             <X className="h-4 w-4" />
// //           </button>
// //         </div>

// //         {/* Content */}
// //         <div className="p-4">
// //           <p className="text-gray-600 dark:text-gray-400 mb-1 text-sm">
// //             Sources let NotebookLM base its responses on the information that matters most to you.
// //           </p>
// //           <p className="text-gray-500 dark:text-gray-500 text-xs mb-5">
// //             (Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
// //           </p>

// //           {/* Upload Area */}
// //           <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center mb-5 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200">
// //             <div className="flex flex-col items-center space-y-3">
// //               <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
// //                 <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
// //               </div>
// //               <div>
// //                 <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Upload sources</h3>
// //                 <p className="text-gray-600 dark:text-gray-400 text-sm">
// //                   Drag & drop or <span className="text-blue-600 dark:text-blue-400 cursor-pointer underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors">choose file</span> to upload
// //                 </p>
// //               </div>
// //               <p className="text-xs text-gray-500 dark:text-gray-400">
// //                 Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)
// //               </p>
// //             </div>
// //           </div>

// //           {/* Source Type Sections */}
// //           <div className="grid grid-cols-3 gap-5 mb-5">
            

// //             {/* Link Section */}
// //             <div className="space-y-3">
// //               <div className="flex items-center space-x-1.5">
// //                 <Link className="h-4 w-4 text-gray-600 dark:text-gray-400" />
// //                 <span className="font-medium text-gray-900 dark:text-white text-sm">Link</span>
// //               </div>
// //               <div className="space-y-1.5">
// //                 <button className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group">
// //                   <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
// //                     <span className="text-white text-xs">🌐</span>
// //                   </div>
// //                   <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Website</span>
// //                 </button>
// //                 <button 
// //                   onClick={handleYouTubeClick}
// //                   className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group hover:border-red-300 dark:hover:border-red-600"
// //                 >
// //                   <Youtube className="w-4 h-4 text-red-600 group-hover:text-red-700 dark:group-hover:text-red-500 transition-colors" />
// //                   <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">YouTube</span>
// //                 </button>
// //               </div>
// //             </div>

// //             {/* Paste Text Section */}
// //             <div className="space-y-3">
// //               <div className="flex items-center space-x-1.5">
// //                 <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
// //                 <span className="font-medium text-gray-900 dark:text-white text-sm">Paste text</span>
// //               </div>
// //               <div className="space-y-1.5">
// //                 <button className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group">
// //                   <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
// //                   <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Copied text</span>
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // YouTubeUploadModal.propTypes = {
// //   isOpen: PropTypes.bool.isRequired,
// //   onClose: PropTypes.func.isRequired,
// //   mainProjectId: PropTypes.string.isRequired,
// //   onUploadSuccess: PropTypes.func,
// // };

// // export default YouTubeUploadModal;

// // YouTubeUploadModal.jsx
// import React, { useState } from 'react';
// import { X, Youtube, Link, FileText, ArrowLeft } from 'lucide-react';
// import PropTypes from 'prop-types';
// import { toast } from 'react-toastify';
// import { documentServiceNB } from '../../utils/axiosConfig';

// const YouTubeUploadModal = ({ isOpen, onClose, mainProjectId, onUploadSuccess }) => {
//   const [currentView, setCurrentView] = useState('main'); // 'main', 'youtube', 'website', 'text'
//   const [youtubeUrl, setYoutubeUrl] = useState('');
//   const [websiteUrl, setWebsiteUrl] = useState('');
//   const [websiteTitle, setWebsiteTitle] = useState('');
//   const [textContent, setTextContent] = useState('');
//   const [textTitle, setTextTitle] = useState('');
//   const [isUploading, setIsUploading] = useState(false);

//   const handleViewChange = (view) => {
//     setCurrentView(view);
//   };

//   const handleBackToMain = () => {
//     setCurrentView('main');
//     // Clear all inputs when going back
//     setYoutubeUrl('');
//     setWebsiteUrl('');
//     setWebsiteTitle('');
//     setTextContent('');
//     setTextTitle('');
//   };

//   const handleYouTubeSubmit = async () => {
//     if (!youtubeUrl.trim()) return;

//     setIsUploading(true);
//     try {
//       const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/).+/;
//       if (!youtubeRegex.test(youtubeUrl)) {
//         toast.error('Please enter a valid YouTube URL');
//         setIsUploading(false);
//         return;
//       }

//       const response = await documentServiceNB.uploadYouTubeVideo(youtubeUrl, mainProjectId);
//       if (response.data) {
//         toast.success('YouTube video processed successfully!');
//         if (onUploadSuccess) {
//           onUploadSuccess(response.data);
//         }
//       }

//       setYoutubeUrl('');
//       setCurrentView('main');
//       onClose();
//     } catch (error) {
//       console.error('Upload error:', error);
//       toast.error(error.response?.data?.error || 'Failed to process YouTube video');
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleWebsiteSubmit = async () => {
//     if (!websiteUrl.trim()) return;

//     setIsUploading(true);
//     try {
//       // Basic URL validation
//       const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
//       if (!urlRegex.test(websiteUrl)) {
//         toast.error('Please enter a valid website URL');
//         setIsUploading(false);
//         return;
//       }

//       const response = await documentServiceNB.uploadWebsite(
//         websiteUrl, 
//         mainProjectId, 
//         {}, 
//         null, 
//         websiteTitle.trim() || null
//       );
      
//       if (response.data) {
//         toast.success('Website content processed successfully!');
//         if (onUploadSuccess) {
//           onUploadSuccess(response.data);
//         }
//       }

//       setWebsiteUrl('');
//       setWebsiteTitle('');
//       setCurrentView('main');
//       onClose();
//     } catch (error) {
//       console.error('Upload error:', error);
//       toast.error(error.response?.data?.error || 'Failed to process website content');
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const handleTextSubmit = async () => {

//   if (!textContent.trim()) return;
 
//   setIsUploading(true);

//   try {

//     // Enhanced validation

//     if (textContent.trim().length < 10) {

//       toast.error('Text content must be at least 10 characters long');

//       setIsUploading(false);

//       return;

//     }
 
//     // Check for maximum size (1MB = 1,048,576 bytes)

//     const textSize = new Blob([textContent]).size;

//     if (textSize > 1048576) {

//       toast.error('Text content exceeds maximum size of 1MB');

//       setIsUploading(false);

//       return;

//     }
 
//     // Log the data being sent (for debugging)

//     console.log('Sending data:', {

//       textContent: textContent.substring(0, 100) + '...', // Log first 100 chars

//       textTitle: textTitle.trim() || null,

//       mainProjectId,

//       textSize: `${(textSize / 1024).toFixed(2)} KB`

//     });
 
//     const response = await documentServiceNB.uploadPlainText(

//       textContent, 

//       textTitle.trim() || null, 

//       mainProjectId

//     );

//     if (response.data) {

//       toast.success('Text content processed successfully!');

//       if (onUploadSuccess) {

//         onUploadSuccess(response.data);

//       }

//     }
 
//     setTextContent('');

//     setTextTitle('');

//     setCurrentView('main');

//     onClose();

//   } catch (error) {

//     console.error('Upload error:', error);

//     console.error('Error response:', error.response?.data);

//     const errorMessage = error.response?.data?.message || 

//                         error.response?.data?.error || 

//                         'Failed to process text content';

//     toast.error(errorMessage);

//   } finally {

//     setIsUploading(false);

//   }

// };
 

//   const handleKeyPress = (e, submitFunction) => {
//     if (e.key === 'Enter' && !isUploading) {
//       submitFunction();
//     }
//   };

//   const handleClose = () => {
//     setCurrentView('main');
//     setYoutubeUrl('');
//     setWebsiteUrl('');
//     setWebsiteTitle('');
//     setTextContent('');
//     setTextTitle('');
//     onClose();
//   };

//   if (!isOpen) return null;

//   // YouTube URL Input View
//   if (currentView === 'youtube') {
//     return (
//       <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
//         <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
//           {/* Header */}
//           <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
//             <button
//               onClick={handleBackToMain}
//               className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </button>
//             <h2 className="text-lg font-medium text-gray-900 dark:text-white">YouTube URL</h2>
//           </div>

//           {/* Content */}
//           <div className="p-4">
//             <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
//               Paste in a YouTube URL below to upload as a source
//             </p>

//             {/* YouTube URL Input */}
//             <div className="relative mb-4">
//               <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
//                 <Youtube className="h-4 w-4 text-red-500" />
//               </div>
//               <input
//                 type="url"
//                 placeholder="Paste YouTube URL *"
//                 value={youtubeUrl}
//                 onChange={(e) => setYoutubeUrl(e.target.value)}
//                 onKeyPress={(e) => handleKeyPress(e, handleYouTubeSubmit)}
//                 className="w-full pl-10 pr-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
//                 disabled={isUploading}
//                 autoFocus
//               />
//             </div>

//             {/* Notes Section */}
//             <div className="mb-6">
//               <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
//               <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
//                 <li className="flex items-start">
//                   <span className="mr-2 mt-0.5">•</span>
//                   <span>Only the text transcript will be imported</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2 mt-0.5">•</span>
//                   <span>Only public YouTube videos are supported</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2 mt-0.5">•</span>
//                   <span>Recently uploaded videos may not be available to import</span>
//                 </li>
//               </ul>
//             </div>

//             {/* Action Button */}
//             <div className="flex justify-end">
//               <button
//                 onClick={handleYouTubeSubmit}
//                 disabled={!youtubeUrl.trim() || isUploading}
//                 className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md disabled:shadow-none"
//               >
//                 {isUploading ? (
//                   <>
//                     <div className="w-3 h-3 border-2 text-black border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Processing...</span>
//                   </>
//                 ) : (
//                   <span className='text-black'>Insert</span>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Website URL Input View
//   if (currentView === 'website') {
//     return (
//       <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
//         <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
//           {/* Header */}
//           <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
//             <button
//               onClick={handleBackToMain}
//               className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </button>
//             <h2 className="text-lg font-medium text-gray-900 dark:text-white">Website Link</h2>
//           </div>

//           {/* Content */}
//           <div className="p-4">
//             <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
//               Paste in a website URL below to extract and upload its content as a source
//             </p>

//             {/* Website URL Input */}
//             <div className="relative mb-4">
//               <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
//                 <Link className="h-4 w-4 text-blue-500" />
//               </div>
//               <input
//                 type="url"
//                 placeholder="Paste website URL *"
//                 value={websiteUrl}
//                 onChange={(e) => setWebsiteUrl(e.target.value)}
//                 onKeyPress={(e) => handleKeyPress(e, handleWebsiteSubmit)}
//                 className="w-full pl-10 pr-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
//                 disabled={isUploading}
//                 autoFocus
//               />
//             </div>

//             {/* Custom Title Input (Optional) */}
//             <div className="mb-4">
//               <input
//                 type="text"
//                 placeholder="Custom title (optional)"
//                 value={websiteTitle}
//                 onChange={(e) => setWebsiteTitle(e.target.value)}
//                 className="w-full px-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
//                 disabled={isUploading}
//               />
//             </div>

//             {/* Notes Section */}
//             <div className="mb-6">
//               <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
//               <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
//                 <li className="flex items-start">
//                   <span className="mr-2 mt-0.5">•</span>
//                   <span>Only the main text content will be extracted</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2 mt-0.5">•</span>
//                   <span>Some websites may block automated content extraction</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2 mt-0.5">•</span>
//                   <span>If no custom title is provided, the page title will be used</span>
//                 </li>
//               </ul>
//             </div>

//             {/* Action Button */}
//             <div className="flex justify-end">
//               <button
//                 onClick={handleWebsiteSubmit}
//                 disabled={!websiteUrl.trim() || isUploading}
//                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md disabled:shadow-none"
//               >
//                 {isUploading ? (
//                   <>
//                     <div className="w-3 h-3 border-2 text-black border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Processing...</span>
//                   </>
//                 ) : (
//                   <span className='text-black'>Insert</span>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Text Input View
//   if (currentView === 'text') {
//     return (
//       <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
//         <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
//           {/* Header */}
//           <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
//             <button
//               onClick={handleBackToMain}
//               className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </button>
//             <h2 className="text-lg font-medium text-gray-900 dark:text-white">Paste Text</h2>
//           </div>

//           {/* Content */}
//           <div className="p-4">
//             <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
//               Paste or type your text content below to upload as a source
//             </p>

//             {/* Title Input (Optional) */}
//             <div className="mb-4">
//               <input
//                 type="text"
//                 placeholder="Title"
//                 value={textTitle}
//                 onChange={(e) => setTextTitle(e.target.value)}
//                 className="w-full px-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
//                 disabled={isUploading}
//               />
//             </div>

//             {/* Text Content Input */}
//             <div className="mb-4">
//               <textarea
//                 placeholder="Paste your text content here *"
//                 value={textContent}
//                 onChange={(e) => setTextContent(e.target.value)}
//                 className="w-full px-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none"
//                 disabled={isUploading}
//                 rows="12"
//                 autoFocus
//               />
//               <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
//                 {textContent.length} characters (minimum 10 required)
//               </div>
//             </div>

//             {/* Notes Section */}
//             <div className="mb-6">
//               <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
//               <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
//                 <li className="flex items-start">
//                   <span className="mr-2 mt-0.5">•</span>
//                   <span>Text content must be at least 10 characters long</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2 mt-0.5">•</span>
//                   <span>Maximum size is 1MB of text content</span>
//                 </li>
//                 <li className="flex items-start">
//                   <span className="mr-2 mt-0.5">•</span>
//                   <span>If no title is provided, one will be generated from the content</span>
//                 </li>
//               </ul>
//             </div>

//             {/* Action Button */}
//             <div className="flex justify-end">
//               <button
//                 onClick={handleTextSubmit}
//                 disabled={!textContent.trim() || textContent.trim().length < 10 || isUploading}
//                 className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md disabled:shadow-none"
//               >
//                 {isUploading ? (
//                   <>
//                     <div className="w-3 h-3 border-2 text-black border-white border-t-transparent rounded-full animate-spin"></div>
//                     <span>Processing...</span>
//                   </>
//                 ) : (
//                   <span className='text-black'>Insert</span>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Main Add Sources View (Updated Layout)
//   return (
//     <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
//       <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center space-x-2">
//             <h2 className="text-lg font-medium text-gray-900 dark:text-white">Add sources</h2>
//           </div>
//           <button
//             onClick={handleClose}
//             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="p-6">
//           <p className="text-gray-600 dark:text-gray-400 mb-1 text-sm">
//             Sources let the system base its responses on the information that matters most to you.
//           </p>
//           <p className="text-gray-500 dark:text-gray-500 text-xs mb-8">
//             (Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
//           </p>

//           {/* Source Options */}
//           <div className="space-y-4">
//             {/* Website Link Option */}
//             <button
//               onClick={() => handleViewChange('website')}
//               className="w-full flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group"
//             >
//               <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-200">
//                 <Link className="w-5 h-5 text-blue-600 dark:text-blue-400" />
//               </div>
//               <div className="text-left">
//                 <h3 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-200">
//                   Website Link
//                 </h3>
//                 <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
//                   Extract content from any website URL
//                 </p>
//               </div>
//             </button>

//             {/* YouTube Option */}
//             <button
//               onClick={() => handleViewChange('youtube')}
//               className="w-full flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200 group"
//             >
//               <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors duration-200">
//                 <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
//               </div>
//               <div className="text-left">
//                 <h3 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-red-900 dark:group-hover:text-red-100 transition-colors duration-200">
//                   YouTube Video
//                 </h3>
//                 <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors duration-200">
//                   Import transcript from YouTube videos
//                 </p>
//               </div>
//             </button>

//             {/* Paste Text Option */}
//             <button
//               onClick={() => handleViewChange('text')}
//               className="w-full flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 group"
//             >
//               <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors duration-200">
//                 <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
//               </div>
//               <div className="text-left">
//                 <h3 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-green-900 dark:group-hover:text-green-100 transition-colors duration-200">
//                   Paste Text
//                 </h3>
//                 <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-200">
//                   Upload text content directly
//                 </p>
//               </div>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// YouTubeUploadModal.propTypes = {
//   isOpen: PropTypes.bool.isRequired,
//   onClose: PropTypes.func.isRequired,
//   mainProjectId: PropTypes.string.isRequired,
//   onUploadSuccess: PropTypes.func,
// };

// export default YouTubeUploadModal;

// YouTubeUploadModal.jsx
import React, { useState } from 'react';
import { X, Youtube, Link, FileText, ArrowLeft, Lock } from 'lucide-react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { documentServiceNB } from '../../utils/axiosConfig';

const YouTubeUploadModal = ({ isOpen, onClose, mainProjectId, onUploadSuccess }) => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'youtube', 'website', 'text'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteTitle, setWebsiteTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Control YouTube availability
  const isYouTubeAvailable = false; // Set to false to lock the feature

  const handleViewChange = (view) => {
    if (view === 'youtube' && !isYouTubeAvailable) {
      toast.info('YouTube upload feature is temporarily unavailable');
      return;
    }
    setCurrentView(view);
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    // Clear all inputs when going back
    setYoutubeUrl('');
    setWebsiteUrl('');
    setWebsiteTitle('');
    setTextContent('');
    setTextTitle('');
  };

  const handleYouTubeSubmit = async () => {
    if (!youtubeUrl.trim()) return;

    setIsUploading(true);
    try {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/).+/;
      if (!youtubeRegex.test(youtubeUrl)) {
        toast.error('Please enter a valid YouTube URL');
        setIsUploading(false);
        return;
      }

      const response = await documentServiceNB.uploadYouTubeVideo(youtubeUrl, mainProjectId);
      if (response.data) {
        toast.success('YouTube video processed successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
      }

      setYoutubeUrl('');
      setCurrentView('main');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to process YouTube video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleWebsiteSubmit = async () => {
    if (!websiteUrl.trim()) return;

    setIsUploading(true);
    try {
      // Basic URL validation
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(websiteUrl)) {
        toast.error('Please enter a valid website URL');
        setIsUploading(false);
        return;
      }

      const response = await documentServiceNB.uploadWebsite(
        websiteUrl, 
        mainProjectId, 
        {}, 
        null, 
        websiteTitle.trim() || null
      );
      
      if (response.data) {
        toast.success('Website content processed successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
      }

      setWebsiteUrl('');
      setWebsiteTitle('');
      setCurrentView('main');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to process website content');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim()) return;
 
    setIsUploading(true);

    try {
      // Enhanced validation
      if (textContent.trim().length < 10) {
        toast.error('Text content must be at least 10 characters long');
        setIsUploading(false);
        return;
      }
 
      // Check for maximum size (1MB = 1,048,576 bytes)
      const textSize = new Blob([textContent]).size;
      if (textSize > 1048576) {
        toast.error('Text content exceeds maximum size of 1MB');
        setIsUploading(false);
        return;
      }
 
      // Log the data being sent (for debugging)
      console.log('Sending data:', {
        textContent: textContent.substring(0, 100) + '...', // Log first 100 chars
        textTitle: textTitle.trim() || null,
        mainProjectId,
        textSize: `${(textSize / 1024).toFixed(2)} KB`
      });
 
      const response = await documentServiceNB.uploadPlainText(
        textContent, 
        textTitle.trim() || null, 
        mainProjectId
      );

      if (response.data) {
        toast.success('Text content processed successfully!');
        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }
      }
 
      setTextContent('');
      setTextTitle('');
      setCurrentView('main');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to process text content';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e, submitFunction) => {
    if (e.key === 'Enter' && !isUploading) {
      submitFunction();
    }
  };

  const handleClose = () => {
    setCurrentView('main');
    setYoutubeUrl('');
    setWebsiteUrl('');
    setWebsiteTitle('');
    setTextContent('');
    setTextTitle('');
    onClose();
  };

  if (!isOpen) return null;

  // YouTube URL Input View (only accessible if YouTube is available)
  if (currentView === 'youtube' && isYouTubeAvailable) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBackToMain}
              className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">YouTube URL</h2>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Paste in a YouTube URL below to upload as a source
            </p>

            {/* YouTube URL Input */}
            <div className="relative mb-4">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Youtube className="h-4 w-4 text-red-500" />
              </div>
              <input
                type="url"
                placeholder="Paste YouTube URL *"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleYouTubeSubmit)}
                className="w-full pl-10 pr-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                disabled={isUploading}
                autoFocus
              />
            </div>

            {/* Notes Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Only the text transcript will be imported</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Only public YouTube videos are supported</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Recently uploaded videos may not be available to import</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handleYouTubeSubmit}
                disabled={!youtubeUrl.trim() || isUploading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {isUploading ? (
                  <>
                    <div className="w-3 h-3 border-2 text-black border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span className='text-black'>Insert</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Website URL Input View
  if (currentView === 'website') {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBackToMain}
              className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Website Link</h2>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Paste in a website URL below to extract and upload its content as a source
            </p>

            {/* Website URL Input */}
            <div className="relative mb-4">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Link className="h-4 w-4 text-blue-500" />
              </div>
              <input
                type="url"
                placeholder="Paste website URL *"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleWebsiteSubmit)}
                className="w-full pl-10 pr-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                disabled={isUploading}
                autoFocus
              />
            </div>

            {/* Custom Title Input (Optional) */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Custom title"
                value={websiteTitle}
                onChange={(e) => setWebsiteTitle(e.target.value)}
                className="w-full px-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                disabled={isUploading}
              />
            </div>

            {/* Notes Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Only the main text content will be extracted</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Some websites may block automated content extraction</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>If no custom title is provided, the page title will be used</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handleWebsiteSubmit}
                disabled={!websiteUrl.trim() || isUploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {isUploading ? (
                  <>
                    <div className="w-3 h-3 border-2 text-black border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span className='text-black'>Insert</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Text Input View
  if (currentView === 'text') {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBackToMain}
              className="mr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Paste Text</h2>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Paste or type your text content below to upload as a source
            </p>

            {/* Title Input (Optional) */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Title"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                className="w-full px-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                disabled={isUploading}
              />
            </div>

            {/* Text Content Input */}
            <div className="mb-4">
              <textarea
                placeholder="Paste your text content here *"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full px-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none"
                disabled={isUploading}
                rows="12"
                autoFocus
              />
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {textContent.length} characters (minimum 10 required)
              </div>
            </div>

            {/* Notes Section */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Text content must be at least 10 characters long</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Maximum size is 1MB of text content</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>If no title is provided, one will be generated from the content</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handleTextSubmit}
                disabled={!textContent.trim() || textContent.trim().length < 10 || isUploading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {isUploading ? (
                  <>
                    <div className="w-3 h-3 border-2 text-black border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span className='text-black'>Insert</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Add Sources View (Updated with Lock Feature)
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Add sources</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-1 text-sm">
            Sources let the system base its responses on the information that matters most to you.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mb-8">
            (Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
          </p>

          {/* Source Options */}
          <div className="space-y-4">
            {/* Website Link Option */}
            <button
              onClick={() => handleViewChange('website')}
              className="w-full flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-200">
                <Link className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-200">
                  Website Link
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                  Extract content from any website URL
                </p>
              </div>
            </button>

            {/* YouTube Option with Lock */}
            <button
              onClick={() => handleViewChange('youtube')}
              disabled={!isYouTubeAvailable}
              className={`w-full flex items-center space-x-4 p-4 border rounded-lg transition-all duration-200 relative ${
                isYouTubeAvailable
                  ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-red-300 dark:hover:border-red-600 group cursor-pointer'
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-75'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                isYouTubeAvailable
                  ? 'bg-red-50 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Youtube className={`w-5 h-5 ${
                  isYouTubeAvailable 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`} />
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-medium text-sm transition-colors duration-200 ${
                    isYouTubeAvailable
                      ? 'text-gray-900 dark:text-white group-hover:text-red-900 dark:group-hover:text-red-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    YouTube Video
                  </h3>
                  {!isYouTubeAvailable && (
                    <Lock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <p className={`text-xs transition-colors duration-200 ${
                  isYouTubeAvailable
                    ? 'text-gray-500 dark:text-gray-400 group-hover:text-red-700 dark:group-hover:text-red-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {isYouTubeAvailable 
                    ? 'Import transcript from YouTube videos'
                    : 'Temporarily unavailable'
                  }
                </p>
              </div>
            </button>

            {/* Paste Text Option */}
            <button
              onClick={() => handleViewChange('text')}
              className="w-full flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors duration-200">
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-green-900 dark:group-hover:text-green-100 transition-colors duration-200">
                  Paste Text
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-200">
                  Upload text content directly
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

YouTubeUploadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mainProjectId: PropTypes.string.isRequired,
  onUploadSuccess: PropTypes.func,
};

export default YouTubeUploadModal;