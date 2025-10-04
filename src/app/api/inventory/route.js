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


    if (loggedInUser.role === 'Franchise') {
      const allProducts = await prisma.product.findMany();
      const userInventory = await prisma.userInventory.findMany({
        where: { userId: loggedInUser.id },
      });

      const inventoryMap = new Map(
        userInventory.map(item => [item.productId, item.quantity])
      );

      const franchiseInventory = allProducts.map(product => ({
        id: product.id, 
        productId: product.id,
        product: product,
        quantity: inventoryMap.get(product.id) || 0, 
        userId: loggedInUser.id,
      }));

      return NextResponse.json(franchiseInventory);
    }

    else {
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
    }

  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return NextResponse.json({ error: 'Failed to fetch inventory.' }, { status: 500 });
  }
}
