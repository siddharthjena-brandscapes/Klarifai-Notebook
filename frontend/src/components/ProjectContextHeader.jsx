import React from 'react';
import { ChevronLeft, FolderOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const ProjectContextHeader = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const projectName = location.state?.projectName;

  return (
    <div className={`relative z-20 bg-black/80 border-b border-emerald-500/20 backdrop-blur-md ${className}`}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 md:p-2.5 text-gray-300 hover:text-white bg-gray-800/50 hover:bg-emerald-600/20 rounded-lg transition-all duration-200 group flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-translate-x-0.5" />
              <span className="text-sm font-medium hidden md:inline">Back to Project</span>
            </button>
            
            <div className="flex items-center">
              <div className="hidden md:block h-6 w-px bg-gray-700 mx-4" />
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="p-1.5 md:p-2 bg-emerald-600/20 rounded-lg">
                  <FolderOpen className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm text-gray-400">Current Project</span>
                  <span className="text-sm md:text-lg font-semibold text-white bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent truncate max-w-[200px] md:max-w-md">
                    {projectName || 'Untitled Project'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectContextHeader;