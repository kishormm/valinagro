'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPendingPayouts, createPayout } from '@/services/apiService';
import toast from 'react-hot-toast';

const Loader = () => (
    <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export default function PayoutsView() {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const roles = [
    { label: 'All', value: 'All' },
    { label: 'Franchises', value: 'Franchise' },
    { label: 'Distributors', value: 'Distributor' },
    { label: 'Sub-Distributors', value: 'SubDistributor' }, 
    { label: 'Dealers', value: 'Dealer' },
  ];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPendingPayouts();
      setPayouts(data);
    } catch (error) {
      console.error("Failed to fetch pending payouts:", error);
      toast.error("Could not load payout data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePay = async (userToPay) => {
    if (window.confirm(`Are you sure you want to pay ₹${userToPay.pendingBalance.toFixed(2)} to ${userToPay.name}?`)) {
      try {
        await createPayout({ userId: userToPay.id, amount: userToPay.pendingBalance });
        toast.success('Payment recorded successfully!');
        fetchData(); 
      } catch (error) {
        console.error("Failed to record payment:", error);
        toast.error("Failed to record payment.");
      }
    }
  };

  const filteredPayouts = useMemo(() => {
    if (filter === 'All') return payouts;
    return payouts.filter(p => p.role === filter);
  }, [filter, payouts]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Pending Payouts</h2>

      <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
        {roles.map(role => (
          <button
            key={role.value}
            onClick={() => setFilter(role.value)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              filter === role.value ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                <th className="p-3 font-semibold">User Name</th>
                <th className="p-3 font-semibold">User ID</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold">Pending Amount</th>
                <th className="p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.length > 0 ? (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id} className="border-b border-stone-200 hover:bg-stone-50">
                    <td className="p-3 text-gray-800">{payout.name}</td>
                    <td className="p-3 text-gray-800">{payout.userId}</td>
                    <td className="p-3 text-gray-800">{payout.role}</td>
                    <td className="p-3 font-bold text-red-600">₹{payout.pendingBalance.toFixed(2)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handlePay(payout)}
                        className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700"
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">No pending payouts found for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


