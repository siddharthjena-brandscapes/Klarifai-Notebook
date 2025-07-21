/* eslint-disable react/prop-types */
import { useRef, useState } from 'react';
import {  Calendar, Camera, Upload, X,  Settings, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosConfig';
// Import your navigation method - this example uses React Router, 
// but adjust based on your app's setup
import { useNavigate } from 'react-router-dom';

const ProfileDropdown = ({ profileImage, username, userDetails, isOpen, onProfileUpdate, onLogout }) => {
  const navigate = useNavigate(); // Initialize the navigation hook
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  

  if (!isOpen) return null;

  // Using your original file handling code
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or GIF file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    try {
      setIsUploading(true);
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await axiosInstance.post('/user/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.profile_picture) {
        onProfileUpdate(response.data.profile_picture);
        localStorage.setItem('profile_image', response.data.profile_picture);
        toast.success('Profile picture updated successfully');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile picture');
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
    fileInputRef.current.value = '';
  };


  const handlePasswordFormClick = (e) => {
    e.stopPropagation();
  };

  // Function to navigate to the AdminPanel component
  const handleAdminPanelClick = () => {
    navigate('/admin'); // Change this path to match your application's routing path for the admin panel
  };

  return (
    <div 
      onClick={handlePasswordFormClick}
      className="fixed right-4 top-16 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-[#d6cbbf] dark:border-gray-700 p-6 space-y-4 overflow-hidden"
    >
      {/* Profile Header */}
      <div className="flex items-center space-x-4 pb-4 border-b border-[#e3d5c8] dark:border-gray-700">
        <div className="relative group cursor-pointer" onClick={handleImageClick}>
          <div className="relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-[#a55233] dark:ring-blue-500 ring-offset-2 ring-offset-[#faf4ee] dark:ring-offset-gray-900">
            <img 
              src={previewImage || profileImage} 
              alt="Profile" 
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white w-6 h-6" />
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
              <Upload className="text-white w-6 h-6 animate-bounce" />
            </div>
          )}
        </div>
        <div className="flex-1">           
          <h3 className="text-[#0a3b25] dark:text-white text-lg font-medium">{username}</h3>           
          <p className="text-[#5a544a] dark:text-gray-300 text-sm truncate">{userDetails.email}</p>           
          <button              
            onClick={handleImageClick}             
            className=" text-[#a55233] dark:text-blue-400 text-sm hover:text-[#8b4513] dark:hover:text-blue-300 transition-colors"           
          >             
            Change Picture           
          </button>
            
        </div>
      </div>
      
      {/* User Details */}
      <div className="space-y-2">
  
        <div className="flex items-center space-x-3 text-[#5e4636] dark:text-gray-200  rounded-lg hover:bg-[#f5e6d8] dark:hover:bg-gray-800 transition-colors">
          <Calendar className="w-4 h-4 text-[#a55233] dark:text-inherit" />
          <span className="text-sm">Joined: {userDetails.joinedDate}</span>
        </div>
      </div>
  
      {/* Admin Panel Button - Only shown for admin users */}
      {username === 'admin' && (
        <div className="pt-3 border-t border-[#e3d5c8] dark:border-gray-700">
          <button
            onClick={handleAdminPanelClick}
            className="flex items-center space-x-2 text-white bg-[#556052] hover:bg-[#425142] dark:bg-purple-600 dark:hover:bg-purple-700 transition-colors w-full p-2 rounded-lg"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Open Admin Panel</span>
          </button>
        </div>
      )}
  
      {/* Logout Button */}
      <div className="pt-2 border-t border-[#e3d5c8] dark:border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 text-[#5e4636] hover:text-[#a55233] dark:text-gray-200 dark:hover:text-red-400 transition-colors w-full p-2 rounded-lg hover:bg-[#f5e6d8] dark:hover:bg-gray-800 group"
        >
          <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
  
      {/* Upload Instructions */}
      <div className="text-xs text-[#5a544a] dark:text-gray-300 space-y-1 bg-[#e9dcc9] dark:bg-gray-800 p-2 rounded-lg">
        <p>• Click profile picture to upload a new image</p>
        <p>• Maximum size: 2MB</p>
        <p>• Supported formats: JPG, PNG, GIF</p>
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