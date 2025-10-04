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
    
   
    if (!loggedInUser.uplineId) {
        return NextResponse.json([]); 
    }

    const uplineInventory = await prisma.userInventory.findMany({
      where: {
        userId: loggedInUser.uplineId,
        quantity: { gt: 0 } 
      },
      include: {
        product: true, 
      },
      orderBy: {
        product: { name: 'asc' }
      }
    });

    return NextResponse.json(uplineInventory);

  } catch (error) {
    console.error("Failed to fetch upline inventory:", error);
    return NextResponse.json({ error: "Failed to fetch dealer's stock." }, { status: 500 });
  }
}

