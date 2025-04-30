

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { coreService } from "../utils/axiosConfig";

const EditProject = ({ project, modules, onClose, onUpdate }) => {
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    category: '',
    customCategory: '',
    selected_modules: []
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);

  const categories = [
    'Business',
    'Healthcare',
    'Beauty & Wellness',
    'Education',
    'Technology',
    'Other'
  ];

  useEffect(() => {
    // Initialize form with project data
    if (project) {
      setProjectData({
        name: project.name,
        description: project.description,
        category: project.category,
        customCategory: categories.includes(project.category) ? '' : project.category,
        selected_modules: project.selected_modules || []
      });
    }
  }, [project]);

  // Track form changes
  useEffect(() => {
    if (!project) return;

    const hasChanges = 
      project.name !== projectData.name ||
      project.description !== projectData.description ||
      project.category !== (projectData.category === 'Other' ? projectData.customCategory : projectData.category) ||
      !arraysEqual(project.selected_modules, projectData.selected_modules);

    setIsFormChanged(hasChanges);
  }, [projectData, project]);

  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.sort().every((val, index) => val === b.sort()[index]);
  };

  const handleModuleToggle = (moduleId) => {
    const selectedModule = modules.find(m => m.id === moduleId);
    
    if (selectedModule && selectedModule.active) {
      setProjectData(prev => ({
        ...prev,
        selected_modules: prev.selected_modules.includes(moduleId)
          ? prev.selected_modules.filter(id => id !== moduleId)
          : [...prev.selected_modules, moduleId]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormChanged) return;

    setLoading(true);
    setError(null);
    
    const finalCategory = projectData.category === 'Other' 
      ? projectData.customCategory 
      : projectData.category;

    if (!projectData.name || !projectData.description || !finalCategory) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (projectData.category === 'Other' && !projectData.customCategory.trim()) {
      setError('Please enter a custom category');
      setLoading(false);
      return;
    }

    if (projectData.selected_modules.length === 0) {
      setError('Please select at least one module');
      setLoading(false);
      return;
    }

    try {
      const updatedData = {
        name: projectData.name,
        description: projectData.description,
        category: finalCategory,
        selected_modules: projectData.selected_modules
      };
      
      // Call onUpdate with the correct parameters - projectId and updatedData
      onUpdate(project.id, updatedData);
      onClose();
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 pt-16">
      <div className="bg-[#faf4ee] dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-serif text-[#0a3b25] dark:text-white">Edit Project</h1>
            <button
              onClick={onClose}
              className="text-[#5e4636] dark:text-emerald-300 hover:text-[#a55233] dark:hover:text-emerald-200 transition-colors flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
  
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#5e4636] dark:text-gray-200 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 bg-white/80 dark:bg-white/5 border border-[#d6cbbf] dark:border-gray-300/20 rounded-lg text-[#5e4636] dark:text-white focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter project name"
                  value={projectData.name}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
  
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#5e4636] dark:text-gray-200 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full px-4 py-2 bg-white/80 dark:bg-white/5 border border-[#d6cbbf] dark:border-gray-300/20 rounded-lg text-[#5e4636] dark:text-white focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Describe your project"
                  rows={3}
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                
                />
              </div>
  
              <div className="space-y-4">
                <label htmlFor="category" className="block text-sm font-medium text-[#5e4636] dark:text-gray-200 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  className="w-full px-4 py-2 bg-white/80 dark:bg-white/5 border border-[#d6cbbf] dark:border-gray-300/20 rounded-lg text-[#5e4636] dark:text-white focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  value={projectData.category}
                  onChange={(e) => setProjectData(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    customCategory: e.target.value === 'Other' ? prev.customCategory : ''
                  }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-white dark:bg-gray-800">
                      {category}
                    </option>
                  ))}
                </select>
  
                {/* Module selection */}
                <div>
                  <h3 className="text-xl font-medium text-[#0a3b25] dark:text-white mb-4">Available Modules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map(module => (
                      <div
                        key={module.id}
                        className={`p-4 rounded-lg border transition-all duration-300 ${
                          module.active
                            ? 'cursor-pointer ' + (projectData.selected_modules.includes(module.id)
                              ? 'bg-[#556052]/10 border-[#556052] dark:bg-emerald-600/20 dark:border-emerald-500'
                              : 'bg-white/80 border-[#d6cbbf] dark:bg-white/5 dark:border-gray-300/20 hover:bg-[#f5e6d8] dark:hover:bg-white/10')
                            : 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
                        }`}
                        onClick={() => handleModuleToggle(module.id)}
                      >
                        <div className="flex items-center space-x-3">
                          {module.active ? (
                            <module.icon className="w-6 h-6 text-[#a55233] dark:text-emerald-400" />
                          ) : (
                            <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                          )}
                          <div>
                            <h4 className="font-medium text-[#0a3b25] dark:text-white">{module.name}</h4>
                            <p className="text-sm text-[#5e4636] dark:text-gray-300">
                              {module.active 
                                ? module.description 
                                : 'This module is currently locked. Coming soon!'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
  
            {/* Submit buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-white dark:bg-gray-700 border border-[#d6cbbf] dark:border-gray-600 text-[#5e4636] dark:text-white rounded-lg hover:bg-[#f5e6d8] dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormChanged || loading}
                className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                  isFormChanged && !loading
                    ? 'bg-[#a55233] hover:bg-[#8b4513] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white'
                    : 'bg-[#d6cbbf] dark:bg-gray-600 text-[#5e4636] dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? 'Updating...' : 'Update Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProject;