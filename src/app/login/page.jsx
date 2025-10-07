'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

// Simple inline SVG loader
const Loader = () => (
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function UniversalLoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const user = await login({ userId, password }); 
            if (user) {
                const path = `/dashboard/${user.role.toLowerCase()}`;
                router.push(path);
            }
        } catch (error) {
            console.error('Login failed');
            // The authStore will show an error toast.
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex justify-center items-center min-h-screen font-sans bg-fixed bg-center bg-cover p-4" style={{ backgroundImage: "url('/back.jpg')" }}>
            {/* --- THIS IS THE KEY CHANGE --- */}
            {/* Reduced padding on small screens (p-6) and increased it on larger screens (sm:p-10) */}
            <div className="p-6 sm:p-10 bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl w-full max-w-md border border-gray-200/50">
                <div className="text-center mb-8">
                    {/* Responsive logo size */}
                    <img src="/logo.png" alt="Valin Agro Logo" className="h-14 sm:h-16 mx-auto mb-4"/>
                    {/* Responsive heading size */}
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Portal Login</h1>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">User ID</label>
                        <input
                            type="text"
                            placeholder="Enter your User ID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full p-3 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full h-12 flex justify-center items-center p-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 transition-colors shadow-md disabled:bg-green-400">
                        {isSubmitting ? <Loader /> : 'Log In'}
                    </button>
                </form>
            </div>
        </main>
    );
}

