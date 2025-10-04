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

export async function PUT(request, { params }) {
  try {
    const userPayload = await getUserFromToken();
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const { name, franchisePrice, distributorPrice, subDistributorPrice, dealerPrice, farmerPrice } = await request.json();
    
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { 
        name, 
        franchisePrice: parseFloat(franchisePrice), 
        distributorPrice: parseFloat(distributorPrice), 
        subDistributorPrice: parseFloat(subDistributorPrice), 
        dealerPrice: parseFloat(dealerPrice), 
        farmerPrice: parseFloat(farmerPrice),
      },
    });
    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
    const userPayload = await getUserFromToken();
    if (!userPayload || userPayload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    try {
        const { id } = params;

        await prisma.$transaction(async (tx) => {
            await tx.userInventory.deleteMany({
                where: { productId: id },
            });

            await tx.transaction.deleteMany({
                where: { productId: id },
            });

            await tx.product.delete({
                where: { id },
            });
        });

        return new NextResponse(null, { status: 204 }); 

    } catch (error) {
        console.error("Failed to delete product:", error);
        return NextResponse.json({ error: 'Failed to delete product and its related records' }, { status: 500 });
    }
}
