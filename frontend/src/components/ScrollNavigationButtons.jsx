import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const ScrollNavigationButtons = () => {
  const [isTopButtonVisible, setIsTopButtonVisible] = useState(false);
  const [isBottomButtonVisible, setIsBottomButtonVisible] = useState(false);

  const checkScrollPosition = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    // Top button appears when scrolled down more than 300px
    setIsTopButtonVisible(scrollTop > 300);

    // Bottom button appears when user is near the top and content is scrollable
    setIsBottomButtonVisible(
      scrollTop < 300 && 
      scrollHeight > clientHeight
    );
  };

  // Scroll to top when top button is clicked
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Scroll to bottom when bottom button is clicked
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);
    
    // Initial check
    checkScrollPosition();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, []);

  return (
    <>
      {isTopButtonVisible && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          aria-label="Scroll to Top"
          title='Scroll to Top'
        >
          <ArrowUp size={24} />
        </button>
      )}
      
      {isBottomButtonVisible && (
        <button 
          onClick={scrollToBottom}
          className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
          aria-label="Scroll to Bottom"
          title='Scroll to Bottom'
        >
          <ArrowDown size={24} />
        </button>
      )}
    </>
  );
};

export default ScrollNavigationButtons;