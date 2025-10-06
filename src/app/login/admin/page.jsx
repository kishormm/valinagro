'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';

// Simple inline SVG loader
const Loader = () => (
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function AdminLoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const [adminUserId, setAdminUserId] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const user = await login({ userId: adminUserId, password: adminPassword });
            if (user && user.role === 'Admin') {
                router.push('/dashboard/admin');
            }
        } catch (error) {
            console.error('Admin login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex justify-center items-center min-h-screen font-sans ">
            <div className="p-10 bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-md border border-gray-200/50">
                <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Admin Portal Login</h1>
                <form onSubmit={handleAdminLogin}>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Admin User ID"
                            value={adminUserId}
                            onChange={(e) => setAdminUserId(e.target.value)}
                            className="w-full p-3 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>
                    <div className="relative mb-4">
                        <input
                            type="password"
                            placeholder="Password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full p-3 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full h-12 flex justify-center items-center p-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 transition-colors shadow-md disabled:bg-green-400">
                        {isSubmitting ? <Loader /> : 'Log In'}
                    </button>
                </form>
                 <div className="text-center mt-6">
                    <a href="/login/user" className="text-sm text-green-700 hover:underline">Are you a member? Login here.</a>
                </div>
            </div>
        </main>
    );
}
