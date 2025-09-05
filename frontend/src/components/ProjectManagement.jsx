

//IdeaGeneartor parent component
import React, { useState, useEffect, useContext } from 'react';
import { Plus, FolderOpen, Clock, Eye, Trash2, ChevronRight, Loader, Edit } from 'lucide-react';
import { format } from 'date-fns';
import Header from './dashboard/Header';
import backgroundImage from '../assets/bg-main.jpg';
import { ideaService } from "../utils/axiosConfig";
import { ThemeContext } from '../context/ThemeContext';
import FaqButtonIdea from './faq/FaqButtonIdea';


const Alert = ({ title, description, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] bg-[#faf4ee]/80 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="w-96 bg-white dark:bg-gray-800 border border-red-500/50 rounded-lg shadow-2xl text-[#5e4636] dark:text-white p-6 animate-in zoom-in-95">
      <h4 className="text-xl font-bold mb-3 text-red-500 dark:text-red-400">{title}</h4>
      <p className="text-[#5a544a] dark:text-gray-300 mb-6">{description}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-white dark:bg-gray-700 text-[#5e4636] dark:text-white border border-[#d6cbbf] dark:border-gray-600 rounded-lg hover:bg-[#f5e6d8] dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-[#d6cbbf] dark:focus:ring-gray-500"
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError(''); // Clear previous errors
    
    try {
      await onSubmit(projectName.trim());
      // If successful, the modal will be closed by the parent component
    } catch (err) {
      // Display the error message
      setError(err.message || 'Failed to create project');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#faf4ee]/80 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white/90 dark:bg-gray-800/95 rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl border border-[#d6cbbf] dark:border-gray-700 animate-in slide-in-from-bottom-4">
        <h3 className="text-2xl font-serif text-[#0a3b25] dark:text-white mb-6 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-emerald-400">
          Create New Idea Session
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-serif text-[#5e4636] dark:text-gray-300 mb-2">
              Idea Session Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (error) setError(''); // Clear error when typing
              }}
              placeholder="Enter Idea session name"
              className={`w-full px-4 py-3 bg-white/80 dark:bg-gray-700/50 border ${
                error ? 'border-red-500' : 'border-[#d6cbbf] dark:border-gray-600'
              } rounded-lg text-[#5e4636] dark:text-white placeholder-[#5a544a] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 p-2 rounded border border-red-500/50">
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white dark:bg-gray-700 text-[#5e4636] dark:text-white border border-[#d6cbbf] dark:border-gray-600 rounded-lg hover:bg-[#f5e6d8] dark:hover:bg-gray-600 transition-all duration-200 focus:ring-2 focus:ring-[#d6cbbf] dark:focus:ring-gray-400 focus:outline-none"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectName.trim() || isSubmitting}
              className="px-6 py-2 bg-[#a55233] dark:bg-gradient-to-r dark:from-blue-500 dark:to-emerald-500 text-white rounded-lg hover:bg-[#8b4513] dark:hover:from-blue-600 dark:hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-400 focus:outline-none shadow-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                "Create Idea Session"
              )}
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
          // Process the project data to handle Azure blob URLs
          const projectData = response.data.project;
          
          // If the project has acceptedIdeas, process their image URLs
          if (projectData.acceptedIdeas && projectData.acceptedIdeas.length > 0) {
            projectData.acceptedIdeas = projectData.acceptedIdeas.map(idea => {
              // If the idea has an image_url that's an Azure URL, preserve it as is
              if (idea.image_url && 
                  (idea.image_url.startsWith('https://') || 
                   idea.image_url.startsWith('http://'))) {
                return idea;
              }
              // If it's a base64 string that doesn't start with data:, add the prefix
              else if (idea.image_url && !idea.image_url.startsWith('data:')) {
                return {
                  ...idea,
                  image_url: `data:image/png;base64,${idea.image_url}`
                };
              }
              // Otherwise, return the idea as is
              return idea;
            });
          }
          
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
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-[#d6cbbf] dark:border-gray-700 flex items-center justify-center shadow-md">
        <div className="flex items-center gap-2 text-[#5a544a] dark:text-gray-400">
          <Loader className="animate-spin" size={16} />
          <span>Loading project details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 border border-red-500/50 shadow-md">
        <div className="text-red-500 dark:text-red-400">{error}</div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={handleViewClick}
            className="px-4 py-2 bg-[#a55233] dark:bg-blue-600/90 text-white rounded-lg hover:bg-[#8b4513] dark:hover:bg-blue-500 transition-all duration-200 flex items-center gap-2"
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
    <div className="group bg-white/80 dark:bg-gray-800/80 rounded-xl p-6 transition-all duration-300 border border-[#e8ddcc] dark:border-gray-700 hover:border-[#ddd9c5] dark:hover:border-green-500/50 shadow-lg hover:shadow-xl hover:bg-[#ddd9c5] dark:hover:bg-gray-750 hover:scale-[1.02]">
      <div className="flex justify-between items-start gap-6">
        <div className="flex-1 space-y-4">
        {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700/50 border border-[#d6cbbf] dark:border-gray-600 rounded-lg text-[#5e4636] dark:text-white placeholder-[#5a544a] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-blue-500"
                placeholder="Project name"
              />
              {updateError && (
                <p className="text-sm text-red-500 dark:text-red-400">{updateError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateName}
                  className="px-3 py-1 bg-[#556052] dark:bg-green-600 text-white rounded-lg hover:bg-[#425142] dark:hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewName(project.name);
                    setUpdateError(null);
                  }}
                  className="px-3 py-1 bg-white dark:bg-gray-600 text-[#5e4636] dark:text-white border border-[#d6cbbf] dark:border-gray-500 rounded-lg hover:bg-[#f5e6d8] dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-medium text-[#5e4636] dark:text-white group-hover:text-[#0a3b25] dark:group-hover:text-transparent dark:group-hover:bg-clip-text dark:group-hover:bg-gradient-to-r dark:group-hover:from-blue-400 dark:group-hover:to-emerald-400 transition-all duration-300">
                {project.name}
              </h3>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-[#5a544a] dark:text-gray-400 hover:text-[#a55233] dark:hover:text-white transition-colors"
              >
                <Edit size={16} />
              </button>
            </div>
          )}
          <div>
            <p className="text-[#5a544a] dark:text-gray-400 text-sm mt-1">
              {displayData.formData?.product || 'No product specified'}
            </p>
          </div>
          
          <div className="space-y-3 text-[#5a544a] dark:text-gray-400 text-sm">
            <p className="flex items-center gap-2">
              <Clock size={14} className="text-[#8c715f] dark:text-gray-500" />
              Updated at: {format(new Date(displayData.lastModified), 'MMM d, yyyy')}
            </p>
            
            <p className="flex items-center gap-2">
              <Eye size={14} className="text-[#8c715f] dark:text-gray-500" />
              {displayData.acceptedIdeas?.length 
                ? `${displayData.acceptedIdeas.length} Generated ideas` 
                : 'No generated ideas yet'}
            </p>
            {/* ADD THE IMAGE PREVIEW HERE */}
{displayData.acceptedIdeas && displayData.acceptedIdeas.length > 0 && 
 (displayData.acceptedIdeas[0].image_url || displayData.acceptedIdeas[0].azure_blob_url) && (
  <div className="mt-2 aspect-square w-16 h-16 rounded-md overflow-hidden border border-[#d6cbbf] dark:border-gray-700">
    <img
      src={displayData.acceptedIdeas[0].azure_blob_url || displayData.acceptedIdeas[0].image_url}
      alt={displayData.acceptedIdeas[0].title || displayData.acceptedIdeas[0].product_name || "Project image"} 
      className="w-full h-full object-cover"
    />
  </div>
)}

          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleViewClick}
            className="px-4 py-2 bg-[#556052] dark:bg-blue-600/90 text-white rounded-lg hover:bg-[#887d4e] dark:hover:bg-blue-500 transition-all duration-200 flex items-center gap-2 group/btn"
          >
            <Eye size={16} />
            View
            <ChevronRight size={16} className="opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all duration-200" />
          </button>
          <button
            onClick={() => onDelete(displayData.id)}
            className="px-4 py-2 bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
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
  const { theme } = useContext(ThemeContext);

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
        return true;
      } else {
        // If the server responded with success: false
        throw new Error(response.data.error || 'Failed to create project');
      }
    } catch (error) {
      // Extract error message from the response
      let errorMessage = 'Error creating project';
      
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Project creation error:', errorMessage);
      
      // Throw a new error with the extracted message to be caught by the modal component
      throw new Error(errorMessage);
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
      <div className="min-h-screen flex items-center justify-center bg-[#faf4ee] dark:bg-gray-900">
        <div className="text-[#5e4636] dark:text-white">Loading projects...</div>
      </div>
    );
  }

  if (!mainProjectId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#faf4ee] dark:bg-black">
        <div className="text-[#5e4636] dark:text-white">Invalid project reference</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen bg-[#faf4ee] dark:bg-black overflow-hidden`}>
      {/* Apply background only in dark theme */}
      {theme === 'dark' && (
        <>
          <div 
            className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            role="img"
            aria-label="Background"
          />
          {/* <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div> */}
        </>
      )}
    
      <div className="relative z-10 p-14">
        <Header />
      
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-4xl pb-1 text-[#0a3b25] font-serif dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-emerald-400">
              My Idea Sessions
            </h2>
            <button 
              onClick={() => setShowNameModal(true)}
              className="px-6 py-3 bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-500 dark:to-emerald-500 text-white rounded-lg dark:hover:from-blue-600 dark:hover:to-emerald-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus size={20} />
              New Idea Session
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
              <div className="text-center py-16 bg-white/80 dark:bg-gray-800/30 rounded-xl border-2 border-dashed border-[#d6cbbf] dark:border-gray-700 hover:border-[#a68a70] dark:hover:border-gray-600 transition-all duration-200">
                <FolderOpen size={48} className="mx-auto mb-4 text-[#5a544a] dark:text-gray-400" />
                <p className="text-[#5a544a] dark:text-gray-400 text-lg">No projects yet. Start by creating a new one!</p>
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
      <FaqButtonIdea />
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
    // Extract the ID for the API call
    const projectId = projectData.id;
    
    // Remove id from the data being sent
    const { id, ...dataToSend } = projectData;
    
    // Handle generatedImages with Azure URLs
    if (dataToSend.generatedImages) {
      // We don't need to modify this since the Azure URLs are already saved properly
      // The backend stores image URLs in both the database and Azure storage
    }
    
    // Make the API call
    const response = await ideaService.updateProject(projectId, dataToSend);

    if (response.data.success) {
      // Important: Don't update currentProject here with the server response
      // Just keep the local projectData as is
      setCurrentProject(projectData);
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
          visualization_prompt: idea.visualization_prompt,
          idea_set: idea.idea_set,
          idea_set_label: idea.idea_set_label
        }));

        // Transform only the explicitly accepted ideas
        const transformedAcceptedIdeas = (projectData.acceptedIdeas || []).map(idea => ({
          idea_id: idea.id,
          product_name: idea.title,
          description: idea.description,
          visualization_prompt: idea.visualization_prompt,
          image_url: idea.image_url,
          idea_set: idea.idea_set,
          idea_set_label: idea.idea_set_label
        }));
  
        // Create generatedImages object only for accepted ideas
        const initialGeneratedImages = transformedAcceptedIdeas.reduce((acc, idea) => {
          if (idea.image_url) {
          if (idea.image_url.startsWith('https://') || idea.image_url.startsWith('http://')) {
            acc[idea.idea_id] = idea.image_url;
          } 
          // Otherwise, handle as base64
          else {
            acc[idea.idea_id] = idea.image_url.startsWith('data:image') 
              ? idea.image_url 
              : `data:image/png;base64,${idea.image_url}`;
          }
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

        // Ensure ideaMetadata preserves visualization_prompt
        const enhancedIdeaMetadata = Object.entries(projectData.ideaMetadata || {}).reduce((acc, [key, value]) => {
          acc[key] = {
            ...value,
            baseData: {
              ...value.baseData,
              visualization_prompt: value.baseData?.visualization_prompt || 
                                  allIdeas.find(i => i.idea_id.toString() === key)?.visualization_prompt
            }
          };
          return acc;
        }, {});

      // Process version history to handle Azure blob URLs
      const processedVersionHistory = {};
      if (projectData.versionHistory) {
        Object.entries(projectData.versionHistory).forEach(([ideaId, history]) => {
          if (history.image_versions) {
            // Process image versions to handle Azure URLs
            const processedImageVersions = history.image_versions.map(version => {
              // If it has an Azure URL, ensure it's used
              if (version.azure_url) {
                return {
                  ...version,
                  image_url: version.azure_url // Prioritize Azure URL
                };
              }
              // If it has a base64 image, ensure it's formatted correctly
              else if (version.image_url && !version.image_url.startsWith('data:')) {
                return {
                  ...version,
                  image_url: `data:image/png;base64,${version.image_url}`
                };
              }
              return version;
            });
            
            processedVersionHistory[ideaId] = {
              ...history,
              image_versions: processedImageVersions
            };
          } else {
            processedVersionHistory[ideaId] = history;
          }
        });
      }

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
        ideaMetadata: enhancedIdeaMetadata,
        versionHistory: processedVersionHistory,
        ideaSetCounter: projectData.ideaSetCounter,
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