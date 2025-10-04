import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// This line ensures the API always fetches fresh data from the database.
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { userId } = params;

  try {
    const allUsers = await prisma.user.findMany({
      select: { id: true, userId: true, name: true, role: true, uplineId: true },
    });

    const userMap = new Map(allUsers.map(user => [user.id, { ...user, children: [] }]));

    allUsers.forEach(user => {
      if (user.uplineId) {
        const parent = userMap.get(user.uplineId);
        if (parent) {
          parent.children.push(userMap.get(user.id));
        }
      }
    });

    // --- THIS IS THE FIX ---
    // We now have two ways to find the starting user for the hierarchy.
    let rootUserInDb;

    // 1. If the request is for the 'admin', we find the user by their ROLE.
    // This is robust and doesn't depend on a hardcoded ID.
    if (userId.toLowerCase() === 'admin') {
      rootUserInDb = allUsers.find(u => u.role === 'Admin');
    } 
    // 2. Otherwise, we find the user by their specific userId as before.
    else {
      rootUserInDb = allUsers.find(u => u.userId.toLowerCase() === userId.toLowerCase());
    }
    
    if (!rootUserInDb) {
      return NextResponse.json({ error: 'Starting user for hierarchy not found' }, { status: 404 });
    }
    
    const hierarchyData = userMap.get(rootUserInDb.id);
    
    return NextResponse.json(hierarchyData);

  } catch (error) {
    console.error("Failed to fetch hierarchy:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

