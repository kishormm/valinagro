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

export async function POST(request, { params }) {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { transactionId } = params;

    // Use a transaction update with a where clause to ensure security.
    // This query will only succeed if the transaction exists AND the logged-in user is the buyer.
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: transactionId,
        buyerId: loggedInUser.id, // Security check: only the buyer can pay
        paymentStatus: 'PENDING',
      },
      data: {
        paymentStatus: 'PAID',
      },
    });

    return NextResponse.json({ message: 'Payment successful!', transaction: updatedTransaction });

  } catch (error) {
    // Prisma throws an error if the record to update is not found
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Transaction not found or you are not authorized to pay it.' }, { status: 404 });
    }
    console.error("Failed to process payment:", error);
    return NextResponse.json({ error: 'Failed to process payment.' }, { status: 500 });
  }
}