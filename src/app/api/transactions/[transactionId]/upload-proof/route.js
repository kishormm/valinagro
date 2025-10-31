import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Note: We use the SERVICE_ROLE_KEY here for backend operations (like uploading)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // 4. Handle the file upload
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // 5. Upload to Supabase Storage
    const fileExtension = file.name.split('.').pop();
    const fileName = `${transactionId}-${Date.now()}.${fileExtension}`;
    const filePath = `${fileName}`; // We are storing it in the root of the 'payment_proofs' bucket

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      throw new Error('Failed to upload file to storage.');
    }

    // 6. Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for the file.');
    }
    const publicUrl = urlData.publicUrl;

    // 7. Update the transaction with the Supabase public URL
    await prisma.transaction.update({
        where: { id: transactionId },
        data: {
            paymentProofUrl: publicUrl, // Save the public URL
        },
    });

    return NextResponse.json({ message: 'Proof uploaded successfully!', url: publicUrl });

  } catch (error) {
    console.error("Failed to upload proof:", error);
    return NextResponse.json({ error: error.message || 'Failed to upload proof.' }, { status: 500 });
  }
}