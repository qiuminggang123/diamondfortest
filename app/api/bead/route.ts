import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';


// GET /api/bead 获取所有珠子及其类别、材质
export async function GET(req: NextRequest) {
  try {
    const beads = await prisma.bead.findMany({
      include: {
        category: true,
        material: true,
      },
    });
    // 增加 type 字段，兼容前端 BeadType
    const mapped = beads.map(b => ({
      id: b.id,
      name: b.name,
      image: b.image,
      size: b.size,
      price: b.material?.price ?? 0,
      type: b.categoryId,
      categoryName: b.category?.name ?? '',
      dominantColor: b.dominantColor ?? undefined,
    }));
    return Response.json({ success: true, data: mapped });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// 新增珠子
export async function POST(req: NextRequest) {
  try {
    const { name, image, size, price, type, dominantColor } = await req.json();
    if (!name || !type || !size) return Response.json({ success: false, error: '缺少参数' }, { status: 400 });
    // 需指定材质，暂用默认材质
    const material = await prisma.beadMaterial.findFirst();
    if (!material) return Response.json({ success: false, error: '缺少材质' }, { status: 400 });
    const created = await prisma.bead.create({
      data: {
        name,
        image,
        size,
        categoryId: type,
        materialId: material.id,
        dominantColor: dominantColor ?? null,
      },
    });
    return Response.json({ success: true, data: { id: created.id } });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// 修改珠子
export async function PUT(req: NextRequest) {
  try {
    const { id, name, image, size, price, type, dominantColor } = await req.json();
    if (!id || !name || !type || !size) return Response.json({ success: false, error: '缺少参数' }, { status: 400 });
    // 需指定材质，暂用默认材质
    const material = await prisma.beadMaterial.findFirst();
    if (!material) return Response.json({ success: false, error: '缺少材质' }, { status: 400 });
    const updated = await prisma.bead.update({
      where: { id },
      data: {
        name,
        image,
        size,
        categoryId: type,
        materialId: material.id,
        dominantColor: dominantColor ?? null,
      },
    });
    return Response.json({ success: true, data: { id: updated.id } });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// 删除珠子
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return Response.json({ success: false, error: '缺少id' }, { status: 400 });
    await prisma.bead.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}
