import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
export const dynamic = 'force-dynamic';

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
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // REMOVED the 30-day date filter

    const receivableTransactions = await prisma.transaction.findMany({
      where: {
        // UPDATED LOGIC: Simply get all transactions where the user is the seller.
        // The frontend will show the status of each one.
        sellerId: loggedInUser.id,
      },
      include: {
        buyer: { select: { name: true, userId: true, role: true } },
        product: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'desc', // Show most recent transactions first
      },
    });

    // This calculation remains the same. It correctly calculates the total
    // for ONLY the pending transactions.
    const totalReceivable = receivableTransactions
      .filter(t => t.paymentStatus === 'PENDING')
      .reduce((acc, t) => acc + t.totalAmount, 0);

    return NextResponse.json({
      transactions: receivableTransactions,
      total: totalReceivable,
    });

  } catch (error) {
    console.error("Failed to fetch receivable transactions:", error);
    return NextResponse.json({ error: 'Failed to fetch pending payouts.' }, { status: 500 });
  }
}