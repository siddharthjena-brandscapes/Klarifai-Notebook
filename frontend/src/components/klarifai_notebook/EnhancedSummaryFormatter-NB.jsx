import React from 'react';
import { FileText, Bot } from 'lucide-react';

// Loading animation component for summary generation
const SummaryGenerationLoader = () => (
  <div className="fixed inset-0 bg-[#faf4ee]/80 dark:bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
    <div className="bg-white/80 dark:bg-gray-900/90 p-8 rounded-2xl border border-[#e8ddcc] dark:border-blue-500/20 shadow-2xl max-w-lg w-full mx-4">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <Bot className="w-16 h-16 text-[#a55233] dark:text-blue-400 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-[#0a3b25] dark:text-white">Generating Summary</h3>
          <p className="text-[#5a544a] dark:text-gray-400 text-sm">Our AI is analyzing your documents to create a comprehensive summary...</p>
        </div>

        <div className="w-full space-y-2">
          <div className="w-full h-2 bg-[#e8ddcc] dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#a55233] to-[#556052] dark:from-blue-600 dark:to-green-500 w-full animate-shimmer" />
          </div>
          <div className="flex justify-between text-xs text-[#5a544a] dark:text-gray-500">
            <span>Analyzing content</span>
            <span>Generating insights</span>
          </div>
        </div>

        <div className="text-sm text-[#5a544a] dark:text-gray-500 italic">This may take a few moments...</div>
      </div>
    </div>
  </div>
);

// Key Topics component
const KeyTopics = ({ keyPoints, onTopicClick }) => {
  console.log("🔍 KeyTopics received keyPoints:", keyPoints);
  
  if (!keyPoints || keyPoints.length === 0) {
    console.log("🔍 KeyTopics: No key points to display");
    return null;
  }

  console.log("🔍 KeyTopics: Rendering", keyPoints.length, "key points");

  return (
    <div className="mt-8 p-6 bg-[#f8f6f0] dark:bg-gray-800/50 rounded-xl border border-[#e8ddcc] dark:border-blue-500/20">
      <h3 className="text-lg font-bold text-[#0a3b25] dark:text-white mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-[#a55233] dark:text-blue-400" />
        Key Topics ({keyPoints.length})
      </h3>
      <div className="flex flex-wrap gap-3">
        {keyPoints.map((keyPoint, index) => (
          <button
            key={index}
            onClick={() => onTopicClick && onTopicClick(keyPoint)}
            className="
              px-4 py-2 
              bg-[#556052] dark:bg-gray-700/70
              hover:bg-[#4a5348] dark:hover:bg-gray-600/80
              text-white dark:text-gray-200
              rounded-lg 
              text-sm 
              font-medium 
              transition-all 
              duration-200 
              hover:shadow-md 
              hover:-translate-y-0.5
              border border-[#4a5348] dark:border-gray-600/50
              cursor-pointer
              focus:outline-none 
              focus:ring-2 
              focus:ring-[#a55233] dark:focus:ring-blue-400 
              focus:ring-opacity-50
            "
            title={`Click to explore: ${keyPoint}`}
          >
            {keyPoint.length > 30 ? `${keyPoint.substring(0, 30)}...` : keyPoint}
          </button>
        ))}
      </div>
    </div>
  );
};

// Enhanced summary formatter component
const SummaryFormatter = ({ content, keyPoints, onTopicClick }) => {
  console.log("🔍 SummaryFormatter received keyPoints:", keyPoints);
  
  // Function to convert markdown-style formatting to HTML
  const formatMarkdownToHtml = (text) => {
    if (!text) return '';
    
    // Remove ALL asterisks completely - first pass
    text = text.replace(/\*/g, '');
    
    // Now apply proper formatting for headers and emphasis
    // Convert patterns like "Sales Experience:" to bold headers
    text = text.replace(/^([A-Za-z\s]+):\s*/gm, '<strong>$1:</strong> ');
    
    // Convert ### to h3
    text = text.replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold text-[#0a3b25] dark:text-white mb-4 mt-6">$1</h3>');
    
    // Convert ## to h2
    text = text.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold text-[#0a3b25] dark:text-white mb-4 mt-8">$1</h2>');
    
    // Convert # to h1
    text = text.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold text-[#0a3b25] dark:text-white mb-6 mt-8">$1</h1>');
    
    return text;
  };

  // Function to process and format the summary content
  const formatSummary = (rawContent) => {
    if (!rawContent) return null;

    // First convert markdown syntax to HTML and remove ALL asterisks
    let processedContent = formatMarkdownToHtml(rawContent);
    
    // Split content into sections, preserving line breaks for proper formatting
    const sections = processedContent.split(/\n\s*\n/).filter(section => section.trim());
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      
      // Skip empty sections
      if (!trimmedSection) return null;
      
      // Handle headers (already converted from markdown)
      if (trimmedSection.match(/<h[1-6]/)) {
        return (
          <div key={index} className="mb-4">
            <div dangerouslySetInnerHTML={{ __html: trimmedSection }} />
          </div>
        );
      }
      
      // Handle sections that contain line breaks (multiple related points)
      if (trimmedSection.includes('\n')) {
        const lines = trimmedSection.split('\n').filter(line => line.trim());
        
        return (
          <div key={index} className="mb-6 space-y-3">
            {lines.map((line, lineIndex) => {
              const cleanLine = line.trim();
              if (!cleanLine) return null;
              
              return (
                <p 
                  key={lineIndex}
                  className="text-[#5a544a] dark:text-gray-300 leading-relaxed text-base"
                  dangerouslySetInnerHTML={{ __html: cleanLine }}
                />
              );
            })}
          </div>
        );
      }
      
      // Handle regular single paragraphs
      return (
        <div key={index} className="mb-6">
          <p 
            className="text-[#5a544a] dark:text-gray-300 leading-relaxed text-base"
            dangerouslySetInnerHTML={{ __html: trimmedSection }}
          />
        </div>
      );
    });
  };

  // Render the component
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <style dangerouslySetInnerHTML={{ __html: summaryStyles }} />
      
      {/* Key Topics at the top */}
      <KeyTopics keyPoints={keyPoints} onTopicClick={onTopicClick} />
      
      {/* Summary content with proper formatting */}
      <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-[#e8ddcc] dark:border-blue-500/20 p-6 shadow-sm">
        <div className="prose prose-lg max-w-none">
          {formatSummary(content)}
        </div>
      </div>
    </div>
  );
};

// Style tag for animations and custom styling
const summaryStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite linear;
    background: linear-gradient(
      90deg,
      rgba(165, 82, 51, 0.3) 25%,
      rgba(85, 96, 82, 0.3) 50%,
      rgba(165, 82, 51, 0.3) 75%
    );
    background-size: 200% 100%;
  }
  @media (prefers-color-scheme: dark) {
    .animate-shimmer {
      background: linear-gradient(
        90deg,
        rgba(59, 130, 246, 0.3) 25%,
        rgba(16, 185, 129, 0.3) 50%,
        rgba(59, 130, 246, 0.3) 75%
      );
      background-size: 200% 100%;
    }
  }
  
  /* Custom styling for formatted content */
  .prose strong {
    color: #0a3b25;
    font-weight: 600;
  }
  
  @media (prefers-color-scheme: dark) {
    .prose strong {
      color: #ffffff;
    }
  }
  
  .prose em {
    color: #a55233;
    font-style: italic;
  }
  
  @media (prefers-color-scheme: dark) {
    .prose em {
      color: #60a5fa;
    }
  }
`;

export { SummaryGenerationLoader, SummaryFormatter, summaryStyles };