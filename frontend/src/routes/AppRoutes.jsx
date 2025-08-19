
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
// import LoginSignup from '../pages/LoginSignup/LoginSignup';
import Dashboard from '../pages/Dashboard/Dashboard';
import LandingPage from '../components/LandingPage';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import IdeaForm from '../components/IdeaForm';
import ProjectsIdeaGen from '../components/ProjectsIdeaGen';
import AdminPanel from '../components/AdminPanel';
import MainDashboard from '../components/klarifai_notebook/MainDashboard';
import SSOCallback from '../components/auth/SSOCallback';
import SignupForm from '../components/auth/SignupForm';
import WelcomeScreen from '../components/WelcomeScreen';
import AdminLoginForm from '../components/auth/AdminLoginForm';
 
const AppRoutes = () => {
  return (
    
      <Routes>
        {/* Auth Routes */}
        <Route path="/welcome" element={<WelcomeScreen />} />
        {/* <Route path="/auth" element={<LoginSignup />} /> */}
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/sso-callback" element={<SSOCallback />} />
        <Route path="/auth/signup" element={<SignupForm />} />
        <Route path="/auth/login" element={<AdminLoginForm />} />
 
       
        {/* Main Landing Page */}
        <Route path="/landing" element={
          <PrivateRoute>
            <LandingPage />
          </PrivateRoute>
        } />
       
        {/* Document Q&A Module */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Navigate to="/landing" replace />
          </PrivateRoute>
        } />
        <Route path="/dashboard/:mainProjectId/*" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
       
        {/* Idea Generation Module */}
        <Route path="/idea-generation" element={
          <PrivateRoute>
            <Navigate to="/landing" replace />
          </PrivateRoute>
        } />
        <Route path="/idea-generation/:mainProjectId" element={
          <PrivateRoute>
            <ProjectsIdeaGen />
          </PrivateRoute>
        }>
          <Route path="form" element={<IdeaForm />} />
        </Route>

        {/* Klarifai Notebook - FIXED VERSION */}
        <Route path="/klarifai-notebook" element={
          <PrivateRoute>
            <Navigate to="/landing" replace />
          </PrivateRoute>
        } />
        <Route path="/klarifai-notebook/:mainProjectId/*" element={
          <PrivateRoute>
            <MainDashboard />
          </PrivateRoute>
        } />

        {/* Admin Panel Route */}
        <Route path="/admin" element={
          <PrivateRoute>
            <AdminPanel />
          </PrivateRoute>
        } />

        {/* FAQ Page */}
       
       
        {/* Default Route */}
        <Route path="/" element={<WelcomeScreen />} />
      </Routes>
   
  );
};
 
export default AppRoutes;
 