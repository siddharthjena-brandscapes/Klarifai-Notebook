import React, { useState, useEffect } from "react";
import {
  FileSearch,
  Lightbulb,
  Lock,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Upload,
  MessageSquare,
  Wand2,
  Download,
  Database,
  Network,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./dashboard/Header";
import { coreService } from "../utils/axiosConfig";
import EditProject from "./EditProject";

const modules = [
  {
    id: "document-qa",
    name: "Document Q&A",
    description:
      "Upload and chat with your documents to get instant summaries, accurate answers, and key insights, powered by AI.",
    path: "/dashboard",
    icon: FileSearch,
    actionText: "Chat with Docs",
    active: true,
    features: [
      {
        id: "upload",
        name: "Upload Documents",
        icon: Upload,
        description: "Upload your documents for analysis",
      },
      {
        id: "chat",
        name: "Chat Interface",
        icon: MessageSquare,
        description: "Ask questions about your documents",
      },
      {
        id: "download",
        name: "Export Results",
        icon: Download,
        description: "Download insights and summaries",
      },
    ],
  },
  {
    id: "idea-generator",
    name: "Idea Generator",
    description:
      "Unleash creativity with AI-powered brainstorming! Generate innovative ideas, stunning visuals, and smart solutions effortlessly.",
    path: "/idea-generation",
    actionText: "Generate Ideas",
    icon: Lightbulb,
    active: true,
    features: [
      {
        id: "generate",
        name: "Generate Ideas",
        icon: Wand2,
        description: "Create new ideas based on your input",
      },
      {
        id: "refine",
        name: "Refine Ideas",
        icon: MessageSquare,
        description: "Improve and iterate on generated ideas",
      },
      {
        id: "export",
        name: "Export Ideas",
        icon: Download,
        description: "Save and export your ideas",
      },
    ],
  },
  {
    id: "topic-modeling",
    name: "Topic Modeling",
    description:
      "A smart data analysis tool that extracts topics and provides natural language insights.",
    path: "/topic-modeling",
    actionText: "Analyze Topics",
    icon: Lock,
    active: false,
    features: [
      {
        id: "upload",
        name: "Upload Images",
        icon: Upload,
        description: "Upload images for analysis",
      },
      {
        id: "analyze",
        name: "Analyze Content",
        icon: Wand2,
        description: "Get AI-powered insights about your images",
      },
      {
        id: "export",
        name: "Export Analysis",
        icon: Download,
        description: "Download analysis results",
      },
    ],
  },
  {
    id: "structured-data-query",
    name: "Structured Data Query",
    description:
      "Transform natural language into precise SQL queries, enabling intuitive data exploration without complex database syntax.",
    path: "/structured-data-query",
    actionText: "Start Querying",
    icon: Lock,
    active: false,
    features: [
      {
        id: "create",
        name: "Create Content",
        icon: Wand2,
        description: "Generate new content with AI",
      },
      {
        id: "edit",
        name: "Edit & Refine",
        icon: MessageSquare,
        description: "Refine and polish generated content",
      },
      {
        id: "export",
        name: "Export Content",
        icon: Download,
        description: "Download your content",
      },
    ],
  },
];

const categories = [
  "Business",
  "Healthcare",
  "Beauty & Wellness",
  "Education",
  "Technology",
  "Other",
];

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentView, setCurrentView] = useState("create");
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [currentModule, setCurrentModule] = useState({
    moduleId: null,
    featureId: null,
  });
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    category: "",
    customCategory: "",
    selected_modules: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const navigate = useNavigate();

  // Load projects from API on initial render
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const fetchedProjects = await coreService.getProjects();
        setProjects(fetchedProjects);
      } catch (err) {
        console.error("Error loading projects:", err);
        setError("Failed to load projects");
      }
    };

    loadProjects();
  }, []);

  // Welcome screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
      setCurrentView(projects.length > 0 ? "projects" : "create");
    }, 2000);
    return () => clearTimeout(timer);
  }, [projects.length]);

  const formatDate = (dateString) => {
    console.log("Formatting date:", dateString, typeof dateString);

    if (!dateString) {
      console.log("Date string is empty or null");
      return "Date not available";
    }

    try {
      const date = new Date(dateString);
      console.log("Parsed date:", date, "Valid:", !isNaN(date.getTime()));

      if (isNaN(date.getTime())) {
        console.log("Invalid date object created");
        return "Invalid date";
      }

      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const formatTime = (dateString) => {
    console.log("Formatting time:", dateString, typeof dateString);

    if (!dateString) {
      console.log("Time string is empty or null");
      return "Time not available";
    }

    try {
      const date = new Date(dateString);
      console.log("Parsed time:", date, "Valid:", !isNaN(date.getTime()));

      if (isNaN(date.getTime())) {
        console.log("Invalid time object created");
        return "Invalid time";
      }

      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid time";
    }
  };

  const handleModuleToggle = (moduleId) => {
    const selectedModule = modules.find((m) => m.id === moduleId);

    if (selectedModule && selectedModule.active) {
      setProjectData((prev) => ({
        ...prev,
        selected_modules: prev.selected_modules.includes(moduleId)
          ? prev.selected_modules.filter((id) => id !== moduleId)
          : [...prev.selected_modules, moduleId],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Use custom category if "Other" is selected
    const finalCategory =
      projectData.category === "Other"
        ? projectData.customCategory
        : projectData.category;

    // Validate required fields
    if (!projectData.name || !projectData.description || !finalCategory) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    // Validate custom category if "Other" is selected
    if (
      projectData.category === "Other" &&
      !projectData.customCategory.trim()
    ) {
      setError("Please enter a custom category");
      setLoading(false);
      return;
    }

    // Validate at least one module is selected
    if (projectData.selected_modules.length === 0) {
      setError("Please select at least one module");
      setLoading(false);
      return;
    }

    try {
      // Create project with selected modules and module-specific data
      const moduleData = projectData.selected_modules.map((moduleId) => ({
        moduleId,
        projectName: projectData.name,
        settings: {}, // Can be expanded for module-specific settings
        status: "active",
      }));

      const response = await coreService.createProject({
        ...projectData,
        category: finalCategory,
        modules: moduleData,
      });
      if (response.status === "success") {
        const newProject = {
          ...response.project,
          moduleAssociations: moduleData,
        };
        setProjects((prev) => [...prev, newProject]);
        setCurrentProject(newProject);
        setCurrentView("modules");

        // Reset form
        setProjectData({
          name: "",
          description: "",
          category: "",
          customCategory: "",
          selected_modules: [],
        });
      } else {
        setError(response.message || "Failed to create project");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await coreService.deleteProject(projectId);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));

      if (currentProject && currentProject.id === projectId) {
        setCurrentProject(null);
        setCurrentView("projects");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project");
    }
  };

  // Add these handler functions
  const handleEditClick = (project) => {
    setEditingProject(project);
    setIsEditing(true);
  };

  const handleEditClose = () => {
    setIsEditing(false);
    setEditingProject(null);
  };

  const handleProjectUpdate = (updatedProject) => {
    // Update the projects list with the updated project
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );

    // If this is the current project, update it too
    if (currentProject && currentProject.id === updatedProject.id) {
      setCurrentProject(updatedProject);
    }
  };

  const handleProjectSelect = async (project) => {
    try {
      const projectDetails = await coreService.getProjectDetails(project.id);
      setCurrentProject(projectDetails);
      setCurrentView("modules");
      setCurrentModule({ moduleId: null, featureId: null });
    } catch (err) {
      console.error("Error loading project details:", err);
      setError("Failed to load project details");
    }
  };

  const renderModuleContent = (moduleId) => {
    const module = modules.find((m) => m.id === moduleId);
    const projectName = currentProject?.name || "";

    return (
      <div className="relative group">
        {/* Main module card with enhanced styling */}
        <div
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-emerald-500/20 
                      hover:border-emerald-500/40 transition-all duration-300 
                      transform hover:-translate-y-1 hover:shadow-xl
                      cursor-pointer overflow-hidden"
        >
          {/* Top section with icon and name */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div
                className="p-4 bg-emerald-600/20 rounded-lg group-hover:bg-emerald-600/30 
                            transition-colors transform group-hover:scale-110"
              >
                <module.icon className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3
                  className="text-2xl font-bold text-white group-hover:text-emerald-400 
                             transition-colors mb-1"
                >
                  {module.name}
                </h3>
                <span className="text-sm text-emerald-300/80">
                  {projectName}
                </span>
              </div>
            </div>

            {/* Action button */}
            <button
              className="px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-lg 
                           opacity-0 group-hover:opacity-100 transition-all duration-300 
                           hover:bg-emerald-600/40 flex items-center space-x-2"
            >
              <span>{module.actionText}</span>
              <ArrowLeft className="w-4 h-4 transform rotate-180" />
            </button>
          </div>

          {/* Module description */}
          <p className="text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
            {module.description}
          </p>

          {/* Bottom section with status indicator */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm text-emerald-300/80">Active</span>
            </div>

            {/* Module type badge */}
            <span className="text-xs px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full">
              {module.id === "document-qa"
                ? "Document Q&A"
                : module.id
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
            </span>
          </div>
        </div>

        {/* Background glow effect */}
        <div
          className="absolute inset-0 bg-emerald-500/5 rounded-xl blur-xl 
                      opacity-0 group-hover:opacity-100 transition-opacity 
                      duration-300 -z-10"
        ></div>
      </div>
    );
  };

  const handleModuleSelect = (moduleId) => {
    const selectedModule = modules.find((m) => m.id === moduleId);

    if (selectedModule) {
      // Include project information in navigation
      const projectId = currentProject?.id;
      const projectName = currentProject?.name;

      if (moduleId === "document-qa") {
        // Navigate to document-qa module (dashboard path)
        navigate(`/dashboard/${projectId}`, {
          state: { projectName, projectId },
        });
      } else if (moduleId === "idea-generator") {
        // Navigate to idea generation module
        navigate(`/idea-generation/${projectId}`, {
          state: { projectName, projectId },
        });
      } else {
        // Handle other modules
        navigate(selectedModule.path, {
          state: { projectName, projectId },
        });
      }

      setCurrentModule({ moduleId, featureId: null });
    }
  };

  const handleFeatureSelect = (featureId) => {
    setCurrentModule((prev) => ({ ...prev, featureId }));
  };

  const handleModuleBack = () => {
    if (currentModule.featureId) {
      setCurrentModule((prev) => ({ ...prev, featureId: null }));
    } else {
      setCurrentModule({ moduleId: null, featureId: null });
    }
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Klarifai
          </h1>
          <p className="text-xl text-gray-300">Preparing your workspace...</p>
        </div>
      </div>
    );
  }
  if (currentView === "modules" && currentProject) {
    const selectedModule = currentModule.moduleId
      ? modules.find((m) => m.id === currentModule.moduleId)
      : null;

    if (selectedModule && currentModule.moduleId) {
      const selectedFeature = currentModule.featureId
        ? selectedModule.features.find((f) => f.id === currentModule.featureId)
        : null;

      return (
        <div className="min-h-screen bg-gray-900 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={handleModuleBack}
                className="flex items-center text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Modules
              </button>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-white">
                  {selectedModule.name}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {selectedModule.features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureSelect(feature.id)}
                  type="button"
                  className="w-full text-left bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-600/20 rounded-lg group-hover:bg-emerald-600/30 transition-colors">
                      <feature.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {feature.name}
                      </h3>
                      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        {feature.description}
                      </p>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transform rotate-180 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-900 p-4">
        <Header />
        <div className="max-w-6xl mx-auto pt-16">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView("projects")}
              className="flex items-center text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Projects
            </button>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-white">
                {currentProject.name}
              </h2>
              <p className="text-gray-400">{currentProject.category}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentProject.selected_modules.map((moduleId) => {
              const module = modules.find((m) => m.id === moduleId);
              if (!module) return null;

              return (
                <div
                  key={moduleId}
                  onClick={() => handleModuleSelect(moduleId)}
                  className="cursor-pointer"
                >
                  {renderModuleContent(moduleId)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === "projects") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-900 p-8">
        {isEditing && editingProject && (
          <EditProject
            project={editingProject}
            modules={modules}
            onClose={handleEditClose}
            onUpdate={handleProjectUpdate}
          />
        )}
        <Header />
        <div className="max-w-6xl mx-auto pt-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">My Projects</h1>
            <button
              onClick={() => setCurrentView("create")}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create new Project</span>
            </button>
          </div>

          <div className="grid gap-6">
            {projects.length > 0 ? (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-gray-800/50 backdrop-blur-sm rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleProjectSelect(project)}
                      >
                        <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-gray-400 mt-2">
                          {project.description}
                        </p>
                      </div>
                      <span className="px-4 py-1.5 bg-emerald-600/20 text-emerald-300 rounded-full text-sm font-medium">
                        {project.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-4">
                      {project.selected_modules?.map((moduleId) => {
                        const module = modules.find((m) => m.id === moduleId);
                        if (!module) return null;
                        return (
                          <span
                            key={moduleId}
                            className="px-3 py-1.5 bg-gray-700/50 text-gray-300 rounded-full text-sm flex items-center"
                          >
                            <module.icon className="w-4 h-4 mr-2 text-emerald-400" />
                            {module.name}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-emerald-400" />
                          {formatDate(project.created_at)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                          {formatTime(project.created_at)}
                        </span>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(project);
                          }}
                          className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleProjectSelect(project)}
                          className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg transition-colors flex items-center group"
                        >
                          Open
                          <ArrowLeft className="w-4 h-4 ml-2 transform rotate-180 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-emerald-500/20">
                <p className="text-xl text-white mb-4">No projects yet</p>
                <p className="text-gray-400">
                  Create your first project to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-900 p-8">
      <Header />
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
          {projects.length > 0 && (
            <button
              onClick={() => setCurrentView("projects")}
              className="text-emerald-300 hover:text-white transition-colors"
            >
              Go to your Project
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Project Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter a unique, descriptive name"
                value={projectData.name}
                onChange={(e) =>
                  setProjectData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe your project's goals and objectives"
                rows={3}
                value={projectData.description}
                onChange={(e) =>
                  setProjectData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-4">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-200 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={projectData.category}
                onChange={(e) =>
                  setProjectData((prev) => ({
                    ...prev,
                    category: e.target.value,
                    // Reset custom category when switching away from "Other"
                    customCategory:
                      e.target.value === "Other" ? prev.customCategory : "",
                  }))
                }
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                    className="bg-gray-800"
                  >
                    {category}
                  </option>
                ))}
              </select>

              {/* Dynamic custom category input */}
              {projectData.category === "Other" && (
                <div className="mt-4">
                  <label
                    htmlFor="customCategory"
                    className="block text-sm font-medium text-gray-200 mb-2"
                  >
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    id="customCategory"
                    className="w-full px-4 py-2 bg-white/5 border border-gray-300/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your custom category"
                    value={projectData.customCategory}
                    onChange={(e) =>
                      setProjectData((prev) => ({
                        ...prev,
                        customCategory: e.target.value,
                      }))
                    }
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
            <h3 className="text-xl font-semibold text-white mb-4">
              Available Modules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    module.active
                      ? "cursor-pointer " +
                        (projectData.selected_modules.includes(module.id)
                          ? "bg-emerald-600/20 border-emerald-500"
                          : "bg-white/5 border-gray-300/20 hover:bg-white/10")
                      : "opacity-50 cursor-not-allowed bg-gray-800 border-gray-700"
                  }`}
                  onClick={() => handleModuleToggle(module.id)}
                >
                  <div className="flex items-center space-x-4">
                    {module.active ? (
                      <module.icon className="w-8 h-8 text-purple-400 flex-shrink-0" />
                    ) : (
                      <Lock className="w-8 h-8 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-lg">
                        {module.name}
                      </h4>
                      <p className="text-sm text-gray-300 mt-1">
                        {module.active
                          ? module.description
                          : "This module is currently locked. Coming soon!"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
