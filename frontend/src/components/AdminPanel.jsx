import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  adminService,
  documentService,
  adminNotebookServiceNB,
  getAdminUserStats,
} from "../utils/axiosConfig";
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
  FaUser,
  FaSearch,
  FaGlobe,
  FaMedal,
  FaProjectDiagram,
  FaQuestion,
  FaLightbulb,
  FaDownload,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import * as XLSX from "xlsx";

import Header from "../components/dashboard/Header";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

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
    token_limit: "",
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
  const [showUserTable, setShowUserTable] = useState(false);
  const fileInputRef = useRef(null);

  // State for module permissions
  const [modulePermissions, setModulePermissions] = useState({});
  const [rightPanelPermissions, setRightPanelPermissions] = useState({});
  const [totalShortResponses, setTotalShortResponses] = useState(0);
  const [totalComprehensiveResponses, setTotalComprehensiveResponses] =
    useState(0);
  const [totalInputTokens, setTotalInputTokens] = useState(0);
  const [totalOutputTokens, setTotalOutputTokens] = useState(0);
  const [ideaGenStats, setIdeaGenStats] = useState({
    total_projects: 0,
    total_ideas: 0,
    total_images: 0,
    total_image_cost: 0,
    users: [],
  });

  const [loadingIdeaStats, setLoadingIdeaStats] = useState(false);
  const [ideaStatsError, setIdeaStatsError] = useState(null);
  // Add these state variables near the top with other state declarations
  const [isGlobalTokenLimitModalOpen, setIsGlobalTokenLimitModalOpen] =
    useState(false);
  const [globalTokenLimitValue, setGlobalTokenLimitValue] = useState("");
  const [isGlobalPageLimitModalOpen, setIsGlobalPageLimitModalOpen] =
    useState(false);
  const [globalPageLimitValue, setGlobalPageLimitValue] = useState("");
  const [collapsedUsers, setCollapsedUsers] = useState(new Set());
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) {
      return users;
    }
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [users, userSearchTerm]);

  const toggleUserCollapse = (userId) => {
    setCollapsedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };
  const fetchNotebookUserStats = async () => {
    try {
      const stats = await adminNotebookServiceNB.getNotebookUserStats();
      setNotebookUserStats(stats.user_stats || []);
      setTotalShortResponses(
        stats.total_short_responses ?? getTotalShortResponses(stats.user_stats)
      );
      setTotalComprehensiveResponses(
        stats.total_comprehensive_responses ??
          getTotalComprehensiveResponses(stats.user_stats)
      );
      setTotalInputTokens(stats.total_input_tokens || 0);
      setTotalOutputTokens(stats.total_output_tokens || 0);
    } catch (err) {
      console.error("Failed to fetch notebook user stats:", err);
    }
  };
  const fetchIdeaGenStats = async () => {
    setLoadingIdeaStats(true);
    setIdeaStatsError(null);

    try {
      console.log("Fetching idea generator stats...");
      const response = await getAdminUserStats();
      console.log("Received response:", response);

      if (response.success) {
        setIdeaGenStats(
          response.stats || {
            total_projects: 0,
            total_ideas: 0,
            total_images: 0,
            total_users: 0,
            total_image_cost: 0,
            users: [],
          }
        );
      } else {
        setIdeaStatsError(response.error || "Failed to fetch stats");
      }
    } catch (err) {
      console.error("Failed to fetch idea generator stats:", err);
      setIdeaStatsError(err.message || "Failed to fetch stats");
    } finally {
      setLoadingIdeaStats(false);
    }
  };

  // Helper functions to sum short/comprehensive responses if not provided by backend
  function getTotalShortResponses(userStatsArr) {
    if (!Array.isArray(userStatsArr)) return 0;
    return userStatsArr.reduce((acc, user) => {
      return (
        acc +
        (user.documents?.reduce(
          (sum, doc) => sum + (doc.short_responses || 0),
          0
        ) || 0)
      );
    }, 0);
  }
  function getTotalComprehensiveResponses(userStatsArr) {
    if (!Array.isArray(userStatsArr)) return 0;
    return userStatsArr.reduce((acc, user) => {
      return (
        acc +
        (user.documents?.reduce(
          (sum, doc) => sum + (doc.comprehensive_responses || 0),
          0
        ) || 0)
      );
    }, 0);
  }

  useEffect(() => {
    if (users.length > 0 && collapsedUsers.size === 0) {
      setCollapsedUsers(new Set(users.map((u) => u.id)));
    }
    // eslint-disable-next-line
  }, [users]);
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
      fetchNotebookUserStats();
      fetchIdeaGenStats();
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
          token_limit_from_api_tokens: user.api_tokens?.token_limit,
          token_limit_from_user: user.token_limit,
        });
      });

      // Process the data - FIX: The token_limit is already at user level from backend
      const processedUsers = data.map((user) => ({
        ...user,
        token_limit: user.token_limit || user.api_tokens?.token_limit || null, // Check both locations
        tokens_used: user.tokens_used || 0,
      }));

      // Initialize upload permissions state with proper boolean values
      const permissions = {};
      processedUsers.forEach((user) => {
        const canUpload = user.upload_permissions
          ? user.upload_permissions.can_upload
          : true;
        permissions[user.id] = Boolean(canUpload);

        console.log(`User ${user.id} (${user.username}):`, {
          upload_permissions: permissions[user.id],
          disabled_features: user.disabled_features,
          disabled_modules: user.disabled_modules,
          token_limit: user.token_limit, // This should now show the correct value
        });
      });

      setUserUploadPermissions(permissions);
      setUsers(processedUsers);
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
      token_limit: user.token_limit || "",
      page_limit: user.api_tokens.page_limit || "",
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
  const handleSetGlobalTokenLimit = async (e) => {
    e.preventDefault();

    if (!globalTokenLimitValue) {
      toast.warning("Please enter a token limit value");
      return;
    }

    const confirmMessage = `Are you sure you want to set token limit to ${globalTokenLimitValue} for ALL users? This will override existing individual limits.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Update token limit for all users
      for (const user of users) {
        try {
          await adminService.updateUserTokens(user.id, {
            nebius_token: user.api_tokens.nebius_token || "",
            gemini_token: user.api_tokens.gemini_token || "",
            llama_token: user.api_tokens.llama_token || "",
            token_limit: globalTokenLimitValue,
          });
          successCount++;
        } catch (err) {
          console.error(
            `Failed to update tokens for user ${user.username}:`,
            err
          );
          errorCount++;
        }
      }

      setIsGlobalTokenLimitModalOpen(false);
      setGlobalTokenLimitValue("");

      // Refresh users to show updated limits
      await fetchUsers();

      if (errorCount === 0) {
        toast.success(
          `Successfully updated token limit for all ${successCount} users`
        );
      } else {
        toast.warning(
          `Updated ${successCount} users successfully, ${errorCount} failed`
        );
      }
    } catch (err) {
      console.error("Error setting global token limit:", err);
      toast.error("Failed to set global token limit");
    } finally {
      setLoading(false);
    }
  };

  const handleSetGlobalPageLimit = async (e) => {
    e.preventDefault();

    if (!globalPageLimitValue) {
      toast.warning("Please enter a page limit value");
      return;
    }

    const confirmMessage = `Are you sure you want to set page limit to ${globalPageLimitValue} for ALL users? This will override existing individual page limits.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Update page limit for all users
      for (const user of users) {
        try {
          await adminService.updateUserTokens(user.id, {
            nebius_token: user.api_tokens.nebius_token || "",
            gemini_token: user.api_tokens.gemini_token || "",
            llama_token: user.api_tokens.llama_token || "",
            token_limit: user.token_limit || "",
            page_limit: globalPageLimitValue, // Add this field
          });
          successCount++;
        } catch (err) {
          console.error(
            `Failed to update page limit for user ${user.username}:`,
            err
          );
          errorCount++;
        }
      }

      setIsGlobalPageLimitModalOpen(false);
      setGlobalPageLimitValue("");

      // Refresh users to show updated limits
      await fetchUsers();

      if (errorCount === 0) {
        toast.success(
          `Successfully updated page limit for all ${successCount} users`
        );
      } else {
        toast.warning(
          `Updated ${successCount} users successfully, ${errorCount} failed`
        );
      }
    } catch (err) {
      console.error("Error setting global page limit:", err);
      toast.error("Failed to set global page limit");
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
        token_limit: formData.token_limit,
        page_limit: formData.page_limit,
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

  const IdeaGenStatsSection = () => (
    <div className="bg-white/80 dark:bg-black/50 rounded-xl shadow-lg border border-[#e8ddcc] dark:border-emerald-900/50 overflow-hidden mb-8">
      <div className="p-6 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-orange-400/20 dark:bg-orange-600/20">
              <FaTags
                className="text-orange-700 dark:text-orange-300"
                size={20}
              />
            </div>
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300">
              Idea Generator Stats
            </h3>
          </div>
          <button
            onClick={fetchIdeaGenStats}
            disabled={loadingIdeaStats}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loadingIdeaStats ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="p-6">
        {ideaStatsError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {ideaStatsError}
          </div>
        )}

        {loadingIdeaStats ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-2 text-orange-600 dark:text-orange-400">
              Loading stats...
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {ideaGenStats.total_users || 0}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Total Users
                </div>
              </div>
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {ideaGenStats.total_projects || 0}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Total Projects
                </div>
              </div>
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {ideaGenStats.total_ideas || 0}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Total Ideas
                </div>
              </div>
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {ideaGenStats.total_images || 0}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Total Images
                </div>
              </div>
              <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  ${ideaGenStats.total_image_cost || 0}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  Total Cost
                </div>
              </div>
            </div>

            {/* User Stats Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-black/30 rounded-lg">
                <thead>
                  <tr className="bg-orange-50 dark:bg-orange-900/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                      Projects
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                      Ideas
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                      Images
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                      <button
                        onClick={() => setShowUserTable(!showUserTable)}
                        className="flex items-center justify-center w-full text-orange-700 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-100 transition-colors"
                        title={
                          showUserTable ? "Hide user data" : "Show user data"
                        }
                      >
                        {showUserTable ? (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                {showUserTable && (
                  <tbody className="divide-y divide-orange-100 dark:divide-orange-900/30">
                    {ideaGenStats.users && ideaGenStats.users.length > 0 ? (
                      ideaGenStats.users.map((user, index) => (
                        <tr
                          key={user.user_id}
                          className={
                            index % 2 === 0
                              ? "bg-orange-25 dark:bg-orange-900/10"
                              : "bg-white dark:bg-black/20"
                          }
                        >
                          <td className="px-4 py-3 text-sm font-medium text-orange-900 dark:text-orange-200">
                            {user.username}
                          </td>
                          <td className="px-4 py-3 text-sm text-orange-800 dark:text-orange-300">
                            {user.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-orange-900 dark:text-orange-200">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              {user.projects}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-orange-900 dark:text-orange-200">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              {user.ideas}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-orange-900 dark:text-orange-200">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              {user.images}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-orange-900 dark:text-orange-200">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              ${user.image_cost || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-orange-800 dark:text-orange-300">
                            {user.date_joined
                              ? new Date(user.date_joined).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="8"
                          className="px-4 py-8 text-center text-orange-600 dark:text-orange-400"
                        >
                          No user data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                )}
              </table>

              {/* Show row count when table is visible */}
              {showUserTable &&
                ideaGenStats.users &&
                ideaGenStats.users.length > 0 && (
                  <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 text-center">
                    Showing {ideaGenStats.users.length} users
                    {ideaGenStats.users.length > 15 && " (scrollable)"}
                  </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const UserInfoSection = () => {
    console.log("UserInfoSection re-rendered");

    // Calculate total statistics for overview charts
    const totalDocQAStats = userStats.reduce(
      (acc, user) => {
        acc.totalDocuments += user.document_upload_count || 0;
        acc.totalQuestions +=
          user.documents?.reduce((sum, doc) => sum + doc.questions_asked, 0) ||
          0;
        return acc;
      },
      { totalDocuments: 0, totalQuestions: 0 }
    );

    const totalNotebookStats = notebookUserStats.reduce(
      (acc, user) => {
        acc.totalDocuments += user.document_upload_count || 0;
        acc.totalQuestions +=
          user.documents?.reduce((sum, doc) => sum + doc.questions_asked, 0) ||
          0;
        acc.totalShort +=
          user.documents?.reduce((sum, doc) => sum + doc.short_responses, 0) ||
          0;
        acc.totalComprehensive +=
          user.documents?.reduce(
            (sum, doc) => sum + doc.comprehensive_responses,
            0
          ) || 0;
        return acc;
      },
      {
        totalDocuments: 0,
        totalQuestions: 0,
        totalShort: 0,
        totalComprehensive: 0,
      }
    );

    // Prepare data for charts
    const userActivityData = users.map((user) => {
      const docQAStats = userStats.find((u) => u.user_id === user.id);
      const notebookStats = notebookUserStats.find(
        (u) => u.user_id === user.id
      );
      const docQAQuestions =
        docQAStats?.documents?.reduce(
          (sum, doc) => sum + (doc.questions_asked || 0),
          0
        ) || 0;
      const notebookQuestions =
        notebookStats?.documents?.reduce(
          (sum, doc) => sum + (doc.questions_asked || 0),
          0
        ) || 0;
      const docQADocs = docQAStats?.document_upload_count || 0;
      const notebookDocs = notebookStats?.document_upload_count || 0;
      const shortResponses =
        notebookStats?.documents?.reduce(
          (sum, doc) => sum + (doc.short_responses || 0),
          0
        ) || 0;
      const comprehensiveResponses =
        notebookStats?.documents?.reduce(
          (sum, doc) => sum + (doc.comprehensive_responses || 0),
          0
        ) || 0;

      return {
        username: user.username,
        docQAQuestions:
          docQAStats?.documents?.reduce(
            (sum, doc) => sum + doc.questions_asked,
            0
          ) || 0,
        notebookQuestions:
          notebookStats?.documents?.reduce(
            (sum, doc) => sum + doc.questions_asked,
            0
          ) || 0,
        docQADocs: docQAStats?.document_upload_count || 0,
        notebookDocs: notebookStats?.document_upload_count || 0,
        shortResponses:
          notebookStats?.documents?.reduce(
            (sum, doc) => sum + doc.short_responses,
            0
          ) || 0,
        comprehensiveResponses:
          notebookStats?.documents?.reduce(
            (sum, doc) => sum + doc.comprehensive_responses,
            0
          ) || 0,
      };
    });

    const moduleAccessData = users.map((user) => {
      const totalModules = availableModules.length;
      const disabledModules = user.disabled_modules || {};
      const disabledCount = Object.values(disabledModules).filter(
        (isDisabled) => isDisabled === true
      ).length;
      const enabledCount = totalModules - disabledCount;

      return {
        username: user.username,
        enabled: enabledCount,
        disabled: disabledCount,
      };
    });

    const totalOverviewData = [
      {
        name: "Doc Q&A Documents",
        value: totalDocQAStats.totalDocuments,
        color: "#3B82F6",
      },
      {
        name: "Doc Q&A Questions",
        value: totalDocQAStats.totalQuestions,
        color: "#1E40AF",
      },
      {
        name: "Notebook Documents",
        value: totalNotebookStats.totalDocuments,
        color: "#10B981",
      },
      {
        name: "Notebook Questions",
        value: totalNotebookStats.totalQuestions,
        color: "#059669",
      },
      {
        name: "Short Responses",
        value: totalNotebookStats.totalShort,
        color: "#8B5CF6",
      },
      {
        name: "Comprehensive Responses",
        value: totalNotebookStats.totalComprehensive,
        color: "#7C3AED",
      },
    ];

    const COLORS = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
    ];

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {label}
            </p>
            {payload.map((entry, index) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="bg-white/80 dark:bg-black/50 dark:backdrop-blur-sm rounded-xl shadow-lg border border-[#e8ddcc] dark:border-emerald-900/50 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-[#e9dcc9] to-[#f5e6d8] dark:from-black/70 dark:to-emerald-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-all"
                  onClick={() => setIsGlobalTokenLimitModalOpen(true)}
                >
                  <FaGlobe className="mr-2" size={14} /> Set Global Token Limit
                </button>
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-all"
                  onClick={() => setIsGlobalPageLimitModalOpen(true)}
                >
                  <FaFileUpload className="mr-2" size={14} /> Set Global Page
                  Limit
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Total Overview Charts */}
            {(userStats.length > 0 || notebookUserStats.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Total Activity Overview - Pie Chart */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800/30">
                  <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Total Activity Distribution
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={totalOverviewData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {totalOverviewData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Total Activity Overview - Summary Stats */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/30 rounded-xl p-6 border border-violet-200 dark:border-violet-800/30">
                  <h4 className="text-lg font-semibold text-violet-800 dark:text-violet-300 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    System-Wide Summary
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {totalDocQAStats.totalDocuments}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Doc Q&A Docs
                        </div>
                      </div>
                      <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {totalDocQAStats.totalQuestions}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Doc Q&A Questions
                        </div>
                      </div>
                      <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                          {totalNotebookStats.totalDocuments}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          Notebook Docs
                        </div>
                      </div>
                      <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                          {totalNotebookStats.totalQuestions}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          Notebook Questions
                        </div>
                      </div>
                      <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {totalNotebookStats.totalShort}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">
                          Short Responses
                        </div>
                      </div>
                      <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          {totalNotebookStats.totalComprehensive}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">
                          Comprehensive
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-100 to-emerald-100 dark:from-blue-900/30 dark:to-emerald-900/30 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {users.length} Total Users
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Active in System
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Activity Comparison */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/30 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800/30">
                  <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                    User Activity Comparison
                  </h4>
                  <div className="h-64 overflow-x-auto custom-scrollbar">
                    <div
                      style={{
                        minWidth: `${Math.max(
                          600,
                          userActivityData.length * 80
                        )}px`,
                        height: "100%",
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userActivityData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="username"
                            stroke="#6b7280"
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="#6b7280" />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="docQAQuestions"
                            fill="#3B82F6"
                            radius={[2, 2, 0, 0]}
                          />
                          <Bar
                            dataKey="notebookQuestions"
                            fill="#10B981"
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All Users Activity Overview - Line Chart */}
            {(userStats.length > 0 || notebookUserStats.length > 0) &&
              userActivityData.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/30 rounded-xl p-6 border border-orange-200 dark:border-orange-800/30 mb-6 custom-scrollbar">
                  <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 10a8 8 0 118 0v3a1 1 0 001 1h4a1 1 0 100-2h-3V4a1 1 0 00-1-1H3a1 1 0 00-1 1v6z" />
                      <path d="M6 10a1 1 0 011-1h3a1 1 0 110 2H7a1 1 0 01-1-1zM6 14a1 1 0 011-1h3a1 1 0 110 2H7a1 1 0 01-1-1z" />
                    </svg>
                    All Users Activity Trends
                  </h4>
                  <div className="h-64 overflow-x-auto scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-orange-100 dark:scrollbar-thumb-orange-600 dark:scrollbar-track-orange-900/30">
                    <div
                      style={{
                        minWidth: `${Math.max(
                          800,
                          userActivityData.length * 100
                        )}px`,
                        height: "100%",
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userActivityData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="username"
                            stroke="#6b7280"
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis stroke="#6b7280" />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="docQAQuestions"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ fill: "#3B82F6", strokeWidth: 2, r: 5 }}
                            name="Doc Q&A Questions"
                          />
                          <Line
                            type="monotone"
                            dataKey="notebookQuestions"
                            stroke="#10B981"
                            strokeWidth={3}
                            dot={{ fill: "#10B981", strokeWidth: 2, r: 5 }}
                            name="Notebook Questions"
                          />
                          <Line
                            type="monotone"
                            dataKey="shortResponses"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
                            name="Short Responses"
                          />
                          <Line
                            type="monotone"
                            dataKey="comprehensiveResponses"
                            stroke="#EC4899"
                            strokeWidth={2}
                            dot={{ fill: "#EC4899", strokeWidth: 2, r: 4 }}
                            name="Comprehensive Responses"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Doc Q&A Questions
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Notebook Questions
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Short Responses
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Comprehensive Responses
                      </span>
                    </div>
                  </div>
                </div>
              )}
            <div className="flex items-center space-x-3">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition-all"
                onClick={() => setCollapsedUsers(new Set())}
              >
                Expand All
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-all"
                onClick={() =>
                  setCollapsedUsers(new Set(users.map((u) => u.id)))
                }
              >
                Collapse All
              </button>
              <button
                className="bg-[#a55233] hover:bg-[#8b4513] dark:bg-gradient-to-r dark:from-blue-600/90 dark:to-emerald-600/80 text-white px-4 py-2 rounded-lg flex items-center shadow-md transition-all"
                onClick={() => setIsAddModalOpen(true)}
              >
                <FaUserPlus className="mr-2" size={14} /> Add New User
              </button>
              <div className="w-full sm:w-72 relative search-container">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[#e3d5c8] dark:border-gray-700 bg-white/80 dark:bg-black/40 text-[#0a3b25] dark:text-gray-200 placeholder-[#5e4636] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500"
                />
                <FaSearch
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#a55233] dark:text-emerald-400"
                  size={16}
                />
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#a55233] dark:border-emerald-400"></div>
                <span className="ml-3 text-[#5e4636] dark:text-emerald-300">
                  Loading users...
                </span>
              </div>
            ) : (
              <section className="bg-white/80 dark:bg-black/50 rounded-xl shadow-lg border border-[#e8ddcc] dark:border-emerald-900/50 overflow-hidden">
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-[#e9dcc9] to-[#f5e6d8] dark:from-black/70 dark:to-emerald-900/20">
                  <h3 className="text-lg font-semibold text-[#0a3b25] dark:text-emerald-400">
                    User Information
                  </h3>
                </div>
                {userSearchTerm && (
                  <div className="px-6 pb-2">
                    <span className="text-xs text-[#5e4636] dark:text-gray-400">
                      Showing {filteredUsers.length} user
                      {filteredUsers.length !== 1 && "s"}
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className="grid gap-6">
                    {filteredUsers.map((user) => {
                      const userDocQAStats = userStats.find(
                        (u) => u.user_id === user.id
                      );
                      const userNotebookStats = notebookUserStats.find(
                        (u) => u.user_id === user.id
                      );

                      // Individual user chart data
                      const userChartData = [
                        {
                          name: "Doc Q&A Questions",
                          value:
                            userDocQAStats?.documents?.reduce(
                              (sum, doc) => sum + doc.questions_asked,
                              0
                            ) || 0,
                        },
                        {
                          name: "Notebook Questions",
                          value:
                            userNotebookStats?.documents?.reduce(
                              (sum, doc) => sum + doc.questions_asked,
                              0
                            ) || 0,
                        },
                        {
                          name: "Short Responses",
                          value:
                            userNotebookStats?.documents?.reduce(
                              (sum, doc) => sum + doc.short_responses,
                              0
                            ) || 0,
                        },
                        {
                          name: "Comprehensive Responses",
                          value:
                            userNotebookStats?.documents?.reduce(
                              (sum, doc) => sum + doc.comprehensive_responses,
                              0
                            ) || 0,
                        },
                      ].filter((item) => item.value > 0);

                      return (
                        <div
                          key={user.id}
                          className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg border border-[#e3d5c8] dark:border-gray-700/50 hover:shadow-md transition-all"
                        >
                          {/* Header - Always Visible */}
                          <div className="p-6 border-b border-[#e3d5c8] dark:border-gray-700/50">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-4">
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

                              <div className="flex items-center space-x-2">
                                {/* Action Buttons */}
                                <button
                                  className="p-3 text-[#5e4636] hover:text-[#a55233] dark:text-blue-400 dark:hover:text-emerald-300 hover:bg-[#a55233]/10 dark:hover:bg-emerald-500/20 rounded-lg transition-all"
                                  onClick={() => handleOpenEditModal(user)}
                                  title="Edit API Tokens"
                                >
                                  <FaKey size={18} />
                                </button>
                                <button
                                  className="p-3 text-[#ff4a4a] hover:text-[#e60000] dark:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                  onClick={() =>
                                    handleDeleteUser(user.id, user.username)
                                  }
                                  title="Delete User"
                                  disabled={user.username === "admin"}
                                >
                                  <FaUserMinus size={18} />
                                </button>

                                {/* Collapse Toggle Button */}
                                <button
                                  onClick={() => toggleUserCollapse(user.id)}
                                  className="p-3 text-[#5e4636] hover:text-[#a55233] dark:text-blue-400 dark:hover:text-emerald-300 hover:bg-[#a55233]/10 dark:hover:bg-emerald-500/20 rounded-lg transition-all"
                                  title={
                                    collapsedUsers.has(user.id)
                                      ? "Expand Details"
                                      : "Collapse Details"
                                  }
                                >
                                  {collapsedUsers.has(user.id) ? (
                                    <FaChevronDown className="w-3 h-3 transition-transform duration-200" />
                                  ) : (
                                    <FaChevronUp className="w-3 h-3 transition-transform duration-200" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Content */}
                          {!collapsedUsers.has(user.id) && (
                            <div className="p-6">
                              {/* Individual User Activity Chart */}
                              {userChartData.length > 0 && (
                                <div className="mb-6">
                                  <h5 className="text-sm font-semibold text-[#556052] dark:text-gray-300 mb-3">
                                    Activity Overview
                                  </h5>
                                  <div className="h-32 bg-white/60 dark:bg-black/20 rounded-lg p-3">
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <LineChart data={userChartData}>
                                        <XAxis dataKey="name" hide />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                          type="monotone"
                                          dataKey="value"
                                          stroke="#a55233"
                                          strokeWidth={2}
                                          dot={{
                                            fill: "#a55233",
                                            strokeWidth: 2,
                                            r: 4,
                                          }}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
                                <div className="space-y-3">
                                  <p className="text-sm font-bold text-[#556052] dark:text-blue-400 uppercase tracking-wide">
                                    API Tokens
                                  </p>
                                  <div className="text-sm space-y-2">
                                    <div className="flex justify-between">
                                      <span className="font-medium">
                                        Nebius:
                                      </span>
                                      <span className="text-[#5e4636] dark:text-gray-300">
                                        {user.api_tokens.nebius_token
                                          ? `${user.api_tokens.nebius_token.slice(
                                              0,
                                              30
                                            )}...`
                                          : "Not set"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">
                                        Gemini:
                                      </span>
                                      <span className="text-[#5e4636] dark:text-gray-300">
                                        {user.api_tokens.gemini_token
                                          ? `${user.api_tokens.gemini_token.slice(
                                              0,
                                              30
                                            )}...`
                                          : "Not set"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">
                                        Llama:
                                      </span>
                                      <span className="text-[#5e4636] dark:text-gray-300">
                                        {user.api_tokens.llama_token
                                          ? `${user.api_tokens.llama_token.slice(
                                              0,
                                              30
                                            )}...`
                                          : "Not set"}
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
                                          const totalModules =
                                            availableModules.length;
                                          const disabledModules =
                                            user.disabled_modules || {};
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
                                  <p className="text-sm font-bold text-[#556052] dark:text-yellow-400 uppercase tracking-wide">
                                    Token Usage
                                  </p>
                                  <div className="text-sm">
                                    <div className="bg-[#e9dcc9] dark:bg-gray-700/50 rounded-lg p-3">
                                      {user.token_limit !== null &&
                                      user.token_limit !== undefined ? (
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="font-medium">
                                              Used:
                                            </span>
                                            <span className="text-[#5e4636] dark:text-gray-300">
                                              {userNotebookStats?.total_tokens_used ??
                                                0}{" "}
                                              / {user.token_limit}
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                              className={`h-2 rounded-full transition-all ${
                                                (user.tokens_used || 0) /
                                                  user.token_limit >
                                                0.8
                                                  ? "bg-red-500"
                                                  : (user.tokens_used || 0) /
                                                      user.token_limit >
                                                    0.6
                                                  ? "bg-yellow-500"
                                                  : "bg-green-500"
                                              }`}
                                              style={{
                                                width: `${Math.min(
                                                  ((userNotebookStats?.total_tokens_used ??
                                                    0) /
                                                    user.token_limit) *
                                                    100,
                                                  100
                                                )}%`,
                                              }}
                                            ></div>
                                          </div>
                                          <div className="text-xs text-center">
                                            {(
                                              ((userNotebookStats?.total_tokens_used ??
                                                0) /
                                                user.token_limit) *
                                              100
                                            ).toFixed(1)}
                                            % used
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-[#5e4636] dark:text-gray-300 font-medium">
                                          Unlimited tokens
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Page Usage Section */}
                                <div className="space-y-3">
                                  <p className="text-sm font-bold text-[#556052] dark:text-cyan-400 uppercase tracking-wide">
                                    Page Usage
                                  </p>
                                  <div className="text-sm">
                                    <div className="bg-[#e9dcc9] dark:bg-gray-700/50 rounded-lg p-3">
                                      {user.api_tokens.page_limit !== null &&
                                      user.api_tokens.page_limit !==
                                        undefined ? (
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="font-medium">
                                              Used:
                                            </span>
                                            <span className="text-[#5e4636] dark:text-gray-300">
                                              {userNotebookStats?.total_pages_processed ??
                                                0}{" "}
                                              / {user.api_tokens.page_limit}
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                              className={`h-2 rounded-full transition-all ${
                                                (user.pages_used || 0) /
                                                  user.api_tokens.page_limit >
                                                0.8
                                                  ? "bg-red-500"
                                                  : (user.pages_used || 0) /
                                                      user.api_tokens
                                                        .page_limit >
                                                    0.6
                                                  ? "bg-yellow-500"
                                                  : "bg-green-500"
                                              }`}
                                              style={{
                                                width: `${Math.min(
                                                  ((userNotebookStats?.total_pages_processed ??
                                                    0) /
                                                    user.api_tokens
                                                      .page_limit) *
                                                    100,
                                                  100
                                                )}%`,
                                              }}
                                            ></div>
                                          </div>
                                          <div className="text-xs text-center">
                                            {(
                                              ((userNotebookStats?.total_pages_processed ??
                                                0) /
                                                user.api_tokens.page_limit) *
                                              100
                                            ).toFixed(1)}
                                            % used
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-[#5e4636] dark:text-gray-300 font-medium">
                                          Unlimited pages
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Upload Status as separate row */}
                              <div className="mt-4">
                                <div className="space-y-3">
                                  <p className="text-sm font-bold text-[#556052] dark:text-green-400 uppercase tracking-wide">
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

                              {/* Show question stats if available */}
                              {(userStats.length > 0 ||
                                notebookUserStats.length > 0) && (
                                <div className="mt-6 space-y-4">
                                  {/* Notebook Stats */}
                                  {notebookUserStats.length > 0 &&
                                    (() => {
                                      const userNotebookStats =
                                        notebookUserStats.find(
                                          (u) => u.user_id === user.id
                                        );
                                      const totalNotebookDocs =
                                        userNotebookStats?.document_upload_count ||
                                        0;
                                      const totalNotebookQuestions =
                                        userNotebookStats?.documents?.reduce(
                                          (sum, doc) =>
                                            sum + doc.questions_asked,
                                          0
                                        ) || 0;
                                      const totalNotebookShort =
                                        userNotebookStats?.documents?.reduce(
                                          (sum, doc) =>
                                            sum + doc.short_responses,
                                          0
                                        ) || 0;
                                      const totalNotebookComprehensive =
                                        userNotebookStats?.documents?.reduce(
                                          (sum, doc) =>
                                            sum + doc.comprehensive_responses,
                                          0
                                        ) || 0;

                                      // Add the new fields
                                      const totalTokensUsed =
                                        userNotebookStats?.total_tokens_used ||
                                        0;
                                      const totalInputTokens =
                                        userNotebookStats?.total_input_tokens ||
                                        0;
                                      const totalOutputTokens =
                                        userNotebookStats?.total_output_tokens ||
                                        0;
                                      const totalPagesProcessed =
                                        userNotebookStats?.total_pages_processed ||
                                        0;

                                      const notebookDocuments =
                                        userNotebookStats?.documents || [];
                                      const [
                                        showNotebookDetails,
                                        setShowNotebookDetails,
                                      ] = useState(false);

                                      return (
                                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/30">
                                          <div className="flex items-center justify-between mb-3">
                                            <h5 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center">
                                              <svg
                                                className="w-4 h-4 mr-2"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                              >
                                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                <path
                                                  fillRule="evenodd"
                                                  d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                                  clipRule="evenodd"
                                                />
                                              </svg>
                                              Notebook Statistics
                                            </h5>
                                            <div className="flex items-center space-x-4">
                                              <div className="grid grid-cols-4 gap-3">
                                                <div className="text-center">
                                                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                                    {totalNotebookDocs}
                                                  </div>
                                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    Documents
                                                  </div>
                                                </div>
                                                <div className="text-center">
                                                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                                    {totalNotebookShort}
                                                  </div>
                                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    Short
                                                  </div>
                                                </div>
                                                <div className="text-center">
                                                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                                    {totalNotebookComprehensive}
                                                  </div>
                                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    Comprehensive
                                                  </div>
                                                </div>
                                                <div className="text-center">
                                                  <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                                    {totalPagesProcessed}
                                                  </div>
                                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    Pages
                                                  </div>
                                                </div>
                                              </div>
                                              {/* Second row for token stats */}
                                              <div className="grid grid-cols-3 gap-3">
                                                <div className="text-center">
                                                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                                    {totalTokensUsed.toLocaleString()}
                                                  </div>
                                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    Total Tokens
                                                  </div>
                                                </div>
                                                <div className="text-center">
                                                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                                    {totalInputTokens.toLocaleString()}
                                                  </div>
                                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    Input Tokens
                                                  </div>
                                                </div>
                                                <div className="text-center">
                                                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                                    {totalOutputTokens.toLocaleString()}
                                                  </div>
                                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    Output Tokens
                                                  </div>
                                                </div>
                                              </div>
                                              {notebookDocuments.length > 0 && (
                                                <button
                                                  onClick={() =>
                                                    setShowNotebookDetails(
                                                      !showNotebookDetails
                                                    )
                                                  }
                                                  className="px-3 py-1.5 text-xs bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-800/30 dark:hover:bg-emerald-700/30 text-emerald-700 dark:text-emerald-300 rounded-lg transition-all flex items-center"
                                                >
                                                  {showNotebookDetails
                                                    ? "Hide Details"
                                                    : "View Details"}
                                                  <svg
                                                    className={`w-3 h-3 ml-1 transition-transform ${
                                                      showNotebookDetails
                                                        ? "rotate-180"
                                                        : ""
                                                    }`}
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                  >
                                                    <path
                                                      fillRule="evenodd"
                                                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                      clipRule="evenodd"
                                                    />
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          {notebookDocuments.length > 0 &&
                                            showNotebookDetails && (
                                              <div className="space-y-2 border-t border-emerald-200 dark:border-emerald-700/30 pt-3">
                                                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
                                                  Document Activity:
                                                </div>
                                                <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                                                  {notebookDocuments.map(
                                                    (doc) => (
                                                      <div
                                                        key={doc.document_id}
                                                        className="flex items-center justify-between bg-white/60 dark:bg-black/20 rounded px-2 py-1.5"
                                                      >
                                                        <span
                                                          className="text-xs text-emerald-800 dark:text-emerald-200 truncate flex-1 mr-2"
                                                          title={doc.filename}
                                                        >
                                                          {doc.filename.length >
                                                          25
                                                            ? `${doc.filename.substring(
                                                                0,
                                                                25
                                                              )}...`
                                                            : doc.filename}
                                                        </span>
                                                        <span className="text-xs font-mono bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                                                          {doc.questions_asked}Q
                                                        </span>
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      );
                                    })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  };

  const FirstActivitySection = () => {
    const [firstActivities, setFirstActivities] = useState({
      firstProject: null,
      firstNotebookQuestion: null,
      firstIdeaGeneration: null,
    });

    const [showAllActivities, setShowAllActivities] = useState(false);
    const [allActivities, setAllActivities] = useState([]);
    const [filteredActivities, setFilteredActivities] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest"); // "newest" or "oldest"

    useEffect(() => {
      const fetchAllActivities = async () => {
        try {
          const response = await adminService.getAllActivities();
          const sortedActivities = response.activities.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp) // Default to newest first
          );
          setAllActivities(sortedActivities);
          setFilteredActivities(sortedActivities);
        } catch (error) {
          console.error("Error fetching all activities:", error);
        }
      };

      if (showAllActivities) {
        fetchAllActivities();
      }
    }, [showAllActivities]);

    const formatDateTime = (timestamp) => {
      if (!timestamp) return "N/A";
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(date);
    };

    useEffect(() => {
      const fetchFirstActivities = async () => {
        try {
          const response = await adminService.getFirstActivities();

          setFirstActivities({
            firstProject: response.first_project,
            firstNotebookQuestion: response.first_question,
            firstIdeaGeneration: response.first_idea,
          });
        } catch (error) {
          console.error("Error fetching activity data:", error);
        }
      };

      fetchFirstActivities();
    }, []);

    // Sort activities based on selected order
    const handleSortChange = (order) => {
      setSortOrder(order);
      const sorted = [...filteredActivities].sort((a, b) => {
        if (order === "newest") {
          return new Date(b.timestamp) - new Date(a.timestamp);
        } else {
          return new Date(a.timestamp) - new Date(b.timestamp);
        }
      });
      setFilteredActivities(sorted);
    };

    // Filter activities based on selected filter
    const handleFilterChange = (filterType) => {
      setActiveFilter(filterType);

      let filtered = [];
      if (filterType === "all") {
        filtered = [...allActivities];
      } else {
        filtered = allActivities.filter((activity) => {
          switch (filterType) {
            case "projects":
              return activity.type === "Project Creation";
            case "questions":
              return activity.type === "Notebook Question";
            case "ideas":
              return activity.type === "Idea Generation";
            default:
              return true;
          }
        });
      }

      // Apply current sort order to filtered results
      const sorted = filtered.sort((a, b) => {
        if (sortOrder === "newest") {
          return new Date(b.timestamp) - new Date(a.timestamp);
        } else {
          return new Date(a.timestamp) - new Date(b.timestamp);
        }
      });

      setFilteredActivities(sorted);
    };

    // Excel export function
    const exportToExcel = () => {
      try {
        // Create a new workbook
        const workbook = XLSX.utils.book_new();

        // Helper function to prepare data for Excel
        const prepareDataForExcel = (activities) => {
          return activities.map((activity, index) => ({
            "Sr. No.": index + 1,
            Username: activity.username,
            "Activity Type": activity.type,
            Details: activity.details,
            "Date & Time": formatDateTime(activity.timestamp),
            Timestamp: activity.timestamp,
          }));
        };

        // Filter activities by type
        const projectActivities = allActivities.filter(
          (a) => a.type === "Project Creation"
        );
        const notebookActivities = allActivities.filter(
          (a) => a.type === "Notebook Question"
        );
        const ideaActivities = allActivities.filter(
          (a) => a.type === "Idea Generation"
        );

        // Create worksheets for each activity type
        const projectsData = prepareDataForExcel(projectActivities);
        const notebooksData = prepareDataForExcel(notebookActivities);
        const ideasData = prepareDataForExcel(ideaActivities);

        // Add summary sheet
        const summaryData = [
          { "Activity Type": "Projects", Count: projectActivities.length },
          {
            "Activity Type": "Notebook Questions",
            Count: notebookActivities.length,
          },
          { "Activity Type": "Idea Generation", Count: ideaActivities.length },
          { "Activity Type": "Total Activities", Count: allActivities.length },
        ];

        // Create worksheets
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
        const notebooksSheet = XLSX.utils.json_to_sheet(notebooksData);
        const ideasSheet = XLSX.utils.json_to_sheet(ideasData);

        // Add sheets to workbook
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
        XLSX.utils.book_append_sheet(workbook, projectsSheet, "Projects");
        XLSX.utils.book_append_sheet(workbook, notebooksSheet, "Notebooks");
        XLSX.utils.book_append_sheet(workbook, ideasSheet, "Ideas");

        // Set column widths for better readability
        const setColumnWidths = (sheet) => {
          const cols = [
            { wch: 5 }, // #
            { wch: 15 }, // Username
            { wch: 20 }, // Activity Type
            { wch: 40 }, // Details
            { wch: 25 }, // Date & Time
            { wch: 20 }, // Timestamp
          ];
          sheet["!cols"] = cols;
        };

        setColumnWidths(projectsSheet);
        setColumnWidths(notebooksSheet);
        setColumnWidths(ideasSheet);

        // Summary sheet column widths
        summarySheet["!cols"] = [
          { wch: 25 }, // Activity Type
          { wch: 10 }, // Count
        ];

        // Generate filename with current date
        const currentDate = new Date().toISOString().split("T")[0];
        const filename = `Activity_Report_${currentDate}.xlsx`;

        // Write and download the file
        XLSX.writeFile(workbook, filename);

        // Show success message (you can replace this with your preferred notification system)
        alert(`Excel file "${filename}" has been downloaded successfully!`);
      } catch (error) {
        console.error("Error exporting to Excel:", error);
        alert("There was an error exporting the data. Please try again.");
      }
    };

    // Get filter button style
    const getFilterButtonStyle = (filterType) => {
      const baseStyle =
        "px-3 py-2 rounded-lg text-sm font-medium transition-all";
      const activeStyle = "bg-[#a55233] text-white";
      const inactiveStyle =
        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";

      return `${baseStyle} ${
        activeFilter === filterType ? activeStyle : inactiveStyle
      }`;
    };

    // Get sort button style
    const getSortButtonStyle = (order) => {
      const baseStyle =
        "px-3 py-2 rounded-lg text-sm font-medium transition-all";
      const activeStyle = "bg-blue-600 text-white";
      const inactiveStyle =
        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";

      return `${baseStyle} ${
        sortOrder === order ? activeStyle : inactiveStyle
      }`;
    };

    return (
      <div className="bg-white/80 dark:bg-black/50 rounded-xl shadow-lg border border-[#e8ddcc] dark:border-emerald-900/50 overflow-hidden mb-8">
        <div className="p-6 bg-gradient-to-r from-[#e9dcc9] to-[#f5e6d8] dark:from-black/70 dark:to-emerald-900/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#a55233]/20 dark:bg-emerald-600/20">
              <FaMedal
                className="text-[#a55233] dark:text-emerald-400"
                size={20}
              />
            </div>
            <h3 className="text-lg font-semibold text-[#0a3b25] dark:text-emerald-400">
              First Activities
            </h3>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* First Project Card */}
          <div className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg p-4 border border-[#e3d5c8]">
            <div className="flex items-center mb-3">
              <FaProjectDiagram className="text-[#a55233] mr-2" />
              <h4 className="font-semibold">First Project</h4>
            </div>
            {firstActivities.firstProject ? (
              <>
                <p className="text-sm">
                  Created by: {firstActivities.firstProject.username}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDateTime(firstActivities.firstProject.timestamp)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No projects created yet</p>
            )}
          </div>

          {/* First Notebook Question Card */}
          <div className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg p-4 border border-[#e3d5c8]">
            <div className="flex items-center mb-3">
              <FaQuestion className="text-[#a55233] mr-2" />
              <h4 className="font-semibold">First Notebook Question</h4>
            </div>
            {firstActivities.firstNotebookQuestion ? (
              <>
                <p className="text-sm">
                  Asked by: {firstActivities.firstNotebookQuestion.username}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDateTime(
                    firstActivities.firstNotebookQuestion.timestamp
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No questions asked yet</p>
            )}
          </div>

          {/* First Idea Generation Card */}
          <div className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg p-4 border border-[#e3d5c8]">
            <div className="flex items-center mb-3">
              <FaLightbulb className="text-[#a55233] mr-2" />
              <h4 className="font-semibold">First Idea Generation</h4>
            </div>
            {firstActivities.firstIdeaGeneration ? (
              <>
                <p className="text-sm">
                  Created by: {firstActivities.firstIdeaGeneration.username}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDateTime(
                    firstActivities.firstIdeaGeneration.timestamp
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">No ideas generated yet</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end px-6 pb-6">
          <button
            onClick={() => setShowAllActivities(true)}
            className="flex items-center px-4 py-2 bg-[#a55233] hover:bg-[#8b4513] text-white rounded-lg transition-all"
          >
            <FaEye className="mr-2" /> View All Activities
          </button>
        </div>

        {/* Enhanced Activities Modal */}
        {showAllActivities && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm"
              onClick={() => setShowAllActivities(false)}
            />

            <div className="relative min-h-screen flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[85vh] overflow-hidden shadow-xl">
                {/* Modal Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <div className="flex justify-between items-center p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                      <FaMedal className="mr-2" /> Activity Timeline
                    </h2>
                    <div className="flex items-center space-x-3">
                      {/* Excel Export Button */}
                      <button
                        onClick={exportToExcel}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all text-sm"
                        title="Export to Excel"
                      >
                        <FaDownload className="mr-2" size={14} />
                        Export to Excel
                      </button>
                      <button
                        onClick={() => setShowAllActivities(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <FaTimes size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Filter and Sort Controls */}
                  <div className="px-6 pb-4 space-y-3">
                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleFilterChange("all")}
                        className={getFilterButtonStyle("all")}
                      >
                        All Activities ({allActivities.length})
                      </button>
                      <button
                        onClick={() => handleFilterChange("projects")}
                        className={getFilterButtonStyle("projects")}
                      >
                        <FaProjectDiagram className="inline mr-1" size={12} />
                        Projects (
                        {
                          allActivities.filter(
                            (a) => a.type === "Project Creation"
                          ).length
                        }
                        )
                      </button>
                      <button
                        onClick={() => handleFilterChange("questions")}
                        className={getFilterButtonStyle("questions")}
                      >
                        <FaQuestion className="inline mr-1" size={12} />
                        Notebook (
                        {
                          allActivities.filter(
                            (a) => a.type === "Notebook Question"
                          ).length
                        }
                        )
                      </button>
                      <button
                        onClick={() => handleFilterChange("ideas")}
                        className={getFilterButtonStyle("ideas")}
                      >
                        <FaLightbulb className="inline mr-1" size={12} />
                        Ideas (
                        {
                          allActivities.filter(
                            (a) => a.type === "Idea Generation"
                          ).length
                        }
                        )
                      </button>
                    </div>

                    {/* Sort Controls */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Sort by:
                      </span>
                      <button
                        onClick={() => handleSortChange("newest")}
                        className={getSortButtonStyle("newest")}
                      >
                        <FaSortAmountDown className="inline mr-1" size={12} />
                        Newest First
                      </button>
                      <button
                        onClick={() => handleSortChange("oldest")}
                        className={getSortButtonStyle("oldest")}
                      >
                        <FaSortAmountUp className="inline mr-1" size={12} />
                        Oldest First
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table Container with Proper Fixed Header */}
                <div className="relative max-h-[calc(85vh-200px)]">
                  {/* Fixed Table Header */}
                  <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
                    <div className="overflow-hidden">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-64"
                            >
                              User
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48"
                            >
                              Activity Type
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-1"
                            >
                              Details
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-52"
                            >
                              Date & Time
                            </th>
                          </tr>
                        </thead>
                      </table>
                    </div>
                  </div>

                  {/* Scrollable Table Body */}
                  <div className="overflow-auto max-h-[calc(85vh-260px)]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredActivities.map((activity, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-900/50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap w-64">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#a55233] to-[#556052] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {activity.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {activity.username}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap w-48">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              activity.type === "Project Creation"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : activity.type === "Notebook Question"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                            }`}
                              >
                                {activity.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex-1">
                              <p
                                className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate"
                                title={activity.details}
                              >
                                {activity.details}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 w-52">
                              {formatDateTime(activity.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredActivities.length === 0 && (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <div className="text-4xl mb-4">📋</div>
                        <p className="text-lg font-medium mb-2">
                          No activities found
                        </p>
                        <p className="text-sm">
                          {activeFilter === "all"
                            ? "There are no activities to display"
                            : `No ${activeFilter} activities found`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Results Summary */}
                {filteredActivities.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-gray-900">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {filteredActivities.length} of{" "}
                      {allActivities.length} activities
                      {activeFilter !== "all" &&
                        ` (filtered by ${activeFilter})`}
                      {` • Sorted by ${
                        sortOrder === "newest" ? "newest first" : "oldest first"
                      }`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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

  const CategoryManagementSection = () => {
    const [expandedUsers, setExpandedUsers] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState("");

    // Group categories by username and separate global categories
    const { globalCategories, userCategories } = useMemo(() => {
      const global = categories.filter((cat) => cat.is_global);
      const user = categories.filter((cat) => !cat.is_global);

      const grouped = user.reduce((acc, category) => {
        const username = category.username;
        if (!acc[username]) {
          acc[username] = [];
        }
        acc[username].push(category);
        return acc;
      }, {});

      return { globalCategories: global, userCategories: grouped };
    }, [categories]);

    // Filter users based on search term
    const filteredUsers = useMemo(() => {
      if (!searchTerm) return Object.entries(userCategories);

      return Object.entries(userCategories).filter(
        ([username, cats]) =>
          username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cats.some((cat) =>
            cat.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }, [userCategories, searchTerm]);

    const toggleUserExpansion = (username) => {
      const newExpanded = new Set(expandedUsers);
      if (newExpanded.has(username)) {
        newExpanded.delete(username);
      } else {
        newExpanded.add(username);
      }
      setExpandedUsers(newExpanded);
    };

    const expandAll = () => {
      setExpandedUsers(new Set(Object.keys(userCategories)));
    };

    const collapseAll = () => {
      setExpandedUsers(new Set());
    };

    return (
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <p className="text-[#5e4636] dark:text-gray-300">
                Organize and manage content categories
              </p>

              {/* Search and Controls */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <FaSearch
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#5e4636] dark:text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Search users or categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-[#e3d5c8] dark:border-gray-700 rounded-lg bg-white/60 dark:bg-gray-800/60 text-[#0a3b25] dark:text-gray-200 placeholder-[#5e4636] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#a55233] dark:focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={expandAll}
                    className="px-3 py-2 text-xs bg-[#a55233]/10 hover:bg-[#a55233]/20 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-[#a55233] dark:text-emerald-400 rounded-lg transition-all"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-3 py-2 text-xs bg-gray-200/60 hover:bg-gray-300/60 dark:bg-gray-700/60 dark:hover:bg-gray-600/60 text-[#5e4636] dark:text-gray-300 rounded-lg transition-all"
                  >
                    Collapse All
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#a55233] dark:border-emerald-400"></div>
                <span className="ml-3 text-[#5e4636] dark:text-emerald-300">
                  Loading categories...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Global Categories Section */}
                {globalCategories.length > 0 && (
                  <div className="bg-gradient-to-r from-[#f9f4ef] to-[#f5e6d8] dark:from-gray-800/70 dark:to-gray-700/50 rounded-xl p-5 border-2 border-[#a55233]/30 dark:border-emerald-500/30 shadow-md">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#a55233] to-[#8b4513] dark:from-emerald-500 dark:to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <FaGlobe className="text-white" size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#0a3b25] dark:text-emerald-400 text-lg flex items-center">
                          Global Categories
                          <span className="ml-2 px-2 py-1 bg-[#a55233]/20 dark:bg-emerald-500/20 text-[#a55233] dark:text-emerald-400 text-xs rounded-full">
                            {globalCategories.length}
                          </span>
                        </h4>
                        <p className="text-sm text-[#5a544a] dark:text-gray-400">
                          Available to all users
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {globalCategories.map((category) => (
                        <div
                          key={category.id}
                          className="bg-white/80 dark:bg-gray-900/60 rounded-lg p-4 border border-[#e8ddcc] dark:border-gray-600/40 hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#a55233] to-[#8b4513] dark:from-emerald-500 dark:to-blue-500 rounded-lg flex items-center justify-center">
                                  <FaTags className="text-white" size={12} />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-[#0a3b25] dark:text-emerald-400 text-sm">
                                    {category.name}
                                  </h5>
                                  <p className="text-xs text-[#5a544a] dark:text-gray-500">
                                    {new Date(
                                      category.created_at
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-1">
                              <button
                                className="p-1.5 text-[#5e4636] hover:text-[#a55233] dark:text-blue-400 dark:hover:text-emerald-300 hover:bg-[#a55233]/10 dark:hover:bg-emerald-500/20 rounded-md transition-all"
                                onClick={() =>
                                  handleOpenEditCategoryModal(category)
                                }
                                title="Edit Category"
                              >
                                <FaEdit size={12} />
                              </button>
                              <button
                                className="p-1.5 text-[#ff4a4a] hover:text-[#e60000] dark:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
                                onClick={() =>
                                  handleDeleteCategory(
                                    category.id,
                                    category.name
                                  )
                                }
                                title="Delete Category"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Categories Section */}
                <div className="space-y-3">
                  {filteredUsers.length === 0 && searchTerm ? (
                    <div className="text-center py-8 text-[#5e4636] dark:text-gray-400">
                      <FaSearch className="mx-auto mb-3 text-3xl opacity-50" />
                      <p>No categories found matching "{searchTerm}"</p>
                    </div>
                  ) : (
                    filteredUsers.map(([username, userCats]) => {
                      const isExpanded = expandedUsers.has(username);

                      return (
                        <div
                          key={username}
                          className="bg-[#f9f4ef] dark:bg-gray-800/50 rounded-lg border border-[#e3d5c8] dark:border-gray-700/50 overflow-hidden transition-all duration-200 hover:shadow-md"
                        >
                          {/* Collapsible User Header */}
                          <button
                            onClick={() => toggleUserExpansion(username)}
                            className="w-full flex items-center justify-between p-4 hover:bg-[#f5e6d8] dark:hover:bg-gray-700/50 transition-all"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#a55233] to-[#556052] dark:from-purple-500 dark:to-pink-500 rounded-full flex items-center justify-center">
                                <FaUser className="text-white" size={16} />
                              </div>
                              <div className="text-left">
                                <h4 className="font-semibold text-[#0a3b25] dark:text-emerald-400">
                                  {username}
                                </h4>
                                <p className="text-sm text-[#5a544a] dark:text-gray-400">
                                  {userCats.length}{" "}
                                  {userCats.length === 1
                                    ? "category"
                                    : "categories"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-[#a55233]/10 dark:bg-emerald-500/20 text-[#a55233] dark:text-emerald-400 text-xs rounded-full">
                                {userCats.length}
                              </span>
                              {isExpanded ? (
                                <FaChevronUp
                                  className="text-[#5e4636] dark:text-gray-400"
                                  size={14}
                                />
                              ) : (
                                <FaChevronDown
                                  className="text-[#5e4636] dark:text-gray-400"
                                  size={14}
                                />
                              )}
                            </div>
                          </button>

                          {/* Expandable Categories */}
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-[#e3d5c8] dark:border-gray-700/50">
                              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
                                {userCats.map((category) => (
                                  <div
                                    key={category.id}
                                    className="bg-white/60 dark:bg-gray-900/40 rounded-lg p-3 border border-[#e8ddcc] dark:border-gray-600/30 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <div className="w-7 h-7 bg-gradient-to-br from-[#a55233] to-[#556052] dark:from-blue-500 dark:to-emerald-500 rounded-md flex items-center justify-center">
                                            <FaTags
                                              className="text-white"
                                              size={10}
                                            />
                                          </div>
                                          <div>
                                            <h5 className="font-medium text-[#0a3b25] dark:text-emerald-400 text-sm">
                                              {category.name}
                                            </h5>
                                            <p className="text-xs text-[#5a544a] dark:text-gray-500">
                                              {new Date(
                                                category.created_at
                                              ).toLocaleDateString()}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex space-x-1">
                                        <button
                                          className="p-1 text-[#5e4636] hover:text-[#a55233] dark:text-blue-400 dark:hover:text-emerald-300 hover:bg-[#a55233]/10 dark:hover:bg-emerald-500/20 rounded transition-all"
                                          onClick={() =>
                                            handleOpenEditCategoryModal(
                                              category
                                            )
                                          }
                                          title="Edit Category"
                                        >
                                          <FaEdit size={11} />
                                        </button>
                                        <button
                                          className="p-1 text-[#ff4a4a] hover:text-[#e60000] dark:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                          onClick={() =>
                                            handleDeleteCategory(
                                              category.id,
                                              category.name
                                            )
                                          }
                                          title="Delete Category"
                                        >
                                          <FaTrash size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
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
                <FirstActivitySection />
                <IdeaGenStatsSection />
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#5e4636] dark:text-emerald-300 mb-1">
                    Token Allocation Limit
                  </label>
                  <input
                    type="number"
                    name="token_limit"
                    value={formData.token_limit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter token limit (leave empty for unlimited)"
                  />
                  <p className="text-xs text-[#8c715f] dark:text-gray-400 mt-1">
                    Set maximum tokens this user can consume. Leave empty for
                    unlimited.
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Limit
                  </label>
                  <input
                    type="number"
                    name="page_limit"
                    value={formData.page_limit}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Leave empty for unlimited pages"
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
        {/* Global Token Limit Modal */}
        {isGlobalTokenLimitModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Set Global Token Limit
                </h3>
                <button
                  onClick={() => setIsGlobalTokenLimitModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={handleSetGlobalTokenLimit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token Limit for All Users
                  </label>
                  <input
                    type="number"
                    value={globalTokenLimitValue}
                    onChange={(e) => setGlobalTokenLimitValue(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter token limit (e.g., 20)"
                    min="1"
                    required
                  />
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Warning
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          This will override the current token limit for{" "}
                          <strong>ALL {users.length} users</strong>. Individual
                          custom limits will be replaced with this global value.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsGlobalTokenLimitModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" size={14} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaGlobe className="mr-2" size={14} />
                        Set for All Users
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Page Limit Modal */}
        {isGlobalPageLimitModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Set Global Page Limit
                </h3>
                <button
                  onClick={() => setIsGlobalPageLimitModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={handleSetGlobalPageLimit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Page Limit for All Users
                  </label>
                  <input
                    type="number"
                    value={globalPageLimitValue}
                    onChange={(e) => setGlobalPageLimitValue(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter page limit (e.g., 100)"
                    min="1"
                    required
                  />
                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          Warning
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          This will override the current page limit for{" "}
                          <strong>ALL {users.length} users</strong>. Individual
                          custom page limits will be replaced with this global
                          value.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsGlobalPageLimitModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" size={14} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaFileUpload className="mr-2" size={14} />
                        Set for All Users
                      </>
                    )}
                  </button>
                </div>
              </form>
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
                {/* <div className="mb-4">
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
                </div> */}
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

        /* Custom thin scrollbar styles */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}
 
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
 
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
 
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}
 
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
 
/* Dark mode scrollbar */
.dark .custom-scrollbar {
  scrollbar-color: rgba(75, 85, 99, 0.6) transparent;
}
 
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.6);
}
 
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(75, 85, 99, 0.8);
}
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
