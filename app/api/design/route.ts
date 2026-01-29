// POST /api/design 保存新设计
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ success: false, error: '未登录' }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ success: false, error: '用户不存在' }, { status: 404 });
    const body = await req.json();
    const { name, beads, circumference, thumb } = body;
    if (!Array.isArray(beads) || beads.length === 0) {
      return Response.json({ success: false, error: 'beads 不能为空' }, { status: 400 });
    }
    // 创建设计
    const design = await prisma.design.create({
      data: {
        name: name || `设计${Date.now()}`,
        userId: user.id,
        thumb: thumb || '',
        circumference: circumference || 0,
        beads: {
          create: beads.map((b: any, idx: number) => ({
            beadId: b.id,
            x: b.x ?? 0,
            y: b.y ?? 0,
            rotation: b.rotation ?? 0,
            order: idx,
          })),
        },
      },
    });
    return Response.json({ success: true, data: design });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}
// DELETE /api/design?id=xxx 删除设计
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ success: false, error: '未登录' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ success: false, error: '缺少设计id' }, { status: 400 });
  try {
    // 校验设计归属
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ success: false, error: '用户不存在' }, { status: 404 });
    const design = await prisma.design.findUnique({ where: { id } });
    if (!design || design.userId !== user.id) {
      return Response.json({ success: false, error: '无权删除该设计' }, { status: 403 });
    }
    // 先删子表
    await prisma.designBead.deleteMany({ where: { designId: id } });
    // 再删主表
    await prisma.design.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/design 获取当前用户的所有设计
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ success: false, error: '未登录' }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return Response.json({ success: false, error: '用户不存在' }, { status: 404 });
    const designs = await prisma.design.findMany({
      where: { userId: user.id },
      include: {
        beads: { include: { bead: { include: { category: true, material: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    // 保证 beads 字段结构完整，补全 instanceId、price、image、type 等
    const mapped = designs.map(design => ({
      ...design,
      beads: design.beads.map((db, idx) => ({
        // instanceId: 用 DesignBead 的 id 保证唯一
        instanceId: db.id,
        id: db.bead.id,
        name: db.bead.name,
        image: db.bead.image,
        type: db.bead.categoryId,
        size: db.bead.size,
        price: db.bead.material?.price ?? 0,
        dominantColor: undefined,
        x: db.x ?? 0,
        y: db.y ?? 0,
        rotation: db.rotation ?? 0,
        order: db.order ?? idx,
      })),
    }));
    return Response.json({ success: true, data: mapped });
  } catch (e) {
    return Response.json({ success: false, error: String(e) }, { status: 500 });
  }
}
