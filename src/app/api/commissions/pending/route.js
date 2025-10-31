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
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get ALL commissions
    const allCommissions = await prisma.commission.findMany({
      include: {
        user: {
          select: { id: true, userId: true, name: true, role: true },
        },
      },
      orderBy: {
          createdAt: 'desc'
      }
    });

    // Group commissions by user
    const userPayouts = new Map();
    for (const commission of allCommissions) {
      if (!userPayouts.has(commission.userId)) {
        userPayouts.set(commission.userId, {
          ...commission.user,
          pendingAmount: 0,
          paidAmount: 0,
          commissions: [] // Store individual commissions
        });
      }
      
      if (commission.status === 'PENDING') {
        userPayouts.get(commission.userId).pendingAmount += commission.amount;
      } else {
        userPayouts.get(commission.userId).paidAmount += commission.amount;
      }
      userPayouts.get(commission.userId).commissions.push(commission);
    }

    const response = Array.from(userPayouts.values())
                          .sort((a, b) => b.pendingAmount - a.pendingAmount); // Sort by pending amount

    return NextResponse.json(response);

  } catch (error) {
    console.error("Failed to fetch commissions:", error);
    return NextResponse.json({ error: 'Failed to fetch commissions.' }, { status: 500 });
  }
}