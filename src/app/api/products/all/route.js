import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'Admin' },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'System error: Admin account not found.' }, { status: 500 });
    }

    // --- THIS IS THE KEY CHANGE ---
    // We now only find products that are marked as active.
    const [activeProducts, adminInventory] = await Promise.all([
      prisma.product.findMany({ 
        where: { isActive: true }, // This filter hides "deleted" products
        orderBy: { name: 'asc' } 
      }),
      prisma.userInventory.findMany({
        where: { userId: adminUser.id },
      }),
    ]);
    // --- END OF CHANGE ---

    const adminStockMap = new Map(
      adminInventory.map(item => [item.productId, item.quantity])
    );

    const productsWithMasterStock = activeProducts.map(product => ({
      ...product,
      stock: adminStockMap.get(product.id) || 0,
    }));

    return NextResponse.json(productsWithMasterStock);
  } catch (error) {
    console.error("Failed to fetch master product list:", error);
    return NextResponse.json({ error: 'Failed to fetch product data.' }, { status: 500 });
  }
}

