'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

import Reports from '@/components/admin/Reports';
import ProductManagement from '@/components/admin/ProductManagement';
import HierarchyView from '@/components/admin/HierarchyView';
import AddNewUser from '@/components/admin/AddNewUser';
import Analytics from '@/components/admin/Analytics'; 
import PayoutsView from '@/components/admin/PayoutsView';

const TABS = {
  REPORTS: 'Reports',
  ANALYTICS: 'Analytics & Overview',
  HIERARCHY: 'Hierarchy',
  ADD_USER: 'Users',
  PRODUCTS: 'Product Management',
  PAYOUTS: 'Payouts',
};

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState(TABS.REPORTS);

  useEffect(() => {
    if (user && user.role !== 'Admin') {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };
  
  const renderContent = () => {
    switch (activeTab) {
      case TABS.REPORTS:
        return <Reports />;
      case TABS.PRODUCTS:
        return <ProductManagement />;
      case TABS.ANALYTICS:
        return <Analytics />; 
      case TABS.HIERARCHY:
        return <HierarchyView />;
      case TABS.ADD_USER:
        return <AddNewUser />;
      case TABS.PAYOUTS: 
         return <PayoutsView />;
      default:
        return <Reports />;
    }
  };

  if (!user) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-green-900 text-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Control Panel</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-green-800 rounded-md hover:bg-green-700 text-sm transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            {Object.values(TABS).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 font-semibold text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-600 hover:text-green-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-6">{renderContent()}</main>
    </div>
  );
}
