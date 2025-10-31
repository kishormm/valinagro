'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import {
  getDownline,
  getHierarchy,
  getUserInventory,
  changePassword,
  getPayables,
  getMyPendingCommissions, // UPDATED
} from '../../../services/apiService';
import DashboardHeader from '../../../components/DashboardHeader';
import HierarchyNode from '../../../components/admin/HierarchyNode';
import UserFormModal from '../../../components/UserFormModal';
import ChangePasswordModal from '../../../components/ChangePasswordModal';
import BuyFromAdminForm from '../../../components/BuyFromAdminForm';
import UploadProofModal from '../../../components/UploadProofModal';
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

  const [inventory, setInventory] = useState([]);
  const [downline, setDownline] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [payables, setPayables] = useState([]);
  const [analytics, setAnalytics] = useState({ teamSize: 0, totalProfit: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  const totalAmountDue = payables.reduce((acc, p) => acc + p.totalAmount, 0);

  const fetchData = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      try {
        const [
            inventoryData, 
            downlineData, 
            hierarchyData, 
            payablesData,
            profitData,
        ] = await Promise.all([
          getUserInventory(),
          getDownline(user.userId),
          getHierarchy(user.userId),
          getPayables(),
          getMyPendingCommissions(), // UPDATED
        ]);
        setInventory(inventoryData);
        setDownline(downlineData);
        setAnalytics({ 
            teamSize: downlineData.length,
            totalProfit: profitData.pendingBalance || 0 // UPDATED
        });
        setHierarchy(hierarchyData);
        setPayables(payablesData);
      } catch (error) {
        toast.error("Could not load all dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleOpenUploadModal = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setIsProofModalOpen(true);
  };
  
  const handleCloseProofModal = () => {
    setSelectedTransactionId(null);
    setIsProofModalOpen(false);
    fetchData(); 
  };

  const handlePayNow = (transaction) => {
    toast(`Initiating payment for ₹${transaction.totalAmount.toFixed(2)}...`, { icon: 'ℹ️' });
    // Future Razorpay logic will go here
  };

  const handleLogout = () => { logout(); router.push('/'); };
  
  useEffect(() => { 
    if (user && user.role !== 'Franchise') router.push('/'); 
  }, [user, router]);

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
        roleToCreate="Distributor"
      />
      
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSave={handleSavePassword}
      />

      <UploadProofModal
        isOpen={isProofModalOpen}
        onClose={handleCloseProofModal}
        transactionId={selectedTransactionId}
        onUploadSuccess={handleCloseProofModal}
      />

      <div className="min-h-screen bg-stone-50">
        <DashboardHeader 
          title="Franchise Dashboard" 
          userName={user.name} 
          onLogout={handleLogout} 
          onChangePassword={() => setIsChangePasswordModalOpen(true)}
        />
        <main className="container mx-auto p-6 space-y-8">
          {/* Analytics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Pending Commissions</h3>
              <p className="text-4xl font-bold text-red-600 mt-2">₹{analytics.totalProfit.toFixed(2)}</p> 
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Total Amount Due (to Admin)</h3>
              <p className="text-4xl font-bold text-orange-600 mt-2">₹{totalAmountDue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Team Size</h3>
              <p className="text-4xl font-bold text-teal-600 mt-2">{analytics.teamSize}</p>
            </div>
          </div>

          {/* Pending Payments Section (Payables to Admin) */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
             <h2 className="text-2xl font-semibold text-gray-700 mb-4">Pending Payments to Admin</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                     <th className="p-3">Date</th>
                     <th className="p-3">Product</th>
                     <th className="p-3">Owed To</th>
                     <th className="p-3 text-right">Amount</th>
                     <th className="p-3 text-center">Proof Status</th>
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
                         {p.paymentProofUrl ? (
                           <a href={p.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 font-semibold hover:underline">
                             Uploaded
                           </a>
                         ) : (
                           <span className="text-xs text-gray-500">Not Uploaded</span>
                         )}
                       </td>
                       <td className="p-3 text-center flex justify-center gap-2">
                         <button
                           onClick={() => handlePayNow(p)} 
                           className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400"
                           disabled={!!p.paymentProofUrl}
                         >
                           Pay Now
                         </button>
                         <button
                           onClick={() => handleOpenUploadModal(p.id)} 
                           className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                           disabled={!!p.paymentProofUrl}
                         >
                           {p.paymentProofUrl ? 'Proof Uploaded' : 'Upload Proof'}
                         </button>
                       </td>
                     </tr>
                   )) : (
                     <tr><td colSpan="6" className="p-4 text-center text-gray-500">You have no pending payments to Admin.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>

          {/* Purchase Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Purchase Directly from Admin</h2>
            <BuyFromAdminForm onPurchaseSuccess={fetchData} /> 
          </div>

          {/* Grid for Inventory, Hierarchy etc. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-8">
               <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Recruit Distributor</h2>
                <p className="text-gray-600 mb-4">Click the button below to add a new distributor to your downline.</p>
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
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Inventory</h2>
                <div className="overflow-x-auto max-h-96">
                   <table className="w-full text-left">
                     <thead><tr className="bg-stone-100 text-stone-600 uppercase text-sm sticky top-0"><th className="p-3">Product Name</th><th className="p-3">Your Stock</th></tr></thead>
                     <tbody>
                       {inventory.length > 0 ? inventory.map(item => (
                           <tr key={item.id} className="border-b"><td className="p-3">{item.product.name}</td><td className="p-3 font-medium">{item.quantity} Units</td></tr>
                       )) : (
                           <tr><td colSpan="2" className="p-3 text-center text-gray-500">Your inventory is empty. Buy from Admin to add stock.</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">My Team Hierarchy</h2>
                <div className="overflow-y-auto max-h-96 pl-2 border-l-2 border-stone-200">
                  {hierarchy ? <HierarchyNode user={hierarchy} /> : <p className="text-gray-500 text-center">No downline hierarchy to display.</p>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}