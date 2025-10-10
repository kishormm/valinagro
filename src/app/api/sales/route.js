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
    return payload;
  } catch {
    return null;
  }
}

// GET function (for admin reports)
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

// POST function (for creating sales) - REVISED LOGIC
export async function POST(request) {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity } = body;
    
    let sellerId;
    let buyerId;
    let stockHolderId;

    if (loggedInUser.role === 'Farmer') {
      // If a Farmer is "creating a sale", they are actually buying from their upline.
      if (!loggedInUser.uplineId) {
        return NextResponse.json({ error: 'Your account is not assigned to a dealer.' }, { status: 400 });
      }
      sellerId = loggedInUser.uplineId;
      buyerId = loggedInUser.id;
      stockHolderId = sellerId; // We check the dealer's stock
    } 
    // --- THIS IS THE CORRECTED LOGIC ---
    // All roles other than Farmer sell from their OWN stock.
    else {
      sellerId = loggedInUser.id;
      buyerId = body.buyerId;
      stockHolderId = sellerId; // Franchise, Distributor, etc. check their OWN stock
    }
    // --- END OF CORRECTION ---

    if (!buyerId) {
        return NextResponse.json({ error: 'Buyer could not be identified for this transaction.' }, { status: 400 });
    }

    const [seller, buyer, product, stockHolderInventory] = await Promise.all([
      prisma.user.findUnique({ where: { id: sellerId } }),
      prisma.user.findUnique({ where: { id: buyerId } }),
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.userInventory.findUnique({
        where: { userId_productId: { userId: stockHolderId, productId: productId } },
      }),
    ]);
    
    if (!seller || !buyer || !product) {
      return NextResponse.json({ error: 'Invalid user or product.' }, { status: 400 });
    }
    if (!stockHolderInventory || stockHolderInventory.quantity < quantity) {
      return NextResponse.json({ error: `The seller has insufficient stock for ${product.name}.` }, { status: 400 });
    }

    // --- Price and Profit Calculation (Unchanged) ---
    let purchasePrice;
    let costPrice;

    switch (seller.role) {
      case 'Admin': costPrice = 0; break;
      case 'Franchise': costPrice = product.franchisePrice; break;
      case 'Distributor': costPrice = product.distributorPrice; break;
      case 'SubDistributor': costPrice = product.subDistributorPrice; break;
      case 'Dealer': costPrice = product.dealerPrice; break;
      default: costPrice = 0;
    }

    switch (buyer.role) {
      case 'Franchise': purchasePrice = product.franchisePrice; break;
      case 'Distributor': purchasePrice = product.distributorPrice; break;
      case 'SubDistributor': purchasePrice = product.subDistributorPrice; break;
      case 'Dealer': purchasePrice = product.dealerPrice; break;
      case 'Farmer': purchasePrice = product.farmerPrice; break;
      default:
        return NextResponse.json({ error: 'Invalid buyer role.' }, { status: 400 });
    }

    const totalAmount = purchasePrice * quantity;
    const profit = (purchasePrice - costPrice) * quantity;

    // --- Database Transaction ---
    const newTransaction = await prisma.$transaction(async (tx) => {
      await tx.userInventory.update({
        where: { id: stockHolderInventory.id },
        data: { quantity: { decrement: quantity } },
      });

      if (buyer.role !== 'Farmer') {
        await tx.userInventory.upsert({
          where: { userId_productId: { userId: buyerId, productId: productId } },
          update: { quantity: { increment: quantity } },
          create: { userId: buyerId, productId: productId, quantity: quantity },
        });
      }

      const transaction = await tx.transaction.create({
        data: { 
            sellerId, 
            buyerId, 
            productId, 
            quantity, 
            purchasePrice, 
            totalAmount, 
            profit,
            paymentStatus: 'PENDING'
        },
      });

      return transaction;
    });

    return NextResponse.json(newTransaction, { status: 201 });

  } catch (error) {
    console.error("Transaction failed:", error);
    return NextResponse.json({ error: 'Transaction failed.' }, { status: 500 });
  }
}