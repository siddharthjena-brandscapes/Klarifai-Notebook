/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../utils/axiosConfig';

const SignupForm = ({ onSuccess = () => {} }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nebiusToken, setNebiusToken] = useState('');
    const [geminiToken, setGeminiToken] = useState('');
    const [llamaToken, setLlamaToken] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Signup with the additional API tokens
            const signupResponse = await axiosInstance.post('/signup/', {
                username,
                email,
                password,
                nebius_token: nebiusToken,
                gemini_token: geminiToken,
                llama_token: llamaToken
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
        <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded relative mb-3 max-h-20 overflow-y-auto" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            <div>
                <label className="block text-sm font-medium dark:text-gray-600">Username</label>
                <input
                    type="text"
                    required
                    placeholder='User Name'
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
            </div>
    
            <div>
                <label className="block text-sm font-medium dark:text-gray-600">Email</label>
                <input
                    type="email"
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
            </div>
          
            <div>
                <label className="block text-sm font-medium dark:text-gray-600">Password</label>
                <input
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                    className="w-full px-3 py-2 border rounded-lg dark:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
            </div>

            <div>
                <label className="block text-sm font-medium dark:text-gray-600">Nebius API Token</label>
                <input
                    type="text" 
                    placeholder="Nebius API Token" 
                    value={nebiusToken} 
                    onChange={(e) => setNebiusToken(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
            </div>

            <div>
                <label className="block text-sm font-medium dark:text-gray-600">Gemini API Token</label>
                <input
                    type="text" 
                    placeholder="Gemini API Token" 
                    value={geminiToken} 
                    onChange={(e) => setGeminiToken(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
            </div>

            <div>
                <label className="block text-sm font-medium dark:text-gray-600">Llama API Token</label>
                <input
                    type="text" 
                    placeholder="Llama API Token" 
                    value={llamaToken} 
                    onChange={(e) => setLlamaToken(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
            </div>

            <button
                type="submit"
                className="w-full py-2 mt-4 font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-all duration-300"
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