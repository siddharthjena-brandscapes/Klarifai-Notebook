/* eslint-disable no-unused-vars */
import React from 'react';

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

export default SummaryFormatter;