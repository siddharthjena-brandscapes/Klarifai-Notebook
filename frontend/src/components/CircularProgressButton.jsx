// Create a new file: src/components/CircularProgressButton.jsx
import React from 'react';

const CircularProgressButton = ({ progress, isLoading, children, ...props }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      {...props}
      className="relative inline-flex items-center justify-center px-12 py-3 text-lg rounded-lg transition-all bg-[#a55233] hover:bg-[#8b4513] text-white dark:bg-gradient-to-r dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 dark:text-white"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="w-8 h-8 mr-2 -ml-2" viewBox="0 0 44 44">
            <circle
              className="text-white opacity-30"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              r={radius}
              cx="22"
              cy="22"
            />
            <circle
              className="text-white"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="22"
              cy="22"
              transform="rotate(-90 22 22)"
            />
            <text
              x="22"
              y="22"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-bold fill-white"
            >
              {Math.round(progress)}%
            </text>
          </svg>
          Generating...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default CircularProgressButton;