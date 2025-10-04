import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Role } from '@prisma/client';
export const dynamic = 'force-dynamic';
// Helper function to get user from token
async function getUserFromToken() {
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

// GET: Fetches a list of all users (Admin only)
export async function GET(request) {
  try {
    const user = await getUserFromToken();
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const users = await prisma.user.findMany({
      where: { role: { not: 'Admin' } },
      select: { id: true, name: true, userId: true, role: true, uplineId: true }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST: Creates a new user with detailed information
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name, role, uplineId, // uplineId from the form
      mobile, email, pan, aadhar, address, pincode, crops,
    } = body;

    // --- Basic Validation ---
    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required.' }, { status: 400 });
    }
    if (!Object.values(Role).includes(role)) {
        return NextResponse.json({ error: 'Invalid role provided.' }, { status: 400 });
    }

    // --- THIS IS THE DEFINITIVE FIX ---
    // We create a new variable to hold the final uplineId, removing any ambiguity.
    let finalUplineId = uplineId;

    // If a Franchise is being created, we MUST find the Admin and set them as the upline.
    // This overrides any value sent from the frontend.
    if (role === 'Franchise') {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'Admin' },
      });
      if (!adminUser) {
        return NextResponse.json({ error: 'System configuration error: Admin account not found.' }, { status: 500 });
      }
      finalUplineId = adminUser.id; // Set the Admin as the upline
    }
    // --- END OF FIX ---

    // --- Generate User ID and Password ---
    const rolePrefix = {
        Franchise: 'FRN', Distributor: 'DIS', SubDistributor: 'SUB', Dealer: 'DLR', Farmer: 'FRM',
    }[role] || 'USR';
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const userId = `${rolePrefix}${randomSuffix}`;
    const rawPassword = `${name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}${randomSuffix}`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // --- Create the New User in the Database ---
    const newUser = await prisma.user.create({
      data: {
        name, userId, password: hashedPassword, role, 
        uplineId: finalUplineId, // Use the definitive finalUplineId
        mobile, email, pan, aadhar, address, pincode,
        crops: crops || [],
      },
    });

    const { password, ...userToReturn } = newUser;
    return NextResponse.json({ ...userToReturn, rawPassword }, { status: 201 });

  } catch (error) {
    console.error("Failed to create user:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('userId')) {
        return NextResponse.json({ error: 'A user with this ID already exists. Please try again.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred while creating the user.' }, { status: 500 });
  }
}

