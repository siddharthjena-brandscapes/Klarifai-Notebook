

// Header.jsx
import { useState, useEffect, useRef, useContext } from "react";
import { User, Ellipsis, X, FolderOpen, FileText, Lightbulb } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import logo from "../../assets/Logo1.png";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
import { coreService } from "../../utils/axiosConfig";
import ProfileDropdown from "./ProfileDropdown";
import ThemeToggle from "../Themes/ThemeToggle";
import logoLight from "../../assets/new-Logo4-redtext.png";
import { ThemeContext } from "../../context/ThemeContext";
 
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mainProjectId } = useParams();
  const projectName = location.state?.projectName;
  const { theme } = useContext(ThemeContext);
 
  // Initialize with localStorage values to prevent flashing
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profile_image") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDetails, setUserDetails] = useState({
    email: "",
    joinedDate: "",
  });
  // Add state for user module permissions
  const [disabledModules, setDisabledModules] = useState({});
  // Add state for project's selected modules
  const [projectModules, setProjectModules] = useState([]);
 
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
 
  // Determine current module
  const isDocQA = location.pathname.includes('/dashboard');
  const isIdeaGen = location.pathname.includes('/idea-generation');
 
  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest(".profile-dropdown-content")
      ) {
        setShowDropdown(false);
      }

      // Close mobile menu when clicking outside
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest(".mobile-menu-button")
      ) {
        setMobileMenuOpen(false);
      }
    };
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
 
  // Fetch user data in background without affecting render
  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
     
      if (!token) {
        navigate("/auth");
        return;
      }
     
      try {
        const response = await axiosInstance.get("/user/profile/");
       
        if (response.data.username) {
          setUsername(response.data.username);
          localStorage.setItem("username", response.data.username);
        }
 
        // Generate fallback avatar if needed
        const defaultAvatar = response.data.username ?
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            response.data.username
          )}&background=random` : "";
 
        // Use profile picture or default avatar
        if (response.data.profile_picture || defaultAvatar) {
          setProfileImage(response.data.profile_picture || defaultAvatar);
          localStorage.setItem(
            "profile_image",
            response.data.profile_picture || defaultAvatar
          );
        }
 
        // Update user details and store disabled modules
        setUserDetails({
          email: response.data.email || "Not available",
          joinedDate: response.data.date_joined ?
            new Date(response.data.date_joined).toLocaleDateString() :
            "Not available"
        });

        // Set disabled modules from user profile
        if (response.data.disabled_modules) {
          setDisabledModules(response.data.disabled_modules);
          // Store disabled modules in localStorage for other components
          localStorage.setItem('disabled_modules', JSON.stringify(response.data.disabled_modules));
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
       
        // Only show toast if we don't have cached data
        if (!username) {
          toast.error("Could not retrieve user profile");
        }
      }
    };
 
    fetchUserProfile();
  }, [navigate, username]);
  
  // Fetch project details to get selected modules
  useEffect(() => {
    const fetchProjectModules = async () => {
      if (!mainProjectId) return;
      
      try {
        const projectDetails = await coreService.getProjectDetails(mainProjectId);
        if (projectDetails && projectDetails.selected_modules) {
          setProjectModules(projectDetails.selected_modules);
          // Store for other components
          localStorage.setItem('project_modules', JSON.stringify(projectDetails.selected_modules));
        }
      } catch (error) {
        console.error("Failed to fetch project details:", error);
      }
    };
    
    fetchProjectModules();
  }, [mainProjectId]);
 
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("profile_image");
      localStorage.removeItem("disabled_modules");
      localStorage.removeItem("project_modules");
 
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
 
  // Function to check if a module is disabled
  const isModuleDisabled = (moduleId) => {
    return disabledModules[moduleId] === true;
  };
  
  // Function to check if module is included in the current project
  const isModuleIncludedInProject = (moduleId) => {
    return projectModules.includes(moduleId);
  };
  
  // Function to check if a module should be available
  const isModuleAvailable = (moduleId) => {
    return !isModuleDisabled(moduleId) && isModuleIncludedInProject(moduleId);
  };

  // Function to handle switching between modules
  const handleModuleSwitch = () => {
    if (!mainProjectId) {
      toast.error("No project selected");
      return;
    }
   
    // Check module access before switching
    if (isDocQA) {
      // Check if Idea Generator is disabled or not included in project
      if (!isModuleAvailable('idea-generator')) {
        toast.error("Idea Generator is not available for this project");
        return;
      }
      navigate(`/idea-generation/${mainProjectId}`, { state: { projectName: projectName } });
    } else if (isIdeaGen) {
      // Check if Document Q&A is disabled or not included in project
      if (!isModuleAvailable('document-qa')) {
        toast.error("Document Q&A is not available for this project");
        return;
      }
      navigate(`/dashboard/${mainProjectId}`, { state: { projectName: projectName } });
    }
  };
 
  const showProjectContext = location.pathname.includes('/dashboard') ||
                           location.pathname.includes('/idea-generation');
                           
  const showHomeButton = location.pathname !== '/landing';
  
  // Only show module switch if both conditions are met:
  // 1. User has access to the module (not globally disabled)
  // 2. The module was included when creating the project
  const showModuleSwitch = showProjectContext && 
                          mainProjectId && 
                          ((isDocQA && isModuleAvailable('idea-generator')) || 
                           (isIdeaGen && isModuleAvailable('document-qa')));

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Navigation items that will be rendered for both desktop and mobile
  const renderNavigationItems = () => (
    <>
      {showHomeButton && (
        <button
          onClick={handleNavigateHome}
          className="flex items-center space-x-2 
              dark:text-gray-300 text-teal-700
              hover:text-teal-600 dark:hover:text-white transition-all duration-200 
              rounded-md px-2 py-1 w-full md:w-auto"
          title="Home"
        >
          <span className="dark:text-white text-teal-700 text-base font-bold tracking-wide uppercase">Home</span>
        </button>
      )}

      {showModuleSwitch && (
        <button
          onClick={handleModuleSwitch}
          className="flex items-center space-x-2 dark:text-gray-300 text-black hover:text-blue-500 dark:hover:text-white transition-all rounded-md px-2 py-1 w-full md:w-auto"
          title={isDocQA ? "Switch to Idea Generator" : "Switch to Document Q&A"}
        >
          {isDocQA ? (
            <>
              <Lightbulb className="w-4 h-4 dark:text-blue-400 text-gray-700" />
              <span className="text-sm dark:font-light font-normal tracking-wide">Idea Module</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 dark:text-blue-400 text-gray-700" />
              <span className="text-sm dark:font-light font-normal tracking-wide">Doc Q&A Module</span>
            </>
          )}
        </button>
      )}

      {showProjectContext && (
        <div className="flex items-center rounded-md px-2 py-1 w-full md:w-auto">
          <FolderOpen className="w-4 h-4 dark:text-gray-400 text-gray-700 mr-2 flex-shrink-0" />
          <span className="text-sm dark:font-light font-normal tracking-wide dark:text-white text-black truncate max-w-[200px]">
            {projectName || 'Untitled Project'}
          </span>
        </div>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 dark:bg-black bg-[#f7f3ea] z-50 shadow-md transition-colors duration-300 dark:border-gray-900 border-b border-gray-400">
      <div className="flex flex-wrap justify-between items-center px-2 sm:px-4 py-2">
        {/* Left Section: Logo */}
        <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
          {/* Logo - Responsive sizing */}
          <img
            src={theme === 'dark' ? logo : logoLight}
            alt="Logo"
            className="h-5 w-auto sm:h-7 md:h-9"
          />
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
        <div className="hidden md:flex items-center justify-center flex-grow mx-4 space-x-8">
          {renderNavigationItems()}
        </div>

        {/* Right Section: Menu, Theme Toggle, and User Profile */}
        <div className="flex items-center space-x-3 px-1 sm:px-3">
          {/* Hamburger menu - visible only on mobile */}
          <button 
            className="mobile-menu-button md:hidden text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-white"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Ellipsis  size={24} />}
          </button>
          
          {/* Theme Toggle Button */}
          <ThemeToggle />
          
          {/* User Profile */}
          <div
            className="relative cursor-pointer"
            onClick={() => setShowDropdown(!showDropdown)}
            ref={dropdownRef}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-blue-500 object-cover"
              />
            ) : (
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
                <User size={16} className="sm:w-5 sm:h-5" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-2 w-2 sm:h-3 sm:w-3 bg-green-500 rounded-full border-2 border-gray-800" />
 
            <ProfileDropdown
              profileImage={profileImage}
              username={username}
              userDetails={userDetails}
              isOpen={showDropdown}
              onProfileUpdate={handleProfileUpdate}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu - Only visible when menu is open */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden bg-white dark:bg-gray-900 shadow-lg p-4 fixed top-14 left-0 right-0 z-50 flex flex-col space-y-4 border-t border-gray-300 dark:border-gray-700"
        >
          {renderNavigationItems()}
        </div>
      )}
    </header>
  );
};
 
export default Header;