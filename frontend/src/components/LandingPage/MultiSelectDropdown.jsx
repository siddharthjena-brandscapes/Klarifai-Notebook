import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

const MultiSelectDropdown = ({ 
  options = [], 
  selected = [], 
  onChange, 
  placeholder = "Select categories...",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const removeItem = (value, e) => {
    e.stopPropagation();
    const newSelected = selected.filter(item => item !== value);
    onChange(newSelected);
  };

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) return selected[0];
    return `${selected.length} categories selected`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main dropdown button */}
      <button
        type="button"
        className={`w-full px-4 py-2 bg-white/80 dark:bg-white/5 border border-[#d6cbbf] dark:border-gray-300/20 rounded-lg text-left focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selected.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            ) : (
              <div className="flex items-center flex-wrap gap-1">
                {selected.length <= 2 ? (
                  // Show individual tags for 1-2 selections
                  selected.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#556052]/20 dark:bg-emerald-600/20 text-[#556052] dark:text-emerald-300"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={(e) => removeItem(item, e)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  // Show count for 3+ selections
                  <span className="text-[#5e4636] dark:text-white font-medium">
                    {selected.length} categories selected
                  </span>
                )}
              </div>
            )}
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        </div>
      </button>

      {/* Selected items display (when closed and many selected) */}
      {!isOpen && selected.length > 2 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#556052]/20 dark:bg-emerald-600/20 text-[#556052] dark:text-emerald-300"
            >
              {item}
              <button
                type="button"
                onClick={(e) => removeItem(item, e)}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-[#d6cbbf] dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No categories available
            </div>
          ) : (
            <div className="py-1">
              {options.map((option) => {
                const optionValue = typeof option === 'string' ? option : option.name;
                const optionId = typeof option === 'string' ? option : option.id;
                const isSelected = selected.includes(optionValue);
                
                return (
                  <label
                    key={optionId}
                    className="flex items-center px-4 py-2 hover:bg-[#f5e6d8] dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(optionValue)}
                      className="w-4 h-4 text-[#a55233] dark:text-emerald-500 border-gray-300 rounded focus:ring-[#a55233] dark:focus:ring-emerald-500 mr-3"
                    />
                    <span className="text-[#5e4636] dark:text-white font-medium flex-1">
                      {optionValue}
                    </span>
                    {isSelected && (
                      <span className="text-[#a55233] dark:text-emerald-500 text-sm">✓</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;