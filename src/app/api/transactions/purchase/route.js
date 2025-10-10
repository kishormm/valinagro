import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// This map helps get the correct price for the user based on their role
const roleToPriceMap = {
    Franchise: 'franchisePrice',
    Distributor: 'distributorPrice',
    SubDistributor: 'subDistributorPrice',
    Dealer: 'dealerPrice',
    Farmer: 'farmerPrice',
};

// Helper function to get the full user object from the JWT token
async function getUserFromToken() {
    const token = cookies().get('token')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        // Fetch the full user from the database to get their uplineId
        return await prisma.user.findUnique({ where: { id: payload.id } });
    } catch {
        return null;
    }
}

export async function POST(request) {
    try {
        const buyer = await getUserFromToken();
        if (!buyer) {
            return NextResponse.json({ error: 'Forbidden: You must be logged in.' }, { status: 403 });
        }
        
        // The Admin is the top of the hierarchy and cannot buy from an upline
        if (!buyer.uplineId) {
            return NextResponse.json({ error: 'You do not have an assigned upline to purchase from.' }, { status: 400 });
        }

        const { productId, quantity } = await request.json();
        const purchaseQuantity = parseInt(quantity, 10);

        if (!productId || isNaN(purchaseQuantity) || purchaseQuantity <= 0) {
            return NextResponse.json({ error: 'Invalid product or quantity provided.' }, { status: 400 });
        }

        const sellerId = buyer.uplineId;

        // Use a Prisma transaction to ensure all database operations succeed or none do
        await prisma.$transaction(async (tx) => {
            // 1. Get product details and seller's inventory
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product || !product.isActive) {
                throw new Error('Product not found or is inactive.');
            }
            
            const sellerInventory = await tx.userInventory.findUnique({
                where: { userId_productId: { userId: sellerId, productId } },
            });

            // 2. Verify the seller has enough stock
            if (!sellerInventory || sellerInventory.quantity < purchaseQuantity) {
                throw new Error('Your upline does not have enough stock for this purchase.');
            }

            // 3. Decrease the seller's inventory
            await tx.userInventory.update({
                where: { id: sellerInventory.id },
                data: { quantity: { decrement: purchaseQuantity } },
            });

            // 4. Increase (or create) the buyer's inventory
            await tx.userInventory.upsert({
                where: { userId_productId: { userId: buyer.id, productId } },
                update: { quantity: { increment: purchaseQuantity } },
                create: { userId: buyer.id, productId, quantity: purchaseQuantity },
            });
            
            // 5. Log the transaction
            const priceField = roleToPriceMap[buyer.role];
            if (!priceField) {
                throw new Error('Your user role does not have a valid price tier.');
            }

            const purchasePrice = product[priceField];
            const totalAmount = purchasePrice * purchaseQuantity;

            await tx.transaction.create({
                data: {
                    productId,
                    quantity: purchaseQuantity,
                    purchasePrice,
                    totalAmount,
                    profit: 0, // Profit is calculated when selling downline, not buying upline
                    sellerId,
                    buyerId: buyer.id,
                },
            });
        });

        return NextResponse.json({ message: 'Purchase successful!' }, { status: 200 });

    } catch (error) {
        console.error("Purchase failed:", error);
        // Return the specific error message from the transaction if available
        return NextResponse.json({ error: error.message || 'Failed to complete purchase.' }, { status: 500 });
    }
}