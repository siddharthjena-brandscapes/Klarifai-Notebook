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
      <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
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
          
          // Color coding based on field type
          let bgColor = 'bg-blue-500/20';
          let borderColor = 'border-blue-500/40';
          let textColor = 'text-blue-300';
          
          switch (fieldType.toLowerCase()) {
            case 'benefits':
              bgColor = 'bg-green-500/20';
              borderColor = 'border-green-500/40';
              textColor = 'text-green-300';
              break;
            case 'rtb':
              bgColor = 'bg-purple-500/20';
              borderColor = 'border-purple-500/40';
              textColor = 'text-purple-300';
              break;
            case 'ingredients':
              bgColor = 'bg-yellow-500/20';
              borderColor = 'border-yellow-500/40';
              textColor = 'text-yellow-300';
              break;
            case 'features':
              bgColor = 'bg-red-500/20';
              borderColor = 'border-red-500/40';
              textColor = 'text-red-300';
              break;
          }
          
          return (
            <div
              key={key}
              className={`px-3 py-1 rounded-full border ${bgColor} ${borderColor} ${textColor} text-sm flex items-center gap-2`}
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