
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
import { Link } from "react-router-dom";
 
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

  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
 
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const moduleDropdownRef = useRef(null);
 
  // Determine current module
  const isDocQA = location.pathname.includes('/dashboard');
  const isIdeaGen = location.pathname.includes('/idea-generation');
  const isKlarifaiNotebook = location.pathname.includes('/klarifai-notebook');
 
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

    // Close module dropdown when clicking outside
    if (
      moduleDropdownRef.current &&
      !moduleDropdownRef.current.contains(event.target)
    ) {
      setShowModuleDropdown(false);
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
    setTimeout(() => {
      window.location.reload(); // Ensures all React state and effects are reset
    }, 100); // Small delay to allow navigation
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
  // Function to handle switching between modules
// Function to handle navigation to specific module
const handleModuleNavigation = (moduleId) => {
  if (!mainProjectId) {
    toast.error("No project selected");
    return;
  }

  if (!isModuleAvailable(moduleId)) {
    toast.error(`${getModuleName(moduleId)} is not available for this project`);
    return;
  }

  setShowModuleDropdown(false);

  switch (moduleId) {
    case 'document-qa':
      navigate(`/dashboard/${mainProjectId}`, { state: { projectName: projectName } });
      break;
    case 'idea-generator':
      navigate(`/idea-generation/${mainProjectId}`, { state: { projectName: projectName } });
      break;
    case 'klarifai-notebook':
      navigate(`/klarifai-notebook/${mainProjectId}`, { state: { projectName: projectName } });
      break;
    default:
      toast.error("Invalid module selected");
  }
};

// Helper function to get module display names
const getModuleName = (moduleId) => {
  const moduleNames = {
    'document-qa': 'Document Q&A',
    'idea-generator': 'Idea Generator',
    'klarifai-notebook': 'Klarifai Notebook'
  };
  return moduleNames[moduleId] || moduleId;
};

// Helper function to get module icons
const getModuleIcon = (moduleId) => {
  switch (moduleId) {
    case 'document-qa':
      return <FileText className="w-4 h-4" />;
    case 'idea-generator':
      return <Lightbulb className="w-4 h-4" />;
    case 'klarifai-notebook':
      return <FileText className="w-4 h-4" />; // You can change this to a different icon
    default:
      return <FileText className="w-4 h-4" />;
  }
};
 
  const showProjectContext = location.pathname.includes('/dashboard') ||
                         location.pathname.includes('/idea-generation') ||
                         location.pathname.includes('/klarifai-notebook');
                           
  const showHomeButton = location.pathname !== '/landing';
  
  // Only show module switch if both conditions are met:
  // 1. User has access to the module (not globally disabled)
  // 2. The module was included when creating the project
  // Show module dropdown if user is in a project context and has access to other modules
const availableModules = ['document-qa', 'idea-generator', 'klarifai-notebook'].filter(moduleId => 
  isModuleAvailable(moduleId)
);

const showModuleDropdowns = showProjectContext && mainProjectId && availableModules.length > 1;
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
{showModuleDropdowns && (
  <div className="relative" ref={moduleDropdownRef}>
    <button
      onClick={() => setShowModuleDropdown(!showModuleDropdown)}
      className="flex items-center space-x-2 dark:text-gray-300 text-black hover:text-blue-500 dark:hover:text-white transition-all rounded-md px-2 py-1 w-full md:w-auto "
    >
      <span className="text-sm dark:font-light font-normal tracking-wide">Switch Module</span>
      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {showModuleDropdown && (
      <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
        {availableModules.map((moduleId) => {
          const isCurrentModule = 
            (moduleId === 'document-qa' && isDocQA) ||
            (moduleId === 'idea-generator' && isIdeaGen) ||
            (moduleId === 'klarifai-notebook' && isKlarifaiNotebook);

          return (
            <button
              key={moduleId}
              onClick={() => handleModuleNavigation(moduleId)}
              disabled={isCurrentModule}
              className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isCurrentModule 
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 cursor-not-allowed' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {getModuleIcon(moduleId)}
              <span>{getModuleName(moduleId)}</span>
              {isCurrentModule && (
                <span className="ml-auto text-xs text-blue-500 dark:text-blue-400">Current</span>
              )}
            </button>
          );
        })}
      </div>
    )}
  </div>
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
  <Link to="/landing" title="Go to Projects" className="focus:outline-none" style={{ background: "none", border: "none", padding: 0, margin: 0 }}>
    <img
      src={theme === 'dark' ? logo : logoLight}
      alt="Logo"
      className="h-5 w-auto sm:h-7 md:h-9"
    />
  </Link>
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