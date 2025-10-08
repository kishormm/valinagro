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

// GET: This function now only fetches ACTIVE products
export async function GET(request) {
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
        orderBy: { createdAt: 'desc' } 
      }),
      prisma.userInventory.findMany({
        where: { userId: adminUser.id },
      }),
    ]);
    // --- END OF CHANGE ---

    const adminStockMap = new Map(
      adminInventory.map(item => [item.productId, item.quantity])
    );

    const productsWithAdminStock = activeProducts.map(product => ({
      ...product,
      totalStock: adminStockMap.get(product.id) || 0,
    }));

    return NextResponse.json(productsWithAdminStock);

  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: This function remains unchanged
export async function POST(request) {
  try {
    const userPayload = await getUserFromToken();
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, stock, franchisePrice, distributorPrice,
      subDistributorPrice, dealerPrice, farmerPrice
    } = body;

    const stockQuantity = parseInt(stock, 10);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
        return NextResponse.json({ error: 'Invalid stock quantity.'}, { status: 400 });
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const createdProduct = await tx.product.create({
        data: {
          name,
          franchisePrice: parseFloat(franchisePrice),
          distributorPrice: parseFloat(distributorPrice),
          subDistributorPrice: parseFloat(subDistributorPrice),
          dealerPrice: parseFloat(dealerPrice),
          farmerPrice: parseFloat(farmerPrice),
          // All new products are active by default (from the schema)
        },
      });

      if (stockQuantity > 0) {
          await tx.userInventory.create({
              data: {
                  userId: userPayload.id,
                  productId: createdProduct.id,
                  quantity: stockQuantity,
              }
          });
      }

      return createdProduct;
    });

    return NextResponse.json(newProduct, { status: 201 });

  } catch (error) {
    console.error("Failed to create product:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return NextResponse.json({ error: 'A product with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

