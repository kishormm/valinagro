'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { createSale, getUplineInventory } from '../../../services/apiService'; 
import DashboardHeader from '../../../components/DashboardHeader';
import toast from 'react-hot-toast';

// Using the self-contained SVG loader for consistency
const Loader = () => (
  <div className="flex justify-center items-center h-screen bg-stone-50">
    <svg width="80" height="80" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#166534">
        <g fill="none" fillRule="evenodd"><g transform="translate(1 1)" strokeWidth="2"><circle strokeOpacity=".5" cx="18" cy="18" r="18"/><path d="M36 18c0-9.94-8.06-18-18-18"><animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/></path></g></g>
    </svg>
  </div>
);

export default function FarmerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [availableProducts, setAvailableProducts] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  const fetchDealerStock = useCallback(async () => {
    if (user) {
        try {
          const data = await getUplineInventory();
          setAvailableProducts(data);
        } catch (error) {
          console.error("Failed to fetch dealer's stock:", error);
          toast.error("Could not load products from your dealer.");
        } finally {
          setIsLoading(false);
        }
    }
  }, [user]);

  useEffect(() => {
    // This ensures data is fetched only once when the user is available
    if (user) {
        setIsLoading(true);
        fetchDealerStock();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role !== 'Farmer') {
      router.push('/');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handlePurchase = async (productId, quantity) => {
    if (quantity < 1) {
      toast.error("Please enter a valid quantity.");
      return false;
    }
    try {
      await createSale({ 
        productId, 
        quantity: parseInt(quantity) 
      });
      toast.success('Purchase successful! Your dealer will be notified.');
      fetchDealerStock(); // Re-fetch to show the dealer's updated stock
      return true;
    } catch (error) {
      console.error("Purchase failed:", error);
      // The apiService now handles showing the error toast
      return false;
    }
  };

  if (!user || isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <DashboardHeader title="Farmer's Store" userName={user.name} onLogout={handleLogout} />
      
      <main className="container mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Products From Your Dealer</h2>
          {availableProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {availableProducts.map(item => (
                <ProductCard key={item.id} item={item} onPurchase={handlePurchase} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">Your assigned dealer currently has no products in stock.</p>
          )}
        </div>
      </main>
    </div>
  );
}

function ProductCard({ item, onPurchase }) {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { product, quantity: dealerStock } = item;

  const handleBuyClick = async () => {
    setIsSubmitting(true);
    const success = await onPurchase(product.id, quantity);
    if (success) {
      setQuantity(1);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-stone-200 flex flex-col">
      <div className="p-4 flex-grow">
        <h3 className="text-lg font-bold text-gray-800 leading-tight">{product.name}</h3>
        <p className="text-sm text-gray-500">Available from dealer: {dealerStock} Units</p>
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
            {isSubmitting ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

