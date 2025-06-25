import React, { useState, useEffect, useRef } from "react";
import { adminService, documentService,adminNotebookServiceNB } from "../utils/axiosConfig";
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
  FaPlus,
  FaEdit,
  FaTrash,
  FaTags,
  FaUsers,
  FaCog,
  FaShieldAlt,
  FaCloudUploadAlt,
  FaEye,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import Header from "../components/dashboard/Header";
import { toast } from "react-toastify";

// List of available modules to match the ones from projects page
const availableModules = [
  { id: "document-qa", name: "Document Q&A" },
  { id: "idea-generator", name: "Idea Generator" },
  { id: "klarifai-notebook", name: "Klarifai Notebook" },
  { id: "ad-campaign-generator", name: "Ad Campaign Generator" },
];

const availableRightPanelFeatures = [
  {
    id: "right-panel-access",
    name: "Right Panel Access",
    description: "Enable/disable entire right panel for this user",
  },
  {
    id: "mindmap-generation",
    name: "MindMap Generation",
    description: "Allow user to generate new mindmaps from documents",
  },
  {
    id: "mindmap-history",
    name: "MindMap History",
    description: "Allow user to view previously generated mindmaps",
  },
  {
    id: "notes-panel",
    name: "Notes Panel",
    description: "Allow user to access notes functionality",
  },
];

// Main Admin Panel Component
const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [expandedSections, setExpandedSections] = useState({
    userInfo: true,
    modulePermissions: true,
    uploadControls: true,
    featurePermissions: true,
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModulePermissionsModalOpen, setIsModulePermissionsModalOpen] =
    useState(false);
  const [
    isRightPanelPermissionsModalOpen,
    setIsRightPanelPermissionsModalOpen,
  ] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    nebius_token: "",
    gemini_token: "",
    llama_token: "",
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    user_id: "",
  });

  // State for upload permissions
  const [userUploadPermissions, setUserUploadPermissions] = useState({});
  const [uploadLoading, setUploadLoading] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userStats, setUserStats] = useState([]);
  const [notebookUserStats, setNotebookUserStats] = useState([]);

  const fileInputRef = useRef(null);

  // State for module permissions
  const [modulePermissions, setModulePermissions] = useState({});
  const [rightPanelPermissions, setRightPanelPermissions] = useState({});

  // Fetch all users on component mount

useEffect(() => {
  if (
    activeTab === "users" ||
    activeTab === "modules" ||
    activeTab === "uploads" ||
    activeTab === "features"
  ) {
    fetchUsers();
    fetchUserStats();
    fetchNotebookUserStats(); // <-- Fetch notebook stats on tab change
  } else if (activeTab === "categories") {
    fetchCategories();
  }
}, [activeTab]);




  const fetchUserStats = async () => {
    try {
      const stats = await adminService.getUserStats();
      setUserStats(stats.user_stats || []);
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
    }
  };

const fetchNotebookUserStats = async () => {
  try {
    const stats = await adminNotebookServiceNB.getNotebookUserStats(); // <-- Use the NB admin service
    setNotebookUserStats(stats.user_stats || []);
  } catch (err) {
    console.error("Failed to fetch notebook user stats:", err);
  }
};


  

  // Updated fetchUsers function with debug logging
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAllUsers();

      console.log("=== FETCH USERS DEBUG ===");
      console.log("Raw backend response:", JSON.stringify(data, null, 2));

      data.forEach((user) => {
        console.log(`User ${user.username}:`, {
          id: user.id,
          disabled_features: user.disabled_features,
          disabled_features_type: typeof user.disabled_features,
          disabled_features_keys: user.disabled_features
            ? Object.keys(user.disabled_features)
            : "null/undefined",
        });
      });

      // Initialize upload permissions state with proper boolean values
      const permissions = {};
      data.forEach((user) => {
        const canUpload = user.upload_permissions
          ? user.upload_permissions.can_upload
          : true;
        permissions[user.id] = Boolean(canUpload);

        console.log(`User ${user.id} (${user.username}):`, {
          upload_permissions: permissions[user.id],
          disabled_features: user.disabled_features,
          disabled_modules: user.disabled_modules,
        });
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

  // Function to fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAllCategories();
      setCategories(data);
    } catch (err) {
      setError("Failed to fetch categories. Please try again.");
      console.error("Error fetching categories:", err);
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

  // Handle category form input changes
  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open edit modal with user data
  const handleOpenEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      nebius_token: user.api_tokens.nebius_token || "",
      gemini_token: user.api_tokens.gemini_token || "",
      llama_token: user.api_tokens.llama_token || "",
    });
    setIsEditModalOpen(true);
  };

  // Open module permissions modal
  const handleOpenModulePermissionsModal = (user) => {
    setCurrentUser(user);
    setModulePermissions(user.disabled_modules || {});
    setIsModulePermissionsModalOpen(true);
  };

  // Fixed modal initialization
  const handleOpenRightPanelPermissionsModal = (user) => {
    console.log("Opening right panel permissions for user:", user.username);
    console.log("User disabled_features:", user.disabled_features);

    setCurrentUser(user);
    const currentPermissions = user.disabled_features || {};
    console.log("Setting rightPanelPermissions to:", currentPermissions);
    setRightPanelPermissions(currentPermissions);
    setIsRightPanelPermissionsModalOpen(true);
  };

  // Open upload modal and fetch user's projects
  const handleOpenUploadModal = async (user) => {
    setCurrentUser(user);
    setSelectedFiles([]);
    setSelectedProject("");
    setUploadProgress(0);

    try {
      const projects = await adminService.getUserProjects(user.id);
      setUserProjects(projects || []);
      setIsUploadModalOpen(true);
    } catch (err) {
      console.error("Error fetching user projects:", err);
      toast.error("Failed to fetch user projects");
    }
  };

  // Category management functions
  const handleOpenCategoryModal = () => {
    setCategoryFormData({
      name: "",
      description: "",
      user_id: "",
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (category) => {
    setCurrentCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description,
      user_id: category.user_id,
    });
    setIsEditCategoryModalOpen(true);
  };

  // Toggle module permission for a user
  const toggleModulePermission = (moduleId) => {
    setModulePermissions((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Toggle right panel permission for a user
  const toggleRightPanelPermission = (featureId) => {
    setRightPanelPermissions((prev) => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  // Toggle upload permission for a user
  const toggleUploadPermission = async (userId) => {
    try {
      setUploadLoading((prev) => ({ ...prev, [userId]: true }));
      const currentPermission = userUploadPermissions[userId];
      const newPermission = !currentPermission;

      console.log(
        `Toggling user ${userId} upload permission from ${currentPermission} to ${newPermission}`
      );

      setUserUploadPermissions((prev) => ({
        ...prev,
        [userId]: newPermission,
      }));

      const response = await adminService.updateUserUploadPermissions(userId, {
        can_upload: newPermission,
      });

      if (response && response.data && response.data.success) {
        toast.success(
          `Upload ${newPermission ? "enabled" : "disabled"} for user`
        );
      } else {
        setUserUploadPermissions((prev) => ({
          ...prev,
          [userId]: currentPermission,
        }));
        toast.error(
          "Failed to update upload permissions: Server did not confirm the change"
        );
      }
    } catch (err) {
      console.error("Error updating upload permissions:", err);
      toast.error("Failed to update upload permissions");
      setUserUploadPermissions((prev) => ({
        ...prev,
        [userId]: userUploadPermissions[userId],
      }));
    } finally {
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
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

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
        currentUser.id
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
        nebius_token: "",
        gemini_token: "",
        llama_token: "",
      });
      fetchUsers();
      toast.success("User created successfully");
    } catch (err) {
      setError("Failed to create user. Please try again.");
      console.error("Error creating user:", err);
      toast.error("Failed to create user");
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
        nebius_token: formData.nebius_token,
        gemini_token: formData.gemini_token,
        llama_token: formData.llama_token,
      });
      setIsEditModalOpen(false);
      fetchUsers();
      toast.success("User tokens updated successfully");
    } catch (err) {
      setError("Failed to update user tokens. Please try again.");
      console.error("Error updating tokens:", err);
      toast.error("Failed to update user tokens");
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

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === currentUser.id
            ? { ...user, disabled_modules: modulePermissions }
            : user
        )
      );
      toast.success("Module permissions updated successfully");
    } catch (err) {
      setError("Failed to update module permissions. Please try again.");
      console.error("Error updating module permissions:", err);
      toast.error("Failed to update module permissions");
    } finally {
      setLoading(false);
    }
  };

  // Handle updating right panel permissions
  const handleUpdateRightPanelPermissions = async () => {
    setLoading(true);
    try {
      console.log("=== UPDATING PERMISSIONS ===");
      console.log("Sending to backend:", {
        user_id: currentUser.id,
        disabled_features: rightPanelPermissions,
      });

      const response = await adminService.updateUserRightPanelPermissions(
        currentUser.id,
        {
          disabled_features: rightPanelPermissions,
        }
      );

      console.log("Backend response:", response);

      setIsRightPanelPermissionsModalOpen(false);

      setTimeout(async () => {
        await fetchUsers();
      }, 500);

      toast.success("Right panel permissions updated successfully");
    } catch (err) {
      console.error("Error updating right panel permissions:", err);
      toast.error("Failed to update right panel permissions");
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
        toast.success("User deleted successfully");
      } catch (err) {
        setError("Failed to delete user. Please try again.");
        console.error("Error deleting user:", err);
        toast.error("Failed to delete user");
      } finally {
        setLoading(false);
      }
    }
  };

  // Category CRUD operations
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.createCategory(categoryFormData);
      setIsCategoryModalOpen(false);
      setCategoryFormData({
        name: "",
        description: "",
        user_id: "",
      });
      fetchCategories();
      toast.success("Category created successfully");
    } catch (err) {
      setError("Failed to create category. Please try again.");
      console.error("Error creating category:", err);
      toast.error("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.updateCategory(currentCategory.id, {
        name: categoryFormData.name,
        description: categoryFormData.description,
      });
      setIsEditCategoryModalOpen(false);
      fetchCategories();
      toast.success("Category updated successfully");
    } catch (err) {
      setError("Failed to update category. Please try again.");
      console.error("Error updating category:", err);
      toast.error("Failed to update category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (
      window.confirm(
        `Are you sure you want to delete category "${categoryName}"?`
      )
    ) {
      setLoading(true);
      try {
        await adminService.deleteCategory(categoryId);
        fetchCategories();
        toast.success("Category deleted successfully");
      } catch (err) {
        setError("Failed to delete category. Please try again.");
        console.error("Error deleting category:", err);
        toast.error("Failed to delete category");
      } finally {
        setLoading(false);
      }
    }
  };

  const UserInfoSection = () => {
    console.log("userStats:", userStats); // Add this line
    return (
      <div className="bg-white/80 dark:bg-black/50 dark:backdrop-blur-sm rounded-xl shadow-lg border border-[#e8ddcc] dark:border-emerald-900/50 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-[#e9dcc9] to-[#f5e6d8] dark:from-black/70 dark:to-emerald-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-[#a55233]/20 dark:bg-emerald-600/20">
                <FaUsers
                  className="text-[#a55233] dark:text-emerald-400"
                  size={20}
                />
              </div>
              <h3 className="text-lg font-semibold text-[#0a3b25] dark:text-emerald-400">
                User Information
              </h3>
            </div>
            <button
              className="bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-all"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FaUserPlus className="mr-2" size={14} /> Add New User
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <p className="text-[#5e4636] dark:text-gray-300 text-base">
              Manage user accounts and basic information
            </p>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#a55233] dark:border-emerald-400"></div>
                <span className="ml-3 text-[#5e4636] dark:text-emerald-300">
                  Loading users...
                </span>
              </div>
            ) : (
              <div className="grid gap-6">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg p-6 border border-[#e3d5c8] dark:border-gray-700/50 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center space-x-4 mb-5">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#a55233] to-[#556052] dark:from-blue-500 dark:to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#0a3b25] dark:text-emerald-400 text-lg">
                              {user.username}
                            </h4>
                            <p className="text-sm text-[#5a544a] dark:text-gray-400 mt-1">
                              ID: {user.id} • {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                          <div className="space-y-2">
                            <p className="text-sm font-bold text-[#556052] dark:text-blue-400 uppercase tracking-wide">
                              API Tokens
                            </p>
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between">
                            <span className="font-medium">Nebius:</span>
                            <span className="text-[#5e4636] dark:text-gray-300">
                              {user.api_tokens.nebius_token ? `${user.api_tokens.nebius_token.slice(0, 30)}...` : "Not set"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Gemini:</span>
                            <span className="text-[#5e4636] dark:text-gray-300">
                              {user.api_tokens.gemini_token ? `${user.api_tokens.gemini_token.slice(0, 30)}...` : "Not set"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Llama:</span>
                            <span className="text-[#5e4636] dark:text-gray-300">
                              {user.api_tokens.llama_token ? `${user.api_tokens.llama_token.slice(0, 30)}...` : "Not set"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                     

                          <div className="space-y-3">
                            <p className="text-sm font-bold text-[#556052] dark:text-purple-400 uppercase tracking-wide">
                              Module Access
                            </p>
                            <div className="text-sm">
                              <div className="bg-[#e9dcc9] dark:bg-gray-700/50 rounded-lg p-3">
                                <span className="text-[#5e4636] dark:text-gray-300 font-medium">
                                  {(() => {
                                    const totalModules = availableModules.length;
                                    const disabledModules =
                                      user.disabled_modules || {};

                                    // Count how many modules are actually disabled (value = true)
                                    const disabledCount = Object.values(
                                      disabledModules
                                    ).filter(
                                      (isDisabled) => isDisabled === true
                                    ).length;
                                    const enabledCount =
                                      totalModules - disabledCount;

                                    if (disabledCount === 0) {
                                      return `All ${totalModules} modules enabled`;
                                    } else if (enabledCount === 0) {
                                      return `All modules disabled`;
                                    } else {
                                      return `${enabledCount}/${totalModules} modules enabled`;
                                    }
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-sm font-bold text-[#556052] dark:text-cyan-400 uppercase tracking-wide">
                              Upload Status
                            </p>
                            <div className="text-sm">
                              <div
                                className={`rounded-lg p-3 font-medium ${
                                  userUploadPermissions[user.id]
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                }`}
                              >
                                {userUploadPermissions[user.id]
                                  ? "Upload Enabled"
                                  : "Upload Disabled"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          className="p-3 text-[#5e4636] hover:text-[#a55233] dark:text-blue-400 dark:hover:text-emerald-300 hover:bg-[#a55233]/10 dark:hover:bg-emerald-500/20 rounded-lg transition-all"
                          onClick={() => handleOpenEditModal(user)}
                          title="Edit API Tokens"
                        >
                          <FaKey size={18} />
                        </button>
                        <button
                          className="p-3 text-[#ff4a4a] hover:text-[#e60000] dark:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          title="Delete User"
                          disabled={user.username === "admin"}
                        >
                          <FaUserMinus size={18} />
                        </button>
                      </div>
                    </div>
                    {/* Show question stats if available */}
                    {userStats.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-[#a55233] dark:text-emerald-400 mb-1">
                          Document Q&A Documents & Questions:
                        </p>
                        <ul className="text-xs bg-[#e9dcc9]/50 dark:bg-black/20 rounded-md p-2 space-y-1">
                          {(userStats.find((u) => u.user_id === user.id)
                            ?.documents || []
                          ).map((doc) => (
                            <li key={doc.document_id} className="flex justify-between">
                              <span>{doc.filename}</span>
                              <span className="font-mono">
                                {doc.questions_asked} questions
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs mt-2 text-[#5e4636] dark:text-gray-400">
                          Total uploads:{" "}
                          <span className="font-bold">
                            {
                              userStats.find((u) => u.user_id === user.id)
                                ?.document_upload_count || 0
                            }
                          </span>
                        </p>
                        
                      </div>
                    )}
                    {notebookUserStats.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-[#a55233] dark:text-emerald-400 mb-1">
                          Notebook Documents & Questions:
                        </p>
                        <ul className="text-xs bg-[#e9dcc9]/50 dark:bg-black/20 rounded-md p-2 space-y-1">
                          {(notebookUserStats.find((u) => u.user_id === user.id)?.documents || []).map((doc) => (
                            <li key={doc.document_id} className="flex justify-between">
                              <span>{doc.filename}</span>
                              <span className="font-mono">
                                {doc.questions_asked} questions
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs mt-2 text-[#5e4636] dark:text-gray-400">
                          Total notebook uploads:{" "}
                          <span className="font-bold">
                            {notebookUserStats.find((u) => u.user_id === user.id)?.document_upload_count || 0}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  const ModulePermissionsSection = () => (
    <div className="bg-white/80 dark:bg-black/50 dark:backdrop-blur-sm rounded-xl shadow-lg border border-[#e8ddcc] dark:border-emerald-900/50 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-[#e9dcc9] to-[#f5e6d8] dark:from-black/70 dark:to-emerald-900/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#a55233]/20 dark:bg-emerald-600/20">
            <FaShieldAlt
              className="text-[#a55233] dark:text-emerald-400"
              size={20}
            />
          </div>
          <h3 className="text-lg font-semibold text-[#0a3b25] dark:text-emerald-400">
            Module Permissions
          </h3>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          <p className="text-[#5e4636] dark:text-gray-300 mb-4">
            Control access to different modules for each user
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#a55233] dark:border-emerald-400"></div>
              <span className="ml-3 text-[#5e4636] dark:text-emerald-300">
                Loading users...
              </span>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg p-4 border border-[#e3d5c8] dark:border-gray-700/50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-[#0a3b25] dark:text-emerald-400">
                        {user.username}
                      </span>
                    </div>
                    <button
                      className="bg-[#556052] hover:bg-[#4a5249] dark:bg-purple-600 dark:hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center transition-all"
                      onClick={() => handleOpenModulePermissionsModal(user)}
                    >
                      <FaCog className="mr-2" size={12} /> Configure
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableModules.map((module) => {
                      const isDisabled = user.disabled_modules?.[module.id];
                      return (
                        <div
                          key={module.id}
                          className={`text-xs px-2 py-1 rounded-md flex items-center ${
                            isDisabled
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {isDisabled ? (
                            <FaLock size={10} className="mr-1" />
                          ) : (
                            <FaUnlock size={10} className="mr-1" />
                          )}
                          {module.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const UploadControlsSection = () => (
    <div className="bg-white/80 dark:bg-black/50 dark:backdrop-blur-sm rounded-xl shadow-lg border border-[#e8ddcc] dark:border-emerald-900/50 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-[#e9dcc9] to-[#f5e6d8] dark:from-black/70 dark:to-emerald-900/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#a55233]/20 dark:bg-emerald-600/20">
            <FaCloudUploadAlt
              className="text-[#a55233] dark:text-emerald-400"
              size={20}
            />
          </div>
          <h3 className="text-lg font-semibold text-[#0a3b25] dark:text-emerald-400">
            Upload Controls
          </h3>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          <p className="text-[#5e4636] dark:text-gray-300 mb-4">
            Manage file upload permissions and upload files for users
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#a55233] dark:border-emerald-400"></div>
              <span className="ml-3 text-[#5e4636] dark:text-emerald-300">
                Loading users...
              </span>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg p-4 border border-[#e3d5c8] dark:border-gray-700/50"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-[#0a3b25] dark:text-emerald-400">
                          {user.username}
                        </span>
                        <div
                          className={`text-xs mt-1 ${
                            userUploadPermissions[user.id]
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          Upload{" "}
                          {userUploadPermissions[user.id]
                            ? "Enabled"
                            : "Disabled"}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        className="bg-[#556052] hover:bg-[#4a5249] dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center transition-all"
                        onClick={() => handleOpenUploadModal(user)}
                      >
                        <FaFileUpload className="mr-2" size={12} /> Upload Files
                      </button>

                      <button
                        className={`px-3 py-1.5 rounded-lg text-sm flex items-center transition-all ${
                          userUploadPermissions[user.id]
                            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                            : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                        }`}
                        onClick={() => toggleUploadPermission(user.id)}
                        disabled={uploadLoading[user.id]}
                      >
                        {uploadLoading[user.id] ? (
                          <FaSpinner className="mr-1 animate-spin" size={12} />
                        ) : userUploadPermissions[user.id] ? (
                          <>
                            <FaToggleOff className="mr-1" size={12} /> Disable
                          </>
                        ) : (
                          <>
                            <FaToggleOn className="mr-1" size={12} /> Enable
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const FeaturePermissionsSection = () => (
    <div className="bg-white/80 dark:bg-black/50 dark:backdrop-blur-sm rounded-xl shadow-lg border border-[#e8ddcc] dark:border-emerald-900/50 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-[#e9dcc9] to-[#f5e6d8] dark:from-black/70 dark:to-emerald-900/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#a55233]/20 dark:bg-emerald-600/20">
            <FaEye className="text-[#a55233] dark:text-emerald-400" size={20} />
          </div>
          <h3 className="text-lg font-semibold text-[#0a3b25] dark:text-emerald-400">
            Feature Permissions
          </h3>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          <p className="text-[#5e4636] dark:text-gray-300 mb-4">
            Control access to right panel and advanced features
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#a55233] dark:border-emerald-400"></div>
              <span className="ml-3 text-[#5e4636] dark:text-emerald-300">
                Loading users...
              </span>
            </div>
          ) : (
            <div className="grid gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg p-4 border border-[#e3d5c8] dark:border-gray-700/50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-[#0a3b25] dark:text-emerald-400">
                          {user.username}
                        </span>
                        <div
                          className={`text-xs mt-1 ${
                            user.disabled_features?.["right-panel-access"]
                              ? "text-red-600 dark:text-red-400"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          Right Panel{" "}
                          {user.disabled_features?.["right-panel-access"]
                            ? "Disabled"
                            : "Enabled"}
                        </div>
                      </div>
                    </div>
                    <button
                      className="bg-[#556052] hover:bg-[#4a5249] dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center transition-all"
                      onClick={() => handleOpenRightPanelPermissionsModal(user)}
                    >
                      <FaTags className="mr-2" size={12} /> Configure
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableRightPanelFeatures.slice(0, 4).map((feature) => {
                      const isDisabled = user.disabled_features?.[feature.id];
                      return (
                        <div
                          key={feature.id}
                          className={`text-xs px-2 py-1 rounded-md flex items-center ${
                            isDisabled
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {isDisabled ? (
                            <FaLock size={10} className="mr-1" />
                          ) : (
                            <FaUnlock size={10} className="mr-1" />
                          )}
                          {feature.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const CategoryManagementSection = () => (
    <div className="bg-white/80 dark:bg-black/50 dark:backdrop-blur-sm rounded-xl shadow-lg border border-[#e8ddcc] dark:border-emerald-900/50 overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-[#e9dcc9] to-[#f5e6d8] dark:from-black/70 dark:to-emerald-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#a55233]/20 dark:bg-emerald-600/20">
              <FaTags
                className="text-[#a55233] dark:text-emerald-400"
                size={20}
              />
            </div>
            <h3 className="text-lg font-semibold text-[#0a3b25] dark:text-emerald-400">
              Category Management
            </h3>
          </div>
          <button
            className="bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-all"
            onClick={handleOpenCategoryModal}
          >
            <FaPlus className="mr-2" size={14} /> Add Category
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          <p className="text-[#5e4636] dark:text-gray-300">
            Organize and manage content categories
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#a55233] dark:border-emerald-400"></div>
              <span className="ml-3 text-[#5e4636] dark:text-emerald-300">
                Loading categories...
              </span>
            </div>
          ) : (
            <div className="grid gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg p-4 border border-[#e3d5c8] dark:border-gray-700/50 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#a55233] to-[#556052] dark:from-purple-500 dark:to-pink-500 rounded-lg flex items-center justify-center">
                          <FaTags className="text-white" size={16} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#0a3b25] dark:text-emerald-400">
                            {category.name}
                          </h4>
                          <p className="text-sm text-[#5a544a] dark:text-gray-400">
                            Created by {category.username} •{" "}
                            {new Date(category.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        className="p-2 text-[#5e4636] hover:text-[#a55233] dark:text-blue-400 dark:hover:text-emerald-300 hover:bg-[#a55233]/10 dark:hover:bg-emerald-500/20 rounded-lg transition-all"
                        onClick={() => handleOpenEditCategoryModal(category)}
                        title="Edit Category"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        className="p-2 text-[#ff4a4a] hover:text-[#e60000] dark:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        onClick={() =>
                          handleDeleteCategory(category.id, category.name)
                        }
                        title="Delete Category"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#faf4ee] dark:bg-black min-h-screen text-[#5e4636] dark:text-white">
      <Header />

      {/* Fixed Navigation Bar */}
      <div className="sticky top-14 z-40 bg-[#faf4ee]/95 dark:bg-black backdrop-blur-lg  border-[#e8ddcc]/50 dark:border-emerald-900/30">
        <div className="max-w-7xl mx-auto px-3 py-3">
          {/* Error Alert */}
          {error && (
            <div className="bg-[#fff0f0] text-[#ff4a4a] dark:bg-red-500/80 dark:text-white p-4 mb-4 rounded-lg shadow-lg">
              {error}
            </div>
          )}

          {/* Page Title and Navigation in One Line */}
          <div
            className="stagger-item flex items-center justify-between gap-6"
            style={{
              animationDelay: "0.2s",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            {/* Title Section */}

            <h1 className="text-3xl font-serif text-[#0a3b25] dark:text-emerald-400 duration-500">
              Admin Panel
            </h1>

            {/* Modern Tab Navigation */}
            <div className="flex items-center space-x-2 bg-white/60 dark:bg-black/40 p-2 rounded-2xl shadow-inner border border-[#e8ddcc]/50 dark:border-emerald-900/30">
              <button
                className={`px-4 py-2.5 rounded-xl flex items-center transition-all duration-300 font-medium text-sm whitespace-nowrap ${
                  activeTab === "users"
                    ? "bg-gradient-to-r from-[#a55233] to-[#8b4513] dark:from-blue-600 dark:to-emerald-600 text-white shadow-lg transform scale-105"
                    : "text-[#5e4636] dark:text-emerald-300 hover:bg-white/70 dark:hover:bg-black/30 hover:scale-102"
                }`}
                onClick={() => setActiveTab("users")}
              >
                <FaUsers className="mr-2" size={14} />
                <span className="hidden sm:inline">User Info</span>
                <span className="sm:hidden">Users</span>
              </button>
              <button
                className={`px-4 py-2.5 rounded-xl flex items-center transition-all duration-300 font-medium text-sm whitespace-nowrap ${
                  activeTab === "modules"
                    ? "bg-gradient-to-r from-[#a55233] to-[#8b4513] dark:from-blue-600 dark:to-emerald-600 text-white shadow-lg transform scale-105"
                    : "text-[#5e4636] dark:text-emerald-300 hover:bg-white/70 dark:hover:bg-black/30 hover:scale-102"
                }`}
                onClick={() => setActiveTab("modules")}
              >
                <FaShieldAlt className="mr-2" size={14} />
                <span className="hidden sm:inline">Module Control</span>
                <span className="sm:hidden">Modules</span>
              </button>
              <button
                className={`px-4 py-2.5 rounded-xl flex items-center transition-all duration-300 font-medium text-sm whitespace-nowrap ${
                  activeTab === "uploads"
                    ? "bg-gradient-to-r from-[#a55233] to-[#8b4513] dark:from-blue-600 dark:to-emerald-600 text-white shadow-lg transform scale-105"
                    : "text-[#5e4636] dark:text-emerald-300 hover:bg-white/70 dark:hover:bg-black/30 hover:scale-102"
                }`}
                onClick={() => setActiveTab("uploads")}
              >
                <FaCloudUploadAlt className="mr-2" size={14} />
                <span className="hidden sm:inline">Upload Control</span>
                <span className="sm:hidden">Uploads</span>
              </button>
              <button
                className={`px-4 py-2.5 rounded-xl flex items-center transition-all duration-300 font-medium text-sm whitespace-nowrap ${
                  activeTab === "features"
                    ? "bg-gradient-to-r from-[#a55233] to-[#8b4513] dark:from-blue-600 dark:to-emerald-600 text-white shadow-lg transform scale-105"
                    : "text-[#5e4636] dark:text-emerald-300 hover:bg-white/70 dark:hover:bg-black/30 hover:scale-102"
                }`}
                onClick={() => setActiveTab("features")}
              >
                <FaEye className="mr-2" size={14} />
                <span className="hidden sm:inline">Feature Permissions</span>
                <span className="sm:hidden">Features</span>
              </button>
              <button
                className={`px-4 py-2.5 rounded-xl flex items-center transition-all duration-300 font-medium text-sm whitespace-nowrap ${
                  activeTab === "categories"
                    ? "bg-gradient-to-r from-[#a55233] to-[#8b4513] dark:from-blue-600 dark:to-emerald-600 text-white shadow-lg transform scale-105"
                    : "text-[#5e4636] dark:text-emerald-300 hover:bg-white/70 dark:hover:bg-black/30 hover:scale-102"
                }`}
                onClick={() => setActiveTab("categories")}
              >
                <FaTags className="mr-2" size={14} />
                <span className="hidden sm:inline">Category Management</span>
                <span className="sm:hidden">Categories</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12 mt-8">
        {/* Content Sections */}

        <div className="relative min-h-[600px]">
          <div
            key={activeTab}
            className="smooth-appear"
            style={{
              animationDelay: "0.1s",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            {activeTab === "users" && (
              <div className="space-y-8">
                <UserInfoSection />
              </div>
            )}
            {activeTab === "modules" && (
              <div className="space-y-8">
                <ModulePermissionsSection />
              </div>
            )}
            {activeTab === "uploads" && (
              <div className="space-y-8">
                <UploadControlsSection />
              </div>
            )}
            {activeTab === "features" && (
              <div className="space-y-8">
                <FeaturePermissionsSection />
              </div>
            )}
            {activeTab === "categories" && (
              <div className="space-y-8">
                <CategoryManagementSection />
              </div>
            )}
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
                    name="nebius_token"
                    value={formData.nebius_token}
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
                    Nebius Token
                  </label>
                  <input
                    type="text"
                    name="nebius_token"
                    value={formData.nebius_token}
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
                      <span className="text-[#5e4636] dark:text-white">
                        {module.name}
                      </span>
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

        {/* Right Panel Permissions Modal */}
        {isRightPanelPermissionsModalOpen && currentUser && (
          <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-lg max-w-lg w-full shadow-2xl border border-[#d6cbbf] dark:border-emerald-900/30">
              <div className="flex justify-between items-center border-b border-[#e3d5c8] dark:border-gray-800 p-4">
                <h2 className="text-xl font-semibold text-[#0a3b25] dark:text-emerald-400">
                  Right Panel Permissions - {currentUser.username}
                </h2>
                <button
                  className="text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white transition-colors"
                  onClick={() => setIsRightPanelPermissionsModalOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#5a544a] dark:text-gray-300 mb-4">
                  Control access to right panel features for this user.
                </p>

                <div className="space-y-3 mb-6">
                  {availableRightPanelFeatures.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-start justify-between p-4 bg-[#e9dcc9] dark:bg-black/30 border border-[#d6cbbf] dark:border-emerald-900/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="text-[#5e4636] dark:text-white font-medium block">
                          {feature.name}
                        </span>
                        <span className="text-xs text-[#8c715f] dark:text-gray-400 mt-1 block">
                          {feature.description}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRightPanelPermission(feature.id)}
                        className={`ml-3 px-3 py-1.5 rounded-lg flex items-center space-x-2 flex-shrink-0
                          ${
                            rightPanelPermissions[feature.id]
                              ? "bg-[#ff4a4a]/20 text-[#ff4a4a] hover:bg-[#ff4a4a]/40 dark:bg-red-600/20 dark:text-red-300 dark:hover:bg-red-600/40"
                              : "bg-[#556052]/20 text-[#556052] hover:bg-[#556052]/40 dark:bg-emerald-600/20 dark:text-emerald-300 dark:hover:bg-emerald-600/40"
                          }
                          transition-colors`}
                      >
                        {rightPanelPermissions[feature.id] ? (
                          <>
                            <FaLock className="mr-1" size={12} /> Disabled
                          </>
                        ) : (
                          <>
                            <FaUnlock className="mr-1" size={12} /> Enabled
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Important Note
                     
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <p>
                          Disabling "Right Panel Access" will hide the entire
                          right panel for this user. Other right panel features
                          will be automatically inaccessible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mr-2 px-4 py-2 bg-white border border-[#d6cbbf] hover:bg-[#f5e6d8] dark:bg-gray-800 dark:hover:bg-gray-700 text-[#5e4636] dark:text-white rounded-md transition-colors"
                    onClick={() => setIsRightPanelPermissionsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateRightPanelPermissions}
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
                        <FaSave className="mr-2" /> Save Right Panel
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

        {/* Add Category Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-lg max-w-md w-full shadow-2xl border border-[#d6cbbf] dark:border-emerald-900/30">
              <div className="flex justify-between items-center border-b border-[#e3d5c8] dark:border-gray-800 p-4">
                <h2 className="text-xl font-semibold text-[#0a3b25] dark:text-emerald-400">
                  Add New Category
                </h2>
                <button
                  className="text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white transition-colors"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleCreateCategory} className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                    Select User
                  </label>
                  <select
                    name="user_id"
                    value={categoryFormData.user_id}
                    onChange={handleCategoryInputChange}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                    required
                    placeholder="Enter category name"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={categoryFormData.description}
                    onChange={handleCategoryInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mr-2 px-4 py-2 bg-white border border-[#d6cbbf] hover:bg-[#f5e6d8] dark:bg-gray-800 dark:hover:bg-gray-700 text-[#5e4636] dark:text-white rounded-md transition-colors"
                    onClick={() => setIsCategoryModalOpen(false)}
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
                        Creating...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" /> Create Category
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {isEditCategoryModalOpen && currentCategory && (
          <div className="fixed inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-black rounded-lg max-w-md w-full shadow-2xl border border-[#d6cbbf] dark:border-emerald-900/30">
              <div className="flex justify-between items-center border-b border-[#e3d5c8] dark:border-gray-800 p-4">
                <h2 className="text-xl font-semibold text-[#0a3b25] dark:text-emerald-400">
                  Edit Category - {currentCategory.name}
                </h2>
                <button
                  className="text-[#5a544a] hover:text-[#a55233] dark:text-gray-400 dark:hover:text-white transition-colors"
                  onClick={() => setIsEditCategoryModalOpen(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleUpdateCategory} className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                    User
                  </label>
                  <input
                    type="text"
                    value={currentCategory.username}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white"
                    disabled
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={categoryFormData.description}
                    onChange={handleCategoryInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/80 dark:bg-black/50 border border-[#d6cbbf] dark:border-emerald-900/50 rounded-md text-[#5e4636] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="mr-2 px-4 py-2 bg-white border border-[#d6cbbf] hover:bg-[#f5e6d8] dark:bg-gray-800 dark:hover:bg-gray-700 text-[#5e4636] dark:text-white rounded-md transition-colors"
                    onClick={() => setIsEditCategoryModalOpen(false)}
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
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" /> Update Category
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <style>
        {`
        /* Add these custom transition styles */
.fade-enter {
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-exit {
  opacity: 1;
  transform: translateY(0);
}

.fade-exit-active {
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.smooth-appear {
  animation: smoothSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes smoothSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.stagger-item {
  animation: staggerIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes staggerIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
        `}
      </style>
    </div>
  );
};

export default AdminPanel;