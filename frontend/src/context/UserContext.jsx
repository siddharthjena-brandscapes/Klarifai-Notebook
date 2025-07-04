import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userService } from '../utils/axiosConfig';
import { useLocation } from 'react-router-dom';

const UserContext = createContext();


export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [rightPanelPermissions, setRightPanelPermissions] = useState({
    'right-panel-access': false,
    'mindmap-generation': false,
    'mindmap-history': false,
    'notes-panel': false,
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchCurrentUserRightPanelPermissions = useCallback(async () => {
    try {
      const permissions = await userService.getCurrentUserRightPanelPermissions();
      console.log('Fetched user permissions:', permissions);
      
      setCurrentUser({
        id: permissions.user_id,
        username: permissions.username
      });
      
      setRightPanelPermissions(permissions.disabled_features || {
        'right-panel-access': false,
        'mindmap-generation': false,
        'mindmap-history': false,
        'notes-panel': false,
      });
    } catch (error) {
      console.error('Error fetching right panel permissions:', error);
      setRightPanelPermissions({
        'right-panel-access': false,
        'mindmap-generation': false,
        'mindmap-history': false,
        'notes-panel': false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

 useEffect(() => {
    console.log('UserProvider effect running, path:', location.pathname, 'token:', localStorage.getItem('token'));
    const token = localStorage.getItem('token');
    // Skip fetching permissions on login/signup/forgot/reset pages
    if (
      location.pathname.startsWith('/auth') ||
      location.pathname === '/forgot-password' ||
      location.pathname === '/reset-password' ||
      location.pathname === '/sso-callback'
    ) {
      setLoading(false);
      return;
    }
    if (token) {
      fetchCurrentUserRightPanelPermissions();
      const intervalId = setInterval(() => {
        fetchCurrentUserRightPanelPermissions();
      }, 30000);
      return () => clearInterval(intervalId);
    } else {
      setLoading(false);
    }
  }, [fetchCurrentUserRightPanelPermissions, location]);

  // ✅ ADD: Refresh on window focus (when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        fetchCurrentUserRightPanelPermissions();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchCurrentUserRightPanelPermissions]);

  const refreshPermissions = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoading(true);
      fetchCurrentUserRightPanelPermissions();
    }
  };

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      rightPanelPermissions, 
      loading, 
      refreshPermissions 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  console.log('useUser called from:', new Error().stack);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};