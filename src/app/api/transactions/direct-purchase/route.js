// src/app/api/transactions/direct-purchase/route.js

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const roleToPriceMap = {
    Distributor: 'distributorPrice',
    // Add other roles here if they are also allowed to buy from Admin
};

async function getUserFromToken() {
    const token = cookies().get('token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return await prisma.user.findUnique({ where: { id: payload.id } });
    } catch {
        return null;
    }
}

export async function POST(request) {
    try {
        const buyer = await getUserFromToken();
        if (!buyer || buyer.role !== 'Distributor') { // Restrict this endpoint to Distributors
            return NextResponse.json({ error: 'Forbidden: Only Distributors can perform this action.' }, { status: 403 });
        }

        const { productId, quantity } = await request.json();
        const purchaseQuantity = parseInt(quantity, 10);

        if (!productId || isNaN(purchaseQuantity) || purchaseQuantity <= 0) {
            return NextResponse.json({ error: 'Invalid product or quantity provided.' }, { status: 400 });
        }
        
        // Find the Admin user who will be the seller
        const adminSeller = await prisma.user.findFirst({ where: { role: 'Admin' } });
        if (!adminSeller) {
            return NextResponse.json({ error: 'System error: Admin account not found.' }, { status: 500 });
        }
        const sellerId = adminSeller.id;

        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product || !product.isActive) throw new Error('Product not found or is inactive.');
            
            const sellerInventory = await tx.userInventory.findUnique({
                where: { userId_productId: { userId: sellerId, productId } },
            });

            if (!sellerInventory || sellerInventory.quantity < purchaseQuantity) {
                throw new Error('The Admin does not have enough stock for this purchase.');
            }

            await tx.userInventory.update({
                where: { id: sellerInventory.id },
                data: { quantity: { decrement: purchaseQuantity } },
            });

            await tx.userInventory.upsert({
                where: { userId_productId: { userId: buyer.id, productId } },
                update: { quantity: { increment: purchaseQuantity } },
                create: { userId: buyer.id, productId, quantity: purchaseQuantity },
            });
            
            const priceField = roleToPriceMap[buyer.role];
            if (!priceField) throw new Error('Invalid user role for pricing.');

            const purchasePrice = product[priceField];
            const totalAmount = purchasePrice * purchaseQuantity;

            await tx.transaction.create({
                data: {
                    productId,
                    quantity: purchaseQuantity,
                    purchasePrice,
                    totalAmount,
                    profit: 0,
                    sellerId,
                    buyerId: buyer.id,
                },
            });
        });

        return NextResponse.json({ message: 'Purchase from Admin successful!' }, { status: 200 });

    } catch (error) {
        console.error("Direct purchase failed:", error);
        return NextResponse.json({ error: error.message || 'Failed to complete direct purchase.' }, { status: 500 });
    }
}