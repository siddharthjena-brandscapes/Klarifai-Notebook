
import React, { useState, useEffect } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Calendar, Clock, Search, ChevronDown, FolderOpen } from "lucide-react";
import Header from "../dashboard/Header";
import { coreService } from "../../utils/axiosConfig";
import UnarchiveProjectModal from "./UnarchiveProjectModal";
import FaqButton from "../faq/FaqButton";

function ArchivedProjects({ onBack, onRestoreProject }) {
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [projectToUnarchive, setProjectToUnarchive] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('recent');

  useEffect(() => {
    loadArchivedProjects();
  }, []);

  const loadArchivedProjects = async () => {
    try {
      setLoading(true);
      const projects = await coreService.getArchivedProjects();
      setArchivedProjects(projects);
    } catch (err) {
      console.error("Error loading archived projects:", err);
      setError("Failed to load archived projects");
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchiveClick = (project) => {
    setProjectToUnarchive(project);
    setUnarchiveModalOpen(true);
  };

  const handleUnarchiveConfirm = async () => {
    if (!projectToUnarchive) return;

    try {
      await coreService.unarchiveProject(projectToUnarchive.id);
      
      // Remove from archived list
      setArchivedProjects(prev => 
        prev.filter(p => p.id !== projectToUnarchive.id)
      );
      
      // Call parent callback to update main projects list if needed
      if (onRestoreProject) {
        onRestoreProject(projectToUnarchive.id);
      }
      
      // Reset and close modal
      setUnarchiveModalOpen(false);
      setProjectToUnarchive(null);
    } catch (err) {
      console.error("Error unarchiving project:", err);
      setError("Failed to unarchive project");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return "Date not available";
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) {
      return "Time not available";
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid time";
      }

      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(date);
    } catch (error) {
      return "Invalid time";
    }
  };

  // Filter projects based on search query
  const filteredProjects = archivedProjects.filter(project => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      (project.description && project.description.toLowerCase().includes(query)) ||
      project.category.toLowerCase().includes(query)
    );
  });

  // Sort the filtered projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortOption === 'recent') {
      // Sort by last updated time (or created time if updated is not available)
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime; // Newest first
    } else if (sortOption === 'created') {
      // Sort by creation time
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime; // Newest first
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#faf4ee] dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-emerald-900 p-6">
      {unarchiveModalOpen && projectToUnarchive && (
        <UnarchiveProjectModal
          isOpen={unarchiveModalOpen}
          onClose={() => setUnarchiveModalOpen(false)}
          onConfirm={handleUnarchiveConfirm}
          projectName={projectToUnarchive.name}
        />
      )}
  
      <Header />
      <div className="max-w-7xl mx-auto pt-10">
        {/* Page title and back button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <button
              onClick={onBack}
              className="flex items-center text-[#5e4636] dark:text-gray-300 hover:text-[#a55233] dark:hover:text-white transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Projects
            </button>
          </div>
          <h1 className="text-2xl font-serif text-[#0a3b25] dark:text-white flex items-center">
            <Archive className="w-6 h-6 mr-2 text-[#a55233] dark:text-yellow-200/80" />
            Archived Projects
          </h1>
        </div>
  
        {/* Search and filter row */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[#5a544a] dark:text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-[#d6cbbf] dark:border-gray-700 rounded-lg text-[#5e4636] dark:text-white placeholder-[#5a544a] dark:placeholder-gray-400 focus:ring-2 focus:ring-[#a55233] dark:focus:ring-amber-500/50 focus:border-[#a55233] dark:focus:border-amber-500/50"
              placeholder="Search archived projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <select 
              className="text-sm font-medium appearance-none block px-4 py-2.5 pr-8 bg-white/80 dark:bg-gray-800/80 border border-[#d6cbbf] dark:border-gray-700 rounded-lg text-[#5e4636] dark:text-gray-300 focus:ring-2 focus:ring-[#a55233] dark:focus:ring-amber-500/50 focus:border-[#a55233] dark:focus:border-amber-500/50"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="recent">Sort by: Recent activity</option>
              <option value="created">Sort by: Recently created</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5a544a] dark:text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
  
        {/* Project cards */}
        {sortedProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-[#e8ddcc] dark:border-gray-700/50 hover:border-[#a68a70] dark:hover:border-amber-500/30 transition-all duration-300 overflow-hidden"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-0.5 text-xs font-medium text-[#5e4636] dark:text-gray-300 border-l-2 border-[#a55233] dark:border-emerald-400 pl-2">
                      {project.category}
                    </span>
                    <span className="text-xs font-medium text-[#a55233] dark:text-yellow-200/80">
                      Archived
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-serif font-medium text-[#0a3b25] dark:text-white leading-tight mb-3">
                    {project.name}
                  </h3>
                    
                  <p className="text-gray-700 dark:text-gray-400 text-sm font-normal tracking-wide leading-relaxed mb-5 flex-grow line-clamp-3">
                    {project.description || "No description provided"}
                  </p>
                  
                  {/* Module tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.selected_modules?.slice(0, 2).map((moduleId) => (
                      <span
                        key={moduleId}
                        className="px-2 py-1 bg-[#e8ddcc] dark:bg-gray-700/50 text-[#5a544a] dark:text-gray-300 rounded-md text-xs"
                      >
                        {moduleId
                          .split("-")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                    ))}
                    {project.selected_modules?.length > 2 && (
                      <span className="px-2 py-1 bg-[#f5e6d8] dark:bg-gray-700/30 text-[#5a544a] dark:text-gray-300 rounded-md text-xs">
                        +{project.selected_modules.length - 2} more
                      </span>
                    )}
                  </div>
  
                  {/* Card footer */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#e3d5c8] dark:border-gray-700/50">
                    <div className="text-xs text-[#5a544a] dark:text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {formatDate(project.created_at)}
                    </div>
                    
                    <button
                      onClick={() => handleUnarchiveClick(project)}
                      className="px-3 py-1.5 bg-[#556052]/20 hover:bg-[#556052]/30 dark:bg-amber-600/10 dark:hover:bg-amber-600/20 text-[#556052] dark:text-yellow-200/80 rounded-md transition-colors text-xs flex items-center"
                    >
                      <ArchiveRestore className="w-3 h-3 mr-1.5" />
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
  
        {/* Empty state */}
        {!loading && sortedProjects.length === 0 && (
          <div className="text-center py-16 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-[#d6cbbf] dark:border-gray-700/50 shadow-sm">
            <Archive className="w-16 h-16 mx-auto text-[#a68a70] dark:text-gray-600 mb-4" />
            <p className="text-xl text-[#0a3b25] dark:text-white mb-2">No archived projects</p>
            <p className="text-[#5e4636] dark:text-gray-400 mb-6 max-w-md mx-auto">
              Projects you archive will appear here
            </p>
            <button
              onClick={onBack}
              className="px-5 py-2.5 bg-[#a68a70] dark:bg-gray-700 hover:bg-[#8c715f] dark:hover:bg-gray-600 text-white font-medium rounded-lg transition-colors mx-auto flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span>Back to Projects</span>
            </button>
          </div>
        )}
      </div>
      {/* <FaqButton /> */}
    </div>
  );
}

export default ArchivedProjects;