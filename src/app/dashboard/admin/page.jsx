'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// --- CORRECTED IMPORTS ---
import { useAuthStore } from '../../../store/authStore';
import Reports from '../../../components/admin/Reports';
import ProductManagement from '../../../components/admin/ProductManagement';
import HierarchyView from '../../../components/admin/HierarchyView';
import AddNewUser from '../../../components/admin/AddNewUser';
import Analytics from '../../../components/admin/Analytics'; 
import PayoutsView from '../../../components/admin/PayoutsView';
// REMOVED: import CommissionPayoutsView from '../../../components/admin/CommissionPayoutsView';

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
      case TABS.REPORTS: return <Reports />;
      case TABS.PRODUCTS: return <ProductManagement />;
      case TABS.ANALYTICS: return <Analytics />; 
      case TABS.HIERARCHY: return <HierarchyView />;
      case TABS.ADD_USER: return <AddNewUser />;
      
      // --- UPDATED THIS SECTION ---
      // PayoutsView is now the single component that contains the tabs
      case TABS.PAYOUTS: 
        return <PayoutsView />;
      // --- END OF UPDATE ---
      
      default: return <Reports />;
    }
  };

  if (!user) {
    return (
        <div className="flex justify-center items-center h-screen bg-stone-50">
            <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="min-h-screen bg-stone-50">
        <header className="bg-green-800 text-white shadow-md">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <h1 className="text-lg sm:text-xl font-bold">Admin Control Panel</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-green-700 rounded-md hover:bg-green-600 text-sm font-semibold transition-colors"
            >
              Log Out
            </button>
          </div>
        </header>

        <nav className="bg-white shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-2 sm:px-6">
            <div className="flex gap-1 overflow-x-auto whitespace-nowrap no-scrollbar">
              {Object.values(TABS).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 py-4 px-4 sm:px-6 font-semibold text-sm transition-colors ${
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

        <main className="container mx-auto p-4 sm:p-6">{renderContent()}</main>
      </div>
    </>
  );
}