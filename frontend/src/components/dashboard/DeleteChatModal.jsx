import React from 'react';
import { X } from 'lucide-react';

const DeleteChatModal = ({ isOpen, onClose, onConfirm, chatTitle }) => {
  if (!isOpen) return null;

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/20 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-80 bg-[#faf4ee] dark:bg-gray-900 rounded-xl shadow-2xl p-4 space-y-4 overflow-hidden border border-[#d6cbbf] dark:border-gray-700/50"
        onClick={handleModalClick}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-1">
          <h3 className="text-lg font-medium text-[#0a3b25] font-serif dark:text-white">
            Confirm Delete
          </h3>
          
        </div>

        {/* Modal Content */}
        <div className="py-2">
          <p className="text-[#5e4636] dark:text-gray-300 text-sm">
            Are you sure you want to delete "{chatTitle}"? This action cannot be undone.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-2 border-t border-[#e3d5c8] dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-[#d6cbbf] dark:border-gray-700 text-[#5e4636] dark:text-gray-300 hover:bg-[#f5e6d8] dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
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

export default DeleteChatModal;