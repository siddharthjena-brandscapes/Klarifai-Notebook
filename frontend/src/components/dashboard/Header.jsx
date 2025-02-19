
import { useState, useEffect, useRef } from "react";
import { LogOut, User, ChevronLeft, FolderOpen, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/Logo1.png";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
import ProfileDropdown from "./ProfileDropdown";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectName = location.state?.projectName;
  
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userDetails, setUserDetails] = useState({
    email: "",
    joinedDate: "",
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest(".profile-dropdown-content")
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedUsername = localStorage.getItem("username");
        const storedProfileImage = localStorage.getItem("profile_image");

        if (storedUsername) {
          setUsername(storedUsername);
        }

        if (storedProfileImage) {
          setProfileImage(storedProfileImage);
        }

        const response = await axiosInstance.get("/user/profile/");

        if (response.data.username) {
          setUsername(response.data.username);
          localStorage.setItem("username", response.data.username);
        }

        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          response.data.username
        )}&background=random`;

        setProfileImage(response.data.profile_picture || defaultAvatar);
        localStorage.setItem(
          "profile_image",
          response.data.profile_picture || defaultAvatar
        );

        setUserDetails({
          email: response.data.email || "Not available",
          joinedDate: new Date(response.data.date_joined).toLocaleDateString(),
        });
      } catch (error) {
        console.error("Failed to fetch user profile:", error);

        const fallbackUsername = localStorage.getItem("username") || "User";
        setUsername(fallbackUsername);

        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          fallbackUsername
        )}&background=random`;
        setProfileImage(fallbackAvatar);
        localStorage.setItem("profile_image", fallbackAvatar);

        toast.error("Could not retrieve full user profile");
      } finally {
        setIsLoading(false);
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      fetchUserProfile();
    } else {
      navigate("/auth");
      setIsLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("profile_image");

      toast.success("Logged out successfully");

      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const handleNavigateHome = () => {
    navigate("/landing");
  };

  const handleProfileUpdate = (newProfileImage) => {
    setProfileImage(newProfileImage);
    localStorage.setItem('profile_image', newProfileImage);
  };

  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-gray-800 z-50">
        <div className="flex justify-between items-center px-4 py-2">
          <div>Loading...</div>
        </div>
      </header>
    );
  }

  const showProjectContext = location.pathname.includes('/dashboard') || 
                           location.pathname.includes('/idea-generation');
                           
  const showHomeButton = location.pathname !== '/landing';

  return (
    <header className="fixed top-0 left-0 right-0 bg-black z-50 shadow-md">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-800">
        {/* Left Section: Logo and Navigation */}
        <div className="flex items-center space-x-4">
          {/* Static Logo */}
          <img
            src={logo}
            alt="Logo"
            className="h-12 w-auto"
          />

          {/* Navigation Button - Only show when not on landing page */}
          {showHomeButton && (
            <button
              onClick={handleNavigateHome}
              className="p-2 text-gray-300 bg-emerald-600/20 hover:text-white hover:bg-blue-600/20 rounded-lg transition-all duration-200 flex items-center gap-2"
              title="Go to Home"
            >
              <Home className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Project Context Section */}
          {showProjectContext && (
            <>
              <div className="h-8 w-px bg-gray-700 mx-2" />
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-600/20 rounded-lg">
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 hidden md:block">Current Project</span>
                  <span className="text-sm font-semibold text-white bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent truncate max-w-[150px] md:max-w-[250px] lg:max-w-[400px]">
                    {projectName || 'Untitled Project'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Section: User Profile and Logout */}
        <div className="flex items-center space-x-4 px-3" ref={dropdownRef}>
          <div
            className="relative cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-10 w-10 rounded-full border-2 border-blue-500 object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
                <User size={20} />
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-gray-800" />

            <ProfileDropdown
              profileImage={profileImage}
              username={username}
              userDetails={userDetails}
              isOpen={showDropdown}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>

          <span
            className="text-white font-medium max-w-[100px] truncate hover:text-blue-300 transition-colors cursor-pointer"
            title={username}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {username}
          </span>

          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-red-400 transition-colors group"
            title="Logout"
          >
            <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;