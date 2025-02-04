
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../utils/axiosConfig';

const SignupForm = ({ onSuccess = () => {} }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Signup
            const signupResponse = await axiosInstance.post('/signup/', {
                username,
                email,
                password,
            });

            // If signup is successful, automatically log in
            const loginResponse = await axiosInstance.post('/login/', {
                username,
                password,
            });
            
            const token = loginResponse.data.token;
            
            // Store token in localStorage
            localStorage.setItem('token', token);
            
            // Call onSuccess with the token
            onSuccess(token);
        } catch (err) {
            console.error('Signup Error:', err.response);
            
            // More specific error handling
            if (err.response) {
                // The request was made and the server responded with a status code
                const errorMessage = err.response.data.error || 
                                     'Signup failed. Please check your details.';
                setError(errorMessage);
            } else if (err.request) {
                // The request was made but no response was received
                setError('No response from server. Please try again.');
            } else {
                // Something happened in setting up the request
                setError('Error setting up the request. Please try again.');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields remain the same */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <div>
            <label className="block text-sm font-medium text-gray-600">User Name</label>
            <input
              type="text"
              required
              placeholder='User Name'
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
          </div>
    
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Password</label>
            <input
              type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
          </div>
          {error && <p>{error}</p>}
          <button
            type="submit"
            className="w-full py-2 mt-6 font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-all duration-300"
          >
            Sign Up
          </button>
        </form>
    );
};

SignupForm.propTypes = {
    onSuccess: PropTypes.func,
};

export default SignupForm;