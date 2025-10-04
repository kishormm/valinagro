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

export async function POST(request) {
  try {
    const adminUser = await getUserFromToken();
    if (!adminUser || adminUser.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, amount } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid userId or amount provided.' }, { status: 400 });
    }

    const newPayout = await prisma.payout.create({
      data: {
        userId: userId,
        amount: parseFloat(amount),
      },
    });

    return NextResponse.json(newPayout, { status: 201 });

  } catch (error) {
    console.error("Failed to create payout:", error);
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 });
  }
}