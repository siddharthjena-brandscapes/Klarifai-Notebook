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
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <h3 className="text-xl font-semibold text-white">Edit Idea</h3>
          <button
            onClick={() => setEditingIdea(null)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Product Name
            </label>
            <input
              type="text"
              name="product_name"
              value={editForm.product_name}
              onChange={handleEditChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-white rounded-lg transition-all"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Description
              </label>
              <div className="flex items-center text-blue-400 text-xs">
                <AlertTriangle size={14} className="mr-1" />
                <span>Use clear, detailed descriptions for better results</span>
              </div>
            </div>
            <textarea
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              rows={8}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-white rounded-lg transition-all"
              placeholder="Enter detailed description..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => handleUpdateIdea(ideaId)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Check size={20} />
            Save Changes
          </button>
          <button
            onClick={() => setEditingIdea(null)}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditIdeaPanel;