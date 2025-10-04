import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // ✅ Allow GET requests to /api/products (public)
  if (
    pathname.startsWith('/api/products') &&
    method === 'GET'
  ) {
    return NextResponse.next();
  }

  // 🔒 All other matched routes require authentication
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    // Pass the user payload through headers if needed
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-Payload', JSON.stringify(payload));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// ✅ Config: still match all your API routes
export const config = {
  matcher: [
    '/api/auth/me',
    '/api/products',          // still matched, but GET is allowed by code above
    '/api/products/:path*',  
    '/api/sales',
    '/api/sales/:path*',
    '/api/users',
    '/api/users/:path*',
  ],
};
