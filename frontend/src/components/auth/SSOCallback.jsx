/* eslint-disable no-unused-vars */
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SSOCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');
        const username = searchParams.get('username');
        const error = searchParams.get('error');

        if (error) {
            // Handle error - redirect back to login with error message
            navigate('/login', { 
                state: { error: `SSO authentication failed: ${error}` },
                replace: true 
            });
            return;
        }

        if (token && username) {
            try {
                // Store the token in localStorage (same as regular login)
                localStorage.setItem('token', token);
                
                // Redirect to landing page (same as regular login)
                navigate('/landing', { replace: true });
            } catch (error) {
                console.error('Error storing token:', error);
                navigate('/login', { 
                    state: { error: 'Authentication failed. Please try again.' },
                    replace: true 
                });
            }
        } else {
            // No token or username - redirect to login
            navigate('/login', { 
                state: { error: 'Authentication failed. Please try again.' },
                replace: true 
            });
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Completing authentication...</p>
            </div>
        </div>
    );
};

export default SSOCallback;