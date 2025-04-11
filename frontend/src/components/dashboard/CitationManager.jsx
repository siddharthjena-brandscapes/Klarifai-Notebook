
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

// Wikipedia-style Citation Tooltip Component
const SimpleCitation = ({ citation, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [portalContainer, setPortalContainer] = useState(null);
  
  // Create a portal container for the tooltip
  useEffect(() => {
    let container = document.getElementById('citation-tooltip-portal');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'citation-tooltip-portal';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '0';
      container.style.height = '0';
      container.style.overflow = 'visible';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
    
    setPortalContainer(container);
    
    return () => {
      // Don't remove the container as other tooltips might be using it
    };
  }, []);
  
  // Calculate Wikipedia-style tooltip position
  const updateTooltipPosition = () => {
    if (!isOpen || !triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    
    // Position to the right of the citation number first (Wikipedia style)
    let left = triggerRect.right + scrollX + 10; // 10px spacing from the citation
    let top = triggerRect.top + scrollY - (tooltipRect.height / 2) + (triggerRect.height / 2);
    
    // Ensure tooltip stays within the right edge of the screen
    if (left + tooltipRect.width > viewportWidth - 20) {
      // If it would go off the right edge, position to the left of the citation
      left = triggerRect.left + scrollX - tooltipRect.width - 10;
      
      // If it would still go off the left edge, position below the citation
      if (left < 20) {
        left = Math.max(20, triggerRect.left + scrollX - (tooltipRect.width / 2) + (triggerRect.width / 2));
        top = triggerRect.bottom + scrollY + 10;
      }
    }
    
    // Check vertical positioning
    // Make sure it doesn't go above the top of the viewport
    if (top < 20) {
      top = 20;
    }
    
    // Make sure it doesn't go below the bottom of the viewport
    if (top + tooltipRect.height > viewportHeight - 20) {
      top = viewportHeight - tooltipRect.height - 20;
    }
    
    setTooltipPosition({ top, left });
  };
  
  // Handle mouse enter (hover)
  const handleMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    
    // Add a small delay before showing tooltip (like Wikipedia)
    tooltipTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200);
  };

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    // Add a delay before closing to allow moving to the tooltip
    tooltipTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  // Handle tooltip mouse enter
  const handleTooltipMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  };

  // Handle tooltip mouse leave
  const handleTooltipMouseLeave = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };
  
  // Update position when tooltip opens or window resizes
  useEffect(() => {
    if (isOpen) {
      const positionTooltip = () => {
        requestAnimationFrame(updateTooltipPosition);
      };
      
      // Small delay to ensure tooltip has rendered before positioning
      setTimeout(positionTooltip, 10);
      
      window.addEventListener('resize', positionTooltip);
      window.addEventListener('scroll', positionTooltip, true);
      
      return () => {
        window.removeEventListener('resize', positionTooltip);
        window.removeEventListener('scroll', positionTooltip, true);
      };
    }
  }, [isOpen]);
  
  // Add global click handler to close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen) {
        const tooltipEl = tooltipRef.current;
        const citationEl = triggerRef.current;
        
        if (tooltipEl && citationEl && 
            !tooltipEl.contains(e.target) && 
            !citationEl.contains(e.target)) {
          setIsOpen(false);
        }
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [isOpen]);
  
  // Copy citation to clipboard
  const handleCopy = (e) => {
    e.stopPropagation();
    
    const text = `${citation.snippet || ''} (${citation.source_file}, p.${citation.page_number || 'Unknown'})`;
    navigator.clipboard.writeText(text);
    
    // Show feedback
    const btn = e.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = "Copied!";
    setTimeout(() => {
      btn.innerText = originalText;
    }, 1500);
  };
  
  // View source document
  const handleViewSource = (e) => {
    e.stopPropagation();
    
    if (citation.document_id) {
      window.open(`/documents/${citation.document_id}/original/`, '_blank');
    }
  };
  
  // Render tooltip through portal for better positioning
  const renderTooltip = () => {
    if (!isOpen || !portalContainer) return null;
    
    return ReactDOM.createPortal(
      <div
        ref={tooltipRef}
        id={`citation-tooltip-${index}`}
        className="bg-white rounded shadow-lg border border-gray-300 p-3 w-72"
        style={{
          position: 'absolute',
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          zIndex: 9999,
          opacity: 0,
          transform: 'translateY(-5px)',
          animation: 'fadeInTooltip 0.2s ease-out forwards',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={handleTooltipMouseEnter}
        onMouseLeave={handleTooltipMouseLeave}
      >
        {/* Add CSS animation for tooltip */}
        <style>
          {`
            @keyframes fadeInTooltip {
              from {
                opacity: 0;
                transform: translateY(-5px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            /* Add a tooltip arrow (Wikipedia style) */
            .tooltip-arrow {
              position: absolute;
              width: 0;
              height: 0;
              border-style: solid;
            }
            
            .tooltip-arrow-left {
              right: 100%;
              top: 50%;
              margin-top: -8px;
              border-width: 8px 8px 8px 0;
              border-color: transparent #fff transparent transparent;
              filter: drop-shadow(-2px 0px 1px rgba(0,0,0,0.1));
            }
            
            .tooltip-arrow-right {
              left: 100%;
              top: 50%;
              margin-top: -8px;
              border-width: 8px 0 8px 8px;
              border-color: transparent transparent transparent #fff;
              filter: drop-shadow(2px 0px 1px rgba(0,0,0,0.1));
            }
            
            .tooltip-arrow-top {
              bottom: 100%;
              left: 50%;
              margin-left: -8px;
              border-width: 0 8px 8px 8px;
              border-color: transparent transparent #fff transparent;
              filter: drop-shadow(0px -2px 1px rgba(0,0,0,0.1));
            }
          `}
        </style>
        
        {/* Tooltip arrow - dynamically positioned based on tooltip placement */}
        <div className={`tooltip-arrow tooltip-arrow-${
          tooltipPosition.left <= triggerRef.current?.getBoundingClientRect().left ? 'right' :
          tooltipPosition.top >= triggerRef.current?.getBoundingClientRect().bottom ? 'top' : 'left'
        }`} />
        
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-gray-900 text-sm">Citation</h3>
          <button
            className="text-gray-400 hover:text-gray-700 text-xs"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex flex-col mt-1">
            <div className="p-2 bg-gray-50 rounded border border-gray-200 text-gray-800 text-sm max-h-32 overflow-y-auto">
              {citation.snippet || 'No excerpt available.'}
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            <span className="font-medium text-blue-600">Source:</span> {citation.source_file || 'Unknown'}
            {citation.page_number && citation.page_number !== 'Unknown' && (
              <>, page {citation.page_number}</>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleCopy}
            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-gray-200 transition-colors border border-gray-300"
          >
            Copy
          </button>
          
          {/* <button
            onClick={handleViewSource}
            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100 transition-colors border border-blue-200"
          >
            View Source
          </button> */}
        </div>
      </div>,
      portalContainer
    );
  };
  
  return (
    <span className="inline-flex align-baseline" style={{ display: 'inline' }}>
      <sup
        ref={triggerRef}
        id={`citation-ref-${index}`}
        className="inline-flex cursor-help text-blue-600 hover:text-blue-800 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="citation-bracket">[</span>{index + 1}<span className="citation-bracket">]</span>
      </sup>
      {renderTooltip()}
    </span>
  );
};

// Citation Manager with direct DOM manipulation approach
const SimpleCitationManager = ({ content, citations }) => {
  // Ref to hold the container element
  const containerRef = useRef(null);
  
  // Process and render citations when component mounts or updates
  useEffect(() => {
    if (!containerRef.current || !content || !citations || citations.length === 0) {
      if (containerRef.current) {
        containerRef.current.innerHTML = formatTextContent(content || '');
      }
      return;
    }
    
    // Process the content with citation markers
    const processedContent = processCitationMarkers(content, citations);
    
    // Set the HTML content
    containerRef.current.innerHTML = processedContent;
    
    // Find all citation placeholders and render the React components
    const citationPlaceholders = containerRef.current.querySelectorAll('[data-citation-id]');
    citationPlaceholders.forEach((placeholder) => {
      const citationId = parseInt(placeholder.getAttribute('data-citation-id'), 10);
      
      if (citationId >= 0 && citationId < citations.length) {
        // Create a container for the citation
        const citationContainer = document.createElement('span');
        citationContainer.style.display = 'inline-flex';
        citationContainer.style.alignItems = 'baseline';
        
        // Replace the placeholder with the container
        placeholder.parentNode.replaceChild(citationContainer, placeholder);
        
        // Render the citation component into the container
        try {
          ReactDOM.render(
            <SimpleCitation 
              citation={citations[citationId]}
              index={citationId}
            />,
            citationContainer
          );
        } catch (error) {
          console.error("Error rendering citation:", error);
        }
      }
    });
    
    // Cleanup function to unmount all citation components
    return () => {
      const citationContainers = containerRef.current?.querySelectorAll('.citation-container') || [];
      citationContainers.forEach((container) => {
        try {
          ReactDOM.unmountComponentAtNode(container);
        } catch (error) {
          console.error("Error unmounting citation:", error);
        }
      });
    };
  }, [content, citations]);
  
  // Process the content to add or utilize citation markers
  const processCitationMarkers = (text, citations) => {
    if (!text || !citations || citations.length === 0) {
      return formatTextContent(text || '');
    }
    
    // Check if content already has citation markers
    const hasCitationMarkers = text.includes('<citation id="');
    
    // Add citation markers if needed
    let contentWithMarkers = hasCitationMarkers 
      ? text 
      : addSimpleCitationMarkers(text, citations);
    
    // Replace all citation markers with placeholders for React components
    contentWithMarkers = contentWithMarkers.replace(
      /<citation id="(\d+)"><\/citation>/g, 
      '<span data-citation-id="$1" class="citation-placeholder"></span>'
    );
    
    // Format and return the content
    return formatTextContent(contentWithMarkers);
  };
  
  // Format HTML content with styling
  const formatTextContent = (text) => {
    if (!text) return '';
    
    return text
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .replace(/"""html/g, '')
      .replace(/"""/g, '')
      .replace(/<p>/g, '<p class="mb-4">')
      .replace(/<b>/g, '<b class="font-bold">')
      .replace(/<h3>/g, '<h3 class="text-lg font-semibold mt-4 mb-2">')
      .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-4">')
      .replace(/<ol>/g, '<ol class="list-decimal pl-6 mb-4">')
      .replace(/<li>/g, '<li class="mb-2">')
      .replace(/<table>/g, '<table class="w-full border-collapse border border-gray-500 mt-4 mb-4">')
      .replace(/<th>/g, '<th class="border border-gray-500 bg-gray-700 text-white p-2">')
      .replace(/<td>/g, '<td class="border border-gray-500 p-2">')
      .replace(/<\/table>\s*<p>/g, '</table><p class="mt-4">')
      .replace(/\n{3,}/g, "\n\n")
      .replace(/<\/b>\s*\n+/g, "</b>\n");
  };
  
  // Add citation markers to text that doesn't have them
  const addSimpleCitationMarkers = (text, citations) => {
    if (!citations.length) return text;
    
    try {
      // Very basic approach: add citations at the end of sentences
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const citationsPerSentence = Math.max(1, Math.floor(sentences.length / citations.length));
      
      let processedText = '';
      for (let i = 0; i < sentences.length; i++) {
        // Add the sentence
        processedText += sentences[i].trim();
        
        // Add citation marker at the end of the sentence, before the space
        if (i % citationsPerSentence === 0) {
          const citationIndex = Math.min(Math.floor(i / citationsPerSentence), citations.length - 1);
          if (citationIndex >= 0) {
            processedText += `<citation id="${citationIndex}"></citation> `;
          } else {
            processedText += ' ';
          }
        } else {
          processedText += ' ';
        }
      }
      
      return processedText;
    } catch (e) {
      console.error("Error in simple citation processing:", e);
      return text;
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className="citation-content"
    />
  );
};

export { SimpleCitation, SimpleCitationManager };