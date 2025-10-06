import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // 1. IMPORT bcrypt
export const dynamic = 'force-dynamic';

// --- UPDATED PUT FUNCTION ---
export async function PUT(request, { params }) {
    try {
        const { userId } = params;
        const body = await request.json();
        const {
            name, mobile, email, pan, aadhar, address, pincode, crops,
            password // 2. ACCEPT the new optional password field
        } = body;

        // Prepare the data for the update
        const dataToUpdate = {
            name, mobile, email, pan, aadhar, address, pincode, crops
        };

        // 3. SECURELY HANDLE PASSWORD UPDATE
        // If a new password was provided and is not an empty string, hash it.
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            dataToUpdate.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
        });

        const { password: userPassword, ...userToReturn } = updatedUser;
        return NextResponse.json(userToReturn);

    } catch (error) {
        console.error("Failed to update user:", error);
        return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
    }
}


// --- DELETE FUNCTION (NO CHANGES) ---
export async function DELETE(request, { params }) {
    try {
        const { userId } = params;

        await prisma.$transaction(async (tx) => {
            const userToDelete = await tx.user.findUnique({ where: { id: userId } });
            await tx.user.updateMany({
                where: { uplineId: userId },
                data: { uplineId: userToDelete?.uplineId || null },
            });

            await tx.payout.deleteMany({ where: { userId: userId } });
            await tx.userInventory.deleteMany({ where: { userId: userId } });
            await tx.transaction.deleteMany({ where: { OR: [{ sellerId: userId }, { buyerId: userId }] } });

            await tx.user.delete({ where: { id: userId } });
        });

        return new NextResponse(null, { status: 204 });

    } catch (error) {
        console.error("Failed to delete user:", error);
        return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
    }
}

