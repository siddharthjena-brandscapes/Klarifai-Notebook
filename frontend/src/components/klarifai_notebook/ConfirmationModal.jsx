import React from 'react';
import { X, Trash2, FileUp, BookOpen, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  type = 'delete', // 'delete' | 'convert' | 'warning' | 'info'
  title,
  message,
  itemName,
  isLoading = false,
  loadingText = 'Processing...',
  confirmText,
  cancelText = 'Cancel',
  showDetails = false,
  details = []
}) => {
  if (!isOpen) return null;

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Configuration based on type
  const getConfig = () => {
    switch (type) {
      case 'delete':
        return {
          icon: Trash2,
          iconColor: 'text-red-600 dark:text-red-400',
          title: title || 'Delete Item',
          message: message || `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
          confirmButtonClass: 'bg-red-600 hover:bg-red-700',
          confirmText: confirmText || 'Delete'
        };
      case 'convert':
        return {
          icon: FileUp,
          iconColor: 'text-[#a55233] dark:text-blue-400',
          title: title || 'Convert to Document',
          message: message || `Convert "${itemName}" to a document source? This will make it available for chat queries.`,
          confirmButtonClass: 'bg-[#a55233] dark:bg-blue-600 hover:bg-[#8b4513] dark:hover:bg-blue-700',
          confirmText: confirmText || (isLoading ? loadingText : 'Convert'),
          showDetails: true,
          details: details.length > 0 ? details : [
            'Note becomes searchable in chat queries',
            'Content will be available as a knowledge source', 
            'Original note remains accessible'
          ]
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          title: title || 'Warning',
          message: message || 'Are you sure you want to proceed?',
          confirmButtonClass: 'bg-yellow-600 hover:bg-yellow-700',
          confirmText: confirmText || 'Proceed'
        };
      case 'info':
        return {
          icon: BookOpen,
          iconColor: 'text-[#a55233] dark:text-blue-400',
          title: title || 'Confirmation',
          message: message || 'Please confirm your action.',
          confirmButtonClass: 'bg-[#a55233] dark:bg-blue-600 hover:bg-[#8b4513] dark:hover:bg-blue-700',
          confirmText: confirmText || 'Confirm'
        };
      default:
        return getConfig.call(this, 'delete');
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

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
          <div className="flex items-center space-x-2">
            <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
            <h3 className="text-lg font-medium text-[#0a3b25] font-serif dark:text-white">
              {config.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#8c715f] dark:text-gray-400 hover:text-[#5e4636] dark:hover:text-white
                       p-1 rounded-full hover:bg-[#e8d5c4] dark:hover:bg-gray-700/50
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-2">
          <p className="text-[#5e4636] dark:text-gray-300 text-sm mb-3">
            {config.message}
          </p>
          
          {/* Details Section (for convert type or custom details) */}
          {(config.showDetails || showDetails) && config.details && (
            <div className="bg-[#f5e6d8] dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <BookOpen className="h-4 w-4 text-[#a55233] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-[#5e4636] dark:text-gray-300 font-medium mb-1">
                    {type === 'convert' ? 'What happens when you convert:' : 'Details:'}
                  </p>
                  <ul className="text-xs text-[#8c715f] dark:text-gray-400 space-y-1">
                    {config.details.map((detail, index) => (
                      <li key={index}>• {detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-2 border-t border-[#e3d5c8] dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-[#d6cbbf] dark:border-gray-700 
                       text-[#5e4636] dark:text-gray-300 hover:bg-[#f5e6d8] dark:hover:bg-gray-700 
                       rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg text-sm transition-colors
                       flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed
                       ${config.confirmButtonClass}`}
          >
            <IconComponent className="h-3 w-3" />
            <span>{config.confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
