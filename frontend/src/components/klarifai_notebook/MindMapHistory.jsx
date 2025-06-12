// MindMapHistory.jsx - Fixed version with proper mindmap viewing
import React, { useState, useEffect, useContext } from 'react';
import { Brain, Calendar, FileText, Trash2, Eye, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

const MindMapHistory = ({ 
  isOpen, 
  onClose, 
  mainProjectId, 
  onViewMindmap, 
  onRegenerateMindmap,
  selectedDocuments,
  targetUserId = null // For admin functionality
}) => {
  const { theme } = useContext(ThemeContext);
  const [mindmaps, setMindmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingMindmapId, setLoadingMindmapId] = useState(null); // New state for tracking which mindmap is being loaded

  useEffect(() => {
    if (isOpen && mainProjectId) {
      loadMindmaps();
    }
  }, [isOpen, mainProjectId]);

  const loadMindmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use your existing service function
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      const response = await mindmapServiceNB.getUserMindmaps(mainProjectId, {}, targetUserId);
      
      if (response.data && response.data.success) {
        setMindmaps(response.data.mindmaps || []);
      } else {
        setError('Failed to load mindmaps');
      }
    } catch (err) {
      console.error('Error loading mindmaps:', err);
      setError(err.response?.data?.error || 'Failed to load mindmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMindmap = async (mindmap) => {
    try {
      setLoadingMindmapId(mindmap.id);
      setError(null);
      
      console.log('Loading mindmap:', mindmap.id); // Debug log
      
      // Use your existing service function
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      const response = await mindmapServiceNB.getMindmapData(mindmap.id);
      
      console.log('Mindmap data response:', response.data); // Debug log
      
      if (response.data && response.data.success && response.data.mindmap) {
        // Prepare the stats object with all available information
        const stats = {
          created_at: mindmap.created_at,
          total_nodes: mindmap.total_nodes || response.data.stats?.total_nodes,
          mindmap_nodes: mindmap.total_nodes || response.data.stats?.mindmap_nodes,
          document_sources: mindmap.document_sources || response.data.stats?.document_sources || [],
          documents_processed: mindmap.document_sources?.length || response.data.stats?.documents_processed || 0
        };
        
        console.log('Calling onViewMindmap with:', {
          mindmap: response.data.mindmap,
          id: mindmap.id,
          stats: stats
        }); // Debug log
        
        // Pass the mindmap data and stats to the parent component
        onViewMindmap(response.data.mindmap, mindmap.id, stats);
        onClose();
      } else {
        console.error('Invalid mindmap data response:', response.data);
        setError('Failed to load mindmap data - invalid response format');
      }
    } catch (err) {
      console.error('Error loading mindmap:', err);
      setError(err.response?.data?.error || 'Failed to load mindmap');
    } finally {
      setLoadingMindmapId(null);
    }
  };

  const handleDeleteMindmap = async (mindmapId) => {
    if (!confirm('Are you sure you want to delete this mindmap?')) {
      return;
    }

    try {
      setDeletingId(mindmapId);
      
      // Use your existing service function
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      const response = await mindmapServiceNB.deleteMindmap(mindmapId);
      
      if (response.data && response.data.success) {
        setMindmaps(prev => prev.filter(m => m.id !== mindmapId));
      } else {
        setError('Failed to delete mindmap');
      }
    } catch (err) {
      console.error('Error deleting mindmap:', err);
      setError(err.response?.data?.error || 'Failed to delete mindmap');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegenerateMindmap = async () => {
    try {
      // Use your existing service function with force regenerate
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      
      // Call regenerate function (which sets force_regenerate: true)
      if (mindmapServiceNB.regenerateMindmap) {
        // Use the regenerate function if available
        const response = await mindmapServiceNB.regenerateMindmap(mainProjectId, selectedDocuments, targetUserId);
        
        if (response.data && response.data.success) {
          // View the newly generated mindmap
          onViewMindmap(response.data.mindmap, response.data.mindmap_id, response.data.stats);
          onClose();
        }
      } else {
        // Fallback to regular generate with force parameter
        onRegenerateMindmap(true); // force regenerate
        onClose();
      }
    } catch (err) {
      console.error('Error regenerating mindmap:', err);
      setError(err.response?.data?.error || 'Failed to regenerate mindmap');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-gray-900'} bg-opacity-50 backdrop-blur-sm`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col
        ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} 
        rounded-lg shadow-2xl overflow-hidden
      `}>
        {/* Header */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6 text-purple-500" />
              <div>
                <h2 className="text-xl font-bold">MindMap History</h2>
                <p className="text-sm opacity-70">
                  {mindmaps.length} mindmap{mindmaps.length !== 1 ? 's' : ''} created
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* <button
                onClick={handleRegenerateMindmap}
                disabled={!selectedDocuments || selectedDocuments.length === 0}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2
                  ${selectedDocuments && selectedDocuments.length > 0
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
                title={
                  selectedDocuments && selectedDocuments.length > 0 
                    ? 'Generate new mindmap' 
                    : 'Select documents to generate mindmap'
                }
              >
                <RefreshCw className="w-4 h-4" />
                <span>New MindMap</span>
              </button> */}
              
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`mx-6 mt-4 p-4 rounded-lg ${
            theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-600 dark:text-red-400">{error}</span>
            </div>
            <button
              onClick={loadMindmaps}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <Brain className="w-8 h-8 animate-pulse mx-auto mb-4 text-purple-500" />
                <p>Loading mindmaps...</p>
              </div>
            </div>
          ) : mindmaps.length === 0 ? (
            <div className="text-center h-48 flex items-center justify-center">
              <div>
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No MindMaps Yet</h3>
                <p className="text-sm opacity-70 mb-4">
                  Generate your first mindmap from the selected documents
                </p>
                <button
                  onClick={handleRegenerateMindmap}
                  disabled={!selectedDocuments || selectedDocuments.length === 0}
                  className={`
                    px-6 py-2 rounded-lg font-medium transition-all
                    ${selectedDocuments && selectedDocuments.length > 0
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  Generate MindMap
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mindmaps.map((mindmap) => (
                <div
                  key={mindmap.id}
                  className={`
                    p-4 rounded-lg border transition-all hover:shadow-md
                    ${theme === 'dark' 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Mindmap Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      <h3 className="font-medium text-sm">{mindmap.title}</h3>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mb-3">
                    <p className="text-sm opacity-70 line-clamp-2">
                      {mindmap.preview}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="space-y-1 mb-4 text-xs">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(mindmap.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Brain className="w-3 h-3" />
                      <span>{mindmap.total_nodes} nodes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3 h-3" />
                      <span>{mindmap.document_sources?.length || 0} document{(mindmap.document_sources?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Document Sources */}
                  {mindmap.document_sources && mindmap.document_sources.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium mb-1">Sources:</p>
                      <div className="space-y-1">
                        {mindmap.document_sources.slice(0, 2).map((source, index) => (
                          <div
                            key={index}
                            className={`text-xs px-2 py-1 rounded ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                            }`}
                          >
                            {source.length > 30 ? `${source.substring(0, 30)}...` : source}
                          </div>
                        ))}
                        {mindmap.document_sources.length > 2 && (
                          <div className="text-xs opacity-70">
                            +{mindmap.document_sources.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewMindmap(mindmap)}
                      disabled={loadingMindmapId === mindmap.id}
                      className={`
                        flex-1 px-3 py-2 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1
                        ${loadingMindmapId === mindmap.id
                          ? 'opacity-50 cursor-not-allowed'
                          : theme === 'dark'
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                        }
                      `}
                    >
                      {loadingMindmapId === mindmap.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteMindmap(mindmap.id)}
                      disabled={deletingId === mindmap.id || loadingMindmapId === mindmap.id}
                      className={`
                        px-3 py-2 rounded text-xs transition-colors
                        ${(deletingId === mindmap.id || loadingMindmapId === mindmap.id)
                          ? 'opacity-50 cursor-not-allowed'
                          : theme === 'dark'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }
                      `}
                    >
                      {deletingId === mindmap.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MindMapHistory;