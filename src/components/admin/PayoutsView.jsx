'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getReceivables, verifyPayment, getPendingCommissions, payCommission } from '@/services/apiService';
import toast from 'react-hot-toast';

// Loader Component
const Loader = () => (
    <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

// This is the "Payments to Admin" tab
function PaymentsToAdmin() {
  const [receivables, setReceivables] = useState({ transactions: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [submittingId, setSubmittingId] = useState(null);

  const roles = [
    { label: 'All', value: 'All' },
    { label: 'Franchises', value: 'Franchise' },
    { label: 'Distributors', value: 'Distributor' },
    { label: 'Sub-Distributors', value: 'SubDistributor' }, 
    { label: 'Dealers', value: 'Dealer' },
    { label: 'Farmers', value: 'Farmer' },
  ];

  const fetchData = useCallback(async () => {
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

  const handleVerifyPayment = async (transactionId) => {
    if (window.confirm('Are you sure you want to verify this payment? This action marks the transaction as PAID.')) {
        setSubmittingId(transactionId);
        try {
            await verifyPayment(transactionId);
            toast.success('Payment verified successfully!');
            fetchData();
        } catch (error) {
            console.error("Failed to verify payment:", error);
        } finally {
            setSubmittingId(null);
        }
    }
  };

  const filteredReceivables = useMemo(() => {
    if (filter === 'All') return receivables.transactions;
    return receivables.transactions.filter(t => t.buyer.role === filter);
  }, [filter, receivables.transactions]);

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-2xl font-semibold text-gray-700">Payments to Admin (Receivables)</h2>
            <p className="text-sm text-gray-500">List of pending and recently completed payments from users.</p>
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
      {isLoading ? <Loader /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Owed By</th>
                <th className="p-3 font-semibold">Product</th>
                <th className="p-3 font-semibold text-right">Amount</th>
                <th className="p-3 font-semibold text-center">Status</th>
                <th className="p-3 font-semibold text-center">Proof</th>
                <th className="p-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceivables.length > 0 ? (
                filteredReceivables.map((transaction) => {
                  const isPending = transaction.paymentStatus === 'PENDING';
                  const hasProof = !!transaction.paymentProofUrl;
                  return (
                    <tr key={transaction.id} className="border-b border-stone-200 hover:bg-stone-50">
                      <td className="p-3">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-medium">{transaction.buyer.name} ({transaction.buyer.userId})</td>
                      <td className="p-3">{transaction.product.name} (x{transaction.quantity})</td>
                      <td className="p-3 font-bold text-right">₹{transaction.totalAmount.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        {isPending ? (
                            <span className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Pending</span>
                        ) : (
                            <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Paid</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {hasProof ? (
                            <a href={transaction.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium text-sm">View Proof</a>
                        ) : (
                            <span className="text-gray-400 text-sm">---</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {isPending && hasProof ? (
                            <button onClick={() => handleVerifyPayment(transaction.id)} disabled={submittingId === transaction.id} className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400">
                                {submittingId === transaction.id ? 'Verifying...' : 'Verify'}
                            </button>
                        ) : !isPending ? (
                            <span className="text-green-600 font-semibold text-sm">Verified</span>
                        ) : (
                            <span className="text-gray-400 text-sm">Awaiting Proof</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="7" className="p-4 text-center text-gray-500">No pending or recent payments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// This is the "Commission Payouts" tab
function CommissionPayouts() {
  const [commissions, setCommissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [submittingId, setSubmittingId] = useState(null);

  const roles = [
    { label: 'All', value: 'All' },
    { label: 'Franchises', value: 'Franchise' },
    { label: 'Distributors', value: 'Distributor' },
    { label: 'Sub-Distributors', value: 'SubDistributor' }, 
    { label: 'Dealers', value: 'Dealer' },
  ];

  const fetchData = useCallback(async () => {
    try {
      const data = await getPendingCommissions();
      setCommissions(data);
    } catch (error) {
      console.error("Failed to fetch pending commissions:", error);
      toast.error("Could not load commission data.");
    } finally {
      if (isLoading) setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayCommission = async (userToPay) => {
    if (window.confirm(`Are you sure you want to pay ₹${userToPay.pendingAmount.toFixed(2)} in commission to ${userToPay.name}? This will mark all their pending commissions as PAID.`)) {
        setSubmittingId(userToPay.id);
        try {
            await payCommission({ 
                userId: userToPay.id, 
                amount: userToPay.pendingAmount 
            });
            toast.success('Commission payout successful!');
            fetchData();
        } catch (error) {
            console.error("Failed to pay commission:", error);
        } finally {
            setSubmittingId(null);
        }
    }
  };

  const filteredCommissions = useMemo(() => {
    if (filter === 'All') return commissions;
    return commissions.filter(c => c.role === filter);
  }, [filter, commissions]);

  // Calculate total for the top card
  const totalPendingCommission = useMemo(() => {
      return commissions.reduce((acc, user) => acc + user.pendingAmount, 0);
  }, [commissions]);

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
            <h2 className="text-2xl font-semibold text-gray-700">Commission Payouts (Payables)</h2>
            <p className="text-sm text-gray-500">Total pending commissions earned by your users.</p>
        </div>
        <div className="text-right">
            <h3 className="text-stone-500 text-sm font-semibold uppercase">Total Pending Commissions</h3>
            <p className="text-3xl font-bold text-green-600 mt-1">₹{totalPendingCommission.toFixed(2)}</p>
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
      {isLoading ? <Loader /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                <th className="p-3 font-semibold">User Name</th>
                <th className="p-3 font-semibold">User ID</th>
                <th className="p-3 font-semibold">Role</th>
                <th className="p-3 font-semibold text-right">Total Paid</th>
                <th className="p-3 font-semibold text-right">Pending Commission</th>
                <th className="p-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommissions.length > 0 ? (
                filteredCommissions.map((user) => (
                  <tr key={user.id} className="border-b border-stone-200 hover:bg-stone-50">
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3">{user.userId}</td>
                    <td className="p-3">{user.role}</td>
                    <td className="p-3 text-gray-600 text-right">₹{user.paidAmount.toFixed(2)}</td>
                    <td className="p-3 font-bold text-green-600 text-right">₹{user.pendingAmount.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handlePayCommission(user)}
                        disabled={submittingId === user.id || user.pendingAmount === 0}
                        className="px-4 py-1 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {submittingId === user.id ? 'Processing...' : 'Pay Commission'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="p-4 text-center text-gray-500">No pending commissions found for this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- MAIN TABBED COMPONENT ---
export default function PayoutsView() {
    const [activeTab, setActiveTab] = useState('receivables'); // 'receivables' or 'payables'
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            {/* Tab Navigation */}
            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveTab('receivables')}
                    className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'receivables' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-green-600'}`}
                >
                    Payments to Admin (Receivables)
                </button>
                <button
                    onClick={() => setActiveTab('payables')}
                    className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'payables' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-green-600'}`}
                >
                    Commission Payouts (Payables)
                </button>
            </div>
            
            {/* Render active tab content */}
            <div>
                {activeTab === 'receivables' && <PaymentsToAdmin />}
                {activeTab === 'payables' && <CommissionPayouts />}
            </div>
        </div>
    );
}