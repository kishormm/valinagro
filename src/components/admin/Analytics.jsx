'use client';

import { useEffect, useState } from 'react';
import { getSales, getUsers } from '@/services/apiService';
import { ThreeDots } from 'react-loader-spinner';

const StatCard = ({ title, value, colorClass }) => (
  <div className={`p-6 rounded-lg shadow-lg ${colorClass}`}>
    <h3 className="text-sm font-semibold uppercase text-gray-800">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
  </div>
);

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [salesData, usersData] = await Promise.all([
          getSales(),
          getUsers(),
        ]);

        const totalSales = salesData.reduce((acc, sale) => acc + sale.totalAmount, 0);
        const totalProfit = salesData.reduce((acc, sale) => acc + sale.profit, 0);
        const activeUsers = usersData.length;

        setStats({
          totalSalesValue: totalSales,
          totalProfitValue: totalProfit,
          activeUsersCount: activeUsers,
        });
      } catch (err) {
        console.error('Failed to fetch analytics data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Analytics & Overview
      </h2>
      {isLoading ? (
         <div className="flex justify-center items-center h-48">
            <ThreeDots color="#166534" height={80} width={80} />
         </div>
      ) : !stats || (stats.totalSalesValue === 0 && stats.activeUsersCount === 0) ? (
        <p className="text-center p-6 text-gray-500 bg-gray-100 rounded-lg shadow">
          No analytics data available yet. Make a sale to see the stats.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Sales Value"
            value={`₹${stats.totalSalesValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            colorClass="bg-blue-200"
          />
          <StatCard
            title="Total Profit Generated"
            value={`₹${stats.totalProfitValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            colorClass="bg-green-200"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsersCount}
            colorClass="bg-yellow-200"
          />
        </div>
      )}
    </div>
  );
}

