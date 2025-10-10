'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import {
  getUplineInventory,
  getPayables,
  payTransaction,
  changePassword,
  createSale // ADDED to make "Buy Now" work
} from '../../../services/apiService';
import DashboardHeader from '../../../components/DashboardHeader';
import ChangePasswordModal from '../../../components/ChangePasswordModal';
import toast from 'react-hot-toast';

// Loader
const Loader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <svg className="animate-spin h-10 w-10 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
    <span className="ml-4 text-orange-600 text-lg font-semibold">Loading...</span>
  </div>
);

export default function FarmerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [availableProducts, setAvailableProducts] = useState([]);
  const [payables, setPayables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const totalAmountDue = payables.reduce((acc, p) => acc + p.totalAmount, 0);

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        const [uplineStock, payablesData] = await Promise.all([
          getUplineInventory(),
          getPayables()
        ]);
        setAvailableProducts(uplineStock);
        setPayables(payablesData);
      } catch (error) {
        toast.error("Could not load dashboard data.");
      } finally {
        if (isLoading) setIsLoading(false);
      }
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    if (user && user.role !== 'Farmer') router.push('/');
  }, [user, router]);

  const handleLogout = () => { logout(); router.push('/'); };

  // ADDED this handler to make "Buy Now" buttons functional
  const handlePurchase = async (productId, quantity) => {
    if (quantity < 1) {
      toast.error("Please enter a valid quantity.");
      return false; // Indicate failure
    }
    try {
      // The createSale API knows that a Farmer buying from their upline is the default flow
      await createSale({ productId, quantity: parseInt(quantity) });
      toast.success('Purchase successful! A new pending payment has been created.');
      fetchData(); // Re-fetch all data to show new pending payment and updated stock
      return true; // Indicate success
    } catch (error) {
      console.error("Purchase failed:", error);
      // apiService will show the error toast
      return false; // Indicate failure
    }
  };

  const handlePayTransaction = async (transactionId, sellerName) => {
    if (window.confirm(`Confirm payment to ${sellerName}?`)) {
      try {
        await payTransaction(transactionId);
        toast.success('Payment completed successfully!');
        fetchData();
      } catch (error) {
        console.error("Payment failed:", error);
      }
    }
  };

  const handleSavePassword = async (passwordData) => { /* ... */ };

  if (!user || isLoading) return <Loader />;

  return (
    <>
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSave={handleSavePassword}
      />

      <div className="min-h-screen bg-stone-50">
        <DashboardHeader
          title="Farmer Dashboard"
          userName={user.name}
          onLogout={handleLogout}
          onChangePassword={() => setIsChangePasswordModalOpen(true)}
        />

        <main className="container mx-auto p-6 space-y-8">
          {/* Analytics Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Total Amount Due</h3>
              <p className="text-4xl font-bold text-orange-600 mt-2">₹{totalAmountDue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Products Available</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">{availableProducts.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-stone-500 text-sm font-semibold uppercase">Payments Pending</h3>
              <p className="text-4xl font-bold text-red-600 mt-2">{payables.length}</p>
            </div>
          </div>

          {/* Pending Payments Section (Payables) */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Pending Payments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                    <th className="p-3">Date</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Owed To</th> {/* NEW COLUMN */}
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.length > 0 ? (
                    payables.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 font-medium">{p.product.name} (x{p.quantity})</td>
                        {/* NEW CELL for seller name and role */}
                        <td className="p-3">{p.seller.name} <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{p.seller.role}</span></td>
                        <td className="p-3 font-bold text-right">₹{p.totalAmount.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handlePayTransaction(p.id, p.seller.name)}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700"
                          >
                            Pay Now
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        You have no pending payments.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upline Store Section */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Buy Products from Your Dealer</h2>
            {availableProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableProducts.map((item) => (
                  <ProductCard key={item.id} item={item} onPurchase={handlePurchase} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-6">No products available from your dealer.</p>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

// Product Card Component UPDATED with functional "Buy Now" button
function ProductCard({ item, onPurchase }) {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { product, quantity: dealerStock } = item;

  const handleBuyClick = async () => {
    setIsSubmitting(true);
    const success = await onPurchase(product.id, quantity);
    if (success) {
      setQuantity(1); // Reset on success
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-stone-200 flex flex-col">
      <div className="p-4 flex-grow">
        <h3 className="text-lg font-bold text-gray-800 leading-tight">{product.name}</h3>
        <p className="text-sm text-gray-500">Available: {dealerStock} Units</p>
        <p className="text-2xl text-green-600 font-bold my-4">₹{product.farmerPrice?.toFixed(2) || '0.00'}</p>
      </div>
      <div className="mt-auto p-4 border-t border-stone-200 bg-stone-50 rounded-b-lg">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20 p-2 border border-gray-300 rounded-md"
            min="1"
            max={dealerStock}
            disabled={isSubmitting}
          />
          <button
            onClick={handleBuyClick}
            className="w-full h-10 flex justify-center items-center px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400"
            disabled={isSubmitting || dealerStock < 1}
          >
            {isSubmitting ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}