import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
export const dynamic = 'force-dynamic';

const roleToPriceMap = {
    Franchise: 'franchisePrice',
    Distributor: 'distributorPrice',
    SubDistributor: 'subDistributorPrice',
    Dealer: 'dealerPrice',
    Farmer: 'farmerPrice',
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
        if (!buyer) {
            return NextResponse.json({ error: 'Forbidden: You must be logged in.' }, { status: 403 });
        }
        if (!buyer.uplineId) {
            return NextResponse.json({ error: 'You do not have an assigned upline to purchase from.' }, { status: 400 });
        }

        const { productId, quantity } = await request.json();
        const purchaseQuantity = parseInt(quantity, 10);

        if (!productId || isNaN(purchaseQuantity) || purchaseQuantity <= 0) {
            return NextResponse.json({ error: 'Invalid product or quantity provided.' }, { status: 400 });
        }

        const sellerId = buyer.uplineId;

        await prisma.$transaction(async (tx) => {
            const [seller, product, sellerInventory] = await Promise.all([
                tx.user.findUnique({ where: { id: sellerId } }),
                tx.product.findUnique({ where: { id: productId } }),
                tx.userInventory.findUnique({
                    where: { userId_productId: { userId: sellerId, productId } },
                }),
            ]);

            if (!seller || !product || !product.isActive) throw new Error('Seller or product not found, or product is inactive.');
            if (!sellerInventory || sellerInventory.quantity < purchaseQuantity) {
                throw new Error('Your upline does not have enough stock for this purchase.');
            }

            // --- CORRECTED PRICE AND PROFIT CALCULATION ---
            let purchasePrice;
            let costPrice;

            // Determine the seller's cost price (what they paid for the product)
            switch (seller.role) {
                case 'Admin': costPrice = 0; break;
                case 'Franchise': costPrice = product.franchisePrice; break;
                case 'Distributor': costPrice = product.distributorPrice; break;
                case 'SubDistributor': costPrice = product.subDistributorPrice; break;
                case 'Dealer': costPrice = product.dealerPrice; break;
                default: throw new Error('Invalid seller role.');
            }

            // Determine the buyer's purchase price
            const priceField = roleToPriceMap[buyer.role];
            if (!priceField) throw new Error('Invalid buyer role for pricing.');
            purchasePrice = product[priceField];
            
            const totalAmount = purchasePrice * purchaseQuantity;
            // The universal formula for profit
            const profit = (purchasePrice - costPrice) * purchaseQuantity;
            // --- END OF CORRECTION ---


            // 1. Decrement seller's inventory
            await tx.userInventory.update({
                where: { id: sellerInventory.id },
                data: { quantity: { decrement: purchaseQuantity } },
            });

            // 2. Upsert buyer's inventory
            if (buyer.role !== 'Farmer') {
                await tx.userInventory.upsert({
                    where: { userId_productId: { userId: buyer.id, productId } },
                    update: { quantity: { increment: purchaseQuantity } },
                    create: { userId: buyer.id, productId, quantity: purchaseQuantity },
                });
            }
            
            // 3. Create a transaction record with the correct profit
            await tx.transaction.create({
                data: {
                    productId,
                    quantity: purchaseQuantity,
                    purchasePrice,
                    totalAmount,
                    profit, // The newly corrected profit is saved here
                    sellerId,
                    buyerId: buyer.id,
                    paymentStatus: 'PENDING'
                },
            });
        });

        return NextResponse.json({ message: 'Purchase successful!' }, { status: 200 });

    } catch (error) {
        console.error("Purchase failed:", error);
        return NextResponse.json({ error: error.message || 'Failed to complete purchase.' }, { status: 500 });
    }
}
//test comment