import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
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

/**
 * A flexible endpoint to fetch a list of users with security checks.
 * - Admins can fetch any role list.
 * - Non-Admins can ONLY fetch the list of Farmers.
 */
export async function GET(request) {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // --- NEW SECURITY LOGIC ---
    // If the user is NOT an Admin, they are only allowed to ask for the 'Farmer' list.
    if (loggedInUser.role !== 'Admin' && role !== 'Farmer') {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to access this list.' }, { status: 403 });
    }
    // --- END OF SECURITY LOGIC ---

    const whereClause = {
        role: { not: 'Admin' },
    };

    if (role && role !== 'All' && Object.values(Role).includes(role)) {
        whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { 
        id: true,
        userId: true,
        name: true,
        role: true,
        mobile: true,
        email: true,
        upline: {
            select: {
                name: true,
                userId: true,
            },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error("Failed to fetch users by role:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

