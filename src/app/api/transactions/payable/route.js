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

    const pendingPayments = await prisma.transaction.findMany({
      where: {
        buyerId: loggedInUser.id,
        paymentStatus: 'PENDING',
      },
      include: {
        // UPDATED to include the seller's role
        seller: { select: { name: true, role: true } },
        product: { select: { name: true } },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(pendingPayments);

  } catch (error) {
    console.error("Failed to fetch payable transactions:", error);
    return NextResponse.json({ error: 'Failed to fetch pending payments.' }, { status: 500 });
  }
}