
// //axiosConfig.jsx
// import axios from 'axios';

// const axiosInstance = axios.create({
//   baseURL: 'http://localhost:8000/api', // Your Django backend URL
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   },
// });

// // Add request interceptor for adding auth token
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers['Authorization'] = `Token ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );


// export const topicModelingService = {
//   uploadDataset: (formData) => {
//     return axiosInstance.post('/analysis/upload_dataset/', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     });
//   },

//   enhancedCustomAnalysis: (data) => {
//     return axiosInstance.post('/analysis/enhanced_handle_custom_analysis/', data);
//   },

//   analyzeSentiment: (data) => {
//     return axiosInstance.post('/analysis/analyze_sentiment/', data);
//   },

//   semanticSearch: (data) => {
//     return axiosInstance.post('/analysis/semantic_search/', data);
//   }
// };


// export const dataAnalysisService = {
//   uploadFile: (formData) => {
//     return axiosInstance.post('/data/analysis/', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     });
//   },

//   analyzeData: (query) => {
//     return axiosInstance.post('/data/analysis/', { query }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       }
//     });
//   },

//   saveResults: (results) => {
//     return axiosInstance.post('/data/save-results/', { results }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//       }
//     });
//   }
// };

// export const ideaService = {
//   generateIdeas: (data) => {
//     return axiosInstance.post('/ideas/generate_ideas/', data);
//   },
//   getIdeaDetails: (ideaId) => {
//     return axiosInstance.get(`/ideas/${ideaId}/details/`); // added for Visualization_ prompt(sourav/ 11-02-2025)
//   },
//   updateIdea: (data) => {
//     return axiosInstance.put('/ideas/update_idea/', data);
//   },
//   deleteIdea: (ideaId) => {
//     return axiosInstance.delete('/ideas/delete_idea/', { data: { idea_id: ideaId } });
//   },
//   generateProductImage: (data) => {
//     return axiosInstance.post('/ideas/generate_product_image/', data);
//   },
//   regenerateProductImage: (data) => {
//     return axiosInstance.post('/ideas/regenerate_product_image/', data);
//   },
//   getIdeaHistory: async (ideaId) => {
//     try {
//       const response = await axiosInstance.get(`/ideas/idea-history/${ideaId}/`);
//       return response;
//     } catch (error) {
//       console.error('Error fetching idea history:', error);
//       throw error;
//     }
//   },
//   restoreIdeaVersion: async (data) => {
//     return await axiosInstance.post('/ideas/restore-idea-version/', {
//       version_id: data.version_id,
//       current_id: data.current_id,
//       image_id: data.image_id,
//     });
//   },
//   // Create project
//   createProject: async (data) => {
//     try {
//       const response = await axiosInstance.post('/ideas/projects/', data);
//       return response;
//     } catch (error) {
//       // Enhanced error handling
//       if (error.response) {
//         // Server responded with an error status
//         if (error.response.status === 500) {
//           const errorData = error.response.data?.toString() || '';
          
//           // Check for duplicate key violation
//           if (errorData.includes('duplicate key value') && errorData.includes('already exists')) {
//             // Extract the project name from the error message if possible
//             const nameMatch = errorData.match(/Key \(name\)=\(([^)]+)\)/);
//             const projectName = nameMatch ? nameMatch[1] : 'this name';
            
//             // Create a user-friendly error response
//             error.response.data = {
//               success: false,
//               error: `A project with the name "${projectName}" already exists. Please choose a different name.`
//             };
//           } else {
//             // For other 500 errors
//             error.response.data = {
//               success: false,
//               error: 'There was a server error creating your project. Please try again later.'
//             };
//           }
//         } else if (!error.response.data || typeof error.response.data.error === 'undefined') {
//           // Ensure there's a structured error response
//           error.response.data = {
//             success: false,
//             error: error.response.statusText || 'Error creating project'
//           };
//         }
//       } else if (error.request) {
//         // The request was made but no response was received
//         error.response = {
//           data: {
//             success: false,
//             error: 'No response from server. Please check your connection and try again.'
//           }
//         };
//       } else {
//         // Something happened in setting up the request
//         error.response = {
//           data: {
//             success: false,
//             error: error.message || 'Error creating project'
//           }
//         };
//       }
//       throw error;
//     }
//   },

//   // Delete project
//   deleteProject: (projectId) => {
//     return axiosInstance.delete(`/ideas/projects/${projectId}/`);
//   },

//   // Get all projects - uses the GET method of project_operations view
//   getProjectDetails: (params) => {
//     return axiosInstance.get('/ideas/projects/',{ params });
//   },

//   // Get single project details
//   getSingleProjectDetails: (projectId, params) => {
//     return axiosInstance.get(`/ideas/projects/${projectId}/details/`, { params });
//   },

 
// };


// export const authService = {
//   // ... existing auth methods ...

//   initiatePasswordReset: (email) => {
//     return axiosInstance.post('/password-reset/initiate/', { email });
//   },

//   confirmPasswordReset: (token, newPassword) => {
//     return axiosInstance.post('/password-reset/confirm/', { 
//       token, 
//       new_password: newPassword 
//     });
//   }
// };

// // Export services
// export const documentService = {
//   uploadDocument: (formData, mainProjectId) => {
//     // Ensure mainProjectId is added to formData
//     formData.append('main_project_id', mainProjectId);
    
//     return axiosInstance.post('/upload-documents/', formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     });
//   },

//   setActiveDocument: (documentId, mainProjectId) =>
//     axiosInstance.post('/set-active-document/', {
//       document_id: documentId,
//       main_project_id: mainProjectId
//     }),

//     getUserDocuments: async (mainProjectId) => {
//       if (!mainProjectId) {
//         console.warn('No mainProjectId provided to getUserDocuments');
//         return { data: [] };
//       }
  
//       try {
//         console.log('Fetching documents for project:', mainProjectId);
//         const response = await axiosInstance.get('/user-documents/', {
//           params: { main_project_id: mainProjectId }
//         });
//         console.log('Documents response:', response.data);
//         return response;
//       } catch (error) {
//         console.error('Error in getUserDocuments:', error);
//         return { data: [] };
//       }
//     },

//   getChatHistory: () => {
//     return axiosInstance.get('/chat-history/', {
//       params: {
//         limit: 50,  // Optional: limit number of chats
//         include_messages: true,
//         include_documents: true
//       }
//     });
//   },
//   generateSummary: (documentIds, mainProjectId) => {
//     return axiosInstance.post('/generate-document-summary/', {
//       document_ids: documentIds,
//       main_project_id: mainProjectId
//     });
//   },

//   generateConsolidatedSummary: (documentIds, projectId) => {
//     return axiosInstance.post("/consolidated_summary/", {
//       document_ids: documentIds,
//       main_project_id: projectId
//     });
//   },

//   generateIdeaContext: (data) => axiosInstance.post('/generate-idea-context/', {
//     document_id: data.document_id,
//     main_project_id: data.main_project_id
//   }),

//   deleteDocument: (documentId, mainProjectId) =>
//     axiosInstance.delete(`/documents/${documentId}/delete/`, {
//       params: { main_project_id: mainProjectId }
//     })
// };

// export const chatService = {
//   sendMessage: (data) => {
//     console.log("Sending message data:", data);
//     return axiosInstance.post('/chat/', {
//       message: data.message,
//       conversation_id: data.conversation_id,
//       selected_documents: data.selected_documents,
//       main_project_id: data.mainProjectId
//     })
//     .then(response => {
//       console.log("Chat service response:", response.data);
//       return response;
//     })
//     .catch(error => {
//       console.error("Chat error:", error);
//       throw error;
//     });
//   },
  
//   updateConversationTitle: (conversationId, data) => {
//     console.log("Updating conversation title:", conversationId, data);
    
//     // Create a properly formatted request payload
//     const payload = {
//       title: data.title,
//       is_active: data.is_active || true,
//       // Include main_project_id if available
//       ...(data.main_project_id && { main_project_id: data.main_project_id })
//     };
    
//     // Send PATCH request to the correct endpoint
//     return axiosInstance.patch(`/conversations/${conversationId}/`, payload)
//       .then(response => {
//         console.log("Conversation title update response:", response.data);
//         return response;
//       })
//       .catch(error => {
//         console.error("Conversation title update error:", error.response || error);
//         throw error;
//       });
//   },

//   manageConversation: (conversationId, data) => {
//     return axiosInstance.patch(`/conversations/${conversationId}/`, data)
//       .then(response => {
//         console.log("Conversation management response:", response.data);
//         return response.data;
//       })
//       .catch(error => {
//         console.error("Conversation management error:", error);
//         throw error;
//       });
//   },

//   getConversationDetails: async (conversationId, mainProjectId) => {
//     try {
//       console.log('Fetching conversation:', conversationId, 'for project:', mainProjectId);
//       const response = await axiosInstance.get(`/conversations/${conversationId}/`, {
//         params: { main_project_id: mainProjectId }
//       });
      
//       // Ensure the response is properly formatted
//       if (response.data) {
//         return {
//           data: {
//             ...response.data,
//             messages: response.data.messages || [],
//             selected_documents: response.data.selected_documents || [],
//             follow_up_questions: response.data.follow_up_questions || []
//           }
//         };
//       }
//       return response;
//     } catch (error) {
//       console.error('Error fetching conversation details:', error);
//       throw error;
//     }
//   },
  

//   // Add a method to fetch all conversations
//   getAllConversations: async (mainProjectId) => {
//     if (!mainProjectId) {
//       console.warn('No mainProjectId provided to getAllConversations');
//       return { data: [] };
//     }

//     try {
//       const response = await axiosInstance.get('/chat-history/', {
//         params: { main_project_id: mainProjectId }
//       });
//       console.log('Chat history response:', response.data);
//       return response;
//     } catch (error) {
//       console.error('Error fetching chat history:', error);
//       return { data: [] };
//     }
//   },

//   // Optional: Method to delete a conversation
//   deleteConversation: (conversationId) => {
//     return axiosInstance.delete(`/conversations/${conversationId}/delete/`)
//       .then(response => {
//         console.log("Conversation deleted:", response.data);
//         return response.data;
//       })
//       .catch(error => {
//         console.error("Failed to delete conversation:", error.response?.data || error.message);
//         throw error;
//       });
//   },

//   startConversation: (documentId, message) => {
//     return axiosInstance.post('/conversation/start/', {
//       document_id: documentId,
//       message: message
//     });
//   },

//   continueConversation: (conversationId, message) => {
//     return axiosInstance.post('/conversation/continue/', {
//       conversation_id: conversationId,
//       message: message
//     });
//   },

//    // Download a single chat conversation
//    downloadSingleChat: (conversationId, mainProjectId, format = 'txt') => {
//     return axiosInstance.post('/download-chats/', {
//       conversation_id: conversationId,
//       main_project_id: mainProjectId,
//       format: format
//     }, {
//       responseType: 'blob' // Important for handling file downloads properly
//     })
//     .then(response => {
//       // Extract filename from Content-Disposition header if available
//       let filename = `chat_${conversationId}.${format}`;
//       const contentDisposition = response.headers['content-disposition'];
//       if (contentDisposition) {
//         const filenameMatch = contentDisposition.match(/filename="(.+)"/);
//         if (filenameMatch && filenameMatch[1]) {
//           filename = filenameMatch[1];
//         }
//       }

//       // Create a download link and trigger it
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', filename);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       return { success: true, filename };
//     })
//     .catch(error => {
//       console.error("Error downloading chat:", error);
//       throw error;
//     });
//   },

//   // Download chats within a date range
//   downloadChatsByDateRange: (dateRange, mainProjectId, format = 'txt') => {
//     return axiosInstance.post('/download-chats/', {
//       date_range: dateRange, // { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }
//       main_project_id: mainProjectId,
//       format: format
//     }, {
//       responseType: 'blob'
//     })
//     .then(response => {
//       // Extract filename from Content-Disposition header if available
//       let filename = `chats_${dateRange.start_date}_to_${dateRange.end_date}.${format}`;
//       const contentDisposition = response.headers['content-disposition'];
//       if (contentDisposition) {
//         const filenameMatch = contentDisposition.match(/filename="(.+)"/);
//         if (filenameMatch && filenameMatch[1]) {
//           filename = filenameMatch[1];
//         }
//       }

//       // Create a download link and trigger it
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', filename);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
      
//       return { success: true, filename };
//     })
//     .catch(error => {
//       console.error("Error downloading chats by date range:", error);
//       throw error;
//     });
//   }
// };




// export const userService = {
//   getUserProfile: () => {
//     return axiosInstance.get('/user/profile/');
//   },
  
//   changePassword: (currentPassword, newPassword) => {
//     return axiosInstance.post('/user/change-password/', {
//       current_password: currentPassword,
//       new_password: newPassword
//     });
//   },
  
//   updateProfile: (data) => {
//     return axiosInstance.put('/user/profile/', data);
//   },

  
// };


// export const coreService = {
//   // Create a new project
//   createProject: (projectData) => {
//     // Send JSON data directly instead of FormData
//     return axiosInstance.post('/core/projects/create/', {
//       name: projectData.name,
//       description: projectData.description,
//       category: projectData.category,
//       selected_modules: projectData.selected_modules
//     })
//     .then(response => {
//       console.log("Project created:", response.data);
//       return response.data;
//     })
//     .catch(error => {
//       console.error("Failed to create project:", error.response?.data || error.message);
//       throw error;
//     });
//   },

//   // Get all projects for current user
//   getProjects: () => {
//     return axiosInstance.get('/core/projects/')
//       .then(response => {
//         console.log("Projects retrieved:", response.data);
//         return response.data.projects;
//       })
//       .catch(error => {
//         console.error("Failed to fetch projects:", error.response?.data || error.message);
//         throw error;
//       });
//   },

//   // Get single project details
//   getProjectDetails: (projectId) => {
//     return axiosInstance.get(`/core/projects/${projectId}/`)
//       .then(response => {
//         console.log("Project details:", response.data);
//         return response.data.project;
//       })
//       .catch(error => {
//         console.error("Failed to fetch project details:", error.response?.data || error.message);
//         throw error;
//       });
//   },

//   // Delete a project
//   deleteProject: (projectId) => {
//     return axiosInstance.post(`/core/projects/${projectId}/delete/`)
//       .then(response => {
//         console.log("Project deleted:", response.data);
//         return response.data;
//       })
//       .catch(error => {
//         console.error("Failed to delete project:", error.response?.data || error.message);
//         throw error;
//       });
//   }
// };



// export default axiosInstance;






//axiosConfig.jsx
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api', // Your Django backend URL
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export const topicModelingService = {
  uploadDataset: (formData) => {
    return axiosInstance.post('/analysis/upload_dataset/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  enhancedCustomAnalysis: (data) => {
    return axiosInstance.post('/analysis/enhanced_handle_custom_analysis/', data);
  },

  analyzeSentiment: (data) => {
    return axiosInstance.post('/analysis/analyze_sentiment/', data);
  },

  semanticSearch: (data) => {
    return axiosInstance.post('/analysis/semantic_search/', data);
  }
};


export const dataAnalysisService = {
  uploadFile: (formData) => {
    return axiosInstance.post('/data/analysis/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  analyzeData: (query) => {
    return axiosInstance.post('/data/analysis/', { query }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  },

  saveResults: (results) => {
    return axiosInstance.post('/data/save-results/', { results }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }
};

export const ideaService = {
  generateIdeas: (data) => {
    return axiosInstance.post('/ideas/generate_ideas/', data);
  },
  getIdeaDetails: (ideaId) => {
    return axiosInstance.get(`/ideas/${ideaId}/details/`); // added for Visualization_ prompt(sourav/ 11-02-2025)
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
    return axiosInstance.post('/password-reset/initiate/', { email });
  },

  confirmPasswordReset: (token, newPassword) => {
    return axiosInstance.post('/password-reset/confirm/', { 
      token, 
      new_password: newPassword 
    });
  }
};

// Export services
export const documentService = {
  uploadDocument: (formData, mainProjectId) => {
    // Ensure mainProjectId is added to formData
    formData.append('main_project_id', mainProjectId);
    
    return axiosInstance.post('/upload-documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  setActiveDocument: (documentId, mainProjectId) =>
    axiosInstance.post('/set-active-document/', {
      document_id: documentId,
      main_project_id: mainProjectId
    }),

    getUserDocuments: async (mainProjectId) => {
      if (!mainProjectId) {
        console.warn('No mainProjectId provided to getUserDocuments');
        return { data: [] };
      }
  
      try {
        console.log('Fetching documents for project:', mainProjectId);
        const response = await axiosInstance.get('/user-documents/', {
          params: { main_project_id: mainProjectId }
        });
        console.log('Documents response:', response.data);
        return response;
      } catch (error) {
        console.error('Error in getUserDocuments:', error);
        return { data: [] };
      }
    },

    getOriginalDocument: (documentId) => {
      return axiosInstance.get(`/documents/${documentId}/original/`, {
        responseType: 'blob', // Important for handling binary files
      });
    },
  
    trackDocumentView: (documentId, mainProjectId) => {
      return axiosInstance.post(`/documents/${documentId}/view-log/`, {
        main_project_id: mainProjectId
      });
    },
  
    
  getChatHistory: () => {
    return axiosInstance.get('/chat-history/', {
      params: {
        limit: 50,  // Optional: limit number of chats
        include_messages: true,
        include_documents: true
      }
    });
  },
  generateSummary: (documentIds, mainProjectId) => {
    return axiosInstance.post('/generate-document-summary/', {
      document_ids: documentIds,
      main_project_id: mainProjectId
    });
  },

  generateConsolidatedSummary: (documentIds, projectId) => {
    return axiosInstance.post("/consolidated_summary/", {
      document_ids: documentIds,
      main_project_id: projectId
    });
  },

  generateIdeaContext: (data) => axiosInstance.post('/generate-idea-context/', {
    document_id: data.document_id,
    main_project_id: data.main_project_id
  }),

  deleteDocument: (documentId, mainProjectId) =>
    axiosInstance.delete(`/documents/${documentId}/delete/`, {
      params: { main_project_id: mainProjectId }
    })
};

export const chatService = {
  sendMessage: (data) => {
    console.log("Sending message data:", data);
    
    // Determine if we should use general chat mode based on document selection
    const useGeneralChat = !data.selected_documents || data.selected_documents.length === 0 || data.general_chat_mode === true;
    
    return axiosInstance.post('/chat/', {
      message: data.message,
      conversation_id: data.conversation_id,
      selected_documents: data.selected_documents,
      main_project_id: data.main_project_id || data.mainProjectId, // Support both naming conventions
      use_web_knowledge: data.use_web_knowledge || false,
      general_chat_mode: useGeneralChat // Automatically set based on document selection
    })
    .then(response => {
      console.log("Chat service response:", response.data);
      return response;
    })
    .catch(error => {
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
      ...(data.main_project_id && { main_project_id: data.main_project_id })
    };
    
    // Send PATCH request to the correct endpoint
    return axiosInstance.patch(`/conversations/${conversationId}/`, payload)
      .then(response => {
        console.log("Conversation title update response:", response.data);
        return response;
      })
      .catch(error => {
        console.error("Conversation title update error:", error.response || error);
        throw error;
      });
  },

  manageConversation: (conversationId, data) => {
    return axiosInstance.patch(`/conversations/${conversationId}/`, data)
      .then(response => {
        console.log("Conversation management response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Conversation management error:", error);
        throw error;
      });
  },

  getConversationDetails: async (conversationId, mainProjectId) => {
    try {
      console.log('Fetching conversation:', conversationId, 'for project:', mainProjectId);
      const response = await axiosInstance.get(`/conversations/${conversationId}/`, {
        params: { main_project_id: mainProjectId }
      });
      
      // Ensure the response is properly formatted
      if (response.data) {
        return {
          data: {
            ...response.data,
            messages: response.data.messages || [],
            selected_documents: response.data.selected_documents || [],
            follow_up_questions: response.data.follow_up_questions || []
          }
        };
      }
      return response;
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      throw error;
    }
  },
  

  // Add a method to fetch all conversations
  getAllConversations: async (mainProjectId) => {
    if (!mainProjectId) {
      console.warn('No mainProjectId provided to getAllConversations');
      return { data: [] };
    }

    try {
      const response = await axiosInstance.get('/chat-history/', {
        params: { main_project_id: mainProjectId }
      });
      console.log('Chat history response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return { data: [] };
    }
  },

  // Optional: Method to delete a conversation
  deleteConversation: (conversationId) => {
    return axiosInstance.delete(`/conversations/${conversationId}/delete/`)
      .then(response => {
        console.log("Conversation deleted:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Failed to delete conversation:", error.response?.data || error.message);
        throw error;
      });
  },

  startConversation: (documentId, message) => {
    return axiosInstance.post('/conversation/start/', {
      document_id: documentId,
      message: message
    });
  },

  continueConversation: (conversationId, message) => {
    return axiosInstance.post('/conversation/continue/', {
      conversation_id: conversationId,
      message: message
    });
  },

   // Download a single chat conversation
   downloadSingleChat: (conversationId, mainProjectId, format = 'txt') => {
    return axiosInstance.post('/download-chats/', {
      conversation_id: conversationId,
      main_project_id: mainProjectId,
      format: format
    }, {
      responseType: 'blob' // Important for handling file downloads properly
    })
    .then(response => {
      // Extract filename from Content-Disposition header if available
      let filename = `chat_${conversationId}.${format}`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    })
    .catch(error => {
      console.error("Error downloading chat:", error);
      throw error;
    });
  },

  // Download chats within a date range
  downloadChatsByDateRange: (dateRange, mainProjectId, format = 'txt') => {
    return axiosInstance.post('/download-chats/', {
      date_range: dateRange, // { start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' }
      main_project_id: mainProjectId,
      format: format
    }, {
      responseType: 'blob'
    })
    .then(response => {
      // Extract filename from Content-Disposition header if available
      let filename = `chats_${dateRange.start_date}_to_${dateRange.end_date}.${format}`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    })
    .catch(error => {
      console.error("Error downloading chats by date range:", error);
      throw error;
    });
  }
};




export const userService = {
  getUserProfile: () => {
    return axiosInstance.get('/user/profile/');
  },
  
  changePassword: (currentPassword, newPassword) => {
    return axiosInstance.post('/user/change-password/', {
      current_password: currentPassword,
      new_password: newPassword
    });
  },
  
  updateProfile: (data) => {
    return axiosInstance.put('/user/profile/', data);
  },

  
};


export const coreService = {
  // Create a new project
  createProject: (projectData) => {
    // Send JSON data directly instead of FormData
    return axiosInstance.post('/core/projects/create/', {
      name: projectData.name,
      description: projectData.description,
      category: projectData.category,
      selected_modules: projectData.selected_modules
    })
    .then(response => {
      console.log("Project created:", response.data);
      return response.data;
    })
    .catch(error => {
      console.error("Failed to create project:", error.response?.data || error.message);
      throw error;
    });
  },

  // Get all projects for current user
  getProjects: () => {
    return axiosInstance.get('/core/projects/')
      .then(response => {
        console.log("Projects retrieved:", response.data);
        return response.data.projects;
      })
      .catch(error => {
        console.error("Failed to fetch projects:", error.response?.data || error.message);
        throw error;
      });
  },

  // Get single project details
  getProjectDetails: (projectId) => {
    return axiosInstance.get(`/core/projects/${projectId}/`)
      .then(response => {
        console.log("Project details:", response.data);
        return response.data.project;
      })
      .catch(error => {
        console.error("Failed to fetch project details:", error.response?.data || error.message);
        throw error;
      });
  },

  // Delete a project
  deleteProject: (projectId) => {
    return axiosInstance.post(`/core/projects/${projectId}/delete/`)
      .then(response => {
        console.log("Project deleted:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Failed to delete project:", error.response?.data || error.message);
        throw error;
      });
  },


// Update an existing project
// In your coreService or axiosConfig.js file
updateProject: (projectId, projectData) => {
  return axiosInstance.put(`/core/projects/${projectId}/update/`, {
    name: projectData.name,
    description: projectData.description,
    category: projectData.category,
    selected_modules: projectData.selected_modules
  })
  .then(response => {
    console.log("Update response:", response.data); // Debug log
    return response.data.project; // Return the project object from the response
  })
  .catch(error => {
    console.error("Update error details:", error);
    throw error; // Rethrow so the component can handle it
  });
},
// Add new method to get current user profile with module permissions
getCurrentUser: () => {
  return axiosInstance.get('/user/profile/')
    .then(response => {
      console.log("Current user profile:", response.data);
      return response.data;
    })
    .catch(error => {
      console.error("Failed to fetch current user:", error.response?.data || error.message);
      throw error;
    });
}
};


export const adminService = {
  // Get all users (admin only)
  getAllUsers: () => {
    return axiosInstance.get('/api/admin/users/')
      .then(response => {
        console.log("Admin service - get users response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Admin service - get users error:", error);
        throw error;
      });
  },
 
  // Create a new user (admin only)
  createUser: (userData) => {
    return axiosInstance.post('/api/admin/users/', userData)
      .then(response => {
        console.log("Admin service - create user response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Admin service - create user error:", error);
        throw error;
      });
  },
 
  // Update a user's API tokens (admin only)
  updateUserTokens: (userId, tokenData) => {
    return axiosInstance.put('/api/admin/users/', {
      user_id: userId,
      ...tokenData
    })
      .then(response => {
        console.log("Admin service - update tokens response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Admin service - update tokens error:", error);
        throw error;
      });

  },
 
  // Delete a user (admin only)
  deleteUser: (userId) => {
    return axiosInstance.delete(`/api/admin/users/?user_id=${userId}`)
      .then(response => {
        console.log("Admin service - delete user response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Admin service - delete user error:", error);
        throw error;
      });
  },

  // Add new method for updating module permissions
  updateUserModulePermissions: (userId, permissionsData) => {
    return axiosInstance.patch(`/admin/users/${userId}/modules/`, permissionsData)
      .then(response => {
        console.log("Admin service - update module permissions response:", response.data);
        return response.data;
      })
      .catch(error => {
        console.error("Admin service - update module permissions error:", error);
        throw error;
      });
  }
};
 
 




export default axiosInstance;


           