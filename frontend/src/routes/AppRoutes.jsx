


import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import LoginSignup from '../pages/LoginSignup/LoginSignup';
import Dashboard from '../pages/Dashboard/Dashboard';
import LandingPage from '../components/LandingPage';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import IdeaForm from '../components/IdeaForm';
import ProjectsIdeaGen from '../components/ProjectsIdeaGen';


const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth" element={<LoginSignup />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        
        {/* Main Landing Page */}
        <Route path="/landing" element={
          <PrivateRoute>
            <LandingPage />
          </PrivateRoute>
        } />
        
        {/* Document Q&A Module */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
          <Route index element={<Navigate to="/landing" replace />} />
          <Route path=":mainProjectId/*" element={<Dashboard />} />
        </Route>
        
        {/* Idea Generation Module */}
        <Route path="/idea-generation" element={<PrivateRoute><ProjectsIdeaGen /></PrivateRoute>}>
          <Route index element={<Navigate to="/landing" replace />} />
          <Route path=":mainProjectId" element={<ProjectsIdeaGen />}>
            <Route path="form" element={<IdeaForm />} />
          </Route>
        </Route>
        
        
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;