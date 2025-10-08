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

// PUT function (No changes needed)
export async function PUT(request, { params }) {
    // ... (Your existing PUT logic remains here)
    try {
        const userPayload = await getUserFromToken();
        if (!userPayload || userPayload.role !== 'Admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const { id } = params;
        const { name, stock, franchisePrice, distributorPrice, subDistributorPrice, dealerPrice, farmerPrice } = await request.json();
        const stockQuantity = parseInt(stock, 10);
        if (isNaN(stockQuantity) || stockQuantity < 0) {
            return NextResponse.json({ error: 'Invalid stock quantity provided.' }, { status: 400 });
        }
        const updatedProduct = await prisma.$transaction(async (tx) => {
            const productDetails = await tx.product.update({
                where: { id },
                data: { name, franchisePrice, distributorPrice, subDistributorPrice, dealerPrice, farmerPrice },
            });
            await tx.userInventory.upsert({
                where: { userId_productId: { userId: userPayload.id, productId: id } },
                update: { quantity: stockQuantity },
                create: { userId: userPayload.id, productId: id, quantity: stockQuantity }
            });
            return productDetails;
        });
        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error("Failed to update product:", error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

// --- COMPLETELY REVISED DELETE FUNCTION ---
// This function now ONLY marks the product as inactive.
export async function DELETE(request, { params }) {
    const userPayload = await getUserFromToken();
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    try {
        const { id } = params; // This is the productId

        // The ONLY action is to "archive" the product by marking it as inactive.
        // We no longer delete any user inventory records. This preserves existing stock.
        await prisma.product.update({
            where: { id },
            data: {
                isActive: false,
            },
        });

        return new NextResponse(null, { status: 204 }); 

    } catch (error) {
        console.error("Failed to archive product:", error);
        return NextResponse.json({ error: 'Failed to archive product.' }, { status: 500 });
    }
}

