import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, password, role } = body;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid User ID' }, { status: 401 });
    }

    // --- NEW LOGIC: Role-based password check ---

    // 1. If the user is an Admin, they MUST provide a correct password.
    if (user.role === 'Admin') {
      if (!password) {
        return NextResponse.json({ error: 'Password is required for Admin login' }, { status: 400 });
      }
      const isAdminPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isAdminPasswordCorrect) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    } 
    // 2. For all other roles, we only check if the role from the form matches their actual role.
    // This allows them to log in without a password.
    else {
      if (user.role !== role) {
        return NextResponse.json({ error: `This user is a ${user.role}, not a ${role}.` }, { status: 401 });
      }
    }

    // --- Token Generation (No changes needed here) ---
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({
        id: user.id,
        userId: user.userId,
        role: user.role,
        name: user.name,
        uplineId: user.uplineId,
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret);

    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    const { password: userPassword, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

