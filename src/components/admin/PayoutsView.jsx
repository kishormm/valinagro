'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getReceivables } from '@/services/apiService';
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
  const [receivables, setReceivables] = useState({ transactions: [], total: 0 });
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
    // No need to set loading true on re-fetch, only on initial load
    try {
      const data = await getReceivables();
      setReceivables(data);
    } catch (error) {
      console.error("Failed to fetch pending receivables:", error);
      toast.error("Could not load pending payments data.");
    } finally {
      if (isLoading) setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredReceivables = useMemo(() => {
    if (filter === 'All') return receivables.transactions;
    return receivables.transactions.filter(t => t.buyer.role === filter);
  }, [filter, receivables.transactions]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-2xl font-semibold text-gray-700">Payments to Admin</h2>
            <p className="text-sm text-gray-500">List of pending and recently completed payments from your downline.</p>
        </div>
        <div className="text-right">
            <h3 className="text-stone-500 text-sm font-semibold uppercase">Total Amount Receivable (Pending)</h3>
            <p className="text-3xl font-bold text-red-600 mt-1">₹{receivables.total.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-y py-4">
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
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Owed By</th>
                <th className="p-3 font-semibold">Product</th>
                <th className="p-3 font-semibold text-right">Amount</th>
                <th className="p-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceivables.length > 0 ? (
                filteredReceivables.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-stone-200 hover:bg-stone-50">
                    <td className="p-3 text-gray-800">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-gray-800 font-medium">{transaction.buyer.name} ({transaction.buyer.userId})</td>
                    <td className="p-3 text-gray-800">{transaction.product.name} (x{transaction.quantity})</td>
                    <td className="p-3 font-bold text-right">₹{transaction.totalAmount.toFixed(2)}</td>
                    <td className="p-3 text-center">
                        {/* CONDITIONAL RENDERING FOR STATUS */}
                        {transaction.paymentStatus === 'PENDING' ? (
                            <span className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">
                                Pending
                            </span>
                        ) : (
                            <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                                Paid
                            </span>
                        )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500">No pending or recent payments found for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}