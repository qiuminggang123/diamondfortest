import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/design - 获取当前用户的设计
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const designs = await prisma.design.findMany({
      where: { userId: session.user.id },
      include: {
        beads: {
          include: {
            bead: true // 包含珠子详情
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 重新格式化数据，使其符合前端期望的结构
    const formatted = designs.map(d => ({
      id: d.id,
      name: d.name,
      userId: d.userId,
      beads: d.beads.map(db => ({
        id: db.beadId,
        name: db.bead.name,
        image: db.bead.image,
        size: db.bead.size,
        price: db.bead.price,  // 使用珠子的直接价格
        type: db.bead.categoryId,
        x: db.x,
        y: db.y,
        rotation: db.rotation,
      })),
      circumference: d.circumference,
      thumb: d.thumb,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    }));

    return Response.json({ success: true, data: formatted });
  } catch (e) {
    console.error('获取设计失败:', e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// POST /api/design - 保存设计
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const { name, beads, circumference, thumb } = await req.json();

    if (!name || !Array.isArray(beads)) {
      return Response.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    // 创建设计
    const design = await prisma.design.create({
      data: {
        name,
        userId: session.user.id,
        circumference,
        thumb: thumb || null,
      }
    });

    // 批量添加珠子到设计中
    if (beads.length > 0) {
      const designBeadsData = beads.map((b, index) => ({
        designId: design.id,
        beadId: b.id,
        x: b.x,
        y: b.y,
        rotation: b.rotation,
        order: index
      }));

      await prisma.designBead.createMany({
        data: designBeadsData
      });
    }

    // 重新获取设计以返回完整数据
    const fullDesign = await prisma.design.findUnique({
      where: { id: design.id },
      include: {
        beads: {
          include: {
            bead: true
          }
        }
      }
    });

    // 重新格式化数据
    const formatted = {
      id: fullDesign!.id,
      name: fullDesign!.name,
      userId: fullDesign!.userId,
      beads: fullDesign!.beads.map(db => ({
        id: db.beadId,
        name: db.bead.name,
        image: db.bead.image,
        size: db.bead.size,
        price: db.bead.price,  // 使用珠子的直接价格
        type: db.bead.categoryId,
        x: db.x,
        y: db.y,
        rotation: db.rotation,
      })),
      circumference: fullDesign!.circumference,
      thumb: fullDesign!.thumb,
      createdAt: fullDesign!.createdAt,
      updatedAt: fullDesign!.updatedAt
    };

    return Response.json({ success: true, data: formatted });
  } catch (e) {
    console.error('保存设计失败:', e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// PUT /api/design - 更新设计
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const { id, name, beads, circumference, thumb } = await req.json();

    if (!id) {
      return Response.json({ success: false, error: '缺少设计ID' }, { status: 400 });
    }

    // 更新设计基本信息
    await prisma.design.update({
      where: { id, userId: session.user.id },
      data: {
        name,
        circumference,
        thumb: thumb || null,
      }
    });

    // 删除现有的设计珠子
    await prisma.designBead.deleteMany({ where: { designId: id } });

    // 重新添加珠子到设计中
    if (beads && beads.length > 0) {
      const designBeadsData = beads.map((b, index) => ({
        designId: id,
        beadId: b.id,
        x: b.x,
        y: b.y,
        rotation: b.rotation,
        order: index
      }));

      await prisma.designBead.createMany({
        data: designBeadsData
      });
    }

    // 重新获取设计以返回完整数据
    const fullDesign = await prisma.design.findUnique({
      where: { id },
      include: {
        beads: {
          include: {
            bead: true
          }
        }
      }
    });

    // 重新格式化数据
    const formatted = {
      id: fullDesign!.id,
      name: fullDesign!.name,
      userId: fullDesign!.userId,
      beads: fullDesign!.beads.map(db => ({
        id: db.beadId,
        name: db.bead.name,
        image: db.bead.image,
        size: db.bead.size,
        price: db.bead.price,  // 使用珠子的直接价格
        type: db.bead.categoryId,
        x: db.x,
        y: db.y,
        rotation: db.rotation,
      })),
      circumference: fullDesign!.circumference,
      thumb: fullDesign!.thumb,
      createdAt: fullDesign!.createdAt,
      updatedAt: fullDesign!.updatedAt
    };

    return Response.json({ success: true, data: formatted });
  } catch (e) {
    console.error('更新设计失败:', e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}

// DELETE /api/design - 删除设计
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return Response.json({ success: false, error: '缺少设计ID' }, { status: 400 });
    }

    // 删除设计（关联的designBeads会通过onDelete: Cascade自动删除）
    await prisma.design.delete({
      where: { id, userId: session.user.id }
    });

    return Response.json({ success: true });
  } catch (e) {
    console.error('删除设计失败:', e);
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}