// MindMapViewer.jsx - Enhanced with responsive header
import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  X, 
  Brain, 
  ChevronDown, 
  ChevronRight, 
  MessageSquare, 
  Loader2, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Clock,
  FileText,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';

const MindMapViewer = ({ 
  isOpen, 
  onClose, 
  mindmapData, 
  mainProjectId, 
  selectedDocuments = [], 
  mindmapId = null, 
  onSendToChat,
  isFromHistory = false,
  mindmapStats = null
}) => {
  const { theme } = useContext(ThemeContext);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [questionResponse, setQuestionResponse] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mindmapRef = useRef(null);

  const [currentDocumentContext, setCurrentDocumentContext] = useState([]);
  const [lastMindmapId, setLastMindmapId] = useState(null);

  useEffect(() => {
    if (isOpen && mindmapId !== lastMindmapId) {
      console.log('🔄 MindMapViewer: Mindmap changed, updating document context', {
        newMindmapId: mindmapId,
        oldMindmapId: lastMindmapId,
        selectedDocuments,
        mindmapStatsDocIds: mindmapStats?.document_ids
      });
      
      const documentContext = selectedDocuments && selectedDocuments.length > 0 
        ? selectedDocuments 
        : (mindmapStats?.document_ids || []);
      
      setCurrentDocumentContext(documentContext);
      setLastMindmapId(mindmapId);
      setQuestionResponse(null);
      
      console.log('✅ MindMapViewer: Updated document context to:', documentContext);
    }
  }, [isOpen, mindmapId, selectedDocuments, mindmapStats?.document_ids, lastMindmapId]);

  useEffect(() => {
    if (mindmapData && mindmapData.children) {
      const firstLevelNodes = new Set();
      mindmapData.children.forEach((_, index) => {
        firstLevelNodes.add(`root-${index}`);
      });
      setExpandedNodes(firstLevelNodes);
    }
  }, [mindmapData]);

  useEffect(() => {
    if (!isOpen) {
      console.log('🧹 MindMapViewer: Cleaning up state on close');
      setCurrentDocumentContext([]);
      setLastMindmapId(null);
      setQuestionResponse(null);
      setSelectedNode(null);
      setShowMobileMenu(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      console.log('🧠 MindMapViewer: Context update', {
        mindmapId,
        selectedDocuments,
        selectedDocumentsLength: selectedDocuments?.length || 0,
        currentDocumentContext,
        contextLength: currentDocumentContext?.length || 0,
        isFromHistory,
        mindmapStats: mindmapStats?.document_sources,
        timestamp: new Date().toISOString()
      });
    }
  }, [isOpen, selectedDocuments, currentDocumentContext, mindmapId, isFromHistory, mindmapStats]);

  const toggleNodeExpansion = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleNodeClick = (node, nodePath) => {
    setSelectedNode({ ...node, path: nodePath });
    setQuestionResponse(null);
  };

  useEffect(() => {
    if (isOpen) {
      console.log('🧠 MindMapViewer opened with context:', {
        selectedDocuments,
        selectedDocumentsLength: selectedDocuments?.length || 0,
        isFromHistory,
        mindmapStats,
        mindmapId
      });
      
      if (selectedDocuments && selectedDocuments.length > 0) {
        console.log(`✅ MindMapViewer has ${selectedDocuments.length} selected documents:`, selectedDocuments);
      } else {
        console.warn('⚠️ MindMapViewer opened without selected documents - questions may use web sources');
      }
    }
  }, [isOpen, selectedDocuments, isFromHistory, mindmapStats, mindmapId]);

  const askQuestionAboutNode = async () => {
    if (!selectedNode) return;

    setIsQuestionLoading(true);
    
    const documentsToUse = currentDocumentContext.length > 0 
      ? currentDocumentContext 
      : selectedDocuments || [];
    
    console.log('🤔 MindMapViewer: Asking question with document context:', {
      mindmapId,
      selectedNode: selectedNode.name,
      documentsToUse,
      documentCount: documentsToUse.length,
      timestamp: new Date().toISOString()
    });
    
    try {
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      
      const response = await mindmapServiceNB.askMindmapQuestion(
        mainProjectId,
        selectedNode.name,
        selectedNode.summary || selectedNode.description || '',
        selectedNode.path || '',
        documentsToUse,
        mindmapId,
        {
          force_new_context: true,
          mindmap_document_sources: mindmapStats?.document_sources || [],
          current_timestamp: Date.now()
        }
      );

      if (response.data && response.data.success) {
        const generatedQuestion = response.data.question;
        
        console.log('📤 MindMapViewer: Sending question to chat with document context:', {
          question: generatedQuestion,
          documentsUsed: documentsToUse,
          mindmapId
        });
        
        if (onSendToChat && generatedQuestion) {
          onClose();
          
          setTimeout(() => {
            onSendToChat(generatedQuestion, 'mindmap');
          }, 100);
        } else {
          setQuestionResponse(response.data);
        }
      } else {
        console.error('❌ Failed to get question response:', response.data);
        setQuestionResponse({
          success: false,
          error: response.data?.error || 'Failed to generate question'
        });
      }
    } catch (error) {
      console.error('❌ Error asking question:', error);
      setQuestionResponse({
        success: false,
        error: error.response?.data?.error || error.message
      });
    } finally {
      setIsQuestionLoading(false);
    }
  };

  const exportMindmap = () => {
    const exportData = {
      mindmap: mindmapData,
      metadata: {
        id: mindmapId,
        created_at: mindmapStats?.created_at || new Date().toISOString(),
        document_sources: mindmapStats?.document_sources || [],
        total_nodes: mindmapStats?.total_nodes || 0,
        from_history: isFromHistory
      }
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap-${mindmapId || Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleZoom = (direction) => {
    if (direction === 'in' && zoomLevel < 2) {
      setZoomLevel(prev => Math.min(prev + 0.1, 2));
    } else if (direction === 'out' && zoomLevel > 0.5) {
      setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
    } else if (direction === 'reset') {
      setZoomLevel(1);
    }
  };

  const renderMindmapNode = (node, depth = 0, parentPath = '', index = 0) => {
    const nodeId = `${parentPath}-${index}`;
    const nodePath = parentPath ? `${parentPath} > ${node.name}` : node.name;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode && selectedNode.name === node.name && selectedNode.path === nodePath;

    const getNodeColors = (depth) => {
      const colorSchemes = theme === 'dark' 
        ? [
            'bg-gradient-to-r from-blue-600 to-purple-600',
            'bg-gradient-to-r from-green-600 to-blue-600', 
            'bg-gradient-to-r from-purple-600 to-pink-600',
            'bg-gradient-to-r from-orange-600 to-red-600',
            'bg-gradient-to-r from-teal-600 to-cyan-600'
          ]
        : [
            'bg-gradient-to-r from-blue-500 to-purple-500',
            'bg-gradient-to-r from-green-500 to-blue-500',
            'bg-gradient-to-r from-purple-500 to-pink-500', 
            'bg-gradient-to-r from-orange-500 to-red-500',
            'bg-gradient-to-r from-teal-500 to-cyan-500'
          ];
      return colorSchemes[depth % colorSchemes.length];
    };

    return (
      <div key={nodeId} className="relative">
        {depth > 0 && (
          <div className={`absolute -top-4 left-4 w-px h-4 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
        )}
        
        <div 
          className={`
            relative flex items-center group cursor-pointer mb-2
            transition-all duration-200 hover:scale-[1.02]
            ${isSelected ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
          `}
          onClick={() => handleNodeClick(node, nodePath)}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(nodeId);
              }}
              className={`mr-2 p-1 rounded transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}

          <div className={`
            flex-1 p-3 rounded-lg shadow-sm transition-all duration-200
            ${getNodeColors(depth)}
            text-white
            group-hover:shadow-md group-hover:scale-[1.01]
          `}>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{node.name}</h4>
              {(node.summary || node.description) && (
                <MessageSquare size={14} className="opacity-70" />
              )}
            </div>
            
            {(node.summary || node.description) && (
              <p className="text-xs mt-1 opacity-90 line-clamp-2">
                {node.summary || node.description}
              </p>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative">
            {depth > 0 && (
              <div className={`absolute top-0 left-4 w-px h-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
            )}
            {node.children.map((child, childIndex) => 
              renderMindmapNode(child, depth + 1, nodeId, childIndex)
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDocumentContextIndicator = () => {
    const documentsToUse = currentDocumentContext.length > 0 
      ? currentDocumentContext 
      : selectedDocuments || [];
    
    return (
      <div className={`mb-4 p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
        <h4 className="font-medium mb-2 text-sm flex items-center">
          <FileText className="w-4 h-4 mr-1" />
          Question Context:
          <span className="ml-2 text-xs opacity-60">
            (Mindmap: {mindmapId})
          </span>
        </h4>
        
        {documentsToUse.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center text-xs text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="font-medium">
                {documentsToUse.length} document(s) selected for this mindmap
              </span>
            </div>

            <div className="text-xs opacity-70">
              Questions will be answered using the selected documents
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-3 h-3 mr-2" />
              <span>No documents selected for this mindmap</span>
            </div>
            <div className="text-xs opacity-70">
              Answers may come from web sources instead of documents
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen || !mindmapData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-gray-900'} bg-opacity-50 backdrop-blur-sm`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full h-full max-w-7xl max-h-[90vh] mx-4 flex flex-col
        ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} 
        rounded-lg shadow-2xl overflow-hidden
      `}>
        {/* Responsive Header */}
        <div className={`
          flex-shrink-0 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}
          ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}
        `}>
          {/* Main header row */}
          <div className="flex items-start justify-between p-3 sm:p-4 gap-3">
            {/* Left side - Title and metadata */}
            <div className="flex items-start space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0 mt-1">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              
              <div className="min-w-0 flex-1">
                {/* Title with proper wrapping */}
                <h2 className="text-lg sm:text-xl font-bold leading-tight break-words">
                  {mindmapData.name}
                </h2>
                
                {/* Metadata - responsive layout */}
                <div className="mt-1 space-y-1">
                  <div className="text-xs sm:text-sm opacity-70">
                    Interactive document visualization
                  </div>
                  
                  {/* Secondary metadata row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs opacity-60">
                    {isFromHistory && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span className="whitespace-nowrap">From History</span>
                      </div>
                    )}
                    
                    {mindmapStats?.created_at && (
                      <div className="flex items-center space-x-1">
                        <span className="whitespace-nowrap">
                          Created: {formatDate(mindmapStats.created_at)}
                        </span>
                      </div>
                    )}
                    
                    {/* Stats - show on larger screens */}
                    {mindmapStats && (
                      <div className="hidden sm:flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Brain className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">{mindmapStats.total_nodes} nodes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">{mindmapStats.document_sources?.length || 0} docs</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Desktop controls */}
              <div className="hidden sm:flex items-center space-x-1">
                {/* Zoom controls */}
                <div className="flex items-center space-x-1 mr-2">
                  <button
                    onClick={() => handleZoom('out')}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                    disabled={zoomLevel <= 0.5}
                    title="Zoom out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-sm px-2 min-w-[3rem] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => handleZoom('in')}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                    disabled={zoomLevel >= 2}
                    title="Zoom in"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => handleZoom('reset')}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                    title="Reset zoom"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>

                <button
                  onClick={exportMindmap}
                  className={`p-2 rounded transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                  title="Export mindmap as JSON"
                >
                  <Download size={16} />
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className={`p-2 rounded transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className={`p-2 rounded transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
              >
                <X size={18} sm:size={20} />
              </button>
            </div>
          </div>

          {/* Mobile stats row */}
          {mindmapStats && (
            <div className="sm:hidden px-4 pb-3">
              <div className="flex items-center justify-center space-x-4 text-xs opacity-70">
                <div className="flex items-center space-x-1">
                  <Brain className="w-3 h-3" />
                  <span>{mindmapStats.total_nodes} nodes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>{mindmapStats.document_sources?.length || 0} docs</span>
                </div>
              </div>
            </div>
          )}

          {/* Mobile menu dropdown */}
          {showMobileMenu && (
            <div className={`sm:hidden border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} p-3`}>
              <div className="space-y-3">
                {/* Zoom controls */}
                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handleZoom('out')}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                    disabled={zoomLevel <= 0.5}
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-sm px-3 min-w-[4rem] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => handleZoom('in')}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                    disabled={zoomLevel >= 2}
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => handleZoom('reset')}
                    className={`p-2 rounded transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                    }`}
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
                
                {/* Export button */}
                <button
                  onClick={() => {
                    exportMindmap();
                    setShowMobileMenu(false);
                  }}
                  className={`w-full p-2 rounded transition-colors flex items-center justify-center space-x-2 ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  <Download size={16} />
                  <span>Export Mindmap</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex flex-1 min-h-0">
          {/* Mindmap panel */}
          <div className={`flex-1 overflow-auto p-3 sm:p-6 custom-scrollbar ${selectedNode ? 'w-2/3' : 'w-full'}`}>
            <div 
              ref={mindmapRef}
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
              className="min-w-max"
            >
              {renderMindmapNode(mindmapData)}
            </div>
          </div>

          {/* Question panel */}
          {selectedNode && (
            <div className={`w-1/3 border-l ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'} p-3 sm:p-6 overflow-auto custom-scrollbar`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Selected Node</h3>
                </div>

                {renderDocumentContextIndicator()}

                <button
                  onClick={askQuestionAboutNode}
                  disabled={isQuestionLoading}
                  className={`
                    w-full py-3 px-4 rounded-lg font-medium transition-all
                    ${isQuestionLoading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:scale-[1.02]'
                    }
                    ${theme === 'dark' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                    flex items-center justify-center space-x-2
                  `}
                >
                  {isQuestionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Question...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Ask Question in Chat</span>
                    </>
                  )}
                </button>

                {questionResponse && (
                  <div className="space-y-3">
                    {questionResponse.success ? (
                      <>
                        <div>
                          <h4 className="font-medium mb-2">Question Generated:</h4>
                          <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'} border-l-4 border-blue-500`}>
                            <p className="text-sm font-medium">{questionResponse.question}</p>
                          </div>
                        </div>

                        {questionResponse.answer && (
                          <div>
                            <h4 className="font-medium mb-2">Answer:</h4>
                            <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} max-h-64 overflow-auto`}>
                              <p className="text-sm whitespace-pre-wrap">{questionResponse.answer}</p>
                            </div>
                          </div>
                        )}

                        {questionResponse.citations && questionResponse.citations.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Sources:</h4>
                            <div className="space-y-1">
                              {questionResponse.citations.map((citation, index) => (
                                <div key={index} className={`text-xs p-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  {typeof citation === 'object' ? (
                                    <div className="space-y-1">
                                      {citation.source_file && (
                                        <div><strong>File:</strong> {citation.source_file}</div>
                                      )}
                                      {citation.page_number && (
                                        <div><strong>Page:</strong> {citation.page_number}</div>
                                      )}
                                      {citation.section_title && (
                                        <div><strong>Section:</strong> {citation.section_title}</div>
                                      )}
                                      {citation.snippet && (
                                        <div><strong>Content:</strong> {citation.snippet}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>{citation}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {questionResponse.follow_up_questions && questionResponse.follow_up_questions.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Follow-up Questions:</h4>
                            <div className="space-y-1">
                              {questionResponse.follow_up_questions.map((question, index) => (
                                <div key={index} className={`text-xs p-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  • {question}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={`p-3 rounded ${theme === 'dark' ? 'bg-red-900' : 'bg-red-50'} border-l-4 border-red-500`}>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          Error: {questionResponse.error || 'Failed to generate question'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Show document sources if available */}
                {mindmapStats?.document_sources && mindmapStats.document_sources.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Document Sources:</h4>
                    <div className="space-y-1">
                      {mindmapStats.document_sources.map((source, index) => (
                        <div key={index} className={`text-xs p-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <FileText className="w-3 h-3 inline mr-1" />
                          {source}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 58, 62, 0.3);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(85, 96, 82, 0.4);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(85, 96, 82, 0.6);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(16, 185, 129, 0.1);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
};

export default MindMapViewer;