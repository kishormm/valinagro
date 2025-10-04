import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Role } from '@prisma/client'; // Import the Role enum from Prisma
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
 * A dynamic endpoint to fetch sales reports.
 * It can be filtered by time period and user role.
 * @param {URLSearchParams} request.nextUrl.searchParams
 * @param {string} [request.nextUrl.searchParams.timePeriod] - 'monthly' or 'halfYearly'
 * @param {string} [request.nextUrl.searchParams.role] - e.g., 'Franchise', 'Distributor'
 */
export async function GET(request) {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timePeriod = searchParams.get('timePeriod');
    const role = searchParams.get('role');

    // --- Build the dynamic query based on the filters provided ---
    const whereClause = {};

    // 1. Handle the time period filter
    if (timePeriod) {
      const now = new Date();
      if (timePeriod === 'monthly') {
        // Get records from the last month
        now.setMonth(now.getMonth() - 1);
        whereClause.createdAt = { gte: now };
      } else if (timePeriod === 'halfYearly') {
        // Get records from the last 6 months
        now.setMonth(now.getMonth() - 6);
        whereClause.createdAt = { gte: now };
      }
    }

    // 2. Handle the user role filter
    if (role && role !== 'All' && Object.values(Role).includes(role)) {
        // Filter by the role of the seller
        whereClause.seller = {
            role: role,
        };
    }

    // 3. Fetch the transaction data using the constructed 'where' clause
    const salesReport = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      // Include related data to make the report informative
      include: {
        product: { select: { name: true } },
        seller: { select: { name: true, role: true } },
        buyer: { select: { name: true, role: true } },
      },
    });

    return NextResponse.json(salesReport);

  } catch (error) {
    console.error("Failed to fetch sales report:", error);
    return NextResponse.json({ error: 'Failed to generate sales report.' }, { status: 500 });
  }
}

