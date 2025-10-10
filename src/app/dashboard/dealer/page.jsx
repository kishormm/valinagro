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
  getUsersByRole,
  changePassword,
  getPayables,
  getReceivables,
  payTransaction,
} from '../../../services/apiService';
import DashboardHeader from '../../../components/DashboardHeader';
import HierarchyNode from '../../../components/admin/HierarchyNode';
import UserFormModal from '../../../components/UserFormModal';
import ChangePasswordModal from '../../../components/ChangePasswordModal';
import UplineProductStore from '../../../components/UplineProductStore';
import toast from 'react-hot-toast';

// Simple inline SVG loader
const Loader = () => (
    <div className="flex justify-center items-center h-screen">
        <svg width="80" height="80" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#166534">
            <g fill="none" fillRule="evenodd"><g transform="translate(1 1)" strokeWidth="2"><circle strokeOpacity=".5" cx="18" cy="18" r="18"/><path d="M36 18c0-9.94-8.06-18-18-18"><animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/></path></g></g>
        </svg>
    </div>
);

export default function DealerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [inventory, setInventory] = useState([]);
  const [downline, setDownline] = useState([]);
  const [allFarmers, setAllFarmers] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [payables, setPayables] = useState([]);
  const [receivables, setReceivables] = useState({ transactions: [], total: 0 });
  const [analytics, setAnalytics] = useState({ teamSize: 0, totalProfit: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Form states for selling to Farmer
  const [sellProductId, setSellProductId] = useState('');
  const [sellQuantity, setSellQuantity] = useState(1);
  const [sellToId, setSellToId] = useState('');
  
  const selectedProductInStock = inventory.find(item => item.productId === sellProductId);

  const totalAmountDue = payables.reduce((acc, p) => acc + p.totalAmount, 0);

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        const [
          inventoryData, 
          downlineData, 
          hierarchyData, 
          farmersData, 
          payablesData, 
          receivablesData,
          profitData,
        ] = await Promise.all([
          getUserInventory(),
          getDownline(user.userId),
          getHierarchy(user.userId),
          getUsersByRole('Farmer'),
          getPayables(),
          getReceivables(),
          getPendingPayoutForUser(user.userId),
        ]);
        setInventory(inventoryData);
        setDownline(downlineData);
        setAnalytics({ 
          teamSize: downlineData.length,
          totalProfit: profitData.totalProfit || 0
        });
        setHierarchy(hierarchyData);
        setAllFarmers(farmersData);
        setPayables(payablesData);
        setReceivables(receivablesData);
      } catch (error) {
        toast.error("Could not load all dashboard data.");
      } finally {
        if(isLoading) setIsLoading(false);
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    if(user) fetchData();
  }, [user, fetchData]);

  const handlePayTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to complete this payment?')) {
      try {
        await payTransaction(transactionId);
        toast.success('Payment successful!');
        fetchData();
      } catch (error) {
        console.error("Payment failed:", error);
      }
    }
  };

  const handleLogout = () => { logout(); router.push('/'); };
  
  useEffect(() => { 
    if (user && user.role !== 'Dealer') router.push('/'); 
  }, [user, router]);
  
  const handleSellToFarmer = async (e) => {
    e.preventDefault();
    if (!sellProductId || !sellToId || sellQuantity < 1) return toast.error("Please fill all fields for the sale.");
    if (parseInt(sellQuantity) > (selectedProductInStock?.quantity || 0)) return toast.error(`Not enough stock.`);
    try {
      await createSale({ buyerId: sellToId, productId: sellProductId, quantity: parseInt(sellQuantity) });
      toast.success('Sale to Farmer recorded successfully!');
      setSellProductId(''); setSellQuantity(1); setSellToId('');
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleSavePassword = async (passwordData) => {
    try {
        await changePassword(passwordData);
        toast.success('Password changed successfully!');
        setIsChangePasswordModalOpen(false);
    } catch (error) {
        console.error("Failed to change password:", error);
    }
  };

  if (!user || isLoading) {
    return <Loader />;
  }

  return (
    <>
      <UserFormModal 
        isOpen={isRecruitModalOpen}
        onClose={() => setIsRecruitModalOpen(false)}
        onUserAdded={fetchData}
        uplineId={user.id}
        roleToCreate="Farmer"
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSave={handleSavePassword}
      />

      <div className="min-h-screen bg-stone-50">
        <DashboardHeader 
          title="Dealer Dashboard" 
          userName={user.name} 
          onLogout={handleLogout} 
          onChangePassword={() => setIsChangePasswordModalOpen(true)}
        />
        <main className="container mx-auto p-6 space-y-8">
          {/* Analytics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Pending Payouts</h3>
              <p className="text-4xl font-bold text-red-600 mt-2">₹{receivables.total.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Total Profit Generated</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">₹{analytics.totalProfit.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Total Amount Due</h3>
              <p className="text-4xl font-bold text-orange-600 mt-2">₹{totalAmountDue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Team Size</h3>
              <p className="text-4xl font-bold text-teal-600 mt-2">{analytics.teamSize}</p>
            </div>
          </div>

          {/* Pending Payments Section (Payables) */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Pending Payments to Upline</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                    <th className="p-3">Date</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Owed To</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.length > 0 ? payables.map(p => (
                    <tr key={p.id} className="border-b">
                      <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-medium">{p.product.name} (x{p.quantity})</td>
                      <td className="p-3">{p.seller.name}</td>
                      <td className="p-3 font-bold text-right">₹{p.totalAmount.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handlePayTransaction(p.id)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700"
                        >
                          Pay Now
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" className="p-4 text-center text-gray-500">You have no pending payments.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Payouts Section (Receivables) */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Pending Payments from Downline</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                    <th className="p-3">Date</th>
                    <th className="p-3">Owed By</th>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.transactions.length > 0 ? receivables.transactions.map(t => (
                    <tr key={t.id} className="border-b">
                      <td className="p-3">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">{t.buyer.name}</td>
                      <td className="p-3 font-medium">{t.product.name} (x{t.quantity})</td>
                      <td className="p-3 font-bold text-right">₹{t.totalAmount.toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">No pending payments from your downline.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Purchase Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Purchase from Upline</h2>
            <UplineProductStore userRole={user.role} onPurchaseSuccess={fetchData} />
          </div>

          {/* Sell and Inventory Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Sell to Farmer</h2>
                <form onSubmit={handleSellToFarmer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Product</label>
                    <select value={sellProductId} onChange={(e) => setSellProductId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                      <option value="">Select a product</option>
                      {inventory.map(item => <option key={item.id} value={item.productId}>{item.product.name} (Your Stock: {item.quantity})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Quantity</label>
                    <input type="number" value={sellQuantity} onChange={(e) => setSellQuantity(e.target.value)} className="w-full mt-1 p-2 border rounded-md" min="1" max={selectedProductInStock?.quantity || 0} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Sell To</label>
                    <select value={sellToId} onChange={(e) => setSellToId(e.target.value)} className="w-full mt-1 p-2 border rounded-md">
                        <option value="">Select a Farmer</option>
                        {allFarmers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.userId})</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full mt-2 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700">Complete Sale</button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recruit Farmer</h2>
                <p className="text-gray-600 mb-4">Click the button below to add a new farmer to your downline.</p>
                <button 
                  onClick={() => setIsRecruitModalOpen(true)}
                  className="w-full mt-2 py-3 bg-teal-600 text-white font-bold rounded-md hover:bg-teal-700"
                >
                  Recruit New Farmer
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
                            )) : <tr><td colSpan="2" className="p-3 text-center">Your inventory is empty. Buy from your upline to add stock.</td></tr>}
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