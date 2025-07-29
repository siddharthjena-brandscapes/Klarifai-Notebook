/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { authService } from '../../utils/axiosConfig';
const ForgotPasswordForm = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
    
        try {
            const response = await authService.initiatePasswordReset(email);
            setMessage(response.data.message);
        } catch (err) {
            // More specific error handling
            if (err.response && err.response.data) {
                setError(err.response.data.error || 'An error occurred');
            } else {
                setError('Unable to process your request. Please try again.');
            }
            console.error('Password reset error:', err);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-600">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                Send Reset Link
            </button>
        </form>
    );
};

export default ForgotPasswordForm;