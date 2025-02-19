import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

const ComparisonModeToggle = ({ isEnabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isEnabled 
          ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
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
          <EyeOff size={16} />
          <span>Comparison Mode Off</span>
        </>
      )}
    </button>
  );
};

export default ComparisonModeToggle;