import React from 'react';

const CircularProgressButton = ({ 
  currentIdea, 
  totalIdeas, 
  isLoading, 
  children, 
  ...props 
}) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate real progress based on completed ideas
  const progress = totalIdeas > 0 ? (currentIdea / totalIdeas) * 100 : 0;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      {...props}
      className={`relative inline-flex items-center justify-center px-12 py-3 text-lg rounded-lg transition-all ${
        props.disabled && !isLoading
          ? "bg-[#d6cbbf] text-[#5e4636] dark:opacity-50 dark:cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
          : "bg-[#a55233] hover:bg-[#8b4513] text-white dark:bg-gradient-to-r dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 dark:text-white"
      }`}
      disabled={props.disabled || isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="w-8 h-8 mr-3 -ml-2" viewBox="0 0 44 44">
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
              style={{ 
                transition: 'stroke-dashoffset 0.3s ease-in-out'
              }}
            />
            <text
              x="22"
              y="22"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-bold fill-white"
            >
              {currentIdea}/{totalIdeas}
            </text>
          </svg>
          <span>
            Generating...
          </span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default CircularProgressButton;