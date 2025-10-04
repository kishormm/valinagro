import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
    try {
        const { userId } = params;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
        }

        const userDetails = await prisma.user.findUnique({
            where: {
                userId: userId,
            },
            // We can also include upline info if needed
            include: {
                upline: {
                    select: {
                        name: true,
                        userId: true,
                    }
                }
            }
        });

        if (!userDetails) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 });
        }

        // Remove password before sending the response
        const { password, ...userToReturn } = userDetails;

        return NextResponse.json(userToReturn);

    } catch (error) {
        console.error("Failed to fetch user details:", error);
        return NextResponse.json({ error: 'Failed to fetch user details.' }, { status: 500 });
    }
}
