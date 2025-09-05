// MindMapHistory.jsx - Background generation with toast notifications
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Brain, Calendar, FileText, Trash2, Eye, RefreshCw, AlertCircle, Loader2, CheckCircle, X } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

const MindMapHistory = ({ 
  isOpen, 
  onClose,
  mainProjectId, 
  onViewMindmap, 
  onRegenerateMindmap,
  selectedDocuments,
  onDocumentSelectionChange,
  targetUserId = null
}) => {
  const { theme } = useContext(ThemeContext);
  const [mindmaps, setMindmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingMindmapId, setLoadingMindmapId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  const abortControllerRef = useRef(null);

  // Toast notification component
  const Toast = ({ message, type = 'success', onClose }) => (
    <div className={`
      fixed top-4 right-4 z-[60] flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg
      ${type === 'success' 
        ? theme === 'dark' 
          ? 'bg-green-800 text-green-100 border border-green-700' 
          : 'bg-green-100 text-green-800 border border-green-200'
        : theme === 'dark'
          ? 'bg-red-800 text-red-100 border border-red-700'
          : 'bg-red-100 text-red-800 border border-red-200'
      }
      animate-in slide-in-from-right duration-300
    `}>
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-500" />
      )}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className={`ml-2 ${
          type === 'success' ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Auto-hide after 5 seconds
  };

  useEffect(() => {
    if (isOpen && mainProjectId) {
      loadMindmaps();
    }
  }, [isOpen, mainProjectId]);

  const loadMindmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      console.log('Loading mindmap:', mindmap.id);
      
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      const response = await mindmapServiceNB.getMindmapData(mindmap.id);
      
      console.log('Mindmap data response:', response.data);
      
      if (response.data && response.data.success && response.data.mindmap) {
        const stats = {
          created_at: mindmap.created_at,
          total_nodes: mindmap.total_nodes || response.data.stats?.total_nodes,
          mindmap_nodes: mindmap.total_nodes || response.data.stats?.mindmap_nodes,
          document_sources: mindmap.document_sources || response.data.stats?.document_sources || [],
          documents_processed: mindmap.document_sources?.length || response.data.stats?.documents_processed || 0,
          document_ids: response.data.stats?.document_ids || []
        };
        
        let selectedDocumentIds = [];
        
        if (stats.document_ids && stats.document_ids.length > 0) {
          selectedDocumentIds = stats.document_ids;
          console.log(`Using document IDs from backend:`, selectedDocumentIds);
        } 
        else if (stats.document_sources && stats.document_sources.length > 0) {
          try {
            selectedDocumentIds = await getDocumentIdsByFilenames(stats.document_sources);
            console.log(`Found document IDs by filename matching:`, selectedDocumentIds);
          } catch (error) {
            console.error('Error finding documents by filenames:', error);
          }
        }
        
        if (selectedDocumentIds.length > 0) {
          console.log(`Auto-selecting ${selectedDocumentIds.length} documents:`, selectedDocumentIds);
          
          if (onDocumentSelectionChange) {
            onDocumentSelectionChange(selectedDocumentIds);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        stats.document_ids = selectedDocumentIds;
        
        console.log('Opening mindmap viewer with stats:', stats);
        
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

  const getDocumentIdsByFilenames = async (documentFilenames) => {
    try {
      const { documentServiceNB } = await import('../../utils/axiosConfig');
      const documentsResponse = await documentServiceNB.getUserDocuments(mainProjectId);
      
      if (documentsResponse?.data) {
        const matchingDocumentIds = [];
        
        documentsResponse.data.forEach(doc => {
          if (documentFilenames.includes(doc.filename)) {
            matchingDocumentIds.push(doc.id.toString());
          }
        });
        
        console.log(`Found ${matchingDocumentIds.length} documents matching filenames:`, documentFilenames);
        return matchingDocumentIds;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching documents for filename matching:', error);
      return [];
    }
  };

  const handleDeleteMindmap = async (mindmapId) => {
    try {
      setDeletingId(mindmapId);
      
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      const response = await mindmapServiceNB.deleteMindmap(mindmapId);
      
      if (response.data && response.data.success) {
        setMindmaps(prev => prev.filter(m => m.id !== mindmapId));
        showToast('Mindmap deleted successfully');
      } else {
        setError('Failed to delete mindmap');
        showToast('Failed to delete mindmap', 'error');
      }
    } catch (err) {
      console.error('Error deleting mindmap:', err);
      setError(err.response?.data?.error || 'Failed to delete mindmap');
      showToast('Failed to delete mindmap', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Cancel generation if modal is closed
  useEffect(() => {
    if (!isOpen && generating) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setGenerating(false);
    }
    // eslint-disable-next-line
  }, [isOpen]);

  const handleRegenerateMindmap = async () => {
    setGenerating(true);
    // showToast('Generating mindmap in background...', 'success');
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      if (mindmapServiceNB.regenerateMindmap) {
        const response = await mindmapServiceNB.regenerateMindmap(
          mainProjectId,
          selectedDocuments,
          targetUserId,
          { signal: abortController.signal }
        );
        
        if (response.data && response.data.success) {
          // Refresh the mindmaps list
          await loadMindmaps();
          
          // showToast('Mindmap generated successfully!', 'success');
          
          // Auto-view the new mindmap
          onViewMindmap(response.data.mindmap, response.data.mindmap_id, response.data.stats);
          onClose();
        }
      } else {
        onRegenerateMindmap(true);
        showToast('Mindmap generation started...', 'success');
        onClose();
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        console.log('Mindmap generation cancelled.');
        showToast('Mindmap generation cancelled', 'error');
      } else {
        console.error('Error regenerating mindmap:', err);
        setError(err.response?.data?.error || 'Failed to regenerate mindmap');
        showToast('Failed to generate mindmap', 'error');
      }
    } finally {
      setGenerating(false);
      abortControllerRef.current = null;
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

  const handleClose = () => {
    if (generating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setGenerating(false);
      abortControllerRef.current = null;
    }
    onClose();
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-gray-900'} bg-opacity-50 backdrop-blur-sm`}
          onClick={handleClose}
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
                  <h2 className="text-xl font-bold flex items-center space-x-2">
                    <span>MindMap History</span>
                    {generating && (
                      <div className="flex items-center space-x-2 text-sm text-purple-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </div>
                    )}
                  </h2>
                  <p className="text-sm opacity-70">
                    {mindmaps.length} mindmap{mindmaps.length !== 1 ? 's' : ''} created
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleClose}
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
  <div className="flex flex-col items-center justify-center h-48">
    <Brain className="w-12 h-12 mb-4 text-gray-400" />
    <h3 className="text-lg font-medium mb-2">No MindMaps Yet</h3>
    <p className="text-sm opacity-70 mb-4">
      Generate your first mindmap from the selected documents
    </p>
    <button
      onClick={handleRegenerateMindmap}
      disabled={!selectedDocuments || selectedDocuments.length === 0 || generating}
      className={`
        px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2
        ${selectedDocuments && selectedDocuments.length > 0 && !generating
          ? 'bg-purple-600 hover:bg-purple-700 text-white'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }
      `}
    >
      {generating && <Loader2 className="w-4 h-4 animate-spin" />}
      <span>Generate MindMap</span>
    </button>
  </div>
) : (
              <div className="space-y-4">
                {/* Generate New Mindmap Button */}
                {/* <div className="flex justify-center mb-6">
                  <button
                    onClick={handleRegenerateMindmap}
                    disabled={!selectedDocuments || selectedDocuments.length === 0 || generating}
                    className={`
                      px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2
                      ${selectedDocuments && selectedDocuments.length > 0 && !generating
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Brain className="w-4 h-4" />
                    <span>Generate New MindMap</span>
                  </button>
                </div> */}

                {/* Mindmaps Grid */}
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
                          <p className="text-sm line-clamp-2">
                            <h3 className="font-medium text-sm line-clamp-2">{mindmap.preview}</h3>
                          </p>
                        </div>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MindMapHistory;