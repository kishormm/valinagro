'use client';

export default function DashboardHeader({ title, userName, onLogout }) {
  return (
    <header className="bg-green-900 text-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-green-200">Welcome, {userName}!</p>
        </div>
        <button 
          onClick={onLogout} 
          className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 text-sm transition-colors"
        >
          Log Out
        </button>
      </div>
    </header>
  );
}