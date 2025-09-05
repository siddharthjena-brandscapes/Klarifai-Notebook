/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../utils/axiosConfig';

const ResetPasswordForm = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Check password match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Extract token from URL
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');

        if (!token) {
            setError('Invalid reset link');
            return;
        }

        try {
            const response = await authService.confirmPasswordReset(token, newPassword);
            
            setMessage(response.data.message);
            
            // Redirect to login after successful reset
            setTimeout(() => {
                navigate('/auth');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-600">New Password</label>
                <input
                     type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600">Confirm Password</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            {message && <p className="text-green-500">{message}</p>}
            {error && <p className="text-red-500">{error}</p>}
            <button 
                type="submit"
                className="w-full py-2 mt-4 text-white bg-blue-900 rounded-lg hover:bg-blue-800"
            >
                Reset Password
            </button>
        </form>
    );
};

export default ResetPasswordForm;