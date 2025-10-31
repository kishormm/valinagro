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

export async function POST(request) {
  try {
    const user = await getLoggedInUser();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, amount } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid user ID or amount.' }, { status: 400 });
    }

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // 1. Mark all pending commissions for this user as PAID
      const { count } = await tx.commission.updateMany({
        where: {
          userId: userId,
          status: 'PENDING',
        },
        data: {
          status: 'PAID',
        },
      });

      if (count === 0) {
        throw new Error("No pending commissions found for this user to pay.");
      }

      // 2. Create a single Payout record to log this payment
      // This uses the existing Payout model for easy tracking
      await tx.payout.create({
        data: {
          userId: userId,
          amount: parseFloat(amount),
        },
      });
    });

    return NextResponse.json({ message: 'Commission payout successful!' });

  } catch (error) {
    console.error("Failed to pay commission:", error);
    return NextResponse.json({ error: error.message || 'Failed to pay commission.' }, { status: 500 });
  }
}