import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories 获取所有珠子类别（兼容路由）
export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.beadCategory.findMany();
    // 兼容前端结构，id/name
    const mapped = categories.map(c => ({ id: c.id, name: c.name }));
    return Response.json(mapped);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

// 其他HTTP方法可以按需添加