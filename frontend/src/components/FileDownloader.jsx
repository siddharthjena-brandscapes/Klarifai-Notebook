import { useEffect, useState } from "react";
import { BlobServiceClient } from "@azure/storage-blob";

// 🔐 Your Azure Storage configuration
const sasToken = "sv=2024-11-04&ss=bfqt&srt=co&sp=rwdlacupiytfx&se=2025-08-08T18:38:06Z&st=2025-07-28T10:23:06Z&spr=https&sig=cv2XKdqGzK%2FfCnV20E8dAqEqJlkQiqH3vYLKdevq5oA%3D";
const containerName = "frontend-blob";
const storageAccountName = "klarifaibbsrblob";

// Check if configuration is complete
const isConfigured = !sasToken.includes('<') && 
                    !containerName.includes('<') && 
                    !containerName.includes('YOUR_') &&
                    !storageAccountName.includes('<');

let blobServiceClient, containerClient;

if (isConfigured) {
  blobServiceClient = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
  );
  containerClient = blobServiceClient.getContainerClient(containerName);
}

// TreeNode component for file/folder selection
const TreeNode = ({ node, level = 0, onToggle, selectedItems, onSelectItem, getAllChildFiles }) => {
  const indent = level * 24;
  const isFolder = node.type === 'folder';
  
  // For folders, check if all children are selected
  let isSelected = false;
  let isIndeterminate = false;
  
  if (isFolder) {
    const childFiles = getAllChildFiles(node);
    const selectedChildFiles = childFiles.filter(filePath => selectedItems.has(filePath));
    
    if (childFiles.length > 0) {
      isSelected = selectedChildFiles.length === childFiles.length;
      isIndeterminate = selectedChildFiles.length > 0 && selectedChildFiles.length < childFiles.length;
    }
  } else {
    isSelected = selectedItems.has(node.path);
  }

  return (
    <div>
      {/* Indentation lines for tree structure */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          position: 'relative',
          padding: '6px 12px',
          paddingLeft: `${12 + indent}px`,
          borderRadius: '6px',
          backgroundColor: isSelected ? '#e8f4fd' : (isIndeterminate ? '#f0f8ff' : 'transparent'),
          border: isSelected ? '1px solid #2196f3' : (isIndeterminate ? '1px solid #90caf9' : '1px solid transparent'),
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: '36px'
        }}
        onClick={() => onSelectItem(node.path, node.type)}
        onMouseEnter={(e) => {
          if (!isSelected && !isIndeterminate) {
            e.target.style.backgroundColor = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected && !isIndeterminate) {
            e.target.style.backgroundColor = 'transparent';
          }
        }}
      >
        {/* Tree structure lines */}
        {level > 0 && (
          <>
            {/* Vertical line from parent */}
            <div style={{
              position: 'absolute',
              left: `${12 + (level - 1) * 24 + 12}px`,
              top: '0',
              bottom: '50%',
              width: '1px',
              backgroundColor: '#ddd'
            }} />
            {/* Horizontal line to node */}
            <div style={{
              position: 'absolute',
              left: `${12 + (level - 1) * 24 + 12}px`,
              top: '50%',
              width: '12px',
              height: '1px',
              backgroundColor: '#ddd'
            }} />
          </>
        )}
        
        <input
          type="checkbox"
          checked={isSelected}
          ref={(input) => {
            if (input) input.indeterminate = isIndeterminate;
          }}
          onChange={() => onSelectItem(node.path, node.type)}
          style={{ 
            marginRight: '10px',
            transform: 'scale(1.1)',
            accentColor: '#2196f3'
          }}
        />
        
        {isFolder ? (
          <span 
            onClick={(e) => { e.stopPropagation(); onToggle(node.path); }}
            style={{ 
              marginRight: '8px', 
              fontWeight: 'bold', 
              fontSize: '18px', 
              cursor: 'pointer',
              color: '#2196f3',
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '3px',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
            }}
          >
            {node.expanded ? '−' : '+'}
          </span>
        ) : (
          <span style={{ 
            marginRight: '8px', 
            fontSize: '16px',
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            📄
          </span>
        )}
        
        {isFolder && (
          <span style={{ 
            marginRight: '6px', 
            fontSize: '16px',
            display: 'inline-flex',
            alignItems: 'center'
          }}>
            {node.expanded ? '📂' : '📁'}
          </span>
        )}
        
        <span style={{ 
          fontSize: '14px',
          fontWeight: isFolder ? '600' : '400',
          color: isFolder ? '#1976d2' : '#333',
          flex: 1
        }}>
          {node.name}
        </span>
        
        {!isFolder && (
          <span style={{ 
            fontSize: '12px',
            color: '#666',
            backgroundColor: '#f0f0f0',
            padding: '2px 6px',
            borderRadius: '10px',
            marginLeft: '8px'
          }}>
            {(node.size / 1024).toFixed(1)} KB
          </span>
        )}
      </div>
      
      {isFolder && node.expanded && node.children && (
        <div style={{ 
          position: 'relative'
        }}>
          {/* Vertical line for expanded folder */}
          <div style={{
            position: 'absolute',
            left: `${12 + level * 24 + 12}px`,
            top: '0',
            bottom: '0',
            width: '1px',
            backgroundColor: '#ddd'
          }} />
          
          {node.children.map((child, index) => (
            <TreeNode 
              key={index}
              node={child} 
              level={level + 1}
              onToggle={onToggle}
              selectedItems={selectedItems}
              onSelectItem={onSelectItem}
              getAllChildFiles={getAllChildFiles}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileDownloader = () => {
  const [fileTree, setFileTree] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Show configuration message if not fully configured
  if (!isConfigured) {
    return (
      <div style={{ 
        padding: "2rem", 
        fontFamily: "sans-serif", 
        maxWidth: "600px", 
        margin: "auto",
        backgroundColor: "#fff3e0",
        borderRadius: "10px",
        border: "2px solid #ff9800"
      }}>
        <h2>⚙️ Configuration Required</h2>
        <p>Please configure your Azure Storage settings in the component to use the file downloader.</p>
      </div>
    );
  }

  // Build file tree for download
  const buildFileTree = async () => {
    setIsLoading(true);
    setStatus("🔄 Loading files from Azure Storage...");
    
    try {
      const tree = { name: 'Root', type: 'folder', path: '', children: [], expanded: true };
      const pathMap = { '': tree };

      for await (const blob of containerClient.listBlobsFlat()) {
        // Skip placeholder files completely
        if (blob.name.endsWith('/.placeholder')) continue;
        
        const pathParts = blob.name.split('/');
        let currentPath = '';
        
        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          const parentPath = currentPath;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          
          if (!pathMap[currentPath]) {
            const isFile = i === pathParts.length - 1;
            const node = {
              name: part,
              type: isFile ? 'file' : 'folder',
              path: currentPath,
              size: isFile ? blob.properties.contentLength || 0 : 0,
              expanded: false,
              children: isFile ? undefined : []
            };
            
            pathMap[currentPath] = node;
            if (pathMap[parentPath]) {
              pathMap[parentPath].children.push(node);
            }
          }
        }
      }
      
      // Sort children alphabetically (folders first, then files)
      const sortChildren = (node) => {
        if (node.children) {
          node.children.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          node.children.forEach(sortChildren);
        }
      };
      
      sortChildren(tree);
      setFileTree(tree);
      setStatus("✅ Files loaded successfully!");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      console.error("Failed to build file tree:", error);
      setStatus("❌ Failed to load files: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle tree node expansion
  const toggleNode = (path) => {
    const updateNode = (node) => {
      if (node.path === path) {
        return { ...node, expanded: !node.expanded };
      }
      if (node.children) {
        return { ...node, children: node.children.map(updateNode) };
      }
      return node;
    };
    
    setFileTree(prev => updateNode(prev));
  };

  // Get all child files recursively
  const getAllChildFiles = (node) => {
    let files = [];
    if (node.type === 'file') {
      files.push(node.path);
    } else if (node.children) {
      node.children.forEach(child => {
        files.push(...getAllChildFiles(child));
      });
    }
    return files;
  };

  // Handle item selection for download
  const handleSelectItem = (path, type) => {
    const newSelected = new Set(selectedItems);
    
    if (type === 'folder') {
      // Find the folder node
      const findNode = (node) => {
        if (node.path === path) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child);
            if (found) return found;
          }
        }
        return null;
      };
      
      const folderNode = findNode(fileTree);
      if (folderNode) {
        const childFiles = getAllChildFiles(folderNode);
        const allSelected = childFiles.every(filePath => newSelected.has(filePath));
        
        if (allSelected) {
          // Deselect all children
          childFiles.forEach(filePath => newSelected.delete(filePath));
        } else {
          // Select all children
          childFiles.forEach(filePath => newSelected.add(filePath));
        }
      }
    } else {
      // Handle file selection
      if (newSelected.has(path)) {
        newSelected.delete(path);
      } else {
        newSelected.add(path);
      }
    }
    
    setSelectedItems(newSelected);
  };

  // Select all items
  const selectAll = () => {
    if (fileTree) {
      const allFilePaths = getAllChildFiles(fileTree);
      setSelectedItems(new Set(allFilePaths));
    }
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedItems(new Set());
  };



  // Download selected items
  const downloadSelected = async () => {
    if (selectedItems.size === 0) {
      alert("Please select at least one item to download.");
      return;
    }

    setIsLoading(true);
    let downloadedCount = 0;

    try {
      // All selected items are already file paths, so we can download them directly
      const filesToDownload = Array.from(selectedItems);

      setStatus(`🔄 Downloading ${filesToDownload.length} file(s)...`);

      // Download each file
      for (let i = 0; i < filesToDownload.length; i++) {
        const filePath = filesToDownload[i];
        
        try {
          setStatus(`🔄 Downloading ${i + 1}/${filesToDownload.length}: ${filePath.split('/').pop()}`);
          
          const blobClient = containerClient.getBlobClient(filePath);
          const downloadBlockBlobResponse = await blobClient.download();
          const blob = await downloadBlockBlobResponse.blobBody;
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filePath.split('/').pop(); // Get filename only
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          downloadedCount++;
          
          // Add small delay between downloads to prevent browser blocking
          if (i < filesToDownload.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (fileError) {
          console.error(`Failed to download ${filePath}:`, fileError);
          setStatus(`⚠️ Failed to download ${filePath}: ${fileError.message}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (downloadedCount > 0) {
        setStatus(`✅ Downloaded ${downloadedCount} file(s) successfully!`);
        setSelectedItems(new Set()); // Clear selections after successful download
      } else {
        setStatus(`❌ No files were downloaded. Please check your selections.`);
      }
      
    } catch (error) {
      console.error("Failed to download:", error);
      setStatus("❌ Failed to download: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load file tree on component mount
  useEffect(() => {
    buildFileTree();
  }, []);

  return (
    <div style={{ 
      padding: "2rem", 
      fontFamily: "sans-serif", 
      maxWidth: "800px", 
      margin: "auto",
      backgroundColor: "#f9f9f9",
      borderRadius: "10px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
    }}>
      <h2 style={{ textAlign: "center", color: "#333", marginBottom: "2rem" }}>
        📥 Azure File Downloader
      </h2>
      
      <div style={{ 
        marginBottom: "1rem", 
        padding: "0.75rem", 
        backgroundColor: "#e8f5e8", 
        borderRadius: "6px",
        border: "1px solid #4CAF50",
        textAlign: "center",
        color: "#2e7d32",
        fontSize: "14px"
      }}>
        🔗 Connected to: <strong>{storageAccountName}</strong> → <strong>{containerName}</strong>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        marginBottom: "1.5rem", 
        display: "flex", 
        gap: "1rem", 
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        <button 
          onClick={buildFileTree}
          disabled={isLoading}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "14px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontWeight: "bold"
          }}
        >
          🔄 Refresh Files
        </button>
        
        <button 
          onClick={selectAll}
          disabled={isLoading || !fileTree}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "14px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isLoading || !fileTree ? "not-allowed" : "pointer",
            fontWeight: "bold"
          }}
        >
          ☑️ Select All Files
        </button>
        
        <button 
          onClick={clearAll}
          disabled={isLoading || selectedItems.size === 0}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "14px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isLoading || selectedItems.size === 0 ? "not-allowed" : "pointer",
            fontWeight: "bold"
          }}
        >
          ❌ Clear Selection
        </button>
      </div>

      {/* Selection Summary */}
      {selectedItems.size > 0 && (
        <div style={{ 
          marginBottom: "1rem", 
          padding: "0.75rem", 
          backgroundColor: "#e3f2fd", 
          borderRadius: "6px",
          border: "1px solid #2196F3",
          textAlign: "center",
          color: "#1976d2",
          fontSize: "14px",
          fontWeight: "bold"
        }}>
          📋 Selected: {selectedItems.size} item(s)
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div style={{ 
          textAlign: "center", 
          margin: "1rem 0",
          padding: "1rem",
          backgroundColor: "#e3f2fd",
          borderRadius: "8px",
          border: "1px solid #2196f3"
        }}>
          <div style={{
            display: "inline-block",
            width: "20px",
            height: "20px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #2196f3",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginRight: "10px"
          }}></div>
          Processing...
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* File Tree */}
      {fileTree && (
        <div style={{ 
          marginBottom: "1.5rem", 
          padding: "1rem", 
          backgroundColor: "white", 
          borderRadius: "8px",
          border: "1px solid #ddd"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "1rem", color: "#333" }}>
            📁 Available Files & Folders
          </h3>
          <div style={{
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            maxHeight: '500px',
            overflow: 'auto',
            backgroundColor: '#fefefe',
            fontFamily: 'monospace, sans-serif'
          }}>
            {fileTree.children && fileTree.children.length > 0 ? (
              <TreeNode 
                node={fileTree}
                onToggle={toggleNode}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                getAllChildFiles={getAllChildFiles}
              />
            ) : (
              <p style={{ textAlign: "center", color: "#666", fontStyle: "italic" }}>
                No files found in the storage container.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Download Button */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <button
          onClick={downloadSelected}
          disabled={selectedItems.size === 0 || isLoading}
          style={{
            padding: "1rem 2rem",
            fontSize: "18px",
            fontWeight: "bold",
            backgroundColor: selectedItems.size === 0 || isLoading ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: selectedItems.size === 0 || isLoading ? "not-allowed" : "pointer",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
          }}
        >
          📥 Download Selected ({selectedItems.size})
        </button>
      </div>

      {/* Status Messages */}
      {status && (
        <div style={{ 
          padding: "1rem", 
          backgroundColor: status.includes('❌') ? "#ffebee" : 
                          status.includes('🔄') ? "#e3f2fd" : "#e8f5e8",
          borderRadius: "8px",
          border: `2px solid ${status.includes('❌') ? "#f44336" : 
                                status.includes('🔄') ? "#2196f3" : "#4CAF50"}`,
          fontWeight: "bold",
          textAlign: "center",
          color: status.includes('❌') ? "#d32f2f" : 
                 status.includes('🔄') ? "#1976d2" : "#2e7d32"
        }}>
          {status}
        </div>
      )}
    </div>
  );
};

export default FileDownloader;