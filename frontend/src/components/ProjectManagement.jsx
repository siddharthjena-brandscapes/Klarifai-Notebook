




///////////////////////////////////////////////////////////
//PROJECT INTEGRATION
///////////////////////////////////////////////////////////
///

//IdeaGeneartor parent component
import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Clock, Eye, Trash2, ChevronRight, Loader, Edit } from 'lucide-react';
import { format } from 'date-fns';
import Header from './dashboard/Header';
import backgroundImage from '../assets/bg-main.jpg';
import { ideaService } from "../utils/axiosConfig";


const Alert = ({ title, description, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-96 bg-gray-800 border border-red-500/50 rounded-lg shadow-2xl text-white p-6 animate-in zoom-in-95">
      <h4 className="text-xl font-bold mb-3 text-red-400">{title}</h4>
      <p className="text-gray-300 mb-6">{description}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

const ProjectNameModal = ({ onSubmit, onCancel }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      onSubmit(projectName.trim());
      setProjectName('');
      setError('');
    } else {
      setError('Project name is required');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-gray-800/95 rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-700 animate-in slide-in-from-bottom-4">
        <h3 className="text-2xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Create New Idea Project
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Idea Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter Idea project name"
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 focus:ring-2 focus:ring-gray-400 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectName.trim()}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-lg"
            >
              Create Idea Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



const ProjectCard = ({ project, onNavigate, onDelete }) => {
  const [fullProjectData, setFullProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const [updateError, setUpdateError] = useState(null);


  useEffect(() => {
    const loadFullProjectData = async () => {
      try {
        setLoading(true);
        const response = await ideaService.getSingleProjectDetails(project.id);
        if (response.data.success) {
          setFullProjectData(response.data.project);
        } else {
          setError(response.data.error || 'Failed to load project details');
        }
      } catch (err) {
        console.error('Error loading project details:', err);
        setError(err.response?.data?.error || 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    loadFullProjectData();
  }, [project.id]);

  const handleViewClick = () => {
    onNavigate(fullProjectData || project);
  };

  if (loading) {
    return (
      <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader className="animate-spin" size={16} />
          <span>Loading project details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/80 rounded-xl p-6 border border-red-500/50">
        <div className="text-red-400">{error}</div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={handleViewClick}
            className="px-4 py-2 bg-blue-600/90 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 flex items-center gap-2"
          >
            <Eye size={16} />
            View Basic Details
          </button>
        </div>
      </div>
    );
  }

  

  const displayData = fullProjectData || project;

  const handleUpdateName = async () => {
    try {
      const response = await ideaService.updateProject(project.id, {
        name: newName
      });
      
      if (response.data.success) {
        project.name = newName;
        setIsEditing(false);
        setUpdateError(null);
      } else {
        setUpdateError(response.data.error || 'Failed to update project name');
      }
    } catch (error) {
      setUpdateError(error.response?.data?.error || 'Failed to update project name');
    }
  };

  return (
    <div className="group bg-gray-800/80 rounded-xl p-6 transition-all duration-300 border border-gray-700 hover:border-green-500/50 shadow-lg hover:shadow-xl hover:bg-gray-750 hover:scale-[1.02]">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1 space-y-4">
        {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project name"
              />
              {updateError && (
                <p className="text-sm text-red-400">{updateError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateName}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewName(project.name);
                    setUpdateError(null);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-emerald-400 transition-all duration-300">
                {project.name}
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <Edit size={16} />
              </button>
            </div>
          )}
          <div>
           
            <p className="text-gray-400 text-sm mt-1">
              {displayData.formData?.product || 'No product specified'}
            </p>
          </div>
          
          <div className="space-y-3 text-gray-400 text-sm">
            <p className="flex items-center gap-2">
              <Clock size={14} className="text-gray-500" />
              Last modified: {format(new Date(displayData.lastModified), 'MMM d, yyyy')}
            </p>
            
            

            <p className="flex items-center gap-2">
              <Eye size={14} className="text-gray-500" />
              {displayData.acceptedIdeas?.length 
                ? `${displayData.acceptedIdeas.length} Generated ideas` 
                : 'No generated ideas yet'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleViewClick}
            className="px-4 py-2 bg-blue-600/90 text-white rounded-lg hover:bg-blue-500 transition-all duration-200 flex items-center gap-2 group/btn"
          >
            <Eye size={16} />
            View
            <ChevronRight size={16} className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
          </button>
          <button
            onClick={() => onDelete(displayData.id)}
            className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
      
      
    </div>
  );
};




const ProjectList = ({ mainProjectId, onSelectProject, onNewProject }) => {
  const [projects, setProjects] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mainProjectId) {
      loadProjects();
    }
  }, [mainProjectId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await ideaService.getProjectDetails({
        main_project_id: mainProjectId
      });
      setProjects(response.data.projects);
    } catch (error) {
      setError('Error loading projects');
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = async (projectName) => {
    try {
      const response = await ideaService.createProject({ 
        name: projectName,
        main_project_id: mainProjectId
      });
      if (response.data.success) {
        setProjects([response.data.project, ...projects].slice(0, 5));
        setShowNameModal(false);
        onNewProject(response.data.project);
      } else {
        setError(response.data.error);
      }
    } catch (error) {
      setError('Error creating project');
      console.error('Error creating project:', error);
    }
  };

  const confirmDelete = (projectId) => {
    setProjectToDelete(projectId);
    setShowDeleteAlert(true);
  };

  const handleDeleteProject = async () => {
    try {
      const response = await ideaService.deleteProject(projectToDelete);
      if (response.data.success) {
        setProjects(projects.filter(project => project.id !== projectToDelete));
        setShowDeleteAlert(false);
        setProjectToDelete(null);
      } else {
        setError(response.data.error);
      }
    } catch (error) {
      setError('Error deleting project');
      console.error('Error deleting project:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading projects...</div>
      </div>
    );
  }

  if (!mainProjectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Invalid project reference</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#111827', // Fallback color
      }}
    >
      
    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
    
    <div className="relative z-10 p-14">
      <Header />
    
      
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            My Idea Projects
          </h2>
          <button 
            onClick={() => setShowNameModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-lg hover:from-blue-600 hover:to-emerald-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus size={20} />
            New Idea Project
          </button>
        </div>

        <div className="grid gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onNavigate={(p) => onSelectProject({ ...p, skipToIdeas: true })}
              onDelete={confirmDelete}
            />
          ))}

          {projects.length === 0 && (
            <div className="text-center py-16 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700 hover:border-gray-600 transition-all duration-200">
              <FolderOpen size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 text-lg">No projects yet. Start by creating a new one!</p>
            </div>
          )}
        </div>
      </div>
      </div>

      {showNameModal && (
        <ProjectNameModal
          onSubmit={handleNewProject}
          onCancel={() => setShowNameModal(false)}
        />
      )}

      {showDeleteAlert && (
        <Alert
          title="Delete Project?"
          description="This action cannot be undone. Are you sure you want to delete this project?"
          onConfirm={handleDeleteProject}
          onCancel={() => setShowDeleteAlert(false)}
        />
      )}
    </div>
  );
};

// Rest of the code (ProjectContext, ProjectProvider, useProject) remains the same
const ProjectContext = React.createContext();

const ProjectProvider = ({ children }) => {
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectList, setShowProjectList] = useState(true);

  const saveProject = async (projectData) => {
    try {
      // Transform the generated images back to the expected format for storage
      const transformedAcceptedIdeas = projectData.acceptedIdeas.map(idea => ({
        id: idea.idea_id,
        title: idea.product_name,
        description: idea.description,
        image_url: projectData.generatedImages[idea.idea_id]?.replace('data:image/png;base64,', '') || null
      }));

      // Prepare the complete form data including dynamic fields
      const completeFormData = {
        ...projectData.formData,
        dynamicFields: projectData.dynamicFields,
        customFields: projectData.customFields,
        fieldActivation: projectData.fieldActivation
      };

      const response = await ideaService.updateProject({
        id: currentProject.id,
        name: projectData.name,
        formData: completeFormData,
        acceptedIdeas: transformedAcceptedIdeas,
        lastModified: new Date().toISOString(),
        ideaMetadata: projectData.ideaMetadata,
        ideaSetCounter: projectData.ideaSetCounter
      });

      if (response.data.success) {
        setCurrentProject({
          ...projectData,
          lastModified: new Date().toISOString()
        });
      } else {
        console.error('Error saving project:', response.data.error);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const loadProject = async (project) => {
    try {
      const response = await ideaService.getSingleProjectDetails(project.id);
      
      if (response.data.success) {
        const projectData = response.data.project;
        
        // Transform all ideas first (both accepted and unaccepted)
        const allIdeas = (projectData.ideas || []).map(idea => ({
          idea_id: idea.id,
          product_name: idea.title,
          description: idea.description,
          ideaSet: idea.ideaSet || 1,
          ideaSetLabel: idea.ideaSetLabel || `Set 1-${idea.id}`
        }));

        // Transform only the explicitly accepted ideas
        const transformedAcceptedIdeas = (projectData.acceptedIdeas || []).map(idea => ({
          idea_id: idea.id,
          product_name: idea.title,
          description: idea.description,
          image_url: idea.image_url,
          ideaSet: idea.ideaSet || 1,
          ideaSetLabel: idea.ideaSetLabel || `Set 1-${idea.id}`
        }));
  
        // Create generatedImages object only for accepted ideas
        const initialGeneratedImages = transformedAcceptedIdeas.reduce((acc, idea) => {
          if (idea.image_url) {
            acc[idea.idea_id] = idea.image_url.startsWith('data:image') 
              ? idea.image_url 
              : `data:image/png;base64,${idea.image_url}`;
          }
          return acc;
        }, {});
  
        // Reconstruct form data
        const formData = {
          product: projectData.formData?.product || '',
          brand: projectData.formData?.brand || '',
          category: projectData.formData?.category || '',
          number_of_ideas: projectData.formData?.number_of_ideas || 1,
          negative_prompt: projectData.formData?.negative_prompt || ''
        };
  
        const dynamicFields = projectData.formData?.dynamicFields || {};
        const customFields = projectData.formData?.customFields || {};
        const fieldActivation = projectData.formData?.fieldActivation || 
          Object.keys(dynamicFields).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {});
  
        const transformedProject = {
          id: projectData.id,
          name: projectData.name,
          created: projectData.created,
          lastModified: projectData.lastModified,
          formData,
          dynamicFields,
          customFields,
          fieldActivation,
          ideas: allIdeas, // Use all ideas here
          acceptedIdeas: transformedAcceptedIdeas, // Use only explicitly accepted ideas
          generatedImages: initialGeneratedImages,
          ideaMetadata: projectData.ideaMetadata || {},
          ideaSetCounter: projectData.ideaSetCounter || 1,
          skipToIdeas: project.skipToIdeas
        };
  
        setCurrentProject(transformedProject);
        setShowProjectList(false);
      } else {
        console.error('Error loading project:', response.data.error);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const startNewProject = async (project) => {
    try {
      const response = await ideaService.getSingleProjectDetails(project.id);
      
      if (response.data.success) {
        const projectData = response.data.project;
        
        // Start with empty arrays for both ideas and acceptedIdeas
        const transformedProject = {
          id: projectData.id,
          name: projectData.name,
          created: projectData.created,
          lastModified: projectData.lastModified,
          formData: {
            product: projectData.formData?.product || '',
            brand: projectData.formData?.brand || '',
            category: projectData.formData?.category || '',
            number_of_ideas: 1
          },
          dynamicFields: projectData.formData?.dynamicFields || {},
          customFields: projectData.formData?.customFields || {},
          ideas: [], // Start with empty ideas array
          acceptedIdeas: [], // Start with empty acceptedIdeas array
          generatedImages: {},
          fieldActivation: {},
          ideaMetadata: {}
        };

        setCurrentProject(transformedProject);
        setShowProjectList(false);
      }
    } catch (error) {
      console.error('Error starting new project:', error);
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      currentProject, 
      setCurrentProject,
      showProjectList,
      setShowProjectList,
      saveProject,
      loadProject,
      startNewProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

const useProject = () => {
  const context = React.useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export { ProjectProvider, useProject, ProjectList };