import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 检查是否为受保护的路由，但排除认证相关路径
  if ((req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/my-orders'))
      && !req.nextUrl.pathname.includes('/auth/')) {
    // 如果用户未登录，允许请求继续，但不重定向
    // 这样页面可以自行处理未登录状态
    if (!token) {
      // 对于API请求，返回401
      if (req.nextUrl.pathname.startsWith('/api') && !req.nextUrl.pathname.includes('/auth/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // 对于页面请求，允许其继续到页面，让页面自己处理未登录状态
    }
    
    // 检查管理员权限（仅对admin路径）
    if (req.nextUrl.pathname.startsWith('/admin') && token) {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      if (adminEmail && token.email !== adminEmail) {
        // 对于admin API请求，返回403
        if (req.nextUrl.pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // 对于admin页面请求，重定向到主页
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/my-orders/:path*', // Protect all routes under /my-orders
    '/admin/:path*',     // Protect all routes under /admin
  ],
};