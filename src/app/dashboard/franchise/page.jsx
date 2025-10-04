'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import {
  getDownline,
  createSale,
  getPendingPayoutForUser,
  getHierarchy,
  getMasterProductList,
  getUsersByRole
} from '../../../services/apiService';
import DashboardHeader from '../../../components/DashboardHeader';
import HierarchyNode from '../../../components/admin/HierarchyNode';
import UserFormModal from '../../../components/UserFormModal'; // 1. IMPORT the new modal
import toast from 'react-hot-toast';

// Simple inline SVG loader
const Loader = () => (
    <div className="flex justify-center items-center h-screen">
        <svg width="80" height="80" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#166534">
            <g fill="none" fillRule="evenodd"><g transform="translate(1 1)" strokeWidth="2"><circle strokeOpacity=".5" cx="18" cy="18" r="18"/><path d="M36 18c0-9.94-8.06-18-18-18"><animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/></path></g></g>
        </svg>
    </div>
);

export default function FranchiseDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [masterProducts, setMasterProducts] = useState([]);
  const [downline, setDownline] = useState([]);
  const [allFarmers, setAllFarmers] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [analytics, setAnalytics] = useState({ pending: 0, teamSize: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false); // 2. ADD state for the modal

  // Form states
  const [sellToDistributorProductId, setSellToDistributorProductId] = useState('');
  const [sellToDistributorQuantity, setSellToDistributorQuantity] = useState(1);
  const [sellToDistributorId, setSellToDistributorId] = useState('');
  
  const [sellToFarmerProductId, setSellToFarmerProductId] = useState('');
  const [sellToFarmerQuantity, setSellToFarmerQuantity] = useState(1);
  const [sellToFarmerId, setSellToFarmerId] = useState('');

  const selectedProductForDistributor = masterProducts.find(p => p.id === sellToDistributorProductId);
  const selectedProductForFarmer = masterProducts.find(p => p.id === sellToFarmerProductId);

  const fetchData = useCallback(async () => {
    if (user) {
      // No need to set loading to true here, as it's handled by the initial load
      try {
        const [masterList, downlineData, payoutData, hierarchyData, farmersData] = await Promise.all([
          getMasterProductList(),
          getDownline(user.userId),
          getPendingPayoutForUser(user.userId),
          getHierarchy(user.userId),
          getUsersByRole('Farmer') 
        ]);
        setMasterProducts(masterList);
        setDownline(downlineData);
        setAnalytics({ pending: payoutData.pendingBalance, teamSize: downlineData.length });
        setHierarchy(hierarchyData);
        setAllFarmers(farmersData);
      } catch (error) {
        toast.error("Could not load all dashboard data.");
      } finally {
        if(isLoading) setIsLoading(false); // Only set loading to false on the first fetch
      }
    }
  }, [user, isLoading]); // Dependency on isLoading to manage the initial load state

  useEffect(() => {
    if (user) fetchData();
  }, [user]); // Initial fetch when user is available

  const handleLogout = () => { logout(); router.push('/'); };
  useEffect(() => { if (user && user.role !== 'Franchise') router.push('/'); }, [user, router]);

  const handleSellToDistributor = async (e) => {
    e.preventDefault();
    if (!sellToDistributorProductId || !sellToDistributorId || sellToDistributorQuantity < 1) return toast.error("Please fill all fields for the sale.");
    if (parseInt(sellToDistributorQuantity) > (selectedProductForDistributor?.stock || 0)) return toast.error(`Not enough master stock.`);
    try {
      await createSale({ buyerId: sellToDistributorId, productId: sellToDistributorProductId, quantity: parseInt(sellToDistributorQuantity) });
      toast.success('Sale to distributor recorded successfully!');
      setSellToDistributorProductId('');
      setSellToDistributorQuantity(1);
      setSellToDistributorId('');
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleSellToFarmer = async (e) => {
    e.preventDefault();
    if (!sellToFarmerProductId || !sellToFarmerId || sellToFarmerQuantity < 1) return toast.error("Please fill all fields for the sale.");
    if (parseInt(sellToFarmerQuantity) > (selectedProductForFarmer?.stock || 0)) return toast.error(`Not enough master stock.`);
    try {
      await createSale({ buyerId: sellToFarmerId, productId: sellToFarmerProductId, quantity: parseInt(sellToFarmerQuantity) });
      toast.success('Sale to farmer recorded successfully!');
      setSellToFarmerProductId('');
      setSellToFarmerQuantity(1);
      setSellToFarmerId('');
      fetchData();
    } catch (error) { console.error(error); }
  };

  if (!user || isLoading) {
    return <Loader />;
  }

  return (
    <>
      {/* 3. RENDER the new modal */}
      <UserFormModal 
        isOpen={isRecruitModalOpen}
        onClose={() => setIsRecruitModalOpen(false)}
        onUserAdded={fetchData} // Refresh data on success
        uplineId={user.id}
        roleToCreate="Distributor"
      />

      <div className="min-h-screen bg-stone-50">
        <DashboardHeader title="Franchise Dashboard" userName={user.name} onLogout={handleLogout} />
        <main className="container mx-auto p-6 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center"><h3 className="text-stone-500 text-sm font-semibold uppercase">Pending Payout</h3><p className="text-4xl font-bold text-red-600 mt-2">₹{analytics.pending.toFixed(2)}</p></div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center"><h3 className="text-stone-500 text-sm font-semibold uppercase">Team Size (Distributors)</h3><p className="text-4xl font-bold text-teal-600 mt-2">{analytics.teamSize}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sell to Distributor</h2>
                <form onSubmit={handleSellToDistributor} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Product</label>
                        <select value={sellToDistributorProductId} onChange={(e) => setSellToDistributorProductId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                            <option value="">Select a product</option>
                            {masterProducts.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Quantity</label>
                        <input type="number" value={sellToDistributorQuantity} onChange={(e) => setSellToDistributorQuantity(e.target.value)} className="w-full mt-1 p-2 border rounded-md" min="1" max={selectedProductForDistributor?.stock || 0} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Sell To</label>
                        <select value={sellToDistributorId} onChange={(e) => setSellToDistributorId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                            <option value="">Select a distributor</option>
                            {downline.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full mt-2 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700">Complete Sale</button>
                </form>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sell Directly to Farmer</h2>
                <form onSubmit={handleSellToFarmer} className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium">Product</label>
                      <select value={sellToFarmerProductId} onChange={(e) => setSellToFarmerProductId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                          <option value="">Select a product</option>
                          {masterProducts.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium">Quantity</label>
                      <input type="number" value={sellToFarmerQuantity} onChange={(e) => setSellToFarmerQuantity(e.target.value)} className="w-full mt-1 p-2 border rounded-md" min="1" max={selectedProductForFarmer?.stock || 0} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium">Sell To Farmer</label>
                      <select value={sellToFarmerId} onChange={(e) => setSellToFarmerId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                          <option value="">Select a farmer</option>
                          {allFarmers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.userId})</option>)}
                      </select>
                  </div>
                  <button type="submit" className="w-full mt-2 py-3 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700">Complete Farmer Sale</button>
                </form>
              </div>
              
              {/* 4. REPLACE the old form with a button */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recruit Distributor</h2>
                <p className="text-gray-600 mb-4">Click the button below to add a new distributor to your downline with all their required details.</p>
                <button 
                  onClick={() => setIsRecruitModalOpen(true)}
                  className="w-full mt-2 py-3 bg-teal-600 text-white font-bold rounded-md hover:bg-teal-700"
                >
                  Recruit New Distributor
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Master Product Inventory</h2>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left">
                    <thead><tr className="bg-stone-100 text-stone-600 uppercase text-sm sticky top-0"><th className="p-3">Product Name</th><th className="p-3">Total Available Stock</th></tr></thead>
                    <tbody>
                      {masterProducts.length > 0 ? masterProducts.map(p => (
                        <tr key={p.id} className="border-b"><td className="p-3">{p.name}</td><td className="p-3 font-medium">{p.stock} Units</td></tr>
                      )) : <tr><td colSpan="2" className="p-3 text-center">No products found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Team Hierarchy</h2>
                 <div className="overflow-y-auto max-h-96 pl-2 border-l-2 border-stone-200">
                  {hierarchy ? (
                    <HierarchyNode user={hierarchy} />
                  ) : (
                    <p className="text-gray-500 text-center">No downline hierarchy to display.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

