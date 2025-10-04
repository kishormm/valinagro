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

    const [allProducts, adminInventory] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: 'asc' } }),
      prisma.userInventory.findMany({
        where: { userId: adminUser.id },
      }),
    ]);

    const adminStockMap = new Map(
      adminInventory.map(item => [item.productId, item.quantity])
    );

    const productsWithMasterStock = allProducts.map(product => ({
      ...product,
      stock: adminStockMap.get(product.id) || 0,
    }));

    return NextResponse.json(productsWithMasterStock);
  } catch (error) {
    console.error("Failed to fetch master product list:", error);
    return NextResponse.json({ error: 'Failed to fetch product data.' }, { status: 500 });
  }
}
