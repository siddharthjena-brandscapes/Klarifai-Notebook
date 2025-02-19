

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




// export const ideaService = {
//   generateIdeas: (data) => {
//     return axiosInstance.post('/ideas/generate_ideas/', data);
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
//   createProject: (data) => {
//     return axiosInstance.post('/ideas/projects/', data);
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

//   updateProject: (projectId, data) => {
//     return axiosInstance.put(`/ideas/projects/${projectId}/`, data);
// },
 
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
//     console.log("Updating conversation title:", { conversationId, data });
//     return axiosInstance.patch(`/conversations/${conversationId}/update/`, {
//         title: data.title,
//         is_active: data.is_active,
//         main_project_id: data.main_project_id
//     })
//     .then(response => {
//         console.log("Title update response:", response.data);
//         return response.data;
//     })
//     .catch(error => {
//         console.error("Title update error:", error);
//         throw error;
//     });
// },

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
//   },

//   updateProject: (projectId, projectData) => {
//     console.log('Sending update request to:', `/core/projects/${projectId}/update`);
//     return axiosInstance.put(`/core/projects/${projectId}/update/`, {
//       name: projectData.name,
//       description: projectData.description,
//       category: projectData.category,
//       selected_modules: projectData.selected_modules
//     })
//     .then(response => {
//       console.log("Project updated:", response.data);
//       return response.data;
//     })
//     .catch(error => {
//       console.error("Failed to update project:", error.response?.data || error.message);
//       throw error;
//     });
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
  createProject: (data) => {
    return axiosInstance.post('/ideas/projects/', data);
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

//   updateProject: (data) => {
//     return axiosInstance.put(`/ideas/projects/${data.id}/`, {
//         name: data.name,
//         formData: data.formData,
//         lastModified: data.lastModified
//     });
// },
 
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

  getChatHistory: () => {
    return axiosInstance.get('/chat-history/', {
      params: {
        limit: 50,  // Optional: limit number of chats
        include_messages: true,
        include_documents: true
      }
    });
  },

  deleteDocument: (documentId, mainProjectId) =>
    axiosInstance.delete(`/documents/${documentId}/delete/`, {
      params: { main_project_id: mainProjectId }
    })
};

export const chatService = {
  sendMessage: (data) => {
    console.log("Sending message data:", data);
    return axiosInstance.post('/chat/', {
      message: data.message,
      conversation_id: data.conversation_id,
      selected_documents: data.selected_documents,
      main_project_id: data.mainProjectId
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
  
  updateConversationTitle: (conversationId, data) =>
    axiosInstance.patch(`/conversations/${conversationId}/`, {
      ...data,
      main_project_id: data.mainProjectId
    }),

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
  }
};



export default axiosInstance;


      