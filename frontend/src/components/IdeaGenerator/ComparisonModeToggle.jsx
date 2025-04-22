import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const ComparisonModeToggle = ({ isEnabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isEnabled 
          ? 'bg-[#556052] hover:bg-[#425142] dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white' 
          : 'bg-white hover:bg-[#f5e6d8] text-[#5a544a] border border-[#d6cbbf] dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-transparent'
      }`}
      title={isEnabled ? 'Disable comparison mode' : 'Enable comparison mode'}
    >
      {isEnabled ? (
        <>
          <Eye size={16} />
          <span>Comparison Mode On</span>
        </>
      ) : (
        <>
          <EyeOff size={16} className="text-[#a55233] dark:text-inherit" />
          <span>Comparison Mode Off</span>
        </>
      )}
    </button>
  );
};

export default ComparisonModeToggle;