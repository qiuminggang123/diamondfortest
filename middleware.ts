import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 需要保护的路由前缀
const protectedRoutes = ['/admin', '/my-designs', '/address'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // 只拦截受保护路由
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('login', '1');
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/my-designs/:path*', '/address/:path*'],
};
