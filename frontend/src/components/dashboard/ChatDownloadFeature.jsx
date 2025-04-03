import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Calendar,
  Download,
  X,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { chatService } from "../../utils/axiosConfig";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";

// Constants for styling consistency
const COLORS = {
  USER_MESSAGE: "#f0f9ff",
  AI_MESSAGE: "#f0fdfa",
  USER_HEADER: "#2563eb",
  AI_HEADER: "#0d9488",
};

/**
 * ChatDownloadFeature component provides functionality to export chat conversations as PDFs
 */
const ChatDownloadFeature = ({
  currentChatData,
  mainProjectId,
  chatHistory,
  activeConversationId,
}) => {
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState({
    includeTimestamps: true,
    includeChatMetadata: true,
    includeFollowUpQuestions: true,
    headerColor: COLORS.USER_HEADER,
    formatCode: true,
  });

  // Reset date range when the menu is closed
  useEffect(() => {
    if (!isDownloadMenuOpen) {
      setStartDate(null);
      setEndDate(null);
    }
  }, [isDownloadMenuOpen]);

  // Format date for PDF header
  const formatDate = (date) => {
    return date
      ? date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";
  };

  /**
   * Handles option toggling in PDF export settings
   */
  const handleOptionChange = (optionKey) => {
    setOptions((prev) => ({
      ...prev,
      [optionKey]: !prev[optionKey],
    }));
  };

  /**
   * Escapes HTML entities in text
   */
  const escapeHtml = (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  /**
   * Sanitize and clean HTML content
   */
  const sanitizeHtml = (html) => {
    // Use DOMPurify to sanitize HTML
    return DOMPurify.sanitize(html);
  };

  /**
   * Enhanced markdown to HTML converter that handles more complex formatting
   */
  const markdownToHtml = (content) => {
    // Skip if there's no content
    if (!content) return "";

    // First, escape any existing HTML to prevent rendering issues
    content = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Then convert markdown to HTML - we'll unescape our HTML later

    // Handle headers (# Header)
    content = content.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
      const level = hashes.length;
      return `<h${level}>${text}</h${level}>`;
    });

    // Handle bold (**text** or __text__)
    content = content.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>");

    // Handle italics (*text* or _text_)
    content = content.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");

    // Handle strikethrough (~~text~~)
    content = content.replace(/~~(.*?)~~/g, "<del>$1</del>");

    // Handle code blocks with language specification
    content = content.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, language, code) => {
        return `<pre${
          language ? ` data-language="${language}"` : ""
        }><code>${code.replace(/\n/g, "<br>")}</code></pre>`;
      }
    );

    // Handle inline code
    content = content.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Handle unordered lists
    // First, identify list blocks
    content = content.replace(
      /(^|\n)((?:[ \t]*[-*+][ \t]+.+\n?)+)/g,
      (match, leadingNewline, listBlock) => {
        // Process each list item
        const processedItems = listBlock.replace(
          /^[ \t]*[-*+][ \t]+(.+)(\n|$)/gm,
          "<li>$1</li>"
        );
        return `${leadingNewline}<ul>\n${processedItems}</ul>\n`;
      }
    );

    // Handle ordered lists
    // First, identify list blocks
    content = content.replace(
      /(^|\n)((?:[ \t]*\d+\.[ \t]+.+\n?)+)/g,
      (match, leadingNewline, listBlock) => {
        // Process each list item
        const processedItems = listBlock.replace(
          /^[ \t]*\d+\.[ \t]+(.+)(\n|$)/gm,
          "<li>$1</li>"
        );
        return `${leadingNewline}<ol>\n${processedItems}</ol>\n`;
      }
    );

    // Handle blockquotes
    content = content.replace(
      /(^|\n)>[ \t]*([^\n]+)/g,
      (match, newline, text) => {
        return `${newline}<blockquote>${text}</blockquote>`;
      }
    );

    // Handle horizontal rules
    content = content.replace(/^([-*_])\1\1+$/gm, "<hr>");

    // Handle links
    content = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2">$1</a>'
    );

    // Handle images
    content = content.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1">'
    );

    // Handle tables
    // This is a simplified version - tables can get complex
    const tableRegex = /\|(.+)\|\n\|[-:]+\|[-:]+\|\n((?:\|.+\|\n)+)/g;
    content = content.replace(tableRegex, (match, headerRow, rows) => {
      // Process header
      const headers = headerRow
        .split("|")
        .map((header) => header.trim())
        .filter(Boolean);
      const headerHtml = headers.map((header) => `<th>${header}</th>`).join("");

      // Process rows
      const rowsHtml = rows
        .trim()
        .split("\n")
        .map((row) => {
          const cells = row
            .split("|")
            .map((cell) => cell.trim())
            .filter(Boolean);
          return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
        })
        .join("");

      return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
    });

    // Convert new lines to <br> tags, but not inside code blocks
    content = content.replace(/([^>])\n(?!<)/g, "$1<br>");

    // Unescape our HTML content
    content = content.replace(/&lt;(\/?)h([1-6])&gt;/g, "<$1h$2>");
    content = content.replace(/&lt;(\/?)strong&gt;/g, "<$1strong>");
    content = content.replace(/&lt;(\/?)em&gt;/g, "<$1em>");
    content = content.replace(/&lt;(\/?)code&gt;/g, "<$1code>");
    content = content.replace(/&lt;(\/?)pre&gt;/g, "<$1pre>");
    content = content.replace(/&lt;(\/?)ul&gt;/g, "<$1ul>");
    content = content.replace(/&lt;(\/?)ol&gt;/g, "<$1ol>");
    content = content.replace(/&lt;(\/?)li&gt;/g, "<$1li>");
    content = content.replace(/&lt;(\/?)blockquote&gt;/g, "<$1blockquote>");
    content = content.replace(/&lt;(\/?)del&gt;/g, "<$1del>");
    content = content.replace(/&lt;hr&gt;/g, "<hr>");
    content = content.replace(/&lt;br&gt;/g, "<br>");

    return content;
  };

  /**
   * Format code blocks for PDF rendering with improved handling
   */
  const formatCodeBlocks = (content) => {
    if (!options.formatCode) return content;

    // Replace markdown code blocks with formatted HTML
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    return content.replace(codeBlockRegex, (match, language, code) => {
      // Escape code content to safely represent it in HTML
      const escapedCode = escapeHtml(code);
      return `<div class="code-block" style="background-color: #1e293b; color: #e2e8f0; padding: 8px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; margin: 8px 0;">
        ${
          language
            ? `<div style="color: #94a3b8; margin-bottom: 4px;">${language}</div>`
            : ""
        }
        ${escapedCode}
      </div>`;
    });
  };

  /**
   * Format tables for PDF rendering with improved handling
   */
  const formatTables = (content) => {
    // Improved regex for Markdown tables that handles various spacing
    const tableRegex = /(\|.*\|)\s*\n\s*(\|[-:|\s]+\|)\s*\n((?:\|.*\|\s*\n)+)/g;

    return content.replace(
      tableRegex,
      (match, headerRow, separatorRow, bodyRows) => {
        try {
          // Process header row with better spacing handling
          const headers = headerRow
            .split("|")
            .map((cell) => cell.trim())
            .filter(Boolean);

          // Process table rows with better line break handling
          const rows = bodyRows
            .trim()
            .split(/\n+/)
            .map((row) => {
              return row
                .split("|")
                .map((cell) => cell.trim())
                .filter(Boolean);
            });

          // Build HTML table with explicit styling
          let htmlTable = `<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
          <thead>
            <tr>
              ${headers
                .map(
                  (header) =>
                    `<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; background-color: #f1f5f9;">${header}</th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) =>
                  `<tr>${row
                    .map((cell, idx) => {
                      // Ensure we don't exceed the header count
                      if (idx < headers.length) {
                        return `<td style="border: 1px solid #cbd5e1; padding: 8px;">${cell}</td>`;
                      }
                      return "";
                    })
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>`;

          return htmlTable;
        } catch (error) {
          console.error("Error processing table:", error);
          return match; // Return original if there's an error
        }
      }
    );
  };

  /**
   * Format bullet points for PDF rendering with improved handling
   */
  const formatBulletPoints = (content) => {
    // Convert markdown bullet points to HTML lists
    let formattedContent = content;

    // Handle unordered lists (-, *, +)
    const unorderedListRegex = /(^|\n)[ \t]*[-*+][ \t]+(.*?)(?=\n|$)/g;
    let hasUnorderedList = unorderedListRegex.test(formattedContent);

    if (hasUnorderedList) {
      // Reset regex
      unorderedListRegex.lastIndex = 0;

      // Wrap in <ul> tags and convert to <li>
      formattedContent =
        '<ul style="margin-left: 20px; list-style-type: disc;">' +
        formattedContent.replace(unorderedListRegex, (match, p1, p2) => {
          return `<li style="margin: 4px 0;">${p2}</li>`;
        }) +
        "</ul>";
    }

    // Handle ordered lists (1., 2., etc)
    const orderedListRegex = /(^|\n)[ \t]*(\d+)\.[ \t]+(.*?)(?=\n|$)/g;
    let hasOrderedList = orderedListRegex.test(formattedContent);

    if (hasOrderedList) {
      // Reset regex
      orderedListRegex.lastIndex = 0;

      // Wrap in <ol> tags and convert to <li>
      formattedContent =
        '<ol style="margin-left: 20px;">' +
        formattedContent.replace(orderedListRegex, (match, p1, p2, p3) => {
          return `<li style="margin: 4px 0;">${p3}</li>`;
        }) +
        "</ol>";
    }

    return formattedContent;
  };

  /**
   * Process all formatting in one pass with enhanced HTML support
   */
  const processMessageContent = (content) => {
    if (!content) return "";

    let processedContent = content;

    // Check if content already contains HTML table tags
    const hasHTMLTables = /<table|<tr|<td|<th/i.test(processedContent);

    if (!hasHTMLTables) {
      // First convert markdown to HTML for tables specifically
      processedContent = formatTables(processedContent);

      // Then convert the rest of markdown to HTML
      processedContent = markdownToHtml(processedContent);

      // Apply other formatting
      processedContent = formatCodeBlocks(processedContent);
      processedContent = formatBulletPoints(processedContent);
    }

    // Process existing HTML tags
    processedContent = processHtmlTags(processedContent);

    // Sanitize HTML
    processedContent = sanitizeHtml(processedContent);

    return processedContent;
  };

  /**
   * Process and enhance HTML tags in content
   */
  const processHtmlTags = (content) => {
    // First ensure all table tags are properly closed
    if (content.includes("<table")) {
      // Make sure tables have both opening and closing tags
      content = content.replace(
        /<table(?!\s+.*\/>)([^>]*)>/g,
        (match, attributes) => {
          return `<table${attributes}>${
            content.includes("</table>") ? "" : "</table>"
          }`;
        }
      );

      // Ensure table has tbody
      content = content.replace(
        /<table([^>]*)>([\s\S]*?)<\/table>/g,
        (match, attributes, tableContent) => {
          if (!tableContent.includes("<tbody")) {
            // Split at thead if it exists
            if (
              tableContent.includes("<thead") &&
              tableContent.includes("</thead>")
            ) {
              const [headPart, bodyPart] = tableContent.split("</thead>");
              return `<table${attributes}>${headPart}</thead><tbody>${bodyPart}</tbody></table>`;
            }
            // Otherwise wrap everything except thead in tbody
            if (tableContent.includes("<thead")) {
              const headEndIndex = tableContent.indexOf("</thead>") + 8;
              return `<table${attributes}>${tableContent.substring(
                0,
                headEndIndex
              )}<tbody>${tableContent.substring(headEndIndex)}</tbody></table>`;
            }
            // If no thead, wrap everything in tbody
            return `<table${attributes}><tbody>${tableContent}</tbody></table>`;
          }
          return match;
        }
      );
    }

    // Apply consistent styling to table elements
    content = content.replace(
      /<table\b([^>]*)>/g,
      '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;" $1>'
    );
    content = content.replace(
      /<tr\b([^>]*)>/g,
      '<tr style="border: 1px solid #cbd5e1;" $1>'
    );
    content = content.replace(
      /<th\b([^>]*)>/g,
      '<th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; background-color: #f1f5f9;" $1>'
    );
    content = content.replace(
      /<td\b([^>]*)>/g,
      '<td style="border: 1px solid #cbd5e1; padding: 8px;" $1>'
    );

    // Process nested tags within table cells (like <b> within <td>)
    content = content.replace(
      /<td[^>]*>([\s\S]*?)<\/td>/g,
      (match, cellContent) => {
        let processed = cellContent;

        // Process bold tags within cells
        if (processed.includes("<b>")) {
          processed = processed.replace(
            /<b>(.*?)<\/b>/g,
            '<strong style="font-weight:bold;">$1</strong>'
          );
        }

        // Process italic tags within cells
        if (processed.includes("<i>")) {
          processed = processed.replace(
            /<i>(.*?)<\/i>/g,
            '<em style="font-style:italic;">$1</em>'
          );
        }

        return `<td style="border:1px solid #cbd5e1;padding:8px;">${processed}</td>`;
      }
    );

    // Process other HTML tags
    if (content.includes("<b>") || content.includes("<strong>")) {
      content = content.replace(
        /<b>(.*?)<\/b>/g,
        '<strong style="font-weight:bold;">$1</strong>'
      );
      content = content.replace(
        /<strong>(.*?)<\/strong>/g,
        '<strong style="font-weight:bold;">$1</strong>'
      );
    }

    if (content.includes("<i>") || content.includes("<em>")) {
      content = content.replace(
        /<i>(.*?)<\/i>/g,
        '<em style="font-style:italic;">$1</em>'
      );
      content = content.replace(
        /<em>(.*?)<\/em>/g,
        '<em style="font-style:italic;">$1</em>'
      );
    }

    // Process <ul> and <ol> to ensure they have proper structure
    if (content.includes("<ul>") || content.includes("<ol>")) {
      // First, make sure all list items have closing tags
      content = content.replace(/<li>(.*?)(<li>|<\/[uo]l>)/g, "<li>$1</li>$2");

      // Then, ensure all lists have proper structure
      content = content.replace(/<ul>(.*?)<\/ul>/g, (match, p1) => {
        return `<ul style="margin-left:20px;list-style-type:disc;">${p1.replace(
          /<li>(.*?)(?=<li>|$)/g,
          '<li style="margin:4px 0;">$1</li>'
        )}</ul>`;
      });

      content = content.replace(/<ol>(.*?)<\/ol>/g, (match, p1) => {
        return `<ol style="margin-left:20px;">${p1.replace(
          /<li>(.*?)(?=<li>|$)/g,
          '<li style="margin:4px 0;">$1</li>'
        )}</ol>`;
      });
    }

    // Handle headers (h1-h6)
    for (let i = 1; i <= 6; i++) {
      const headerRegex = new RegExp(`<h${i}[^>]*>(.*?)<\\/h${i}>`, "g");
      if (content.match(headerRegex)) {
        // Ensure headers have proper structure and styling
        content = content.replace(
          headerRegex,
          `<h${i} style="font-weight:bold;font-size:${
            18 - i
          }pt;margin:10px 0;">$1</h${i}>`
        );
      }
    }

    if (content.includes("<p>")) {
      content = content.replace(
        /<p[^>]*>(.*?)<\/p>/g,
        '<p style="margin:6px 0;">$1</p>'
      );
    }

    if (content.includes("<a")) {
      content = content.replace(
        /<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/g,
        '<a href="$1" style="color:#2563eb;text-decoration:underline;">$2</a>'
      );
    }

    if (content.includes("<code>")) {
      content = content.replace(
        /<code[^>]*>(.*?)<\/code>/g,
        '<code style="font-family:monospace;background-color:#f1f5f9;padding:1px 4px;border-radius:3px;">$1</code>'
      );
    }

    if (content.includes("<pre>")) {
      content = content.replace(
        /<pre(?:\s+data-language="([^"]+)")?[^>]*>(?:<code[^>]*>)?([\s\S]*?)(?:<\/code>)?<\/pre>/g,
        (match, language, code) => {
          const langDisplay = language
            ? `<div style="color:#94a3b8;margin-bottom:4px;">${language}</div>`
            : "";
          return `<div style="background-color:#1e293b;color:#e2e8f0;padding:8px;border-radius:4px;font-family:monospace;white-space:pre-wrap;margin:8px 0;">
            ${langDisplay}${code}
          </div>`;
        }
      );
    }

    if (content.includes("<blockquote>")) {
      content = content.replace(
        /<blockquote[^>]*>(.*?)<\/blockquote>/g,
        '<blockquote style="border-left:4px solid #cbd5e1;padding-left:12px;margin:8px 0;color:#64748b;">$1</blockquote>'
      );
    }

    return content;
  };

  /**
   * Fetch chat data for a specific conversation with improved error handling
   */
  const fetchChatData = useCallback(
    async (conversationId) => {
      if (!conversationId || !mainProjectId) {
        console.error("Missing conversation ID or project ID");
        return null;
      }

      try {
        const response = await chatService.getConversationDetails(
          conversationId,
          mainProjectId
        );

        if (response && response.data) {
          return {
            ...response.data,
            conversation_id: conversationId,
          };
        }
        console.warn("No data returned from conversation details API");
        return null;
      } catch (error) {
        console.error("Error fetching conversation details:", error);
        return null;
      }
    },
    [mainProjectId]
  );

  /**
   * Filter chats by date range
   */
  const getChatsInDateRange = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a start and end date");
      return [];
    }

    // Adjust end date to include the entire day
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    // Filter chat history by date range
    const filteredChats = chatHistory.filter((chat) => {
      const chatDate = new Date(chat.created_at);
      return chatDate >= startDate && chatDate <= endDateTime;
    });

    // Return early if no chats in range
    if (filteredChats.length === 0) {
      toast.info("No chats found in the selected date range");
      return [];
    }

    // Fetch detailed data for each chat
    const chatDataPromises = filteredChats.map((chat) =>
      fetchChatData(chat.conversation_id)
    );

    const results = await Promise.all(chatDataPromises);
    return results.filter(Boolean); // Remove any null results
  }, [startDate, endDate, chatHistory, fetchChatData]);

  /**
   * Extract styled text segments from HTML
   */
  const extractStyledTextSegments = (
    node,
    style = [],
    listType = null,
    listLevel = 0,
    listIndex = 0
  ) => {
    let segments = [];

    // Skip empty nodes or script tags
    if (!node || node.nodeName === "SCRIPT" || node.nodeName === "STYLE") {
      return segments;
    }

    // Check if this is a text node
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) {
        segments.push({
          text,
          style: [...style],
          listType,
          listLevel,
          listIndex,
        });
      }
      return segments;
    }

    // Handle element nodes
    let nodeStyle = [...style];
    let currentListType = listType;
    let currentListLevel = listLevel;
    let currentListIndex = listIndex;

    // Determine node style
    switch (node.nodeName) {
      case "B":
      case "STRONG":
        nodeStyle.push("bold");
        break;
      case "I":
      case "EM":
        nodeStyle.push("italic");
        break;
      case "H1":
        nodeStyle.push("heading1");
        break;
      case "H2":
        nodeStyle.push("heading2");
        break;
      case "H3":
        nodeStyle.push("heading3");
        break;
      case "H4":
      case "H5":
      case "H6":
        nodeStyle.push("heading4");
        break;
      case "CODE":
      case "PRE":
        nodeStyle.push("code");
        break;
      case "UL":
        currentListType = "bullet";
        currentListLevel++;
        currentListIndex = 0;
        break;
      case "OL":
        currentListType = "number";
        currentListLevel++;
        currentListIndex = 0;
        break;
      case "LI":
        currentListIndex++;
        break;
      case "DIV":
        if (node.className === "code-block") {
          nodeStyle.push("code");
        }
        break;
    }

    // Process the children of this node
    for (const child of node.childNodes) {
      segments = [
        ...segments,
        ...extractStyledTextSegments(
          child,
          nodeStyle,
          currentListType,
          currentListLevel,
          currentListIndex
        ),
      ];
    }

    // If this is a block element, add a newline at the end
    if (
      [
        "P",
        "DIV",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "LI",
        "PRE",
        "BR",
        "HR",
      ].includes(node.nodeName)
    ) {
      if (
        segments.length > 0 &&
        !segments[segments.length - 1].text.endsWith("\n")
      ) {
        segments.push({
          text: "\n",
          style: [],
          listType: null,
          listLevel: 0,
          listIndex: 0,
        });
      }
    }

    return segments;
  };

  /**
   * Apply text style to the PDF document
   */
  const applyTextStyle = (doc, style) => {
    // Reset to default
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "normal");

    // Apply styles
    if (style.includes("bold")) {
      doc.setFont(undefined, "bold");
    }

    if (style.includes("italic")) {
      doc.setFont(undefined, "italic");
    }

    if (style.includes("heading")) {
      const level = parseInt(style.match(/heading(\d)/)?.[1] || "1");
      const fontSize = 16 - level * 2; // h1=14, h2=12, etc.
      doc.setFontSize(fontSize);
      doc.setFont(undefined, "bold");
    }

    if (style.includes("code")) {
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
    }
  };

  /**
   * Identifies and extracts table data from HTML content
   */
  const extractTableData = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const tables = doc.querySelectorAll("table");
    const tableData = [];

    tables.forEach((table) => {
      // Extract headers
      const headers = [];
      table.querySelectorAll("th").forEach((th) => {
        headers.push(th.textContent.trim());
      });

      // Extract rows
      const rows = [];
      table.querySelectorAll("tbody tr").forEach((tr) => {
        const rowData = [];
        tr.querySelectorAll("td").forEach((td) => {
          rowData.push(td.textContent.trim());
        });
        rows.push(rowData);
      });

      // If no headers found but rows exist, use first row as header
      if (headers.length === 0 && rows.length > 0) {
        headers.push(...rows[0]);
        rows.shift();
      }

      tableData.push({ headers, rows });
    });

    return tableData;
  };

  // Add this function right before generateChatPdfContent
  /**
   * Fallback method to render tables manually if autoTable plugin fails
   */
  const renderTableManually = (doc, table, startY, marginX, contentWidth) => {
    // Validate inputs to prevent errors
    if (!doc || !table || !table.headers || !table.rows) {
      console.error("Invalid inputs for renderTableManually");
      return startY + 10; // Return the unchanged Y position plus a small offset
    }

    const cellHeight = 8;
    const fontSize = 8;
    const cellPadding = 3;
    const effectiveWidth = contentWidth - 10;
    const columnWidth = effectiveWidth / (table.headers.length || 1);

    try {
      // Set styles for header
      doc.setFillColor(241, 245, 249);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "bold");
      doc.setFontSize(fontSize);

      // Draw header background
      doc.rect(marginX + 5, startY, effectiveWidth, cellHeight, "F");

      // Draw header text
      let currentX = marginX + 5 + cellPadding;
      table.headers.forEach((header) => {
        if (header !== null && header !== undefined) {
          doc.text(
            String(header),
            currentX,
            startY + cellHeight / 2 + fontSize / 4
          );
        }
        currentX += columnWidth;
      });

      startY += cellHeight;

      // Set styles for body
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "normal");

      // Draw rows
      table.rows.forEach((row) => {
        if (!row) return; // Skip null rows

        // Draw cell backgrounds
        doc.rect(marginX + 5, startY, effectiveWidth, cellHeight, "F");

        // Draw cell borders
        doc.setDrawColor(203, 213, 225);
        doc.rect(marginX + 5, startY, effectiveWidth, cellHeight, "S");

        // Draw cell text
        currentX = marginX + 5 + cellPadding;
        row.forEach((cell, index) => {
          if (
            index < table.headers.length &&
            cell !== null &&
            cell !== undefined
          ) {
            doc.text(
              String(cell),
              currentX,
              startY + cellHeight / 2 + fontSize / 4
            );
          }
          currentX += columnWidth;
        });

        startY += cellHeight;
      });

      return startY + 10;
    } catch (error) {
      console.error("Error in manual table rendering:", error);
      return startY + 20; // Return a fallback position to avoid breaking the PDF
    }
  };

  /**
   * Generate PDF content for a single chat with advanced styling and pagination
   */
  const generateChatPdfContent = (chat, doc, startY) => {
    // Add chat title
    const title = chat.title || "Untitled Conversation";
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 20, startY);

    // Add creation date if option enabled
    if (options.includeChatMetadata) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const createdAt = new Date(chat.created_at).toLocaleString();
      doc.text(`Created: ${createdAt}`, 20, startY + 8);
      startY += 15;
    } else {
      startY += 10;
    }

    // Process each message in the chat
    if (!chat.messages || chat.messages.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("No messages in this conversation.", 20, startY + 10);
      return startY + 20;
    }

    // Define page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const marginY = 20;
    const contentWidth = pageWidth - marginX * 2;

    // Process each message in the chat
    for (let i = 0; i < chat.messages.length; i++) {
      const message = chat.messages[i];
      const isUser = message.role === "user";
      const headerColor = isUser ? COLORS.USER_HEADER : COLORS.AI_HEADER;
      const messageColor = isUser ? COLORS.USER_MESSAGE : COLORS.AI_MESSAGE;

      // Check if we need a new page before starting this message
      if (startY > pageHeight - 60) {
        doc.addPage();
        startY = marginY;
      }

      // Add spacing between messages
      startY += 10;

      // Draw header
      doc.setFillColor(headerColor);
      doc.rect(marginX, startY, contentWidth, 8, "F");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(isUser ? "You" : "Assistant", marginX + 3, startY + 5.5);

      // Add timestamp if option enabled
      if (options.includeTimestamps && message.timestamp) {
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        doc.text(timestamp, pageWidth - marginX - 3, startY + 5.5, {
          align: "right",
        });
      }

      // Process the message content
      let content = message.content || "";

      // Apply enhanced formatting (bold, italics, etc.)
      let formattedContent = processMessageContent(content);

      // Parse HTML to extract styled text and tables
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(formattedContent, "text/html");

      // Check for tables
      const tables = htmlDoc.querySelectorAll("table");
      const hasTables = tables.length > 0;
      let tableData = [];

      // Extract styled segments
      let segments = extractStyledTextSegments(htmlDoc.body);

      // Start rendering from below the header
      let contentY = startY + 12;

      // Set initial position and style for text rendering
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      // Calculate background height based on content
      // First, let's get a rough estimate using plain text
      let plainText = htmlDoc.body.textContent || "";
      let estimatedLines = doc.splitTextToSize(
        plainText,
        contentWidth - 10
      ).length;
      let estimatedHeight = estimatedLines * 5 + 12; // 5 points per line plus padding

      // Draw initial message background
      doc.setFillColor(messageColor);
      doc.roundedRect(
        marginX,
        startY + 8,
        contentWidth,
        estimatedHeight,
        1,
        1,
        "F"
      );

      // Process segments to identify where tables will be placed
      let currentSegmentY = contentY;
      let tablePositions = [];

      if (hasTables) {
        tableData.forEach((table, index) => {
          // Skip empty tables
          if (!table || !table.rows || table.rows.length === 0) return;

          // Check if we need a new page for this table
          if (currentSegmentY > pageHeight - 60) {
            doc.addPage();
            currentSegmentY = marginY + 10;
          }

          // Add some spacing before table
          currentSegmentY += 5;

          try {
            // Try to use the autoTable approach if available
            if (typeof doc.autoTable === "function") {
              // Ensure we have valid headers and rows
              const headers =
                table.headers && table.headers.length > 0
                  ? [table.headers]
                  : null;
              const rows = table.rows || [];

              doc.autoTable({
                startY: currentSegmentY,
                head: headers,
                body: rows,
                theme: "grid",
                styles: {
                  fontSize: 8,
                  cellPadding: 3,
                },
                headStyles: {
                  fillColor: [241, 245, 249],
                  textColor: [0, 0, 0],
                  fontStyle: "bold",
                },
                margin: { left: marginX + 5, right: marginX + 5 },
                tableWidth: contentWidth - 10,
              });

              // Update the Y position with careful property access
              if (
                doc.lastAutoTable &&
                typeof doc.lastAutoTable.finalY === "number"
              ) {
                currentSegmentY = doc.lastAutoTable.finalY + 10;
              } else if (
                doc.previousAutoTable &&
                typeof doc.previousAutoTable.finalY === "number"
              ) {
                currentSegmentY = doc.previousAutoTable.finalY + 10;
              } else {
                // Fallback if we can't determine the final position
                currentSegmentY += 30 + rows.length * 8; // Estimate based on row count
              }
            } else {
              // Use manual table rendering as fallback
              currentSegmentY = renderTableManually(
                doc,
                table,
                currentSegmentY,
                marginX,
                contentWidth
              );
            }
          } catch (error) {
            console.error("Error rendering table:", error);
            // On error, fall back to simple text representation
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);

            // Add header text
            if (table.headers && table.headers.length) {
              doc.setFont(undefined, "bold");
              doc.text(table.headers.join(" | "), marginX + 5, currentSegmentY);
              currentSegmentY += 5;
            }

            // Add row text
            doc.setFont(undefined, "normal");
            if (table.rows && table.rows.length) {
              table.rows.forEach((row) => {
                if (row && row.length) {
                  doc.text(row.join(" | "), marginX + 5, currentSegmentY);
                  currentSegmentY += 5;
                }
              });
            }

            currentSegmentY += 10; // Add some space after the table
          }
        });
      }

      // Filter out table segments to avoid double rendering
      const nonTableSegments = segments.filter(
        (segment) =>
          !segment.text.includes("<table") &&
          !segment.text.includes("</table>") &&
          !segment.text.includes("<tr") &&
          !segment.text.includes("</tr>") &&
          !segment.text.includes("<td") &&
          !segment.text.includes("</td>") &&
          !segment.text.includes("<th") &&
          !segment.text.includes("</th>")
      );

      // Apply segments with proper styling
      for (
        let segmentIndex = 0;
        segmentIndex < nonTableSegments.length;
        segmentIndex++
      ) {
        const segment = nonTableSegments[segmentIndex];

        // Apply text style based on the segment properties
        applyTextStyle(doc, segment.style);

        // Handle special case for bullets
        const isListItem = segment.listType !== null;
        const indentLevel = isListItem ? segment.listLevel * 5 : 0;
        const listMarkerWidth = isListItem ? 5 : 0;

        // Calculate effective width for this segment
        const effectiveWidth =
          contentWidth - 10 - indentLevel - listMarkerWidth;

        // Skip empty segments
        if (!segment.text.trim()) continue;

        // Split text to fit within width
        const textLines = doc.splitTextToSize(segment.text, effectiveWidth);

        // Check if we need a new page for this segment
        if (currentSegmentY + textLines.length * 5 > pageHeight - marginY) {
          // Draw a continuation marker
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(
            "(continued on next page...)",
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );

          // Add new page
          doc.addPage();
          currentSegmentY = marginY;

          // Redraw the message background
          doc.setFillColor(messageColor);

          // Get the estimated height for remaining content
          const remainingLines =
            estimatedLines -
            (segmentIndex / nonTableSegments.length) * estimatedLines;
          const remainingHeight = remainingLines * 5 + 12;

          doc.roundedRect(
            marginX,
            currentSegmentY,
            contentWidth,
            remainingHeight,
            1,
            1,
            "F"
          );

          // Add continuation header
          doc.setFillColor(headerColor);
          doc.rect(marginX, currentSegmentY, contentWidth, 8, "F");
          doc.setFontSize(10);
          doc.setTextColor(255, 255, 255);
          doc.text(
            isUser ? "You (continued)" : "Assistant (continued)",
            marginX + 3,
            currentSegmentY + 5.5
          );

          // Move down to start content
          currentSegmentY += 14;

          // Reapply text style
          applyTextStyle(doc, segment.style);
        }

        // Add list marker if this is a list item
        if (isListItem) {
          const xPos = marginX + 5 + indentLevel;

          if (segment.listType === "bullet") {
            // Add bullet point
            doc.text("•", xPos, currentSegmentY);
          } else if (segment.listType === "number") {
            // Add number
            doc.text(`${segment.listIndex}.`, xPos, currentSegmentY);
          }
        }

        // Render the text with proper indentation
        const xPos = marginX + 5 + indentLevel + (isListItem ? 5 : 0);
        doc.text(textLines, xPos, currentSegmentY);

        // Move down for the next segment
        currentSegmentY += textLines.length * 5 + 1;

        // Check if we need to insert a table after this segment
        if (segment.text.includes("[TABLE]") && tableData.length > 0) {
          const tableIndex = parseInt(
            segment.text.match(/\[TABLE(\d+)?\]/)?.[1] || "0"
          );
          if (tableData[tableIndex]) {
            tablePositions.push({ y: currentSegmentY, tableIndex });
          }
        }
      }

      // Render all tables after processing text
      if (hasTables) {
        // If no specific table positions were found, just append tables at the end
        if (tablePositions.length === 0) {
          tableData.forEach((table, index) => {
            // Check if we need a new page for this table
            if (currentSegmentY > pageHeight - 60) {
              doc.addPage();
              currentSegmentY = marginY + 10;
            }

            // Add some spacing before table
            currentSegmentY += 5;

            // Use autoTable to render
            doc.autoTable({
              startY: currentSegmentY,
              head: table.headers.length > 0 ? [table.headers] : null,
              body: table.rows,
              theme: "grid",
              styles: {
                fontSize: 8,
                cellPadding: 3,
              },
              headStyles: {
                fillColor: [241, 245, 249],
                textColor: [0, 0, 0],
                fontStyle: "bold",
              },
              margin: { left: marginX + 5, right: marginX + 5 },
              tableWidth: contentWidth - 10,
            });

            // Update position to after the table
            currentSegmentY = doc.previousAutoTable.finalY + 10;
          });
        } else {
          // Render tables at their marked positions
          tablePositions.forEach((position) => {
            // Check if we need a new page for this table
            if (position.y > pageHeight - 60) {
              doc.addPage();
              position.y = marginY + 10;
            }

            const tableInfo = tableData[position.tableIndex];
            if (tableInfo) {
              doc.autoTable({
                startY: position.y,
                head: tableInfo.headers.length > 0 ? [tableInfo.headers] : null,
                body: tableInfo.rows,
                theme: "grid",
                styles: {
                  fontSize: 8,
                  cellPadding: 3,
                },
                headStyles: {
                  fillColor: [241, 245, 249],
                  textColor: [0, 0, 0],
                  fontStyle: "bold",
                },
                margin: { left: marginX + 5, right: marginX + 5 },
                tableWidth: contentWidth - 10,
              });

              // Update the current Y position if this table extends it
              if (doc.previousAutoTable.finalY + 10 > currentSegmentY) {
                currentSegmentY = doc.previousAutoTable.finalY + 10;
              }
            }
          });
        }
      }

      // Update startY for the next message
      startY = currentSegmentY + 5;

      // Add follow-up questions if enabled and available
      if (
        options.includeFollowUpQuestions &&
        !isUser &&
        i === chat.messages.length - 1 &&
        chat.follow_up_questions &&
        chat.follow_up_questions.length > 0
      ) {
        // Check if we need a new page for follow-up questions
        if (
          startY + chat.follow_up_questions.length * 6 + 10 >
          pageHeight - marginY
        ) {
          doc.addPage();
          startY = marginY;
        }

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text("Suggested follow-up questions:", marginX + 5, startY);
        startY += 7;

        chat.follow_up_questions.forEach((question, i) => {
          const questionText = `• ${question}`;
          const questionLines = doc.splitTextToSize(
            questionText,
            contentWidth - 15
          );

          // Check if we need a new page
          if (startY + questionLines.length * 5 + 3 > pageHeight - marginY) {
            doc.addPage();
            startY = marginY;
          }

          doc.text(questionLines, marginX + 10, startY);
          startY += questionLines.length * 5 + 3;
        });

        startY += 5;
      }
    }

    return startY;
  };

  /**
   * Generate and download a PDF for multiple chats
   */
  const generateMultiChatPdf = async () => {
    setIsLoading(true);
    try {
      const chatsToInclude = await getChatsInDateRange();

      if (chatsToInclude.length === 0) {
        setIsLoading(false);
        return;
      }

      // Create PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Apply autoTable plugin if it's not already applied
      if (
        typeof doc.autoTable !== "function" &&
        typeof autoTable === "function"
      ) {
        autoTable(doc);
      }

      // Add title page
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text("Chat Export", 105, 30, { align: "center" });

      doc.setFontSize(14);
      doc.text("Date Range:", 105, 50, { align: "center" });
      doc.text(`${formatDate(startDate)} - ${formatDate(endDate)}`, 105, 60, {
        align: "center",
      });

      doc.setFontSize(12);
      doc.text(
        `Contains ${chatsToInclude.length} conversation${
          chatsToInclude.length !== 1 ? "s" : ""
        }`,
        105,
        70,
        { align: "center" }
      );

      let currentY = 20;

      // Process each chat
      for (let i = 0; i < chatsToInclude.length; i++) {
        const chat = chatsToInclude[i];

        // Add new page for each chat
        if (i > 0) {
          doc.addPage();
          currentY = 20;
        } else {
          // For first chat, add a page after title page
          doc.addPage();
          currentY = 20;
        }

        // Generate content for this chat
        currentY = generateChatPdfContent(chat, doc, currentY);
      }

      // Generate filename with date range
      const fileName = `Chat_Export_${formatDate(startDate)}_to_${formatDate(
        endDate
      )}.pdf`;

      // Save the PDF
      doc.save(fileName);

      toast.success("Chats exported successfully!");
      setIsDownloadMenuOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate and download a PDF for the current chat
   */
  const downloadCurrentChat = async (chatData = currentChatData) => {
    if (!chatData || !chatData.messages || chatData.messages.length === 0) {
      toast.error("No chat data available to download");
      return;
    }

    setIsLoading(true);
    try {
      // Create PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Make sure jspdf-autotable is properly loaded
      if (typeof doc.autoTable !== "function") {
        console.warn("autoTable is not available - using basic rendering");
      }

      // Generate chat content with appropriate error handling
      try {
        generateChatPdfContent(chatData, doc, 20);
      } catch (error) {
        console.error("Error in generateChatPdfContent:", error);
        // Add a simple text as fallback if content generation fails
        doc.text("Error generating detailed content: " + error.message, 20, 20);
      }

      // Generate filename with chat title and date
      const chatTitle = chatData.title || "Untitled_Chat";
      const sanitizedTitle = chatTitle
        .replace(/[^a-z0-9]/gi, "_")
        .replace(/_+/g, "_");
      const date = new Date().toISOString().split("T")[0];
      const fileName = `${sanitizedTitle}_${date}.pdf`;

      // Save the PDF
      doc.save(fileName);

      toast.success("Chat exported successfully!");
      setIsDownloadMenuOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler for downloading the current active chat with improved detection
   */
  const handleDownloadCurrentChat = async () => {
    // If we have current chat data with messages, use that directly
    if (
      currentChatData &&
      currentChatData.messages &&
      currentChatData.messages.length > 0
    ) {
      downloadCurrentChat(currentChatData);
      return;
    }

    // If we have an active conversation ID but no chat data, try to fetch it
    if (activeConversationId) {
      setIsLoading(true);
      try {
        const data = await fetchChatData(activeConversationId);

        if (data && data.messages && data.messages.length > 0) {
          // Download with the fetched data
          downloadCurrentChat(data);
        } else {
          toast.error("No messages found in the current chat");
        }
      } catch (error) {
        console.error("Error fetching chat data for download:", error);
        toast.error("Failed to fetch chat data for download");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Look for any recent chat in history if active chat ID is not set
      if (chatHistory && chatHistory.length > 0) {
        const mostRecentChat = chatHistory[0]; // Assuming sorted by recent first

        toast.info("Using most recent chat for download");
        setIsLoading(true);

        try {
          const data = await fetchChatData(mostRecentChat.conversation_id);

          if (data && data.messages && data.messages.length > 0) {
            downloadCurrentChat(data);
          } else {
            toast.error("No messages found in the recent chat");
          }
        } catch (error) {
          console.error("Error fetching recent chat data:", error);
          toast.error("Failed to download recent chat");
        } finally {
          setIsLoading(false);
        }
      } else {
        toast.error("No active chat to download");
      }
    }
  };

  return (
    <div className="relative">
      {/* Download Button */}
      <button
        onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
        title="Download Chat"
      >
        <Download size={16} />
        <span className="hidden sm:inline">Download</span>
      </button>

      {/* Download Options Menu */}
      {isDownloadMenuOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-gray-900 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex justify-between items-center">
            <h3 className="font-semibold">Export Options</h3>
            <button
              onClick={() => setIsDownloadMenuOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* Current Chat Download */}
            <div className="border rounded-lg p-3 hover:border-blue-500 transition-colors">
              <button
                onClick={handleDownloadCurrentChat}
                disabled={isLoading}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <span>Download Current Chat</span>
                </div>
                <Download size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Date Range Selection */}
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar size={18} className="text-blue-600" />
                  <span>Download by Date Range</span>
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-50">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    maxDate={endDate || new Date()}
                    placeholderText="Select start date"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-50">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate}
                    maxDate={new Date()}
                    placeholderText="Select end date"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <button
                onClick={generateMultiChatPdf}
                disabled={isLoading || !startDate || !endDate}
                className={`w-full py-2 rounded text-white flex items-center justify-center gap-2
                  ${
                    !startDate || !endDate
                      ? "bg-blue-700 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Generate PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* PDF Customization Options */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setIsCustomizationOpen(!isCustomizationOpen)}
                className="w-full p-3 flex items-center justify-between hover:bg-blue-950 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-blue-600" />
                  <span>Customization Options</span>
                </div>
                {isCustomizationOpen ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {isCustomizationOpen && (
                <div className="p-3 pt-0 border-t">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeTimestamps}
                        onChange={() => handleOptionChange("includeTimestamps")}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">Include Timestamps</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeChatMetadata}
                        onChange={() =>
                          handleOptionChange("includeChatMetadata")
                        }
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">Include Chat Metadata</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.includeFollowUpQuestions}
                        onChange={() =>
                          handleOptionChange("includeFollowUpQuestions")
                        }
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">
                        Include Follow-up Questions
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.formatCode}
                        onChange={() => handleOptionChange("formatCode")}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">Format Code Blocks</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ChatDownloadFeature.propTypes = {
  currentChatData: PropTypes.shape({
    conversation_id: PropTypes.string,
    title: PropTypes.string,
    created_at: PropTypes.string,
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string,
        content: PropTypes.string,
        timestamp: PropTypes.string,
      })
    ),
    follow_up_questions: PropTypes.arrayOf(PropTypes.string),
  }),
  mainProjectId: PropTypes.string.isRequired,
  chatHistory: PropTypes.arrayOf(
    PropTypes.shape({
      conversation_id: PropTypes.string,
      title: PropTypes.string,
      created_at: PropTypes.string,
    })
  ),
  activeConversationId: PropTypes.string,
};

export default ChatDownloadFeature;
