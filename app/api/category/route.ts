import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/category 获取所有珠子类别
export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.beadCategory.findMany();
    // 兼容前端结构，id/name
    const mapped = categories.map(c => ({ id: c.id, name: c.name }));
    return Response.json({ success: true, data: mapped });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}


// 新增类别
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return Response.json({ success: false, error: '缺少分类名称' }, { status: 400 });
    const created = await prisma.beadCategory.create({ data: { name } });
    return Response.json({ success: true, data: { id: created.id, name: created.name } });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// Update category
export async function PUT(req: NextRequest) {
  try {
    const { id, name } = await req.json();
    if (!id || !name) return Response.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    const updated = await prisma.beadCategory.update({ where: { id }, data: { name } });
    return Response.json({ success: true, data: { id: updated.id, name: updated.name } });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// Delete category
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ success: false, error: 'Missing id' }, { status: 400 });
    await prisma.beadCategory.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}
