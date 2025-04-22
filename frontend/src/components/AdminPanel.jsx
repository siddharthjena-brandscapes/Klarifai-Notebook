

import React, { useState, useEffect, useRef } from "react";
import { adminService, documentService } from "../utils/axiosConfig";
import {
  FaUserPlus,
  FaUserEdit,
  FaUserMinus,
  FaKey,
  FaSave,
  FaTimes,
  FaLock,
  FaUnlock,
  FaUpload,
  FaFileUpload,
  FaToggleOn,
  FaToggleOff,
  FaSpinner,
} from "react-icons/fa";
import Header from "../components/dashboard/Header";
import { toast } from "react-toastify";

// List of available modules to match the ones from projects page
const availableModules = [
  { id: "document-qa", name: "Document Q&A" },
  { id: "idea-generator", name: "Idea Generator" },
  { id: "topic-modeling", name: "Topic Modeling" },
  { id: "structured-data-query", name: "Structured Data Query" },
];

// Main Admin Panel Component
const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModulePermissionsModalOpen, setIsModulePermissionsModalOpen] =
    useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    huggingface_token: "",
    gemini_token: "",
    llama_token: "",
  });

  // State for upload permissions
  const [userUploadPermissions, setUserUploadPermissions] = useState({});
  const [uploadLoading, setUploadLoading] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  // State for module permissions
  const [modulePermissions, setModulePermissions] = useState({});

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch all users
  // Replace the fetchUsers function in AdminPanel.jsx
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAllUsers();

      // Initialize upload permissions state with proper boolean values
      const permissions = {};
      data.forEach((user) => {
        // Make sure to handle the case where upload_permissions might be null
        // Default to true if can_upload property is missing
        const canUpload = user.upload_permissions
          ? user.upload_permissions.can_upload
          : true;

        // Explicitly convert to boolean to ensure consistency
        permissions[user.id] = Boolean(canUpload);

        // Debug logging
        console.log(
          `User ${user.id} (${user.username}) permissions loaded: can_upload=${
            permissions[user.id]
          }`
        );
      });

      setUserUploadPermissions(permissions);
      setUsers(data);
    } catch (err) {
      setError("Failed to fetch users. Please try again.");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open edit modal with user data
  const handleOpenEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      huggingface_token: user.api_tokens.huggingface_token || "",
      gemini_token: user.api_tokens.gemini_token || "",
      llama_token: user.api_tokens.llama_token || "",
    });
    setIsEditModalOpen(true);
  };

  // Open module permissions modal
  const handleOpenModulePermissionsModal = (user) => {
    setCurrentUser(user);
    // Initialize module permissions with the user's current settings
    setModulePermissions(user.disabled_modules || {});
    setIsModulePermissionsModalOpen(true);
  };

  // Open upload modal and fetch user's projects
  const handleOpenUploadModal = async (user) => {
    setCurrentUser(user);
    setSelectedFiles([]);
    setSelectedProject("");
    setUploadProgress(0);

    try {
      // Fetch user projects
      const projects = await adminService.getUserProjects(user.id);
      setUserProjects(projects || []);

      setIsUploadModalOpen(true);
    } catch (err) {
      console.error("Error fetching user projects:", err);
      toast.error("Failed to fetch user projects");
    }
  };

  // Toggle module permission for a user
  const toggleModulePermission = (moduleId) => {
    setModulePermissions((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Toggle upload permission for a user
  // Find the toggleUploadPermission function in AdminPanel.jsx and replace it with this:
  // Replace the toggleUploadPermission function in AdminPanel.jsx
  const toggleUploadPermission = async (userId) => {
    try {
      // Set loading state for this specific user toggle
      setUploadLoading((prev) => ({ ...prev, [userId]: true }));

      // Get the current permission state for this user
      const currentPermission = userUploadPermissions[userId];

      // The new permission will be the opposite of the current one
      const newPermission = !currentPermission;

      console.log(
        `Toggling user ${userId} upload permission from ${currentPermission} to ${newPermission}`
      );

      // Optimistically update the UI state
      setUserUploadPermissions((prev) => ({
        ...prev,
        [userId]: newPermission,
      }));

      // Call API to update upload permissions
      const response = await adminService.updateUserUploadPermissions(userId, {
        can_upload: newPermission,
      });

      // Check if the API call was successful
      if (response && response.data && response.data.success) {
        toast.success(
          `Upload ${newPermission ? "enabled" : "disabled"} for user`
        );
      } else {
        // If API call fails or returns unexpected response, revert the UI state
        setUserUploadPermissions((prev) => ({
          ...prev,
          [userId]: currentPermission,
        }));
        toast.error(
          "Failed to update upload permissions: Server did not confirm the change"
        );
      }
    } catch (err) {
      // Log the detailed error for debugging
      console.error("Error updating upload permissions:", err);

      // Show error message to user
      toast.error("Failed to update upload permissions");

      // Revert the UI state on error
      setUserUploadPermissions((prev) => ({
        ...prev,
        [userId]: userUploadPermissions[userId], // Revert to previous state
      }));
    } finally {
      // Always clear the loading state
      setUploadLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Handle upload on behalf of user
  const handleUploadForUser = async (e) => {
    e.preventDefault();

    if (!selectedFiles.length || !selectedProject) {
      toast.warning("Please select both files and a project");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Add files to form data
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      // Use the standard document upload method with the target user ID
      await documentService.uploadDocument(
        formData,
        selectedProject,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        },
        currentUser.id // Pass the target user ID as the last parameter
      );

      toast.success(
        `${selectedFiles.length} document(s) uploaded successfully for ${currentUser.username}`
      );
      setIsUploadModalOpen(false);
    } catch (err) {
      console.error("Error uploading documents:", err);
      toast.error("Failed to upload documents");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.createUser(formData);
      setIsAddModalOpen(false);
      setFormData({
        username: "",
        email: "",
        password: "",
        huggingface_token: "",
        gemini_token: "",
        llama_token: "",
      });
      fetchUsers();
    } catch (err) {
      setError("Failed to create user. Please try again.");
      console.error("Error creating user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for updating user tokens
  const handleUpdateTokens = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.updateUserTokens(currentUser.id, {
        huggingface_token: formData.huggingface_token,
        gemini_token: formData.gemini_token,
        llama_token: formData.llama_token,
      });
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError("Failed to update user tokens. Please try again.");
      console.error("Error updating tokens:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle updating module permissions
  const handleUpdateModulePermissions = async () => {
    setLoading(true);
    try {
      await adminService.updateUserModulePermissions(currentUser.id, {
        disabled_modules: modulePermissions,
      });
      setIsModulePermissionsModalOpen(false);

      // Update the local users state to reflect the changes
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === currentUser.id
            ? { ...user, disabled_modules: modulePermissions }
            : user
        )
      );
    } catch (err) {
      setError("Failed to update module permissions. Please try again.");
      console.error("Error updating module permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      setLoading(true);
      try {
        await adminService.deleteUser(userId);
        fetchUsers();
      } catch (err) {
        setError("Failed to delete user. Please try again.");
        console.error("Error deleting user:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-[#faf4ee] dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-emerald-900 min-h-screen text-[#5e4636] dark:text-white p-6">
      <Header />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 mt-14">
          <h1 className="text-3xl font-bold text-[#0a3b25] dark:text-emerald-400">
            Admin Panel - User Management
          </h1>
          <button
            className="bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 text-white px-4 py-2 rounded-md flex items-center shadow-lg transition-all"
            onClick={() => setIsAddModalOpen(true)}
          >
            <FaUserPlus className="mr-2" /> Add New User
          </button>
        </div>
  
        {/* Error Alert */}
        {error && (
          <div className="bg-[#fff0f0] text-[#ff4a4a] dark:bg-red-500/80 dark:text-white p-4 mb-6 rounded-md shadow-lg">
            {error}
          </div>
        )}
  
        {/* Users Table */}
        <div className="bg-white/80 dark:bg-black/50 dark:backdrop-blur-sm rounded-lg shadow-xl overflow-hidden border border-[#e8ddcc] dark:border-emerald-900/50">
          <table className="w-full divide-y divide-[#e3d5c8] dark:divide-gray-800/50">
            <thead className="bg-[#e9dcc9] dark:bg-black/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#0a3b25] dark:text-emerald-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#0a3b25] dark:text-emerald-400 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#0a3b25] dark:text-emerald-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#0a3b25] dark:text-emerald-400 uppercase tracking-wider">
                  API Keys
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#0a3b25] dark:text-emerald-400 uppercase tracking-wider">
                  Module Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#0a3b25] dark:text-emerald-400 uppercase tracking-wider">
                  Upload Control
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#0a3b25] dark:text-emerald-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3d5c8] dark:divide-gray-800/50">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-[#f5e6d8] dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5a544a] dark:text-gray-300">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5a544a] dark:text-gray-300">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5a544a] dark:text-gray-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5a544a] dark:text-gray-300">
                    <div className="flex flex-col">
                      <span>
                        <span className="text-[#556052] dark:text-blue-400">Hugging Face:</span>
                        {user.api_tokens.huggingface_token
                          ? `${user.api_tokens.huggingface_token.slice(
                              0,
                              5
                            )}...`
                          : "Not set"}
                      </span>
                      <span>
                        <span className="text-[#556052] dark:text-emerald-400">Gemini:</span>
                        {user.api_tokens.gemini_token
                          ? `${user.api_tokens.gemini_token.slice(0, 5)}...`
                          : "Not set"}
                      </span>
                      <span>
                        <span className="text-[#a55233] dark:text-amber-400">Llama:</span>
                        {user.api_tokens.llama_token
                          ? `${user.api_tokens.llama_token.slice(0, 5)}...`
                          : "Not set"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#5a544a] dark:text-gray-300">
                    <div className="flex flex-col">
                      {user.disabled_modules
                        ? Object.entries(user.disabled_modules)
                            .filter(([_, isDisabled]) => isDisabled)
                            .map(([moduleId]) => {
                              const module = availableModules.find(
                                (m) => m.id === moduleId
                              );
                              return module ? (
                                <span
                                  key={moduleId}
                                  className="text-[#ff4a4a] dark:text-red-400 flex items-center"
                                >
                                  <FaLock className="mr-1" size={12} />{" "}
                                  {module.name}
                                </span>
                              ) : null;
                            })
                        : "All modules enabled"}
                      {user.disabled_modules &&
                        Object.values(user.disabled_modules).filter(Boolean)
                          .length === 0 &&
                        "All modules enabled"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleOpenUploadModal(user)}
                        className="flex items-center text-[#556052] hover:text-[#a55233] dark:text-blue-400 dark:hover:text-blue-300 transition-all p-1 rounded-md hover:bg-[#556052]/10 dark:hover:bg-blue-900/30"
                        title="Upload documents for this user"
                      >
                        <FaFileUpload size={14} className="mr-1" />
                        <span>Upload Files</span>
                      </button>
  
                      <button
                        onClick={() => toggleUploadPermission(user.id)}
                        className={`flex items-center transition-all p-1 rounded-md ${
                          userUploadPermissions[user.id]
                            ? "text-[#556052] hover:text-[#ff4a4a] hover:bg-[#ff4a4a]/10 dark:text-green-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
                            : "text-[#ff4a4a] hover:text-[#556052] hover:bg-[#556052]/10 dark:text-red-400 dark:hover:text-green-300 dark:hover:bg-green-900/30"
                        }`}
                        title={
                          userUploadPermissions[user.id]
                            ? "Disable user uploads"
                            : "Enable user uploads"
                        }
                        disabled={uploadLoading[user.id]}
                      >
                        {uploadLoading[user.id] ? (
                          <FaSpinner size={14} className="mr-1 animate-spin" />
                        ) : userUploadPermissions[user.id] ? (
                          <FaToggleOn size={14} className="mr-1" />
                        ) : (
                          <FaToggleOff size={14} className="mr-1" />
                        )}
                        <span>
                          {userUploadPermissions[user.id]
                            ? "Can Upload"
                            : "Cannot Upload"}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-3">
                      <button
                        className="text-[#5e4636] hover:text-[#a55233] dark:text-blue-400 dark:hover:text-emerald-300 transition-colors"
                        onClick={() => handleOpenEditModal(user)}
                        title="Edit API Tokens"
                      >
                        <FaKey size={16} />
                      </button>
                      <button
                        className="text-[#5e4636] hover:text-[#a55233] dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                        onClick={() => handleOpenModulePermissionsModal(user)}
                        title="Edit Module Permissions"
                      >
                        <FaLock size={16} />
                      </button>
                      <button
                        className="text-[#ff4a4a] hover:text-[#e60000] dark:text-red-500 dark:hover:text-red-400 transition-colors"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        title="Delete User"
                        disabled={user.username === "admin"}
                      >
                        <FaUserMinus size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-sm text-[#5a544a] dark:text-gray-400"
                  >
                    No users found
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#a55233] dark:border-emerald-400"></div>
                      <span className="ml-2 text-[#5e4636] dark:text-emerald-300">Loading...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
  
      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-lg max-w-md w-full shadow-2xl border border-[#d6cbbf] dark:border-emerald-900/30">
            <div className="flex justify-between items-center border-b border-[#e3d5c8] dark:border-gray-800 p-4">
              <h2 className="text-xl font-semibold text-[#0a3b25] dark:text-emerald-400">
                Add New User
              </h2>
              <button
                className="text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white transition-colors"
                onClick={() => setIsAddModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                  Hugging Face Token
                </label>
                <input
                  type="text"
                  name="huggingface_token"
                  value={formData.huggingface_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                  Gemini Token
                </label>
                <input
                  type="text"
                  name="gemini_token"
                  value={formData.gemini_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                  Llama Token
                </label>
                <input
                  type="text"
                  name="llama_token"
                  value={formData.llama_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 bg-white border border-[#d6cbbf] hover:bg-[#f5e6d8] dark:bg-gray-800 dark:hover:bg-gray-700 text-[#5e4636] dark:text-white rounded-md transition-colors"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
      {/* Edit User Modal */}
      {isEditModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-lg max-w-md w-full shadow-2xl border border-[#d6cbbf] dark:border-emerald-900/30">
            <div className="flex justify-between items-center border-b border-[#e3d5c8] dark:border-gray-800 p-4">
              <h2 className="text-xl font-semibold text-[#0a3b25] dark:text-emerald-400">
                Edit API Tokens - {currentUser.username}
              </h2>
              <button
                className="text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white transition-colors"
                onClick={() => setIsEditModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateTokens} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                  Hugging Face Token
                </label>
                <input
                  type="text"
                  name="huggingface_token"
                  value={formData.huggingface_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                  Gemini Token
                </label>
                <input
                  type="text"
                  name="gemini_token"
                  value={formData.gemini_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                  Llama Token
                </label>
                <input
                  type="text"
                  name="llama_token"
                  value={formData.llama_token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 bg-white border border-[#d6cbbf] hover:bg-[#f5e6d8] dark:bg-gray-800 dark:hover:bg-gray-700 text-[#5e4636] dark:text-white rounded-md transition-colors"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Save
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
      {/* Module Permissions Modal */}
      {isModulePermissionsModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-lg max-w-md w-full shadow-2xl border border-[#d6cbbf] dark:border-emerald-900/30">
            <div className="flex justify-between items-center border-b border-[#e3d5c8] dark:border-gray-800 p-4">
              <h2 className="text-xl font-semibold text-[#0a3b25] dark:text-emerald-400">
                Module Permissions - {currentUser.username}
              </h2>
              <button
                className="text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white transition-colors"
                onClick={() => setIsModulePermissionsModalOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-[#5a544a] dark:text-gray-300 mb-4">
                Enable or disable access to specific modules for this user.
              </p>
  
              <div className="space-y-3 mb-6">
                {availableModules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-3 bg-[#e9dcc9] dark:bg-black/30 border border-[#d6cbbf] dark:border-emerald-900/30 rounded-lg"
                  >
                    <span className="text-[#5e4636] dark:text-white">{module.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleModulePermission(module.id)}
                      className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 
                        ${
                          modulePermissions[module.id]
                            ? "bg-[#ff4a4a]/20 text-[#ff4a4a] hover:bg-[#ff4a4a]/40 dark:bg-red-600/20 dark:text-red-300 dark:hover:bg-red-600/40"
                            : "bg-[#556052]/20 text-[#556052] hover:bg-[#556052]/40 dark:bg-emerald-600/20 dark:text-emerald-300 dark:hover:bg-emerald-600/40"
                        } 
                        transition-colors`}
                    >
                      {modulePermissions[module.id] ? (
                        <>
                          <FaLock className="mr-1" /> Disabled
                        </>
                      ) : (
                        <>
                          <FaUnlock className="mr-1" /> Enabled
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
  
              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-2 px-4 py-2 bg-white border border-[#d6cbbf] hover:bg-[#f5e6d8] dark:bg-gray-800 dark:hover:bg-gray-700 text-[#5e4636] dark:text-white rounded-md transition-colors"
                  onClick={() => setIsModulePermissionsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateModulePermissions}
                  className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Upload Documents Modal */}
    {isUploadModalOpen && currentUser && (
      <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-lg max-w-md w-full shadow-2xl border border-[#d6cbbf] dark:border-emerald-900/30">
          <div className="flex justify-between items-center border-b border-[#e3d5c8] dark:border-gray-800 p-4">
            <h2 className="text-xl font-semibold text-[#0a3b25] dark:text-emerald-400">
              Upload Documents for {currentUser.username}
            </h2>
            <button
              className="text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white transition-colors"
              onClick={() => setIsUploadModalOpen(false)}
            >
              <FaTimes />
            </button>
          </div>
          <form onSubmit={handleUploadForUser} className="p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                Select Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Select a project</option>
                {userProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                Select Documents
              </label>
              <div
                className="w-full p-6 border-2 border-dashed border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-center hover:border-[#a68a70] dark:hover:border-emerald-500/50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaUpload className="mx-auto h-10 w-10 text-[#a55233]/50 dark:text-emerald-500/50" />
                <p className="mt-2 text-sm text-[#5a544a] dark:text-gray-300">
                  Click to select or drag and drop files here
                </p>
                <p className="mt-1 text-xs text-[#5a544a] dark:text-gray-400">
                  PDF, DOCX, TXT, PPTX, XLSX
                </p>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.txt,.pptx,.xlsx"
                />
              </div>

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-2">
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <ul className="max-h-40 overflow-y-auto bg-[#e9dcc9]/50 dark:bg-black/20 rounded-md p-2 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="text-xs text-[#5a544a] dark:text-gray-300 flex items-center"
                      >
                        <FaFileUpload
                          className="mr-1 text-[#556052] dark:text-blue-400"
                          size={12}
                        />
                        {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Upload progress bar */}
            {uploadProgress > 0 && (
              <div className="mb-4">
                <div className="w-full bg-[#e3d5c8] dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#a55233] to-[#556052] dark:from-blue-500 dark:to-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-center mt-1 text-[#5a544a] dark:text-gray-300">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                className="mr-2 px-4 py-2 bg-white border border-[#d6cbbf] hover:bg-[#f5e6d8] dark:bg-gray-800 dark:hover:bg-gray-700 text-[#5e4636] dark:text-white rounded-md transition-colors"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 text-white rounded-md flex items-center transition-colors shadow-md"
                disabled={
                  loading || !selectedFiles.length || !selectedProject
                }
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaFileUpload className="mr-2" /> Upload Files
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
};

export default AdminPanel;
