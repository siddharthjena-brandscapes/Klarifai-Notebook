import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ideaService } from '../utils/axiosConfig';

const CustomTooltip = ({ children }) => {
  return (
    <div className="group relative">
      {children}
      <div className="absolute left-1/2 -translate-x-1/2 -top-10 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
        Click to view details
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 transform rotate-45 w-2 h-2 bg-gray-900"></div>
      </div>
    </div>
  );
};

const ErrorMessage = ({ message, onDismiss }) => (
  <div className="fixed top-4 right-4 max-w-sm bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 flex items-center justify-between z-50">
    <span>{message}</span>
    <button 
      onClick={onDismiss}
      className="ml-4 p-1 hover:bg-red-500/20 rounded-full"
    >
      <X size={16} />
    </button>
  </div>
);

const ImageCarousel = ({ images, onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [images.length]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative group">
      <CustomTooltip>
        <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] max-w-xl mx-auto">
          <img
            src={`data:image/png;base64,${images[currentIndex].image_url}`}
            alt="Generated product"
            className="w-full h-full object-cover"
            onClick={() => onSelect(images[currentIndex])}
          />
        </div>
      </CustomTooltip>
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1.5 rounded-full text-sm text-white">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

const VersionHistory = ({ idea, onRestoreVersion, onClose, onSelectImage }) => {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [idea]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await ideaService.getIdeaHistory(idea.idea_id);
      if (response.data.success) {
        const processedHistory = processVersionHistory(response.data.history, idea);
        setHistory(processedHistory);
      } else {
        setError('Failed to fetch version history');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const processVersionHistory = (rawHistory, currentIdea) => {
    let versions = [];
    
    if (!rawHistory.idea_versions || rawHistory.idea_versions.length === 0) {
      const currentVersion = {
        id: currentIdea.idea_id,
        product_name: currentIdea.product_name,
        description: currentIdea.description,
        created_at: new Date().toISOString(),
        is_current: true,
        is_original: true,
        images: rawHistory.image_versions || [],
        show_restore: false
      };
      versions = [currentVersion];
    } else {
      const sortedVersions = rawHistory.idea_versions.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      versions = sortedVersions.map((version, index) => {
        const versionImages = (rawHistory.image_versions || []).filter(
          img => img.idea_id === version.id
        );
        
        return {
          ...version,
          is_current: index === 0,
          is_original: index === sortedVersions.length - 1,
          images: versionImages,
          show_restore: index !== 0
        };
      });
    }
    
    return versions;
  };

  const handleRestore = async (version) => {
    try {
      const mostRecentImage = version.images[0];
      
      const response = await ideaService.restoreIdeaVersion({
        version_id: version.id,
        current_id: idea.idea_id,
        image_id: mostRecentImage?.id
      });
  
      if (response.data.success) {
        const restoredIdea = {
          ...response.data.idea,
          images: version.images
        };
        onRestoreVersion(restoredIdea);
        
        const historyResponse = await ideaService.getIdeaHistory(idea.idea_id);
        if (historyResponse.data.success) {
          const processedHistory = processVersionHistory(historyResponse.data.history, restoredIdea);
          setHistory(processedHistory);
        }
      }
    } catch (err) {
      setError('Failed to restore version');
      console.error('Restore error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full">
      {error && (
        <ErrorMessage 
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Clock className="text-gray-400" size={24} />
          <h2 className="text-2xl font-semibold text-white">Version History</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="text-gray-400 hover:text-white" size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="space-y-8">
          {history?.map((version) => (
            <div
              key={version.id}
              className={`p-6 ${
                version.is_current 
                  ? 'bg-blue-900/20 border-blue-500/30' 
                  : 'bg-gray-800 border-gray-700'
              } border rounded-xl hover:border-gray-600 transition-colors`}
            >
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xl text-white mb-2 break-words">
                      {version.product_name}
                    </h3>
                    <p className="text-gray-300 text-base mb-4 break-words">
                      {version.description}
                    </p>
                    <div className="flex items-center flex-wrap gap-3 text-sm text-gray-400">
                      <Clock size={16} />
                      {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                      {version.is_current && (
                        <span className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded-full">
                          Current Version
                        </span>
                      )}
                      {version.is_original && (
                        <span className="px-3 py-1 text-sm bg-purple-500/20 text-purple-400 rounded-full">
                          Original Version
                        </span>
                      )}
                    </div>
                  </div>
                  {version.show_restore && (
                    <button
                      onClick={() => handleRestore(version)}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                      <RotateCcw size={16} />
                      Restore Version
                    </button>
                  )}
                </div>

                {version.images?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ImageIcon size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-400">
                        Generated Images ({version.images.length})
                      </span>
                    </div>
                    <ImageCarousel 
                      images={version.images}
                      onSelect={onSelectImage}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!history || history.length === 0) && (
            <div className="text-center text-gray-400 py-12 text-lg">
              No version history available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistory;

