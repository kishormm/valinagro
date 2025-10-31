import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { put } from '@vercel/blob'; // Correct Import for Vercel Blob
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

export async function POST(request, { params }) {
  try {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { transactionId } = params;
    
    // 1. Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }

    // 2. Security Check: Ensure the logged-in user is the BUYER
    if (transaction.buyerId !== loggedInUser.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Check if proof is already uploaded
    if (transaction.paymentProofUrl) {
         return NextResponse.json({ error: 'Payment proof has already been uploaded.' }, { status: 400 });
    }

    // 4. Handle the file upload from the form
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // 5. Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      // Organize files by transaction ID
      pathname: `payment_proofs/${transactionId}-${file.name}`, 
    });

    // 6. Update the transaction with the Vercel Blob URL
    await prisma.transaction.update({
        where: { id: transactionId },
        data: {
            paymentProofUrl: blob.url, // Save the public URL
        },
    });

    return NextResponse.json({ message: 'Proof uploaded successfully!', url: blob.url });

  } catch (error) {
    console.error("Failed to upload proof:", error);
    // Check if the error is from Vercel Blob (e.g., token missing)
    if (error.message.includes('BLOB_READ_WRITE_TOKEN')) {
        return NextResponse.json({ error: 'File storage is not configured correctly.' }, { status: 500 });
    }
    return NextResponse.json({ error: error.message || 'Failed to upload proof.' }, { status: 500 });
  }
}