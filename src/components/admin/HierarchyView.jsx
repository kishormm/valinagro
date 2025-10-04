'use client';

import { useState } from 'react';
import { getHierarchy } from '@/services/apiService'; 
import HierarchyNode from './HierarchyNode';
import { ThreeDots } from 'react-loader-spinner';
import FullHierarchyModal from './FullHierarchyModal'; 

export default function HierarchyView() {
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); 

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) {
      setError("Please enter a User ID to search.");
      return;
    }
    setIsSearching(true);
    setSearchResult(null);
    setError('');
    try {
      const data = await getHierarchy(searchInput);
      setSearchResult(data);
    } catch (err) {
      setError(`User with ID "${searchInput}" not found or an error occurred.`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {isModalOpen && <FullHierarchyModal onClose={() => setIsModalOpen(false)} />}
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Hierarchy</h2>
        
        <div className="bg-stone-50 p-4 rounded-md border border-stone-200 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
            <div className="flex-grow">
              <label htmlFor="userIdInput" className="block text-sm font-medium text-gray-600 mb-1">Search for a Specific User</label>
              <input
                id="userIdInput"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter User ID "
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="self-end">
              <button 
                type="submit"
                disabled={isSearching}
                className="w-32 h-10 flex justify-center items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md"
              >
                {isSearching ? <ThreeDots color="#FFF" height={20} width={40} /> : 'Search'}
              </button>
            </div>
            <div className="self-end">
               <button 
                type="button"
                onClick={() => setIsModalOpen(true)} 
                className="w-48 h-10 px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700"
              >
                Show Full Hierarchy
              </button>
            </div>
          </form>
        </div>
        
        <div className="min-h-[200px] border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Search Result:</h3>
          {isSearching ? (
              <div className="flex justify-center items-center h-32">
                  <ThreeDots color="#166534" height={60} width={60} />
              </div>
          ) : (
              <>
                  {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                  {searchResult ? (
                    <HierarchyNode user={searchResult} />
                  ) : (
                    <p className="text-gray-500 text-center">Search for a user to see their specific hierarchy here.</p>
                  )}
              </>
          )}
        </div>
      </div>
    </>
  );
}