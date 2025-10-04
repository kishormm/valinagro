import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
export const dynamic = 'force-dynamic';
async function getUserFromToken() {
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

export async function GET(request) {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: { in: ['Franchise', 'Distributor', 'SubDistributor', 'Dealer'] },
      },
      select: { id: true, userId: true, name: true, role: true },
    });

    const [allTransactions, allPayouts] = await Promise.all([
      prisma.transaction.findMany({ select: { sellerId: true, profit: true } }),
      prisma.payout.findMany({ select: { userId: true, amount: true } }),
    ]);

    const profitMap = new Map();
    allTransactions.forEach(transaction => {
      profitMap.set(transaction.sellerId, (profitMap.get(transaction.sellerId) || 0) + transaction.profit);
    });

    const paidMap = new Map();
    allPayouts.forEach(payout => {
      paidMap.set(payout.userId, (paidMap.get(payout.userId) || 0) + payout.amount);
    });

    const pendingPayouts = users.map(u => {
      const totalProfit = profitMap.get(u.id) || 0;
      const totalPaid = paidMap.get(u.id) || 0;
      const pendingBalance = totalProfit - totalPaid;
      return {
        ...u,
        totalEarnings: totalProfit, 
        totalPaid,
        pendingBalance,
      };
    }).filter(u => u.pendingBalance > 0); 

    return NextResponse.json(pendingPayouts);

  } catch (error) {
    console.error("Failed to fetch pending payouts:", error);
    return NextResponse.json({ error: 'Failed to fetch pending payouts' }, { status: 500 });
  }
}

