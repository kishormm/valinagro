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
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find all PENDING commissions for the logged-in user
    const userCommissions = await prisma.commission.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
      },
      select: {
        amount: true,
      },
    });

    // Calculate the total
    const totalPendingCommission = userCommissions.reduce((acc, comm) => acc + comm.amount, 0);

    // This now correctly replaces the old "getPendingPayoutForUser"
    // We return the same object structure for minimal frontend changes
    return NextResponse.json({
      pendingBalance: totalPendingCommission,
      totalProfit: totalPendingCommission, // You can use this for "Total Profit"
    });

  } catch (error) {
    console.error("Failed to fetch user commissions:", error);
    return NextResponse.json({ error: 'Failed to fetch user commissions.' }, { status: 500 });
  }
}