import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    // --- Basic Validation ---
    if (!userId || !password) {
        return NextResponse.json({ error: 'User ID and password are required' }, { status: 400 });
    }

    // --- 1. Find the user by their unique User ID ---
    const user = await prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      // Use a generic error message for security
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // --- 2. Securely compare the provided password with the hashed one in the database ---
    // This works for ALL users, including the Admin.
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // --- 3. If credentials are correct, generate and set the auth token ---
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

    // --- 4. Return the user's data (without the password) so the frontend can redirect ---
    const { password: userPassword, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}

