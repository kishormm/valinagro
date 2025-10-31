import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { CommissionStatus } from '@prisma/client'; // <-- 1. IMPORT THE ENUM
export const dynamic = 'force-dynamic';

// Helper to get logged-in user
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

// Helper function to get the user's upline chain with their roles
async function getUplineChain(tx, userId) {
    let chain = [];
    let currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { uplineId: true }
    });

    while (currentUser && currentUser.uplineId) {
        const upline = await tx.user.findUnique({
            where: { id: currentUser.uplineId },
            select: { id: true, role: true, uplineId: true }
        });

        if (!upline || upline.role === 'Admin') break; // Stop at Admin
        
        chain.push({
            id: upline.id,
            role: upline.role,
        });
        currentUser = upline;
    }
    return chain; // Returns [Direct Upline, Upline's Upline, ...]
}

// Maps role to the price they PAY
const priceMap = {
    Franchise: 'franchisePrice',
    Distributor: 'distributorPrice',
    SubDistributor: 'subDistributorPrice',
    Dealer: 'dealerPrice',
    Farmer: 'farmerPrice',
};

export async function POST(request, { params }) {
  try {
    const loggedInUser = await getLoggedInUser();
    
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { transactionId } = params;

    const transactionToVerify = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transactionToVerify) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }
    if (transactionToVerify.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'This transaction has already been verified.' }, { status: 400 });
    }

    // --- Start Atomic Transaction ---
    const result = await prisma.$transaction(async (tx) => {
        // 1. Mark the transaction as PAID
        const updatedTransaction = await tx.transaction.update({
            where: { id: transactionId },
            data: { paymentStatus: 'PAID' },
            include: {
                buyer: true,
                product: true,
            }
        });

        const { buyer, product, quantity } = updatedTransaction;

        // 2. Define the price for each role
        const priceMap = {
            Franchise: product.franchisePrice,
            Distributor: product.distributorPrice,
            SubDistributor: product.subDistributorPrice,
            Dealer: product.dealerPrice,
            Farmer: product.farmerPrice,
        };

        // 3. Get the buyer's price
        const buyerPaidPrice = priceMap[buyer.role];

        // 4. Get the upline chain
        const uplineChain = await getUplineChain(tx, buyer.id);

        // 5. Calculate commissions
        let commissionData = [];
        let previousPrice = buyerPaidPrice; // Start with what the buyer paid

        for (const uplineMember of uplineChain) {
            // Get the price this upline member *would* have paid
            const uplineMemberPrice = priceMap[uplineMember.role];
            
            // Commission is the difference between the price tier below and their own price tier
            const commissionPerUnit = previousPrice - uplineMemberPrice;

            if (commissionPerUnit > 0) {
                const finalCommissionAmount = commissionPerUnit * quantity;
                commissionData.push({
                    amount: finalCommissionAmount,
                    userId: uplineMember.id,
                    transactionId: transactionId,
                    status: CommissionStatus.PENDING, // <-- 2. USE THE ENUM
                });
            }
            // Update previousPrice for the next loop
            previousPrice = uplineMemberPrice;
        }
        
        // 6. Create all commission records
        if (commissionData.length > 0) {
            await tx.commission.createMany({
                data: commissionData,
            });
        }
        
        return updatedTransaction;
    });

    return NextResponse.json({ message: 'Payment verified and commissions created!', transaction: result });

  } catch (error) {
    console.error("Failed to verify payment:", error);
    return NextResponse.json({ error: error.message || 'Failed to verify payment.' }, { status: 500 });
  }
}