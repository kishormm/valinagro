import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

// Helper function to get the logged-in user from their session token
async function getLoggedInUser() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload; // Contains user's id, userId, role, etc.
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // 1. Securely identify the user from their session token.
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmNewPassword } = await request.json();

    // 2. Perform essential validation.
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return NextResponse.json({ error: 'All password fields are required.' }, { status: 400 });
    }
    if (newPassword !== confirmNewPassword) {
      return NextResponse.json({ error: 'New passwords do not match.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    // 3. Fetch the full user record from the database to get their current hashed password.
    const userFromDb = await prisma.user.findUnique({
      where: { id: loggedInUser.id },
    });

    if (!userFromDb) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // 4. Verify that the provided "current password" is correct.
    const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, userFromDb.password);
    if (!isCurrentPasswordCorrect) {
      return NextResponse.json({ error: 'Incorrect current password.' }, { status: 401 });
    }

    // 5. If everything is correct, hash the new password and update the user's record.
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: loggedInUser.id },
      data: {
        password: hashedNewPassword,
      },
    });

    return NextResponse.json({ message: 'Password updated successfully.' }, { status: 200 });

  } catch (error) {
    console.error("Failed to change password:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
