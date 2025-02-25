import React from 'react';
import { FileText, Copy, Bot, Loader2 } from 'lucide-react';

// Loading animation component for summary generation
const SummaryGenerationLoader = () => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
    <div className="bg-gray-900/90 p-8 rounded-2xl border border-blue-500/20 shadow-2xl max-w-lg w-full mx-4">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <Bot className="w-16 h-16 text-blue-400 animate-pulse" />
          <div className="absolute -right-2 -bottom-2">
            {/* <Loader2 className="w-6 h-6 text-green-400 animate-spin" /> */}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Generating Summary</h3>
          <p className="text-gray-400 text-sm">Our AI is analyzing your documents to create a comprehensive summary...</p>
        </div>

        <div className="w-full space-y-2">
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-green-500 w-full animate-shimmer" />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Analyzing content</span>
            <span>Generating insights</span>
          </div>
        </div>

        <div className="text-sm text-gray-500 italic">This may take a few moments...</div>
      </div>
    </div>
  </div>
);

// Enhanced summary formatter component
const SummaryFormatter = ({ content }) => {
    // Function to process and format the summary content
    const formatSummary = (rawContent) => {
      if (!rawContent) return null;
  
      // Split content into sections based on headers
      const sections = rawContent.split(/(<h[34][^>]*>.*?<\/h[34]>)/);
  
      return sections.map((section, index) => {
        // Handle headers
        if (section.match(/<h[34]/)) {
          return (
            <div key={index} className="mb-6">
              <div
                dangerouslySetInnerHTML={{ __html: section }}
                className="text-lg font-bold text-white mb-4 bg-gradient-to-r from-blue-500/20 to-transparent p-2 rounded-lg"
              />
            </div>
          );
        }
  
        // Process regular content
        if (section.trim()) {
          // Convert traditional bullet points to custom styled ones
          const formattedContent = section
            .replace(
              /<li>(.+?)<\/li>/g,
              '<div class="flex items-start space-x-3 mb-3"><div class="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div><div class="flex-1">$1</div></div>'
            )
            .replace(/<ul>/g, '<div class="space-y-2">')
            .replace(/<\/ul>/g, '</div>');
  
          return (
            <div
              key={index}
              className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-4 mb-6"
            >
              <div className="bg-gray-800/30 rounded-lg p-4 shadow-inner">
                <div
                  dangerouslySetInnerHTML={{ __html: formattedContent }}
                  className="space-y-3"
                />
              </div>
            </div>
          );
        }
        return null;
      });
    };
  
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="bg-gray-900/20 p-6 shadow-lg border border-blue-500/10">
          {formatSummary(content)}
        </div>
      </div>
    );
  };

// Style tag for animations
const summaryStyles  = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite linear;
    background: linear-gradient(
      90deg,
      rgba(59, 130, 246, 0.3) 25%,
      rgba(16, 185, 129, 0.3) 50%,
      rgba(59, 130, 246, 0.3) 75%
    );
    background-size: 200% 100%;
  }
`;

export { SummaryGenerationLoader, SummaryFormatter, summaryStyles  };