/* eslint-disable react/prop-types */
import { useRef, useState, useEffect, useCallback } from "react";
// import { Tooltip } from "react-tooltip";
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Calendar,
  Camera,
  Upload,
  X,
  Settings,
  LogOut,
  BarChart3,
  MessageSquare,
  FileText,
  File,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
// Import your navigation method - this example uses React Router,
// but adjust based on your app's setup
import { useNavigate } from "react-router-dom";

const ProfileDropdown = ({
  profileImage,
  username,
  userDetails,
  tokenLimit,
  pageLimit,
  isOpen,
  onProfileUpdate,
  onLogout,
  onUserDetailsUpdate
}) => {
  const navigate = useNavigate(); // Initialize the navigation hook
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUsageInfo, setShowUsageInfo] = useState(false);

  // Usage calculations
  const tokensUsed = userDetails.total_tokens_used ?? 0;
  const pagesUsed = userDetails.total_pages_processed ?? 0;

  // Function to refresh usage statistics - MOVED BEFORE useEffect
 const handleRefreshStats = useCallback(async () => {
  setIsRefreshing(true);
  console.log('Refreshing user stats...');

  try {
    const response = await axiosInstance.get("/user/profile/");

    if (response.data) {
      const updatedUserDetails = {
        email: response.data.email || "Not available",
        joinedDate: response.data.date_joined
          ? new Date(response.data.date_joined).toLocaleDateString()
          : "Not available",
        total_tokens_used: response.data.total_tokens_used || 0,
        total_input_tokens: response.data.total_input_tokens || 0,
        total_output_tokens: response.data.total_output_tokens || 0,
        total_questions_asked: response.data.total_questions_asked || 0,
        total_pages_processed: response.data.total_pages_processed || 0,
        total_documents_uploaded: response.data.total_documents_uploaded || 0,
        // Use limits from the user profile response directly, not from admin endpoint
        token_limit: response.data.token_limit || tokenLimit || null,
        page_limit: response.data.page_limit || pageLimit || null,
      };

      // Call the callback function to update user details in the parent component
      if (onUserDetailsUpdate) {
        onUserDetailsUpdate(updatedUserDetails);
      }
    }
  } catch (error) {
    console.error("Error refreshing usage statistics:", error);
    toast.error("Failed to refresh usage statistics");
  } finally {
    setIsRefreshing(false);
  }
}, [onUserDetailsUpdate, tokenLimit, pageLimit]); // Remove admin-dependent logic
  useEffect(() => {
    // Auto-refresh stats when a query is made
    const handleQueryComplete = () => {
      console.log('Query complete event received, refreshing stats...');
      // Add a small delay to ensure backend has processed the request
      setTimeout(() => {
        handleRefreshStats();
      }, 1000);
    };

    // Listen for query completion events
    document.addEventListener('queryComplete', handleQueryComplete);
    document.addEventListener('messageComplete', handleQueryComplete);
    document.addEventListener('chatResponse', handleQueryComplete);

    return () => {
      document.removeEventListener('queryComplete', handleQueryComplete);
      document.removeEventListener('messageComplete', handleQueryComplete);
      document.removeEventListener('chatResponse', handleQueryComplete);
    };
  }, [handleRefreshStats]); // Now handleRefreshStats is defined before this useEffect

  // Helper for percentage
  const getPercent = (used, limit) =>
    limit ? Math.min((used / limit) * 100, 100).toFixed(1) : '0';

  if (!isOpen) return null;

  // Using your original file handling code
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or GIF file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    try {
      setIsUploading(true);
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      const formData = new FormData();
      formData.append("profile_picture", file);

      const response = await axiosInstance.post("/user/profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.profile_picture) {
        // The backend now returns the full Azure blob URL
        const newProfilePictureUrl = response.data.profile_picture;

        onProfileUpdate(newProfilePictureUrl);
        localStorage.setItem("profile_image", newProfilePictureUrl);
        toast.success("Profile picture updated successfully");

        // Clear the preview since we have the new image
        setPreviewImage(null);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error(
        error.response?.data?.error || "Failed to update profile picture"
      );
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    }
  };

  const cancelPreview = () => {
    setPreviewImage(null);
    fileInputRef.current.value = "";
  };

  const handlePasswordFormClick = (e) => {
    e.stopPropagation();
  };

  // Function to navigate to the AdminPanel component
  const handleAdminPanelClick = () => {
    navigate("/admin"); // Change this path to match your application's routing path for the admin panel
  };

  // Helper function to format large numbers with decimal K/M system
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num?.toString() || "0";
  };

  // Helper function specifically for token display with better formatting
  const formatTokens = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num?.toLocaleString() || "0"; // Add comma separators for numbers under 1K
  };

  return (
    <div
      onClick={handlePasswordFormClick}
      className="fixed right-4 top-16 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-[#d6cbbf] dark:border-gray-700 p-4 space-y-3 overflow-hidden"
    >
      {/* Profile Header */}
      <div className="flex items-center space-x-3 pb-3 border-b border-[#e3d5c8] dark:border-gray-700">
        <div
          className="relative group cursor-pointer"
          onClick={handleImageClick}
        >
          <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#a55233] dark:ring-blue-500 ring-offset-2 ring-offset-[#faf4ee] dark:ring-offset-gray-900">
            <img
              src={previewImage || profileImage}
              alt="Profile"
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-5 h-5" />
            </div>
          </div>
          {previewImage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelPreview();
              }}
              className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1.5 shadow-lg hover:bg-red-700 transition-colors"
            >
              <X className="text-white w-3 h-3" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black">
              <Upload className="text-white w-5 h-5 animate-bounce" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[#0a3b25] dark:text-white text-base font-medium truncate">
            {username}
          </h3>
          <p className="text-[#5a544a] dark:text-gray-300 text-xs truncate">
            {userDetails.email}
          </p>
          <div className="flex items-center">
  <button
    onClick={handleImageClick}
    className="text-[#a55233] dark:text-blue-400 text-xs hover:text-[#8b4513] dark:hover:text-blue-300 transition-colors"
  >
    Change Picture
  </button>
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <button className="ml-1 mt-1 text-[#a55233] dark:text-blue-400 hover:text-[#8b4513] dark:hover:text-blue-300">
        <Info className="w-3 h-3" />
      </button>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content
        side="bottom"
        className="bg-[#fffbe6] dark:bg-[#101a2c] text-[#2d1e0f] dark:text-[#e3eafc] border-2 border-[#f7c873] dark:border-[#031130] rounded-lg shadow-lg p-2 text-xs z-[9999] max-w-[180px]"
      >
        <div className="space-y-1">
          <p>• Click profile picture to upload a new image</p>
          <p>• Maximum size: 2MB</p>
          <p>• Supported formats: JPG, PNG, GIF</p>
        </div>
        <Tooltip.Arrow className="fill-[#f7c873] dark:fill-[#2563eb]" />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</div>
        </div>
      </div>

      {/* User Details */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-[#5e4636] dark:text-gray-200 text-xs rounded-lg hover:bg-[#f5e6d8] dark:hover:bg-gray-800 transition-colors p-1">
          <Calendar className="w-3 h-3 text-[#a55233] dark:text-inherit" />
          <span>Joined: {userDetails.joinedDate}</span>
        </div>
      </div>

      {/* Token Usage Statistics */}
      <div className="pt-2 border-t border-[#e3d5c8] dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
    <h4 className="text-[#0a3b25] dark:text-white text-xs font-medium flex items-center">
  <BarChart3 className="w-3 h-3 mr-1 text-[#a55233] dark:text-blue-400" />
  Usage Statistics
  <Tooltip.Root>
  <Tooltip.Trigger asChild>
    <span
      className="ml-1 cursor-pointer"
      tabIndex={0}
      title="What do these mean?"
    >
      <Info className="w-3 h-3 text-blue-500 inline" />
    </span>
  </Tooltip.Trigger>
<Tooltip.Portal>
  <Tooltip.Content
    side="bottom"
    className={`
      bg-[#fffbe6] 
      dark:bg-[#101a2c]
      text-[#2d1e0f] 
      dark:text-[#e3eafc]
      border-2 
      border-[#f7c873] 
      dark:border-[#031130]
      rounded-2xl
      shadow-2xl
      p-3
      text-xs
      z-[9999]
      w-64
      flex flex-col justify-center items-start
      transition-colors
    `}
    style={{
      minWidth: "240px",
      maxWidth: "280px",
      minHeight: "100px",
      boxShadow: "0 8px 32px 0 rgba(247, 200, 115, 0.25)",
    }}
  >
    <div className="font-bold mb-1 text-sm tracking-wide">Usage Info</div>
    <div className="mb-1">
      <strong className="text-[#a55233] dark:text-[#60a5fa]">Token Usage:</strong>
      <span className="font-normal ml-1">
        Number of AI tokens you've consumed out of your allowed limit.
      </span>
    </div>
    <div className="mb-2">
      <strong className="text-[#a55233] dark:text-[#60a5fa]">Page Usage:</strong>
      <span className="font-normal ml-1">
        Number of document pages you've processed out of your allowed limit.
      </span>
    </div>
    <div>
      <strong className="text-[#a55233] dark:text-[#60a5fa]">Limits:</strong>
      <span className="font-normal ml-1">
        If you reach your limit, you may need to request more or wait for reset.
      </span>
    </div>
    <Tooltip.Arrow className="fill-[#f7c873] dark:fill-[#2563eb]" />
  </Tooltip.Content>
</Tooltip.Portal>
</Tooltip.Root>
</h4>
        </div>
                {/* Usage Progress Bars */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Token Usage - Updated with K formatting */}
          <div className="bg-[#f5e6d8] dark:bg-gray-800 p-2 rounded-lg">
            <div className="flex items-center justify-between">
              <BarChart3 className="w-3 h-3 text-[#a55233] dark:text-blue-400" />
              <span className="text-xs text-[#5a544a] dark:text-gray-400">Token Usage</span>
            </div>
            <p className="text-xs font-semibold text-[#0a3b25] dark:text-white mt-1">
              {formatTokens(tokensUsed)} / {tokenLimit ? formatTokens(tokenLimit) : 'Unlimited'}
            </p>
            {tokenLimit && (
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                <div
                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${getPercent(tokensUsed, tokenLimit)}%` }}
                ></div>
              </div>
            )}
            {tokenLimit && (
              <div className="text-xs text-center mt-1">
                {getPercent(tokensUsed, tokenLimit)}% used
              </div>
            )}
          </div>

          {/* Page Usage */}
          <div className="bg-[#f5e6d8] dark:bg-gray-800 p-2 rounded-lg">
            <div className="flex items-center justify-between">
              <FileText className="w-3 h-3 text-[#a55233] dark:text-blue-400" />
              <span className="text-xs text-[#5a544a] dark:text-gray-400">Page Usage</span>
            </div>
            <p className="text-xs font-semibold text-[#0a3b25] dark:text-white mt-1">
              {pagesUsed} / {pageLimit ?? 'Unlimited'}
            </p>
            {pageLimit && (
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                <div
                  className="h-1.5 rounded-full bg-purple-500 transition-all"
                  style={{ width: `${getPercent(pagesUsed, pageLimit)}%` }}
                ></div>
              </div>
            )}
            {pageLimit && (
              <div className="text-xs text-center mt-1">
                {getPercent(pagesUsed, pageLimit)}% used
              </div>
            )}
          </div>
        </div>

        {/* First Row - Main Stats */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Total Questions */}
          <div className="bg-[#f5e6d8] dark:bg-gray-800 p-2 rounded-lg">
            <div className="flex items-center justify-between">
              <MessageSquare className="w-3 h-3 text-[#a55233] dark:text-blue-400" />
              <span className="text-xs text-[#5a544a] dark:text-gray-400">
                Questions
              </span>
            </div>
            <p className="text-sm font-semibold text-[#0a3b25] dark:text-white mt-1">
              {formatNumber(userDetails.total_questions_asked)}
            </p>
          </div>

          
          {/* Total Documents */}
          <div className="bg-[#f5e6d8] dark:bg-gray-800 p-2 rounded-lg">
            <div className="flex items-center justify-between">
              <File className="w-3 h-3 text-[#a55233] dark:text-blue-400" />
              <span className="text-xs text-[#5a544a] dark:text-gray-400">
                Documents
              </span>
            </div>
            <p className="text-sm font-semibold text-[#0a3b25] dark:text-white mt-1">
              {formatNumber(userDetails.total_documents_uploaded)}
            </p>
          </div>
        </div>
      </div>

      {/* Admin Panel Button - Only shown for admin users */}
      {username === "admin" && (
        <div className="pt-2 border-t border-[#e3d5c8] dark:border-gray-700">
          <button
            onClick={handleAdminPanelClick}
            className="flex items-center space-x-2 text-white bg-[#556052] hover:bg-[#425142] dark:bg-purple-600 dark:hover:bg-purple-700 transition-colors w-full p-2 rounded-lg"
          >
            <Settings className="w-3 h-3" />
            <span className="text-xs font-medium">Open Admin Panel</span>
          </button>
        </div>
      )}

      {/* Logout Button */}
      <div className="pt-2 border-t border-[#e3d5c8] dark:border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 text-[#5e4636] hover:text-[#a55233] dark:text-gray-200 dark:hover:text-red-400 transition-colors w-full p-2 rounded-lg hover:bg-[#f5e6d8] dark:hover:bg-gray-800 group"
        >
          <LogOut className="w-3 h-3 group-hover:rotate-12 transition-transform" />
          <span className="text-xs">Logout</span>
        </button>
      </div>

      {/* Upload Instructions */}
     <div className="text-xs text-[#5a544a] dark:text-gray-300 space-y-1 bg-[#e9dcc9] dark:bg-gray-800 p-2 rounded-lg">
  <p>• Need help with your account or uploads?</p>
  <p>• Contact our support team at{' '}
    <a 
      href="mailto:contact@klarifai.ai" 
      className="text-[#a55233] dark:text-blue-400 font-medium hover:underline ml-2"
      onClick={(e) => e.stopPropagation()} // Prevent event bubbling
    >
      contact@klarifai.ai
    </a>
  </p>
</div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ProfileDropdown;