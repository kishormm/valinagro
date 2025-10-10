import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Role } from '@prisma/client'; // Keep this import
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

export async function GET(request) {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timePeriod = searchParams.get('timePeriod');
    const role = searchParams.get('role');
    const startDate = searchParams.get('startDate'); // NEW
    const endDate = searchParams.get('endDate');     // NEW

    const whereClause = {};

    // --- DATE FILTER LOGIC ---
    let dateFilter = {};
    if (timePeriod) {
        const now = new Date();
        if (timePeriod === 'monthly') {
            now.setMonth(now.getMonth() - 1);
            dateFilter.gte = now;
        } else if (timePeriod === 'halfYearly') {
            now.setMonth(now.getMonth() - 6);
            dateFilter.gte = now;
        }
    }

    // NEW: If a custom date range is provided, it overrides the timePeriod tabs
    if (startDate && endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999); // Ensures the entire end day is included
        dateFilter = {
            gte: new Date(startDate),
            lte: endOfDay,
        };
    }

    // Add the constructed date filter to the main where clause if it's not empty
    if (Object.keys(dateFilter).length > 0) {
        whereClause.createdAt = dateFilter;
    }
    // --- END OF DATE FILTER LOGIC ---


    // Handle the user role filter
    if (role && role !== 'All' && Object.values(Role).includes(role)) {
      // This filter now correctly checks if the role matches EITHER the seller OR the buyer
      whereClause.OR = [
        { seller: { role: role } },
        { buyer: { role: role } }
      ];
    }

    const salesReport = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
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