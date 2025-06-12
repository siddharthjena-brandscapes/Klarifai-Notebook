//axiosConfig.jsx
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://klarifai-demo-2-appserver-dnd9avhfesa4h0de.centralindia-01.azurewebsites.net/api", // Your Django backend URL
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const topicModelingService = {
  uploadDataset: (formData) => {
    return axiosInstance.post("/analysis/upload_dataset/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  enhancedCustomAnalysis: (data) => {
    return axiosInstance.post(
      "/analysis/enhanced_handle_custom_analysis/",
      data
    );
  },

  analyzeSentiment: (data) => {
    return axiosInstance.post("/analysis/analyze_sentiment/", data);
  },

  semanticSearch: (data) => {
    return axiosInstance.post("/analysis/semantic_search/", data);
  },
};

export const dataAnalysisService = {
  uploadFile: (formData) => {
    return axiosInstance.post("/data/analysis/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  analyzeData: (query) => {
    return axiosInstance.post(
      "/data/analysis/",
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
  },

  saveResults: (results) => {
    return axiosInstance.post(
      "/data/save-results/",
      { results },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
  },
};

export const ideaService = {
  generateIdeas: (data) => {
    return axiosInstance.post("/ideas/generate_ideas/", data);
  },
  getIdeaDetails: (ideaId) => {
    return axiosInstance.get(`/ideas/${ideaId}/details/`); // added for Visualization_ prompt(sourav/ 11-02-2025)
  },
  updateIdea: (data) => {
    return axiosInstance.put("/ideas/update_idea/", data);
  },
  deleteIdea: (ideaId) => {
    return axiosInstance.delete("/ideas/delete_idea/", {
      data: { idea_id: ideaId },
    });
  },
  generateProductImage: (data) => {
    return axiosInstance.post("/ideas/generate_product_image/", data);
  },
  regenerateProductImage: (data) => {
    return axiosInstance.post("/ideas/regenerate_product_image/", data);
  },
  getIdeaHistory: async (ideaId) => {
    try {
      const response = await axiosInstance.get(
        `/ideas/idea-history/${ideaId}/`
      );
      return response;
    } catch (error) {
      console.error("Error fetching idea history:", error);
      throw error;
    }
  },
  restoreIdeaVersion: async (data) => {
    return await axiosInstance.post("/ideas/restore-idea-version/", {
      version_id: data.version_id,
      current_id: data.current_id,
      image_id: data.image_id,
    });
  },
  // Create project
  createProject: async (data) => {
    try {
      const response = await axiosInstance.post("/ideas/projects/", data);
      return response;
    } catch (error) {
      // Enhanced error handling
      if (error.response) {
        // Server responded with an error status
        if (error.response.status === 500) {
          const errorData = error.response.data?.toString() || "";

          // Check for duplicate key violation
          if (
            errorData.includes("duplicate key value") &&
            errorData.includes("already exists")
          ) {
            // Extract the project name from the error message if possible
            const nameMatch = errorData.match(/Key \(name\)=\(([^)]+)\)/);
            const projectName = nameMatch ? nameMatch[1] : "this name";

            // Create a user-friendly error response
            error.response.data = {
              success: false,
              error: `A project with the name "${projectName}" already exists. Please choose a different name.`,
            };
          } else {
            // For other 500 errors
            error.response.data = {
              success: false,
              error:
                "There was a server error creating your project. Please try again later.",
            };
          }
        } else if (
          !error.response.data ||
          typeof error.response.data.error === "undefined"
        ) {
          // Ensure there's a structured error response
          error.response.data = {
            success: false,
            error: error.response.statusText || "Error creating project",
          };
        }
      } else if (error.request) {
        // The request was made but no response was received
        error.response = {
          data: {
            success: false,
            error:
              "No response from server. Please check your connection and try again.",
          },
        };
      } else {
        // Something happened in setting up the request
        error.response = {
          data: {
            success: false,
            error: error.message || "Error creating project",
          },
        };
      }
      throw error;
    }
  },

 updateProject: (projectId, data) => {
  // Check if projectId is an object (in case the old pattern is used)
  if (typeof projectId === 'object' && projectId !== null && projectId.id) {
    console.log("Converting object-style projectId to ID + data format");
    data = projectId;
    projectId = projectId.id;
  }
  
  // Now ensure projectId is valid
  if (!projectId || isNaN(Number(projectId))) {
    console.error("Invalid project ID for updateProject:", projectId);
    return Promise.reject(new Error("Invalid project ID. Expected a number or numeric string."));
  }
  
  // Log the API call we're about to make
  console.log(`Making API call to update project ${projectId}`);
  
  // Make the API call
  return axiosInstance.put(`/ideas/projects/${projectId}/`, data);
},

  // Delete project
  deleteProject: (projectId) => {
    return axiosInstance.delete(`/ideas/projects/${projectId}/`);
  },

  // Get all projects - uses the GET method of project_operations view
  getProjectDetails: (params) => {
    return axiosInstance.get("/ideas/projects/", { params });
  },

  // Get single project details
  getSingleProjectDetails: (projectId, params) => {
    return axiosInstance.get(`/ideas/projects/${projectId}/details/`, {
      params,
    });
  },
};

export const authService = {
  // ... existing auth methods ...

  initiatePasswordReset: (email) => {
    return axiosInstance.post("/password-reset/initiate/", { email });
  },

  confirmPasswordReset: (token, newPassword) => {
    return axiosInstance.post("/password-reset/confirm/", {
      token,
      new_password: newPassword,
    });
  },
};

// Export services
export const documentService = {
  // uploadDocument: (formData, mainProjectId, config = {}) => {
  //   // Ensure mainProjectId is added to formData
  //   formData.append("main_project_id", mainProjectId);

  //   return axiosInstance.post("/upload-documents/", formData, {
  //     headers: {
  //       "Content-Type": "multipart/form-data",
  //     },
  //     ...config,
  //   });
  // },

  uploadDocument: (formData, mainProjectId, config = {}, targetUserId = null) => {
    // Ensure mainProjectId is added to formData
    formData.append("main_project_id", mainProjectId);
    
    // Add target_user_id if provided (for admin uploads)
    if (targetUserId) {
      formData.append("target_user_id", targetUserId);
    }
  
    return axiosInstance.post("/upload-documents/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });
  },

  checkUploadPermissions: () => {
    return axiosInstance.get('/api/check-upload-permissions/');
  },

  // Add this new method for custom upload handling
  getCustomInstance: () => {
    // Create a fresh instance with the same base config
    const customInstance = axios.create({
      baseURL: axiosInstance.defaults.baseURL,
      headers: {
        ...axiosInstance.defaults.headers,
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // Longer timeout for large uploads (2 minutes)
    });

    // Add the auth token
    const token = localStorage.getItem("token");
    if (token) {
      customInstance.defaults.headers.common[
        "Authorization"
      ] = `Token ${token}`;
    }

    return customInstance;
  },

  setActiveDocument: (documentId, mainProjectId) =>
    axiosInstance.post("/set-active-document/", {
      document_id: documentId,
      main_project_id: mainProjectId,
    }),

  getUserDocuments: async (mainProjectId) => {
    if (!mainProjectId) {
      console.warn("No mainProjectId provided to getUserDocuments");
      return { data: [] };
    }

    try {
      console.log("Fetching documents for project:", mainProjectId);
      const response = await axiosInstance.get("/user-documents/", {
        params: { main_project_id: mainProjectId },
      });
      console.log("Documents response:", response.data);
      return response;
    } catch (error) {
      console.error("Error in getUserDocuments:", error);
      return { data: [] };
    }
  },

  getOriginalDocument: (documentId) => {
    return axiosInstance.get(`/documents/${documentId}/original/`, {
      responseType: "blob", // Important for handling binary files
    });
  },

  trackDocumentView: (documentId, mainProjectId) => {
    return axiosInstance.post(`/documents/${documentId}/view-log/`, {
      main_project_id: mainProjectId,
    });
  },

  getChatHistory: () => {
    return axiosInstance.get("/chat-history/", {
      params: {
        limit: 50, // Optional: limit number of chats
        include_messages: true,
        include_documents: true,
      },
    });
  },
  generateSummary: (documentIds, mainProjectId) => {
    return axiosInstance.post("/generate-document-summary/", {
      document_ids: documentIds,
      main_project_id: mainProjectId,
    });
  },

  generateConsolidatedSummary: (documentIds, projectId) => {
    return axiosInstance.post("/consolidated_summary/", {
      document_ids: documentIds,
      main_project_id: projectId,
    });
  },

  generateIdeaContext: (data) =>
    axiosInstance.post("/generate-idea-context/", {
      document_id: data.document_id,
      main_project_id: data.main_project_id,
    }),

  deleteDocument: (documentId, mainProjectId) =>
    axiosInstance.delete(`/documents/${documentId}/delete/`, {
      params: { main_project_id: mainProjectId },
    }),

  searchDocumentContent: (data) => {
    return axiosInstance.post("/search-document-content/", {
      query: data.query,
      main_project_id: data.main_project_id,
    });
  },

  
};

export const chatService = {
  sendMessage: (data) => {
    console.log("Sending message data:", data);

    // Determine if we should use general chat mode based on document selection
    const useGeneralChat =
      !data.selected_documents ||
      data.selected_documents.length === 0 ||
      data.general_chat_mode === true;

    // Add flag to request citation processing from the backend
    const processOptions = {
      process_citations: true, // Tell backend to process citations
      citation_threshold: 0.3   // Minimum similarity threshold (optional)
    };

    return axiosInstance
      .post("/chat/", {
        message: data.message,
        conversation_id: data.conversation_id,
        selected_documents: data.selected_documents,
        main_project_id: data.main_project_id || data.mainProjectId, // Support both naming conventions
        use_web_knowledge: data.use_web_knowledge || false,
        general_chat_mode: useGeneralChat, // Automatically set based on document selection
        response_length: data.response_length || "short", // For response length parameter
        response_format: data.response_format || "auto_detect", // Add response format parameter
        citation_options: processOptions // Add citation processing options
      })
      .then((response) => {
        console.log("Chat service response:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("Chat error:", error);
        throw error;
      });
  },

  updateConversationTitle: (conversationId, data) => {
    console.log("Updating conversation title:", conversationId, data);

    // Create a properly formatted request payload
    const payload = {
      title: data.title,
      is_active: data.is_active || true,
      // Include main_project_id if available
      ...(data.main_project_id && { main_project_id: data.main_project_id }),
    };

    // Send PATCH request to the correct endpoint
    return axiosInstance
      .patch(`/conversations/${conversationId}/`, payload)
      .then((response) => {
        console.log("Conversation title update response:", response.data);
        return response;
      })
      .catch((error) => {
        console.error(
          "Conversation title update error:",
          error.response || error
        );
        throw error;
      });
  },

  manageConversation: (conversationId, data) => {
    return axiosInstance
      .patch(`/conversations/${conversationId}/`, data)
      .then((response) => {
        console.log("Conversation management response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Conversation management error:", error);
        throw error;
      });
  },

  getConversationDetails: async (conversationId, mainProjectId, processCitations = false) => {
    try {
      console.log(
        "Fetching conversation:",
        conversationId,
        "for project:",
        mainProjectId
      );
      const response = await axiosInstance.get(
        `/conversations/${conversationId}/`,
        {
          params: { main_project_id: mainProjectId },
        }
      );

      // Process citations for messages if requested and needed
      if (processCitations && response.data && response.data.messages) {
        const messages = [...response.data.messages];
        
        // Process citations for assistant messages that have citations but no markers
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          if (
            msg.role === 'assistant' && 
            msg.citations && 
            msg.citations.length > 0 && 
            !msg.content.includes('<citation id="')
          ) {
            try {
              // Process citations for this message
              const processed = await citationService.processCitations(msg.content, msg.citations);
              if (processed && processed.processed_text) {
                messages[i] = {...msg, content: processed.processed_text};
              }
            } catch (err) {
              console.warn("Failed to process citations for message:", err);
              // Continue with original message
            }
          }
        }
        
        response.data.messages = messages;
      }

      // Ensure the response is properly formatted
      if (response.data) {
        return {
          data: {
            ...response.data,
            messages: response.data.messages || [],
            selected_documents: response.data.selected_documents || [],
            follow_up_questions: response.data.follow_up_questions || [],
          },
        };
      }
      return response;
    } catch (error) {
      console.error("Error fetching conversation details:", error);
      throw error;
    }
  },

  // Add a method to fetch all conversations
  getAllConversations: async (mainProjectId) => {
    if (!mainProjectId) {
      console.warn("No mainProjectId provided to getAllConversations");
      return { data: [] };
    }

    try {
      const response = await axiosInstance.get("/chat-history/", {
        params: { main_project_id: mainProjectId },
      });
      console.log("Chat history response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return { data: [] };
    }
  },

  // Optional: Method to delete a conversation
  deleteConversation: (conversationId) => {
    return axiosInstance
      .delete(`/conversations/${conversationId}/delete/`)
      .then((response) => {
        console.log("Conversation deleted:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(
          "Failed to delete conversation:",
          error.response?.data || error.message
        );
        throw error;
      });
  },

  startConversation: (documentId, message) => {
    return axiosInstance.post("/conversation/start/", {
      document_id: documentId,
      message: message,
    });
  },

  continueConversation: (conversationId, message) => {
    return axiosInstance.post("/conversation/continue/", {
      conversation_id: conversationId,
      message: message,
    });
  },

  exportChatAsDocx: (data, config = {}) => {
    return axiosInstance.post('/export-chat/', {...data, format: 'docx'}, config);
  },
};

export const citationService = {
  // Process citations on demand (frontend approach)
  processCitations: (responseText, citations) => {
    return axiosInstance.post("/process-citations/", {
      response_text: responseText,
      citations: citations
    })
    .then(response => {
      console.log("Citations processed successfully");
      return response.data;
    })
    .catch(error => {
      console.error("Error processing citations:", error);
      throw error;
    });
  },

  // Get citation details for a specific citation (future enhancement)
  getCitationDetails: (documentId, pageNumber, sectionTitle) => {
    return axiosInstance.get("/citation-details/", {
      params: {
        document_id: documentId,
        page_number: pageNumber,
        section_title: sectionTitle
      }
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error("Error fetching citation details:", error);
      throw error;
    });
  },

  // View original source document at specific citation
  viewSourceDocument: (documentId, pageNumber) => {
    // Generate URL for viewing the document at specific page
    const url = `/documents/${documentId}/original/?page=${pageNumber || 1}`;
    
    // Open in new tab or handle as needed
    window.open(url, '_blank');
    
    // Return success for promise chaining
    return Promise.resolve({ success: true });
  }
};

export const userService = {
  getUserProfile: () => {
    return axiosInstance.get("/user/profile/");
  },

  changePassword: (currentPassword, newPassword) => {
    return axiosInstance.post("/user/change-password/", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  updateProfile: (data) => {
    return axiosInstance.put("/user/profile/", data);
  },
};

export const coreService = {
  // Create a new project
  createProject: (projectData) => {
    // Send JSON data directly instead of FormData
    return axiosInstance
      .post("/core/projects/create/", {
        name: projectData.name,
        description: projectData.description,
        category: projectData.category,
        selected_modules: projectData.selected_modules,
      })
      .then((response) => {
        console.log("Project created:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(
          "Failed to create project:",
          error.response?.data || error.message
        );
        throw error;
      });
  },
 
 
  enhancePromptWithAI: (prompt) => {
    return axiosInstance
      .post("/core/projects/enhance-prompt/", {
        prompt: prompt
      })
      .then((response) => {
        console.log("Prompt enhanced:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(
          "Failed to enhance prompt:",
          error.response?.data || error.message
        );
        throw error;
      });
  },
 
 
  uploadDocumentForPrompt: (file) => {
    const formData = new FormData();
    formData.append('document', file);
   
    return axiosInstance
      .post("/core/projects/upload-document-for-prompt/", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        console.log("Document processed:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(
          "Failed to process document:",
          error.response?.data || error.message
        );
        throw error;
      });
  },
 
  // Get all projects for current user
  getProjects: () => {
    return axiosInstance
      .get("/core/projects/")
      .then((response) => {
        console.log("Projects retrieved:", response.data);
        return response.data.projects;
      })
      .catch((error) => {
        console.error(
          "Failed to fetch projects:",
          error.response?.data || error.message
        );
        throw error;
      });
  },
 
  // Get single project details
  getProjectDetails: (projectId) => {
    return axiosInstance
      .get(`/core/projects/${projectId}/`)
      .then((response) => {
        console.log("Project details:", response.data);
        return response.data.project;
      })
      .catch((error) => {
        console.error(
          "Failed to fetch project details:",
          error.response?.data || error.message
        );
        throw error;
      });
  },
 
  // Delete a project
  deleteProject: (projectId) => {
    return axiosInstance
      .post(`/core/projects/${projectId}/delete/`)
      .then((response) => {
        console.log("Project deleted:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(
          "Failed to delete project:",
          error.response?.data || error.message
        );
        throw error;
      });
  },
 
  // Update an existing project
  // In your coreService or axiosConfig.js file
  updateProject: (projectId, projectData) => {
    return axiosInstance
      .put(`/core/projects/${projectId}/update/`, {
        name: projectData.name,
        description: projectData.description,
        category: projectData.category,
        selected_modules: projectData.selected_modules,
      })
      .then((response) => {
        console.log("Update response:", response.data); // Debug log
        return response.data.project; // Return the project object from the response
      })
      .catch((error) => {
        console.error("Update error details:", error);
        throw error; // Rethrow so the component can handle it
      });
  },
  // Add new method to get current user profile with module permissions
  getCurrentUser: () => {
    return axiosInstance
      .get("/user/profile/")
      .then((response) => {
        console.log("Current user profile:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(
          "Failed to fetch current user:",
          error.response?.data || error.message
        );
        throw error;
      });
  },
// Archive a project
archiveProject: async (projectId) => {
  try {
    // Correct URL structure to match your other API calls
    const response = await axiosInstance.post(`/core/projects/${projectId}/archive/`);
    console.log("Project archived:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error archiving project:', error.response?.data || error.message);
    throw error;
  }
},

// Unarchive a project
unarchiveProject: async (projectId) => {
  try {
    // Correct URL structure to match your other API calls
    const response = await axiosInstance.post(`/core/projects/${projectId}/unarchive/`);
    console.log("Project unarchived:", response.data);
    return response.data;
  } catch (error) {
    console.error('Error unarchiving project:', error.response?.data || error.message);
    throw error;
  }
},

// Get all archived projects
getArchivedProjects: async () => {
  try {
    // Correct URL structure to match your other API calls
    const response = await axiosInstance.get('/core/projects/archived/');
    console.log("Archived projects retrieved:", response.data);
    return response.data.projects;
  } catch (error) {
    console.error('Error fetching archived projects:', error.response?.data || error.message);
    throw error;
  }
},
};

export const adminService = {
  // Get all users (admin only)
  getAllUsers: () => {
    return axiosInstance
      .get("/api/admin/users/")
      .then((response) => {
        console.log("Admin service - get users response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - get users error:", error);
        throw error;
      });
  },

  // Create a new user (admin only)
  createUser: (userData) => {
    return axiosInstance
      .post("/api/admin/users/", userData)
      .then((response) => {
        console.log("Admin service - create user response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - create user error:", error);
        throw error;
      });
  },

  // Update a user's API tokens (admin only)
  updateUserTokens: (userId, tokenData) => {
    return axiosInstance
      .put("/api/admin/users/", {
        user_id: userId,
        ...tokenData,
      })
      .then((response) => {
        console.log("Admin service - update tokens response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - update tokens error:", error);
        throw error;
      });
  },

  // Delete a user (admin only)
  deleteUser: (userId) => {
    return axiosInstance
      .delete(`/api/admin/users/?user_id=${userId}`)
      .then((response) => {
        console.log("Admin service - delete user response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - delete user error:", error);
        throw error;
      });
  },

  // Add new method for updating module permissions
  updateUserModulePermissions: (userId, permissionsData) => {
    return axiosInstance
      .patch(`/admin/users/${userId}/modules/`, permissionsData)
      .then((response) => {
        console.log(
          "Admin service - update module permissions response:",
          response.data
        );
        return response.data;
      })
      .catch((error) => {
        console.error(
          "Admin service - update module permissions error:",
          error
        );
        throw error;
      });
  },

  updateUserUploadPermissions: (userId, permissionData) => {
    console.log(`Sending API request to update user ${userId} upload permissions:`, permissionData);
    
    // Fix the URL path to not duplicate "api/"
    return axiosInstance.patch(`/admin/users/${userId}/upload-permissions/`, permissionData);
  },
  
  

  getUserProjects: async (userId) => {
    return axiosInstance
      .get(`/admin/users/${userId}/projects/`)
      .then((response) => {
        console.log("Admin service - get user projects response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - get user projects error:", error);
        throw error;
      });
  },

  
};








//for notebook as NB-----/////////////////////////////////////////////////////////////////////////////////////////////////////////





// Export services for NB app
export const documentServiceNB = {
  uploadDocument: (formData, mainProjectId, config = {}, targetUserId = null) => {
    // Ensure mainProjectId is added to formData
    formData.append("main_project_id", mainProjectId);
    
    // Add target_user_id if provided (for admin uploads)
    if (targetUserId) {
      formData.append("target_user_id", targetUserId);
    }
  
    return axiosInstance.post("notebook/upload-documents-NB/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    });
  },

  //added new instance for youtube links

  uploadYouTubeVideo: (youtubeUrl, mainProjectId, config = {}, targetUserId = null) => {
    const data = {
      youtube_url: youtubeUrl,
      main_project_id: mainProjectId,
    };
    
    if (targetUserId) {
      data.target_user_id = targetUserId;
    }
  
    return axiosInstance.post("notebook/upload-youtube-NB/", data, {
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    });
  },

  // Add this new method for custom upload handling
  getCustomInstance: () => {
    // Create a fresh instance with the same base config
    const customInstance = axios.create({
      baseURL: axiosInstance.defaults.baseURL,
      headers: {
        ...axiosInstance.defaults.headers,
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000, // Longer timeout for large uploads (2 minutes)
    });

    // Add the auth token
    const token = localStorage.getItem("token");
    if (token) {
      customInstance.defaults.headers.common[
        "Authorization"
      ] = `Token ${token}`;
    }

    return customInstance;
  },

  setActiveDocument: (documentId, mainProjectId) =>
    axiosInstance.post("notebook/set-active-document-NB/", {
      document_id: documentId,
      main_project_id: mainProjectId,
    }),

  getUserDocuments: async (mainProjectId) => {
    if (!mainProjectId) {
      console.warn("No mainProjectId provided to getUserDocuments");
      return { data: [] };
    }

    try {
      console.log("Fetching documents for project:", mainProjectId);
      const response = await axiosInstance.get("notebook/user-documents-NB/", {
        params: { main_project_id: mainProjectId },
      });
      console.log("Documents response:", response.data);
      return response;
    } catch (error) {
      console.error("Error in getUserDocuments:", error);
      return { data: [] };
    }
  },

  getChatHistory: () => {
    return axiosInstance.get("notebook/chat-history-NB/", {
      params: {
        limit: 50, // Optional: limit number of chats
        include_messages: true,
        include_documents: true,
      },
    });
  },

  generateSummary: (documentIds, mainProjectId) => {
    return axiosInstance.post("notebook/generate-document-summary-NB/", {
      document_ids: documentIds,
      main_project_id: mainProjectId,
    });
  },

  generateConsolidatedSummary: (documentIds, projectId) => {
    return axiosInstance.post("notebook/consolidated_summary-NB/", {
      document_ids: documentIds,
      main_project_id: projectId,
    });
  },

  getOriginalDocument: (documentId) => {
    return axiosInstance.get(`notebook/documents-NB/${documentId}/original/`, {
      responseType: "blob", // Important for handling binary files
    });
  },

  trackDocumentView: (documentId, mainProjectId) => {
    return axiosInstance.post(`notebook/documents-NB/${documentId}/view-log/`, {
      main_project_id: mainProjectId,
    });
  },

  searchDocumentContent: (data) => {
    return axiosInstance.post("notebook/search-document-content-NB/", {
      query: data.query,
      main_project_id: data.main_project_id,
    });
  },

    // Upload website content
  uploadWebsite: (websiteUrl, mainProjectId, config = {}, targetUserId = null, customTitle = null) => {
    const data = {
      website_url: websiteUrl,
      main_project_id: mainProjectId,
    };
   
    if (targetUserId) {
      data.target_user_id = targetUserId;
    }
   
    if (customTitle) {
      data.custom_title = customTitle;
    }
 
    return axiosInstance.post("notebook/upload-website-NB/", data, {
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    });
  },
 
  // Upload plain text
  uploadPlainText: (textContent, title, mainProjectId, config = {}, targetUserId = null) => {
    const data = {
      text_content: textContent,
      title: title,
      main_project_id: mainProjectId,
    };
   
    if (targetUserId) {
      data.target_user_id = targetUserId;
    }
 
    return axiosInstance.post("notebook/upload-text-NB/", data, {
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    });
  },

  deleteDocument: (documentId, mainProjectId) =>
    axiosInstance.delete(`notebook/documents-NB/${documentId}/delete/`, {
      params: { main_project_id: mainProjectId },
    }),
};

export const chatServiceNB = {
  sendMessage: (data) => {
    console.log("Sending message data:", data);

    // Determine if we should use general chat mode based on document selection
    const useGeneralChat =
      !data.selected_documents ||
      data.selected_documents.length === 0 ||
      data.general_chat_mode === true;

    // Add flag to request citation processing from the backend
    const processOptions = {
      process_citations: true, // Tell backend to process citations
      citation_threshold: 0.3   // Minimum similarity threshold (optional)
    };

    return axiosInstance
      .post("notebook/chat-NB/", {
        message: data.message,
        conversation_id: data.conversation_id,
        selected_documents: data.selected_documents,
        main_project_id: data.main_project_id || data.mainProjectId, // Support both naming conventions
        use_web_knowledge: data.use_web_knowledge || false,
        general_chat_mode: useGeneralChat, // Automatically set based on document selection
        response_length: data.response_length || "short", // For response length parameter
        response_format: data.response_format || "auto_detect", // Add response format parameter
        citation_options: processOptions // Add citation processing options
      })
      .then((response) => {
        console.log("Chat service response:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("Chat error:", error);
        throw error;
      });
  },

  updateConversationTitle: (conversationId, data) => {
    console.log("Updating conversation title:", conversationId, data);

    // Create a properly formatted request payload
    const payload = {
      title: data.title,
      is_active: data.is_active || true,
      // Include main_project_id if available
      ...(data.main_project_id && { main_project_id: data.main_project_id }),
    };

    // Send PATCH request to the correct endpoint
    return axiosInstance
      .patch(`notebook/conversations-NB/${conversationId}/`, payload)
      .then((response) => {
        console.log("Conversation title update response:", response.data);
        return response;
      })
      .catch((error) => {
        console.error(
          "Conversation title update error:",
          error.response || error
        );
        throw error;
      });
  },

  manageConversation: (conversationId, data) => {
    return axiosInstance
      .patch(`notebook/conversations-NB/${conversationId}/`, data)
      .then((response) => {
        console.log("Conversation management response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Conversation management error:", error);
        throw error;
      });
  },

  getConversationDetails: async (conversationId, mainProjectId, processCitations = false) => {
    try {
      console.log(
        "Fetching conversation:",
        conversationId,
        "for project:",
        mainProjectId
      );
      const response = await axiosInstance.get(
        `notebook/conversations-NB/${conversationId}/`,
        {
          params: { main_project_id: mainProjectId },
        }
      );

      // Process citations for messages if requested and needed
      if (processCitations && response.data && response.data.messages) {
        const messages = [...response.data.messages];
        
        // Note: Citation processing would need to be implemented separately
        // as it's not included in the new URLs
        response.data.messages = messages;
      }

      // Ensure the response is properly formatted
      if (response.data) {
        return {
          data: {
            ...response.data,
            messages: response.data.messages || [],
            selected_documents: response.data.selected_documents || [],
            follow_up_questions: response.data.follow_up_questions || [],
          },
        };
      }
      return response;
    } catch (error) {
      console.error("Error fetching conversation details:", error);
      throw error;
    }
  },

  // Add a method to fetch all conversations
  getAllConversations: async (mainProjectId) => {
    if (!mainProjectId) {
      console.warn("No mainProjectId provided to getAllConversations");
      return { data: [] };
    }

    try {
      const response = await axiosInstance.get("notebook/chat-history-NB/", {
        params: { main_project_id: mainProjectId },
      });
      console.log("Chat history response:", response.data);
      return response;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return { data: [] };
    }
  },

  // Optional: Method to delete a conversation
  deleteConversation: (conversationId) => {
    return axiosInstance
      .delete(`notebook/conversations-NB/${conversationId}/delete/`)
      .then((response) => {
        console.log("Conversation deleted:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error(
          "Failed to delete conversation:",
          error.response?.data || error.message
        );
        throw error;
      });
  },

  startConversation: (documentId, message) => {
    return axiosInstance.post("notebook/conversation/start-NB/", {
      document_id: documentId,
      message: message,
    });
  },

  continueConversation: (conversationId, message) => {
    return axiosInstance.post("notebook/conversation/continue-NB/", {
      conversation_id: conversationId,
      message: message,
    });
  },
   exportChatAsDocx: (data, config = {}) => {
    return axiosInstance.post('notebook/export-chat-NB/', {...data, format: 'docx'}, config);
  },
};

export const citationServiceNB = {
  // Process citations on demand (frontend approach)
  processCitations: (responseText, citations) => {
    return axiosInstance.post("notebook/process-citations-NB/", {
      response_text: responseText,
      citations: citations
    })
    .then(response => {
      console.log("Citations processed successfully");
      return response.data;
    })
    .catch(error => {
      console.error("Error processing citations:", error);
      throw error;
    });
  },

  // Get citation details for a specific citation (future enhancement)
  getCitationDetails: (documentId, pageNumber, sectionTitle) => {
    return axiosInstance.get("notebook/citation-details-NB/", {
      params: {
        document_id: documentId,
        page_number: pageNumber,
        section_title: sectionTitle
      }
    })
    .then(response => {
      return response.data;
    })
    .catch(error => {
      console.error("Error fetching citation details:", error);
      throw error;
    });
  },

  // View original source document at specific citation
  viewSourceDocument: (documentId, pageNumber) => {
    // Generate URL for viewing the document at specific page
    const url = `notebook/documents-NB/${documentId}/original/?page=${pageNumber || 1}`;
    
    // Open in new tab or handle as needed
    window.open(url, '_blank');
    
    // Return success for promise chaining
    return Promise.resolve({ success: true });
  }
};

export const userServiceNB = {
  getUserProfile: () => {
    return axiosInstance.get("/user/profile-NB/");
  },

  updateProfile: (data) => {
    return axiosInstance.put("/user/profile-NB/", data);
  },
};


export const noteServiceNB = {
  // Save or update a note
  saveNote: (noteTitle, noteContent, mainProjectId, config = {}, targetUserId = null, noteId = null) => {
    const data = {
      action: 'save',
      title: noteTitle?.trim() || '',
      content: noteContent?.trim() || '',
      main_project_id: mainProjectId,
    };
   
    if (targetUserId) {
      data.target_user_id = targetUserId;
    }
 
    if (noteId) {
      data.note_id = noteId;
    }
 
    console.log('Saving note with data:', data);
   
    return axiosInstance.post("notebook/notes-NB/", data, {
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    }).then(response => {
      console.log('Note save response:', response.data);
      return response;
    }).catch(error => {
      console.error('Note save error:', error.response?.data || error.message);
      throw error;
    });
  },
 
  // Convert note to document source
  convertNoteToDocument: (noteId, config = {}, targetUserId = null) => {
    const data = {
      action: 'convert',
      note_id: noteId,
    };
   
    if (targetUserId) {
      data.target_user_id = targetUserId;
    }
 
    console.log('Converting note to document with data:', data);
   
    return axiosInstance.post("notebook/notes-NB/", data, {
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    }).then(response => {
      console.log('Note conversion response:', response.data);
      return response;
    }).catch(error => {
      console.error('Note conversion error:', error.response?.data || error.message);
      throw error;
    });
  },
 
  // Get notes for a project
  getNotes: (mainProjectId, config = {}, targetUserId = null) => {
    const params = {
      main_project_id: mainProjectId,
    };
   
    if (targetUserId) {
      params.target_user_id = targetUserId;
    }
 
    console.log('Fetching notes with params:', params);
    return axiosInstance.get("notebook/notes-NB/", {
      params,
      ...config,
    }).then(response => {
      console.log('Get notes response:', response.data);
      return response;
    }).catch(error => {
      console.error('Get notes error:', error.response?.data || error.message);
      throw error;
    });
  },
 
  // Delete a note
  deleteNote: (noteId, config = {}, targetUserId = null) => {
    const data = {
      note_id: noteId,
    };
   
    if (targetUserId) {
      data.target_user_id = targetUserId;
    }
 
    console.log('Deleting note with data:', data);
   
    return axiosInstance.delete("notebook/notes-NB/", {
      data,
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    }).then(response => {
      console.log('Note delete response:', response.data);
      return response;
    }).catch(error => {
      console.error('Note delete error:', error.response?.data || error.message);
      throw error;
    });
  },
};
 

// Updated mindmap services to match your existing axios configuration
// Add these functions to your existing mindmapServiceNB object

export const mindmapServiceNB = {
  // Your existing generateMindmap function (keeping as is)
  generateMindmap: (mainProjectId, selectedDocuments = [], config = {}, targetUserId = null) => {
    const data = {
      main_project_id: mainProjectId,
      selected_documents: selectedDocuments,
    };
        
    if (targetUserId) {
      data.target_user_id = targetUserId;
    }
      
    console.log('Generating mindmap with data:', data);
        
    return axiosInstance.post("notebook/generate-mindmap/", data, {
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    }).then(response => {
      console.log('Mindmap generation response:', response.data);
      return response;
    }).catch(error => {
      console.error('Mindmap generation error:', error.response?.data || error.message);
      throw error;
    });
  },
    
  // Your existing askMindmapQuestion function (keeping as is)
  askMindmapQuestion: (mainProjectId, topicName, topicSummary = '', nodePath = '', selectedDocuments = [], mindmapId = null, config = {}, targetUserId = null) => {
    const data = {
      main_project_id: mainProjectId,
      topic_name: topicName,
      topic_summary: topicSummary,
      node_path: nodePath,
      selected_documents: selectedDocuments,
    };
      
    if (mindmapId) {
      data.mindmap_id = mindmapId;
    }
        
    if (targetUserId) {
      data.target_user_id = targetUserId;
    }
      
    console.log('Asking mindmap question with data:', data);
        
    return axiosInstance.post("notebook/mindmap-question/", data, {
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    }).then(response => {
      console.log('Mindmap question response:', response.data);
      return response;
    }).catch(error => {
      console.error('Mindmap question error:', error.response?.data || error.message);
      throw error;
    });
  },
    
  // Your existing getUserMindmaps function (keeping as is)
  getUserMindmaps: (mainProjectId, config = {}, targetUserId = null) => {
    const params = {
      main_project_id: mainProjectId,
    };
        
    if (targetUserId) {
      params.target_user_id = targetUserId;
    }
      
    console.log('Fetching user mindmaps with params:', params);
        
    return axiosInstance.get("notebook/user-mindmaps/", {
      params,
      ...config,
    }).then(response => {
      console.log('Get user mindmaps response:', response.data);
      return response;
    }).catch(error => {
      console.error('Get user mindmaps error:', error.response?.data || error.message);
      throw error;
    });
  },
    
  // Your existing getMindmapData function (keeping as is)
  getMindmapData: (mindmapId, config = {}) => {
    console.log('Fetching mindmap data for ID:', mindmapId);
        
    return axiosInstance.get(`notebook/mindmap/${mindmapId}/`, {
      ...config,
    }).then(response => {
      console.log('Get mindmap data response:', response.data);
      return response;
    }).catch(error => {
      console.error('Get mindmap data error:', error.response?.data || error.message);
      throw error;
    });
  },
    
  // Your existing deleteMindmap function (keeping as is)
  deleteMindmap: (mindmapId, config = {}) => {
    console.log('Deleting mindmap with ID:', mindmapId);
        
    return axiosInstance.delete(`notebook/mindmap/${mindmapId}/`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    }).then(response => {
      console.log('Mindmap delete response:', response.data);
      return response;
    }).catch(error => {
      console.error('Mindmap delete error:', error.response?.data || error.message);
      throw error;
    });
  },

  // Additional helper functions for enhanced functionality
  
  // Generate mindmap with force regenerate option
  regenerateMindmap: (mainProjectId, selectedDocuments = [], targetUserId = null, config = {}) => {
    const data = {
      main_project_id: mainProjectId,
      selected_documents: selectedDocuments,
      force_regenerate: true, // Force regeneration even if cache exists
    };
        
    if (targetUserId) {
      data.target_user_id = targetUserId;
    }
      
    console.log('Regenerating mindmap with data:', data);
        
    return axiosInstance.post("notebook/generate-mindmap/", data, {
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    }).then(response => {
      console.log('Mindmap regeneration response:', response.data);
      return response;
    }).catch(error => {
      console.error('Mindmap regeneration error:', error.response?.data || error.message);
      throw error;
    });
  },

  // Check if mindmap exists for documents (useful for UI state)
  checkMindmapExists: async (mainProjectId, selectedDocuments = [], targetUserId = null) => {
    try {
      const response = await this.getUserMindmaps(mainProjectId, {}, targetUserId);
      
      if (response.data && response.data.success && response.data.mindmaps) {
        // Simple check - in a real implementation, you'd compare document sources
        return response.data.mindmaps.length > 0;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking mindmap existence:', error);
      return false;
    }
  },

  // Batch delete mindmaps (useful for cleanup)
  deleteMindmaps: async (mindmapIds, config = {}) => {
    const deletePromises = mindmapIds.map(id => this.deleteMindmap(id, config));
    
    try {
      const results = await Promise.allSettled(deletePromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      console.log(`Batch delete completed: ${successful} successful, ${failed} failed`);
      
      return {
        success: true,
        successful,
        failed,
        total: mindmapIds.length
      };
    } catch (error) {
      console.error('Batch delete error:', error);
      throw error;
    }
  }
};

export default axiosInstance;
