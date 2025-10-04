import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  try {
    const user = await prisma.user.findUnique({
      where: { userId: params.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sales = await prisma.sale.findMany({
      where: {
        OR: [
          { sellerId: user.id },
          { uplineId: user.id },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return NextResponse.json(sales);

  } catch (error) {
    console.error("Failed to fetch sales for user:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}