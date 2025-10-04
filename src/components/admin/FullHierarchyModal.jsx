'use client';

import { useState, useEffect, useCallback } from 'react';
import { getHierarchy } from '../../services/apiService'; 
import HierarchyNode from './HierarchyNode';

// Simple inline SVG loader
const Loader = () => (
    <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export default function FullHierarchyModal({ onClose }) {
  const [hierarchyData, setHierarchyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFullHierarchy = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetches the entire hierarchy starting from the user with ID 'admin'
      const data = await getHierarchy('admin');
      setHierarchyData(data);
    } catch (err) {
      console.error("Failed to fetch full hierarchy", err);
      setError('Could not load the company hierarchy. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFullHierarchy();
  }, [fetchFullHierarchy]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">Full Company Hierarchy</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </header>

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <Loader />
          ) : error ? (
            <p className="text-center text-red-600 font-semibold">{error}</p>
          ) : hierarchyData ? (
            <div className="border-l-2 border-stone-200 pl-2">
                <HierarchyNode user={hierarchyData} /> 
            </div>
          ) : (
            <p className="text-center text-gray-500">No hierarchy data found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
