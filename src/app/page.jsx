'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

// Simple inline SVG loader
const Loader = () => (
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  // --- THIS IS THE CHANGE: Default values are now empty strings ---
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [role, setRole] = useState('Franchise');
  const [userId, setUserId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Logic remains the same, sends the values from the form
      const user = await login({ userId: adminUserId, password: adminPassword });
      if (user && user.role === 'Admin') {
        router.push('/dashboard/admin');
      }
    } catch (error) {
      console.error('Admin login failed');
      // The error toast is handled by the authStore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login({ userId, role }); 
      if (user) {
        const path = `/dashboard/${user.role.toLowerCase()}`;
        router.push(path);
      }
    } catch (error) {
      console.error('User login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen font-sans">
      <div className="p-10 bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-md border border-gray-200/50">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Welcome</h1>

        {/* Admin Login Form */}
        <div className="mb-8">
          <form onSubmit={handleAdminLogin}>
            <label className="block mb-2 font-semibold text-gray-600">Log in as Admin</label>
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
        </div>

        <div className="flex items-center my-8">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* User Login Form */}
        <div>
          <form onSubmit={handleUserLogin}>
            <label className="block mb-2 font-semibold text-gray-600">Log in as</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900">
              <option value="Franchise">Franchise</option>
              <option value="Distributor">Distributor</option>
              <option value="SubDistributor">Sub-Distributor</option>
              <option value="Dealer">Dealer</option>
              <option value="Farmer">Farmer</option>
            </select>
            <div className="relative mb-4">
              <input type="text" placeholder="Enter User ID" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full p-3 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full h-12 flex justify-center items-center p-3 bg-teal-600 text-white rounded-md font-bold hover:bg-teal-700 transition-colors shadow-md disabled:bg-teal-400">
              {isSubmitting ? <Loader /> : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

