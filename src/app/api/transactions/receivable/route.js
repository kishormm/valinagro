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

    const receivableTransactions = await prisma.transaction.findMany({
      where: {
        sellerId: loggedInUser.id,
        paymentStatus: 'PENDING',
      },
      include: {
        // UPDATED THIS LINE to include userId and role
        buyer: { select: { name: true, userId: true, role: true } },
        product: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const totalReceivable = receivableTransactions.reduce((acc, t) => acc + t.totalAmount, 0);

    return NextResponse.json({
      transactions: receivableTransactions,
      total: totalReceivable,
    });

  } catch (error) {
    console.error("Failed to fetch receivable transactions:", error);
    return NextResponse.json({ error: 'Failed to fetch pending payouts.' }, { status: 500 });
  }
}