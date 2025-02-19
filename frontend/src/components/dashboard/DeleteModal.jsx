import React from 'react';
import { X } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, onConfirm, documentName }) => {
  if (!isOpen) return null;

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="w-80 bg-gray-900 rounded-xl shadow-2xl   p-4 space-y-4 overflow-hidden"
        onClick={handleModalClick}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-1  ">
          <h3 className="text-lg font-medium text-white">
            Confirm Delete
          </h3>
          
        </div>

        {/* Modal Content */}
        <div className="py-2">
          <p className="text-gray-300 text-sm">
            Are you sure you want to delete "{documentName}"? This action cannot be undone.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-2  border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;