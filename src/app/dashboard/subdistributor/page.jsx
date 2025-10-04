'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { 
  getDownline, 
  createSale, 
  getPendingPayoutForUser,
  getUserInventory,
  getHierarchy,
  getUsersByRole, // 1. IMPORT to get farmer list
  addUser
} from '../../../services/apiService';
import DashboardHeader from '../../../components/DashboardHeader';
import HierarchyNode from '../../../components/admin/HierarchyNode';
import UserFormModal from '../../../components/UserFormModal'; // 2. IMPORT the new modal
import toast from 'react-hot-toast';

// Simple inline SVG loader
const Loader = () => (
    <div className="flex justify-center items-center h-screen">
        <svg width="80" height="80" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#166534">
            <g fill="none" fillRule="evenodd"><g transform="translate(1 1)" strokeWidth="2"><circle strokeOpacity=".5" cx="18" cy="18" r="18"/><path d="M36 18c0-9.94-8.06-18-18-18"><animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/></path></g></g>
        </svg>
    </div>
);

export default function SubDistributorDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [inventory, setInventory] = useState([]);
  const [downline, setDownline] = useState([]);
  const [allFarmers, setAllFarmers] = useState([]); // 3. ADD state for farmers
  const [hierarchy, setHierarchy] = useState(null);
  const [analytics, setAnalytics] = useState({ pending: 0, teamSize: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false); // 4. ADD state for recruit modal

  // Form states for selling to Dealer
  const [sellToDealerProductId, setSellToDealerProductId] = useState('');
  const [sellToDealerQuantity, setSellToDealerQuantity] = useState(1);
  const [sellToDealerId, setSellToDealerId] = useState('');
  
  // 5. ADD form states for selling to Farmer
  const [sellToFarmerProductId, setSellToFarmerProductId] = useState('');
  const [sellToFarmerQuantity, setSellToFarmerQuantity] = useState(1);
  const [sellToFarmerId, setSellToFarmerId] = useState('');

  const selectedProductForDealer = inventory.find(item => item.productId === sellToDealerProductId);
  const selectedProductForFarmer = inventory.find(item => item.productId === sellToFarmerProductId);

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        // 6. FETCH the list of all farmers
        const [inventoryData, downlineData, payoutData, hierarchyData, farmersData] = await Promise.all([
          getUserInventory(),
          getDownline(user.userId),
          getPendingPayoutForUser(user.userId),
          getHierarchy(user.userId),
          getUsersByRole('Farmer')
        ]);
        setInventory(inventoryData);
        setDownline(downlineData);
        setAnalytics({ pending: payoutData.pendingBalance, teamSize: downlineData.length });
        setHierarchy(hierarchyData);
        setAllFarmers(farmersData); // 7. SET the farmer list
      } catch (error) {
        toast.error("Could not load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if(user) {
        setIsLoading(true);
        fetchData();
    }
  }, [user]);

  const handleLogout = () => { logout(); router.push('/'); };
  useEffect(() => { if (user && user.role !== 'SubDistributor') router.push('/'); }, [user, router]);
  
  const handleSellToDealer = async (e) => {
    e.preventDefault();
    if (!sellToDealerProductId || !sellToDealerId || sellToDealerQuantity < 1) return toast.error("Please fill all fields.");
    if (parseInt(sellToDealerQuantity) > (selectedProductForDealer?.quantity || 0)) return toast.error(`Not enough stock.`);
    try {
      await createSale({ buyerId: sellToDealerId, productId: sellToDealerProductId, quantity: parseInt(sellToDealerQuantity) });
      toast.success('Sale to Dealer recorded successfully!');
      setSellToDealerProductId(''); setSellToDealerQuantity(1); setSellToDealerId('');
      fetchData();
    } catch (error) { console.error(error); }
  };
  
  // 8. ADD a new handler for selling to farmers
  const handleSellToFarmer = async (e) => {
    e.preventDefault();
    if (!sellToFarmerProductId || !sellToFarmerId || sellToFarmerQuantity < 1) return toast.error("Please fill all fields.");
    if (parseInt(sellToFarmerQuantity) > (selectedProductForFarmer?.quantity || 0)) return toast.error(`Not enough stock.`);
    try {
      await createSale({ buyerId: sellToFarmerId, productId: sellToFarmerProductId, quantity: parseInt(sellToFarmerQuantity) });
      toast.success('Sale to Farmer recorded successfully!');
      setSellToFarmerProductId(''); setSellToFarmerQuantity(1); setSellToFarmerId('');
      fetchData();
    } catch (error) { console.error(error); }
  };

  if (!user || isLoading) {
    return <Loader />;
  }

  return (
    <>
      {/* 9. RENDER the new modal */}
      <UserFormModal 
        isOpen={isRecruitModalOpen}
        onClose={() => setIsRecruitModalOpen(false)}
        onUserAdded={fetchData}
        uplineId={user.id}
        roleToCreate="Dealer"
      />

      <div className="min-h-screen bg-stone-50">
        <DashboardHeader title="Sub-Distributor Dashboard" userName={user.name} onLogout={handleLogout} />
        <main className="container mx-auto p-6 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center"><h3 className="text-stone-500 text-sm font-semibold uppercase">Pending Payout</h3><p className="text-4xl font-bold text-red-600 mt-2">₹{analytics.pending?.toFixed(2) || '0.00'}</p></div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center"><h3 className="text-stone-500 text-sm font-semibold uppercase">Team Size (Dealers)</h3><p className="text-4xl font-bold text-teal-600 mt-2">{analytics.teamSize}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sell to Dealer</h2>
                <form onSubmit={handleSellToDealer} className="space-y-4">
                   <div>
                    <label className="block text-sm font-medium">Product</label>
                    <select value={sellToDealerProductId} onChange={(e) => setSellToDealerProductId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                      <option value="">Select a product</option>
                      {inventory.map(item => <option key={item.id} value={item.productId}>{item.product.name} (Your Stock: {item.quantity})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Quantity</label>
                    <input type="number" value={sellToDealerQuantity} onChange={(e) => setSellToDealerQuantity(e.target.value)} className="w-full mt-1 p-2 border rounded-md" min="1" max={selectedProductForDealer?.quantity || 0} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Sell To</label>
                    <select value={sellToDealerId} onChange={(e) => setSellToDealerId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                        <option value="">Select Dealer</option>
                        {downline.map(d => <option key={d.id} value={d.id}>{d.name} ({d.userId})</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full mt-2 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700">Complete Sale</button>
                </form>
              </div>

              {/* 10. ADD the "Sell to Farmer" form card */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sell Directly to Farmer</h2>
                <form onSubmit={handleSellToFarmer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Product</label>
                    <select value={sellToFarmerProductId} onChange={(e) => setSellToFarmerProductId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                      <option value="">Select a product</option>
                      {inventory.map(item => <option key={item.id} value={item.productId}>{item.product.name} (Your Stock: {item.quantity})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Quantity</label>
                    <input type="number" value={sellToFarmerQuantity} onChange={(e) => setSellToFarmerQuantity(e.target.value)} className="w-full mt-1 p-2 border rounded-md" min="1" max={selectedProductForFarmer?.quantity || 0} />
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

              {/* 11. REPLACE the old recruit form with a button */}
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recruit Dealer</h2>
                <p className="text-gray-600 mb-4">Click the button below to add a new dealer to your downline.</p>
                <button 
                  onClick={() => setIsRecruitModalOpen(true)}
                  className="w-full mt-2 py-3 bg-teal-600 text-white font-bold rounded-md hover:bg-teal-700"
                >
                  Recruit New Dealer
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Inventory</h2>
                 <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left">
                        <thead><tr className="bg-stone-100 text-stone-600 uppercase text-sm sticky top-0"><th className="p-3">Product Name</th><th className="p-3">Your Stock</th></tr></thead>
                        <tbody>
                            {inventory.length > 0 ? inventory.map(item => (
                                <tr key={item.id} className="border-b"><td className="p-3">{item.product.name}</td><td className="p-3 font-medium">{item.quantity} Units</td></tr>
                            )) : <tr><td colSpan="2" className="p-3 text-center">Your inventory is empty.</td></tr>}
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

