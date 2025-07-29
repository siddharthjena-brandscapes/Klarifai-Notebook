// src/components/ThemeToggle.jsx
import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors duration-200 focus:outline-none
                dark:bg-gray-800 dark:text-yellow-300 dark:hover:bg-gray-700
                bg-gray-200 text-gray-800 hover:bg-gray-300"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <Sun size={20} className="text-yellow-300" />
      ) : (
        <Moon size={20} className="text-gray-600" />
      )}
    </button>
  );
};

export default ThemeToggle;