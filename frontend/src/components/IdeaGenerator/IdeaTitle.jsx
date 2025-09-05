import React from 'react';

const IdeaTitle = ({ idea }) => {
  // Get set information either from metadata or direct properties
  const getSetInfo = () => {
    const metadataSet = idea.metadata?.baseData?.ideaSet;
    const metadataLabel = idea.metadata?.baseData?.ideaSetLabel;
    
    // Use metadata values if available, otherwise fall back to direct properties
    const setNumber = metadataSet || idea.idea_set;
    const setLabel = metadataLabel || idea.idea_set_label || `Set ${setNumber}-0`;
    
    return { setNumber, setLabel };
  };

  const { setLabel } = getSetInfo();

  return (
    <h4 className="text-xl font-meidum tracking-tight dark:text-white mb-2 flex items-center gap-2">
      <span>{idea.product_name}</span>
      <span className="text-sm dark:text-emerald-400 text-[#d17a56]">({setLabel})</span>
    </h4>
  );
};

export default IdeaTitle;