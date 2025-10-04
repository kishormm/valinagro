'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ThreeDots } from 'react-loader-spinner';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [adminEmail, setAdminEmail] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('password');
  const [role, setRole] = useState('Franchise'); // Default to Franchise now
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login({ userId: adminEmail, password: adminPassword, role: 'Admin' });
      if (user) router.push('/dashboard/admin');
    } catch (error) {
      console.error('Admin login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login({ userId, password: 'password', role });
      if (user) {
        const path = `/dashboard/${role.toLowerCase()}`;
        router.push(path);
      }
    } catch (error) {
      console.error('User login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex justify-center items-center h-screen font-sans">
      <div className="p-10 bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-md border border-gray-200/50">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Welcome</h1>

        {/* Admin Login Form */}
        <div className="mb-8">
          <form onSubmit={handleAdminLogin}>
            <label className="block mb-2 font-semibold text-gray-600">Log in as Admin</label>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
              </div>
              <input type="text" placeholder="Admin User ID" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full p-3 pl-10 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
              </div>
              <input type="password" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full p-3 pl-10 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full h-12 flex justify-center items-center p-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700 transition-colors shadow-md disabled:bg-green-400">
              {isSubmitting ? <ThreeDots color="#FFF" height={30} width={30} /> : 'Log In'}
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
            {/* UPDATED DROPDOWN */}
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900">
              <option value="Franchise">Franchise</option>
              <option value="Distributor">Distributor</option>
              <option value="SubDistributor">Sub-Distributor</option>
              <option value="Dealer">Dealer</option>
              <option value="Farmer">Farmer</option>
            </select>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
              </div>
              <input type="text" placeholder="Enter User ID" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-full p-3 pl-10 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full h-12 flex justify-center items-center p-3 bg-teal-600 text-white rounded-md font-bold hover:bg-teal-700 transition-colors shadow-md disabled:bg-teal-400">
              {isSubmitting ? <ThreeDots color="#FFF" height={30} width={30} /> : 'Log In'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
