import React from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';

const EditIdeaPanel = ({ 
  editForm, 
  handleEditChange, 
  handleUpdateIdea, 
  setEditingIdea, 
  ideaId, 
  className = '' 
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-[#e8ddcc] dark:border-gray-700 rounded-lg p-6 shadow-md ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#e3d5c8] dark:border-gray-700 pb-4">
          <h3 className="text-xl font-semibold text-[#0a3b25] dark:text-white">Edit Idea</h3>
          <button
            onClick={() => setEditingIdea(null)}
            className="text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-300 mb-2">
              Product Name
            </label>
            <input
              type="text"
              name="product_name"
              value={editForm.product_name}
              onChange={handleEditChange}
              className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700 border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500 text-[#5e4636] dark:text-white rounded-lg transition-all"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-300">
                Description
              </label>
              <div className="flex items-center text-[#556052] dark:text-blue-400 text-xs">
                <AlertTriangle size={14} className="mr-1" />
                <span>Use clear, detailed descriptions for better results</span>
              </div>
            </div>
            <textarea
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              rows={8}
              className="w-full px-4 py-3 bg-white/80 dark:bg-gray-700 border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500 text-[#5e4636] dark:text-white rounded-lg transition-all"
              placeholder="Enter detailed description..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-[#e3d5c8] dark:border-gray-700">
          <button
            onClick={() => handleUpdateIdea(ideaId)}
            className="flex-1 bg-gradient-to-r from-[#a55233] to-[#556052] hover:from-[#8b4513] hover:to-[#425142] dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Check size={20} />
            Save Changes
          </button>
          <button
            onClick={() => setEditingIdea(null)}
            className="flex-1 bg-white hover:bg-[#f5e6d8] text-[#5e4636] border border-[#d6cbbf] dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-transparent px-6 py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditIdeaPanel;