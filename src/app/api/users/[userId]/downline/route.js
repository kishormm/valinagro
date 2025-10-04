import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  try {
    const parentUser = await prisma.user.findUnique({
      where: { userId: params.userId },
    });

    if (!parentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const downline = await prisma.user.findMany({
      where: { uplineId: parentUser.id },
      select: {
        id: true,
        userId: true,
        name: true,
        role: true,
      }
    });

    return NextResponse.json(downline);

  } catch (error) {
    console.error("Failed to fetch downline:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}