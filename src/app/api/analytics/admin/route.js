import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
export const dynamic = 'force-dynamic';

// Helper function to get the logged-in user
async function getLoggedInUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await getLoggedInUser();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminUser = await prisma.user.findFirst({ where: { role: 'Admin' } });
    if (!adminUser) {
      return NextResponse.json({ error: 'System error: Admin account not found.' }, { status: 500 });
    }

    // --- NEW PROFIT LOGIC ---

    // 1. Get all PAID transactions where Admin was the seller
    const adminSales = await prisma.transaction.findMany({
      where: { 
        sellerId: adminUser.id,
        paymentStatus: 'PAID' // Only count paid transactions
      },
    });

    // 2. Get all PAID commissions that the Admin has paid out
    const paidCommissions = await prisma.commission.findMany({
        where: {
            status: 'PAID'
        }
    });

    // 3. Get total active users (excluding the Admin)
    const activeUsersCount = await prisma.user.count({
        where: { role: { not: 'Admin' } }
    });

    // --- CALCULATIONS ---

    // Total Revenue = Sum of all money received from paid sales
    const totalRevenue = adminSales.reduce((acc, sale) => acc + sale.totalAmount, 0);

    // Total Cost = Sum of all commissions paid out
    const totalCommissionPaid = paidCommissions.reduce((acc, comm) => acc + comm.amount, 0);

    // Net Profit = Revenue - Costs
    const totalAdminProfit = totalRevenue - totalCommissionPaid;

    // Total Units Sold by Admin
    const totalUnitsSold = adminSales.reduce((acc, sale) => acc + sale.quantity, 0);
    

    // 4. Return the aggregated data
    return NextResponse.json({
      totalAdminProfit,
      totalUnitsSold,
      activeUsersCount,
    });

  } catch (error) {
    console.error("Failed to fetch admin analytics:", error);
    return NextResponse.json({ error: 'Failed to fetch analytics data.' }, { status: 500 });
  }
}