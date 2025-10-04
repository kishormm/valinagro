import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
// --- PUT: Update a user's details ---
export async function PUT(request, { params }) {
    try {
        const { userId } = params;
        const body = await request.json();
        const {
            name, mobile, email, pan, aadhar, address, pincode, crops
        } = body;

        const updatedUser = await prisma.user.update({
            where: { id: userId }, // IMPORTANT: We use the unique database ID here
            data: {
                name, mobile, email, pan, aadhar, address, pincode, crops
            },
        });

        const { password, ...userToReturn } = updatedUser;
        return NextResponse.json(userToReturn);

    } catch (error) {
        console.error("Failed to update user:", error);
        return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
    }
}


// --- DELETE: Safely delete a user and all their related data ---
export async function DELETE(request, { params }) {
    try {
        const { userId } = params; // This is the user's unique database ID

        // A transaction ensures all these operations succeed or none of them do.
        await prisma.$transaction(async (tx) => {
            // 1. Find all users in the downline of the user being deleted
            const downline = await tx.user.findMany({ where: { uplineId: userId } });
            const downlineIds = downline.map(u => u.id);

            // 2. Re-assign the immediate downline to the deleted user's upline (prevent orphans)
            const userToDelete = await tx.user.findUnique({ where: { id: userId } });
            await tx.user.updateMany({
                where: { uplineId: userId },
                data: { uplineId: userToDelete?.uplineId || null },
            });

            // 3. Delete all related records for the user being deleted
            await tx.payout.deleteMany({ where: { userId: userId } });
            await tx.userInventory.deleteMany({ where: { userId: userId } });
            await tx.transaction.deleteMany({ where: { OR: [{ sellerId: userId }, { buyerId: userId }] } });

            // 4. Finally, delete the user themselves
            await tx.user.delete({ where: { id: userId } });
        });

        return new NextResponse(null, { status: 204 }); // Success, no content

    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
    }
}
