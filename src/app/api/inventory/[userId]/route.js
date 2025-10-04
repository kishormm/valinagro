
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

    const inventory = await prisma.userInventory.findMany({
      where: {
        userId: loggedInUser.id,
        quantity: { gt: 0 } 
      },
      include: {
        product: true, 
      },
    });

    return NextResponse.json(inventory);

  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return NextResponse.json({ error: 'Failed to fetch inventory.' }, { status: 500 });
  }
}