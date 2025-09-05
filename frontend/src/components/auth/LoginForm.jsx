
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const LoginForm = ({ onSuccess = () => {} }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [ssoLoading, setSsoLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axiosInstance.post('http://localhost:8000/api/login/', {
                username,
                password,
            });
            const token = response.data.token;
            localStorage.setItem('token', token);
            onSuccess(token);
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMicrosoftSSO = () => {
        setSsoLoading(true);
        // Direct redirect to the backend SSO route
        // The backend will handle everything and redirect back to frontend
        window.location.href = 'http://localhost:8000/api/microsoft-sso/';
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white">
                    <label className="block text-sm font-medium dark:text-gray-600">Username</label>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={false}
                        className="w-full px-4 py-2 border rounded-lg dark:text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50"
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
                        disabled={false}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none dark:text-black focus:ring-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50"
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={false}
                    className="w-full py-2 mt-6 font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 text-sm">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* Microsoft SSO Button */}
            <button
                onClick={handleMicrosoftSSO}
                disabled={ssoLoading || isLoading}
                className="w-full py-2 px-4 font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z"/>
                    <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                    <path fill="#7fba00" d="M1 13h10v10H1z"/>
                    <path fill="#ffb900" d="M13 13h10v10H13z"/>
                </svg>
                {ssoLoading ? 'Redirecting...' : 'Sign in with Brandscapes'}
            </button>

            {/* <div className="text-center items-center justify-center">
                <Link
                    to="/forgot-password"
                    className="text-sm dark:text-blue-900 hover:text-blue-700 justify-center items-center"
                >
                    Forgot Password?
                </Link>
            </div> */}
        </div>
    );
};

LoginForm.propTypes = {
    onSuccess: PropTypes.func
};

export default LoginForm;