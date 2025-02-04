
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm'; // Direct import
import SignupForm from '../../components/auth/SignupForm'; // Direct import
import backgroundImage from '../../assets/woman_face_merging_into_the_AI.jpg';
import logo from '../../assets/klarifi-logo-blue.png';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
      
      // // Determine redirect path
      // const from = location.state?.from?.pathname || '/dashboard';
      
      // // Navigate to the determined path
      // navigate(from, { replace: true });

      navigate('/landing', { replace: true });
    } catch (error) {
      console.error('Authentication error:', error);
      // Optional: Add user-friendly error handling
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Side: AI-Themed Image */}
      <div
        className="w-1/2 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      ></div>

      {/* Right Side: Login/Signup Form */}
      <div
        className="w-1/2 flex items-center justify-center bg-cover bg-center"
        style={{ 
          backgroundImage: "url('./clone/src/assets/geometric_abstract_background.jpg')" 
        }}
      >
        <div 
          className={`w-full max-w-md bg-white shadow-md rounded-lg transition-all duration-500 ease-in-out overflow-hidden`}
          style={{
            height: isLogin ? '560px' : '640px',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="p-8 h-full">
            <div
              className={`transition-all duration-600 h-full ${
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
                  className="h-16 w-auto transition-transform duration-500 hover:scale-110"
                />
              </div>
              
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                {isLogin ? "Welcome!" : "Create Account"}
              </h2>
              
              {isLogin ? (
                <LoginForm onSuccess={handleAuthSuccess} />
              ) : (
                <SignupForm onSuccess={handleAuthSuccess} />
              )}
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button 
                    onClick={toggleForm} 
                    className="ml-2 font-medium text-blue-900 hover:text-blue-800 transition-all duration-300"
                  >
                    {isLogin ? "Sign Up" : "Login"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;