

import React from "react";
import { Archive } from "lucide-react";

const ArchiveProjectModal = ({ isOpen, onClose, onConfirm, projectName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 dark:bg-black/70 bg-white/40 backdrop-blur-sm">
      <div className="bg-[#faf4ee] dark:bg-gray-800 rounded-xl p-6 w-full max-w-md border border-[#d6cbbf] dark:border-emerald-500/30 shadow-xl">
        <div className="mb-5 flex items-center space-x-3">
          <div className="p-2 bg-[#a55233]/10 dark:bg-amber-600/20 rounded-lg">
            <Archive className="w-6 h-6 text-[#a55233] dark:text-yellow-200/80" />
          </div>
          <h2 className="text-xl font-serif font-medium text-[#0a3b25] dark:text-white">Archive Project</h2>
        </div>

        <div className="mb-6">
          <p className="text-[#5e4636] dark:text-gray-300 mb-2">
            Are you sure you want to archive:
          </p>
          <p className="text-[#a55233] dark:text-emerald-400 font-semibold text-lg">"{projectName}"</p>
          <p className="text-[#5a544a] dark:text-gray-400 mt-3 text-sm">
            Archived projects are moved out of your main project list but can be restored at any time.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-[#f5e6d8] dark:hover:bg-gray-600 text-[#5e4636] dark:text-gray-200 border border-[#d6cbbf] dark:border-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] dark:bg-amber-600/20 dark:hover:bg-amber-200/20 text-white dark:text-yellow-200/80 rounded-lg transition-colors flex items-center"
          >
            <Archive className="w-4 h-4 mr-2 text-white dark:text-yellow-200/80" />
            Archive Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveProjectModal;