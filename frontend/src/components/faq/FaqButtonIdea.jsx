// FaqButton.jsx
import React from 'react';
import { HelpCircle } from 'lucide-react';

const FaqButtonIdea = ({ className }) => {
  // Replace this with your actual Azure Blob Storage URL
  const AZURE_BLOB_FAQ_URL = 'https://dockerblobklarifaibbsr.blob.core.windows.net/uploadfiles/FaqFolder/User_guide_idea_generator (edited).pdf';
  

  const handleFaqClick = () => {
    // Option 1: Open single PDF
    window.open(AZURE_BLOB_FAQ_URL, '_blank');
  };

  return (
    <button
      onClick={handleFaqClick}
      className={`fixed bottom-2 left-2 text-neutral-400 p-3 transition-colors duration-300 hover:text-blue-500 focus:outline-none ${className || ''}`}
      aria-label="Frequently Asked Questions"
      title="Frequently Asked Questions"
    >
      <HelpCircle size={20} />
    </button>
  );
};

export default FaqButtonIdea;