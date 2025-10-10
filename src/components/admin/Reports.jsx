'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSalesReport } from '../../services/apiService';
import toast from 'react-hot-toast';

// Reusable Loader Component
const Loader = () => (
    <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export default function ReportsView() {
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // FILTERS STATE
    const [activeTab, setActiveTab] = useState('total');
    const [roleFilter, setRoleFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const roles = ['All', 'Admin', 'Franchise', 'Distributor', 'SubDistributor', 'Dealer', 'Farmer'];

    const fetchReportData = useCallback(async () => {
        setIsLoading(true);
        try {
            const timePeriod = (startDate && endDate) ? null : (activeTab === 'total' ? null : activeTab);
            const data = await getSalesReport(timePeriod, roleFilter, startDate, endDate);
            setReportData(data);
        } catch (error) {
            toast.error("Could not load report data.");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, roleFilter, startDate, endDate]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handleTabClick = (tab) => {
        setStartDate('');
        setEndDate('');
        setActiveTab(tab);
    };

    useEffect(() => {
        if(startDate && endDate) {
            setActiveTab('');
        }
    }, [startDate, endDate]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const handleDownloadCsv = () => {
        if (reportData.length === 0) {
            toast.error("There is no data to download.");
            return;
        }

        const headers = ["Date", "Product", "Seller", "Seller Role", "Buyer", "Buyer Role", "Quantity", "Total Amount"];
        
        const csvRows = reportData.map(sale => {
            const row = [
                formatDate(sale.createdAt),
                `"${sale.product.name}"`,
                `"${sale.seller.name}"`,
                sale.seller.role,
                `"${sale.buyer.name}"`,
                sale.buyer.role,
                sale.quantity,
                sale.totalAmount.toFixed(2)
            ];
            return row.join(',');
        });

        const csvString = [headers.join(','), ...csvRows].join('\n');
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().split('T')[0];
            link.setAttribute('href', url);
            link.setAttribute('download', `sales-report-${date}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-wrap justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">Sales Records</h2>
                <button 
                    onClick={handleDownloadCsv}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download CSV
                </button>
            </div>
            
            <div className="flex flex-col gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                {/* Time Period and Role Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex border-b">
                        <button onClick={() => handleTabClick('total')} className={`px-4 py-2 font-semibold ${activeTab === 'total' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>Total Sales</button>
                        <button onClick={() => handleTabClick('monthly')} className={`px-4 py-2 font-semibold ${activeTab === 'monthly' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>Last Month</button>
                        <button onClick={() => handleTabClick('halfYearly')} className={`px-4 py-2 font-semibold ${activeTab === 'halfYearly' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>Last 6 Months</button>
                    </div>
                    <div>
                        <label className="text-sm font-medium mr-2">Filter by Role:</label>
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="p-2 border rounded-md">
                            {roles.map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                </div>
                {/* Date Range Filter */}
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
                     <label className="text-sm font-medium">Or select custom date range:</label>
                     <input 
                        type="date" 
                        value={startDate} 
                        onChange={e => setStartDate(e.target.value)}
                        className="p-2 border rounded-md" 
                    />
                    <span className="text-gray-500">to</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={e => setEndDate(e.target.value)}
                        className="p-2 border rounded-md"
                        disabled={!startDate}
                    />
                </div>
            </div>

            {isLoading ? (
                <Loader />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-100 text-stone-600 uppercase text-sm">
                                <th className="p-3">Date</th>
                                <th className="p-3">Product</th>
                                <th className="p-3">Seller</th>
                                <th className="p-3">Buyer</th>
                                <th className="p-3 text-center">Quantity</th>
                                <th className="p-3 text-right">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? reportData.map(sale => (
                                <tr key={sale.id} className="border-b hover:bg-stone-50">
                                    <td className="p-3">{formatDate(sale.createdAt)}</td>
                                    <td className="p-3 font-medium">{sale.product?.name || 'N/A'}</td>
                                    <td className="p-3">{sale.seller?.name} ({sale.seller?.role})</td>
                                    <td className="p-3">{sale.buyer?.name} ({sale.buyer?.role})</td>
                                    <td className="p-3 text-center">{sale.quantity}</td>
                                    <td className="p-3 text-right font-semibold">₹{sale.totalAmount.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No sales data found for the selected filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}