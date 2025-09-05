


//IdeaForm.jsx
import React, { useState, useCallback, useEffect, useRef, useContext } from "react";
import { ideaService } from "../utils/axiosConfig";
import AdvancedRegenControls from "../components/AdvancedRegenControls";
import Header from "./dashboard/Header";
import VersionHistory from "./VersionHistory";
import { format } from "date-fns";
import PowerPointExport from "./PowerPointExport";
import { useProject } from "./ProjectManagement";
import backgroundImage from "../assets/bg-main.jpg";
import IdeaMetadata from "./IdeaMetadata";
import ScrollNavigationButtons from "./ScrollNavigationButtons";
import FieldManager from "./FieldManager";
import EditIdeaPanel from "./IdeaGenerator/EditIdeaPanel";
import ZoomImageViewer from "./IdeaGenerator/ZoomImageViewer";
import IdeaAnalysis from "./IdeaGenerator/IdeaAnalysis";
import HighlightedDescription from "./IdeaGenerator/HighlightedDescription";
import ComparisonModeToggle from "./IdeaGenerator/ComparisonModeToggle";
import IdeaTitle from "./IdeaGenerator/IdeaTitle";
import { useLocation } from 'react-router-dom';
import { ThemeContext } from "../context/ThemeContext";
import CircularProgressButton from "../components/CircularProgressButton";
import FaqButtonIdea from "./faq/FaqButtonIdea";



import {

  X,
  Check,
  Edit2,
  Image,

  ArrowLeft,
  Clock,
  ArrowRight,
  ToggleRight,
  ToggleLeft,
  AlertTriangle,
  AlertCircle,
  Trash2
} from "lucide-react";
import { toast } from 'react-toastify';
const IdeaForm = () => {
  const { currentProject, saveProject, setShowProjectList } = useProject();

  // Initialize with empty dynamic fields
  const [dynamicFields, setDynamicFields] = useState({});

  // Predefined field types
  const predefinedFieldTypes = ["Benefits", "RTB", "Ingredients", "Features"];
  const [customFieldTypes, setCustomFieldTypes] = useState([]);
  const [newCustomField, setNewCustomField] = useState("");

  const [ideas, setIdeas] = useState([]);
  const [acceptedIdeas, setAcceptedIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(true);
  const [generatedImages, setGeneratedImages] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [editingIdea, setEditingIdea] = useState(null);
  const [hasManuallySetIdeas, setHasManuallySetIdeas] = useState(false);
  const [editForm, setEditForm] = useState({
    product_name: "",
    description: "",
  });
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const [lastSection, setLastSection] = useState(null);
  const [imageGenerationInProgress, setImageGenerationInProgress] =
    useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedIdeaForHistory, setSelectedIdeaForHistory] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [rawVersionHistory, setRawVersionHistory] = useState({});
  const [formData, setFormData] = useState({
    number_of_ideas: 3,
    description_length: 70,  // Default to 70 words
  });

  const [projectName, setProjectName] = useState(
    currentProject?.name || `Project ${new Date().toLocaleDateString()}`
  );

  const [ideaMetadata, setIdeaMetadata] = useState({});

  //to track field activation
  const [fieldActivation, setFieldActivation] = useState({});

  const [hasFormChanged, setHasFormChanged] = useState(false);

  const [ideaSetCounter, setIdeaSetCounter] = useState(1);

  //for negative prompt
  const [negativePrompt, setNegativePrompt] = useState("");

  //for delete idea modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState(null);

  //for image zooming
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const [isComparisonMode, setIsComparisonMode] = useState(false);

  const contentRef = useRef(null);
  const location = useLocation();
  const { setCurrentProject} = useProject();
  const [showDocParamsModal, setShowDocParamsModal] = useState(false);
  const [docParams, setDocParams] = useState(null);
  
  // Add a state to track if the form has been initialized from document
  const [initializedFromDoc, setInitializedFromDoc] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  // Add additional state to track project loading source
  const [projectSource, setProjectSource] = useState(null);
  const { theme } = useContext(ThemeContext);
  const [versionHistories, setVersionHistories] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef(null);
  const lastSavedDataRef = useRef(null);
  const [currentIdeaProgress, setCurrentIdeaProgress] = useState(0);
  const [totalIdeasExpected, setTotalIdeasExpected] = useState(0);
    

  // Effect to scroll to top when ideas are generated or added
  useEffect(() => {
    // Ensure ideas exist and the ref is available
    if (ideas.length > 0 && contentRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        contentRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [ideas.length]);

  
  // to load project data
  useEffect(() => {
    if (currentProject) {
      setFormData(
        currentProject.formData || {
          product: "",
          brand: "",
          category: "",
          number_of_ideas: 1,
          negative_prompt: "",
        }
      );
      
      // Load dynamic fields
      const loadedDynamicFields = currentProject.dynamicFields || {};
      setDynamicFields(loadedDynamicFields);

      // Load custom field types - Ensure proper array conversion
      if (currentProject.customFieldTypes) {
        let loadedCustomFieldTypes;

        // Handle different potential formats of customFieldTypes
        if (Array.isArray(currentProject.customFieldTypes)) {
          loadedCustomFieldTypes = currentProject.customFieldTypes;
        } else if (typeof currentProject.customFieldTypes === "string") {
          // Handle case where it might be a comma-separated string
          loadedCustomFieldTypes = currentProject.customFieldTypes
            .split(",")
            .map((type) => type.trim())
            .filter((type) => type.length > 0);
        } else {
          loadedCustomFieldTypes = [];
        }

        // Extract unique field types from dynamic fields if they don't exist in loadedCustomFieldTypes
        const fieldTypesFromDynamic = Object.values(loadedDynamicFields)
          .map((field) => field.type)
          .filter((type) => !predefinedFieldTypes.includes(type))
          .filter((type) => !loadedCustomFieldTypes.includes(type));

        // Combine and deduplicate
        loadedCustomFieldTypes = [
          ...new Set([...loadedCustomFieldTypes, ...fieldTypesFromDynamic]),
        ];

        setCustomFieldTypes(loadedCustomFieldTypes);
      } else {
        // If no custom field types stored, extract from dynamic fields
        const customTypes = Object.values(loadedDynamicFields)
          .map((field) => field.type)
          .filter((type) => !predefinedFieldTypes.includes(type));

        setCustomFieldTypes([...new Set(customTypes)]);
      }
      
      // Preserve field activation state
      const preservedActivation = Object.keys(loadedDynamicFields).reduce(
        (acc, fieldId) => {
          acc[fieldId] = currentProject.fieldActivation?.[fieldId] ?? true;
          return acc;
        },
        {}
      );

      setFieldActivation(preservedActivation);
      
      // Load existing ideas
      const existingIdeas = currentProject.ideas || [];
      const maxSetNumber = currentProject.max_set_number || 0;
      const existingAcceptedIdeas = currentProject.acceptedIdeas || [];

      // Ensure we're only setting accepted ideas that actually exist in the ideas array
      const validAcceptedIdeas = existingAcceptedIdeas.filter((accepted) =>
        existingIdeas.some((idea) => idea.idea_id === accepted.idea_id)
      ).map(idea => ({
        ...idea,
        visualization_prompt: idea.visualization_prompt,
      }));

      // Map metadata to ideas if not already present
      const ideasWithMetadata = existingIdeas.map((idea) => ({
        ...idea,
        idea_set: idea.metadata?.baseData?.idea_set || idea.idea_set,
        idea_set_label: idea.metadata?.baseData?.idea_set_label || idea.idea_set_label,
        visualization_prompt: idea.visualization_prompt,
        metadata: idea.metadata || currentProject.ideaMetadata?.[idea.idea_id],
      }));
      
      setIdeas(ideasWithMetadata);
      setAcceptedIdeas(validAcceptedIdeas);

      // Combine existing and generated metadata
      setIdeaMetadata(currentProject.ideaMetadata || {});
      
      // Preserve existing generated images
      if (currentProject.generatedImages) {
        setGeneratedImages(currentProject.generatedImages);
      }
      
      setIdeaSetCounter(maxSetNumber + 1);
      setNegativePrompt(currentProject.formData?.negative_prompt || "");

      // Check if we should navigate directly to ideas
      if (currentProject.skipToIdeas && existingIdeas.length > 0) {
        setShowForm(false);
      }
    }
  }, [currentProject]);


  // Complete solution combining all fixes for IdeaForm.jsx

// 1. Fix the useEffect hook that performs auto-save
useEffect(() => {
  // Skip if we're already in the process of saving
  if (isSaving) return;
  
  // Skip if no project to save
  if (!currentProject && ideas.length === 0) return;
  
  // Skip if form hasn't changed (this prevents unnecessary saves)
  if (!hasFormChanged && ideas.length === 0) return;
  
  // Prepare data to save
  const dataToSave = {
    id: currentProject?.id,
    name: projectName,
    formData: {
      ...formData,
      negative_prompt: negativePrompt,
    },
    dynamicFields,
    fieldActivation,
    ideas: ideas.map(idea => ({
      ...idea,
      visualization_prompt: idea.visualization_prompt,
    })),
    acceptedIdeas: acceptedIdeas.map(idea => ({
      ...idea,
      visualization_prompt: idea.visualization_prompt,
    })),
    generatedImages,
    showForm,
    showImageGeneration,
    ideaMetadata,
    ideaSetCounter,
    customFieldTypes,
  };
  
  // Create a version without lastModified for comparison
  const dataForComparison = { ...dataToSave };
  delete dataForComparison.lastModified;
  
  // Convert to JSON string for comparison
  const dataString = JSON.stringify(dataForComparison);
  
  // Check if data has actually changed since last save
  if (dataString === lastSavedDataRef.current) {
    return;
  }
  
  // Clear any existing timeout
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }
  
  // Set a new timeout for debounced save
  saveTimeoutRef.current = setTimeout(() => {
    setIsSaving(true);
    
    console.log("Auto-saving project changes...");
    
    saveProject(dataToSave)
      .then(() => {
        lastSavedDataRef.current = dataString;
        console.log("Project saved successfully");
      })
      .catch(error => {
        console.error("Error saving project:", error);
      })
      .finally(() => {
        setIsSaving(false);
      });
      
    saveTimeoutRef.current = null;
  }, 3000);
  
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
}, [
  projectName, 
  formData, 
  dynamicFields, 
  fieldActivation, 
  ideas, 
  acceptedIdeas, 
  generatedImages, 
  showForm, 
  showImageGeneration, 
  ideaMetadata, 
  ideaSetCounter, 
  negativePrompt, 
  customFieldTypes,
  hasFormChanged, // Add this dependency
  isSaving,
  currentProject,
  saveProject
]);



// Add this function to fetch version history for all ideas
  const fetchAllVersionHistories = async () => {
    try {
      if (!currentProject?.ideas) {
        console.warn("No ideas available to fetch history");
        return;
      }

      const historyPromises = currentProject.ideas.map(async (idea) => {
        if (!idea.idea_id) {
          console.warn("Idea missing idea_id:", idea);
          return null;
        }

        const response = await ideaService.getIdeaHistory(idea.idea_id);
        if (response.data.success) {
          return {
            ideaId: idea.idea_id,
            history: response.data.history,
          };
        }
        return null;
      });

      const histories = await Promise.all(historyPromises);
      const validHistories = histories.filter((h) => h !== null);

      // Update your state with the valid histories
      setVersionHistories(
        validHistories.reduce((acc, curr) => {
          if (curr) {
            acc[curr.ideaId] = curr.history;
          }
          return acc;
        }, {})
      );
    } catch (error) {
      console.error("Error fetching version histories:", error);
    }
  };

  useEffect(() => {
    if (acceptedIdeas.length > 0) {
      fetchAllVersionHistories();
    }
  }, [acceptedIdeas]);

  // Add new handler functions
  const handleViewHistory = (idea) => {
    setSelectedIdeaForHistory(idea);
    setShowVersionHistory(true);
    setSelectedImage(null); // Reset selected image when opening history
    
  };

  const handleImageVersionSelect = (imageVersion, fullVersion = null) => {
    setSelectedImage(imageVersion);

    // If a full version is provided, store it for potential complete restoration
    if (fullVersion) {
      setSelectedVersion(fullVersion);
    }
  };

  // Calculate suggested number of ideas based on form fields
  // First, update the useEffect for auto-calculating number of ideas
  useEffect(() => {
    // Skip calculation if ideas have been manually set
    if (hasManuallySetIdeas) {
      return;
    }

    // Group dynamic fields by their type, considering only active fields with non-empty values
    const fieldsByType = Object.entries(dynamicFields).reduce(
      (acc, [fieldId, field]) => {
        // Check if field is active and has a non-empty value
        if (
          fieldActivation[fieldId] !== false && // Check if field is active
          field.value.trim() !== ""
        ) {
          acc[field.type] = (acc[field.type] || 0) + 1;
        }
        return acc;
      },
      {}
    );

    // Calculate combinations only from fields that have values
    const fieldTypeCounts = Object.values(fieldsByType);

    // Log for debugging
    console.log("Active fields by type:", fieldsByType);
    console.log("Field counts:", fieldTypeCounts);

    // Calculate total combinations
    let suggestedNumber;
    if (fieldTypeCounts.length === 0) {
      // If no fields have values, default to 1
      suggestedNumber = 1;
    } else {
      // Calculate combinations and apply reasonable limits
      const rawCombinations = fieldTypeCounts.reduce(
        (acc, count) => acc * count,
        1
      );
      suggestedNumber = Math.min(Math.max(1, rawCombinations), 20);
    }

    console.log("Suggested number of ideas:", suggestedNumber);

    // Update form data with the new suggested number
    setFormData((prev) => ({
      ...prev,
      number_of_ideas: suggestedNumber,
    }));
  }, [dynamicFields, fieldActivation, hasManuallySetIdeas]);
  // Add a handler for returning to form while preserving state
  const handleBackToForm = () => {
    setShowForm(true);
    // Remove the setIdeas([]) line to preserve existing ideas
    setError(null);
  };

  
  
  const handleAccept = (ideaId) => {
    const ideaToAccept = ideas.find((idea) => idea.idea_id === ideaId);
    if (ideaToAccept) {
      setAcceptedIdeas((prev) => {
        // Check if the idea is already in acceptedIdeas
        if (!prev.some(idea => idea.idea_id === ideaId)) {
          const newAcceptedIdeas = [ideaToAccept, ...prev];
          
          // Only trigger sequential generation if no image exists
          if (!generatedImages[ideaId]) {
            setTimeout(() => {
              generateImagesSequentially();
            }, 100);
          }
          
          return newAcceptedIdeas;
        }
        return prev;
      });
    }
  };

  const handleUnaccept = (ideaId) => {
    setAcceptedIdeas((prev) => prev.filter((idea) => idea.idea_id !== ideaId));
    
    // We've removed the code that deletes the image from generatedImages
    // This way, the image remains cached for future use
    
    if (acceptedIdeas.length <= 1) {
      setShowImageGeneration(false);
    }
  };

  const handleEdit = (idea) => {
    setEditingIdea(idea.idea_id);
    setEditForm({
      product_name: idea.product_name,
      description: idea.description,
    });
    setLastSection(showImageGeneration ? "image" : "idea");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

const handleUpdateIdea = async (ideaId) => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Set a specific loading state for this idea to show a spinner
    setLoadingStates(prev => ({
      ...prev,
      [ideaId]: true
    }));
    
    // Show a toast notification that the update is in progress
    toast.info("Updating idea...", {
      position: "bottom-right",
      autoClose: false,
      toastId: `updating-${ideaId}`
    });

    const response = await ideaService.updateIdea({
      idea_id: ideaId,
      ...editForm,
    });

    // Check if response exists and has expected structure
    if (response?.data?.success && response.data?.updated_data) {
      const updatedIdea = {
        idea_id: response.data.updated_data.idea_id,
        product_name: response.data.updated_data.product_name,
        description: response.data.updated_data.description,
        // Preserve the original ideaSet and ideaSetLabel
        idea_set: ideas.find((idea) => idea.idea_id === ideaId)?.idea_set,
        idea_set_label: ideas.find((idea) => idea.idea_id === ideaId)
          ?.idea_set_label,
      };

      setIdeas(prev => (
        prev.map(idea => idea.idea_id === ideaId ? updatedIdea : idea)
      ));
      
      setAcceptedIdeas(prev => (
        prev.map(idea => idea.idea_id === ideaId ? updatedIdea : idea)
      ));

      // Close the "updating" toast
      toast.dismiss(`updating-${ideaId}`);
      
      // Show success toast
      toast.success("Idea updated successfully!", {
        position: "bottom-right",
        autoClose: 3000
      });

      // Check if the idea is in accepted ideas and regenerate its image
      const isAccepted = acceptedIdeas.some(
        (accepted) => accepted.idea_id === ideaId
      );

      if (isAccepted) {
        // Notify user about image regeneration
        toast.info("Regenerating image based on updated idea...", {
          position: "bottom-right",
          autoClose: 5000
        });
        
        // Remove existing image to trigger regeneration
        setGeneratedImages((prev) => {
          const newImages = { ...prev };
          delete newImages[ideaId];
          return newImages;
        });

        // Automatically regenerate image after a short delay
        setTimeout(() => {
          handleRegenerateImage(ideaId);
        }, 500);
      }

      setEditingIdea(null);

      // Return to previous section
      if (lastSection === "image") {
        setShowImageGeneration(true);
      }
    } else {
      throw new Error(
        response?.data?.error || "Invalid response from server"
      );
    }
  } catch (err) {
    console.error("Update error:", err);
    setError(
      err?.response?.data?.error ||
        err.message ||
        "Failed to connect to the server"
    );
    
    // Close the "updating" toast
    toast.dismiss(`updating-${ideaId}`);
    
    // Show error toast
    toast.error(`Failed to update idea: ${err.message || "Unknown error"}`, {
      position: "bottom-right",
      autoClose: 4000
    });
  } finally {
    setIsLoading(false);
    
    // Clear the specific loading state for this idea
    setLoadingStates(prev => ({
      ...prev,
      [ideaId]: false
    }));
  }
};

// delete modal handlers for Ideas
const openDeleteModal = (idea) => {
  setIdeaToDelete(idea);
  setShowDeleteModal(true);
};

const closeDeleteModal = () => {
  setIdeaToDelete(null);
  setShowDeleteModal(false);
};

const handleDeleteIdea = async () => {
  if (!ideaToDelete) return;
  try {
    setIsLoading(true);
    
    // FIXED: Using your existing ideaService with correct parameter
    await ideaService.deleteIdea(ideaToDelete.idea_id);
    
    setIdeas((prev) => prev.filter((i) => i.idea_id !== ideaToDelete.idea_id));
    setAcceptedIdeas((prev) => prev.filter((i) => i.idea_id !== ideaToDelete.idea_id));
    toast.success("Idea deleted successfully!", {
      position: "bottom-right",
      autoClose: 3000,
    });
    closeDeleteModal();
  } catch (err) {
    console.error('Delete error:', err);
    toast.error("Failed to delete idea.", {
      position: "bottom-right",
      autoClose: 3000,
    });
  } finally {
    setIsLoading(false);
  }
};
 

  const handleRegenerateImage = useCallback(
    async (params) => {
      // If params is not an object (old way), convert it to the expected format
      const ideaId = typeof params === "object" ? params.idea_id : params;

      if (loadingStates[ideaId]) return;

      setLoadingStates((prev) => ({ ...prev, [ideaId]: true }));
      setError(null);

      try {
        // Find the idea from acceptedIdeas if not provided in params
        const idea = acceptedIdeas.find((i) => i.idea_id === ideaId);
        if (!idea) throw new Error("Idea not found");

        // Use visualization_prompt if available, otherwise construct fallback
        const description = params.description || idea.visualization_prompt || `${idea.product_name}: ${idea.description}`;
        console.log("Using prompt for image generation:", description);

        const response = await ideaService.regenerateProductImage({
          description: description,
          idea_id: ideaId,
          size: params.size || 768,
          steps: params.steps || 30,
          guidance_scale: params.guidance_scale || 7.5,
        });

        if (response.data.success) {
          setGeneratedImages((prev) => ({
            ...prev,
            [ideaId]: `data:image/png;base64,${response.data.image}`,
          }));
        } else {
          throw new Error(response.data.error || "Failed to regenerate image");
        }
      } catch (err) {
        console.error("Image regeneration error:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to regenerate image"
        );
      } finally {
        setLoadingStates((prev) => ({ ...prev, [ideaId]: false }));
      }
    },
    [acceptedIdeas, loadingStates]
  );

  const handleBaseFieldChange = (e) => {
    const { name, value } = e.target;

    if (name === "number_of_ideas") {
      // Only set manual override if the value is actually changed by user
      const newValue = value === "" ? "" : parseInt(value);
      if (newValue !== formData.number_of_ideas) {
        setHasManuallySetIdeas(true);
        setFormData((prev) => ({
          ...prev,
          [name]: newValue,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setHasFormChanged(true);
  };

  // Add a reset function for the manual override
  const resetNumberOfIdeas = () => {
    setHasManuallySetIdeas(false);
    // The useEffect will automatically recalculate the number
  };
  const handleDynamicFieldChange = (fieldId, value) => {
    setDynamicFields((prev) => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], value },
    }));
    // Mark form as changed
    setHasFormChanged(true);
  };

  const addField = (type) => {
    const fieldCount = Object.keys(dynamicFields).filter(
      (key) => dynamicFields[key].type.toLowerCase() === type.toLowerCase()
    ).length;

    const newFieldId = `${type.toLowerCase()}-${fieldCount + 1}`;

    // Create new fields object with new field at the top
    const updatedFields = {
      [newFieldId]: {
        type,
        value: "",
        // By default, new fields are active
        active: true,
      },
      ...dynamicFields,
    };

    // Update field activation state
    const updatedActivation = {
      [newFieldId]: true,
      ...fieldActivation,
    };

    setDynamicFields(updatedFields);
    setFieldActivation(updatedActivation);
    setHasManuallySetIdeas(false);
  };
  const removeField = (fieldId) => {
    setDynamicFields((prev) => {
      const newFields = { ...prev };
      delete newFields[fieldId];
      return newFields;
    });

    // Remove the field from activation state
    setFieldActivation((prev) => {
      const newActivation = { ...prev };
      delete newActivation[fieldId];
      return newActivation;
    });

    // Reset manual override when removing fields
    setHasManuallySetIdeas(false);
  };
  // New function to toggle field activation
  const toggleFieldActivation = (fieldId) => {
    setFieldActivation((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));

    // Explicitly set hasFormChanged to true when toggling field activation
    setHasFormChanged(true);

    // Optionally reset manual idea setting when toggling
    setHasManuallySetIdeas(false);
  };

  

  // New method to navigate to ideas without generating
  const handleNavigateToIdeas = () => {
    // If no ideas exist, generate with current form data
    if (ideas.length === 0) {
      handleSubmit(new Event("submit"));
    } else {
      setShowForm(false);
    }
  };


  // Update the handleSubmit function to properly store metadata for new ideas
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Limit number_of_ideas to 5
    if (formData.number_of_ideas > 5) {
      toast.error("You can generate a maximum of 5 ideas.", {
        position: "bottom-right",
        autoClose: 3500,
      });
      setFormData((prev) => ({
        ...prev,
        number_of_ideas: 5,
      }));
      return; // Prevent generation if above limit
    }

    setIsLoading(true);
    setIsGenerating(true);
    setError(null);
    
    // Initialize progress tracking
    setCurrentIdeaProgress(0);
    setTotalIdeasExpected(formData.number_of_ideas);

    const activeFields = Object.entries(dynamicFields)
      .filter(([fieldId]) => fieldActivation[fieldId] !== false)
      .reduce(
        (acc, [fieldId, field]) => ({
          ...acc,
          [fieldId]: field,
        }),
        {}
      );

    const submissionData = {
      ...formData,
      description_length: formData.description_length || 70,
      project_id: currentProject.id,
      dynamicFields: activeFields,
      negative_prompt: negativePrompt,
    };

    // More sophisticated progress tracking
    let progressInterval;
    let currentProgress = 0;
    const totalIdeas = formData.number_of_ideas;
    let startTime = Date.now();
    
    // Estimate time based on complexity (number of dynamic fields + idea count)
    const activeFieldCount = Object.keys(activeFields).length;
    const baseTimePerIdea = 4000; // 4 seconds base
    const complexityMultiplier = 1 + (activeFieldCount * 0.3); // More fields = more time
    const estimatedTimePerIdea = baseTimePerIdea * complexityMultiplier;
    const totalEstimatedTime = estimatedTimePerIdea * totalIdeas;

    const updateProgress = () => {
      progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progressRatio = Math.min(elapsedTime / totalEstimatedTime, 0.95); // Cap at 95% until completion
        const expectedProgress = Math.floor(progressRatio * totalIdeas);
        
        // Smooth progression that doesn't jump too quickly
        if (expectedProgress > currentProgress) {
          currentProgress = Math.min(expectedProgress, totalIdeas - 1);
          setCurrentIdeaProgress(currentProgress);
        }
      }, 500); // Update every 500ms for smoother progress
    };

    try {
      // Start progress tracking
      updateProgress();

      const response = await ideaService.generateIdeas(submissionData);

      if (response.data.success) {
        const { ideas: newIdeas, stored_data } = response.data;
        const currentSetNumber = stored_data.current_set;

        // Show completion progress step by step
        clearInterval(progressInterval);
        
        // Animate to completion
        const animateToCompletion = async () => {
          const finalCount = newIdeas.length;
          
          // If we're not at the final count, animate to it
          if (currentProgress < finalCount) {
            for (let i = currentProgress; i <= finalCount; i++) {
              setCurrentIdeaProgress(i);
              if (i < finalCount) {
                await new Promise(resolve => setTimeout(resolve, 200)); // 200ms between steps
              }
            }
          } else {
            // Already at final count, just set it
            setCurrentIdeaProgress(finalCount);
          }
          
          // Hold the final progress for a moment
          await new Promise(resolve => setTimeout(resolve, 800));
        };

        await animateToCompletion();

        const ideasWithMetadata = (newIdeas || []).map((idea, index) => {
          const metadata = {
            baseData: {
              product: stored_data.product,
              category: stored_data.category,
              brand: stored_data.brand,
              number_of_ideas: formData.number_of_ideas,
              description_length: formData.description_length || 70,
              idea_set: currentSetNumber,
              idea_set_label: idea.idea_set_label,
              negative_prompt: negativePrompt,
              project_id: stored_data.project_id,
              project_name: stored_data.project_name,
              product_idea_id: stored_data.product_idea_id,
            },
            dynamicFields: stored_data.dynamic_fields,
            timestamp: new Date().toISOString(),
          };

          return {
            ...idea,
            idea_set: currentSetNumber,
            idea_set_label: idea.idea_set_label,
            project_id: stored_data.project_id,
            project_name: stored_data.project_name,
            metadata,
          };
        });

        // Update metadata state
        const newMetadata = ideasWithMetadata.reduce((acc, idea) => {
          acc[idea.idea_id] = idea.metadata;
          return acc;
        }, {});

        setIdeaMetadata((prev) => ({
          ...prev,
          ...newMetadata,
        }));

        // Update ideas state
        setIdeas((prevIdeas) => {
          const uniqueNewIdeas = ideasWithMetadata.filter(
            (newIdea) =>
              !prevIdeas.some(
                (existingIdea) => existingIdea.idea_id === newIdea.idea_id
              )
          );
          const combinedIdeas = [...uniqueNewIdeas, ...prevIdeas];
          return combinedIdeas;
        });

        setIdeaSetCounter((prev) => prev + 1);

        if (showForm) {
          setShowForm(false);
        }
      
        setHasFormChanged(false);
      } else {
        clearInterval(progressInterval);
        setError(response.data.error || "Failed to generate ideas");
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.response?.data?.error || "Failed to connect to the server");
      console.error("Generation error:", err);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      // Reset progress after completion
      setTimeout(() => {
        setCurrentIdeaProgress(0);
        setTotalIdeasExpected(0);
      }, 1500);
    }
  };


  const generateImagesSequentially = useCallback(async () => {
    if (imageGenerationInProgress) return;
    
    setImageGenerationInProgress(true);
    setError(null);
    
    try {
      // Get only the ideas that don't have images yet
      const ideasNeedingImages = acceptedIdeas.filter(
        idea => !generatedImages[idea.idea_id] && !loadingStates[idea.idea_id]
      );
      
      for (const idea of ideasNeedingImages) {
        await handleRegenerateImage({
          idea_id: idea.idea_id,
          description: idea.visualization_prompt || `${idea.product_name}: ${idea.description}`,
          size: 768,
          steps: 30,
          guidance_scale: 7.5,
        });
        
        // Add a delay between image generations
        if (ideasNeedingImages.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 6000)); // 6 seconds delay
        }
      }
    } catch (err) {
      setError("Error generating images sequentially");
      console.error("Sequential generation error:", err);
    } finally {
      setImageGenerationInProgress(false);
    }
  }, [
    acceptedIdeas,
    generatedImages,
    handleRegenerateImage,
    imageGenerationInProgress,
    loadingStates
  ]);
  

  useEffect(() => {
    // Check if there are any ideas without images
    const hasIdeasWithoutImages = acceptedIdeas.some(
      idea => !generatedImages[idea.idea_id]
    );
    
    // Only trigger batch generation if there are ideas without images
    if (hasIdeasWithoutImages && !imageGenerationInProgress) {
      generateImagesSequentially();
    }
  }, [acceptedIdeas, imageGenerationInProgress, generatedImages]);

  const handleRestoreVersion = (restoredData) => {
    // Handle both complete version restore and single image restore
    const isImageOnlyRestore = selectedImage && !restoredData.product_name;

    if (isImageOnlyRestore) {
      // Update just the image for the existing idea
      setGeneratedImages((prev) => ({
        ...prev,
        [selectedIdeaForHistory.idea_id]: `data:image/png;base64,${selectedImage.image_url}`,
      }));
    } else {
      // Update the full idea and its associated images
      const updatedIdeas = ideas.map((idea) =>
        idea.idea_id === selectedIdeaForHistory.idea_id
          ? {
              ...idea,
              product_name: restoredData.product_name,
              description: restoredData.description,
              idea_id: restoredData.id || idea.idea_id, // Preserve ID if not provided
            }
          : idea
      );
      setIdeas(updatedIdeas);

      const updatedAcceptedIdeas = acceptedIdeas.map((idea) =>
        idea.idea_id === selectedIdeaForHistory.idea_id
          ? {
              ...idea,
              product_name: restoredData.product_name,
              description: restoredData.description,
              idea_id: restoredData.id || idea.idea_id,
            }
          : idea
      );
      setAcceptedIdeas(updatedAcceptedIdeas);

      // Update images if provided
      if (restoredData.images && restoredData.images.length > 0) {
        const ideaId = restoredData.id || selectedIdeaForHistory.idea_id;
        setGeneratedImages((prev) => ({
          ...prev,
          [ideaId]: `data:image/png;base64,${restoredData.images[0].image_url}`,
        }));
      }
    }

    // Reset selection state
    setShowVersionHistory(false);
    setSelectedIdeaForHistory(null);
    setSelectedImage(null);
    setSelectedVersion(null);
  };
  // Update the existing modal section in the return statement to include both image preview and version history
  const renderVersionHistoryModal = () => {
    if (!showVersionHistory || !selectedIdeaForHistory) return null;

    return (
      <div className="fixed inset-0 bg-[#5e4636]/20 dark:bg-black/50 flex items-start justify-center pt-20 p-4 z-50">
      <div className="bg-[#faf4ee] dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[80vh] flex border border-[#d6cbbf] dark:border-gray-700">
          {/* Version History Panel */}
          <div className="flex-1 max-w-4xl">
            <VersionHistory
              idea={selectedIdeaForHistory}
              onRestoreVersion={handleRestoreVersion}
              onClose={() => {
                setShowVersionHistory(false);
                setSelectedIdeaForHistory(null);
                setSelectedImage(null);
              }}
              onSelectImage={handleImageVersionSelect}
            />
             </div>
          

          {/* Image Preview Panel */}
          {selectedImage && (
          <div className="w-96 border-l border-[#e3d5c8] dark:border-gray-700 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#0a3b25] dark:text-white">
                Image Preview
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="aspect-square rounded-lg overflow-hidden bg-[#f5e6d8] dark:bg-gray-900 mb-4 border border-[#d6cbbf] dark:border-gray-700">
                <img
                  src={`data:image/png;base64,${selectedImage.image_url}`}
                  alt="Selected version"
                  className="w-full h-full object-cover"
                />
              </div>

              {selectedImage.parameters && (
                <div className="space-y-2">
                  <h4 className="font-medium text-[#5e4636] dark:text-white">
                    Parameters
                  </h4>
                  <div className="text-sm text-[#5a544a] dark:text-gray-400">
                    {Object.entries(
                      JSON.parse(selectedImage.parameters)
                    ).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">
                          {key.replace("_", " ")}:
                        </span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
                <div className="mt-4 text-sm text-gray-400">
                  Created: {format(new Date(selectedImage.created_at), "PPpp")}
                </div>

                <div className="space-y-2 mt-4">
                  <button
                    onClick={() =>
                      handleRestoreVersion({
                        image_url: selectedImage.image_url,
                      })
                    }
                    className="w-full btn btn-secondary"
                  >
                    Restore Image Only
                  </button>
                  {selectedVersion && (
                    <button
                      onClick={() => handleRestoreVersion(selectedVersion)}
                      className="w-full btn btn-primary"
                    >
                      Restore Full Version
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

// Replace the first useEffect with this improved version
useEffect(() => {
  // Skip if we've already processed this project loading
  if (initializedFromDoc) return;
  
  // Determine the source of project loading
  if (location.state?.fromDocQA && location.state?.idea_parameters) {
    // Coming from Doc Q&A with new parameters
    console.log("Loading project from Doc Q&A integration");
    setProjectSource('doc_qa');
    
    if (location.state.newProject && location.state.newProject.id) {
      console.log("New project data received:", location.state.newProject);
      
      // Populate current project with the new project data
      const newProject = {
        id: location.state.newProject.id,
        name: location.state.newProject.name,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        formData: {
          product: "",
          brand: "",
          category: "",
          number_of_ideas: 3,
          negative_prompt: ""
        },
        dynamicFields: {},
        ideas: [],
        acceptedIdeas: [],
        generatedImages: {},
        fieldActivation: {},
        customFieldTypes: []
      };
      
      console.log("Setting current project to:", newProject);
      setCurrentProject(newProject);
      
      // Set docParams for the modal
      setDocParams({
        document_id: location.state.document_id,
        document_name: location.state.document_name,
        idea_parameters: location.state.idea_parameters,
        main_project_id: location.state.main_project_id
      });
      
      // Show the modal to ask about auto-filling
      setShowDocParamsModal(true);
      setInitializedFromDoc(true);
      
      // Clean up the location state to prevent the modal from appearing on refresh
      window.history.replaceState({}, document.title);
    }
  } else if (currentProject?.id) {
    // Normal project loading
    console.log("Loading existing project:", currentProject.id);
    setProjectSource('normal');
    setInitializedFromDoc(true); // Mark as initialized to prevent modal
  }
}, [location.state, initializedFromDoc, currentProject, setCurrentProject]);

// Add this effect to save the project when it changes and we're not coming from Doc Q&A
useEffect(() => {
  // Only auto-save if we have a project and not in the middle of Doc Q&A initialization
  if (currentProject?.id && initializedFromDoc && projectSource === 'normal') {
    console.log("Auto-saving project changes");
    saveProject(currentProject);
  }
}, [currentProject, initializedFromDoc, projectSource, saveProject]);


// Update the useEffect in IdeaForm.jsx to ensure the modal only appears when coming from Doc Q&A
useEffect(() => {
  // Only process if we haven't initialized yet AND we have location state from Doc Q&A
  if (!initializedFromDoc && location.state?.fromDocQA && location.state?.idea_parameters) {
    console.log("Location state received from Doc Q&A:", location.state);
    
    // Check if we have a new project data in the state
    if (location.state.newProject && location.state.newProject.id) {
      console.log("New project data received:", location.state.newProject);
      
      // Set docParams for the modal
      setDocParams({
        document_id: location.state.document_id,
        document_name: location.state.document_name,
        idea_parameters: location.state.idea_parameters,
        main_project_id: location.state.main_project_id
      });
      
      // Show the modal to ask about auto-filling
      setShowDocParamsModal(true);
      setInitializedFromDoc(true);
      
      // Clean up the location state to prevent the modal from appearing on refresh
      window.history.replaceState({}, document.title);
    }
  }
}, [location.state, initializedFromDoc, setCurrentProject]);

// Add this useEffect to ensure we don't lose work when loading existing projects
useEffect(() => {
  // If we have a current project with ID but it's not from Doc Q&A, mark as initialized
  if (currentProject?.id && !location.state?.fromDocQA) {
    setInitializedFromDoc(true);
    setShowDocParamsModal(false); // Ensure modal is closed for existing projects
  }
}, [currentProject, location.state]);

// Add a cleanup effect to reset the state when unmounting
useEffect(() => {
  return () => {
    setInitializedFromDoc(false);
    setShowDocParamsModal(false);
  };
}, []);

const isMountedRef = useRef(true);

// Set up the mounted ref
useEffect(() => {
  isMountedRef.current = true;
  
  return () => {
    isMountedRef.current = false;
  };
}, []);
 
const fillFormWithDocParams = () => {
  if (!isMountedRef.current || !docParams || !currentProject) return;
  
  // Rest of your function remains the same
  const params = docParams.idea_parameters;
  console.log("Filling form with parameters:", params);
  
  // Helper function to safely extract string values
  const safeString = (value) => {
    if (!value) return '';
    return typeof value === 'string' ? value : JSON.stringify(value);
  };
  
  // Set base form data
  const updatedFormData = {
    product: safeString(params.Concept),
    brand: safeString(params.Brand_Name),
    category: safeString(params.Category),
    number_of_ideas: 3, // Default value
    negative_prompt: safeString(params.negative_terms)
  };
  
  // Create dynamic fields from the parameters
  const newDynamicFields = {};
  const newFieldActivation = {};
  const customFieldTypes = [];
  
  // Handle Benefits
  if (params.Benefits) {
    let benefitsValues = params.Benefits;
    
    // Parse if it's a stringified array
    if (typeof benefitsValues === 'string' && benefitsValues.startsWith('[') && benefitsValues.endsWith(']')) {
      try {
        benefitsValues = JSON.parse(benefitsValues);
      } catch (e) {
        benefitsValues = [benefitsValues]; // Keep as single item if parsing fails
      }
    }
    
    // Convert to array if it's not already
    if (!Array.isArray(benefitsValues)) {
      benefitsValues = [benefitsValues];
    }
    
    // Create a field for each benefit
    benefitsValues.forEach((benefit, index) => {
      const fieldId = `benefits-${index + 1}`;
      newDynamicFields[fieldId] = {
        type: 'Benefits',
        value: typeof benefit === 'string' ? benefit : String(benefit),
        active: true
      };
      newFieldActivation[fieldId] = true;
    });
  }
  
  // Handle RTB (Reason to Believe)
  if (params.RTB) {
    let rtbValues = params.RTB;
    
    // Parse if it's a stringified array
    if (typeof rtbValues === 'string' && rtbValues.startsWith('[') && rtbValues.endsWith(']')) {
      try {
        rtbValues = JSON.parse(rtbValues);
      } catch (e) {
        rtbValues = [rtbValues]; // Keep as single item if parsing fails
      }
    }
    
    // Convert to array if it's not already
    if (!Array.isArray(rtbValues)) {
      rtbValues = [rtbValues];
    }
    
    // Create a field for each RTB
    rtbValues.forEach((rtb, index) => {
      const fieldId = `rtb-${index + 1}`;
      newDynamicFields[fieldId] = {
        type: 'RTB',
        value: typeof rtb === 'string' ? rtb : String(rtb),
        active: true
      };
      newFieldActivation[fieldId] = true;
    });
  }
  
  // Handle Ingredients
  if (params.Ingredients) {
    let ingredientsValues = params.Ingredients;
    
    // Parse if it's a stringified array
    if (typeof ingredientsValues === 'string' && ingredientsValues.startsWith('[') && ingredientsValues.endsWith(']')) {
      try {
        ingredientsValues = JSON.parse(ingredientsValues);
      } catch (e) {
        ingredientsValues = [ingredientsValues]; // Keep as single item if parsing fails
      }
    }
    
    // Convert to array if it's not already
    if (!Array.isArray(ingredientsValues)) {
      ingredientsValues = [ingredientsValues];
    }
    
    // Create a field for each ingredient
    ingredientsValues.forEach((ingredient, index) => {
      const fieldId = `ingredients-${index + 1}`;
      newDynamicFields[fieldId] = {
        type: 'Ingredients',
        value: typeof ingredient === 'string' ? ingredient : String(ingredient),
        active: true
      };
      newFieldActivation[fieldId] = true;
    });
  }
  
  // Handle Features
  if (params.Features) {
    let featuresValues = params.Features;
    
    // Parse if it's a stringified array
    if (typeof featuresValues === 'string' && featuresValues.startsWith('[') && featuresValues.endsWith(']')) {
      try {
        featuresValues = JSON.parse(featuresValues);
      } catch (e) {
        featuresValues = [featuresValues]; // Keep as single item if parsing fails
      }
    }
    
    // Convert to array if it's not already
    if (!Array.isArray(featuresValues)) {
      featuresValues = [featuresValues];
    }
    
    // Create a field for each feature
    featuresValues.forEach((feature, index) => {
      const fieldId = `features-${index + 1}`;
      newDynamicFields[fieldId] = {
        type: 'Features',
        value: typeof feature === 'string' ? feature : String(feature),
        active: true
      };
      newFieldActivation[fieldId] = true;
    });
  }
  
  // Handle Theme as a custom field
  if (params.Theme) {
    let themeValues = params.Theme;
    
    // Parse if it's a stringified array
    if (typeof themeValues === 'string' && themeValues.startsWith('[') && themeValues.endsWith(']')) {
      try {
        themeValues = JSON.parse(themeValues);
      } catch (e) {
        themeValues = [themeValues]; // Keep as single item if parsing fails
      }
    }
    
    // Convert to array if it's not already
    if (!Array.isArray(themeValues)) {
      themeValues = [themeValues];
    }
    
    // Add Theme to custom field types if not already included
    if (!customFieldTypes.includes('Theme')) {
      customFieldTypes.push('Theme');
    }
    
    // Create a field for each theme
    themeValues.forEach((theme, index) => {
      const fieldId = `theme-${index + 1}`;
      newDynamicFields[fieldId] = {
        type: 'Theme',
        value: typeof theme === 'string' ? theme : String(theme),
        active: true
      };
      newFieldActivation[fieldId] = true;
    });
  }
  
  // Handle Demographics as a custom field
  if (params.Demographics) {
    let demographicsValues = params.Demographics;
    
    // Parse if it's a stringified array
    if (typeof demographicsValues === 'string' && demographicsValues.startsWith('[') && demographicsValues.endsWith(']')) {
      try {
        demographicsValues = JSON.parse(demographicsValues);
      } catch (e) {
        demographicsValues = [demographicsValues]; // Keep as single item if parsing fails
      }
    }
    
    // Convert to array if it's not already
    if (!Array.isArray(demographicsValues)) {
      demographicsValues = [demographicsValues];
    }
    
    // Add Demographics to custom field types if not already included
    if (!customFieldTypes.includes('Demographics')) {
      customFieldTypes.push('Demographics');
    }
    
    // Create a field for each demographic
    demographicsValues.forEach((demographic, index) => {
      const fieldId = `demographics-${index + 1}`;
      newDynamicFields[fieldId] = {
        type: 'Demographics',
        value: typeof demographic === 'string' ? demographic : String(demographic),
        active: true
      };
      newFieldActivation[fieldId] = true;
    });
  }
  
  // Create updated project
  const updatedProject = {
    ...currentProject,
    formData: updatedFormData,
    dynamicFields: newDynamicFields,
    fieldActivation: newFieldActivation,
    customFieldTypes: customFieldTypes
  };
  
  console.log("Updated project with document parameters:", updatedProject);
  
  if (isMountedRef.current) {
    setCurrentProject(updatedProject);
    saveProject(updatedProject);
    setShowDocParamsModal(false);
    
    toast.success(`Form auto-filled with parameters from "${docParams.document_name}"`, {
      position: "bottom-right",
      autoClose: 3000
    });
  }
};

  // Add the Document Parameters Modal
  // Updated DocumentParamsModal with type checking
  const DocumentParamsModal = () => {
    if (!isMountedRef.current || !showDocParamsModal || !docParams) return null;
    
    // Debug the parameters
    console.log("Document parameters for modal:", docParams.idea_parameters);
    
    return (
      <div className="fixed inset-0 bg-[#faf4ee]/70 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
  <div className="bg-white shadow-lg dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-xl max-w-lg w-full border border-[#e8ddcc] dark:border-purple-500/30 overflow-hidden">
    <div className="p-5 bg-gradient-to-r from-[#f5e6d8] to-[#e9dcc9] dark:from-purple-600/30 dark:to-blue-600/30 border-b border-[#d6cbbf] dark:border-purple-500/20 flex justify-between items-center">
      <h3 className="text-xl font-bold text-[#0a3b25] dark:text-white">
        Document Parameters Detected
      </h3>
      <button 
        onClick={() => setShowDocParamsModal(false)}
        className="text-[#5e4636] hover:text-[#a55233] dark:text-gray-300 dark:hover:text-white transition-colors"
        aria-label="Close modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div className="p-6">
      <p className="text-[#5e4636] dark:text-gray-300 mb-4">
        Parameters have been extracted from <span className="font-semibold text-[#a55233] dark:text-purple-300">"{docParams.document_name}"</span>.
      </p>
      
      <div className="bg-[#faf4ee] dark:bg-gray-800/50 rounded-lg p-4 mb-6 border border-[#e8ddcc] dark:border-gray-700/50">
        <h4 className="text-sm font-medium text-[#5a544a] dark:text-gray-300 mb-2">Detected parameters:</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.entries(docParams.idea_parameters).map(([key, value]) => {
            // Check if value exists and convert to string safely
            const displayValue = value ? 
              (typeof value === 'string' ? 
                value : 
                JSON.stringify(value)) 
              : '';
            
            // Only render if there's a value
            return displayValue ? (
              <div key={key} className="flex flex-col">
                <span className="text-xs text-[#556052] dark:text-purple-400">{key}</span>
                <span className="text-[#5e4636] dark:text-white truncate">
                  {displayValue.length > 30 ? 
                    `${displayValue.substring(0, 30)}...` : 
                    displayValue}
                </span>
              </div>
            ) : null;
          })}
        </div>
      </div>
      
      <p className="text-[#5a544a] dark:text-gray-400 mb-6 text-sm">
        Would you like to use these parameters to pre-fill the idea generation form?
      </p>
      
      <div className="flex justify-end gap-4">
        <button
          onClick={() => setShowDocParamsModal(false)}
          className="px-4 py-2 bg-white hover:bg-[#f5e6d8] text-[#5e4636] rounded-lg transition-colors border border-[#d6cbbf] dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
        >
          No, Start Fresh
        </button>
        
        <button
          onClick={fillFormWithDocParams}
          className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] text-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-blue-500 dark:hover:from-purple-700 dark:hover:to-blue-600 rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          Yes, Auto-Fill Form
        </button>
      </div>
    </div>
  </div>
</div>
    );
  };

  return (
    <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'dark:bg-black' : 'bg-[#faf4ee]'} overflow-hidden`}>
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

 
      {/* Add an overlay to ensure content readability */}
      {/* <div className="absolute inset-0 bg-[#faf4ee]/90 dark:bg-black/50" /> */}
      <ScrollNavigationButtons />
      {/* Wrap all content in a relative container to appear above the overlay */}
      <div className="relative">
        <nav className="navbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Header />
  
            <div className="flex items-center justify-center h-14">
              <h1 className="text-xl font-bold text-[#0a3b25] dark:text-white">Idea Generator</h1>
            </div>
          </div>
        </nav>
  
        <main className="container mx-auto px-4 py-8 pt-2">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Navigation Section */}
            <div className="sticky top-[4rem] z-40 bg-white/80 dark:bg-gray-800 border border-[#d6cbbf] hover:border-[#a68a70] dark:border-gray-700 dark:hover:border-green-500/50 p-4 rounded-lg shadow-lg">
  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
    <div className="flex flex-wrap lg:flex-nowrap items-center gap-4">
      <button
        onClick={() => setShowProjectList(true)}
        className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-[#f5e6d8] dark:hover:bg-gray-600 border border-[#d6cbbf] dark:border-gray-600 hover:border-[#a68a70] dark:hover:border-green-500/50 text-[#5e4636] dark:text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <ArrowLeft size={16} />
        All Idea Sessions
      </button>
      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="flex-1 min-w-[200px] px-4 py-2 bg-white/80 dark:bg-gray-700 text-[#5e4636] dark:text-white rounded-lg border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500 dark:focus:ring-opacity-50 transition-all"
        placeholder="Project Name"
      />
    </div>
    {!showForm && (
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleBackToForm}
          className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-[#f5e6d8] dark:hover:bg-gray-600 text-[#5e4636] dark:text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap border border-[#d6cbbf] dark:border-gray-600"
        >
          <ArrowLeft size={16} />
          Back to Form
        </button>
        <PowerPointExport
          ideas={acceptedIdeas}
          generatedImages={generatedImages}
          versionHistory={rawVersionHistory}
        />
      </div>
    )}
  </div>
</div>
            {/* Form View */}
            {showForm ? (
              <div className={`top-4 z-10 animate-fade-in ${theme === 'dark' ? 'bg-gray-900/90' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-[#e8ddcc]'} rounded-lg p-6 shadow-lg`}>
                <h2 className={`text-2xl font-serif ${theme === 'dark' ? 'text-white' : 'text-[#0a3b25]'} text-center mb-8`}>
                  Generate Ideas
                </h2>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Base Fields */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-300 mb-2">
                        Concept / Idea<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="product"
                        name="product"
                        value={formData.product}
                        onChange={handleBaseFieldChange}
                        required
                        className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700 text-[#5e4636] dark:text-white rounded-lg border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500"
                        placeholder="Enter concept or idea..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-300 mb-2">
                        Area / Category <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleBaseFieldChange}
                        required
                        className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700 text-[#5e4636] dark:text-white rounded-lg border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500"
                        placeholder="Enter area or category..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-300 mb-2">
                        Brand
                      </label>
                      <input
                        type="text"
                        id="brand"
                        name="brand"
                        value={formData.brand}
                        onChange={handleBaseFieldChange}
                        className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700 text-[#5e4636] dark:text-white rounded-lg border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500"
                        placeholder="Enter brand name"
                      />
                    </div>
                  </div>
  
                  {/* Dynamic Fields Section */}
                  <div className="space-y-6">
                    <div className="border-t border-[#e3d5c8] dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-medium text-[#0a3b25] dark:text-white mb-4">
                        Dynamic Fields
                      </h3>
  
                      {/* Custom Field Addition */}
                      <div className="bg-[#e9dcc9]/50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
                        {/* Custom Field Manager */}
                        <FieldManager
                          predefinedFieldTypes={predefinedFieldTypes}
                          customFieldTypes={customFieldTypes}
                          setCustomFieldTypes={setCustomFieldTypes}
                          addField={addField}
                          newCustomField={newCustomField}
                          setNewCustomField={setNewCustomField}
                          dynamicFields={dynamicFields}
                          setDynamicFields={setDynamicFields}
                          currentProject={currentProject}
                          saveProject={saveProject}
                        />
                      </div>
                    </div>
  
                    {/* Dynamic Field Inputs */}
                    <div className="space-y-4 mt-6">
                      {Object.entries(dynamicFields).map(([fieldId, field]) => (
                        <div key={fieldId} className="flex gap-2 items-center">
                          <div className="flex-1">
                            <div className="flex flex-1 gap-2">
                              <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-300 mb-2">
                                {field.type}
                              </label>
                              {/* Activation Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleFieldActivation(fieldId)}
                                className="text-[#5a544a] dark:text-gray-400 hover:text-[#a55233] dark:hover:text-white transition-colors mb-2"
                                title={
                                  fieldActivation[fieldId]
                                    ? "Deactivate"
                                    : "Activate"
                                }
                              >
                                {fieldActivation[fieldId] ? (
                                  <ToggleRight
                                    size={24}
                                    className="text-[#556052] dark:text-green-500"
                                  />
                                ) : (
                                  <ToggleLeft
                                    size={24}
                                    className="text-[#d6cbbf] dark:text-gray-600"
                                  />
                                )}
                              </button>
                            </div>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) =>
                                handleDynamicFieldChange(
                                  fieldId,
                                  e.target.value
                                )
                              }
                              className={`w-full px-4 py-2 bg-white/80 dark:bg-gray-700 text-[#5e4636] dark:text-white rounded-lg border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500 ${
                                fieldActivation[fieldId] === false
                                  ? "opacity-50"
                                  : ""
                              }`}
                              placeholder={`Enter ${field.type.toLowerCase()}`}
                              disabled={fieldActivation[fieldId] === false}
                            />
                          </div>
  
                          <button
                            type="button"
                            onClick={() => removeField(fieldId)}
                            className="px-3 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg self-end flex items-center justify-center"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center mb-2">
                      <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-300 mr-2">
                        Negative Prompt
                      </label>
  
                      <AlertTriangle size={16} className="text-[#556052] dark:text-blue-400" />
                    </div>
                    <textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700 text-[#5e4636] dark:text-white rounded-lg border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500"
                      placeholder="Enter terms or concepts to exclude (comma-separated)"
                      rows={3}
                    />
                    <p className="text-xs text-[#5a544a] dark:text-gray-400 mt-2">
                      Separate multiple terms with commas for best results
                    </p>
                  </div>
                  <div className="border-t border-[#e3d5c8] dark:border-gray-700 pt-6">
                    <div className="flex flex-col md:flex-row md:gap-6">
                      {/* Number of Ideas Field */}
                      <div className="flex-1 mb-4 md:mb-0">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-300">
                            Number of Ideas
                            {hasManuallySetIdeas && (
                              <span className="text-xs text-[#8c715f] dark:text-gray-500 ml-2">
                                (Manual)
                              </span>
                            )}
                          </label>
                          {hasManuallySetIdeas && (
                            <button
                              type="button"
                              onClick={resetNumberOfIdeas}
                              className="text-xs text-[#a55233] hover:text-[#8b4513] dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Reset to Auto
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            name="number_of_ideas"
                            value={formData.number_of_ideas}
                            onChange={handleBaseFieldChange}
                            min="1"
                            max="5"
                            required
                            className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700 text-[#5e4636] dark:text-white rounded-lg border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500"
                          />
                          {/* {!hasManuallySetIdeas && (
                            <span className="text-xs text-[#5a544a] dark:text-gray-400">
                              Auto-calculated
                            </span>
                          )} */}
                        </div>
                      </div>
  
                      {/* Idea Description Length Field */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-[#5e4636] dark:text-gray-300">
                            Idea's Length (words)
                          </label>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            name="description_length"
                            value={formData.description_length || 70}
                            onChange={handleBaseFieldChange}
                            min="60"
                            max="250"
                            required
                            className="w-full px-4 py-2 bg-white/80 dark:bg-gray-700 text-[#5e4636] dark:text-white rounded-lg border border-[#d6cbbf] dark:border-gray-600 focus:border-[#a55233] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#a55233]/50 dark:focus:ring-blue-500"
                          />
                          <span className="text-xs text-[#5a544a] dark:text-gray-400">
                            Range: 60-250
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* Generate Button */}
                  <div className="flex justify-center pt-6 space-x-4">
                    <CircularProgressButton
                      type="submit"
                      disabled={!hasFormChanged || isLoading}
                      isLoading={isLoading}
                      currentIdea={currentIdeaProgress}
                      totalIdeas={totalIdeasExpected}
                      className={`px-12 py-3 text-lg rounded-lg transition-all ${
                        !hasFormChanged
                          ? "bg-[#d6cbbf] text-[#5e4636] dark:opacity-50 dark:cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                          : "bg-[#a55233] hover:bg-[#8b4513] text-white dark:bg-gradient-to-r dark:from-blue-500 dark:to-emerald-500 dark:hover:from-blue-600 dark:hover:to-emerald-600 dark:text-white"
                      }`}
                    >
                      Generate Ideas
                    </CircularProgressButton>
                    {ideas.length > 0 && (
                      <button
                        type="button"
                        onClick={handleNavigateToIdeas}
                        className="px-12 py-3 text-lg bg-white hover:bg-[#f5e6d8] text-[#5e4636] border border-[#d6cbbf] dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white rounded-lg transition-all"
                      >
                        View Existing Ideas
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) :  (
              <div
    style={{ marginTop: "0.5rem" }}
    className="sticky top-2 z-10 rounded-lg border border-[#e8ddcc] dark:border-gray-700 p-6 animate-fade-in bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg"
  >
    <div className="flex justify-between items-center mb-6 gap-2">
      <h3 className="flex items-center gap-2 text-2xl font-sergoe text-[#0c393b] dark:text-emerald-400">
        Ideas List
        <span className="px-3 py-1 bg-[#556052]/20 dark:bg-indigo-600/50 border border-[#556052]/30 dark:border-indigo-500/50 rounded-full text-sm font-medium text-[#556052] dark:text-white">
          {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
        </span>
        {acceptedIdeas.length > 0 && (
          <span className="px-3 py-1 ml-2 bg-[#3f4f54]/20 dark:bg-emerald-600/50 border border-[#3f4f54]/30 dark:border-emerald-500/50 rounded-full text-sm font-medium text-[#3f4f54] dark:text-white">
            {acceptedIdeas.length} generated
          </span>
        )}
      </h3>
      
    </div>
    {/* Modified idea cards with integrated image generation */}
    <div className="space-y-6">
    {ideas.map((idea) => {
  const ideaId = idea.idea_id.toString();
  const isAccepted = acceptedIdeas.some(accepted => accepted.idea_id === idea.idea_id);

  return (
    <div 
      key={ideaId}
      className={`relative p-6 rounded-lg border ${
        isAccepted 
          ? "border-[#3f4f54] border-l-4 bg-white/90 dark:bg-gray-800/90 shadow-md" 
          : "border-[#e8ddcc] hover:border-[#a68a70] bg-white/80 dark:bg-gray-800/80 dark:border-gray-700 dark:hover:border-green-500"
      } transition-all hover:shadow-lg`}
    >
      {/* Rest of your idea card JSX */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex-1">
          {editingIdea === idea.idea_id ? (
              <EditIdeaPanel
                editForm={editForm}
                handleEditChange={handleEditChange}
                handleUpdateIdea={handleUpdateIdea}
                setEditingIdea={setEditingIdea}
                ideaId={idea.idea_id}
                isLoading={loadingStates[idea.idea_id]} // Pass the loading state
                className="mb-4"
              />
            ) : (
            <>
             <div className="flex flex-1 gap-2 items-center">
              
            
             <input
                type="checkbox"
                checked={isAccepted}
                onChange={() => {
                  if (isAccepted) {
                    handleUnaccept(idea.idea_id);
                  } else {
                    handleAccept(idea.idea_id);
                  }
                }}
                className="w-4 h-4 accent-[#ace000] dark:accent-emerald-600 mt-0 mb-1"
              />

                     
                      <div className="flex-1 flex items-center mt-0.5">
                <IdeaTitle idea={idea} />
              </div>
            </div>

              <div className="text-[#5e4636] dark:text-gray-300 mb-4 text-justify leading-relaxed">
                <HighlightedDescription
                  description={idea.description}
                  dynamicFields={dynamicFields}
                  formData={formData}
                  isComparisonMode={isComparisonMode}
                />
                <IdeaAnalysis
                  idea={idea}
                  dynamicFields={dynamicFields}
                  formData={formData}
                  isComparisonMode={isComparisonMode}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <IdeaMetadata ideaMetadata={ideaMetadata[idea.idea_id]} />
                <button
                  onClick={() => handleEdit(idea)}
                  className="px-4 py-2 bg-[#f8fbe5] hover:bg-[#ebf4b8] text-[#5e4636] border border-[#d6cbbf] dark:bg-yellow-600 dark:hover:bg-yellow-700 dark:text-white rounded-lg flex items-center gap-2 transition-colors"
                  title="Edit idea"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => openDeleteModal(idea)}
                  className="px-4 py-2 bg-[#fbe5e5] hover:bg-[#fbb8b8] text-[#a55233] border border-[#d6cbbf] dark:bg-red-700 dark:hover:bg-red-800 dark:text-white rounded-lg flex items-center gap-2 transition-colors"
                  title="Delete idea"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Add image section to the right */}
        {isAccepted && (
          <div className="w-full md:w-1/2 lg:w-1/3">
            {generatedImages[ideaId] ? (
              <div className="relative aspect-square rounded-lg overflow-hidden border border-[#d6cbbf] dark:border-gray-700">
                <img
                  src={generatedImages[ideaId]}
                  alt={idea.product_name}
                  className="object-cover w-full h-full"
                  onClick={() => {
                    setZoomImageUrl(generatedImages[ideaId]);
                    setIsZoomOpen(true);
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full aspect-square bg-[#f5e6d8] dark:bg-gray-700 rounded-lg border border-[#d6cbbf] dark:border-gray-600">
                {loadingStates[ideaId] ? (
                  <div className="loader"></div>
                ) : (
                  <span className="text-[#5a544a] dark:text-gray-400">
                    Generating image...
                  </span>
                )}
              </div>
            )}
            
            {/* Image controls for regenerating */}
            {generatedImages[ideaId] && (
              <div className="mt-2 flex flex-wrap gap-2 items-center justify-center">
                
                
                <AdvancedRegenControls
                  idea={idea}
                  onRegenerate={handleRegenerateImage}
                  isLoading={loadingStates[ideaId]}
                />
                
                <button
                  onClick={() => handleViewHistory(idea)}
                  className="px-3 py-2 bg-[#a55233] hover:bg-[#8b4513] text-[#ffffff] border border-[#d6cbbf] dark:bg-gradient-to-r dark:from-purple-500 dark:to-indigo-600 dark:hover:from-purple-600 dark:hover:to-indigo-700 dark:text-white rounded-lg flex items-center gap-2 transition-colors"
                  title="Versions History"
                >
                  <Clock size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOVED: Delete Confirmation Modal - Now outside image section and available for ALL ideas */}
      {showDeleteModal && ideaToDelete && ideaToDelete.idea_id === idea.idea_id && (
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg animate-fadeIn"
          onClick={closeDeleteModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full border border-[#e8ddcc] dark:border-red-700 p-6 mx-4 animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#a55233] dark:text-red-400 mb-4 flex items-center gap-2">
              <Trash2 size={20} className="text-[#a55233] dark:text-red-400" />
              Delete Idea?
            </h3>
            <p className="text-[#5e4636] dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold">{ideaToDelete.product_name}</span>?<br />
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-white hover:bg-[#f5e6d8] text-[#5e4636] border border-[#d6cbbf] dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteIdea}
                disabled={isLoading}
                className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] text-white dark:bg-red-700 dark:hover:bg-red-800 rounded-lg disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
})}
    </div>
  </div>
)}
            {error && (
              <div
                className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-white px-4 py-3 rounded-lg border border-red-200 dark:border-transparent"
                role="alert"
              >
                <p className="font-medium">{error}</p>
              </div>
            )}
  
            {showVersionHistory && selectedIdeaForHistory && (
              <div className="fixed inset-0 dark:bg-black/50  flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex border border-[#d6cbbf] dark:border-gray-700">
                  {/* Version History Panel */}
                  <div className="flex-1 max-w-4xl">
                    {renderVersionHistoryModal()}
                  </div>
  
                </div>
              </div>
            )}
            {/* Image Zoom Modal */}
            <ZoomImageViewer
              isOpen={isZoomOpen}
              onClose={() => setIsZoomOpen(false)}
              imageUrl={zoomImageUrl}
            />
          </div>
        </main>
      </div>
      <DocumentParamsModal />
      <style>{`
      .loader {
    animation: rotate 1s infinite;
    height: 50px;
    width: 50px;
  }

  .loader:before,
  .loader:after {
    border-radius: 50%;
    content: "";
    display: block;
    height: 20px;
    width: 20px;
  }
  .loader:before {
    animation: ball1 1s infinite;
    background-color: #fff;
    box-shadow: 30px 0 0 #ff3d00;
    margin-bottom: 10px;
  }
  .loader:after {
    animation: ball2 1s infinite;
    background-color: #ff3d00;
    box-shadow: 30px 0 0 #fff;
  }

  @keyframes rotate {
    0% { transform: rotate(0deg) scale(0.8) }
    50% { transform: rotate(360deg) scale(1.2) }
    100% { transform: rotate(720deg) scale(0.8) }
  }

  @keyframes ball1 {
    0% {
      box-shadow: 30px 0 0 #ff3d00;
    }
    50% {
      box-shadow: 0 0 0 #ff3d00;
      margin-bottom: 0;
      transform: translate(15px, 15px);
    }
    100% {
      box-shadow: 30px 0 0 #ff3d00;
      margin-bottom: 10px;
    }
  }

  @keyframes ball2 {
    0% {
      box-shadow: 30px 0 0 #fff;
    }
    50% {
      box-shadow: 0 0 0 #fff;
      margin-top: -20px;
      transform: translate(15px, 15px);
    }
    100% {
      box-shadow: 30px 0 0 #fff;
      margin-top: 0;
    }
  }

  @keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

.animate-slideIn {
  animation: slideIn 0.25s ease-out;
}
  
      `}</style>
    </div>
  );
};

export default IdeaForm;