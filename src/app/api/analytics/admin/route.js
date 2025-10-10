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

    // 1. Get all transactions where Admin was the seller
    const adminSales = await prisma.transaction.findMany({
      where: { sellerId: adminUser.id },
      include: {
        buyer: { select: { role: true } },
      },
    });

    // 2. Calculate stats
    let totalAdminProfit = 0;
    let totalUnitsSold = 0;
    // UPDATED to include all possible buyer roles
    const profitByRole = {
      Franchise: 0,
      Distributor: 0,
      SubDistributor: 0,
      Dealer: 0,
      Farmer: 0
    };

    for (const sale of adminSales) {
      // For Admin, profit is the total sale amount since their cost is zero
      totalAdminProfit += sale.totalAmount;
      totalUnitsSold += sale.quantity;

      // Add to the specific role's profit total
      if (profitByRole.hasOwnProperty(sale.buyer.role)) {
        profitByRole[sale.buyer.role] += sale.totalAmount;
      }
    }
    
    // 3. Get total active users
    const activeUsersCount = await prisma.user.count();

    // 4. Return the aggregated data in a single object
    return NextResponse.json({
      totalAdminProfit,
      totalUnitsSold,
      activeUsersCount,
      profitByRole,
    });

  } catch (error) {
    console.error("Failed to fetch admin analytics:", error);
    return NextResponse.json({ error: 'Failed to fetch analytics data.' }, { status: 500 });
  }
}