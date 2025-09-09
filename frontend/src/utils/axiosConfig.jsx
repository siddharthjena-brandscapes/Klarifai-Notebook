import axios from "axios";

const axiosInstance = axios.create({
 baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

});
const generateIdeasStream = async (data, onProgress) => {
  // Use the full URL with the correct base URL
  const response = await fetch('http://localhost:8000/api/ideas/generate_ideas_stream/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onProgress(data);
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};
// Add request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Token ${token}`;
    }
    
    // Log API requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Request: ${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
        params: config.params,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for consistent error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log API errors in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      });
    }
    
    return Promise.reject(error);
  }
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

    return axiosInstance.post('/ideas/generate_ideas/', data);

  },

  generateIdeasStream: generateIdeasStream,

  getIdeaDetails: async (ideaId) => {

    try {

      console.log(`Fetching details for idea ${ideaId}`);

      const response = await axiosInstance.get(`/ideas/${ideaId}/details/`);

      console.log(`Idea details response:`, response.data);

      return response;

    } catch (error) {

      console.error(`Error fetching idea details for ${ideaId}:`, error);

      throw error;

    }

  },


  updateIdea: (data) => {

    return axiosInstance.put('/ideas/update_idea/', data);

  },

  deleteIdea: (ideaId) => {

    return axiosInstance.delete('/ideas/delete_idea/', { data: { idea_id: ideaId } });

  },

  generateProductImage: (data) => {

    return axiosInstance.post('/ideas/generate_product_image/', data);

  },

  regenerateProductImage: (data) => {

    return axiosInstance.post('/ideas/regenerate_product_image/', data);

  },

  getIdeaHistory: async (ideaId) => {

    try {

      const response = await axiosInstance.get(`/ideas/idea-history/${ideaId}/`);

      return response;

    } catch (error) {

      console.error('Error fetching idea history:', error);

      throw error;

    }

  },

  restoreIdeaVersion: async (data) => {

    return await axiosInstance.post('/ideas/restore-idea-version/', {

      version_id: data.version_id,

      current_id: data.current_id,

      image_id: data.image_id,

    });

  },

  // Create project

  createProject: async (data) => {

    try {

      const response = await axiosInstance.post('/ideas/projects/', data);

      return response;

    } catch (error) {

      // Enhanced error handling

      if (error.response) {

        // Server responded with an error status

        if (error.response.status === 500) {

          const errorData = error.response.data?.toString() || '';

          // Check for duplicate key violation

          if (errorData.includes('duplicate key value') && errorData.includes('already exists')) {

            // Extract the project name from the error message if possible

            const nameMatch = errorData.match(/Key \(name\)=\(([^)]+)\)/);

            const projectName = nameMatch ? nameMatch[1] : 'this name';

            // Create a user-friendly error response

            error.response.data = {

              success: false,

              error: `A project with the name "${projectName}" already exists. Please choose a different name.`

            };

          } else {

            // For other 500 errors

            error.response.data = {

              success: false,

              error: 'There was a server error creating your project. Please try again later.'

            };

          }

        } else if (!error.response.data || typeof error.response.data.error === 'undefined') {

          // Ensure there's a structured error response

          error.response.data = {

            success: false,

            error: error.response.statusText || 'Error creating project'

          };

        }

      } else if (error.request) {

        // The request was made but no response was received

        error.response = {

          data: {

            success: false,

            error: 'No response from server. Please check your connection and try again.'

          }

        };

      } else {

        // Something happened in setting up the request

        error.response = {

          data: {

            success: false,

            error: error.message || 'Error creating project'

          }

        };

      }

      throw error;

    }

  },

  // Update project

  updateProject: (projectId, data) => {
 
    if (projectId === undefined || projectId === null ||
 
        typeof projectId === 'object' || isNaN(Number(projectId))) {
 
      console.error("Invalid project ID for updateProject:", projectId);
 
      return Promise.reject(new Error("Invalid project ID. Expected a number or numeric string."));
 
    }
 
    return axiosInstance.put(`/ideas/projects/${projectId}/`, data);

  },

  // Delete project

  deleteProject: (projectId) => {

    return axiosInstance.delete(`/ideas/projects/${projectId}/`);

  },

  // Get all projects - uses the GET method of project_operations view

  getProjectDetails: (params) => {

    return axiosInstance.get('/ideas/projects/',{ params });

  },

  // Get single project details

  getSingleProjectDetails: (projectId, params) => {

    return axiosInstance.get(`/ideas/projects/${projectId}/details/`, { params });

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
  // Upload document with proper validation
  uploadDocument: (formData, mainProjectId, config = {}, targetUserId = null) => {
    // Validate required parameters
    if (!formData) {
      console.error("formData is required for document upload");
      return Promise.reject(new Error("formData is required"));
    }
    
    if (!mainProjectId) {
      console.error("mainProjectId is required for document upload");
      return Promise.reject(new Error("mainProjectId is required"));
    }
    
    // Ensure mainProjectId is added to formData
    formData.append("main_project_id", mainProjectId);
    
    // Add target_user_id if provided (for admin uploads)
    if (targetUserId) {
      formData.append("target_user_id", targetUserId);
    }

    // Enhanced config for long uploads
    const enhancedConfig = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Remove timeout - let server decide when to timeout
      timeout: 0,
      // Don't fail on server errors (5xx) - let them complete
      validateStatus: function (status) {
        return status < 500;
      },
      ...config,
    };
  
    return axiosInstance.post("/upload-documents/", formData, enhancedConfig);
  },

  getProcessingStatus: () => axiosInstance.get("/document-processing-status/"),

  checkUploadPermissions: () => {
    return axiosInstance.get('/check-upload-permissions'); // Fixed: removed duplicate '/api'
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
      timeout: 0, // Remove timeout here too
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

  // Fixed: added validation for required parameters
  setActiveDocument: (documentId, mainProjectId) => {
    if (!documentId) {
      console.error("documentId is required for setActiveDocument");
      return Promise.reject(new Error("documentId is required"));
    }
    
    if (!mainProjectId) {
      console.error("mainProjectId is required for setActiveDocument");
      return Promise.reject(new Error("mainProjectId is required"));
    }
    
    return axiosInstance.post("/set-active-document/", {
      document_id: documentId,
      main_project_id: mainProjectId,
    }).catch(error => {
      console.error("Failed to set active document:", error);
      // Add specific error message based on response
      if (error.response?.status === 400) {
        const errorMsg = error.response.data?.error || "Bad request when setting active document. Check parameters.";
        throw new Error(errorMsg);
      }
      throw error;
    });
  },

  getUserDocuments: async (mainProjectId) => {
    if (!mainProjectId) {
      console.warn("No mainProjectId provided to getUserDocuments");
      return { data: [] };
    }

    try {
    
      const response = await axiosInstance.get("/user-documents/", {
        params: { main_project_id: mainProjectId },
      });
    
      return response;
    } catch (error) {
      console.error("Error in getUserDocuments:", error);
      return { data: [] };
    }
  },
  
  // New method: Get document details including processing status
  getDocumentDetails: (documentId, mainProjectId) => {
    if (!documentId || !mainProjectId) {
      console.error("documentId and mainProjectId are required for getDocumentDetails");
      return Promise.reject(new Error("Missing required parameters"));
    }
    
    return axiosInstance.get(`/documents/${documentId}/details/`, {
      params: { main_project_id: mainProjectId }
    });
  },

  // axiosConfig.jsx - Fixed getOriginalDocument method
getOriginalDocument: (documentId, mainProjectId) => {
    if (!documentId) {
        console.error("documentId is required for getOriginalDocument");
        return Promise.reject(new Error("documentId is required"));
    }
    
    // Try to get mainProjectId from parameter, or from localStorage
    if (!mainProjectId) {
        mainProjectId = localStorage.getItem('currentProjectId');
        console.log("Using mainProjectId from localStorage:", mainProjectId);
    }
    
    console.log(`Requesting document ${documentId} for project ${mainProjectId}`);
    
    return axiosInstance.get(`/documents/${documentId}/original/`, {
        params: { main_project_id: mainProjectId },
        responseType: 'blob', // IMPORTANT: Set responseType to 'blob' for binary data
        headers: {
            'Accept': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,*/*'
        }
    })
    .then(response => {

        
        // Check if response is a redirect URL object (would be JSON)
        if (response.headers['content-type']?.includes('application/json')) {
            // Parse JSON response for redirect URL
            return response.data.text().then(text => {
                const jsonData = JSON.parse(text);
                if (jsonData.redirect_url) {
                    console.log("Received redirect URL from server:", jsonData.redirect_url);
                    return {
                        ...response,
                        data: jsonData
                    };
                }
                return response;
            });
        }
        
        // For binary content (PDF, DOCX, etc.), response.data should be a Blob
        if (response.data instanceof Blob) {
            console.log("Received blob response:", response.data.size, "bytes");
            
            // Validate blob size
            if (response.data.size === 0) {
                throw new Error("Received empty document");
            }
            
            return response;
        }
        
        // If we get here, something unexpected happened
        console.warn("Unexpected response format");
        return response;
    })
    .catch(error => {
        console.error("Document retrieval error:", error);
        
        // Enhanced error logging
        if (error.response) {
            console.error("Server responded with:", error.response.status, error.response.data);
            
            // Check if the error response contains useful information
            if (error.response.status === 404) {
                throw new Error("Document not found or access denied");
            } else if (error.response.status === 403) {
                throw new Error("You don't have permission to access this document");
            } else if (error.response.status >= 500) {
                throw new Error("Server error occurred while retrieving the document");
            }
        } else if (error.request) {
            throw new Error("Network error: Could not reach the server");
        }
        
        throw error;
    });
},

  trackDocumentView: (documentId, mainProjectId) => {
    if (!documentId) {
      console.error("documentId is required for trackDocumentView");
      return Promise.reject(new Error("documentId is required"));
    }
    
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
    // Validate parameters
    if (!documentIds || !documentIds.length) {
      console.error("documentIds array is required and must not be empty");
      return Promise.reject(new Error("documentIds array is required"));
    }
    
    if (!mainProjectId) {
      console.error("mainProjectId is required for generateSummary");
      return Promise.reject(new Error("mainProjectId is required"));
    }
    
    console.log("Calling generate-document-summary with:", { documentIds, mainProjectId });
    return axiosInstance.post("/generate-document-summary/", {
      document_ids: documentIds,
      main_project_id: mainProjectId,
    });
  },

  generateConsolidatedSummary: (documentIds, projectId) => {
    // Validate parameters
    if (!documentIds || !documentIds.length) {
      console.error("documentIds array is required and must not be empty");
      return Promise.reject(new Error("documentIds array is required"));
    }
    
    if (!projectId) {
      console.error("projectId is required for generateConsolidatedSummary");
      return Promise.reject(new Error("projectId is required"));
    }
    
    return axiosInstance.post("/consolidated_summary/", {
      document_ids: documentIds,
      main_project_id: projectId,
    });
  },

  generateIdeaContext: (data) => {
    if (!data.document_id) {
      console.error("document_id is required for generateIdeaContext");
      return Promise.reject(new Error("document_id is required"));
    }
    
    if (!data.main_project_id) {
      console.error("main_project_id is required for generateIdeaContext");
      return Promise.reject(new Error("main_project_id is required"));
    }
    
    return axiosInstance.post("/generate-idea-context/", {
      document_id: data.document_id,
      main_project_id: data.main_project_id,
    });
  },

  deleteDocument: (documentId, mainProjectId) => {
    if (!documentId) {
      console.error("documentId is required for deleteDocument");
      return Promise.reject(new Error("documentId is required"));
    }
    
    if (!mainProjectId) {
      console.error("mainProjectId is required for deleteDocument");
      return Promise.reject(new Error("mainProjectId is required"));
    }
    
    return axiosInstance.delete(`/documents/${documentId}/delete/`, {
      params: { main_project_id: mainProjectId },
    });
  },

  searchDocumentContent: (data) => {
    if (!data.query) {
      console.error("query is required for searchDocumentContent");
      return Promise.reject(new Error("query is required"));
    }
    
    if (!data.main_project_id) {
      console.error("main_project_id is required for searchDocumentContent");
      return Promise.reject(new Error("main_project_id is required"));
    }
    
    return axiosInstance.post("/search-document-content/", {
      query: data.query,
      main_project_id: data.main_project_id,
    });
  },
  
  // New method: Check document processing status to debug FAISS index and markdown issues
  checkDocumentProcessingStatus: (documentId, mainProjectId) => {
    if (!documentId || !mainProjectId) {
      console.error("documentId and mainProjectId are required for checkDocumentProcessingStatus");
      return Promise.reject(new Error("Missing required parameters"));
    }
    
    return axiosInstance.get(`/documents/${documentId}/processing-status/`, {
      params: { main_project_id: mainProjectId }
    });
  },
  
  // Debug FAISS index issues
  debugFaissIndex: (documentId, mainProjectId) => {
    if (!documentId || !mainProjectId) {
      console.error("documentId and mainProjectId are required for debugFaissIndex");
      return Promise.reject(new Error("Missing required parameters"));
    }
    
    return axiosInstance.get(`/debug/faiss-index/`, {
      params: { 
        document_id: documentId,
        main_project_id: mainProjectId
      }
    });
  },
  
  // Debug markdown generation issues
  debugMarkdownGeneration: (documentId, mainProjectId) => {
    if (!documentId || !mainProjectId) {
      console.error("documentId and mainProjectId are required for debugMarkdownGeneration");
      return Promise.reject(new Error("Missing required parameters"));
    }
    
    return axiosInstance.get(`/debug/markdown-generation/`, {
      params: { 
        document_id: documentId,
        main_project_id: mainProjectId
      }
    });
  },
};

export const chatService = {
  sendMessage: (data) => {
  

    // Validate required parameters
    if (!data.message) {
      console.error("message is required for sendMessage");
      return Promise.reject(new Error("message is required"));
    }
    
    if (!data.main_project_id && !data.mainProjectId) {
      console.error("main_project_id or mainProjectId is required for sendMessage");
      return Promise.reject(new Error("Project ID is required"));
    }

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

  deleteMessagePair: (userMessageId, assistantMessageId, conversationId) => {
  // You will create this endpoint in your Django backend
   return axiosInstance.post("/delete-message-pair/", {
    user_message_id: userMessageId,
    assistant_message_id: assistantMessageId,
    conversation_id: conversationId,
  });
},

  updateConversationTitle: (conversationId, data) => {
    if (!conversationId) {
      console.error("conversationId is required for updateConversationTitle");
      return Promise.reject(new Error("conversationId is required"));
    }
    
    if (!data.title) {
      console.error("title is required for updateConversationTitle");
      return Promise.reject(new Error("title is required"));
    }
    
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
    if (!conversationId) {
      console.error("conversationId is required for manageConversation");
      return Promise.reject(new Error("conversationId is required"));
    }
    
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
    if (!conversationId) {
      console.error("conversationId is required for getConversationDetails");
      return Promise.reject(new Error("conversationId is required"));
    }
    
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
  getAllConversations: async (mainProjectId, archived = false) => {
    if (!mainProjectId) {
      console.warn("No mainProjectId provided to getAllConversations");
      return { data: [] };
    }
 
    try {
      const response = await axiosInstance.get("notebook/chat-history-NB/", {
        params: { main_project_id: mainProjectId,  archived  },
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
    if (!conversationId) {
      console.error("conversationId is required for deleteConversation");
      return Promise.reject(new Error("conversationId is required"));
    }
    
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
    if (!message) {
      console.error("message is required for startConversation");
      return Promise.reject(new Error("message is required"));
    }
    
    return axiosInstance.post("/conversation/start/", {
      document_id: documentId,
      message: message,
    });
  },

  continueConversation: (conversationId, message) => {
    if (!conversationId) {
      console.error("conversationId is required for continueConversation");
      return Promise.reject(new Error("conversationId is required"));
    }
    
    if (!message) {
      console.error("message is required for continueConversation");
      return Promise.reject(new Error("message is required"));
    }
    
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
    if (!responseText) {
      console.error("responseText is required for processCitations");
      return Promise.reject(new Error("responseText is required"));
    }
    
    if (!citations || !Array.isArray(citations)) {
      console.error("citations array is required for processCitations");
      return Promise.reject(new Error("citations array is required"));
    }
    
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
    if (!documentId) {
      console.error("documentId is required for getCitationDetails");
      return Promise.reject(new Error("documentId is required"));
    }
    
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
    if (!documentId) {
      console.error("documentId is required for viewSourceDocument");
      return Promise.reject(new Error("documentId is required"));
    }
    
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
    if (!currentPassword) {
      console.error("currentPassword is required for changePassword");
      return Promise.reject(new Error("currentPassword is required"));
    }
    
    if (!newPassword) {
      console.error("newPassword is required for changePassword");
      return Promise.reject(new Error("newPassword is required"));
    }
    
    return axiosInstance.post("/user/change-password/", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  updateProfile: (data) => {
    return axiosInstance.put("/user/profile/", data);
  },


  getCurrentUserRightPanelPermissions: () => {
    return axiosInstance
      .get("core/user/right-panel-permissions/")  // Added 'core/'
      .then((response) => {
        console.log("User service - get right panel permissions response:", response.data);
        return response.data.data;
      })
      .catch((error) => {
        console.error("User service - get right panel permissions error:", error);
        throw error;
      });
  },
};

export const coreService = {
  // Create a new project
  createProject: (projectData) => {
    if (!projectData.name) {
      console.error("name is required for createProject");
      return Promise.reject(new Error("name is required"));
    }
    
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
    if (!prompt) {
      console.error("prompt is required for enhancePromptWithAI");
      return Promise.reject(new Error("prompt is required"));
    }
    
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
    if (!file) {
      console.error("file is required for uploadDocumentForPrompt");
      return Promise.reject(new Error("file is required"));
    }
    
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
    if (!projectId) {
      console.error("projectId is required for getProjectDetails");
      return Promise.reject(new Error("projectId is required"));
    }
    
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
    if (!projectId) {
      console.error("projectId is required for deleteProject");
      return Promise.reject(new Error("projectId is required"));
    }
    
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
    if (!projectId) {
      console.error("projectId is required for updateProject");
      return Promise.reject(new Error("projectId is required"));
    }
    
    if (!projectData) {
      console.error("projectData is required for updateProject");
      return Promise.reject(new Error("projectData is required"));
    }
    
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
  if (!projectId) {
    console.error("projectId is required for archiveProject");
    return Promise.reject(new Error("projectId is required"));
  }
  
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
  if (!projectId) {
    console.error("projectId is required for unarchiveProject");
    return Promise.reject(new Error("projectId is required"));
  }
  
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
      .get("/core/admin/users/")
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
      .post("/api/admin/users/", userData)  // ✅ Keep original endpoint
      .then((response) => {
        console.log("Admin service - create user response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - create user error:", error);
        console.error("Error response data:", error.response?.data);
        throw error;
      });
  },
  
  getUserStats: () => {
    return axiosInstance
      .get("/api/admin/user-stats/")
      .then((response) => {
        console.log("Admin service - get user stats response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - get user stats error:", error);
        throw error;
      });
  },
  // Update a user's API tokens (admin only)
  updateUserTokens: (userId, tokenData) => {
    return axiosInstance
      .put("/api/admin/users/", {  // ✅ Keep original endpoint
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
      .delete(`/api/admin/users/?user_id=${userId}`)  // ✅ Keep original endpoint
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
    if (!userId) {
      console.error("userId is required for updateUserModulePermissions");
      return Promise.reject(new Error("userId is required"));
    }
    
    if (!permissionsData) {
      console.error("permissionsData is required for updateUserModulePermissions");
      return Promise.reject(new Error("permissionsData is required"));
    }
    
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
    if (!userId) {
      console.error("userId is required for updateUserUploadPermissions");
      return Promise.reject(new Error("userId is required"));
    }
    
    if (!permissionData) {
      console.error("permissionData is required for updateUserUploadPermissions");
      return Promise.reject(new Error("permissionData is required"));
    }
    
    console.log(`Sending API request to update user ${userId} upload permissions:`, permissionData);
    
    // Fix the URL path to not duplicate "api/"
    return axiosInstance.patch(`/admin/users/${userId}/upload-permissions/`, permissionData);
  },
  
  getUserProjects: async (userId) => {
    if (!userId) {
      console.error("userId is required for getUserProjects");
      return Promise.reject(new Error("userId is required"));
    }
    
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

getAllCategories: () => {
    return axiosInstance
      .get("core/all_categories/")
      .then((response) => {
        console.log("Admin service - get all categories response:", response.data);
        return response.data.categories;
      })
      .catch((error) => {
        console.error("Admin service - get all categories error:", error);
        throw error;
      });
  },

  // Get categories for a specific user// Add this method to your coreService
  getUserCategories: () => {
    return axiosInstance
      .get("core/categories/")  // This calls the endpoint without user_id for current user
      .then((response) => {
        console.log("Core service - get user categories response:", response.data);
        return response.data.categories;
      })
      .catch((error) => {
        console.error("Core service - get user categories error:", error);
        throw error;
      });
  },

  // Create a new category for a user (admin only)
  createCategory: (categoryData) => {
    return axiosInstance
      .post("core/categories/create/", categoryData)
      .then((response) => {
        console.log("Admin service - create category response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - create category error:", error);
        throw error;
      });
  },

  // Update a category (admin only)
  updateCategory: (categoryId, categoryData) => {
    return axiosInstance
      .put(`core/categories/${categoryId}/update/`, categoryData)
      .then((response) => {
        console.log("Admin service - update category response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - update category error:", error);
        throw error;
      });
  },

  // Delete a category (admin only)
  deleteCategory: (categoryId) => {
    return axiosInstance
      .delete(`core/categories/${categoryId}/delete/`)
      .then((response) => {
        console.log("Admin service - delete category response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - delete category error:", error);
        throw error;
      });
  },

updateUserRightPanelPermissions: (userId, permissions) => {
    return axiosInstance
      .patch(`core/admin/users/${userId}/right-panel-permissions/`, permissions)  // Added 'core/'
      .then((response) => {
        console.log("Admin service - update right panel permissions response:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin service - update right panel permissions error:", error);
        throw error;
      });
  },

  createUserCategory: (categoryData) => {
  return axiosInstance
    .post("core/categories/create-user/", categoryData)
    .then((response) => {
      console.log("User service - create category response:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("User service - create category error:", error);
      throw error;
    });
},
  getFirstActivities: () => {
    return axiosInstance.get('/core/analytics/first-activities/')
        .then(response => {
            console.log('First activities data:', response.data);
            return response.data;
        })
        .catch(error => {
            console.error('Error fetching first activities:', error);
            throw error;
        });
  },

  getAllActivities: () => {
  return axiosInstance.get('/core/analytics/all-activities/')
  .then(response => {
    return response.data;
  })
  .catch(error => {
    console.error('Error fetching all activities:', error);
    throw error;
  });
  },

};

// Add a new debugging service to help diagnose API and storage issues
export const debugService = {
  // Test API connectivity
  testApiConnection: () => {
    return axiosInstance.get("/debug/ping/")
      .then(response => {
        console.log("API connection test successful:", response.data);
        return { success: true, data: response.data };
      })
      .catch(error => {
        console.error("API connection test failed:", error);
        return { 
          success: false, 
          error: error.message,
          details: error.response?.data || {}
        };
      });
  },
  
  // Test blob storage
  testBlobStorage: (testData) => {
    const formData = new FormData();
    formData.append('test_file', new Blob([testData || 'Test data'], { type: 'text/plain' }), 'test.txt');
    
    return axiosInstance.post("/debug/test-blob/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      console.log("Blob storage test successful:", response.data);
      return { success: true, data: response.data };
    })
    .catch(error => {
      console.error("Blob storage test failed:", error);
      return { 
        success: false, 
        error: error.message,
        details: error.response?.data || {}
      };
    });
  },
  
  // Check system configuration
  getSystemInfo: () => {
    return axiosInstance.get("/debug/system-info/")
      .then(response => {
        console.log("System info retrieved:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Failed to get system info:", error);
        return { error: error.message };
      });
  },
  
  // Test document processing
  testDocumentProcessing: (documentId, mainProjectId) => {
    if (!documentId || !mainProjectId) {
      console.error("documentId and mainProjectId are required for testDocumentProcessing");
      return Promise.reject(new Error("Missing required parameters"));
    }
    
    return axiosInstance.post("/debug/test-document-processing/", {
      document_id: documentId,
      main_project_id: mainProjectId
    })
    .then(response => {
      console.log("Document processing test successful:", response.data);
      return response.data;
    })
    .catch(error => {
      console.error("Document processing test failed:", error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data || {}
      };
    });
  }
};


// Export services for NB app
export const documentServiceNB = {
  uploadDocument: (formData, mainProjectId, config = {}, targetUserId = null) => {
    // Ensure mainProjectId is added to formData
    formData.append("main_project_id", mainProjectId);
    
    // Add target_user_id if provided (for admin uploads)
    if (targetUserId) {
      formData.append("target_user_id", targetUserId);
    }
    
    // Enhanced config for long uploads
    const enhancedConfig = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Remove timeout - let server decide when to timeout
      timeout: 0,
      // Don't fail on server errors (5xx) - let them complete
      validateStatus: function (status) {
        return status < 500;
      },
      ...config,
    };
    return axiosInstance.post("notebook/upload-documents-NB/", formData, enhancedConfig);
  },

  checkUploadPermissions: () => {
    return axiosInstance.get('notebook/check-upload-permissions-NB/');
  },

  getProcessingStatus: () => axiosInstance.get("notebook/document-processing-status/"),

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
      timeout: 0, // Longer timeout for large uploads (2 minutes)
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

  // In your documentServiceNB
generateSummary: (documentIds, mainProjectId) => {
    // Ensure mainProjectId is provided
    if (!mainProjectId) {
        console.error('mainProjectId is required for generateSummary');
        return Promise.reject(new Error('Project ID is required'));
    }
    
    console.log('Generating summary for documents:', documentIds, 'in project:', mainProjectId);
    
    return axiosInstance.post("notebook/generate-document-summary-NB/", {
        document_ids: documentIds,
        main_project_id: mainProjectId,
    }).then(response => {
        console.log('Summary generation response:', response.data);
        return response;
    }).catch(error => {
        console.error('Summary generation error:', error.response?.data || error.message);
        throw error;
    });
},

  generateConsolidatedSummary: (documentIds, projectId) => {
    return axiosInstance.post("notebook/consolidated_summary-NB/", {
      document_ids: documentIds,
      main_project_id: projectId,
    });
  },

  generateIdeaContext: (data) =>
    axiosInstance.post("notebook/generate-idea-context-NB/", {
      document_id: data.document_id,
      main_project_id: data.main_project_id,
    }),

  getOriginalDocument: async (documentId) => {
  try {
    // First try to get the document
    const response = await axiosInstance.get(`notebook/documents-NB/${documentId}/original/`, {
      responseType: "blob",
      timeout: 30000, // 30 seconds timeout
    });
    
    // Check if the response is JSON (indicating a redirect URL or error)
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      // Convert blob to text to read JSON
      const text = await response.data.text();
      const jsonData = JSON.parse(text);
      
      // Return the parsed JSON (which should contain redirect_url)
      return { data: jsonData };
    }
    
    // Otherwise return the blob data as is
    return response;
  } catch (error) {
    console.error('Error fetching document:', error);
    
    // If blob request fails, try JSON request as fallback
    try {
      const fallbackResponse = await axiosInstance.get(`notebook/documents-NB/${documentId}/original/`, {
        responseType: "json",
        timeout: 15000,
      });
      return fallbackResponse;
    } catch (fallbackError) {
      console.error('Fallback request also failed:', fallbackError);
      throw error; // Throw original error
    }
  }
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

  sendImageMessage: (formData) => {
    console.log("Sending image message with FormData");
   
    return axiosInstance
      .post("notebook/chat-image/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        console.log("Image chat service response:", response.data);
        return response;
      })
      .catch((error) => {
        console.error("Image chat error:", error);
        throw error;
      });
  },

   deleteMessagePair: (userMessageId, assistantMessageId, conversationId) => {
   return axiosInstance.post("notebook/delete-message-pair-NB/", {
    user_message_id: userMessageId,
    assistant_message_id: assistantMessageId,
    conversation_id: conversationId,
  });
},

   updateConversationTitle: (conversationId, data) => {


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

  generateQuestionFromTopic: (data) =>
    axiosInstance.post("notebook/api/generate-question-from-topic/", data),

  getConversationDetails: async (conversationId, mainProjectId, processCitations = false) => {
    try {
   
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
   generateTitle: (data) => {
    return axiosInstance.post("notebook/generate-title-NB/", {
      message: data.message,
      max_length: data.max_length || 40
    }).then(response => {
    
      return response;
    }).catch(error => {
      
    });
  },

  archiveConversation: (conversationId, archive = true, title = "") => {
  return axiosInstance.patch(`notebook/conversations-NB/${conversationId}/archive/`, {
    archive,
    title: title, // <-- send the current title
  });
},
  // Add a method to fetch all conversations
  getAllConversations: async (mainProjectId, archived = false) => {
    if (!mainProjectId) {
      console.warn("No mainProjectId provided to getAllConversations");
      return { data: [] };
    }
 
    try {
      const response = await axiosInstance.get("notebook/chat-history-NB/", {
        params: { main_project_id: mainProjectId,  archived  },
      });
     
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

export const adminNotebookServiceNB = {
  // Fetch notebook user stats for admin panel (per user: doc uploads & questions asked)
  getNotebookUserStats: () => {
    return axiosInstance
      .get("notebook/admin-notebook-user-stats/")
      .then((response) => {
        console.log("Admin NB service - get notebook user stats:", response.data);
        return response.data;
      })
      .catch((error) => {
        console.error("Admin NB service - get notebook user stats error:", error);
        throw error;
      });
  },
};

export const getAdminUserStats = () => {
  return axiosInstance
    .get("ideas/admin/user-stats/")  // FIXED: Removed leading /api/
    .then((response) => {
      console.log("Fetched admin user stats:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Error fetching admin user stats:", error);
      console.error("Error details:", error.response?.data);
      console.error("Request URL:", error.config?.url);
      throw error;
    });
};

export default axiosInstance;