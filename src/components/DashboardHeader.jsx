'use client';

export default function DashboardHeader({ title, userName, onLogout, onChangePassword }) {
  return (
    <header className="bg-green-800 text-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
          <p className="text-sm text-green-200">Welcome, {userName}!</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* --- THIS IS THE NEW BUTTON --- */}
          {/* It calls the onChangePassword function passed down from the parent dashboard page */}
          <button 
            onClick={onChangePassword}
            className="px-3 sm:px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 text-xs sm:text-sm transition-colors"
          >
            Change Password
          </button>
          <button 
            onClick={onLogout} 
            className="px-3 sm:px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 text-xs sm:text-sm transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
