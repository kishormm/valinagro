import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  try {
    const { userId } = params;

    const user = await prisma.user.findUnique({
      where: { userId: userId },
      select: { id: true }, 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [transactions, payouts] = await Promise.all([
      prisma.transaction.findMany({
        where: { sellerId: user.id },
        select: { profit: true }, 
      }),
      prisma.payout.findMany({
        where: { userId: user.id },
        select: { amount: true }, 
      }),
    ]);

    const totalProfit = transactions.reduce((acc, transaction) => acc + transaction.profit, 0);

    const totalPaid = payouts.reduce((acc, payout) => acc + payout.amount, 0);

    const pendingBalance = totalProfit - totalPaid;

    return NextResponse.json({ pendingBalance });

  } catch (error) {
    console.error("Failed to fetch pending payout for user:", error);
    return NextResponse.json({ error: 'Failed to fetch pending payout data' }, { status: 500 });
  }
}