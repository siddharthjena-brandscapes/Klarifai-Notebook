// utils/chatContentProcessor.js
import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure DOMPurify once
DOMPurify.setConfig({
  ALLOWED_TAGS: [
    'p', 'b', 'strong', 'i', 'em', 'u', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 
    'code', 'pre', 'blockquote', 'br', 'hr', 'span', 'div'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  ALLOW_DATA_ATTR: false
});

export function processChatContent(content) {
  return DOMPurify.sanitize(
    // If the content has HTML list, paragraph, or formatting tags, process it as HTML
    content.includes('<li>') || content.includes('<p>') || content.includes('<b>') 
      ? cleanAndFormatHTML(content)  // Clean and format the HTML
      : marked.parse(content)        // Otherwise parse as markdown
  )
  // Apply all the same transformations as in the frontend
  .replace(/```html/g, "")
  .replace(/```/g, "")
  .replace(/"""html/g, "")
  .replace(/"""/g, "")
  .replace(/<p>/g, '<p class="mb-4">')
  .replace(/<b>/g, '<b class="font-bold">')
  .replace(/<strong>/g, '<strong class="font-bold">')
  .replace(/<h3>/g, '<h3 class="text-lg font-semibold mt-4 mb-2">')
  .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-4">')
  .replace(/<ol>/g, '<ol class="list-decimal pl-6 mb-4">')
  .replace(/<li>/g, '<li class="mb-2">')
  .replace(/<table>/g, '<table class="w-full border-collapse border border-gray-500 mt-4 mb-4">')
  .replace(/<th>/g, '<th class="border border-gray-500 bg-gray-700 text-white p-2">')
  .replace(/<td>/g, '<td class="border border-gray-500 p-2">')
  .replace(/<\/table>\s*<p>/g, '</table><p class="mt-4">')
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>')
  .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">$1</code>')
  .replace(/\n{3,}/g, "\n\n")
  .replace(/<\/b>\s*\n+/g, "</b>\n")
  .replace(/<\/strong>\s*\n+/g, "</strong>\n");
}

function cleanAndFormatHTML(html) {
  // Your existing HTML cleaning logic here
  return html;
}