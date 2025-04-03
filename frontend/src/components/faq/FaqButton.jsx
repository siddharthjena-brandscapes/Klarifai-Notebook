// FaqButton.jsx
import React from 'react';
import { HelpCircle } from 'lucide-react';

const FaqButton = () => {
  const handleFaqClick = () => {
    // Open FAQ page in a new tab
    window.open('/faq', '_blank');
  };

  return (
    <button
      onClick={handleFaqClick}
      className="fixed bottom-2 right-2 text-neutral-400 p-3 transition-colors duration-300 hover:text-blue-500 focus:outline-none "
      // aria-label="Frequently Asked Questions"
      title="Frequently Asked Questions"
    >
      <HelpCircle size={20} />
    </button>
  );
};

export default FaqButton;