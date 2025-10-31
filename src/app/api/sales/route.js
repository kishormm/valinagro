// src/app/api/sales/route.js

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
export const dynamic = 'force-dynamic';

// Helper function to get the logged-in user
async function getLoggedInUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    // Fetch full user data needed for Farmer purchase logic
    return await prisma.user.findUnique({ where: { id: payload.id } });
  } catch {
    return null;
  }
}

// GET function (for admin reports) - Remains unchanged
export async function GET() {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const sales = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
        seller: { select: { name: true } },
        buyer: { select: { name: true } },
      },
    });
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Failed to fetch sales data:", error);
    return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
  }
}

// POST function - SIMPLIFIED: Only handles Farmer buying from Dealer
export async function POST(request) {
  try {
    const buyer = await getLoggedInUser(); // The logged-in user is the buyer

    // This endpoint is now ONLY for Farmers buying from their Dealer
    if (!buyer || buyer.role !== 'Farmer') {
      return NextResponse.json({ error: 'Unauthorized or invalid role for this action.' }, { status: 403 });
    }
    if (!buyer.uplineId) {
        return NextResponse.json({ error: 'Your account is not assigned to a dealer.' }, { status: 400 });
    }

    const body = await request.json();
    const { productId, quantity } = body;
    const purchaseQuantity = parseInt(quantity, 10);

    if (!productId || isNaN(purchaseQuantity) || purchaseQuantity <= 0) {
        return NextResponse.json({ error: 'Invalid product or quantity.' }, { status: 400 });
    }

    const sellerId = buyer.uplineId; // The seller is always the Farmer's upline (Dealer)
    const buyerId = buyer.id;

    await prisma.$transaction(async (tx) => {
        const [seller, product, sellerInventory] = await Promise.all([
            tx.user.findUnique({ where: { id: sellerId } }),
            tx.product.findUnique({ where: { id: productId } }),
            tx.userInventory.findUnique({
                where: { userId_productId: { userId: sellerId, productId: productId } },
            }),
        ]);

        if (!seller || seller.role !== 'Dealer') {
             throw new Error('Assigned dealer not found or invalid.');
        }
        if (!product || !product.isActive) {
             throw new Error('Product not found or is inactive.');
        }
        if (!sellerInventory || sellerInventory.quantity < purchaseQuantity) {
            throw new Error(`Your dealer has insufficient stock for ${product.name}.`);
        }

        // Price and Profit Calculation
        const purchasePrice = product.farmerPrice; // Farmer always pays Farmer price
        const costPrice = product.dealerPrice;     // Dealer's cost is Dealer price
        const totalAmount = purchasePrice * purchaseQuantity;
        const profit = (purchasePrice - costPrice) * purchaseQuantity;

        // 1. Decrement Dealer's inventory
        await tx.userInventory.update({
            where: { id: sellerInventory.id },
            data: { quantity: { decrement: purchaseQuantity } },
        });

        // 2. Farmers do not have inventory, so no increment needed.

        // 3. Create the transaction record
        await tx.transaction.create({
            data: { 
                sellerId, 
                buyerId, 
                productId, 
                quantity: purchaseQuantity, 
                purchasePrice, 
                totalAmount, 
                profit, // Profit for the Dealer
                paymentStatus: 'PENDING'
            },
        });
    });

    return NextResponse.json({ message: 'Purchase successful! Awaiting payment proof.' }, { status: 201 });

  } catch (error) {
    console.error("Farmer purchase transaction failed:", error);
    return NextResponse.json({ error: error.message || 'Transaction failed.' }, { status: 500 });
  }
}