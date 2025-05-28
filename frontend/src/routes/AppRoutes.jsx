// import React from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import PrivateRoute from './PrivateRoute';
// import LoginSignup from '../pages/LoginSignup/LoginSignup';
// import Dashboard from '../pages/Dashboard/Dashboard';
// import LandingPage from '../components/LandingPage';
// import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
// import ResetPasswordForm from '../components/auth/ResetPasswordForm';
// import IdeaForm from '../components/IdeaForm';
// import ProjectsIdeaGen from '../components/ProjectsIdeaGen';
// import AdminPanel from '../components/AdminPanel'; // Import the AdminPanel component
// import FaqPage from '../components/faq/FaqPage';
// import MainDashboard from '../components/klarifai_notebook/MainDashboard';
 
// const AppRoutes = () => {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Auth Routes */}
//         <Route path="/auth" element={<LoginSignup />} />
//         <Route path="/forgot-password" element={<ForgotPasswordForm />} />
//         <Route path="/reset-password" element={<ResetPasswordForm />} />
       
//         {/* Main Landing Page */}
//         <Route path="/landing" element={
//           <PrivateRoute>
//             <LandingPage />
//           </PrivateRoute>
//         } />
       
//         {/* Document Q&A Module */}
//         <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}>
//           <Route index element={<Navigate to="/landing" replace />} />
//           <Route path=":mainProjectId/*" element={<Dashboard />} />
//         </Route>
       
//         {/* Idea Generation Module */}
//         <Route path="/idea-generation" element={<PrivateRoute><ProjectsIdeaGen /></PrivateRoute>}>
//           <Route index element={<Navigate to="/landing" replace />} />
//           <Route path=":mainProjectId" element={<ProjectsIdeaGen />}>
//             <Route path="form" element={<IdeaForm />} />
//           </Route>
//         </Route>

//         {/* Klarifai Notebook */}
//         <Route path="/klarifai-notebook" element={<PrivateRoute><MainDashboard /></PrivateRoute>}>
//           <Route index element={<Navigate to="/landing" replace />} />
//           <Route path=":mainProjectId/*" element={<MainDashboard />} />
//         </Route>

       
//         {/* Admin Panel Route */}
//         <Route path="/admin" element={
//           <PrivateRoute>
//             <AdminPanel />
//           </PrivateRoute>
//         } />

//         {/* FAQ Page - Note: Not wrapped in PrivateRoute to make it publicly accessible */}
//         <Route path="/faq" element={<FaqPage />} />
       
//         {/* Default Route */}
//         <Route path="/" element={<Navigate to="/auth" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// };
 
// export default AppRoutes;

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
import AdminPanel from '../components/AdminPanel';
import FaqPage from '../components/faq/FaqPage';
import MainDashboard from '../components/klarifai_notebook/MainDashboard';
 
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
        <Route path="/faq" element={<FaqPage />} />
       
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
 
export default AppRoutes;
 