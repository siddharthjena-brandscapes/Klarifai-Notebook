import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const BulkDeleteModal = ({ isOpen, onClose, onConfirm, selectedCount, selectedDocuments, documents }) => {
  if (!isOpen) return null;

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Get document names from IDs
  const getSelectedDocumentNames = () => {
    if (!selectedDocuments || !documents) return [];
    
    return selectedDocuments.map(docId => {
      const doc = documents.find(d => d.id.toString() === docId);
      return doc ? doc.filename : `Document ${docId}`;
    });
  };

  const documentNames = getSelectedDocumentNames();
  
  return (
    <div 
      className="fixed inset-0 bg-black/20 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="w-96 bg-[#faf4ee] dark:bg-gray-900 rounded-xl shadow-2xl p-6 space-y-4 overflow-hidden border border-[#d6cbbf] dark:border-gray-700/50"
        onClick={handleModalClick}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-1">
          <h3 className="text-lg font-medium dark:text-white flex items-center font-serif">
            <AlertTriangle size={18} className="text-red-500 dark:text-red-400 mr-2" />
            Confirm Bulk Delete
          </h3>
          <button 
            onClick={onClose}
            className="dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-2">
          <p className="text-[#5e4636] dark:text-gray-300 text-sm mb-3">
            Are you sure you want to delete {selectedCount} selected document{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
          </p>
          
          {/* Document Names List - with scrollbar for all documents */}
          <div className="mt-2 max-h-60 overflow-y-auto custom-scrollbar dark:bg-gray-800/50 rounded-lg p-2">
            {documentNames.map((name, index) => (
              <div key={index} className="text-sm py-1 px-1 dark:text-gray-200  border-b dark:border-gray-700/30 last:border-0 truncate">
                {index + 1}. {name}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-2 border-t border-[#e3d5c8] dark:border-gray-700/30 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-[#d6cbbf] dark:border-gray-700 text-[#5e4636] dark:text-gray-300 hover:bg-[#f5e6d8] dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
          >
            <AlertTriangle size={14} />
            Delete All
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteModal;