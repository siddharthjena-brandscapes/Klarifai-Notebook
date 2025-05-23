import React, { useState, useEffect } from "react";
import {
  FileSearch,
  Lightbulb,
  Lock,
  Plus,
  ArrowLeft,
  Clock,
  Upload,
  MessageSquare,
  Wand2,
  Download,
  FileText,
  AlertCircle,
  Loader,
  Archive,
  Search,
  ChevronDown,
  Menu,
  Star,
  Edit,
  Trash,
  ArrowRight,
  FolderOpen,
  Edit2,
  Check,
  Paperclip,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "./dashboard/Header";
import { coreService } from "../utils/axiosConfig";
import EditProject from "./EditProject";
import DeleteProjectModal from "./DeleteProjectModal";
import FaqButton from "./faq/FaqButton";
import ArchiveProjectModal from "./LandingPage/ArchiveProjectModal";
import ArchivedProjects from "./LandingPage/ArchivedProjects";

const allModules = [
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  // State for current user and modules accessible to the user
  const [currentUser, setCurrentUser] = useState(null);
  const [modules, setModules] = useState(allModules);
  const navigate = useNavigate();

  // Add these new state variables for document upload
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle"); // 'idle', 'uploading', 'success', 'error'
  const [enhanceLoading, setEnhanceLoading] = useState(false);

  // Add these new state variables in the App component
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("recent");
  const [activeMenu, setActiveMenu] = useState(null);

  // Add this function to handle menu toggle
  const toggleMenu = (projectId, e) => {
    e.stopPropagation();
    if (activeMenu === projectId) {
      setActiveMenu(null);
    } else {
      setActiveMenu(projectId);
    }
  };

  // Add a comprehensive effect to clear errors when any key action happens
useEffect(() => {
  // This effect clears errors whenever key user interactions happen
  const clearErrorsOnAction = (e) => {
    // Clear errors on key actions like clicking buttons or typing
    if (e.type === 'keydown' || e.type === 'click') {
      if (error) setError(null);
      if (uploadError) setUploadError(null);
    }
  };
  
  // Add event listeners for global interactions that should clear errors
  document.addEventListener('keydown', clearErrorsOnAction);
  document.addEventListener('click', clearErrorsOnAction);
  
  return () => {
    document.removeEventListener('keydown', clearErrorsOnAction);
    document.removeEventListener('click', clearErrorsOnAction);
  };
}, [error, uploadError]);

// Clear error message when form fields change
useEffect(() => {
  if (error) {
    setError(null);
  }
}, [projectData.name, projectData.description, projectData.category, projectData.customCategory, projectData.selected_modules]);

  // Add this effect to close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Add these functions to your App component

  const handleArchiveClick = (project) => {
    setProjectToArchive(project);
    setArchiveModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!projectToArchive) return;

    try {
      await coreService.archiveProject(projectToArchive.id);

      // Remove from active projects
      setProjects((prev) => prev.filter((p) => p.id !== projectToArchive.id));

      // Reset and close modal
      setArchiveModalOpen(false);
      setProjectToArchive(null);
    } catch (err) {
      console.error("Error archiving project:", err);
      setError("Failed to archive project");
    }
  };

  const handleRestoreProject = async (projectId) => {
    try {
      // Reload the projects list to include the newly restored project
      const fetchedProjects = await coreService.getProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      console.error("Error updating projects after restore:", err);
      setError("Failed to update project list");
    }
  };

  // This function toggles between active and archived projects view
  const toggleArchivedView = () => {
    setShowArchived((prev) => !prev);
  };

  // Load projects and current user data from API on initial render
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load user information
        const userInfo = await coreService.getCurrentUser();
        setCurrentUser(userInfo);

        // Filter out modules that are disabled for this user
        if (userInfo && userInfo.disabled_modules) {
          const filteredModules = allModules.filter(
            (module) => !userInfo.disabled_modules[module.id]
          );
          setModules(filteredModules);
        }

        // Load projects
        const fetchedProjects = await coreService.getProjects();
        setProjects(fetchedProjects);
      } catch (err) {
        console.error("Error loading initial data:", err);
        setError("Failed to load data");
      }
    };

    loadInitialData();
  }, []);

  // We've moved the project loading to the loadInitialData function above

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

  const handleEnhanceDescription = async () => {
    // Clear any existing errors before starting the enhancement process
    setError(null);
    setUploadError(null);
    if (
      !projectData.description ||
      projectData.description.trim().length < 10
    ) {
      setError(
        "Please write a more detailed description before enhancing with AI."
      );
      return;
    }

    setEnhanceLoading(true);

    try {
      const response = await coreService.enhancePromptWithAI(
        projectData.description
      );

      if (response.status === "success") {
        const cleanedDescription = cleanDescription(response.enhanced_prompt);
        setProjectData((prev) => ({
          ...prev,
          description: cleanedDescription,
        }));
        setError(null);
      } else {
        setError(response.message || "Failed to enhance description.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred while enhancing the description."
      );
      console.error("Enhancement error:", err);
    } finally {
      setEnhanceLoading(false);
    }
  };

  // Add these handler functions for document uploads
 // In the handleDocumentChange function, update the file type check to include .txt files
const handleDocumentChange = (e) => {
  const selectedFile = e.target.files[0];

  // Clear previous upload errors as the user is taking action
  setUploadError(null);

  if (!selectedFile) {
    setDocumentFile(null);
    return;
  }

  // Check file type
  const fileType = selectedFile.type;
  const fileExtension = selectedFile.name.split(".").pop().toLowerCase();

  if (
    !(
      fileType === "application/pdf" ||
      fileExtension === "pdf" ||
      fileType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      fileExtension === "pptx" ||
      fileType === "text/plain" ||
      fileExtension === "txt"
    )
  ) {
    setUploadError("Please upload a PDF, PowerPoint (PPTX), or text (TXT) file.");
    setDocumentFile(null);
    return;
  }

  // Clear any previous errors and set the file
  setUploadError(null);
  setDocumentFile(selectedFile);
};

  const cleanDescription = (text) => {
    if (!text) return text;
    
    // Remove markdown formatting
    return text
      .replace(/^#+\s*/gm, '')      // Remove headers (e.g., ##, ###)
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold **
      .replace(/__(.*?)__/g, '$1')      // Remove underline __
      .replace(/\*(.*?)\*/g, '$1')      // Remove italic *
      .replace(/_(.*?)_/g, '$1')        // Remove italic _
      .replace(/^\*\s+/gm, '• ')        // Convert * bullets to • 
      .replace(/^-\s+/gm, '• ')         // Convert - bullets to •
      // .replace(/\s{2,}/g, ' ')          // Replace multiple spaces with single space
      // .replace(/\n{3,}/g, '\n\n')       // Limit consecutive newlines to 2
      .trim();
  };

  const handleGenerateDescription = async () => {
    if (!documentFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setUploadLoading(true);
    setUploadStatus("uploading");
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("document", documentFile);

      const response = await coreService.uploadDocumentForPrompt(documentFile);

      if (response.status === "success") {
        setUploadStatus("success");
        const cleanedDescription = cleanDescription(response.prompt);
        setProjectData((prev) => ({
          ...prev,
          description: cleanedDescription,
        }));
      } else {
        setUploadStatus("error");
        setUploadError(
          response.message || "Failed to generate description from document."
        );
      }
    } catch (err) {
      setUploadStatus("error");
      setUploadError(
        err.response?.data?.message || "An error occurred during file upload."
      );
      console.error("Upload error:", err);
    } finally {
      setUploadLoading(false);
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
    if (!projectData.name || !finalCategory) {
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

  const handleProjectUpdate = async (projectId, updatedData) => {
    try {
      console.log(
        "Updating project with ID:",
        projectId,
        "and data:",
        updatedData
      );
      const updatedProject = await coreService.updateProject(
        projectId,
        updatedData
      );

      console.log("Successfully received updated project:", updatedProject);

      // Update projects array
      setProjects((prevProjects) =>
        prevProjects.map((p) => (p.id === projectId ? updatedProject : p))
      );

      // Update current project if needed
      if (currentProject && currentProject.id === projectId) {
        setCurrentProject(updatedProject);
      }

      // Close edit form
      setIsEditing(false);
      setEditingProject(null);
    } catch (error) {
      console.error("Project update failed:", error);
      setError(
        "Failed to update project: " + (error.message || "Unknown error")
      );
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
                className="p-
                            transition-colors transform group-hover:scale-110"
              >
                <module.icon className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="flex flex-col px-2 py-0.5 border-l-2">
                <h3
                  className="text-xl font-normal text-emerald-300/80 leading-tight group-hover:text-emerald-400 
                             transition-colors mb-1 "
                >
                  {module.name}
                </h3>
                <span className="text-xs font-medium text-gray-300">
                  {projectName}
                </span>
              </div>
            </div>

            {/* Action button */}
            <button
              className="px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-lg 
                           opacity-0 group-hover:opacity-100 transition-all duration-300 
                           hover:bg-emerald-800/40 flex items-center space-x-2"
            >
              <span className="text-sm font-medium  text-gray-300 hover:text-emerald-300">{module.actionText}</span>
              <ArrowLeft className="w-4 h-4 text-gray-300 transform rotate-180" />
            </button>
          </div>

          {/* Module description */}
          <p className="text-gray-400 text-base font-light tracking-wide leading-relaxed mb-5 flex-grow line-clamp-3">
            {module.description}
          </p>

          {/* Bottom section with status indicator */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-sm text-emerald-300/80">Active</span>
            </div>

            {/* Module type badge */}
            <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-md text-xs whitespace-nowrap flex items-center flex-shrink-0">
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
      <div className="fixed inset-0 z-50">
    {/* Background with gradient and subtle pattern */}
    <div className="absolute inset-0 bg-[#f7f3ea] dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-emerald-900 overflow-hidden">
      {/* Light theme decorative elements */}
      <div className="hidden dark:hidden lg:block absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#e9dcc9]/40 backdrop-blur-3xl"></div>
      <div className="hidden dark:hidden lg:block absolute top-1/4 -left-16 w-64 h-64 rounded-full bg-[#a55233]/10 backdrop-blur-3xl"></div>
      <div className="hidden dark:hidden lg:block absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-[#556052]/10 backdrop-blur-3xl"></div>
      
      {/* Dark theme decorative elements */}
      <div className="hidden dark:lg:block absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"></div>
      <div className="hidden dark:lg:block absolute top-1/4 -left-16 w-64 h-64 rounded-full bg-emerald-800/10 blur-3xl"></div>
      <div className="hidden dark:lg:block absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-emerald-400/5 blur-3xl"></div>
    </div>
    
    {/* Content container with glass effect */}
    <div className="relative h-full flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full mx-auto text-center p-8 rounded-2xl bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-emerald-500/10 shadow-2xl animate-fade-in">
        {/* Logo or brand icon */}
        <div className="inline-flex items-center justify-center mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#a55233] to-[#8b4513] dark:from-emerald-600 dark:to-emerald-800 shadow-lg mx-auto animate-pulse-slow">
          <FileSearch className="w-10 h-10 text-white" />
        </div>
        
        {/* Text content with staggered animations */}
        <div className="space-y-4">
          <h1 className="text-4xl font-serif text-[#0a3b25] dark:text-white mb-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            Welcome to Klarifai
          </h1>
          
          <p className="text-lg font-light text-[#5e4636] dark:text-gray-300 mb-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          AI-Powered Workspace
          </p>
          
          <div className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center justify-center space-x-2 text-[#5a544a] dark:text-gray-400">
              <span className="inline-block w-2 h-2 bg-[#a55233] dark:bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
              <span className="inline-block w-2 h-2 bg-[#a55233] dark:bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="inline-block w-2 h-2 bg-[#a55233] dark:bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
            <p className="text-sm font-medium text-[#5a544a] dark:text-gray-400 mt-2">
              Preparing your workspace...
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer text */}
      <div className="absolute bottom-8 text-center text-[#5a544a] dark:text-gray-500 text-sm opacity-70 animate-fade-in" style={{ animationDelay: '1s' }}>
        <p>© 2025 Klarifai • Intelligent Document Solutions</p>
      </div>
    </div>
  </div>
    );
  }
  if (currentView === "modules" && currentProject) {
    // Only include modules that are not disabled for the current user
    const allowedModules = currentProject.selected_modules.filter(
      (moduleId) => {
        // Check if the module exists in the filtered modules list
        return modules.some((m) => m.id === moduleId);
      }
    );

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allowedModules.map((moduleId) => {
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

              {allowedModules.length === 0 && (
                <div className="col-span-2 text-center py-12 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-emerald-500/20">
                  <p className="text-xl text-white mb-4">
                    No available modules
                  </p>
                  <p className="text-gray-400">
                    Your access to the modules in this project has been
                    restricted. Please contact an administrator.
                  </p>
                </div>
              )}
            </div>
            <div className=" md:grid-cols-3 gap-6">
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
      <div className="min-h-screen bg-[#faf4ee] dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-emerald-900 p-4">
  <Header />
  <div className="max-w-6xl mx-auto pt-16">
    <div className="flex items-center justify-between mb-8">
      <button
        onClick={() => setCurrentView("projects")}
        className="flex items-center text-[#5e4636] hover:text-[#a55233] dark:text-emerald-300 dark:hover:text-emerald-200 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2 text-[#a68a70] dark:text-gray-300" />
        <span className="hidden md:inline text-[#5e4636] dark:text-gray-300 font-medium">Back to Projects</span>
      </button>
      <div className="text-right">
        <h2 className="text-2xl font-serif text-[#0a3b25] dark:text-white">
          {currentProject.name}
        </h2>
        <p className="text-[#5a544a] dark:text-gray-400 font-medium text-sm">{currentProject.category}</p>
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
            <div className="relative group">
              <div
                className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-[#d6cbbf] dark:border-emerald-500/20 
                      hover:border-[#a68a70] dark:hover:border-emerald-500/40 transition-all duration-300 
                      transform hover:-translate-y-1 hover:shadow-xl
                      cursor-pointer overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="transition-colors transform group-hover:scale-110">
                      <module.icon className="w-8 h-8 text-[#a55233] dark:text-emerald-400" />
                    </div>
                    <div className="flex flex-col px-2 py-0.5 border-l-2 border-[#a55233] dark:border-emerald-400">
                      <h3 className="text-xl font-normal font-serif text-[#0a3b25] dark:text-emerald-300/80 leading-tight group-hover:text-[#a55233] dark:group-hover:text-emerald-400 transition-colors mb-1">
                        {module.name}
                      </h3>
                      <span className="text-xs font-medium text-[#5a544a] dark:text-gray-300">
                        {currentProject.name}
                      </span>
                    </div>
                  </div>

                  <button className="px-4 py-2 bg-[#556052]/20 dark:bg-emerald-600/20 text-[#556052] dark:text-emerald-300 rounded-lg 
                           opacity-0 group-hover:opacity-100 transition-all duration-300 
                           hover:bg-[#556052]/30 dark:hover:bg-emerald-800/40 flex items-center space-x-2">
                    <span className="text-sm font-medium text-[#556052] dark:text-gray-300 hover:text-[#0a3b25] dark:hover:text-emerald-300">
                      {module.actionText}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#556052] dark:text-gray-300" />
                  </button>
                </div>

                <p className="text-gray-700 dark:text-gray-400 text-base font-light tracking-wide leading-relaxed mb-5 flex-grow line-clamp-3">
                  {module.description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#a55233] dark:bg-emerald-400 animate-pulse"></div>
                    <span className="text-sm text-[#5e4636] dark:text-emerald-300/80">Active</span>
                  </div>

                  <span className="px-2 py-1 bg-[#e8ddcc] dark:bg-gray-700/50 text-[#5a544a] dark:text-gray-300 rounded-md text-xs whitespace-nowrap flex items-center flex-shrink-0">
                    {module.id === "document-qa"
                      ? "Document Q&A"
                      : module.id
                          .split("-")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                  </span>
                </div>
              </div>

              <div className="absolute inset-0 bg-[#a55233]/5 dark:bg-emerald-500/5 rounded-xl blur-xl 
                      opacity-0 group-hover:opacity-100 transition-opacity 
                      duration-300 -z-10"></div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
  <FaqButton />
</div>
    );
  }

  if (currentView === "projects") {
    if (showArchived) {
      return (
        <ArchivedProjects
          onBack={() => setShowArchived(false)}
          onRestoreProject={handleRestoreProject}
        />
      );
    }

    // Define filter and sort functions BEFORE using them
    const filteredProjects = projects.filter((project) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(query) ||
        (project.description &&
          project.description.toLowerCase().includes(query)) ||
        project.category.toLowerCase().includes(query)
      );
    });

    console.log("Project data before sorting:", filteredProjects.map(p => ({
      id: p.id,
      name: p.name,
      updated_at: p.updated_at,
      created_at: p.created_at
    })));

    const handleProjectUpdate = async (projectId, updatedData) => {
      try {
        // Your existing update code
        await coreService.updateProject(projectId, updatedData);
        
        // Important: Fetch the updated project list after update
        const refreshedProjects = await coreService.getProjects();
        setProjects(refreshedProjects);
        
        // Close the editing UI
        setIsEditing(false);
        setEditingProject(null);
      } catch (error) {
        // Error handling
      }
    };

    

// More robust sorting function
const sortedProjects = [...filteredProjects].sort((a, b) => {
  if (sortOption === "recent") {
    // Make sure we have valid date strings before parsing
    const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 
                  a.created_at ? new Date(a.created_at).getTime() : 0;
    
    const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 
                  b.created_at ? new Date(b.created_at).getTime() : 0;
    
    // Add debugging
    console.log(`Comparing: ${a.name} - updated: ${a.updated_at}, created: ${a.created_at}, time: ${aTime}`);
    console.log(`With: ${b.name} - updated: ${b.updated_at}, created: ${b.created_at}, time: ${bTime}`);
    
    return bTime - aTime; // Newest first
  } else if (sortOption === "created") {
    // Handle any potential missing created_at values
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    
    return bTime - aTime; // Newest first
  }
  return 0;
});
// Add this debug statement after sorting
console.log("Projects after sorting:", sortedProjects.map(p => ({
  id: p.id,
  name: p.name,
  created_at: p.created_at,
  updated_at: p.updated_at
})));

    return (
      <div className="min-h-screen dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-emerald-900 bg-[#f7f3ea] p-6">
        {isEditing && editingProject && (
          <EditProject
            project={editingProject}
            modules={modules}
            onClose={handleEditClose}
            onUpdate={handleProjectUpdate}
          />
        )}

        {/* Archive Project Modal */}
        {archiveModalOpen && projectToArchive && (
          <ArchiveProjectModal
            isOpen={archiveModalOpen}
            onClose={() => setArchiveModalOpen(false)}
            onConfirm={handleArchiveConfirm}
            projectName={projectToArchive.name}
          />
        )}

        {/* Delete Project Modal */}
        {deleteModalOpen && projectToDelete && (
          <DeleteProjectModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={() => {
              handleDeleteProject(projectToDelete.id);
              setDeleteModalOpen(false);
              setProjectToDelete(null);
            }}
            projectName={projectToDelete.name}
          />
        )}

        <Header />

        <div className="max-w-7xl mx-auto pt-10">
          {/* Page title and main actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-4xl font-serif dark:text-white text-emerald-900 mb-4 md:mb-0">
              Projects
            </h1>
            <button
              onClick={() => setCurrentView("create")}
              className="px-5 py-2.5 dark:bg-white bg-[#a55233] hover:bg-[#8b4513] text-white font-medium rounded-lg transition-colors flex items-center space-x-2 shadow-sm"
              title="Create a new project"
            >
              <Plus className="w-5 h-5 mr-0.5 dark:text-slate-950" />
              <span className="text-sm dark:text-slate-950 font-medium pb-0.5">New project</span>
            </button>
          </div>

          {/* Search and filter row */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 dark:text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 dark:bg-gray-800/80 bg-white/80 border  dark:border-gray-700  border-[#d6cbbf] rounded-lg dark:text-white text-gray-800 dark:placeholder-gray-400 placeholder-gray-500 focus:ring-2 dark:focus:ring-emerald-500/50 focus:ring-[#a55233] focus:border-[#a55233] dark:focus:border-emerald-500/50"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={toggleArchivedView}
                className="px-4 py-2.5 dark:bg-gray-800/80 bg-white/80 border  dark:border-gray-700  border-[#d6cbbf] rounded-lg dark:text-white text-[#5e4636] dark:placeholder-gray-400 placeholder-gray-500 focus:ring-2 dark:focus:ring-emerald-500/50 focus:ring-[#a55233] focus:border-[#a55233] dark:focus:border-emerald-500/50  transition-colors flex items-center space-x-2"
              >
                <Archive className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">View archived</span>
              </button>

              <div className="relative">
                <select
                  className="text-sm font-medium appearance-none block px-4 py-3 pr-5 dark:bg-gray-800/80 bg-white/80 border  dark:border-gray-700  border-[#d6cbbf] rounded-lg dark:text-white text-[#5e4636] dark:placeholder-gray-400 placeholder-gray-500 focus:ring-2 dark:focus:ring-emerald-500/50 focus:ring-[#a55233]  dark:focus:border-emerald-500/50 focus:border-[#a55233]"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="recent">Sort by: Recent activity</option>
                  <option value="created">Sort by: Recently created</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 dark:text-gray-400">
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Project grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProjects.map((project) => (
                <div
                key={project.id}
                className="group dark:bg-gray-800/40 bg-white dark:backdrop-blur-sm backdrop-blur-sm rounded-xl border dark:border-gray-700/50 border-[#e8ddcc] dark:hover:border-emerald-500/30 hover:border-[#a68a70] dark:hover:shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                  <div className="p-6 flex flex-col h-full">
                    {/* Card header with title and menu */}
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-0.5 text-xs font-medium dark:text-gray-300 text-[#5e4636] border-l-2 dark:border-emerald-400 border-[#a55233] pl-2">
                        {project.category}
                      </span>

                      <div className="relative">
                        <button
                          className="p-1 rounded-full dark:hover:bg-gray-700/50 hover:bg-[#f5e6d8] transition-colors"
                          onClick={(e) => toggleMenu(project.id, e)}
                        >
                          <Menu className="h-5 w-5 dark:text-gray-400 dark:hover:text-white text-gray-600 hover:text-[#5e4636]" />
                        </button>

                        {/* Menu dropdown - same as before */}
                        {activeMenu === project.id && (
                          <div className="absolute right-0 mt-2 w-40 dark:bg-gray-800 bg-white rounded-md shadow-lg border dark:border-gray-700  border-[#d6cbbf] z-10">
                            <div className="py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(project);
                                  setActiveMenu(null);
                                }}
                                className="w-full text-left px-8 py-2 text-sm text-[#5e4636] dark:text-gray-300 dark:hover:bg-gray-900/80 hover:bg-[#f5e6d8] hover:rounded-md flex items-center"
                              >
                                <Edit2 className="h-4 w-4 mr-2" /> Edit details
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveClick(project);
                                  setActiveMenu(null);
                                }}
                                className="w-full text-left px-8 py-2 text-sm text-[#5e4636] dark:text-gray-300 dark:hover:bg-gray-900/80 hover:bg-[#f5e6d8] hover:rounded-md flex items-center"
                              >
                                <Archive className="h-4 w-4 mr-2" /> Archive
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectToDelete(project);
                                  setDeleteModalOpen(true);
                                  setActiveMenu(null);
                                }}
                                className="w-full text-left px-8 py-2 text-sm dark:text-red-400 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/80 hover:rounded-md flex items-center"
                              >
                                <Trash className="h-4 w-4 mr-2" /> Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Project title - larger and more prominent */}
                    <h3
                      className=" text-xl dark:font-normal font-serif tracking-wide font-medium dark:text-white text-[#0a3b25] leading-tight dark:group-hover:text-emerald-400 group-hover:text-[#a55233] transition-colors mb-3 cursor-pointer"
                      onClick={() => handleProjectSelect(project)}
                    >
                      {project.name}
                    </h3>

                    {/* Project description - with better spacing */}
                    <p className="dark:text-gray-400 text-gray-700 text-sm dark:font-normal font-medium tracking-wide leading-relaxed mb-5 flex-grow line-clamp-3">
                      {project.description || "No description provided"}
                    </p>

                    {/* Bottom section with modules and date/open button */}
                    <div className="mt-auto">
                      {/* Modules in horizontal scroll if many */}
                      {project.selected_modules?.length > 0 && (
                        <div className="flex space-x-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                          {project.selected_modules?.map((moduleId) => {
                            const module = modules.find(
                              (m) => m.id === moduleId
                            );
                            if (!module) return null;
                            return (
                              <span
                                key={moduleId}
                                className="px-2 py-1 dark:bg-gray-700/50 bg-[#e8ddcc] dark:text-gray-300 text-[#5a544a] dark:font-normal rounded-md text-xs whitespace-nowrap flex items-center flex-shrink-0"
                              >
                                <module.icon className="w-3 h-3 mr-1.5" />
                                {module.name}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Footer with date and open button */}
                      <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700/30 dark:border-gray-700 border-[#e3d5c8]">
                        <div className="text-xs dark:text-gray-500 text-[#5a544a] flex items-center">
                          <Clock className="w-3 h-3 mr-1.5" />
                          Updated{" "}
                          {formatDate(project.updated_at || project.created_at)}
                        </div>

                        <button
                          onClick={() => handleProjectSelect(project)}
                          className="px-3 py-1.5 dark:bg-emerald-600/20 bg-[#556052]/20 dark:hover:bg-emerald-600/30 hover:bg-[#556052]/30 dark:text-emerald-300  text-[#556052] rounded-md transition-colors text-xs font-medium"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 dark:bg-gray-800/30 bg-white/50 backdrop-blur-sm rounded-xl border dark:border-gray-700/50 border-[#d6cbbf] shadow-sm">
              {searchQuery ? (
                <>
                  <Search className="w-16 h-16 mx-auto dark:text-gray-600 text-gray-400 mb-4" />
                  <p className="text-xl dark:text-white text-[#5e4636] mb-2">
                    No matching projects found
                  </p>
                  <p className="dark:text-gray-400 text-gray-600 mb-6">
                    Try adjusting your search term or clear the search
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-5 py-2.5 dark:bg-gray-700 bg-[#a68a70] dark:hover:bg-gray-600 hover:bg-[#8c715f] text-white font-medium rounded-lg transition-colors mx-auto"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <FolderOpen className="w-16 h-16 mx-auto dark:text-gray-600 text-gray-400 mb-4" />
                  <p className="text-xl dark:text-white text-[#5e4636] mb-2">No projects yet</p>
                  <p className="dark:text-gray-400 text-gray-600 mb-6 max-w-md mx-auto">
                    Create your first project to get started with organizing
                    your work
                  </p>
                  <button
                    onClick={() => setCurrentView("create")}
                    className="px-5 py-2.5 dark:bg-emerald-600 bg-[#a55233] dark:hover:bg-emerald-500 hover:bg-[#8b4513] text-white font-medium rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="w-5 h-5 mr-1" />
                    <span>Create a project</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <FaqButton />
      </div>
    );
  }
  return (
    <>
      <style>
        {`

          @keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  @keyframes slide-up {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes pulse-slow {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.8s ease-out forwards;
  }
  
  .animate-slide-up {
    opacity: 0;
    animation: slide-up 0.8s ease-out forwards;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 3s ease-in-out infinite;
  }
        /* Add this to your style tag */
.scrollbar-styled::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollbar-styled::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.scrollbar-styled::-webkit-scrollbar-thumb {
  background: rgba(99, 179, 152, 0.3);
  border-radius: 4px;
}

.scrollbar-styled::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 179, 152, 0.5);
}

.scrollbar-styled::-webkit-scrollbar-corner {
  background: transparent;
}
          .line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
        `}
      </style>
      <div className="min-h-screen bg-[#f7f3ea] dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-emerald-900 p-8">
  <Header />
  <div className="max-w-4xl mx-auto bg-[#e9dcc9]/90 dark:bg-white/10 border border-[#d6cbbf] dark:border-gray-700/30 backdrop-blur-lg rounded-xl shadow-xl p-8 mt-16">
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-serif text-teal-800 dark:text-white">
        Create New Project
      </h1>
      {projects.length > 0 && (
        <button
          onClick={() => setCurrentView("projects")}
          className="text-teal-800 dark:text-emerald-300 font-normal dark:font-thin hover:text-teal-600 dark:hover:text-white transition-colors"
        >
          Go to your Projects
        </button>
      )}
    </div>

    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Form fields styled to match */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-emerald-950 dark:text-gray-200 mb-2"
          >
            Project Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full px-4 py-2 bg-white/80 dark:bg-white/5 border border-gray-700 dark:border-gray-300/20 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-[#a55233] dark:focus:ring-teal-500 focus:border-transparent"
            placeholder="Enter a unique, descriptive name"
            value={projectData.name}
            onChange={(e) =>
              setProjectData((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            required
          />
        </div>
      </div>
      <div>
  <label
    htmlFor="description"
    className="block text-sm font-medium text-emerald-950 dark:text-gray-200 mb-2"
  >
    Project Description
  </label>
  <div className="space-y-3">
    <textarea
      id="description"
      rows={4}
      className="w-full px-4 py-2 bg-white/80 dark:bg-white/5 border border-gray-700 dark:border-gray-300/20 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-[#a55233] dark:focus:ring-teal-500 focus:border-transparent"
      placeholder="Describe your project's purpose and goals (optional)"
      value={projectData.description}
      onChange={(e) => {
  setProjectData(prev => ({ ...prev, description: e.target.value }));
  // Clear all description-related errors when the user types
  if (error && (
    error.includes('description') || 
    error.includes('enhance') || 
    error.includes('detailed') ||
    error.includes('AI')
  )) {
    setError(null);
  }
}}
      
    ></textarea>
    
    {/* File upload status and error messages */}
    {uploadError && (
      <div className="text-red-500 text-sm flex items-center">
        <AlertCircle className="w-4 h-4 mr-1" />
        {uploadError}
      </div>
    )}
    {documentFile && !uploadError && (
      <div className="text-[#5e4636] dark:text-gray-300 text-sm flex items-center">
        <FileText className="w-4 h-4 mr-1" />
        {documentFile.name}
      </div>
    )}
    
    {/* Action buttons with improved styling and better light theme contrast */}
    <div className="flex flex-wrap gap-3">
      <button
  type="button"
  title="Click to enhance the existing description using AI"
  onClick={() => {
    // Clear any errors before enhancing
    setError(null);
    setUploadError(null);
    handleEnhanceDescription();
  }}
  disabled={enhanceLoading}
  className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center ${
    enhanceLoading 
    ? 'bg-[#556052]/50 dark:bg-emerald-600/10 text-white/70 dark:text-emerald-300/50 cursor-not-allowed' 
    : 'bg-[#556052]/80 dark:bg-emerald-600/20 hover:bg-[#556052] dark:hover:bg-emerald-600/30 text-white dark:text-emerald-300'
  }`}
>
  {enhanceLoading ? (
    <Loader className="w-4 h-4 mr-1.5 animate-spin" />
  ) : (
    <Wand2 className="w-4 h-4 mr-1.5" />
  )}
  Enhance with AI
</button>
      
      <div className="relative">
        <input
          type="file"
          id="documentUpload"
          className="hidden"
          onChange={handleDocumentChange}
          accept=".pdf,.pptx,.txt"
        />
        <label
          htmlFor="documentUpload"
          title="Upload a file to generate a description from its content"
          className="cursor-pointer px-3 py-2 bg-[#a68a70] dark:bg-emerald-600/20 hover:bg-[#8c715f] dark:hover:bg-emerald-600/30 text-white dark:text-emerald-300 rounded-lg transition-colors text-sm font-medium flex items-center"
        >
          <Paperclip className="w-4 h-4 mr-1.5" />
          Upload Files
        </label>
      </div>
      
      {documentFile && (
        <button
          type="button"
          onClick={handleGenerateDescription}
          disabled={uploadLoading}
          className="px-3 py-2 bg-[#a55233] dark:bg-purple-600/20 hover:bg-[#8b4513] dark:hover:bg-purple-600/30 text-white dark:text-purple-300 rounded-lg transition-colors text-sm font-medium flex items-center"
        >
          {uploadLoading ? (
            <Loader className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <MessageSquare className="w-4 h-4 mr-1.5" />
          )}
          Generate from file
        </button>
      )}
    </div>
  </div>
</div>
      
      {/* Category selector */}
      <div className="space-y-4">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          Category
        </label>
        <select
          id="category"
          className="w-full px-4 py-2 bg-white/80 dark:bg-white/5 border border-[#d6cbbf] dark:border-gray-300/20 rounded-lg text-[#5e4636] dark:text-white focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
          value={projectData.category}
          onChange={(e) =>
            setProjectData((prev) => ({
              ...prev,
              category: e.target.value,
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
              className="bg-white dark:bg-emerald-900"
            >
              {category}
            </option>
          ))}
        </select>
        {projectData.category === "Other" && (
                <div className="mt-4">
                  <label
                    htmlFor="customCategory"
                    className="block text-sm font-medium dark:text-gray-200 mb-2"
                  >
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    id="customCategory"
                    className="w-full px-4 py-2 dark:bg-white/5 border dark:border-gray-300/20 rounded-lg dark:text-white text-[#5e4636]  focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
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
              {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
              {error}
            </div>
          )}
      </div>
          
      {/* Module selection */}
      <div>
        <h3 className="text-xl font-semibold text-[#0a3b25] dark:text-white mb-4">
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
                      ? "bg-[#556052]/10 border-[#556052] dark:bg-emerald-600/20 dark:border-emerald-500"
                      : "bg-white/80 border-[#d6cbbf] dark:bg-white/5 dark:border-gray-300/20 hover:bg-[#f5e6d8] dark:hover:bg-white/10")
                  : "opacity-50 cursor-not-allowed bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
              }`}
              onClick={() => handleModuleToggle(module.id)}
            >
              <div className="flex items-center space-x-4">
                {module.active ? (
                  <module.icon className="w-8 h-8 text-[#a55233] dark:text-purple-400 flex-shrink-0" />
                ) : (
                  <Lock className="w-8 h-8 text-gray-500 dark:text-gray-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-[#5e4636] dark:text-white text-lg">
                    {module.name}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
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

      {/* Submit button */}
      <div className="flex justify-center">
        <button
          type="submit"
          className="px-8 py-3 bg-[#a55233] hover:bg-[#8b4513] dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-medium rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          Create Project
        </button>
      </div>
    </form>
  </div>
        <FaqButton />
      </div>
    </>
  );
}

export default App;
