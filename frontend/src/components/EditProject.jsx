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
      const response = await coreService.updateProject(project.id, {
        ...projectData,
        category: finalCategory
      });

      if (response.status === 'success') {
        onUpdate(response.project);
        onClose();
      } else {
        setError(response.message || 'Failed to update project');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Edit Project</h1>
            <button
              onClick={onClose}
              className="text-emerald-300 hover:text-emerald-200 transition-colors flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter project name"
                  value={projectData.name}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Describe your project"
                  rows={3}
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-200 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    <option key={category} value={category} className="bg-gray-800">
                      {category}
                    </option>
                  ))}
                </select>

                {projectData.category === 'Other' && (
                  <div className="mt-4">
                    <label htmlFor="customCategory" className="block text-sm font-medium text-gray-200 mb-2">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      id="customCategory"
                      className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter custom category"
                      value={projectData.customCategory}
                      onChange={(e) => setProjectData(prev => ({ ...prev, customCategory: e.target.value }))}
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
                {error}
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Available Modules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map(module => (
                  <div
                    key={module.id}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      module.active
                        ? 'cursor-pointer ' + (projectData.selected_modules.includes(module.id)
                          ? 'bg-emerald-600/20 border-emerald-500'
                          : 'bg-white/5 border-gray-300/20 hover:bg-white/10')
                        : 'opacity-50 cursor-not-allowed bg-gray-800 border-gray-700'
                    }`}
                    onClick={() => handleModuleToggle(module.id)}
                  >
                    <div className="flex items-center space-x-3">
                      {module.active ? (
                        <module.icon className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Lock className="w-6 h-6 text-gray-500" />
                      )}
                      <div>
                        <h4 className="font-medium text-white">{module.name}</h4>
                        <p className="text-sm text-gray-300">
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

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormChanged || loading}
                className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                  isFormChanged && !loading
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
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