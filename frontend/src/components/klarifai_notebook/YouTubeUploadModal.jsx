// YouTubeUploadModal.jsx
import React, { useState } from 'react';
import { X, Upload, Youtube, Link, FileText, ArrowLeft } from 'lucide-react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { documentServiceNB } from '../../utils/axiosConfig';

const YouTubeUploadModal = ({ isOpen, onClose, mainProjectId, onUploadSuccess }) => {
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'youtube'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleYouTubeClick = () => {
    setCurrentView('youtube');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setYoutubeUrl(''); // Clear URL when going back
  };

  const handleInsert = async () => {
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
      toast.error(error.response?.data?.error || 'Failed to process content');
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isUploading && youtubeUrl.trim()) {
      handleInsert();
    }
  };

  const handleClose = () => {
    setCurrentView('main');
    setYoutubeUrl('');
    onClose();
  };

  if (!isOpen) return null;

  // YouTube URL Input View
  if (currentView === 'youtube') {
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
              Paste in a YouTube URL below to upload as a source in NotebookLM
            </p>

            {/* YouTube URL Input */}
            <div className="relative mb-4">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Youtube className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="url"
                placeholder="Paste YouTube URL *"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-3 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
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
                  <span>Only the text transcript will be imported at this moment</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Only public YouTube videos are supported</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Recently uploaded videos may not be available to import</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>If upload fails, <a href="#" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors">learn more</a> for common reasons.</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={handleInsert}
                disabled={!youtubeUrl.trim() || isUploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm font-medium shadow-sm hover:shadow-md disabled:shadow-none"
              >
                {isUploading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Insert</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Add Sources View
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 transition-all duration-300 ease-in-out">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 ease-out scale-100">
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
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-400 mb-1 text-sm">
            Sources let NotebookLM base its responses on the information that matters most to you.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mb-5">
            (Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
          </p>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center mb-5 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">Upload sources</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Drag & drop or <span className="text-blue-600 dark:text-blue-400 cursor-pointer underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors">choose file</span> to upload
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)
              </p>
            </div>
          </div>

          {/* Source Type Sections */}
          <div className="grid grid-cols-3 gap-5 mb-5">
            

            {/* Link Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-1.5">
                <Link className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white text-sm">Link</span>
              </div>
              <div className="space-y-1.5">
                <button className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group">
                  <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs">🌐</span>
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Website</span>
                </button>
                <button 
                  onClick={handleYouTubeClick}
                  className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group hover:border-red-300 dark:hover:border-red-600"
                >
                  <Youtube className="w-4 h-4 text-red-600 group-hover:text-red-700 dark:group-hover:text-red-500 transition-colors" />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">YouTube</span>
                </button>
              </div>
            </div>

            {/* Paste Text Section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white text-sm">Paste text</span>
              </div>
              <div className="space-y-1.5">
                <button className="w-full flex items-center space-x-2 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group">
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Copied text</span>
                </button>
              </div>
            </div>
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
