import React, { useMemo } from 'react';

const HighlightedDescription = ({ 
  description, 
  dynamicFields, 
  formData, 
  isComparisonMode 
}) => {
  // Process the description and find matches
  const processedContent = useMemo(() => {
    if (!description || (!dynamicFields && !formData)) return description;
    if (!isComparisonMode) return [{ text: description, highlight: false }];

    // Create an array of segments to highlight
    const matches = [];

    // Check base form data
    const baseFields = {
      product: { value: formData?.product, type: 'product' },
      category: { value: formData?.category, type: 'category' },
      brand: { value: formData?.brand, type: 'brand' }
    };

    // Add base fields to matches
    Object.entries(baseFields).forEach(([key, field]) => {
      if (field.value) {
        matches.push({
          text: field.value,
          type: field.type
        });
      }
    });

    // Add dynamic fields to matches
    Object.entries(dynamicFields).forEach(([fieldId, field]) => {
      if (field.value) {
        matches.push({
          text: field.value,
          type: field.type.toLowerCase()
        });
      }
    });

    // Sort matches by length (longest first to prevent partial matches)
    matches.sort((a, b) => b.text.length - a.text.length);

    // Split description into segments and mark for highlighting
    let segments = [{ text: description, highlight: false }];

    matches.forEach(match => {
      const newSegments = [];
      
      segments.forEach(segment => {
        if (segment.highlight) {
          newSegments.push(segment);
          return;
        }

        const parts = segment.text.split(new RegExp(`(${match.text})`, 'gi'));
        parts.forEach((part, index) => {
          if (part.toLowerCase() === match.text.toLowerCase()) {
            newSegments.push({
              text: part,
              highlight: true,
              type: match.type
            });
          } else if (part) {
            newSegments.push({
              text: part,
              highlight: false
            });
          }
        });
      });

      segments = newSegments;
    });

    return segments;
  }, [description, dynamicFields, formData, isComparisonMode]);

  // Get highlight color based on field type
  const getHighlightStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'benefits':
        return ' text-green-300';
      case 'rtb':
        return 'text-purple-300';
      case 'ingredients':
        return 'text-yellow-300';
      case 'features':
        return 'text-red-300';
      case 'product':
        return 'text-blue-300';
      case 'category':
        return 'text-indigo-300';
      case 'brand':
        return 'text-pink-300';
      default:
        return 'text-orange-300';
    }
  };

  return (
    <p className="text-gray-300 mb-4 text-justify leading-relaxed">
      {processedContent.map((segment, index) => (
        segment.highlight ? (
          <span
            key={index}
            className={`px-1 rounded ${getHighlightStyle(segment.type)} transition-colors`}
            title={`${segment.type} input`}
          >
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      ))}
    </p>
  );
};

export default HighlightedDescription;  