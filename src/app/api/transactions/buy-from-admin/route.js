// src/app/api/transactions/buy-from-admin/route.js

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
export const dynamic = 'force-dynamic';

// Helper to get user from token
async function getUserFromToken() {
    const token = cookies().get('token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        // Fetch full user data including membership status
        return await prisma.user.findUnique({ where: { id: payload.id } });
    } catch {
        return null;
    }
}

// Map roles to their standard purchase price field
const roleToPriceMap = {
    Franchise: 'franchisePrice',
    Distributor: 'distributorPrice',
    SubDistributor: 'subDistributorPrice',
    Dealer: 'dealerPrice',
    Farmer: 'farmerPrice', // Although farmers buy from dealers usually, include for direct admin sales if needed
};

export async function POST(request) {
    try {
        const buyer = await getUserFromToken();
        if (!buyer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Admin cannot buy from themselves
        if (buyer.role === 'Admin') {
             return NextResponse.json({ error: 'Admin cannot purchase products.' }, { status: 400 });
        }

        const { productId, quantity } = await request.json();
        const purchaseQuantity = parseInt(quantity, 10);

        if (!productId || isNaN(purchaseQuantity) || purchaseQuantity <= 0) {
            return NextResponse.json({ error: 'Invalid product or quantity provided.' }, { status: 400 });
        }

        // Find the Admin user (the seller)
        const adminSeller = await prisma.user.findFirst({ where: { role: 'Admin' } });
        if (!adminSeller) {
            return NextResponse.json({ error: 'System error: Admin account not found.' }, { status: 500 });
        }
        const sellerId = adminSeller.id;

        // --- Initial Purchase Logic ---
        let isInitialPurchase = false;
        if (buyer.role !== 'Farmer' && !buyer.isMember) {
            if (purchaseQuantity < 10) {
                return NextResponse.json({ error: 'Initial purchase must be at least 10 units.' }, { status: 400 });
            }
            isInitialPurchase = true;
        }
        // --- End Initial Purchase Logic ---

        await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product || !product.isActive) {
                 throw new Error('Product not found or is inactive.');
            }

            const adminInventory = await tx.userInventory.findUnique({
                where: { userId_productId: { userId: sellerId, productId } },
            });

            if (!adminInventory || adminInventory.quantity < purchaseQuantity) {
                throw new Error('Admin does not have enough stock for this purchase.');
            }

            // Determine the correct purchase price
            let purchasePrice;
            if (isInitialPurchase) {
                purchasePrice = product.dealerPrice; // Initial purchase is always at Dealer price
            } else {
                const priceField = roleToPriceMap[buyer.role];
                if (!priceField) throw new Error('Invalid user role for pricing.');
                purchasePrice = product[priceField];
            }
            const totalAmount = purchasePrice * purchaseQuantity;

            // 1. Decrement Admin's inventory
            await tx.userInventory.update({
                where: { id: adminInventory.id },
                data: { quantity: { decrement: purchaseQuantity } },
            });

            // 2. Upsert buyer's inventory (Farmers don't hold inventory in this model)
             if (buyer.role !== 'Farmer') {
                await tx.userInventory.upsert({
                    where: { userId_productId: { userId: buyer.id, productId } },
                    update: { quantity: { increment: purchaseQuantity } },
                    create: { userId: buyer.id, productId, quantity: purchaseQuantity },
                });
            }

            // 3. Create the transaction record (Profit is calculated later via commissions)
            await tx.transaction.create({
                data: {
                    productId,
                    quantity: purchaseQuantity,
                    purchasePrice,
                    totalAmount,
                    profit: 0, // Admin's direct profit is handled differently (it's revenue)
                    sellerId,
                    buyerId: buyer.id,
                    paymentStatus: 'PENDING',
                    // paymentProofUrl will be added later
                },
            });
        });

        return NextResponse.json({ message: 'Purchase from Admin successful! Awaiting payment proof.' }, { status: 200 });

    } catch (error) {
        console.error("Purchase from Admin failed:", error);
        return NextResponse.json({ error: error.message || 'Failed to complete purchase from Admin.' }, { status: 500 });
    }
}