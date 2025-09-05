
// export default TextSizeControls;
import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

const TextSizeControls = ({ textSize, setTextSize }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const controlsRef = useRef(null);

  // Function to handle text size change and collapse control
  const handleTextSizeChange = (size) => {
    setTextSize(size);
    setIsExpanded(false);
  };

  // Handle clicks outside the component to collapse it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    // Add event listener when expanded
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div
      ref={controlsRef}
      className={`
        relative overflow-hidden 
        flex items-center justify-end
        transition-all duration-300 ease-in-out
        rounded-md border dark:border-blue-500/20 border-[#d6cbbf] bg-[#ffffff] dark:bg-gray-900/30
        h-8 shadow-md
      `}
      style={{
        width: isExpanded ? "175px" : "32px",
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Size options that expand to the left */}
      <div
        className={`
          flex items-center space-x-3 pl-2 pr-1
          transition-opacity duration-300
          ${isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      >
        <button
          onClick={() => handleTextSizeChange("xs")}
          title="xs"
          className={`transition-colors ${
            textSize === "xs"
              ? "text-green-400"
              : "dark:text-gray-400 dark:hover:text-white text-[#19a3ff] hover:text-[#4a7999]"
          }`}
        >
          <span className="text-xs">A</span>
        </button>

        <button
          onClick={() => handleTextSizeChange("small")}
          title="Small"
          className={`transition-colors ${
            textSize === "small"
              ? "text-green-400"
              : "dark:text-gray-400 dark:hover:text-white text-[#19a3ff] hover:text-[#4a7999]"
          }`}
        >
          <span className="text-sm font-medium">A</span>
        </button>

        <button
          onClick={() => handleTextSizeChange("medium")}
          title="Medium"
          className={`transition-colors ${
            textSize === "medium"
              ? "text-green-400"
              : "dark:text-gray-400 dark:hover:text-white text-[#19a3ff] hover:text-[#4a7999]"
          }`}
        >
          <span className="text-base">A</span>
        </button>

        <button
          onClick={() => handleTextSizeChange("large")}
          title="Large"
          className={`transition-colors ${
            textSize === "large"
              ? "text-green-400"
              : "dark:text-gray-400 dark:hover:text-white text-[#19a3ff] hover:text-[#4a7999]"
          }`}
        >
          <span className="text-lg">A</span>
        </button>

        <button
          onClick={() => handleTextSizeChange("xl")}
          title="xl"
          className={`transition-colors ${
            textSize === "xl"
              ? "text-green-400"
              : "dark:text-gray-400 dark:hover:text-white text-[#19a3ff] hover:text-[#4a7999]"
          }`}
        >
          <span className="text-xl">A</span>
        </button>

        <button
          onClick={() => handleTextSizeChange("2xl")}
          title="2xl"
          className={`transition-colors ${
            textSize === "2xl"
              ? "text-green-400"
              : "dark:text-gray-400 dark:hover:text-white text-[#19a3ff] hover:text-[#4a7999]"
          }`}
        >
          <span className="text-2xl">A</span>
        </button>
      </div>

      {/* Main icon display (no longer a button) */}
      <div
        className="p-1 flex items-center justify-center min-w-[32px]"
        title="Font Size Options"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <text x="4" y="12" fontSize="8" strokeWidth="1">
            A
          </text>
          <text x="12" y="19" fontSize="14" strokeWidth="1.5">
            A
          </text>
        </svg>
      </div>
    </div>
  );
};

TextSizeControls.propTypes = {
  textSize: PropTypes.string.isRequired,
  setTextSize: PropTypes.func.isRequired,
};

export default TextSizeControls;