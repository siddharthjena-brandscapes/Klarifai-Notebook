
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";

const SimpleCitation = ({ citation, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [portalContainer, setPortalContainer] = useState(null);

  // Create a portal container for the tooltip
  useEffect(() => {
    let container = document.getElementById("citation-tooltip-portal");

    if (!container) {
      container = document.createElement("div");
      container.id = "citation-tooltip-portal";
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "0";
      container.style.height = "0";
      container.style.overflow = "visible";
      container.style.zIndex = "9999";
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
    let top =
      triggerRect.top +
      scrollY -
      tooltipRect.height / 2 +
      triggerRect.height / 2;

    // Ensure tooltip stays within the right edge of the screen
    if (left + tooltipRect.width > viewportWidth - 20) {
      // If it would go off the right edge, position to the left of the citation
      left = triggerRect.left + scrollX - tooltipRect.width - 10;

      // If it would still go off the left edge, position below the citation
      if (left < 20) {
        left = Math.max(
          20,
          triggerRect.left +
            scrollX -
            tooltipRect.width / 2 +
            triggerRect.width / 2
        );
        top = triggerRect.bottom + scrollY + 10;
      }
    }

    // Check vertical positioning
    if (top < 20) {
      top = 20;
    }

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

    tooltipTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200);
  };

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

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

      setTimeout(positionTooltip, 10);

      window.addEventListener("resize", positionTooltip);
      window.addEventListener("scroll", positionTooltip, true);

      return () => {
        window.removeEventListener("resize", positionTooltip);
        window.removeEventListener("scroll", positionTooltip, true);
      };
    }
  }, [isOpen]);

  // Add global click handler to close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen) {
        const tooltipEl = tooltipRef.current;
        const citationEl = triggerRef.current;

        if (
          tooltipEl &&
          citationEl &&
          !tooltipEl.contains(e.target) &&
          !citationEl.contains(e.target)
        ) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Copy citation to clipboard
  const handleCopy = (e) => {
    e.stopPropagation();

    const text = `${citation.snippet || ""} (${citation.source_file}, p.${
      citation.page_number || "Unknown"
    })`;
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
      window.open(`/documents/${citation.document_id}/original/`, "_blank");
    }
  };

  // Render tooltip through portal for better positioning
  const renderTooltip = () => {
    if (!isOpen || !portalContainer) return null;

    return ReactDOM.createPortal(
      <div
        ref={tooltipRef}
        id={`citation-tooltip-${index}`}
        style={{
  position: "absolute",
  top: `${tooltipPosition.top}px`,
  left: `${tooltipPosition.left}px`,
  zIndex: 9999,
  borderRadius: "5px",
  padding: "10px",
  width: calculateTooltipWidth(citation.snippet),
  marginBottom: "5px",
  textAlign: "left",
  opacity: 0,
  transform: "translateY(-5px)",
  animation: "fadeInTooltip 0.2s ease-out forwards",
}}
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-orange-200 dark:border-gray-600 shadow-lg dark:shadow-2xl"
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
              border-color: transparent #2d3748 transparent transparent;
              filter: drop-shadow(-2px 0px 1px rgba(0,0,0,0.1));
            }
            
            .tooltip-arrow-right {
              left: 100%;
              top: 50%;
              margin-top: -8px;
              border-width: 8px 0 8px 8px;
              border-color: transparent transparent transparent #2d3748;
              filter: drop-shadow(2px 0px 1px rgba(0,0,0,0.1));
            }
            
            .tooltip-arrow-top {
              bottom: 100%;
              left: 50%;
              margin-left: -8px;
              border-width: 0 8px 8px 8px;
              border-color: transparent transparent #2d3748 transparent;
              filter: drop-shadow(0px -2px 1px rgba(0,0,0,0.1));
            }
          `}
        </style>

        {/* Tooltip arrow - dynamically positioned based on tooltip placement */}
        <div
          className={`tooltip-arrow tooltip-arrow-${
            tooltipPosition.left <=
            triggerRef.current?.getBoundingClientRect().left
              ? "right"
              : tooltipPosition.top >=
                triggerRef.current?.getBoundingClientRect().bottom
              ? "top"
              : "left"
          }`}
        />

       <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  }}
>
  <div className="font-bold text-orange-600 dark:text-blue-400">
    Source: {citation.source_file || "Unknown"}
  </div>
  <button
    onClick={() => setIsOpen(false)}
    className="bg-white dark:bg-transparent border-none text-orange-500 dark:text-gray-400 hover:text-orange-700 dark:hover:text-gray-200 cursor-pointer text-lg p-0 -mt-1 transition-colors"
  >
    ×
  </button>
</div>

        <div
  style={{
    maxHeight: "300px",
    overflowY: "auto",
    padding: "8px",
    fontSize: "13px",
    lineHeight: 1.4,
    color: "#242124", // Keep this as is since it's the content color
    whiteSpace: "pre-wrap",
    fontWeight: "600",
  }}
  className="border border-orange-300 dark:border-gray-600 bg-orange-50 dark:bg-white"
>
  {formatSnippetContent(citation.snippet || "No excerpt available.")}
</div>

        {citation.score && (
          <div
            style={{
              borderTop: "1px solid #4a5568",
              paddingTop: "5px",
              marginTop: "5px",
              fontSize: "12px",
              color: "#a0aec0",
              fontStyle: "italic",
            }}
          >
            Relevance: {(citation.score * 100).toFixed(1)}%
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "8px",
            gap: "8px",
          }}
        >
          <button
  onClick={handleCopy}
  className="px-2 py-1 bg-orange-100 dark:bg-blue-900/20 border border-orange-300 dark:border-blue-500 rounded text-orange-700 dark:text-blue-400 text-xs cursor-pointer hover:bg-orange-200 dark:hover:bg-blue-900/30 transition-colors"
>
            Copy
          </button>

          {/* {citation.document_id && (
            <button
              onClick={handleViewSource}
              style={{
                padding: "4px 8px",
                backgroundColor: "rgba(97, 218, 251, 0.2)",
                border: "1px solid #61dafb",
                borderRadius: "4px",
                color: "#61dafb",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              View Source
            </button>
          )} */}
        </div>
      </div>,
      portalContainer
    );
  };

// Add this advanced table formatting solution to your SimpleCitation component

/**
 * Detects and formats markdown tables in the content
 * Handles tables with long content and many columns
 */
/**
 * Generic table content formatter for citation tooltips
 * Designed to work with any table from any data source
 */
const formatSnippetContent = (content) => {
  if (!content) return content;
  
  // Generic pattern detection for tabular structures
  const hasTableStructure = (
    // Check for pipe-delimited content with sufficient structure
    ((content.match(/\|/g) || []).length > 3 && 
     (content.includes('--') || content.includes('==') || 
      (content.match(/\|\s*\S+\s*\|/) !== null))) || // Column headers pattern
    // Check for consistent pipe patterns that may indicate a table 
    detectTablePattern(content)
  );
  
  if (hasTableStructure) {
    // Process table-based content
    return formatTableContent(content);
  }
  
  // For non-table content, use simple pre-formatting
  return (
    <pre style={{
      fontFamily: "Consolas, monospace",
      fontSize: "12px",
      whiteSpace: "pre-wrap",
      overflowX: "auto",
      margin: 0,
      padding: 0
    }}>
      {content}
    </pre>
  );
};

/**
 * Advanced table pattern detection
 * Looks for consistent patterns that suggest tabular data
 */
const detectTablePattern = (content) => {
  if (!content) return false;
  
  const lines = content.split('\n');
  const pipeCounts = [];
  
  // Count consecutive lines with consistent pipe counts
  let consecutiveLines = 0;
  for (const line of lines) {
    if (!line.trim()) {
      consecutiveLines = 0;
      continue;
    }
    
    if (line.includes('|')) {
      const pipeCount = (line.match(/\|/g) || []).length;
      pipeCounts.push(pipeCount);
      consecutiveLines++;
      
      // If we have several consecutive lines with pipes, check consistency
      if (consecutiveLines >= 3) {
        // Get the last three pipe counts
        const recentCounts = pipeCounts.slice(-3);
        // Check if they are consistent (allowing small variations)
        const uniqueCounts = [...new Set(recentCounts)];
        if (uniqueCounts.length <= 2 && Math.max(...uniqueCounts) - Math.min(...uniqueCounts) <= 2) {
          return true;
        }
      }
    } else {
      consecutiveLines = 0;
    }
  }
  
  // Additional checks for header-separator patterns
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    
    // Look for header followed by separator pattern
    if (currentLine.startsWith('|') && currentLine.endsWith('|') &&
        nextLine.startsWith('|') && nextLine.endsWith('|') &&
        nextLine.includes('-')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Generic table formatter that organizes content into sections
 * Works with any tabular data pattern
 */
const formatTableContent = (content) => {
  try {
    // First identify all the table sections and regular content
    const sections = [];
    let currentSection = "";
    let inTable = false;
    let inHeader = false;
    let currentHeader = "";
    
    // Split content by lines
    const lines = content.split('\n');
    
    // Process each line to identify headers, tables and other content
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is a header line
      const isHeaderLine = line.startsWith('#');
      
      // Check if this line is a table row
      const isTableRow = line.includes('|') && line.startsWith('|') && line.endsWith('|');
      
      // Check if this is a table separator row
      const isSeparator = isTableRow && (line.includes('---') || line.includes('==='));
      
      // Handle headers
      if (isHeaderLine) {
        if (inTable) {
          // End the current table and start a new section
          sections.push({ type: 'table', content: currentSection.trim() });
          currentSection = "";
          inTable = false;
        }
        
        // If we already had header content, save it
        if (inHeader) {
          sections.push({ type: 'header', content: currentHeader.trim() });
        }
        
        // Start a new header
        inHeader = true;
        currentHeader = line;
        
        // Check if the next line is a table
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : "";
        const nextLineIsTable = nextLine.startsWith('|') && nextLine.endsWith('|');
        
        if (nextLineIsTable) {
          // This header is immediately followed by a table, so save it as a tableHeader
          sections.push({ type: 'tableHeader', content: currentHeader.trim() });
          inHeader = false;
          currentHeader = "";
        }
      }
      // Handle table rows
      else if (isTableRow) {
        // If we were in a header section, save it
        if (inHeader) {
          sections.push({ type: 'header', content: currentHeader.trim() });
          currentHeader = "";
          inHeader = false;
        }
        
        // If we weren't in a table before, start a new table section
        if (!inTable) {
          // If we have content in the current section, save it
          if (currentSection.trim()) {
            sections.push({ type: 'text', content: currentSection.trim() });
            currentSection = "";
          }
          inTable = true;
        }
        
        // Add to current table section
        currentSection += line + '\n';
      }
      // Handle regular text content
      else {
        // If we were in a header section, handle it
        if (inHeader) {
          if (line === "") {
            // Add a blank line to the header
            currentHeader += '\n';
          } else {
            // This is text content following a header, so save the header
            sections.push({ type: 'header', content: currentHeader.trim() });
            currentHeader = "";
            inHeader = false;
            
            // Start collecting text content
            if (currentSection.trim()) {
              sections.push({ type: 'text', content: currentSection.trim() });
              currentSection = "";
            }
            currentSection = line + '\n';
          }
        }
        // If we were in a table, end it
        else if (inTable) {
          // We were in a table, now we're not - save the table section
          sections.push({ type: 'table', content: currentSection.trim() });
          currentSection = line + '\n';
          inTable = false;
        }
        // Continue with text content
        else {
          currentSection += line + '\n';
        }
      }
    }
    
    // Add the last section
    if (inHeader && currentHeader.trim()) {
      sections.push({ type: 'header', content: currentHeader.trim() });
    } else if (inTable && currentSection.trim()) {
      sections.push({ type: 'table', content: currentSection.trim() });
    } else if (currentSection.trim()) {
      sections.push({ type: 'text', content: currentSection.trim() });
    }
    
    // Detect if this content contains structured data that might benefit from visualization
    const hasStructuredData = detectStructuredData(sections);
    
    // If we detected structured data that could be visualized, use special formatter
    if (hasStructuredData) {
      const specialFormat = formatStructuredData(sections, content);
      if (specialFormat) {
        return specialFormat;
      }
    }
    
    // Now process each section
    return (
      <div style={{ width: '100%' }}>
        {sections.map((section, idx) => {
          if (section.type === 'table') {
            return <ParsedTable key={idx} content={section.content} />;
          } else if (section.type === 'header' || section.type === 'tableHeader') {
            return <FormattedHeader key={idx} content={section.content} isTableHeader={section.type === 'tableHeader'} />;
          } else {
            return <FormattedText key={idx} content={section.content} />;
          }
        })}
      </div>
    );
  } catch (error) {
    console.error("Error formatting table content:", error);
    // Fall back to simple formatting
    return (
      <pre style={{
        fontFamily: "Consolas, monospace",
        fontSize: "12px",
        whiteSpace: "pre-wrap",
        margin: 0
      }}>
        {content}
      </pre>
    );
  }
};

/**
 * Detect if content contains structured data that might benefit from special visualizations
 * Uses pattern recognition instead of hardcoded terms
 */
const detectStructuredData = (sections) => {
  // Look for patterns common in structured data, without relying on specific terms
  
  // Check for percentage-based data that could be visualized
  const hasPercentageData = sections.some(section => {
    if (section.type !== 'table') return false;
    
    // Count percentage symbols in the content
    const percentCount = (section.content.match(/%/g) || []).length;
    
    // If this table has several percentage values, it might be visualizable
    return percentCount >= 3;
  });
  
  // Check for up/down indicators that suggest trend data
  const hasTrendIndicators = sections.some(section => {
    if (section.type !== 'table') return false;
    
    // Look for common trend indicators
    const upIndicators = ['↑', '🔼', '▲'];
    const downIndicators = ['↓', '🔻', '▼'];
    
    // Count occurrences of trend indicators
    let indicatorCount = 0;
    
    for (const indicator of [...upIndicators, ...downIndicators]) {
      indicatorCount += (section.content.match(new RegExp(indicator, 'g')) || []).length;
    }
    
    // If we have several trend indicators, this is likely trend data
    return indicatorCount >= 3;
  });
  
  // Check for numeric data with column headers
  const hasNumericColumns = sections.some(section => {
    if (section.type !== 'table') return false;
    
    const lines = section.content.split('\n');
    if (lines.length < 3) return false; // Need at least header, separator, data
    
    // Check if data rows are primarily numeric
    const dataLines = lines.slice(2); // Skip header and separator
    let numericCount = 0;
    
    for (const line of dataLines) {
      // Extract cell contents
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
      
      // Count numeric cells (ignoring first column which is often a label)
      const numericCells = cells.slice(1).filter(cell => {
        // Remove any trend indicators or symbols and check if numeric
        const cleanedCell = cell.replace(/[↑↓▲▼🔼🔻%]/g, '').trim();
        return /^\d+(\.\d+)?$/.test(cleanedCell);
      });
      
      if (numericCells.length >= cells.length / 2) {
        numericCount++;
      }
    }
    
    // If most data rows have numeric cells, this is numeric data
    return numericCount >= dataLines.length / 2;
  });
  
  return hasPercentageData || hasTrendIndicators || hasNumericColumns;
};

/**
 * Format structured data with appropriate visualizations
 * Uses pattern recognition to determine the best visualization
 */
const formatStructuredData = (sections, content) => {
  try {
    // Get the section with tabular data
    const tableSection = sections.find(section => section.type === 'table');
    if (!tableSection) return null;
    
    // Check if this contains percentage-based metrics that could be visualized
    if ((tableSection.content.match(/%/g) || []).length >= 3) {
      // Extract percentage items for visualization
      const items = extractPercentageItems(tableSection.content);
      
      // If we found enough items, create a visualization
      if (items.length >= 3) {
        return createPercentageVisualization(items, sections);
      }
    }
    
    // Check if this contains trend data (looking for pattern of values with up/down indicators)
    const trendIndicators = ['↑', '↓', '🔼', '🔻', '▲', '▼'];
    let indicatorCount = 0;
    
    for (const indicator of trendIndicators) {
      indicatorCount += (tableSection.content.match(new RegExp(indicator, 'g')) || []).length;
    }
    
    if (indicatorCount >= 3) {
      // This is likely trend data, format appropriately in the ParsedTable component
      // Just return null here to use the default ParsedTable with trend formatting
      return null;
    }
    
    // Default: no special visualization needed
    return null;
  } catch (error) {
    console.error("Error formatting structured data:", error);
    return null;
  }
};

/**
 * Extract percentage items from table content
 * Works with any percentage-based data regardless of specific terms
 */
const extractPercentageItems = (content) => {
  const items = [];
  const lines = content.split('\n');
  
  // Skip separator lines
  const dataLines = lines.filter(line => 
    !line.includes('---') && !line.includes('===') && line.trim() !== ''
  );
  
  // Regex to extract label and percentage value
  // Looks for pattern of text followed by a percentage, separated by pipe
  const percentagePattern = /\|\s*([^|]+?)\s*\|\s*(\d+)%\s*\|/g;
  
  // Process each line to find percentage items
  for (const line of dataLines) {
    // Look for percentage patterns in this line
    const matches = [...line.matchAll(percentagePattern)];
    
    if (matches.length > 0) {
      for (const match of matches) {
        const [_, label, valueStr] = match;
        if (label && valueStr) {
          const value = parseInt(valueStr, 10);
          items.push({
            name: label.trim(),
            value: `${value}%`,
            percentage: value
          });
        }
      }
    } else {
      // Alternative pattern: Look for label followed by percentage in same cell
      // This handles formats like "Label | 45% | ..."
      const altMatches = line.match(/\|\s*([^|]+?)\s+(\d+)%\s*\|/);
      if (altMatches) {
        const [_, label, valueStr] = altMatches;
        if (label && valueStr) {
          const value = parseInt(valueStr, 10);
          items.push({
            name: label.trim(),
            value: `${value}%`,
            percentage: value
          });
        }
      }
    }
  }
  
  // Sort items by percentage in descending order
  items.sort((a, b) => b.percentage - a.percentage);
  
  return items;
};

/**
 * Create a visualization for percentage-based data
 * Works with any structured percentage data regardless of specific terms
 */
const createPercentageVisualization = (items, sections) => {
  if (!items || items.length === 0) return null;
  
  // Find title from a header section if available
  let title = "";
  const headerSection = sections.find(section => 
    section.type === 'header' || section.type === 'tableHeader'
  );
  
  if (headerSection) {
    title = headerSection.content.replace(/^#+\s*/, '');
  }
  
  // Find base information if available (looking for "Base:" pattern)
  let baseInfo = "";
  const textSections = sections.filter(section => section.type === 'text');
  
  for (const section of textSections) {
    const match = section.content.match(/Base:.*$/m);
    if (match) {
      baseInfo = match[0].trim();
      break;
    }
  }
  
  // Generate color scale for bars
  const getBarColor = (index, total) => {
    // Blue to teal gradient based on position
    const hue = 200 - (120 * index / Math.max(total - 1, 1));
    return `hsl(${hue}, 80%, 60%)`;
  };
  
  // Now render a visualization
  return (
    <div style={{ 
      fontFamily: "Consolas, monospace",
      fontSize: "12px",
      backgroundColor: "#1e2938",
      borderRadius: "4px",
      padding: "12px",
      color: "white",
      margin: "8px 0 16px 0"
    }}>
      {/* Title */}
      {title && (
        <div style={{ 
          fontSize: "14px", 
          fontWeight: "bold", 
          marginBottom: "10px",
          color: "#61dafb"
        }}>
          {title}
        </div>
      )}
      
      {/* Data Items */}
      <div style={{ marginBottom: "10px" }}>
        {items.map((item, index) => (
          <div key={index} style={{ 
            marginBottom: "6px",
            display: "flex",
            flexDirection: "column"
          }}>
            <div style={{
              display: "flex", 
              justifyContent: "space-between",
              marginBottom: "2px"
            }}>
              <span style={{ fontWeight: "600" }}>{item.name}</span>
              <span style={{ 
                fontWeight: "bold", 
                color: "#61dafb"
              }}>{item.value}</span>
            </div>
            
            {/* Progress bar */}
            <div style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#2d3748",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${item.percentage}%`,
                height: "100%",
                backgroundColor: getBarColor(index, items.length),
                borderRadius: "4px"
              }} />
            </div>
          </div>
        ))}
      </div>
      
      {/* Base info */}
      {baseInfo && (
        <div style={{ 
          fontSize: "11px", 
          fontStyle: "italic", 
          color: "#a0aec0",
          marginTop: "8px"
        }}>
          {baseInfo}
        </div>
      )}
    </div>
  );
};

/**
 * Component to display formatted headers
 * Works with any header style from any data source
 */
const FormattedHeader = ({ content, isTableHeader }) => {
  // Extract header level
  const headerLevel = (content.match(/^#+/) || ['#'])[0].length;
  
  // Remove the hash symbols to get clean text
  const headerText = content.replace(/^#+\s*/, '');
  
  // Set font size based on header level
  const fontSize = Math.max(18 - (headerLevel * 2), 12);
  
  return (
    <div 
      style={{
        fontFamily: isTableHeader ? "Consolas, monospace" : "'Segoe UI', system-ui, sans-serif",
        fontSize: `${fontSize}px`,
        fontWeight: "bold",
        color: "#61dafb",
        margin: isTableHeader ? "16px 0 4px 0" : "20px 0 8px 0",
        paddingBottom: isTableHeader ? "4px" : "8px",
        borderBottom: isTableHeader ? "1px solid #4a5568" : "none",
      }}
    >
      {headerText}
    </div>
  );
};

/**
 * Component to display formatted text 
 * Uses pattern recognition to enhance formatting
 */
const FormattedText = ({ content }) => {
  // Format text content with enhancements
  let formattedContent = content;
  
  // Format "Base:" metadata and similar patterns
  formattedContent = formattedContent.replace(
    /(Base:.*?$)/gm,
    '<span style="color: #a0aec0; font-style: italic; font-size: 11px;">$1</span>'
  );
  
  // Format up/down arrows and indicators (using a generic approach)
  formattedContent = formattedContent.replace(
    /([↑▲🔼⬆])/g, 
    '<span style="color: #4CAF50;">$1</span>'
  );
  
  formattedContent = formattedContent.replace(
    /([↓▼🔻⬇])/g, 
    '<span style="color: #F44336;">$1</span>'
  );
  
  // Format percentage values to stand out
  formattedContent = formattedContent.replace(
    /(\d+)%/g,
    '<span style="font-weight: 600;">$1%</span>'
  );
  
  // Format metadata patterns (using more generic patterns)
  formattedContent = formattedContent.replace(
    /(Base:.*?$|T2B\s+Scores:.*?$|©.*?$|Source:.*?$)/gm,
    '<span style="color: #a0aec0; font-style: italic; font-size: 11px;">$1</span>'
  );
  
  return (
    <div 
      style={{
        fontFamily: "Consolas, monospace",
        fontSize: "12px",
        lineHeight: "1.4",
        margin: "4px 0 12px 0",
        whiteSpace: "pre-wrap",
      }}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

/**
 * Main table parser component that handles any table format
 * Detects the structure and formats accordingly
 */
const ParsedTable = ({ content }) => {
  // Parse the markdown table into rows and cells
  const lines = content.split('\n').filter(line => line.trim());
  
  // Identify header and separator rows
  let headerRow = null;
  let separatorRowIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('---') || lines[i].includes('===')) {
      separatorRowIndex = i;
      headerRow = i > 0 ? lines[i-1] : null;
      break;
    }
  }
  
  // If no separator row found but it looks like a table, try to detect structure
  if (separatorRowIndex === -1 && lines.length > 1) {
    // Check if first row might be a header by checking its structure
    const firstRow = lines[0];
    const firstParts = firstRow.split('|').filter(Boolean);
    
    // Check second row to see if it has numeric data
    const secondRow = lines[1];
    const secondParts = secondRow.split('|').filter(Boolean);
    
    // If first row and second row have similar structure, consider first as header
    if (firstParts.length > 0 && 
        secondParts.length > 0 && 
        Math.abs(firstParts.length - secondParts.length) <= 1) {
      
      // Additional check: are second row cells primarily numeric?
      const numericCellCount = secondParts.filter(part => {
        const cleaned = part.trim().replace(/[^0-9.]/g, '');
        return /^\d+(\.\d+)?$/.test(cleaned);
      }).length;
      
      // If second row has numeric cells, first row is likely header
      if (numericCellCount >= secondParts.length / 2) {
        headerRow = firstRow;
        // Create a separator row
        const parts = firstRow.split('|');
        let separator = '|';
        for (let i = 1; i < parts.length - 1; i++) {
          separator += ' ' + '-'.repeat(parts[i].trim().length) + ' |';
        }
        
        // Insert the separator row into our lines array
        lines.splice(1, 0, separator);
        separatorRowIndex = 1;
      }
    }
  }
  
  // Parse the header if we found one
  const headers = headerRow ? 
    headerRow.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0) : 
    [];
  
  // Parse the data rows (everything after the separator)
  const rows = [];
  for (let i = separatorRowIndex + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
      const cells = lines[i].split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
      rows.push(cells);
    }
  }
  
  // Calculate column count (use the maximum number of columns in any row)
  const columnCount = Math.max(
    headers.length,
    ...rows.map(row => row.length)
  );
  
  // Check if any cell has very long content
  const hasLongContent = [headers, ...rows].some(row => 
    row.some(cell => cell.length > 20)
  );
  
  // Check if this is a wide table
  const isWideTable = columnCount > 3;
  
  // Determine if each column is likely to contain numeric data
  const numericColumns = [];
  if (rows.length > 0) {
    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
      let numericCount = 0;
      
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        if (rows[rowIndex] && rows[rowIndex][colIndex]) {
          // Strip any arrows or special characters to check if it's numeric
          const cellValue = rows[rowIndex][colIndex].replace(/[↑↓▲▼🔼🔻]/g, '').trim();
          if (/^\d+\.?\d*%?$/.test(cellValue)) {
            numericCount++;
          }
        }
      }
      
      // If more than half the cells in this column are numeric, it's a numeric column
      numericColumns[colIndex] = numericCount > rows.length / 2;
    }
  }
  
  // Determine the most appropriate display mode based on content
  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'Consolas, monospace',
    fontSize: hasLongContent ? '11px' : '12px',
    margin: '8px 0 16px 0',
    overflowX: 'auto'
  };
  
  // Format cell content including arrows, percentages, and other indicators
  const formatCellContent = (content) => {
    if (!content) return '';
    
    // Format arrow indicators with colors - detect any directional symbol
    let formatted = content
      .replace(/([↑▲🔼⬆])/g, '<span style="color: #4CAF50; font-weight: bold;">$1</span>')
      .replace(/([↓▼🔻⬇])/g, '<span style="color: #F44336; font-weight: bold;">$1</span>');
    
    // Format percentages to stand out
    formatted = formatted.replace(/(\d+)%/g, '<span style="font-weight: 600;">$1%</span>');
    
    // Highlight values that appear to be scores (2-3 digit numbers)
    formatted = formatted.replace(/\b(\d{1,3})(?!\.\d)(?!\s*%)\b/g, '<span style="font-weight: 600;">$1</span>');
      
    return formatted;
  };
  
  return (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <table style={tableStyle}>
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={i} style={{
                  textAlign: numericColumns[i] ? 'right' : 'left',
                  padding: '6px 10px',
                  backgroundColor: '#2c3e50',
                  color: 'white', // Header text color is white
                  fontWeight: 'bold',
                  border: '1px solid #4a5568',
                  maxWidth: isWideTable ? 
                    (hasLongContent ? '150px' : '100px') : 
                    'none',
                  wordWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{ __html: formatCellContent(header) }}
                />
              ))}
              
              {/* Add empty cells if needed */}
              {Array.from({ length: Math.max(0, columnCount - headers.length) }).map((_, i) => (
                <th key={`empty-${i}`} style={{
                  backgroundColor: '#2c3e50',
                  border: '1px solid #4a5568',
                  padding: '6px 10px',
                }}>&nbsp;</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => {
                // Check if this cell has trend data (any direction indicator)
                const hasTrend = /[↑↓▲▼🔼🔻⬆⬇]/.test(cell);
                
                // Check if this is numeric content (possibly with % or trend indicators)
                const isNumeric = /^\s*\d+\.?\d*.*?(%)?(\s*[↑↓▲▼🔼🔻⬆⬇])?\s*$/.test(cell);
                
                // Highlight background for trend cells (subtly)
                let bgColor = rowIndex % 2 === 0 ? '#1e2938' : '#263244';
                
                // Very subtle background color for trend cells
                if (hasTrend) {
                  if (/[↑🔼▲⬆]/.test(cell)) {
                    bgColor = rowIndex % 2 === 0 ? '#1e3a28' : '#1e3a28';
                  } else {
                    bgColor = rowIndex % 2 === 0 ? '#3a1e28' : '#3a1e28';
                  }
                }
                
                return (
                  <td key={cellIndex} style={{
                    padding: '5px 8px',
                    border: '1px solid #4a5568', 
                    backgroundColor: bgColor,
                    color: 'white', // Changed to white for better readability
                    maxWidth: isWideTable ? 
                      (hasLongContent ? '150px' : '100px') : 
                      'none',
                    wordWrap: 'break-word',
                    whiteSpace: hasLongContent ? 'normal' : 'nowrap',
                    textAlign: numericColumns[cellIndex] || isNumeric ? 'right' : 'left',
                    fontWeight: hasTrend ? 'bold' : 'normal'
                  }}
                  dangerouslySetInnerHTML={{ __html: formatCellContent(cell) }}
                  />
                );
              })}
              
              {/* Add empty cells if needed */}
              {Array.from({ length: Math.max(0, columnCount - row.length) }).map((_, i) => (
                <td key={`empty-${i}`} style={{
                  padding: '5px 8px',
                  border: '1px solid #4a5568',
                  backgroundColor: rowIndex % 2 === 0 ? '#1e2938' : '#263244'
                }}>&nbsp;</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Dynamic tooltip width calculator based on content complexity
 * Works with any content structure
 */
const calculateTooltipWidth = (content) => {
  if (!content) return "350px";
  
  // Parse content to determine complexity
  const lines = content.split('\n');
  
  // Check for table presence (using generic patterns)
  const hasTable = content.includes('|') && 
    (content.includes('|-') || content.includes('| -') || content.includes('----') ||
     lines.some(line => line.trim().startsWith('|') && line.trim().endsWith('|')));
    
  if (!hasTable) {
    return "350px"; // Standard width for non-table content
  }
  
  // Count maximum columns in any table row
  let maxColumns = 0;
  for (const line of lines) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const columnCount = (line.match(/\|/g) || []).length - 1;
      maxColumns = Math.max(maxColumns, columnCount);
    }
  }
  
  // Check for long content in cells
  const hasLongContent = lines.some(line => {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
      return cells.some(cell => cell.length > 20);
    }
    return false;
  });
  
  // Check for multi-table content or sections with headers
  const hasMultipleTables = content.includes('#') && hasTable;
  
  // Calculate width based on complexity
  if (hasMultipleTables) {
    return "600px"; // Wider tooltip for complex content with headers and tables
  } else if (maxColumns >= 6) {
    return hasLongContent ? "550px" : "500px"; // Very wide tables
  } else if (maxColumns >= 4) {
    return hasLongContent ? "500px" : "450px"; // Medium width tables
  } else if (maxColumns >= 3) {
    return hasLongContent ? "450px" : "400px"; // Standard tables
  } else if (hasLongContent) {
    return "400px"; // Tables with long content
  }
  
  return "350px"; // Default width
};

  return (
    <span style={{ position: "relative", display: "inline" }}>
       <span
  ref={triggerRef}
  onClick={() => setIsOpen(!isOpen)}
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
   className="inline-flex items-center justify-center w-4 h-4 text-xs font-medium cursor-pointer transition-all duration-200 ease-in-out hover:scale-110 hover:shadow-md bg-[#9CA3AF] dark:bg-blue-800 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-full mx-0.5"
  style={{
    cursor: "pointer",
   
    fontSize: "10px",
    fontWeight: "600",
    color: "white",
    borderRadius: "50%",
    marginLeft: "2px",
    marginRight: "1px",
    verticalAlign: "middle",
    lineHeight: "1",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
    transition: "all 0.2s ease",
    transform: "scale(1)",
  }}
  onMouseOver={(e) => {
    e.target.style.transform = "scale(1.1)";
    e.target.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.3)";
  }}
  onMouseOut={(e) => {
    e.target.style.transform = "scale(1)";
    e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.2)";
  }}
>
  {index + 1}
</span>
      {renderTooltip()}
    </span>
  );
};

// Citation Manager that properly handles existing citation markers
const ImprovedCitationManager = ({ content, citations, textSizeClass }) => {
  // Ref to hold the container element
  const containerRef = useRef(null);

  // Configure DOMPurify to match MainContent configuration and allow data attributes
  useEffect(() => {
    // Configure DOMPurify to allow standard HTML tags but sanitize potentially dangerous content
    // CRITICAL FIX: Allow data attributes and include 'data-citation-id' in allowed attributes
    DOMPurify.setConfig({
      ALLOWED_TAGS: [
        'p', 'b', 'strong', 'i', 'em', 'u', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span',
        'code', 'pre', 'blockquote', 'br', 'hr', 'div'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'data-citation-id'],
      ALLOW_DATA_ATTR: true  // This is crucial to allow data-citation-id
    });
  }, []);

  // Modified two-phase approach to handle HTML processing
  useEffect(() => {
    if (!containerRef.current) return;

    // Initial setup - just add basic content
    if (!content) {
      containerRef.current.innerHTML = '';
      return;
    }

    // STEP 1: Process content first (without DOMPurify)
    const processedContent = processCitationsInContent(content, citations);
    
    // STEP 2: Insert the processed content directly (without DOMPurify)
    containerRef.current.innerHTML = processedContent;
    
    // STEP 3: Now replace placeholders with actual React components
    if (citations && citations.length > 0) {
      replaceExistingCitationMarkers(containerRef.current, citations);
    }

    // Cleanup function
    return () => {
      const citationContainers = containerRef.current?.querySelectorAll(".citation-container") || [];
      citationContainers.forEach((container) => {
        try {
          ReactDOM.unmountComponentAtNode(container);
        } catch (error) {
          console.error("Error unmounting citation:", error);
        }
      });
    };
  }, [content, citations]);

  // Process the content to find and prepare existing citation markers
  const processCitationsInContent = (text, citations) => {
    if (!text) return "";

    // First determine if content has HTML tags
    const hasHtmlTags = /<\w+[^>]*>/.test(text);

    // Process content appropriately based on content type
    let processedText = hasHtmlTags 
      ? cleanAndFormatHTML(text)  // Clean and format HTML
      : marked.parse(text);   

    // Apply formatting
    processedText = formatTextContent(processedText);

    // Only process citations if they exist
    if (citations && citations.length > 0) {
      // Look for citation patterns like [1], [2], etc.
      const citationRegex = /\[(\d+)\]/g;

      // Replace citation markers with placeholder spans that we'll mount React components into
      processedText = processedText.replace(
        citationRegex,
        (match, citationNum) => {
          const index = parseInt(citationNum, 10) - 1;
          if (index >= 0 && index < citations.length) {
            return `<span class="citation-placeholder" data-citation-id="${index}"></span>`;
          }
          return match; // Keep original if citation not found
        }
      );
    }

    return processedText;
  };

  // Replace citation placeholder spans with React components
  const replaceExistingCitationMarkers = (container, citations) => {
    // Find all citation placeholders
    const placeholders = container.querySelectorAll(".citation-placeholder");
    
    if (placeholders.length === 0) {
      console.warn("No citation placeholders found after processing");
    }

    placeholders.forEach((placeholder) => {
      const citationId = parseInt(
        placeholder.getAttribute("data-citation-id"),
        10
      );

      if (citationId >= 0 && citationId < citations.length) {
        // Create a container for the citation React component
        const citationContainer = document.createElement("span");
        citationContainer.className = "citation-container";
        citationContainer.style.display = "inline";

        // Replace the placeholder with the container
        placeholder.parentNode.replaceChild(citationContainer, placeholder);

        // Render the Citation component into the container
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
  };

  const cleanAndFormatHTML = (content) => {
    // If content doesn't have HTML tags, return it as is
    if (!/<\w+[^>]*>/.test(content)) {
      return content;
    }

    // Handle incomplete or malformed lists
    let cleanedContent = content;

    // Check if there are any <li> tags without an enclosing <ul> or <ol>
    if (
      (cleanedContent.includes("<li>") || cleanedContent.includes("</li>")) &&
      !cleanedContent.includes("<ul>") &&
      !cleanedContent.includes("<ol>")
    ) {
      // Wrap all the content in a <ul> if it contains list items but no list container
      cleanedContent = "<ul>" + cleanedContent + "</ul>";
    }

    // Make sure all list items are properly closed
    cleanedContent = cleanedContent.replace(
      /<li>(.*?)(?!<\/li>)(<li>|$)/g,
      "<li>$1</li>$2"
    );

    // Make sure all paragraphs are properly closed
    cleanedContent = cleanedContent.replace(
      /<p>(.*?)(?!<\/p>)(<p>|$)/g,
      "<p>$1</p>$2"
    );

    // Make sure all bold tags are properly closed
    cleanedContent = cleanedContent.replace(
      /<b>(.*?)(?!<\/b>)(<b>|$)/g,
      "<b>$1</b>$2"
    );

    return cleanedContent;
  };

  // Format HTML content with styling
  const formatTextContent = (text) => {
    if (!text) return "";

    return text
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .replace(/"""html/g, "")
      .replace(/"""/g, "")
      // Add proper spacing and styling
      .replace(/<p>/g, '<p class="mb-4">')
      .replace(/<b>/g, '<b class="font-bold">')
      .replace(/<strong>/g, '<strong class="font-bold">')
      .replace(/<h3>/g, '<h3 class="text-lg font-semibold mt-4 mb-2">')
      .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-4">')
      .replace(/<ol>/g, '<ol class="list-decimal pl-6 mb-4">')
      .replace(/<li>/g, '<li class="mb-2">')
      // Add proper styling for tables
      .replace(
        /<table>/g,
        '<table class="w-full border-collapse border border-gray-500 mt-4 mb-4">'
      )
      .replace(
        /<th>/g,
        '<th class="border border-gray-500 bg-gray-700 text-white p-2">'
      )
      .replace(/<td>/g, '<td class="border border-gray-500 p-2">')
      // Ensure proper spacing for tables
      .replace(/<\/table>\s*<p>/g, '</table><p class="mt-4">')
      // Convert markdown symbols to HTML only if not already in HTML
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Link formatting
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
      )
      // Code formatting
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">$1</code>'
      )
      // Remove excess newlines
      .replace(/\n{3,}/g, "\n\n")
      // Ensure one line break after headers
      .replace(/<\/b>\s*\n+/g, "</b>\n")
      .replace(/<\/strong>\s*\n+/g, "</strong>\n");
  };

  return (
    <div
      ref={containerRef}
      className={`citation-content ${textSizeClass || ""}`}
      style={{ lineHeight: "1.6" }}
    />
  );
};

export { SimpleCitation, ImprovedCitationManager };