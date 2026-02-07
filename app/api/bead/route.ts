import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/bead 获取所有珠子实例及其类别，按sortOrder排序
export async function GET(req: NextRequest) {
  try {
    const beads = await prisma.bead.findMany({
      include: {
        category: true,
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });
    
    // 映射数据以匹配前端接口
    const mapped = beads.map((b: any) => ({
      id: b.id,
      name: b.name,
      image: b.image,
      size: b.size,
      price: b.price ?? 0,
      type: b.categoryId,
      categoryName: b.category?.name ?? '',
      dominantColor: b.dominantColor ?? undefined,
      sortOrder: b.sortOrder ?? 0  // 添加sortOrder字段
    }));
    return Response.json({ success: true, data: mapped });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// 新增珠子实例
export async function POST(req: NextRequest) {
  try {
    const { name, image, size, price, type, dominantColor } = await req.json();
    if (!name || !type || !size) return Response.json({ success: false, error: '缺少参数' }, { status: 400 });
    
    // 验证 image 是有效的 URL
    if (image && !isValidImageUrl(image)) {
      return Response.json({ success: false, error: '无效的图片 URL' }, { status: 400 });
    }
    
    const created = await prisma.bead.create({
      data: {
        name,
        image,
        size: parseFloat(size),
        price: price || 0,
        categoryId: type,
        dominantColor: dominantColor ?? null,
      },
    });
    
    return Response.json({ success: true, data: { id: created.id, name, image, size, price: price || 0, type, dominantColor } });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// Update bead instance
export async function PUT(req: NextRequest) {
  try {
    const { id, name, image, size, price, type, dominantColor } = await req.json();
    if (!id || !name || !type || !size) return Response.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    
    // Validate that image is a valid URL
    if (image && !isValidImageUrl(image)) {
      return Response.json({ success: false, error: 'Invalid image URL' }, { status: 400 });
    }
    
    // Update bead information, including its price
    const updated = await prisma.bead.update({
      where: { id },
      data: {
        name,
        image,
        size: parseFloat(size),
        price: price,
        categoryId: type,
        dominantColor: dominantColor ?? null,
      },
    });
    
    return Response.json({ success: true, data: { id: updated.id, name, image, size, price: price || 0, type, dominantColor } });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// Delete bead instance
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

// 辅助函数：验证图片 URL 是否有效
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // 检查是否是 Vercel Blob URL 或其他有效的图片 URL
    return (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') && 
           /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(parsedUrl.pathname);
  } catch {
    return false;
  }
}