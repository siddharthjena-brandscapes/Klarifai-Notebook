import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

const IdeaAnalysis = ({ idea, dynamicFields, formData }) => {
  // Analyze which form inputs are present in the idea
  const analysis = useMemo(() => {
    if (!idea?.description || !dynamicFields) return {};
    
    const matches = {};
    const description = idea.description.toLowerCase();
    
    // Check base form data
    const baseFields = {
      product: formData?.product,
      category: formData?.category,
      brand: formData?.brand
    };
    
    Object.entries(baseFields).forEach(([key, value]) => {
      if (value && description.includes(value.toLowerCase())) {
        matches[key] = value;
      }
    });
    
    // Check dynamic fields
    Object.entries(dynamicFields).forEach(([fieldId, field]) => {
      if (field.value && description.includes(field.value.toLowerCase())) {
        matches[fieldId] = {
          type: field.type,
          value: field.value
        };
      }
    });
    
    return matches;
  }, [idea, dynamicFields, formData]);
  
  // No matches found
  if (Object.keys(analysis).length === 0) {
    return (
      <div className="mt-2 flex items-center gap-2 text-[#8c715f] dark:text-gray-400 text-sm">
        <AlertCircle size={16} />
        <span>No direct input matches found in this idea</span>
      </div>
    );
  }
  
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {Object.entries(analysis).map(([key, value]) => {
          // Handle both base fields and dynamic fields
          const isBaseField = typeof value === 'string';
          const displayText = isBaseField ? value : value.value;
          const fieldType = isBaseField ? key : value.type;
          
          // Color coding based on field type for both light and dark themes
          let lightBgColor = 'bg-[#556052]/10';
          let lightBorderColor = 'border-[#556052]/30';
          let lightTextColor = 'text-[#556052]';
          
          let darkBgColor = 'dark:bg-blue-500/20';
          let darkBorderColor = 'dark:border-blue-500/40';
          let darkTextColor = 'dark:text-blue-300';
          
          switch (fieldType.toLowerCase()) {
            case 'benefits':
              lightBgColor = 'bg-[#556052]/10';
              lightBorderColor = 'border-[#556052]/30';
              lightTextColor = 'text-[#556052]';
              darkBgColor = 'dark:bg-green-500/20';
              darkBorderColor = 'dark:border-green-500/40';
              darkTextColor = 'dark:text-green-300';
              break;
            case 'rtb':
              lightBgColor = 'bg-[#a55233]/10';
              lightBorderColor = 'border-[#a55233]/30';
              lightTextColor = 'text-[#a55233]';
              darkBgColor = 'dark:bg-purple-500/20';
              darkBorderColor = 'dark:border-purple-500/40';
              darkTextColor = 'dark:text-purple-300';
              break;
            case 'ingredients':
              lightBgColor = 'bg-[#a68a70]/20';
              lightBorderColor = 'border-[#a68a70]/40';
              lightTextColor = 'text-[#8c715f]';
              darkBgColor = 'dark:bg-yellow-500/20';
              darkBorderColor = 'dark:border-yellow-500/40';
              darkTextColor = 'dark:text-yellow-300';
              break;
            case 'features':
              lightBgColor = 'bg-[#a55233]/10';
              lightBorderColor = 'border-[#a55233]/30';
              lightTextColor = 'text-[#a55233]';
              darkBgColor = 'dark:bg-red-500/20';
              darkBorderColor = 'dark:border-red-500/40';
              darkTextColor = 'dark:text-red-300';
              break;
            case 'product':
              lightBgColor = 'bg-[#556052]/10';
              lightBorderColor = 'border-[#556052]/30';
              lightTextColor = 'text-[#556052]';
              darkBgColor = 'dark:bg-blue-500/20';
              darkBorderColor = 'dark:border-blue-500/40';
              darkTextColor = 'dark:text-blue-300';
              break;
            case 'category':
              lightBgColor = 'bg-[#a55233]/10';
              lightBorderColor = 'border-[#a55233]/30';
              lightTextColor = 'text-[#a55233]';
              darkBgColor = 'dark:bg-teal-500/20';
              darkBorderColor = 'dark:border-teal-500/40';
              darkTextColor = 'dark:text-teal-300';
              break;
            case 'brand':
              lightBgColor = 'bg-[#a68a70]/20';
              lightBorderColor = 'border-[#a68a70]/40';
              lightTextColor = 'text-[#8c715f]';
              darkBgColor = 'dark:bg-indigo-500/20';
              darkBorderColor = 'dark:border-indigo-500/40';
              darkTextColor = 'dark:text-indigo-300';
              break;
          }
          
          return (
            <div
              key={key}
              className={`px-3 py-1 rounded-full border ${lightBgColor} ${lightBorderColor} ${lightTextColor} ${darkBgColor} ${darkBorderColor} ${darkTextColor} text-sm flex items-center gap-2`}
            >
              <span className="font-medium capitalize">{fieldType}:</span>
              <span>{displayText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IdeaAnalysis;