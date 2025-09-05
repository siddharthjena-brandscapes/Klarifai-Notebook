import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Lock,
  Wand2,
  Loader,
  FileText,
  AlertCircle,
  Paperclip,
  MessageSquare,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { coreService, adminService } from "../utils/axiosConfig";
import MultiSelectDropdown from "./LandingPage/MultiSelectDropdown";

const EditProject = ({ project, modules, onClose, onUpdate, userCategories = [],  onCategoryCreated  }) => {
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    category: "",
    customCategory: "",
    selected_modules: [],
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFormChanged, setIsFormChanged] = useState(false);

  // Document handling states
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [previousDocument, setPreviousDocument] = useState(null);
 const [categories, setCategories] = useState([]);

 const [newCategoryName, setNewCategoryName] = useState("");
const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  
// Add useEffect to set categories
  useEffect(() => {
    // Use userCategories if available, otherwise fallback to default
    const defaultCategories = [
      "Business",
      "Healthcare", 
      "Beauty & Wellness",
      "Education",
      "Technology",
      "Other",
    ];
    
    setCategories(userCategories.length > 0 ? userCategories : defaultCategories);
  }, [userCategories]);
useEffect(() => {
  // Initialize form with project data
  if (project) {
    setProjectData({
      name: project.name,
      description: project.description,
      category: Array.isArray(project.category) ? project.category : [project.category],
      customCategory: "",
      selected_modules: project.selected_modules || [],
    });

    // If project has associated document information, set it
    if (project.document) {
      setPreviousDocument(project.document);
    }
  }
}, [project]);

  // Track form changes
  useEffect(() => {
    if (!project) return;

    const hasChanges =
      project.name !== projectData.name ||
      project.description !== projectData.description ||
      project.category !==
        (projectData.category === "Other"
          ? projectData.customCategory
          : projectData.category) ||
      !arraysEqual(project.selected_modules, projectData.selected_modules) ||
      documentFile !== null; // Also consider document changes

    setIsFormChanged(hasChanges);
  }, [projectData, project, documentFile]);

  // Clear error message when form fields change
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [
    projectData.name,
    projectData.description,
    projectData.category,
    projectData.customCategory,
    projectData.selected_modules,
  ]);





const handleCreateCategory = async () => {
  if (!newCategoryName.trim()) {
    setError("Please enter a category name");
    return;
  }

  try {
    setLoading(true); // Show loading state
    const response = await adminService.createUserCategory({ name: newCategoryName });
    
    if (response.status === 'success') {
      // 1. Update local categories state
      const updatedCategories = [...categories, newCategoryName];
      setCategories(updatedCategories);
      
      // 2. Notify parent component
      if (onCategoryCreated) {
        onCategoryCreated(updatedCategories);
      }
      
      // 3. Update form selection
      setProjectData(prev => ({
        ...prev,
        category: [...prev.category, newCategoryName]
      }));
      
      // 4. Reset input
      setNewCategoryName("");
      setShowNewCategoryInput(false);
    } else {
      setError(response.message || "Failed to create category");
    }
  } catch (err) {
    setError(err.message || "Failed to create category");
  } finally {
    setLoading(false);
  }
};

  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    return a.sort().every((val, index) => val === b.sort()[index]);
  };

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
        fileType ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        fileExtension === "pptx" ||
        fileType === "text/plain" ||
        fileExtension === "txt"
      )
    ) {
      setUploadError(
        "Please upload a PDF, PowerPoint (PPTX), or text (TXT) file."
      );
      setDocumentFile(null);
      return;
    }

    // Set the file and clear previous document
    setDocumentFile(selectedFile);
    setPreviousDocument(null); // Clear previous document reference when new file is uploaded
  };

  const cleanDescription = (text) => {
    if (!text) return text;

    // Remove markdown formatting
    return text
      .replace(/^#+\s*/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/^\*\s+/gm, "• ")
      .replace(/^-\s+/gm, "• ")
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

        // Store the document info for display
        setPreviousDocument({
          name: documentFile.name,
          type: documentFile.type,
          size: documentFile.size,
        });

        // Clear document file since it's been processed
        setDocumentFile(null);
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

  // Update the handleEnhanceDescription function to properly clear errors
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
        // Explicitly clear any errors on success
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
  if (!isFormChanged) return;

  setLoading(true);
  setError(null);

  // Updated validation for array categories
  if (!projectData.name || !projectData.category.length) {
    setError("Please fill in all required fields and select at least one category");
    setLoading(false);
    return;
  }

  if (projectData.selected_modules.length === 0) {
    setError("Please select at least one module");
    setLoading(false);
    return;
  }

  try {
    const updatedData = {
      name: projectData.name,
      description: projectData.description,
      category: projectData.category, // Now it's an array
      selected_modules: projectData.selected_modules,
      document: documentFile
        ? {
            name: documentFile.name,
            type: documentFile.type,
            size: documentFile.size,
          }
        : previousDocument,
    };

    onUpdate(project.id, updatedData);
    onClose();
  } catch (err) {
    console.error("Error updating project:", err);
    setError(err.response?.data?.message || "Failed to update project");
  } finally {
    setLoading(false);
  }
};

  // Add a comprehensive effect to clear errors when any key action happens
  useEffect(() => {
    // This effect clears errors whenever key user interactions happen
    const clearErrorsOnAction = (e) => {
      // Clear errors on key actions like clicking buttons or typing
      if (e.type === "keydown" || e.type === "click") {
        if (error) setError(null);
        if (uploadError) setUploadError(null);
      }
    };

    // Add event listeners for global interactions that should clear errors
    document.addEventListener("keydown", clearErrorsOnAction);
    document.addEventListener("click", clearErrorsOnAction);

    return () => {
      document.removeEventListener("keydown", clearErrorsOnAction);
      document.removeEventListener("click", clearErrorsOnAction);
    };
  }, [error, uploadError]);

  return (
    <div className="fixed inset-0 bg-black/20 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 pt-16">
      <div className="bg-[#faf4ee] dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-serif text-[#0a3b25] dark:text-white">
              Edit Project
            </h1>
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
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[#5e4636] dark:text-gray-200 mb-2"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 bg-white/80 dark:bg-white/5 border border-[#d6cbbf] dark:border-gray-300/20 rounded-lg text-[#5e4636] dark:text-white focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter project name"
                  value={projectData.name}
                  onChange={(e) => {
                    setProjectData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }));
                    if (error && error.includes("required fields"))
                      setError(null);
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[#5e4636] dark:text-gray-200 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full px-4 py-2 bg-white/80 dark:bg-white/5 border border-[#d6cbbf] dark:border-gray-300/20 rounded-lg text-[#5e4636] dark:text-white focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Describe your project"
                  rows={3}
                  value={projectData.description}
                  onChange={(e) => {
                    setProjectData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }));
                    // Clear all description-related errors when the user types
                    if (
                      error &&
                      (error.includes("description") ||
                        error.includes("enhance") ||
                        error.includes("detailed") ||
                        error.includes("AI"))
                    ) {
                      setError(null);
                    }
                  }}
                />

                

                {/* File upload status and error messages */}
                {uploadError && (
                  <div className="mt-2 text-red-500 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {uploadError}
                  </div>
                )}
                {documentFile && !uploadError && (
                  <div className="mt-2 text-[#5e4636] dark:text-gray-300 text-sm flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {documentFile.name}
                  </div>
                )}

                {/* Action buttons with improved styling */}
                <div className="flex flex-wrap gap-3 mt-3">
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
                        ? "bg-[#556052]/50 dark:bg-emerald-600/10 text-white/70 dark:text-emerald-300/50 cursor-not-allowed"
                        : "bg-[#556052]/80 dark:bg-emerald-600/20 hover:bg-[#556052] dark:hover:bg-emerald-600/30 text-white dark:text-emerald-300"
                    }`}
                  >
                    {enhanceLoading ? (
                      <Loader className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-1.5" />
                    )}
                    Enhance with AI
                  </button>

                  {/* <div className="relative">
                    <input
                      type="file"
                      id="documentUploadEdit"
                      className="hidden"
                      onChange={handleDocumentChange}
                      accept=".pdf,.pptx,.txt"
                    />
                    <label
                      htmlFor="documentUploadEdit"
                      title="Upload a file to generate a description from its content"
                      className="cursor-pointer px-3 py-2 bg-[#a68a70] dark:bg-emerald-600/20 hover:bg-[#8c715f] dark:hover:bg-emerald-600/30 text-white dark:text-emerald-300 rounded-lg transition-colors text-sm font-medium flex items-center"
                    >
                      <Paperclip className="w-4 h-4 mr-1.5" />
                      Upload Files
                    </label>
                  </div> */}

                  {documentFile && (
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={uploadLoading}
                      className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium flex items-center ${
                        uploadLoading
                          ? "bg-[#a55233]/50 dark:bg-purple-600/10 text-white/70 dark:text-purple-300/50 cursor-not-allowed"
                          : "bg-[#a55233] dark:bg-purple-600/20 hover:bg-[#8b4513] dark:hover:bg-purple-600/30 text-white dark:text-purple-300"
                      }`}
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
    



{/* Category selector */}
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-200 mb-2">
      Categories
    </label>
    {!showNewCategoryInput && (
      <button
        type="button"
        onClick={() => setShowNewCategoryInput(true)}
        className="px-3 py-1.5 text-sm bg-[#a68a70]/20 hover:bg-[#a68a70]/30 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-[#5e4636] dark:text-emerald-300 rounded-lg transition-colors flex items-center"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add New
      </button>
    )}
  </div>

  <div className="space-y-3">
    <MultiSelectDropdown
      options={categories}
      selected={projectData.category}
      onChange={(newCategories) => setProjectData(prev => ({
        ...prev,
        category: newCategories
      }))}
      placeholder="Select categories..."
    />
    
    {showNewCategoryInput && (
      <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-[#d6cbbf] dark:border-gray-700">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[#5e4636] dark:text-gray-100">
            Create New Category
          </h4>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-white/5 border border-[#d6cbbf] dark:border-gray-700/30 rounded-lg focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleCreateCategory}
              className="px-4 py-2 text-sm bg-[#556052] hover:bg-[#556052]/80 dark:bg-emerald-600 dark:hover:bg-emerald-600/80 text-white rounded-lg transition-colors font-medium"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewCategoryInput(false);
                setNewCategoryName("");
              }}
              className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>

 {/* Module selection */}
                <div>
                  <h3 className="text-xl font-medium text-[#0a3b25] dark:text-white mb-4">
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
                            : "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                        }`}
                        onClick={() => {
                          handleModuleToggle(module.id);
                          if (error && error.includes("module")) {
                            setError(null);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          {module.active ? (
                            <module.icon className="w-6 h-6 text-[#a55233] dark:text-emerald-400" />
                          ) : (
                            <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                          )}
                          <div>
                            <h4 className="font-medium text-[#0a3b25] dark:text-white">
                              {module.name}
                            </h4>
                            <p className="text-sm text-[#5e4636] dark:text-gray-300">
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
                    ? "bg-[#a55233] hover:bg-[#8b4513] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white"
                    : "bg-[#d6cbbf] dark:bg-gray-600 text-[#5e4636] dark:text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? "Updating..." : "Update Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProject;
