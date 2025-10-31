import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
export const dynamic = 'force-dynamic';

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

export async function POST(request, { params }) {
  try {
    const loggedInUser = await getLoggedInUser();
    
    // Security Check: Only Admin can do this
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { userId } = params;

    const userToUpdate = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Only non-admin and non-farmer roles need membership
    if (userToUpdate.role === 'Admin' || userToUpdate.role === 'Farmer') {
        return NextResponse.json({ error: 'This user role does not require membership.' }, { status: 400 });
    }

    if (userToUpdate.isMember) {
        return NextResponse.json({ error: 'This user is already a member.' }, { status: 400 });
    }
    
    // Grant membership
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isMember: true,
      },
    });

    return NextResponse.json({ message: 'Membership granted successfully!', user: updatedUser });

  } catch (error) {
    console.error("Failed to grant membership:", error);
    return NextResponse.json({ error: 'Failed to grant membership.' }, { status: 500 });
  }
}