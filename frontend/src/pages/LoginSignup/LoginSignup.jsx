/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import SignupForm from '../../components/auth/SignupForm';
import backgroundImage from '../../assets/woman_face_merging_into_the_AI.jpg';
import logo from '../../assets/klarifi-logo-blue.png';
import FaqButton from '../../components/faq/FaqButton';
import brandscapeLogo from '../../assets/brand-scarpes-logo.png';
import { coreService } from '../../utils/axiosConfig';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(location.state?.error || '');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      coreService.getCurrentUser()
        .then((res) => {
          const user = res.data || res;
          setUserProfile(user);
          if (user.username === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        })
        .catch(() => setIsAdmin(false));
    } else {
      setIsAdmin(false);
    }
  }, []);

  const toggleForm = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
    }, 300);
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  const handleAuthSuccess = (token) => {
    try {
      // Validate token before storing
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token');
      }

      localStorage.setItem('token', token);
      
      navigate('/landing', { replace: true });
    } catch (error) {
      console.error('Authentication error:', error);
      // Optional: Add user-friendly error handling
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white relative">
      {/* Left Side: AI-Themed Image - Hidden on mobile, visible on md and up */}
      <div
        className="hidden md:block md:w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>

      {/* Right Side: Login/Signup Form - Full width on mobile, half on md and up */}
      <div
        className="w-full md:w-1/2 flex flex-col items-center justify-center bg-cover bg-center p-4 overflow-auto relative"
        style={{
          backgroundImage: "url('./clone/src/assets/geometric_abstract_background.jpg')"
        }}
      >
        <div
          className={`w-full max-w-md bg-white shadow-md rounded-lg transition-all duration-500 ease-in-out overflow-visible mx-auto my-8`}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="p-4 sm:p-8">
            <div
              className={`transition-all duration-600 ${
                isAnimating
                  ? 'opacity-0 -translate-y-4 scale-95'
                  : 'opacity-100 translate-y-0 scale-100'
              }`}
            >
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-12 sm:h-16 w-auto transition-transform duration-500 hover:scale-110"
                />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-center dark:text-gray-800 mb-4 sm:mb-6">
                Welcome!
              </h2>
              <LoginForm onSuccess={handleAuthSuccess} initialError={error}  />
              <div className="mt-4 sm:mt-6 text-center pb-2">
                <p className="text-sm text-gray-600">
                  {/* Signup is only available to admin in Admin Panel */}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Footer Branding - centered below the form */}
        <div className="flex flex-col items-center w-full mt-6">
          <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm">
            <span>Powered by:</span>
            <img
              src={brandscapeLogo}
              alt="Brandscape"
              className="h-6 w-auto"
            />
          </div>
        </div>
      </div>
      <FaqButton />
    </div>
  );
};

export default LoginSignup;