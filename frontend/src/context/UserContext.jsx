// src/contexts/UserContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../utils/axiosConfig'; // Adjust import path to your axiosConfig

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

  useEffect(() => {
    // Only fetch permissions if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUserRightPanelPermissions();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUserRightPanelPermissions = async () => {
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
      // Set default permissions (all enabled) on error
      setRightPanelPermissions({
        'right-panel-access': false,
        'mindmap-generation': false,
        'mindmap-history': false,
        'notes-panel': false,
      });
    } finally {
      setLoading(false);
    }
  };

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
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};