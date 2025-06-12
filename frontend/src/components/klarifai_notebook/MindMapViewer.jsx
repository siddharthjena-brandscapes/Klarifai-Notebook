// import React, { useState, useEffect, useRef, useContext } from 'react';
// import { X, Brain, ChevronDown, ChevronRight, MessageSquare, Loader2, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
// import { ThemeContext } from '../../context/ThemeContext';

// const MindMapViewer = ({ isOpen, onClose, mindmapData, mainProjectId, selectedDocuments = [], mindmapId = null, onSendToChat }) => {
//   const { theme } = useContext(ThemeContext);
//   const [expandedNodes, setExpandedNodes] = useState(new Set());
//   const [selectedNode, setSelectedNode] = useState(null);
//   const [isQuestionLoading, setIsQuestionLoading] = useState(false);
//   const [questionResponse, setQuestionResponse] = useState(null);
//   const [zoomLevel, setZoomLevel] = useState(1);
//   const mindmapRef = useRef(null);

//   // Initialize expanded nodes (expand first level by default)
//   useEffect(() => {
//     if (mindmapData && mindmapData.children) {
//       const firstLevelNodes = new Set();
//       mindmapData.children.forEach((_, index) => {
//         firstLevelNodes.add(`root-${index}`);
//       });
//       setExpandedNodes(firstLevelNodes);
//     }
//   }, [mindmapData]);

//   const toggleNodeExpansion = (nodeId) => {
//     const newExpanded = new Set(expandedNodes);
//     if (newExpanded.has(nodeId)) {
//       newExpanded.delete(nodeId);
//     } else {
//       newExpanded.add(nodeId);
//     }
//     setExpandedNodes(newExpanded);
//   };

//   const handleNodeClick = (node, nodePath) => {
//     setSelectedNode({ ...node, path: nodePath });
//     setQuestionResponse(null);
//   };

//   const askQuestionAboutNode = async () => {
//     if (!selectedNode) return;

//     setIsQuestionLoading(true);
//     try {
//       const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      
//       const response = await mindmapServiceNB.askMindmapQuestion(
//         mainProjectId,
//         selectedNode.name,
//         selectedNode.summary || selectedNode.description || '',
//         selectedNode.path || '',
//         selectedDocuments,
//         mindmapId
//       );

//       if (response.data && response.data.success) {
//         // Instead of storing in questionResponse, send the question to chat
//         const generatedQuestion = response.data.question;
        
//         // Send the question to the main chat interface
//         if (onSendToChat && generatedQuestion) {
//           onSendToChat(generatedQuestion);
//           // Close the mindmap viewer after sending question
//           onClose();
//         } else {
//           // Fallback: store the response if onSendToChat is not available
//           setQuestionResponse(response.data);
//         }
//       } else {
//         console.error('Failed to get question response:', response.data);
//         setQuestionResponse({
//           success: false,
//           error: response.data?.error || 'Failed to generate question'
//         });
//       }
//     } catch (error) {
//       console.error('Error asking question:', error);
//       setQuestionResponse({
//         success: false,
//         error: error.response?.data?.error || error.message
//       });
//     } finally {
//       setIsQuestionLoading(false);
//     }
//   };

//   const exportMindmap = () => {
//     const dataStr = JSON.stringify(mindmapData, null, 2);
//     const dataBlob = new Blob([dataStr], { type: 'application/json' });
//     const url = URL.createObjectURL(dataBlob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `mindmap-${Date.now()}.json`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     URL.revokeObjectURL(url);
//   };

//   const handleZoom = (direction) => {
//     if (direction === 'in' && zoomLevel < 2) {
//       setZoomLevel(prev => Math.min(prev + 0.1, 2));
//     } else if (direction === 'out' && zoomLevel > 0.5) {
//       setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
//     } else if (direction === 'reset') {
//       setZoomLevel(1);
//     }
//   };

//   const renderMindmapNode = (node, depth = 0, parentPath = '', index = 0) => {
//     const nodeId = `${parentPath}-${index}`;
//     const nodePath = parentPath ? `${parentPath} > ${node.name}` : node.name;
//     const isExpanded = expandedNodes.has(nodeId);
//     const hasChildren = node.children && node.children.length > 0;
//     const isSelected = selectedNode && selectedNode.name === node.name && selectedNode.path === nodePath;

//     const getNodeColors = (depth) => {
//       const colorSchemes = theme === 'dark' 
//         ? [
//             'bg-gradient-to-r from-blue-600 to-purple-600',
//             'bg-gradient-to-r from-green-600 to-blue-600', 
//             'bg-gradient-to-r from-purple-600 to-pink-600',
//             'bg-gradient-to-r from-orange-600 to-red-600',
//             'bg-gradient-to-r from-teal-600 to-cyan-600'
//           ]
//         : [
//             'bg-gradient-to-r from-blue-500 to-purple-500',
//             'bg-gradient-to-r from-green-500 to-blue-500',
//             'bg-gradient-to-r from-purple-500 to-pink-500', 
//             'bg-gradient-to-r from-orange-500 to-red-500',
//             'bg-gradient-to-r from-teal-500 to-cyan-500'
//           ];
//       return colorSchemes[depth % colorSchemes.length];
//     };

//     return (
//       <div key={nodeId} className="relative">
//         {/* Connection line for non-root nodes */}
//         {depth > 0 && (
//           <div className={`absolute -top-4 left-4 w-px h-4 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
//         )}
        
//         <div 
//           className={`
//             relative flex items-center group cursor-pointer mb-2
//             transition-all duration-200 hover:scale-[1.02]
//             ${isSelected ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
//           `}
//           onClick={() => handleNodeClick(node, nodePath)}
//           style={{ marginLeft: `${depth * 24}px` }}
//         >
//           {/* Expand/collapse button */}
//           {hasChildren && (
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 toggleNodeExpansion(nodeId);
//               }}
//               className={`mr-2 p-1 rounded transition-colors ${
//                 theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//               }`}
//             >
//               {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
//             </button>
//           )}

//           {/* Node content */}
//           <div className={`
//             flex-1 p-3 rounded-lg shadow-sm transition-all duration-200
//             ${getNodeColors(depth)}
//             text-white
//             group-hover:shadow-md group-hover:scale-[1.01]
//           `}>
//             <div className="flex items-center justify-between">
//               <h4 className="font-semibold text-sm">{node.name}</h4>
//               {(node.summary || node.description) && (
//                 <MessageSquare size={14} className="opacity-70" />
//               )}
//             </div>
            
//             {(node.summary || node.description) && (
//               <p className="text-xs mt-1 opacity-90 line-clamp-2">
//                 {node.summary || node.description}
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Children */}
//         {hasChildren && isExpanded && (
//           <div className="relative">
//             {depth > 0 && (
//               <div className={`absolute top-0 left-4 w-px h-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'}`} />
//             )}
//             {node.children.map((child, childIndex) => 
//               renderMindmapNode(child, depth + 1, nodeId, childIndex)
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   if (!isOpen || !mindmapData) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       {/* Backdrop */}
//       <div 
//         className={`fixed inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-gray-900'} bg-opacity-50 backdrop-blur-sm`}
//         onClick={onClose}
//       />
      
//       {/* Modal */}
//       <div className={`
//         relative w-full h-full max-w-7xl max-h-[90vh] mx-4 flex
//         ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} 
//         rounded-lg shadow-2xl overflow-hidden
//       `}>
//         {/* Header */}
//         <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700 bg-inherit">
//           <div className="flex items-center space-x-3">
//             <Brain className="w-6 h-6 text-blue-500" />
//             <div>
//               <h2 className="text-xl font-bold">Mind Map: {mindmapData.name}</h2>
//               <p className="text-sm opacity-70">Interactive document visualization</p>
//             </div>
//           </div>
          
//           <div className="flex items-center space-x-2">
//             {/* Zoom controls */}
//             <div className="flex items-center space-x-1 mr-2">
//               <button
//                 onClick={() => handleZoom('out')}
//                 className={`p-2 rounded transition-colors ${
//                   theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//                 }`}
//                 disabled={zoomLevel <= 0.5}
//               >
//                 <ZoomOut size={16} />
//               </button>
//               <span className="text-sm px-2">{Math.round(zoomLevel * 100)}%</span>
//               <button
//                 onClick={() => handleZoom('in')}
//                 className={`p-2 rounded transition-colors ${
//                   theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//                 }`}
//                 disabled={zoomLevel >= 2}
//               >
//                 <ZoomIn size={16} />
//               </button>
//               <button
//                 onClick={() => handleZoom('reset')}
//                 className={`p-2 rounded transition-colors ${
//                   theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//                 }`}
//               >
//                 <RotateCcw size={16} />
//               </button>
//             </div>

//             <button
//               onClick={exportMindmap}
//               className={`p-2 rounded transition-colors ${
//                 theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//               }`}
//               title="Export mindmap as JSON"
//             >
//               <Download size={16} />
//             </button>
            
//             <button
//               onClick={onClose}
//               className={`p-2 rounded transition-colors ${
//                 theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//               }`}
//             >
//               <X size={20} />
//             </button>
//           </div>
//         </div>

//         {/* Content area */}
//         <div className="flex flex-1 pt-20">
//           {/* Mindmap panel */}
//           <div className={`flex-1 overflow-auto p-6 ${selectedNode ? 'w-2/3' : 'w-full'}`}>
//             <div 
//               ref={mindmapRef}
//               style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
//               className="min-w-max"
//             >
//               {renderMindmapNode(mindmapData)}
//             </div>
//           </div>

//           {/* Question panel */}
//           {selectedNode && (
//             <div className={`w-1/3 border-l ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'} p-6 overflow-auto`}>
//               <div className="space-y-4">
//                 <div>
//                   <h3 className="text-lg font-semibold mb-2">Selected Node</h3>
//                   <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
//                     <h4 className="font-medium">{selectedNode.name}</h4>
//                     {selectedNode.path && (
//                       <p className="text-xs opacity-70 mt-1">Path: {selectedNode.path}</p>
//                     )}
//                     {(selectedNode.summary || selectedNode.description) && (
//                       <p className="text-sm mt-2 opacity-90">
//                         {selectedNode.summary || selectedNode.description}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 <button
//                   onClick={askQuestionAboutNode}
//                   disabled={isQuestionLoading}
//                   className={`
//                     w-full py-3 px-4 rounded-lg font-medium transition-all
//                     ${isQuestionLoading 
//                       ? 'opacity-50 cursor-not-allowed' 
//                       : 'hover:scale-[1.02]'
//                     }
//                     ${theme === 'dark' 
//                       ? 'bg-blue-600 hover:bg-blue-700 text-white' 
//                       : 'bg-blue-500 hover:bg-blue-600 text-white'
//                     }
//                     flex items-center justify-center space-x-2
//                   `}
//                 >
//                   {isQuestionLoading ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       <span>Generating Question...</span>
//                     </>
//                   ) : (
//                     <>
//                       <MessageSquare className="w-4 h-4" />
//                       <span>Ask Question in Chat</span>
//                     </>
//                   )}
//                 </button>

//                 {questionResponse && (
//                   <div className="space-y-3">
//                     {questionResponse.success ? (
//                       <>
//                         <div>
//                           <h4 className="font-medium mb-2">Question Generated:</h4>
//                           <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'} border-l-4 border-blue-500`}>
//                             <p className="text-sm font-medium">{questionResponse.question}</p>
//                           </div>
//                         </div>

//                         <div>
//                           <h4 className="font-medium mb-2">Answer:</h4>
//                           <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} max-h-64 overflow-auto`}>
//                             <p className="text-sm whitespace-pre-wrap">{questionResponse.answer}</p>
//                           </div>
//                         </div>

//                         {questionResponse.citations && questionResponse.citations.length > 0 && (
//                           <div>
//                             <h4 className="font-medium mb-2">Sources:</h4>
//                             <div className="space-y-1">
//                               {questionResponse.citations.map((citation, index) => (
//                                 <div key={index} className={`text-xs p-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
//                                   {typeof citation === 'object' ? (
//                                     <div className="space-y-1">
//                                       {citation.source_file && (
//                                         <div><strong>File:</strong> {citation.source_file}</div>
//                                       )}
//                                       {citation.page_number && (
//                                         <div><strong>Page:</strong> {citation.page_number}</div>
//                                       )}
//                                       {citation.section_title && (
//                                         <div><strong>Section:</strong> {citation.section_title}</div>
//                                       )}
//                                       {citation.snippet && (
//                                         <div><strong>Content:</strong> {citation.snippet}</div>
//                                       )}
//                                     </div>
//                                   ) : (
//                                     <div>{citation}</div>
//                                   )}
//                                 </div>
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                         {questionResponse.follow_up_questions && questionResponse.follow_up_questions.length > 0 && (
//                           <div>
//                             <h4 className="font-medium mb-2">Follow-up Questions:</h4>
//                             <div className="space-y-1">
//                               {questionResponse.follow_up_questions.map((question, index) => (
//                                 <div key={index} className={`text-xs p-2 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
//                                   • {question}
//                                 </div>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </>
//                     ) : (
//                       <div className={`p-3 rounded ${theme === 'dark' ? 'bg-red-900' : 'bg-red-50'} border-l-4 border-red-500`}>
//                         <p className="text-sm text-red-600 dark:text-red-400">
//                           Error: {questionResponse.error || 'Failed to generate question'}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MindMapViewer;

// MindMapViewer.jsx - Enhanced with history support
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
  FileText
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
  isFromHistory = false, // New prop to indicate if this is from history
  mindmapStats = null // New prop for mindmap statistics
}) => {
  const { theme } = useContext(ThemeContext);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [questionResponse, setQuestionResponse] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const mindmapRef = useRef(null);

  // Initialize expanded nodes (expand first level by default)
  useEffect(() => {
    if (mindmapData && mindmapData.children) {
      const firstLevelNodes = new Set();
      mindmapData.children.forEach((_, index) => {
        firstLevelNodes.add(`root-${index}`);
      });
      setExpandedNodes(firstLevelNodes);
    }
  }, [mindmapData]);

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

  const askQuestionAboutNode = async () => {
    if (!selectedNode) return;

    setIsQuestionLoading(true);
    try {
      const { mindmapServiceNB } = await import('../../utils/axiosConfig');
      
      const response = await mindmapServiceNB.askMindmapQuestion(
        mainProjectId,
        selectedNode.name,
        selectedNode.summary || selectedNode.description || '',
        selectedNode.path || '',
        selectedDocuments,
        mindmapId
      );

      if (response.data && response.data.success) {
        // Send the question to the main chat interface
        const generatedQuestion = response.data.question;
        
        if (onSendToChat && generatedQuestion) {
          onSendToChat(generatedQuestion);
          // Close the mindmap viewer after sending question
          onClose();
        } else {
          // Fallback: store the response if onSendToChat is not available
          setQuestionResponse(response.data);
        }
      } else {
        console.error('Failed to get question response:', response.data);
        setQuestionResponse({
          success: false,
          error: response.data?.error || 'Failed to generate question'
        });
      }
    } catch (error) {
      console.error('Error asking question:', error);
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
        {/* Connection line for non-root nodes */}
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
          {/* Expand/collapse button */}
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

          {/* Node content */}
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

        {/* Children */}
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
        relative w-full h-full max-w-7xl max-h-[90vh] mx-4 flex
        ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} 
        rounded-lg shadow-2xl overflow-hidden
      `}>
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700 bg-inherit">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold">Mind Map: {mindmapData.name}</h2>
              <div className="flex items-center space-x-4 text-sm opacity-70">
                <span>Interactive document visualization</span>
                {isFromHistory && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>From History</span>
                  </div>
                )}
                {mindmapStats?.created_at && (
                  <div className="flex items-center space-x-1">
                    <span>Created: {formatDate(mindmapStats.created_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Stats display */}
            {mindmapStats && (
              <div className="hidden md:flex items-center space-x-4 text-xs mr-4">
                <div className="flex items-center space-x-1">
                  <Brain className="w-3 h-3" />
                  <span>{mindmapStats.total_nodes} nodes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>{mindmapStats.document_sources?.length || 0} docs</span>
                </div>
              </div>
            )}

            {/* Zoom controls */}
            <div className="flex items-center space-x-1 mr-2">
              <button
                onClick={() => handleZoom('out')}
                className={`p-2 rounded transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-sm px-2">{Math.round(zoomLevel * 100)}%</span>
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

            <button
              onClick={exportMindmap}
              className={`p-2 rounded transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
              title="Export mindmap as JSON"
            >
              <Download size={16} />
            </button>
            
            <button
              onClick={onClose}
              className={`p-2 rounded transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-1 pt-20">
          {/* Mindmap panel */}
          <div className={`flex-1 overflow-auto p-6 ${selectedNode ? 'w-2/3' : 'w-full'}`}>
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
            <div className={`w-1/3 border-l ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'} p-6 overflow-auto`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Selected Node</h3>
                  <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
                    <h4 className="font-medium">{selectedNode.name}</h4>
                    {selectedNode.path && (
                      <p className="text-xs opacity-70 mt-1">Path: {selectedNode.path}</p>
                    )}
                    {(selectedNode.summary || selectedNode.description) && (
                      <p className="text-sm mt-2 opacity-90">
                        {selectedNode.summary || selectedNode.description}
                      </p>
                    )}
                  </div>
                </div>

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
    </div>
  );
};

export default MindMapViewer;